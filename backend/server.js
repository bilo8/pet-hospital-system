const express = require("express");
const cors = require("cors");
require("dotenv").config();
const path = require("path");
const fs = require("fs");

const db = require("./db");

const app = express();

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const clientPetRoutes = require("./routes/clientPetRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const medicalRecordRoutes = require("./routes/medicalRecordRoutes");
const videoConsultationRoutes = require("./routes/videoConsultationRoutes");
const billRoutes = require("./routes/billRoutes");
const dropdownRoutes = require("./routes/dropdownRoutes");
const statsRoutes = require("./routes/statsRoutes");
const clientDashboardRoutes = require("./routes/clientDashboardRoutes");
const doctorDashboardRoutes = require("./routes/doctorDashboardRoutes");
const temporaryRegistrationRoutes = require("./routes/temporaryRegistrationRoutes");
const profileRoutes = require("./routes/profileRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const uploadsPath = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath);
}


app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);
app.use(express.json());
app.use("/uploads", express.static("uploads"));
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/client-pets", clientPetRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/medical-records", medicalRecordRoutes);
app.use("/api/video-consultations", videoConsultationRoutes);
app.use("/api/bills", billRoutes);
app.use("/api/dropdowns", dropdownRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/client-dashboard", clientDashboardRoutes);
app.use("/api/doctor-dashboard", doctorDashboardRoutes);
app.use("/api/temporary-registrations", temporaryRegistrationRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/uploads", express.static(uploadsPath));

app.get("/", (req, res) => {
  res.send("Pet Hospital API is running");
});

app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

app.get("/api/test-db", (req, res) => {
  db.query("SELECT 1 + 1 AS result", (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Database error", error: err });
    }

    res.json({
      message: "Database connected successfully",
      result: result[0].result,
    });
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
