const express = require("express");
const db = require("../db");
const { verifyToken } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", verifyToken, (req, res) => {
  db.query(
    `SELECT *
     FROM notifications
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT 10`,
    [req.user.id],
    (err, results) => {
      if (err) {
        return res.status(500).json({
          message: "Notifications loading failed",
          error: err.message,
        });
      }

      res.json(results);
    }
  );
});

router.put("/:id/read", verifyToken, (req, res) => {
  db.query(
    "UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?",
    [req.params.id, req.user.id],
    (err) => {
      if (err) {
        return res.status(500).json({
          message: "Notification update failed",
          error: err.message,
        });
      }

      res.json({ message: "Notification marked as read" });
    }
  );
});

router.put("/read-all", verifyToken, (req, res) => {
  db.query(
    "UPDATE notifications SET is_read = TRUE WHERE user_id = ?",
    [req.user.id],
    (err) => {
      if (err) {
        return res.status(500).json({
          message: "Notifications update failed",
          error: err.message,
        });
      }

      res.json({ message: "All notifications marked as read" });
    }
  );
});

module.exports = router;