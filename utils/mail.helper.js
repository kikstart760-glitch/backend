import nodemailer from "nodemailer";

// ================= CREATE TRANSPORTER =================
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true for 465, false for 587
  auth: {
    user: process.env.MY_EMAIL,
    pass: process.env.MY_PASSWORD, // App Password (IMPORTANT)
  },
});

// ================= SEND EMAIL FUNCTION =================
export const sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: `"KikStart" <${process.env.MY_EMAIL}>`,
      to,
      subject,
      html,
      attachments: [
        {
          filename: "logo.png",
          path: "./assets/logo.png", // your logo path
          cid: "logo",
        },
      ],
    });

    console.log("Email sent:", info.messageId);
  } catch (error) {
    console.error("Email error:", error.message);
    throw error;
  }
};