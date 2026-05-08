const db = require("../db");

const createNotification = ({ userId, title, message }) => {
  return new Promise((resolve, reject) => {
    db.query(
      `INSERT INTO notifications (user_id, title, message)
       VALUES (?, ?, ?)`,
      [userId, title, message],
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
  });
};

module.exports = {
  createNotification,
};