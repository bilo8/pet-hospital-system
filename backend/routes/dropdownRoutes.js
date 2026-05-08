const express = require("express");
const db = require("../db");
const { verifyToken } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/pets", verifyToken, (req, res) => {
  let sql = `
    SELECT 
      pets.id,
      pets.name,
      pets.type,
      pets.breed,
      pets.age,
      pets.gender,
      pets.image_url,
      users.full_name AS owner_name
    FROM pets
    JOIN clients ON pets.client_id = clients.id
    JOIN users ON clients.user_id = users.id
  `;

  const params = [];

  if (req.user.role === "CLIENT") {
    sql += " WHERE clients.user_id = ?";
    params.push(req.user.id);
  }

  sql += " ORDER BY pets.name";

  db.query(sql, params, (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Database error" });
    }

    res.json(results);
  });
});

router.get("/doctors", verifyToken, (req, res) => {
  const sql = `
    SELECT 
      doctors.id,
      users.full_name,
      doctors.specialization
    FROM doctors
    JOIN users ON doctors.user_id = users.id
    ORDER BY users.full_name
  `;

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Database error" });
    }

    res.json(results);
  });
});

module.exports = router;