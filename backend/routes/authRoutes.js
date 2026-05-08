const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db");

const router = express.Router();

router.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.query(
    "SELECT * FROM users WHERE email = ?",
    [email],
    async (err, results) => {
      if (err) {
        return res.status(500).json({ message: "Database error" });
      }

      if (results.length === 0) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const user = results[0];
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const token = jwt.sign(
        {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: "1d" },
      );

      res.json({
        message: "Login successful",
        token,
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          role: user.role,
        },
      });
    },
  );
});

router.post("/register-client", async (req, res) => {
  const { full_name, email, password, phone, address } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    db.query(
      "INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, 'CLIENT')",
      [full_name, email, hashedPassword],
      (err, userResult) => {
        if (err) {
          return res
            .status(500)
            .json({ message: "Email already exists or database error" });
        }

        const userId = userResult.insertId;

        db.query(
          "INSERT INTO clients (user_id, phone, address) VALUES (?, ?, ?)",
          [userId, phone, address],
          (clientErr) => {
            if (clientErr) {
              return res
                .status(500)
                .json({ message: "Client creation failed" });
            }

            res.status(201).json({ message: "Client registered successfully" });
          },
        );
      },
    );
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
