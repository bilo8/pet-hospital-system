const express = require("express");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");
const db = require("../db");
const { verifyToken, allowRoles } = require("../middleware/authMiddleware");
const { isValidEmail } = require("../utils/validators");

const router = express.Router();

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

// Admin/Receptionist: Register client with pet + image
router.post(
  "/register",
  verifyToken,
  allowRoles("ADMIN", "RECEPTIONIST"),
  upload.single("pet_image"),
  async (req, res) => {
    const {
      full_name,
      email,
      password,
      phone,
      address,
      pet_name,
      type,
      breed,
      age,
      gender,
    } = req.body;

    if (!isValidEmail(email)) {
      return res.status(400).json({
        message: "Invalid email format",
      });
    }

    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      db.query(
        "INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, 'CLIENT')",
        [full_name, email, hashedPassword],
        (userErr, userResult) => {
          if (userErr) {
            return res.status(500).json({
              message: "Email already exists or database error",
              error: userErr.message,
            });
          }

          const userId = userResult.insertId;

          db.query(
            "INSERT INTO clients (user_id, phone, address) VALUES (?, ?, ?)",
            [userId, phone, address],
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
                [clientId, pet_name, type, breed, age, gender, image_url],
                (petErr, petResult) => {
                  if (petErr) {
                    return res.status(500).json({
                      message: "Pet creation failed",
                      error: petErr.message,
                    });
                  }

                  res.status(201).json({
                    message: "Client and pet registered successfully",
                    userId,
                    clientId,
                    petId: petResult.insertId,
                    image_url,
                  });
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

// Admin/Receptionist: View all clients with pets
router.get(
  "/",
  verifyToken,
  allowRoles("ADMIN", "RECEPTIONIST"),
  (req, res) => {
    const sql = `
      SELECT 
        clients.id AS client_id,
        users.full_name,
        users.email,
        clients.phone,
        clients.address,
        pets.id AS pet_id,
        pets.name AS pet_name,
        pets.type,
        pets.breed,
        pets.age,
        pets.gender,
        pets.image_url
      FROM clients
      JOIN users ON clients.user_id = users.id
      JOIN pets ON pets.client_id = clients.id
      ORDER BY clients.id DESC
    `;

    db.query(sql, (err, results) => {
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

// Client: Add new pet to own account
router.post(
  "/my-pets",
  verifyToken,
  allowRoles("CLIENT"),
  upload.single("pet_image"),
  (req, res) => {
    const userId = req.user.id;
    const { name, type, breed, age, gender } = req.body;

    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    db.query(
      "SELECT id FROM clients WHERE user_id = ?",
      [userId],
      (clientErr, clients) => {
        if (clientErr) {
          return res.status(500).json({
            message: "Database error",
            error: clientErr.message,
          });
        }

        if (clients.length === 0) {
          return res.status(404).json({
            message: "Client not found",
          });
        }

        const clientId = clients[0].id;

        db.query(
          `INSERT INTO pets
          (client_id, name, type, breed, age, gender, image_url)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [clientId, name, type, breed, age, gender, image_url],
          (petErr, result) => {
            if (petErr) {
              return res.status(500).json({
                message: "Pet creation failed",
                error: petErr.message,
              });
            }

            res.status(201).json({
              message: "Pet added successfully",
              petId: result.insertId,
              image_url,
            });
          }
        );
      }
    );
  }
);

// Admin/Receptionist: update client and pet info
router.put(
  "/:clientId/pets/:petId",
  verifyToken,
  allowRoles("ADMIN", "RECEPTIONIST"),
  upload.single("pet_image"),
  (req, res) => {
    const { clientId, petId } = req.params;

    const {
      full_name,
      phone,
      address,
      pet_name,
      type,
      breed,
      age,
      gender,
    } = req.body;

    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    const updateClientSql = `
      UPDATE clients
      JOIN users ON clients.user_id = users.id
      SET users.full_name = ?,
          clients.phone = ?,
          clients.address = ?
      WHERE clients.id = ?
    `;

    db.query(
      updateClientSql,
      [full_name, phone, address, clientId],
      (clientErr) => {
        if (clientErr) {
          return res.status(500).json({
            message: "Client update failed",
            error: clientErr.message,
          });
        }

        let updatePetSql = `
          UPDATE pets
          SET name = ?,
              type = ?,
              breed = ?,
              age = ?,
              gender = ?
        `;

        const params = [pet_name, type, breed, age, gender];

        if (image_url) {
          updatePetSql += `, image_url = ?`;
          params.push(image_url);
        }

        updatePetSql += ` WHERE id = ? AND client_id = ?`;
        params.push(petId, clientId);

        db.query(updatePetSql, params, (petErr) => {
          if (petErr) {
            return res.status(500).json({
              message: "Pet update failed",
              error: petErr.message,
            });
          }

          res.json({
            message: "Client and pet updated successfully",
            image_url,
          });
        });
      }
    );
  }
);

// Admin/Receptionist: Add another pet to existing client
router.post(
  "/:clientId/pets",
  verifyToken,
  allowRoles("ADMIN", "RECEPTIONIST"),
  upload.single("pet_image"),
  (req, res) => {
    const { clientId } = req.params;
    const { name, type, breed, age, gender } = req.body;

    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    db.query(
      `INSERT INTO pets 
      (client_id, name, type, breed, age, gender, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [clientId, name, type, breed, age, gender, image_url],
      (err, result) => {
        if (err) {
          return res.status(500).json({
            message: "Pet creation failed",
            error: err.message,
          });
        }

        res.status(201).json({
          message: "Pet added successfully",
          petId: result.insertId,
          image_url,
        });
      }
    );
  }
);

module.exports = router;