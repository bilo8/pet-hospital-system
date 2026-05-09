const express = require("express");
const db = require("../db");
const { verifyToken, allowRoles } = require("../middleware/authMiddleware");
const PDFDocument = require("pdfkit");

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

router.get("/:id/prescription", verifyToken, (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT
      medical_records.*,
      pets.name AS pet_name,
      pets.type AS pet_type,
      users_doctor.full_name AS doctor_name,
      users_client.full_name AS client_name
    FROM medical_records
    JOIN pets ON medical_records.pet_id = pets.id
    JOIN clients ON pets.client_id = clients.id
    JOIN users AS users_client ON clients.user_id = users_client.id
    JOIN doctors ON medical_records.doctor_id = doctors.id
    JOIN users AS users_doctor ON doctors.user_id = users_doctor.id
    WHERE medical_records.id = ?
  `;

  db.query(sql, [id], (err, results) => {
    if (err) {
      return res.status(500).json({
        message: "Prescription loading failed",
        error: err.message,
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        message: "Medical record not found",
      });
    }

    const record = results[0];
    const doc = new PDFDocument({ margin: 50 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=prescription-${record.id}.pdf`
    );

    doc.pipe(res);

    doc.fontSize(24).fillColor("#1d4ed8").text("PetCare Hospital", {
      align: "center",
    });

    doc.moveDown();
    doc.fontSize(18).fillColor("#000").text("Medical Prescription", {
      align: "center",
    });

    doc.moveDown(2);

    doc.fontSize(12).text(`Client: ${record.client_name}`);
    doc.text(`Pet: ${record.pet_name}`);
    doc.text(`Pet Type: ${record.pet_type}`);
    doc.text(`Doctor: ${record.doctor_name}`);
    doc.text(`Date: ${new Date(record.record_date).toLocaleString()}`);

    doc.moveDown();

    doc.fontSize(14).text("Medical Details", { underline: true });
    doc.moveDown(0.5);

    doc.fontSize(12).text(`Diagnosis: ${record.diagnosis}`);
    doc.text(`Treatment: ${record.treatment}`);
    doc.text(`Medication: ${record.medication || "-"}`);
    doc.text(`Dosage: ${record.dosage || "-"}`);
    doc.text(`Visit Summary: ${record.visit_summary || "-"}`);
    doc.text(`Notes: ${record.notes || "-"}`);

    doc.moveDown();

    doc.text(
      `Next Visit: ${record.next_visit_date
        ? new Date(record.next_visit_date).toLocaleDateString()
        : "-"
      }`
    );

    doc.moveDown(2);

    doc
      .fontSize(10)
      .fillColor("#555")
      .text("This prescription was generated by PetCare Hospital System.", {
        align: "center",
      });

    doc.end();
  });
});

// Download full medical history PDF for one pet
router.get("/pet/:petId/history-pdf", verifyToken, (req, res) => {
  const { petId } = req.params;

  let sql = `
    SELECT
      medical_records.*,
      pets.name AS pet_name,
      pets.type AS pet_type,
      pets.breed,
      pets.age,
      pets.gender,
      users_client.full_name AS client_name,
      users_client.email AS client_email,
      clients.phone AS client_phone,
      users_doctor.full_name AS doctor_name
    FROM medical_records
    JOIN pets ON medical_records.pet_id = pets.id
    JOIN clients ON pets.client_id = clients.id
    JOIN users AS users_client ON clients.user_id = users_client.id
    JOIN doctors ON medical_records.doctor_id = doctors.id
    JOIN users AS users_doctor ON doctors.user_id = users_doctor.id
    WHERE pets.id = ?
  `;

  const params = [petId];

  if (req.user.role === "CLIENT") {
    sql += " AND clients.user_id = ?";
    params.push(req.user.id);
  }

  sql += " ORDER BY medical_records.record_date DESC";

  db.query(sql, params, (err, records) => {
    if (err) {
      return res.status(500).json({
        message: "Pet medical history loading failed",
        error: err.message,
      });
    }

    if (records.length === 0) {
      return res.status(404).json({
        message: "No medical history found",
      });
    }

    const pet = records[0];

    const doc = new PDFDocument({
      margin: 40,
      size: "A4",
    });

    res.setHeader("Content-Type", "application/pdf");

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${pet.pet_name}-history.pdf`
    );

    doc.pipe(res);

    // HEADER
    doc.rect(0, 0, 700, 90).fill("#1d4ed8");

    doc
      .fillColor("white")
      .fontSize(28)
      .font("Helvetica-Bold")
      .text("PetCare Hospital", 40, 30);

    doc
      .fontSize(14)
      .font("Helvetica")
      .text("Complete Pet Medical History", 40, 65);

    doc.moveDown(4);

    // PET INFO CARD
    doc
      .roundedRect(40, 120, 520, 110, 10)
      .fillAndStroke("#f3f4f6", "#d1d5db");

    doc.fillColor("#111827");

    doc.fontSize(18).font("Helvetica-Bold");
    doc.text("Pet Information", 55, 135);

    doc.fontSize(11).font("Helvetica");

    doc.text(`Pet Name: ${pet.pet_name}`, 55, 165);
    doc.text(`Type: ${pet.pet_type}`, 300, 165);

    doc.text(`Breed: ${pet.breed || "-"}`, 55, 185);
    doc.text(`Age: ${pet.age || "-"}`, 300, 185);

    doc.text(`Gender: ${pet.gender || "-"}`, 55, 205);

    // OWNER INFO
    doc
      .roundedRect(40, 250, 520, 90, 10)
      .fillAndStroke("#eff6ff", "#93c5fd");

    doc.fillColor("#111827");

    doc.fontSize(18).font("Helvetica-Bold");
    doc.text("Owner Information", 55, 265);

    doc.fontSize(11).font("Helvetica");

    doc.text(`Owner: ${pet.client_name}`, 55, 295);
    doc.text(`Email: ${pet.client_email}`, 55, 315);
    doc.text(`Phone: ${pet.client_phone || "-"}`, 320, 315);

    let y = 380;

    doc
      .fillColor("#1d4ed8")
      .fontSize(20)
      .font("Helvetica-Bold")
      .text("Visit Timeline", 40, y);

    y += 40;

    records.forEach((record, index) => {
      if (y > 700) {
        doc.addPage();
        y = 50;
      }

      const startY = y;
      const cardX = 40;
      const cardW = 520;

      let contentY = startY + 55;

      const rows = [
        ["Doctor", record.doctor_name],
        ["Diagnosis", record.diagnosis],
        ["Treatment", record.treatment],
        ["Medication", record.medication || "-"],
        ["Dosage", record.dosage || "-"],
        ["Summary", record.visit_summary || "-"],
        ["Notes", record.notes || "-"],
      ];

      rows.forEach(([label, value]) => {
        const textHeight = doc.heightOfString(value, { width: 350 });

        contentY += Math.max(22, textHeight + 8);
      });

      const nextVisitHeight = record.next_visit_date ? 35 : 0;
      const cardHeight = contentY - startY + nextVisitHeight + 20;

      if (startY + cardHeight > 740) {
        doc.addPage();
        y = 50;
      }

      const finalStartY = y;
      let finalContentY = finalStartY + 55;

      doc
        .roundedRect(cardX, finalStartY, cardW, cardHeight, 10)
        .fillAndStroke("#ffffff", "#d1d5db");

      doc.circle(60, finalStartY + 25, 8).fill("#2563eb");

      doc.fillColor("#111827").fontSize(15).font("Helvetica-Bold");
      doc.text(`Visit #${index + 1}`, 80, finalStartY + 15);

      doc.fillColor("#6b7280").fontSize(10).font("Helvetica");
      doc.text(new Date(record.record_date).toLocaleString(), 410, finalStartY + 18);

      rows.forEach(([label, value]) => {
        doc.fillColor("#2563eb").font("Helvetica-Bold").fontSize(10);
        doc.text(`${label}:`, 60, finalContentY);

        doc.fillColor("#111827").font("Helvetica").fontSize(10);
        doc.text(value, 150, finalContentY, { width: 350 });

        const textHeight = doc.heightOfString(value, { width: 350 });
        finalContentY += Math.max(22, textHeight + 8);
      });

      if (record.next_visit_date) {
        doc.roundedRect(60, finalContentY + 5, 220, 24, 6).fill("#dcfce7");

        doc
          .fillColor("#166534")
          .font("Helvetica-Bold")
          .fontSize(10)
          .text(
            `Next Visit: ${new Date(record.next_visit_date).toLocaleDateString()}`,
            75,
            finalContentY + 12
          );
      }

      y = finalStartY + cardHeight + 25;
    });

    // FOOTER
    doc.fontSize(9).fillColor("#6b7280");

    doc.text(
      "Generated by PetCare Hospital System",
      40,
      780,
      {
        align: "center",
      }
    );

    doc.end();
  });
});



module.exports = router;