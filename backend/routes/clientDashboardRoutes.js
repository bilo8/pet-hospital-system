const express = require("express");
const db = require("../db");
const { verifyToken, allowRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", verifyToken, allowRoles("CLIENT"), (req, res) => {
  const userId = req.user.id;

  const result = {
    pets: [],
    appointments: [],
    stats: {
      pets: 0,
      appointments: 0,
      unpaidBills: 0,
      videoConsultations: 0,
    },
  };

  const petsSql = `
    SELECT 
      pets.id,
      pets.name,
      pets.type,
      pets.breed,
      pets.age,
      pets.gender,
      pets.image_url
    FROM pets
    JOIN clients ON pets.client_id = clients.id
    WHERE clients.user_id = ?
  `;

  db.query(petsSql, [userId], (err, pets) => {
    if (err) return res.status(500).json({ message: "Pets error" });

    result.pets = pets;
    result.stats.pets = pets.length;

    const appointmentsSql = `
      SELECT 
        appointments.id,
        appointments.appointment_date,
        appointments.reason,
        appointments.status,
        pets.name AS pet_name,
        users.full_name AS doctor_name
      FROM appointments
      JOIN pets ON appointments.pet_id = pets.id
      JOIN clients ON pets.client_id = clients.id
      JOIN doctors ON appointments.doctor_id = doctors.id
      JOIN users ON doctors.user_id = users.id
      WHERE clients.user_id = ?
      ORDER BY appointments.appointment_date DESC
      LIMIT 5
    `;

    db.query(appointmentsSql, [userId], (err, appointments) => {
      if (err) return res.status(500).json({ message: "Appointments error" });

      result.appointments = appointments;
      result.stats.appointments = appointments.length;

      const billsSql = `
        SELECT COUNT(*) AS total
        FROM bills
        JOIN appointments ON bills.appointment_id = appointments.id
        JOIN pets ON appointments.pet_id = pets.id
        JOIN clients ON pets.client_id = clients.id
        WHERE clients.user_id = ?
        AND bills.status = 'Unpaid'
      `;

      db.query(billsSql, [userId], (err, bills) => {
        if (err) return res.status(500).json({ message: "Bills error" });

        result.stats.unpaidBills = bills[0].total;

        const videoSql = `
          SELECT COUNT(*) AS total
          FROM video_consultations
          JOIN appointments ON video_consultations.appointment_id = appointments.id
          JOIN pets ON appointments.pet_id = pets.id
          JOIN clients ON pets.client_id = clients.id
          WHERE clients.user_id = ?
        `;

        db.query(videoSql, [userId], (err, videos) => {
          if (err) return res.status(500).json({ message: "Video error" });

          result.stats.videoConsultations = videos[0].total;

          res.json(result);
        });
      });
    });
  });
});

module.exports = router;