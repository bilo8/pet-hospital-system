const express = require("express");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const multer = require("multer");
const path = require("path");
const db = require("../db");

const { verifyToken, allowRoles } = require("../middleware/authMiddleware");
const { isValidEmail } = require("../utils/validators");
const {
  sendClientConfirmationEmail,
  sendVerificationEmail,
} = require("../utils/emailService");

const router = express.Router();

// Image upload config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);

    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// PUBLIC: Create temporary registration
router.post("/", upload.single("pet_image"), (req, res) => {
  const {
    full_name,
    email,
    phone,
    address,
    pet_name,
    type,
    breed,
    age,
    gender,
    preferred_date,
    reason,
  } = req.body;

  if (!isValidEmail(email)) {
    return res.status(400).json({
      message: "Invalid email format",
    });
  }

  const image_url = req.file ? `/uploads/${req.file.filename}` : null;

  const verificationToken = crypto.randomBytes(32).toString("hex");
  const verificationLink = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;

  const sql = `
    INSERT INTO temporary_registrations
    (full_name, email, phone, address, pet_name, type, breed, age, gender, preferred_date, reason, verification_token, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      full_name,
      email,
      phone,
      address,
      pet_name,
      type,
      breed,
      age,
      gender,
      preferred_date,
      reason,
      verificationToken,
      image_url,
    ],
    (err, result) => {
      if (err) {
        return res.status(500).json({
          message: "Temporary registration failed",
          error: err.message,
        });
      }

      sendVerificationEmail({
        to: email,
        fullName: full_name,
        verificationLink,
      })
        .then(() => {
          res.status(201).json({
            message: "Registration request sent. Please verify your email.",
            requestId: result.insertId,
          });
        })
        .catch((emailErr) => {
          res.status(500).json({
            message: "Registration saved, but email could not be sent",
            error: emailErr.message,
          });
        });
    }
  );
});

// PUBLIC: Verify email
router.get("/verify/:token", (req, res) => {
  const { token } = req.params;

  db.query(
    "SELECT id FROM temporary_registrations WHERE verification_token = ?",
    [token],
    (err, results) => {
      if (err) {
        return res.status(500).json({
          message: "Database error",
          error: err.message,
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          message: "Invalid or expired verification link",
        });
      }

      db.query(
        `UPDATE temporary_registrations
         SET email_verified = TRUE,
             verification_token = NULL
         WHERE id = ?`,
        [results[0].id],
        (updateErr) => {
          if (updateErr) {
            return res.status(500).json({
              message: "Email verification failed",
              error: updateErr.message,
            });
          }

          res.json({
            message:
              "Email verified successfully. Please visit the hospital to complete registration.",
          });
        }
      );
    }
  );
});

// ADMIN/RECEPTIONIST: Get pending temporary registrations
router.get(
  "/",
  verifyToken,
  allowRoles("ADMIN", "RECEPTIONIST"),
  (req, res) => {
    const search = req.query.search || "";

    const sql = `
      SELECT *
      FROM temporary_registrations
      WHERE email LIKE ?
      AND status = 'Pending'
      ORDER BY created_at DESC
    `;

    db.query(sql, [`%${search}%`], (err, results) => {
      if (err) {
        return res.status(500).json({
          message: "Database error",
          error: err.message,
        });
      }

      res.json(results);
    });
  }
);

// ADMIN/RECEPTIONIST: Confirm registration
router.post(
  "/:id/confirm",
  verifyToken,
  allowRoles("ADMIN", "RECEPTIONIST"),
  async (req, res) => {
    const { id } = req.params;

    db.query(
      "SELECT * FROM temporary_registrations WHERE id = ?",
      [id],
      async (err, results) => {
        if (err) {
          return res.status(500).json({
            message: "Database error",
            error: err.message,
          });
        }

        if (results.length === 0) {
          return res.status(404).json({
            message: "Temporary registration not found",
          });
        }

        const temp = results[0];

        if (temp.status !== "Pending") {
          return res.status(400).json({
            message: "This registration is already processed",
          });
        }

        if (!temp.email_verified) {
          return res.status(400).json({
            message: "Email is not verified yet",
          });
        }

        try {
          const defaultPassword = "123456";
          const hashedPassword = await bcrypt.hash(defaultPassword, 10);

          db.query(
            "INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, 'CLIENT')",
            [temp.full_name, temp.email, hashedPassword],
            (userErr, userResult) => {
              if (userErr) {
                return res.status(500).json({
                  message: "User creation failed (email may already exist)",
                  error: userErr.message,
                });
              }

              const userId = userResult.insertId;

              db.query(
                "INSERT INTO clients (user_id, phone, address) VALUES (?, ?, ?)",
                [userId, temp.phone, temp.address],
                (clientErr, clientResult) => {
                  if (clientErr) {
                    return res.status(500).json({
                      message: "Client creation failed",
                      error: clientErr.message,
                    });
                  }

                  const clientId = clientResult.insertId;

                  db.query(
                    `INSERT INTO pets 
                    (client_id, name, type, breed, age, gender, image_url)
                    VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                      clientId,
                      temp.pet_name,
                      temp.type,
                      temp.breed,
                      temp.age,
                      temp.gender,
                      temp.image_url,
                    ],
                    (petErr, petResult) => {
                      if (petErr) {
                        return res.status(500).json({
                          message: "Pet creation failed",
                          error: petErr.message,
                        });
                      }

                      const petId = petResult.insertId;

                      db.query(
                        "UPDATE temporary_registrations SET status = 'Confirmed' WHERE id = ?",
                        [id],
                        (updateErr) => {
                          if (updateErr) {
                            return res.status(500).json({
                              message: "Status update failed",
                              error: updateErr.message,
                            });
                          }

                          sendClientConfirmationEmail({
                            to: temp.email,
                            fullName: temp.full_name,
                            password: defaultPassword,
                            appointmentDate: temp.preferred_date,
                            petName: temp.pet_name,
                          })
                            .then(() => {
                              res.json({
                                message:
                                  "Registration confirmed and email sent",
                                userId,
                                clientId,
                                petId,
                              });
                            })
                            .catch((emailErr) => {
                              res.json({
                                message:
                                  "Registration confirmed but email failed",
                                emailError: emailErr.message,
                                userId,
                                clientId,
                                petId,
                              });
                            });
                        }
                      );
                    }
                  );
                }
              );
            }
          );
        } catch (error) {
          res.status(500).json({
            message: "Server error",
            error: error.message,
          });
        }
      }
    );
  }
);

// ADMIN/RECEPTIONIST: Resend verification email
router.post(
  "/:id/resend-verification",
  verifyToken,
  allowRoles("ADMIN", "RECEPTIONIST"),
  (req, res) => {
    const { id } = req.params;

    db.query(
      "SELECT * FROM temporary_registrations WHERE id = ?",
      [id],
      (err, results) => {
        if (err) {
          return res.status(500).json({
            message: "Database error",
            error: err.message,
          });
        }

        if (results.length === 0) {
          return res.status(404).json({
            message: "Temporary registration not found",
          });
        }

        const temp = results[0];

        if (temp.email_verified) {
          return res.status(400).json({
            message: "Email is already verified",
          });
        }

        const verificationToken = crypto.randomBytes(32).toString("hex");
        const verificationLink = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;

        db.query(
          "UPDATE temporary_registrations SET verification_token = ? WHERE id = ?",
          [verificationToken, id],
          (updateErr) => {
            if (updateErr) {
              return res.status(500).json({
                message: "Token update failed",
                error: updateErr.message,
              });
            }

            sendVerificationEmail({
              to: temp.email,
              fullName: temp.full_name,
              verificationLink,
            })
              .then(() => {
                res.json({
                  message: "Verification email resent successfully",
                });
              })
              .catch((emailErr) => {
                res.status(500).json({
                  message: "Failed to resend verification email",
                  error: emailErr.message,
                });
              });
          }
        );
      }
    );
  }
);

// ADMIN/RECEPTIONIST: Delete request
router.delete(
  "/:id",
  verifyToken,
  allowRoles("ADMIN", "RECEPTIONIST"),
  (req, res) => {
    const { id } = req.params;

    db.query(
      "DELETE FROM temporary_registrations WHERE id = ?",
      [id],
      (err) => {
        if (err) {
          return res.status(500).json({
            message: "Delete failed",
            error: err.message,
          });
        }

        res.json({ message: "Temporary registration deleted" });
      }
    );
  }
);

module.exports = router;