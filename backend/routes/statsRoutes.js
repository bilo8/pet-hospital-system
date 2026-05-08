const express = require("express");
const db = require("../db");
const { verifyToken, allowRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/admin",
  verifyToken,
  allowRoles("ADMIN", "RECEPTIONIST"),
  (req, res) => {
    const stats = {};

    db.query("SELECT COUNT(*) AS total FROM users", (err, users) => {
      if (err) return res.status(500).json({ message: "Database error" });
      stats.users = users[0].total;

      db.query("SELECT COUNT(*) AS total FROM clients", (err, clients) => {
        if (err) return res.status(500).json({ message: "Database error" });
        stats.clients = clients[0].total;

        db.query("SELECT COUNT(*) AS total FROM pets", (err, pets) => {
          if (err) return res.status(500).json({ message: "Database error" });
          stats.pets = pets[0].total;

          db.query("SELECT COUNT(*) AS total FROM appointments", (err, appointments) => {
            if (err) return res.status(500).json({ message: "Database error" });
            stats.appointments = appointments[0].total;

            db.query("SELECT COUNT(*) AS total FROM bills WHERE status = 'Unpaid'", (err, bills) => {
              if (err) return res.status(500).json({ message: "Database error" });
              stats.unpaidBills = bills[0].total;

              res.json(stats);
            });
          });
        });
      });
    });
  }
);
router.get(
  "/admin/charts",
  verifyToken,
  allowRoles("ADMIN"),
  (req, res) => {
    const data = {};

    db.query(
      `SELECT status, COUNT(*) AS count 
       FROM appointments 
       GROUP BY status`,
      (err, appointmentStatus) => {
        if (err) {
          return res.status(500).json({ message: "Appointments chart failed" });
        }

        data.appointmentStatus = appointmentStatus;

        db.query(
          `SELECT status, COUNT(*) AS count 
           FROM bills 
           GROUP BY status`,
          (err, billStatus) => {
            if (err) {
              return res.status(500).json({ message: "Bills chart failed" });
            }

            data.billStatus = billStatus;

            db.query(
              `SELECT type, COUNT(*) AS count 
               FROM pets 
               GROUP BY type`,
              (err, petTypes) => {
                if (err) {
                  return res.status(500).json({ message: "Pet types chart failed" });
                }

                data.petTypes = petTypes;

                db.query(
                  `SELECT users.full_name AS doctor_name, COUNT(appointments.id) AS count
                   FROM doctors
                   JOIN users ON doctors.user_id = users.id
                   LEFT JOIN appointments ON appointments.doctor_id = doctors.id
                   GROUP BY doctors.id, users.full_name`,
                  (err, doctorWorkload) => {
                    if (err) {
                      return res.status(500).json({
                        message: "Doctor workload chart failed",
                      });
                    }

                    data.doctorWorkload = doctorWorkload;

                    res.json(data);
                  }
                );
              }
            );
          }
        );
      }
    );
  }
);

router.get(
  "/receptionist",
  verifyToken,
  allowRoles("RECEPTIONIST", "ADMIN"),
  (req, res) => {
    const data = {};

    db.query(
      "SELECT COUNT(*) AS count FROM temporary_registrations WHERE status = 'Pending'",
      (err, tempResults) => {
        if (err) {
          return res.status(500).json({ message: "Temporary registrations stats failed" });
        }

        data.pendingRegistrations = tempResults[0].count;

        db.query(
          "SELECT COUNT(*) AS count FROM appointments WHERE DATE(appointment_date) = CURDATE()",
          (err, todayResults) => {
            if (err) {
              return res.status(500).json({ message: "Today appointments stats failed" });
            }

            data.todayAppointments = todayResults[0].count;

            db.query(
              "SELECT COUNT(*) AS count FROM bills WHERE status = 'Unpaid'",
              (err, billsResults) => {
                if (err) {
                  return res.status(500).json({ message: "Unpaid bills stats failed" });
                }

                data.unpaidBills = billsResults[0].count;

                db.query(
                  "SELECT COUNT(*) AS count FROM video_consultations WHERE status = 'Scheduled'",
                  (err, videoResults) => {
                    if (err) {
                      return res.status(500).json({ message: "Video consultations stats failed" });
                    }

                    data.scheduledVideos = videoResults[0].count;

                    res.json(data);
                  }
                );
              }
            );
          }
        );
      }
    );
  }
);

module.exports = router;