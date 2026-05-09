const express = require("express");
const db = require("../db");
const { verifyToken, allowRoles } = require("../middleware/authMiddleware");

const router = express.Router();

// Admin: add doctor availability
router.post(
    "/",
    verifyToken,
    allowRoles("ADMIN"),
    (req, res) => {
        const { doctor_id, day_of_week, start_time, end_time } = req.body;

        const sql = `
      INSERT INTO doctor_availability
      (doctor_id, day_of_week, start_time, end_time)
      VALUES (?, ?, ?, ?)
    `;

        db.query(sql, [doctor_id, day_of_week, start_time, end_time], (err, result) => {
            if (err) {
                return res.status(500).json({
                    message: "Availability creation failed",
                    error: err.message,
                });
            }

            res.status(201).json({
                message: "Availability added successfully",
                availabilityId: result.insertId,
            });
        });
    }
);

// Admin/Doctor/Receptionist/Client: view availability
router.get("/", verifyToken, (req, res) => {
    let sql = `
    SELECT
      doctor_availability.id,
      doctor_availability.doctor_id,
      doctor_availability.day_of_week,
      doctor_availability.start_time,
      doctor_availability.end_time,
      users.full_name AS doctor_name,
      doctors.specialization
    FROM doctor_availability
    JOIN doctors ON doctor_availability.doctor_id = doctors.id
    JOIN users ON doctors.user_id = users.id
  `;

    const params = [];

    if (req.user.role === "DOCTOR") {
        sql += " WHERE doctors.user_id = ?";
        params.push(req.user.id);
    }

    sql += `
    ORDER BY
      FIELD(day_of_week, 'Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'),
      start_time
  `;

    db.query(sql, params, (err, results) => {
        if (err) {
            return res.status(500).json({
                message: "Availability loading failed",
                error: err.message,
            });
        }

        res.json(results);
    });
});

// Admin: update availability
router.put(
    "/:id",
    verifyToken,
    allowRoles("ADMIN"),
    (req, res) => {
        const { id } = req.params;
        const { doctor_id, day_of_week, start_time, end_time } = req.body;

        const sql = `
      UPDATE doctor_availability
      SET doctor_id = ?, day_of_week = ?, start_time = ?, end_time = ?
      WHERE id = ?
    `;

        db.query(sql, [doctor_id, day_of_week, start_time, end_time, id], (err) => {
            if (err) {
                return res.status(500).json({
                    message: "Availability update failed",
                    error: err.message,
                });
            }

            res.json({
                message: "Availability updated successfully",
            });
        });
    }
);

// Admin: delete availability
router.delete(
    "/:id",
    verifyToken,
    allowRoles("ADMIN"),
    (req, res) => {
        const { id } = req.params;

        db.query("DELETE FROM doctor_availability WHERE id = ?", [id], (err) => {
            if (err) {
                return res.status(500).json({
                    message: "Availability deletion failed",
                    error: err.message,
                });
            }

            res.json({
                message: "Availability deleted successfully",
            });
        });
    }
);

// Client/Receptionist/Admin: get available slots for doctor on a date
router.get("/slots", verifyToken, (req, res) => {
    const { doctor_id, date } = req.query;

    if (!doctor_id || !date) {
        return res.status(400).json({
            message: "doctor_id and date are required",
        });
    }

    const dayNames = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
    ];

    const dayOfWeek = dayNames[new Date(date).getDay()];

    const availabilitySql = `
    SELECT start_time, end_time
    FROM doctor_availability
    WHERE doctor_id = ?
    AND day_of_week = ?
  `;

    db.query(availabilitySql, [doctor_id, dayOfWeek], (err, availabilityRows) => {
        if (err) {
            return res.status(500).json({
                message: "Availability lookup failed",
                error: err.message,
            });
        }

        if (availabilityRows.length === 0) {
            return res.json([]);
        }

        const appointmentsSql = `
      SELECT appointment_date
      FROM appointments
      WHERE doctor_id = ?
      AND DATE(appointment_date) = ?
      AND status != 'Cancelled'
    `;

        db.query(appointmentsSql, [doctor_id, date], (err, appointmentRows) => {
            if (err) {
                return res.status(500).json({
                    message: "Appointments lookup failed",
                    error: err.message,
                });
            }

            const bookedTimes = appointmentRows.map((a) =>
                new Date(a.appointment_date).toTimeString().slice(0, 5)
            );

            const slots = [];

            availabilityRows.forEach((availability) => {
                let current = availability.start_time.slice(0, 5);
                const end = availability.end_time.slice(0, 5);

                while (current < end) {
                    if (!bookedTimes.includes(current)) {
                        slots.push(current);
                    }

                    const [hour, minute] = current.split(":").map(Number);
                    const nextDate = new Date(2000, 0, 1, hour, minute + 60);
                    current = nextDate.toTimeString().slice(0, 5);
                }
            });

            res.json(slots);
        });
    });
});

module.exports = router;