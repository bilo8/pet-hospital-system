const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendClientConfirmationEmail = async ({
  to,
  fullName,
  password,
  appointmentDate,
  petName,
}) => {
  await transporter.sendMail({
    from: `"PetCare Hospital" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Your PetCare Hospital Account Confirmation",
    html: `
      <h2>Welcome to PetCare Hospital</h2>
      <p>Hello <b>${fullName}</b>,</p>
      <p>Your registration has been confirmed.</p>
      <p><b>Email:</b> ${to}</p>
      <p><b>Password:</b> ${password}</p>
      <p><b>Pet:</b> ${petName}</p>
      <p><b>Appointment:</b> ${appointmentDate || "Not specified"}</p>
      <p>Please login and change your password from your profile page.</p>
    `,
  });
};

const sendVerificationEmail = async ({ to, fullName, verificationLink }) => {
  await transporter.sendMail({
    from: `"PetCare Hospital" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Verify your PetCare Hospital registration",
    html: `
      <h2>Email Verification</h2>
      <p>Hello <b>${fullName}</b>,</p>
      <p>Please click this link to verify your email:</p>
      <p><a href="${verificationLink}">${verificationLink}</a></p>
    `,
  });
};

const sendAppointmentReminderEmail = async ({
  to,
  fullName,
  appointmentDate,
  petName,
  doctorName,
}) => {
  await transporter.sendMail({
    from: `"PetCare Hospital" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Reminder: Your PetCare appointment is tomorrow",
    html: `
      <h2>Appointment Reminder</h2>
      <p>Hello <b>${fullName}</b>,</p>
      <p>This is a reminder that your appointment is tomorrow.</p>
      <p><b>Pet:</b> ${petName}</p>
      <p><b>Doctor:</b> ${doctorName}</p>
      <p><b>Date:</b> ${new Date(appointmentDate).toLocaleString()}</p>
      <p>Please arrive 10 minutes before your appointment.</p>
      <br/>
      <p>PetCare Hospital</p>
    `,
  });
};

module.exports = {
  sendClientConfirmationEmail,
  sendVerificationEmail,
  sendAppointmentReminderEmail,
};