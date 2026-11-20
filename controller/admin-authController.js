const admin = require("../models/authModel");
const session = require("../models/sessionModel");
const crypto = require("crypto");
const jwt = require('jsonwebtoken');
const { generateAccessToken, generateRefreshToken } = require('../Middleware/Middleware');
const { generatePassword } = require('../utils/passwordGenerator');
const bcrypt = require('bcryptjs')
const { 
  generateOtp,
  hashOtp,
  compareOtp
} = require('../utils/otp.helper');
const { applyOtpSecurity } = require('../utils/otpLimiter');
const { checkOtpBlock } = require('../utils/otpGuard');
const { sendEmail } = require('../utils/mail.helper');
const { formatPhone } = require("../utils/phone");
const { sendSMS } = require('../utils/sms.helper');
const { adminOtpSMS } = require("../templates/adminOtpSMS");
const {
  adminRegisterSuccessTemplate,
  adminRegisterOtpTemplate,
  adminLoginOtpTemplate,
  adminLoginSuccessTemplate,
  adminForgotPasswordOtpTemplate,
  adminResetPasswordTemplate,
  adminPasswordChangedTemplate,
  adminResendOtpTemplate,
} = require('../templates/adminEmailTemplates');
const {
  getDevice,
  getIP,
  getLocation,
} = require("../utils/info.helper");

exports.adminRegister = async (req, res, next) => {
    try { 
        const { name, email, phone } = req.body;
        if (!name || !email || !phone) {
            return res.status(400).json({ 
                status: "error",
                message: "All fields are required"
            });
        }

        let formattedPhone = null;

        if (phone) {
          formattedPhone = formatPhone(phone);
          if (!formattedPhone) {
            return res.status(400).json({
              status: "fail",
              message:"Invalid phone number format. Please provide a valid phone number.",
            });
          }
        }

        const otp = generateOtp();
        const hashedOtp = await hashOtp(otp);

        const existingAdmin = await admin.findOne({ $or: [{ email }, { phone: formattedPhone }] });
        if (existingAdmin) {
            return res.status(400).json({ 
                status: "error",
                message: "Admin with this email or phone number already exists."
            });
        }

        try {
            applyOtpSecurity({email, phone: formattedPhone});
        }catch (err) {
            return res.status(429).json({ 
                status: "fail",
                message: "Failed to send OTP. Please try again later."
            });
        }

        const password = generatePassword(8);
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

    } catch (err) {
        res.status(500).json({ 
            status: "error",
            message: err.message
        });
    }
}