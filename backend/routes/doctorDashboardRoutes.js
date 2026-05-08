const express = require("express");
const db = require("../db");
const { verifyToken, allowRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", verifyToken, allowRoles("DOCTOR"), (req, res) => {
  const userId = req.user.id;

  const result = {
    todayAppointments: [],
    recentAppointments: [],
    stats: {
      totalAppointments: 0,
      todayAppointments: 0,
      pendingAppointments: 0,
      completedAppointments: 0,
    },
  };

  const doctorSql = "SELECT id FROM doctors WHERE user_id = ?";

  db.query(doctorSql, [userId], (err, doctors) => {
    if (err || doctors.length === 0) {
      return res.status(500).json({ message: "Doctor not found" });
    }

    const doctorId = doctors[0].id;

    const statsSql = `
      SELECT
        COUNT(*) AS totalAppointments,
        SUM(CASE WHEN DATE(appointment_date) = CURDATE() THEN 1 ELSE 0 END) AS todayAppointments,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) AS pendingAppointments,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) AS completedAppointments
      FROM appointments
      WHERE doctor_id = ?
    `;

    db.query(statsSql, [doctorId], (err, stats) => {
      if (err) return res.status(500).json({ message: "Stats error" });

      result.stats = {
        totalAppointments: stats[0].totalAppointments || 0,
        todayAppointments: stats[0].todayAppointments || 0,
        pendingAppointments: stats[0].pendingAppointments || 0,
        completedAppointments: stats[0].completedAppointments || 0,
      };

      const todaySql = `
        SELECT
          appointments.id,
          appointments.appointment_date,
          appointments.reason,
          appointments.status,
          pets.name AS pet_name,
          pets.type AS pet_type,
          users.full_name AS client_name
        FROM appointments
        JOIN pets ON appointments.pet_id = pets.id
        JOIN clients ON pets.client_id = clients.id
        JOIN users ON clients.user_id = users.id
        WHERE appointments.doctor_id = ?
        AND DATE(appointments.appointment_date) = CURDATE()
        ORDER BY appointments.appointment_date ASC
      `;

      db.query(todaySql, [doctorId], (err, todayAppointments) => {
        if (err) return res.status(500).json({ message: "Today appointments error" });

        result.todayAppointments = todayAppointments;

        const recentSql = `
          SELECT
            appointments.id,
            appointments.appointment_date,
            appointments.reason,
            appointments.status,
            pets.name AS pet_name,
            pets.type AS pet_type,
            users.full_name AS client_name
          FROM appointments
          JOIN pets ON appointments.pet_id = pets.id
          JOIN clients ON pets.client_id = clients.id
          JOIN users ON clients.user_id = users.id
          WHERE appointments.doctor_id = ?
          ORDER BY appointments.appointment_date DESC
          LIMIT 5
        `;

        db.query(recentSql, [doctorId], (err, recentAppointments) => {
          if (err) return res.status(500).json({ message: "Recent appointments error" });

          result.recentAppointments = recentAppointments;
          res.json(result);
        });
      });
    });
  });
});

module.exports = router;