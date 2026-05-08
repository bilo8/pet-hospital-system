const express = require("express");
const db = require("../db");
const { verifyToken, allowRoles } = require("../middleware/authMiddleware");
const { createNotification } = require("../utils/notificationService");

const router = express.Router();

// Admin/Receptionist: create video consultation
router.post(
  "/",
  verifyToken,
  allowRoles("ADMIN", "RECEPTIONIST"),
  (req, res) => {
    const { appointment_id, meeting_link } = req.body;

    db.query(
      `INSERT INTO video_consultations 
      (appointment_id, meeting_link, status)
      VALUES (?, ?, 'Scheduled')`,
      [appointment_id, meeting_link],
      (err, result) => {
        if (err) {
          return res.status(500).json({
            message: "Video consultation creation failed",
            error: err.message,
          });
        }

        const notifySql = `
  SELECT users.id AS client_user_id, pets.name AS pet_name
  FROM appointments
  JOIN pets ON appointments.pet_id = pets.id
  JOIN clients ON pets.client_id = clients.id
  JOIN users ON clients.user_id = users.id
  WHERE appointments.id = ?
`;

        db.query(notifySql, [appointment_id], async (notifyErr, rows) => {
          if (!notifyErr && rows.length > 0) {
            await createNotification({
              userId: rows[0].client_user_id,
              title: "Video Consultation Created",
              message: `A video consultation was created for ${rows[0].pet_name}.`,
            });
          }

          res.status(201).json({
            message: "Video consultation created successfully",
            consultationId: result.insertId,
          });
        });
      }
    );
  }
);

// View video consultations by role
router.get("/", verifyToken, (req, res) => {
  let sql = `
    SELECT
      video_consultations.id,
      video_consultations.meeting_link,
      video_consultations.status,
      video_consultations.created_at,
      appointments.appointment_date,
      appointments.reason,
      pets.name AS pet_name,
      users_client.full_name AS client_name,
      users_doctor.full_name AS doctor_name
    FROM video_consultations
    JOIN appointments ON video_consultations.appointment_id = appointments.id
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
      return res.status(500).json({
        message: "Database error",
        error: err.message,
      });
    }

    res.json(results);
  });
});

// Admin/Receptionist: update video consultation status
router.put(
  "/:id/status",
  verifyToken,
  allowRoles("ADMIN", "RECEPTIONIST"),
  (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    db.query(
      "UPDATE video_consultations SET status = ? WHERE id = ?",
      [status, id],
      (err) => {
        if (err) {
          return res.status(500).json({
            message: "Video consultation status update failed",
            error: err.message,
          });
        }

        const notifySql = `
          SELECT users.id AS client_user_id, pets.name AS pet_name
          FROM video_consultations
          JOIN appointments ON video_consultations.appointment_id = appointments.id
          JOIN pets ON appointments.pet_id = pets.id
          JOIN clients ON pets.client_id = clients.id
          JOIN users ON clients.user_id = users.id
          WHERE video_consultations.id = ?
        `;

        db.query(notifySql, [id], async (notifyErr, rows) => {
          if (!notifyErr && rows.length > 0) {
            await createNotification({
              userId: rows[0].client_user_id,
              title: "Video Consultation Updated",
              message: `The video consultation for ${rows[0].pet_name} is now ${status}.`,
            });
          }

          res.json({
            message: "Video consultation status updated successfully",
          });
        });
      }
    );
  }
);

// Admin/Receptionist: delete video consultation
router.delete(
  "/:id",
  verifyToken,
  allowRoles("ADMIN", "RECEPTIONIST"),
  (req, res) => {
    const { id } = req.params;

    db.query("DELETE FROM video_consultations WHERE id = ?", [id], (err) => {
      if (err) {
        return res.status(500).json({
          message: "Video consultation delete failed",
          error: err.message,
        });
      }

      res.json({
        message: "Video consultation deleted successfully",
      });
    });
  }
);

module.exports = router;