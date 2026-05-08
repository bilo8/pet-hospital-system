const express = require("express");
const bcrypt = require("bcrypt");
const db = require("../db");
const { verifyToken } = require("../middleware/authMiddleware");

const router = express.Router();


// ============================
// GET PROFILE
// ============================
router.get("/", verifyToken, (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;

  let sql = `
    SELECT 
      users.id,
      users.full_name,
      users.email,
      users.role
  `;

  if (role === "CLIENT") {
    sql += `,
      clients.phone AS client_phone,
      clients.address
    `;
  }

  if (role === "DOCTOR") {
    sql += `,
      doctors.phone AS doctor_phone,
      doctors.specialization
    `;
  }

  sql += `
    FROM users
  `;

  if (role === "CLIENT") {
    sql += `
      LEFT JOIN clients ON clients.user_id = users.id
    `;
  }

  if (role === "DOCTOR") {
    sql += `
      LEFT JOIN doctors ON doctors.user_id = users.id
    `;
  }

  sql += `
    WHERE users.id = ?
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({
        message: "Database error",
        error: err.message,
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json(results[0]);
  });
});


// ============================
// UPDATE PROFILE
// ============================
router.put("/", verifyToken, (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;

  const {
    full_name,
    phone,
    address,
    specialization,
  } = req.body;

  db.query(
    "UPDATE users SET full_name = ? WHERE id = ?",
    [full_name, userId],
    (userErr) => {
      if (userErr) {
        return res.status(500).json({
          message: "User update failed",
          error: userErr.message,
        });
      }

      if (role === "CLIENT") {
        db.query(
          "UPDATE clients SET phone = ?, address = ? WHERE user_id = ?",
          [phone, address, userId],
          (clientErr) => {
            if (clientErr) {
              return res.status(500).json({
                message: "Client update failed",
                error: clientErr.message,
              });
            }

            return res.json({
              message: "Profile updated successfully",
            });
          }
        );
      } else if (role === "DOCTOR") {
        db.query(
          "UPDATE doctors SET phone = ?, specialization = ? WHERE user_id = ?",
          [phone, specialization, userId],
          (doctorErr) => {
            if (doctorErr) {
              return res.status(500).json({
                message: "Doctor update failed",
                error: doctorErr.message,
              });
            }

            return res.json({
              message: "Profile updated successfully",
            });
          }
        );
      } else {
        return res.json({
          message: "Profile updated successfully",
        });
      }
    }
  );
});


// ============================
// CHANGE PASSWORD
// ============================
router.put("/password", verifyToken, async (req, res) => {
  const userId = req.user.id;

  const {
    currentPassword,
    newPassword,
  } = req.body;

  db.query(
    "SELECT password FROM users WHERE id = ?",
    [userId],
    async (err, results) => {
      if (err) {
        return res.status(500).json({
          message: "Database error",
          error: err.message,
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      const user = results[0];

      const isMatch = await bcrypt.compare(
        currentPassword,
        user.password
      );

      if (!isMatch) {
        return res.status(400).json({
          message: "Current password is incorrect",
        });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      db.query(
        "UPDATE users SET password = ? WHERE id = ?",
        [hashedPassword, userId],
        (updateErr) => {
          if (updateErr) {
            return res.status(500).json({
              message: "Password update failed",
              error: updateErr.message,
            });
          }

          res.json({
            message: "Password changed successfully",
          });
        }
      );
    }
  );
});

module.exports = router;