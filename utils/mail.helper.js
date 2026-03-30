const nodemailer = require("nodemailer");
const path = require("path");

// ================= CREATE TRANSPORTER =================
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// ================= SEND EMAIL FUNCTION =================
const sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: `"KikStart" <${process.env.EMAIL_USERNAME}>`,
      to,
      subject,
      html,
      attachments: [
        {
          filename: "logo.png",
          path: path.join(__dirname, "../utils/assets/logo.png"),
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

module.exports = { sendEmail };