const express = require("express");
const bcrypt = require("bcrypt");
const db = require("../db");
const { verifyToken, allowRoles } = require("../middleware/authMiddleware");

const router = express.Router();

// Admin: get all users
router.get("/", verifyToken, allowRoles("ADMIN"), (req, res) => {
  db.query(
    "SELECT id, full_name, email, role, created_at FROM users ORDER BY id DESC",
    (err, results) => {
      if (err) {
        return res.status(500).json({ message: "Database error" });
      }

      res.json(results);
    }
  );
});

// Admin: create receptionist
router.post("/receptionist", verifyToken, allowRoles("ADMIN"), async (req, res) => {
  const { full_name, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    db.query(
      "INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, 'RECEPTIONIST')",
      [full_name, email, hashedPassword],
      (err, result) => {
        if (err) {
          return res.status(500).json({ message: "Email already exists or database error" });
        }

        res.status(201).json({
          message: "Receptionist created successfully",
          userId: result.insertId,
        });
      }
    );
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

// Admin: create doctor
router.post("/doctor", verifyToken, allowRoles("ADMIN"), async (req, res) => {
  const { full_name, email, password, specialization, phone } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    db.query(
      "INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, 'DOCTOR')",
      [full_name, email, hashedPassword],
      (err, userResult) => {
        if (err) {
          return res.status(500).json({ message: "Email already exists or database error" });
        }

        const userId = userResult.insertId;

        db.query(
          "INSERT INTO doctors (user_id, specialization, phone) VALUES (?, ?, ?)",
          [userId, specialization, phone],
          (doctorErr, doctorResult) => {
            if (doctorErr) {
              return res.status(500).json({ message: "Doctor profile creation failed" });
            }

            res.status(201).json({
              message: "Doctor created successfully",
              userId,
              doctorId: doctorResult.insertId,
            });
          }
        );
      }
    );
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

// Admin: delete user, but cannot delete himself
router.delete("/:id", verifyToken, allowRoles("ADMIN"), (req, res) => {
  const { id } = req.params;

  if (Number(id) === Number(req.user.id)) {
    return res.status(400).json({
      message: "You cannot delete your own admin account",
    });
  }

  db.query("DELETE FROM users WHERE id = ?", [id], (err, result) => {
    if (err) {
      return res.status(500).json({
        message: "Database error",
        error: err.message,
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json({ message: "User deleted successfully" });
  });
});

module.exports = router;