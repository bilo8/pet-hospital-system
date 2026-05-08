const express = require("express");
const db = require("../db");
const { verifyToken, allowRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/",
  verifyToken,
  allowRoles("DOCTOR", "ADMIN"),
  (req, res) => {
    const {
      pet_id,
      doctor_id,
      appointment_id,
      diagnosis,
      treatment,
      medication,
      dosage,
      visit_summary,
      next_visit_date,
      notes,
    } = req.body;

    const createRecord = (finalDoctorId) => {
      const sql = `
        INSERT INTO medical_records
        (pet_id, doctor_id, appointment_id, diagnosis, treatment, medication, dosage, visit_summary, next_visit_date, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.query(
        sql,
        [
          pet_id,
          finalDoctorId,
          appointment_id || null,
          diagnosis,
          treatment,
          medication,
          dosage,
          visit_summary,
          next_visit_date || null,
          notes,
        ],
        (err, result) => {
          if (err) {
            return res.status(500).json({
              message: "Medical record creation failed",
              error: err.message,
            });
          }

          res.status(201).json({
            message: "Medical record created successfully",
            recordId: result.insertId,
          });
        }
      );
    };

    if (req.user.role === "DOCTOR") {
      db.query(
        "SELECT id FROM doctors WHERE user_id = ?",
        [req.user.id],
        (err, doctors) => {
          if (err || doctors.length === 0) {
            return res.status(500).json({
              message: "Doctor not found",
            });
          }

          createRecord(doctors[0].id);
        }
      );
    } else {
      createRecord(doctor_id);
    }
  }
);

router.get("/", verifyToken, (req, res) => {
  let sql = `
    SELECT
      medical_records.id,
      medical_records.record_date,
      medical_records.diagnosis,
      medical_records.treatment,
      medical_records.medication,
      medical_records.dosage,
      medical_records.visit_summary,
      medical_records.next_visit_date,
      medical_records.notes,
      pets.name AS pet_name,
      users_doctor.full_name AS doctor_name
    FROM medical_records
    JOIN pets ON medical_records.pet_id = pets.id
    JOIN doctors ON medical_records.doctor_id = doctors.id
    JOIN users AS users_doctor ON doctors.user_id = users_doctor.id
    JOIN clients ON pets.client_id = clients.id
  `;

  const params = [];

  if (req.user.role === "CLIENT") {
    sql += " WHERE clients.user_id = ?";
    params.push(req.user.id);
  }

  if (req.user.role === "DOCTOR") {
    sql += " WHERE doctors.user_id = ?";
    params.push(req.user.id);
  }

  sql += " ORDER BY medical_records.record_date DESC";

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

router.get("/pet/:petId", verifyToken, (req, res) => {
  const { petId } = req.params;

  let sql = `
    SELECT
      medical_records.id,
      medical_records.record_date,
      medical_records.diagnosis,
      medical_records.treatment,
      medical_records.medication,
      medical_records.dosage,
      medical_records.visit_summary,
      medical_records.next_visit_date,
      medical_records.notes,
      pets.name AS pet_name,
      users_doctor.full_name AS doctor_name
    FROM medical_records
    JOIN pets ON medical_records.pet_id = pets.id
    JOIN doctors ON medical_records.doctor_id = doctors.id
    JOIN users AS users_doctor ON doctors.user_id = users_doctor.id
    JOIN clients ON pets.client_id = clients.id
    WHERE medical_records.pet_id = ?
  `;

  const params = [petId];

  if (req.user.role === "CLIENT") {
    sql += " AND clients.user_id = ?";
    params.push(req.user.id);
  }

  sql += " ORDER BY medical_records.record_date DESC";

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

module.exports = router;