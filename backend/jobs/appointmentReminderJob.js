const cron = require("node-cron");
const db = require("../db");
const { sendAppointmentReminderEmail } = require("../utils/emailService");

const startAppointmentReminderJob = () => {
  cron.schedule("0 9 * * *", () => {
    console.log("Checking appointment reminders...");

    const sql = `
      SELECT
        appointments.id,
        appointments.appointment_date,
        pets.name AS pet_name,
        users_client.full_name AS client_name,
        users_client.email AS client_email,
        users_doctor.full_name AS doctor_name
      FROM appointments
      JOIN pets ON appointments.pet_id = pets.id
      JOIN clients ON pets.client_id = clients.id
      JOIN users AS users_client ON clients.user_id = users_client.id
      JOIN doctors ON appointments.doctor_id = doctors.id
      JOIN users AS users_doctor ON doctors.user_id = users_doctor.id
      WHERE DATE(appointments.appointment_date) = DATE_ADD(CURDATE(), INTERVAL 1 DAY)
      AND appointments.status IN ('Pending', 'Confirmed')
      AND appointments.reminder_sent = FALSE
    `;

    db.query(sql, async (err, appointments) => {
      if (err) {
        console.error("Reminder query failed:", err.message);
        return;
      }

      for (const appointment of appointments) {
        try {
          await sendAppointmentReminderEmail({
            to: appointment.client_email,
            fullName: appointment.client_name,
            appointmentDate: appointment.appointment_date,
            petName: appointment.pet_name,
            doctorName: appointment.doctor_name,
          });

          db.query(
            "UPDATE appointments SET reminder_sent = TRUE WHERE id = ?",
            [appointment.id]
          );

          console.log(`Reminder sent for appointment ${appointment.id}`);
        } catch (emailErr) {
          console.error(
            `Reminder email failed for appointment ${appointment.id}:`,
            emailErr.message
          );
        }
      }
    });
  });
};

module.exports = startAppointmentReminderJob;