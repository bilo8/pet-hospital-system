const express = require("express");
const db = require("../db");
const { verifyToken, allowRoles } = require("../middleware/authMiddleware");
const { createNotification } = require("../utils/notificationService");
const PDFDocument = require("pdfkit");

const router = express.Router();

// Admin/Receptionist: create bill
router.post(
  "/",
  verifyToken,
  allowRoles("ADMIN", "RECEPTIONIST"),
  (req, res) => {
    const { appointment_id, amount } = req.body;

    db.query(
      `INSERT INTO bills (appointment_id, amount, status)
       VALUES (?, ?, 'Unpaid')`,
      [appointment_id, amount],
      (err, result) => {
        if (err) {
          return res.status(500).json({
            message: "Bill creation failed",
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
              title: "New Bill Created",
              message: `A new bill was created for ${rows[0].pet_name}. Amount: $${amount}.`,
            });
          }

          res.status(201).json({
            message: "Bill created successfully",
            billId: result.insertId,
          });
        });
      },
    );
  },
);

// View bills by role
router.get("/", verifyToken, (req, res) => {
  let sql = `
    SELECT
      bills.id,
      bills.amount,
      bills.status,
      bills.payment_method,
      bills.transaction_id,
      bills.payment_date,
      bills.created_at,
      appointments.appointment_date,
      pets.name AS pet_name,
      users_client.full_name AS client_name,
      users_doctor.full_name AS doctor_name
    FROM bills
    JOIN appointments ON bills.appointment_id = appointments.id
    JOIN pets ON appointments.pet_id = pets.id
    JOIN clients ON pets.client_id = clients.id
    JOIN users AS users_client ON clients.user_id = users_client.id
    JOIN doctors ON appointments.doctor_id = doctors.id
    JOIN users AS users_doctor ON doctors.user_id = users_doctor.id
  `;

  const params = [];

  if (req.user.role === "CLIENT") {
    sql += " WHERE clients.user_id = ?";
    params.push(req.user.id);
  }

  sql += " ORDER BY bills.created_at DESC";

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

// Admin/Receptionist: update payment manually
router.put(
  "/:id/status",
  verifyToken,
  allowRoles("ADMIN", "RECEPTIONIST"),
  (req, res) => {
    const { id } = req.params;
    const { status, payment_method, transaction_id } = req.body;

    db.query(
      `UPDATE bills
       SET status = ?,
           payment_method = ?,
           transaction_id = ?,
           payment_date = CASE WHEN ? = 'Paid' THEN NOW() ELSE NULL END
       WHERE id = ?`,
      [status, payment_method, transaction_id, status, id],
      (err) => {
        if (err) {
          return res.status(500).json({
            message: "Bill status update failed",
            error: err.message,
          });
        }

        res.json({ message: "Bill updated successfully" });
      },
    );
  },
);

// Client: fake online payment
router.post(
  "/:id/pay-online",
  verifyToken,
  allowRoles("CLIENT"),
  (req, res) => {
    const { id } = req.params;

    const transactionId = "TXN-" + Date.now();

    const sql = `
      UPDATE bills
      JOIN appointments ON bills.appointment_id = appointments.id
      JOIN pets ON appointments.pet_id = pets.id
      JOIN clients ON pets.client_id = clients.id
      SET bills.status = 'Paid',
          bills.payment_method = 'Online',
          bills.transaction_id = ?,
          bills.payment_date = NOW()
      WHERE bills.id = ?
      AND clients.user_id = ?
      AND bills.status = 'Unpaid'
    `;

    db.query(sql, [transactionId, id, req.user.id], async (err, result) => {
      if (err) {
        return res.status(500).json({
          message: "Online payment failed",
          error: err.message,
        });
      }

      if (result.affectedRows === 0) {
        return res.status(403).json({
          message: "Bill not found, already paid, or not yours",
        });
      }

      await createNotification({
        userId: req.user.id,
        title: "Payment Successful",
        message: `Your online payment was completed successfully. Transaction: ${transactionId}.`,
      });

      res.json({
        message: "Online payment successful",
        transaction_id: transactionId,
      });
    });
  }
);

// Admin/Receptionist: delete bill
router.delete(
  "/:id",
  verifyToken,
  allowRoles("ADMIN", "RECEPTIONIST"),
  (req, res) => {
    const { id } = req.params;

    db.query("DELETE FROM bills WHERE id = ?", [id], (err) => {
      if (err) {
        return res.status(500).json({
          message: "Bill delete failed",
          error: err.message,
        });
      }

      res.json({ message: "Bill deleted successfully" });
    });
  },
);

// Download invoice PDF
router.get("/:id/invoice", verifyToken, async (req, res) => {
  const { id } = req.params;

  let sql = `
    SELECT
      bills.id,
      bills.amount,
      bills.status,
      bills.payment_method,
      bills.transaction_id,
      bills.payment_date,
      bills.created_at,
      appointments.appointment_date,
      pets.name AS pet_name,
      pets.type AS pet_type,
      users_client.full_name AS client_name,
      users_client.email AS client_email,
      clients.phone AS client_phone,
      users_doctor.full_name AS doctor_name
    FROM bills
    JOIN appointments ON bills.appointment_id = appointments.id
    JOIN pets ON appointments.pet_id = pets.id
    JOIN clients ON pets.client_id = clients.id
    JOIN users AS users_client ON clients.user_id = users_client.id
    JOIN doctors ON appointments.doctor_id = doctors.id
    JOIN users AS users_doctor ON doctors.user_id = users_doctor.id
    WHERE bills.id = ?
  `;

  const params = [id];

  if (req.user.role === "CLIENT") {
    sql += " AND clients.user_id = ?";
    params.push(req.user.id);
  }

  db.query(sql, params, (err, results) => {
    if (err) {
      return res.status(500).json({
        message: "Invoice loading failed",
        error: err.message,
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        message: "Invoice not found",
      });
    }

    const bill = results[0];

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${bill.id}.pdf`
    );

    doc.pipe(res);

    doc.fontSize(24).fillColor("#1d4ed8").text("PetCare Hospital", {
      align: "center",
    });

    doc.moveDown();
    doc.fontSize(18).fillColor("#000").text(`Invoice #${bill.id}`, {
      align: "center",
    });

    doc.moveDown(2);

    doc.fontSize(12).text(`Client: ${bill.client_name}`);
    doc.text(`Email: ${bill.client_email}`);
    doc.text(`Phone: ${bill.client_phone || "-"}`);

    doc.moveDown();

    doc.text(`Pet: ${bill.pet_name}`);
    doc.text(`Pet Type: ${bill.pet_type}`);
    doc.text(`Doctor: ${bill.doctor_name}`);
    doc.text(
      `Appointment Date: ${new Date(
        bill.appointment_date
      ).toLocaleString()}`
    );

    doc.moveDown();

    doc.fontSize(14).text("Payment Details", { underline: true });
    doc.moveDown(0.5);

    doc.fontSize(12).text(`Amount: $${bill.amount}`);
    doc.text(`Status: ${bill.status}`);
    doc.text(`Payment Method: ${bill.payment_method || "-"}`);
    doc.text(`Transaction ID: ${bill.transaction_id || "-"}`);
    doc.text(
      `Payment Date: ${bill.payment_date ? new Date(bill.payment_date).toLocaleString() : "-"
      }`
    );

    doc.moveDown(2);

    doc
      .fontSize(10)
      .fillColor("#555")
      .text("Thank you for trusting PetCare Hospital.", {
        align: "center",
      });

    doc.end();
  });
});

// Receptionist/Admin: cash payment
router.post(
  "/:id/pay-cash",
  verifyToken,
  allowRoles("ADMIN", "RECEPTIONIST"),
  (req, res) => {
    const { id } = req.params;

    const sql = `
      UPDATE bills
      SET
        status = 'Paid',
        payment_method = 'Cash',
        transaction_id = NULL,
        payment_date = NOW()
      WHERE id = ?
      AND status = 'Unpaid'
    `;

    db.query(sql, [id], async (err, result) => {
      if (err) {
        return res.status(500).json({
          message: "Cash payment failed",
          error: err.message,
        });
      }

      if (result.affectedRows === 0) {
        return res.status(400).json({
          message: "Bill already paid or not found",
        });
      }

      res.json({
        message: "Cash payment completed successfully",
      });
    });
  }
);

module.exports = router;
