const express = require("express");
const db = require("../db");
const { verifyToken, allowRoles } = require("../middleware/authMiddleware");
const { createNotification } = require("../utils/notificationService");

const router = express.Router();


// Get available slots for a doctor on a selected date
router.get("/available-slots", verifyToken, (req, res) => {
  const { doctor_id, date } = req.query;

  if (!doctor_id || !date) {
    return res.status(400).json({
      message: "doctor_id and date are required",
    });
  }

  const allSlots = [
    "09:00:00",
    "10:00:00",
    "11:00:00",
    "12:00:00",
    "13:00:00",
    "14:00:00",
    "15:00:00",
    "16:00:00",
  ];

  const sql = `
    SELECT TIME(appointment_date) AS time
    FROM appointments
    WHERE doctor_id = ?
    AND DATE(appointment_date) = ?
    AND status != 'Cancelled'
  `;

  db.query(sql, [doctor_id, date], (err, results) => {
    if (err) {
      return res.status(500).json({
        message: "Database error",
        error: err.message,
      });
    }

    const bookedSlots = results.map((row) => row.time);
    const availableSlots = allSlots.filter((slot) => !bookedSlots.includes(slot));

    res.json(availableSlots);
  });
});


/*
  Admin/Receptionist: create appointment
  Client: create appointment for own pet
*/
router.post(
  "/",
  verifyToken,
  allowRoles("ADMIN", "RECEPTIONIST", "CLIENT"),
  (req, res) => {
    const { pet_id, doctor_id, appointment_date, reason } = req.body;

    const insertAppointment = () => {
      const appointmentDate = new Date(appointment_date);

      const dayNames = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];

      const dayOfWeek = dayNames[appointmentDate.getDay()];

      const appointmentTime = appointmentDate.toTimeString().slice(0, 5);

      // Check doctor availability schedule
      const availabilitySql = `
    SELECT *
    FROM doctor_availability
    WHERE doctor_id = ?
    AND day_of_week = ?
    AND start_time <= ?
    AND end_time > ?
  `;

      db.query(
        availabilitySql,
        [doctor_id, dayOfWeek, appointmentTime, appointmentTime],
        (availabilityErr, availabilityRows) => {
          if (availabilityErr) {
            return res.status(500).json({
              message: "Availability validation failed",
              error: availabilityErr.message,
            });
          }

          if (availabilityRows.length === 0) {
            return res.status(400).json({
              message: "Doctor is not available at this time",
            });
          }

          // Check overlapping appointments
          const checkSql = `
        SELECT id
        FROM appointments
        WHERE doctor_id = ?
        AND appointment_date = ?
        AND status != 'Cancelled'
      `;

          db.query(
            checkSql,
            [doctor_id, appointment_date],
            (checkErr, existing) => {
              if (checkErr) {
                return res.status(500).json({
                  message: "Database error",
                });
              }

              if (existing.length > 0) {
                return res.status(400).json({
                  message: "This appointment slot is already booked",
                });
              }

              // Create appointment
              db.query(
                `
              INSERT INTO appointments
              (pet_id, doctor_id, appointment_date, reason, status)
              VALUES (?, ?, ?, ?, 'Pending')
            `,
                [pet_id, doctor_id, appointment_date, reason],
                (err, result) => {
                  if (err) {
                    return res.status(500).json({
                      message: "Appointment creation failed",
                      error: err.message,
                    });
                  }

                  res.status(201).json({
                    message: "Appointment created successfully",
                    appointmentId: result.insertId,
                  });
                }
              );
            }
          );
        }
      );
    };
    if (req.user.role === "CLIENT") {
      const checkSql = `
        SELECT pets.id
        FROM pets
        JOIN clients ON pets.client_id = clients.id
        WHERE pets.id = ? AND clients.user_id = ?
      `;

      db.query(checkSql, [pet_id, req.user.id], (checkErr, results) => {
        if (checkErr) {
          return res.status(500).json({ message: "Database error" });
        }

        if (results.length === 0) {
          return res
            .status(403)
            .json({
              message: "You can only book appointments for your own pet",
            });
        }

        insertAppointment();
      });
    } else {
      insertAppointment();
    }
  },
);

/*
  Admin/Receptionist: view all appointments
  Doctor: view assigned appointments
  Client: view own appointments
*/
router.get("/", verifyToken, (req, res) => {
  let sql = `
    SELECT 
      appointments.id,
      appointments.appointment_date,
      appointments.reason,
      appointments.status,
      pets.name AS pet_name,
      pets.type AS pet_type,
      users_client.full_name AS client_name,
      users_doctor.full_name AS doctor_name
    FROM appointments
    JOIN pets ON appointments.pet_id = pets.id
    JOIN clients ON pets.client_id = clients.id
    JOIN users AS users_client ON clients.user_id = users_client.id
    JOIN doctors ON appointments.doctor_id = doctors.id
    JOIN users AS users_doctor ON doctors.user_id = users_doctor.id
  `;

  const params = [];

  if (req.user.role === "DOCTOR") {
    sql += " WHERE doctors.user_id = ?";
    params.push(req.user.id);
  }

  if (req.user.role === "CLIENT") {
    sql += " WHERE clients.user_id = ?";
    params.push(req.user.id);
  }

  sql += " ORDER BY appointments.appointment_date DESC";

  db.query(sql, params, (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Database error" });
    }

    res.json(results);
  });
});

/*
  Admin/Receptionist: update appointment status
*/
router.put(
  "/:id/status",
  verifyToken,
  allowRoles("ADMIN", "RECEPTIONIST"),
  (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    db.query(
      "UPDATE appointments SET status = ? WHERE id = ?",
      [status, id],
      (err) => {
        if (err) {
          return res.status(500).json({ message: "Status update failed" });
        }

        const notifySql = `
            SELECT users.id AS client_user_id, pets.name AS pet_name
            FROM appointments
            JOIN pets ON appointments.pet_id = pets.id
            JOIN clients ON pets.client_id = clients.id
            JOIN users ON clients.user_id = users.id
            WHERE appointments.id = ?
          `;

        db.query(notifySql, [id], async (notifyErr, rows) => {
          if (!notifyErr && rows.length > 0) {
            await createNotification({
              userId: rows[0].client_user_id,
              title: "Appointment Updated",
              message: `Your appointment for ${rows[0].pet_name} is now ${status}.`,
            });
          }

          res.json({ message: "Appointment status updated successfully" });
        });
      },
    );
  },
);

/*
  Admin/Receptionist: delete appointment
*/
router.delete(
  "/:id",
  verifyToken,
  allowRoles("ADMIN", "RECEPTIONIST"),
  (req, res) => {
    const { id } = req.params;

    db.query("DELETE FROM appointments WHERE id = ?", [id], (err) => {
      if (err) {
        return res.status(500).json({ message: "Appointment delete failed" });
      }

      res.json({ message: "Appointment deleted successfully" });
    });
  },
);

module.exports = router;
