const user = require('../models/authModel');
const Session = require('../models/sessionModel');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const {google} = require("googleapis");
const { generateAccessToken, generateRefreshToken } = require('../Middleware/Middleware');
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
const { otpSMS } = require("../templates/smsTemplate");
const {
  registerSuccessTemplate,
  registerOtpTemplate,
  loginOtpTemplate,
  loginSuccessTemplate,
  forgotPasswordOtpTemplate,
  resetPasswordTemplate,
  passwordChangedTemplate,
  resendOtpTemplate
} = require('../templates/emailTemplate');
const {
  getDevice,
  getIP,
  getLocation,
} = require("../utils/info.helper");


exports.signUp = async (req, res, next) => {
  try {
    const { name, email, phone, location, pincode, password } = req.body;
    if (!name || !email || !phone || !location || !pincode || !password) {
      return next(
        res.status(400).json({
          status: "fail",
          message: "Please provide all required fields!!!"
        })
      );
    }


    let formattedPhone = null;
    if (phone) {
      formattedPhone = formatPhone(phone);
      if (!formattedPhone) {
        return res.status(400).json({
          status: "fail",
          message: "Invalid phone number format. Please provide a valid phone number."
        });
      }
    }

    
    const otp = generateOtp();
    const hashedOtp = await hashOtp(otp);

    const checkexist = await user.findOne({ $or: [{ email }, { phone: formattedPhone }] });
    if (checkexist && !checkexist.isverified) {
      
      checkexist.otp = hashedOtp;
      checkexist.otpExpiry = Date.now() + 10 * 60 * 1000;
      checkexist.otpRequestDate = new Date();
      checkexist.otpRequestCount = 1;
      checkexist.otpCooldown = Date.now() + 60 * 1000;
      await checkexist.save();

      try {
        await sendEmail({
          to: email,
          subject: "Welcome to EscapeTravel ! Verify Your Account",
          html: registerOtpTemplate(checkexist.name, otp)
        });
      } catch (err) {
        console.log("Email failed:", err.message);
      }

      const message = otpSMS({
        otp: otp,
        type: "signup", // signup | login | reset | resend
      });

      await sendSMS({
        to: formattedPhone,
        message,
      });
      
      return next(
        res.status(200).json({
          status: "success",
          message: "User already exist but not verified. OTP resent for verification process.",
          redirectToOtp: true
        })
      );
    }
    else if (checkexist && checkexist.isverified) {
      return next(
        res.status(409).json({
          status: "fail",
          message: "User already exist and verified. Please login to your account.",
        })
      );
    }

    try {
      applyOtpSecurity({ email, phone: formattedPhone });
    } catch (err) {
      return next(
        res.status(429).json({
          status: "fail",
          message: err.message,
        })
      );
    }

    const salt = await bcrypt.genSalt(10)
    const hashpassword = await bcrypt.hash(password, salt);

    const userData = new user({
      name,
      email,
      phone: formattedPhone,
      location,
      pincode,
      password: hashpassword,
      otp: hashedOtp,
      otpExpiry: Date.now() + 10 * 60 * 1000,
      otpRequestDate: new Date(),
      otpRequestCount: 1,
      otpCooldown: Date.now() + 60 * 1000,
    });
    await userData.save();

    try {
      await sendEmail({
        to: email,
        subject: "Welcome to EscapeTravel ! Verify Your Account",
        html: registerOtpTemplate(name, otp)
      });
    } catch (err) {
      console.log("Email failed:", err.message);
    }

    const newmessage = otpSMS({
      otp: otp,
      type: "signup", // signup | login | reset | resend
    });

    await sendSMS({
      to: formattedPhone,
      message: newmessage,
    });

    res.status(201).json({
      status: "success",
      message: "OTP sent for verification Process",
      data: userData
    });
  } catch (err) {
    res.status(400).json({
      status: "error",
      message: err.message
    });
  }
};

exports.verifySignupOTP = async (req, res, next) => {
  try {
    const { email, phone, otp } = req.body;
    if ((!email && !phone) || !otp) {
      return next(
        res.status(400).json({
          status: "fail",
          message: "Please provide email or phone and otp!!!"
        })
      );
    }

    let formattedPhone = null;
    if (phone) {
      formattedPhone = formatPhone(phone);
      if (!formattedPhone) {
        return res.status(400).json({
          status: "fail",
          message: "Invalid phone number format. Please provide a valid phone number."
        });
      }
    }

    const checkexist = await user.findOne({ $or: [{ email }, { phone: formattedPhone }] });
    if (!checkexist) {
      return next(
        res.status(404).json({
          status: "fail",
          message: "User does not exist with this email or phone number"
        })
      );
    }

    try {
      await checkOtpBlock(checkexist);
    } catch (err) {
      return next(
        res.status(429).json({
          status: "fail",
          message: err.message,
        })
      );
    }

    if (checkexist.otpExpiry < Date.now()) {
      return next(
        res.status(410).json({
          status: "fail",
          message: "OTP has expired. Please request a new one."
        })
      );
    }

    const cleanOtp = otp.trim();

    if (!checkexist.otp) {
      return res.status(400).json({
        status: "fail",
        message: "OTP not found. Please request again.",
      });
    }

    const isOtpValid = await compareOtp(cleanOtp, checkexist.otp);

    if (!isOtpValid) {
      checkexist.otpAttempts += 1;

      if (checkexist.otpAttempts >= 5) {
        checkexist.otpBlockedUntil = Date.now() + 30 * 60 * 1000;
        checkexist.otpAttempts = 0;
      }

      await checkexist.save();

      return res.status(400).json({
        status: "fail",
        message: "Invalid OTP. Please try again.",
      });
    }

    checkexist.isverified = true;
    checkexist.otp = null;
    checkexist.otpExpiry = null;
    checkexist.deleteAt = null;
    checkexist.otpRequestCount = 0;
    checkexist.otpCooldown = null;
    checkexist.otpAttempts = 0;
    checkexist.otpBlockedUntil = null;
    await checkexist.save();


    try {
      await sendEmail({
        to: email || checkexist.email,
        subject: "Welcome to EscapeTravel - Registration Successful 🎉",
        html: registerSuccessTemplate(checkexist.name)
      });
    } catch (err) {
      console.log("Email failed:", err.message);
    }

    res.status(200).json({
      status: "success",
      message: "OTP verified successfully",
      data: checkexist,
      user: {
        _id: checkexist._id,
        email: checkexist.email,
        name: checkexist.name,
        role: checkexist.role
      }
    });
  } catch (err) {
    res.status(400).json({
      status: "error",
      message: err.message
    });
  }
};



exports.login = async (req, res, next) => {
  try {
    const { email, phone, password } = req.body;

    if ((!email && !phone) || !password) {
      return next(
        res.status(400).json({
          status: "fail",
          message: "Please provide email or phone and password!!!",
        })
      );
    }

    let formattedPhone = null;
    if (phone) {
      formattedPhone = formatPhone(phone);
      if (!formattedPhone) {
        return res.status(400).json({
          status: "fail",
          message: "Invalid phone number format. Please provide a valid phone number."
        });
      }
    }

    const checkexist = await user.findOne({ $or: [{ email }, { phone: formattedPhone }] });
    if (!checkexist) {
      return next(
        res.status(404).json({
          status: "fail",
          message: "User does not exist with this email or phone number",
        })
      );
    }

    const otp = generateOtp();
    const hashedOtp = await hashOtp(otp);

    if (!checkexist.isverified) {
      
      checkexist.otp = hashedOtp;
      checkexist.otpExpiry = Date.now() + 10 * 60 * 1000;
      checkexist.otpRequestDate = new Date();
      checkexist.otpRequestCount = 1;
      checkexist.otpCooldown = Date.now() + 60 * 1000;
      await checkexist.save();

      
      try {
        await sendEmail({
          to: email || checkexist.email,
          subject: "Welcome to EscapeTravel ! Verify Your Account",
          html: registerOtpTemplate(checkexist.name, otp)
        });
      } catch (err) {
        console.log("Email failed:", err.message);
      }

      const message = otpSMS({
        otp: otp,
        type: "signup", // signup | login | reset | resend
      });

      await sendSMS({
        to: formattedPhone || checkexist.phone,
        message,
      });

      return next(
        res.status(200).json({
          status: "success",
          message: "Please verify your account first to login. OTP resent for verification process.",
          redirectToOtp: true
        })
      );
    }

    const checkpassword = await bcrypt.compare(password, checkexist.password);
    if (!checkpassword) {
      return (
        res.status(401).json({
          status: "fail",
          message: "Invalid password. Please provide the correct password to login.",
        })
      );
    }

    try {
      applyOtpSecurity(checkexist);
    } catch (err) {
      return next(
        res.status(429).json({
          status: "fail",
          message: err.message,
        })
      );
    }
  
    checkexist.otp = hashedOtp;
    checkexist.otpExpiry = Date.now() + 10 * 60 * 1000;
    await checkexist.save();

    try {
      await sendEmail({
        to: checkexist.email,
        subject: "EscapeTravel Login OTP - Verify Your Identity 🔐",
        html: loginOtpTemplate(checkexist.name, otp)
      });
    } catch (err) {
      console.log("Email failed:", err.message);
    }

    const otpMessage = otpSMS({
      otp: otp,
      type: "login", // signup | login | reset | resend
    });

    await sendSMS({
      to: checkexist.phone,
      message: otpMessage,
    });

    res.status(200).json({
      status: "success",
      message: "OTP sent for verification Process",
      data: checkexist
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};


exports.verifyLoginOTP = async (req, res, next) => {
  try {
    const { email, phone, otp } = req.body;
    if ((!email && !phone) || !otp) {
      return next(
        res.status(400).json({
          status: "fail",
          message: "Please provide email or phone and otp!!!"
        })
      );
    }

    let formattedPhone = null;
    if (phone) {
      formattedPhone = formatPhone(phone);
      if (!formattedPhone) {
        return res.status(400).json({
          status: "fail",
          message: "Invalid phone number format. Please provide a valid phone number."
        });
      }
    }

    const checkexist = await user.findOne({ $or: [{ email }, { phone: formattedPhone }] });
    if (!checkexist) {
      return next(
        res.status(404).json({
          status: "fail",
          message: "User does not exist with this email or phone number"
        })
      );
    }

    try {
      await checkOtpBlock(checkexist);
    } catch (err) {
      return next(
        res.status(429).json({
          status: "fail",
          message: err.message,
        })
      );
    }

    if (checkexist.otpExpiry < Date.now()) {
      return next(
        res.status(410).json({
          status: "fail",
          message: "OTP has expired. Please request a new one."
        })
      );
    }

    const cleanOtp = otp.trim();
    const isOtpValid = await compareOtp(cleanOtp, checkexist.otp);
    if (!isOtpValid) {
      checkexist.otpAttempts += 1;
      if (checkexist.otpAttempts >= 5) {
        checkexist.otpBlockedUntil = Date.now() + 30 * 60 * 1000; // Block for 30 minutes
        checkexist.otpAttempts = 0; // Reset attempts after blocking
      }
      await checkexist.save();
      return next(
        res.status(400).json({
          status: "fail",
          message: "Invalid OTP provided or wrong OTP entered multiple times. Please try again later."
        })
      );
    }


    checkexist.otp = null;
    checkexist.otpExpiry = null;
    checkexist.otpRequestCount = 0;
    checkexist.otpCooldown = null;
    checkexist.otpAttempts = 0;
    checkexist.otpBlockedUntil = null;
    await checkexist.save();

    const device = getDevice(req);
    const ip = getIP(req);
    const location = await getLocation(ip);

    console.log (device, ip, location)


    try {
      await sendEmail({
        to: email || checkexist.email,
        subject: "EscapeTravel Login Successful - New Device Alert ✅",
        html: loginSuccessTemplate(
          checkexist.name,
          new Date().toLocaleString(),
          device,
          location,
          "#"
        )
      });
    } catch (err) {
      console.log("Email failed:", err.message);
    }


    const payload = {
      _id: checkexist._id , 
      role: checkexist.role,
    }
    const accessToken = generateAccessToken(payload);
    const refreshPayload = {
      _id: checkexist._id,
      role: checkexist.role
    }
    const refreshToken = generateRefreshToken(refreshPayload);

    // ✅ Create session with role
    await Session.create({
      userId: checkexist._id,
      role: checkexist.role,
      refreshToken,
      device,
      ip,
      location,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false, // true in production
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({
      status: "success",
      message: "OTP verified successfully",
      accessToken,
      role: checkexist.role,
      data: checkexist,
      user: {
        _id: checkexist._id,
        email: checkexist.email,
        name: checkexist.name,
        role: checkexist.role
      }
    });
  } catch (err) {
    res.status(400).json({
      status: "error",
      message: err.message
    });
  }
};

exports.forgetPassword = async (req, res, next) => {
  try {
    const { email, phone } = req.body;
    if (!email && !phone) {
      return next(
        res.status(400).json({
          status: "fail",
          message: "Please provide Email or Phone !!!"
        })
      );
    }

    let formattedPhone = null;
    if (phone) {
      formattedPhone = formatPhone(phone);
      if (!formattedPhone) {
        return res.status(400).json({
          status: "fail",
          message: "Invalid phone number format. Please provide a valid phone number."
        });
      }
    }

    const checkexist = await user.findOne({ $or: [{ email }, { phone: formattedPhone }] });
    if (!checkexist) {
      return next(
        res.status(404).json({
          status: "fail",
          message: "User does not exist with this email or phone number",
        })
      );
    }

    try {
      applyOtpSecurity(checkexist);
    } catch (err) {
      return next(
        res.status(429).json({
          status: "fail",
          message: err.message,
        })
      );
    }

    const otp = generateOtp();
    const hashedOtp = await hashOtp(otp);

    checkexist.otp = hashedOtp;
    checkexist.otpExpiry = Date.now() + 5 * 60 * 1000;
    await checkexist.save();

    try {
      await sendEmail({
        to: email || checkexist.email,
        subject: "EscapeTravel Password Reset OTP - Verify Your Identity 🔐",
        html: forgotPasswordOtpTemplate(checkexist.name, otp)
      });
    } catch (err) {
      console.log("Email failed:", err.message);
    }

    const message = otpSMS({
      otp: otp,
      type: "reset", // signup | login | reset | resend
    });

    await sendSMS({
      to: checkexist.phone,
      message,
    });

    res.status(200).json({
      status: "Success",
      message: "Otp sent successfully"
    });
  } catch (err) {
    res.status(400).json({
      status: "error",
      message: err.message
    });
  }
};


exports.verifyOtp = async (req, res, next) => {
  try {
    const { email, phone, otp } = req.body;
    if ((!email && !phone) || !otp) {
      return next(
        res.status(400).json({
          status: "fail",
          message: "Please provide email or phone and otp!!!"
        })
      );
    }

    let formattedPhone = null;
    if (phone) {
      formattedPhone = formatPhone(phone);
      if (!formattedPhone) {
        return res.status(400).json({
          status: "fail",
          message: "Invalid phone number format. Please provide a valid phone number."
        });
      }
    }

    const checkexist = await user.findOne({ $or: [{ email }, { phone: formattedPhone }] });
    if (!checkexist) {
      return next(
        res.status(404).json({
          status: "fail",
          message: "User does not exist"
        })
      );
    }

    try {
      await checkOtpBlock(checkexist);
    } catch (err) {
      return next(
        res.status(429).json({
          status: "fail",
          message: err.message,
        })
      );
    }

    if (checkexist.otpExpiry < Date.now()) {
      return next(
        res.status(410).json({
          status: "fail",
          message: "OTP has expired. Please request a new one."
        })
      );
    }

    const cleanOtp = otp.trim();
    const isOtpValid = await compareOtp(cleanOtp, checkexist.otp);
    if (!isOtpValid) {
      checkexist.otpAttempts += 1;
      if (checkexist.otpAttempts >= 5) {
        checkexist.otpBlockedUntil = Date.now() + 30 * 60 * 1000; // Block for 30 minutes
        checkexist.otpAttempts = 0; // Reset attempts after blocking
      }
      await checkexist.save();
      return next(
        res.status(400).json({
          status: "fail",
          message: "Invalid OTP provided or wrong OTP entered multiple times. Please try again later."
        })
      );
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    console.log("Reset Token:", resetToken);
    console.log("Hashed Reset Token:", hashedResetToken);


    checkexist.otp = null;
    checkexist.otpExpiry = null;
    checkexist.otpRequestCount = 0;
    checkexist.otpCooldown = null;
    checkexist.otpAttempts = 0;
    checkexist.otpBlockedUntil = null;
    checkexist.isOtpVerified = true;
    checkexist.resetPasswordToken = hashedResetToken;
    checkexist.resetPasswordTokenExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes expiry for reset token
    await checkexist.save();

    console.log("User after OTP verification and reset token generation:", checkexist.resetPasswordToken, checkexist.resetPasswordTokenExpiry);

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    try {
      await sendEmail({
        to: email || checkexist.email,
        subject: "Reset Your EscapeTravel Password - OTP Verified ✅",
        html: resetPasswordTemplate(checkexist.name, resetUrl)
      });
    } catch (err) {
      console.log("Email failed:", err.message);
    }

    res.status(200).json({
      status: "success",
      message: "OTP verified successfully",
      data: checkexist,
      resetToken: resetToken, // Send the reset token to the frontend for redirection
      user: {
        _id: checkexist._id,
        email: checkexist.email,
        name: checkexist.name,
        role: checkexist.role
      }
    });
  } catch (err) {
    res.status(400).json({
      status: "error",
      message: err.message
    });
  }
};


exports.resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    if (!token) {
      return next(
        res.status(400).json({
          status: "fail",
          message: "Reset token is required in the URL parameters",
        })
      );
    }

    const { password, confirmPassword } = req.body;
    if ( !password || !confirmPassword) {
      return next(
        res.status(400).json({
          status: "fail",
          message: "Please provide password and confirm password!!!",
        })
      );
    }

    if (password !== confirmPassword) {
      return next(
        res.status(400).json({
          status: "fail",
          message: "Password and confirm password do not match. Please provide matching passwords.",
        })
      );
    } 

    console.log("Incoming Token:", req.params.token);

    const hashToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    console.log("Generated Hash:", hashToken);

    const checkexist = await user.findOne({
      resetPasswordToken: hashToken,
      resetPasswordTokenExpiry: { $gt: Date.now() }
    });

    console.log("User Found:", checkexist);

    if (!checkexist) {
      return next(
        res.status(400).json({
          status: "fail",
          message: "Invalid or expired reset password token",
        })
      );
    }

    if (!checkexist.resetPasswordToken || !checkexist.resetPasswordTokenExpiry) {
      return next(
        res.status(400).json({
          status: "fail",
          message: "Invalid or expired reset password token",
        })
      );
    }

    if (checkexist.isOtpVerified !== true) {
      return res.status(403).json({
        status: "fail",
        message: "OTP verification required before resetting password",
      });
    }

    const checkpassword = await bcrypt.compare(password, checkexist.password);
    if (checkpassword) {
      return (
        res.status(409).json({
          status: "fail",
          message: "Password already used. Try a new one.",
        })
      );
    }

    const salt = await bcrypt.genSalt(10)
    const hashpassword = await bcrypt.hash(password, salt);
    const changePassword = await checkexist.updateOne({ password: hashpassword });
    checkexist.resetPasswordToken = null;
    checkexist.resetPasswordTokenExpiry = null;
    checkexist.isOtpVerified = false;
    await checkexist.save();

    await Session.updateMany(
      { userId: checkexist._id },
      { isValid: false }
    );

    try {
      await sendEmail({
        to: checkexist.email,
        subject: "Confirmation of Password Change - Your EscapeTravel Account 🔐",
        html: passwordChangedTemplate(checkexist.name)
      });
    } catch (err) {
      console.log("Email failed:", err.message);
    }

    console.log(changePassword)

    res.status(200).json({
      status: "Success",
      message: "Password reset successfully",
      data: checkexist
    });
  } catch (err) {
    res.status(400).json({
      status: "error",
      message: err.message
    });
  }
};


exports.resendOtp = async (req, res, next) => {
  try {
    const { email, phone } = req.body;
    if (!email && !phone) {
      return next(
        res.status(400).json({
          status: "fail",
          message: "Please provide Email or Phone !!!"
        })
      );
    }

    let formattedPhone = null;
    if (phone) {
      formattedPhone = formatPhone(phone);
      if (!formattedPhone) {
        return res.status(400).json({
          status: "fail",
          message: "Invalid phone number format. Please provide a valid phone number."
        });
      }
    }

    const checkexist = await user.findOne({ $or: [{ email }, { phone: formattedPhone }] });
    if (!checkexist) {
      return next(
        res.status(404).json({
          status: "fail",
          message: "User does not exist with this email or phone number",
        })
      );
    }

    
    try {
      applyOtpSecurity(checkexist);
    } catch (err) {
      return next(
        res.status(429).json({
          status: "fail",
          message: err.message,
        })
      );
    }

    const otp = generateOtp();
    const hashedOtp = await hashOtp(otp);
    
    checkexist.otp = hashedOtp;
    checkexist.otpExpiry = Date.now() + 5 * 60 * 1000;
    await checkexist.save();


    try {
      await sendEmail({
        to: email || checkexist.email,
        subject: "EscapeTravel OTP Resend - Verify Your Identity 🔐",
        html: resendOtpTemplate(checkexist.name, otp)
      });
    } catch (err) {
      console.log("Email failed:", err.message);
    }

    const message = otpSMS({
      otp: otp,
      type: "resend", // signup | login | reset | resend
    });

    await sendSMS({
      to: checkexist.phone,
      message,
    });

    res.status(200).json({
      status: "Success",
      message: "Otp sent successfully"
    });
  } catch (err) {
    res.status(400).json({
      status: "error",
      message: err.message
    });
  }
};


exports.refreshSession = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      return res.status(401).json({
        message: "No session"
      });
    }

    // ✅ Verify refresh token
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    // ✅ Find session in DB
    const session = await Session.findOne({
      refreshToken: token,
      isValid: true
    });

    if (!session) {
      return res.status(403).json({
        message: "Invalid session",
      });
    }

    // 🔐 Detect token reuse attack
    if (session.refreshToken !== token) {
      await Session.updateMany(
        { userId: decoded._id },
        { isValid: false }
      );

      return res.status(403).json({
        message: "Session compromised. Please login again."
      });
    }

    // ✅ Check DB expiry
    if (session.expiresAt < new Date()) {
      return res.status(403).json({
        message: "Session expired"
      });
    }

    // 🔁 ROTATE TOKENS (IMPORTANT 🔥)
    const newAccessToken = generateAccessToken({
      _id: decoded._id,
      role: decoded.role
    });

    const newRefreshToken = generateRefreshToken({
      _id: decoded._id,
      role: decoded.role
    });

    // ✅ UPDATE SESSION
    session.refreshToken = newRefreshToken;
    session.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    session.isValid = true;
    await session.save();

    // 🍪 SET NEW COOKIE
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: false, // true in production
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({
      accessToken: newAccessToken,
      role: decoded.role
    });

  } catch (err) {
    res.status(403).json({
      message: "Session expired or invalid"
    });
  }
};


exports.logout = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;

    // If no token → already logged out
    if (!token) {
      return res.status(200).json({
        status: "success",
        message: "Already logged out"
      });
    }

    // Invalidate this session
    await Session.findOneAndUpdate(
      { refreshToken: token },
      { isValid: false }
    );

    // Clear cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: false, // ✅ true in production (HTTPS)
      sameSite: "Strict"
    });

    return res.status(200).json({
      status: "success",
      message: "Logged out successfully"
    });

  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: err.message
    });
  }
};



exports.logoutAll = async (req, res) => {
  try {
    const userId = req.user._id;

    // Invalidate all sessions of this user
    await Session.updateMany(
      { userId },
      { isValid: false }
    );

    // Clear cookie (current device)
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: false, // ✅ true in production
      sameSite: "Strict"
    });

    return res.status(200).json({
      status: "success",
      message: "Logged out from all devices"
    });

  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: err.message
    });
  }
};



exports.googleLogin = async (req, res) => {
  try {
    const { accessToken } = req.body;

    // --------------------------------
    // 1. Check Google access token
    // --------------------------------

    if (!accessToken) {
      return res.status(400).json({
        status: "fail",
        message: "Google access token is required",
      });
    }

    // --------------------------------
    // 2. Get Google user information
    // --------------------------------

    const oauth2Client = new google.auth.OAuth2();

    oauth2Client.setCredentials({
      access_token: accessToken,
    });

    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: "v2",
    });

    const { data } = await oauth2.userinfo.get();

    console.log("Google user information:", data);

    const { id: googleId, email, name, picture } = data;

    // --------------------------------
    // 3. Validate Google email
    // --------------------------------

    if (!email) {
      return res.status(400).json({
        status: "fail",
        message: "Email not found in Google account",
      });
    }

    // --------------------------------
    // 4. Find existing user
    // --------------------------------

    let existingUser = await user.findOne({
      email,
    });

    // --------------------------------
    // 5. Create new Google user
    // --------------------------------

    if (!existingUser) {
      existingUser = await user.create({
        name: name || "Google User",

        email,

        googleId,

        profileImage: picture,

        authProvider: "google",

        isverified: true,

        deleteAt: null,

        role: "user",
      });
    }

    // --------------------------------
    // 6. Existing user
    // --------------------------------
    else {
      // Connect Google account
      if (!existingUser.googleId) {
        existingUser.googleId = googleId;
      }

      if (name) {
        existingUser.name = name;
      }

      if (picture) {
        existingUser.profileImage = picture;
      }

      existingUser.isverified = true;

      existingUser.deleteAt = null;

      /*
       * IMPORTANT
       *
       * If this is an existing manual user,
       * DON'T change authProvider to google.
       *
       * Otherwise you convert the manual account
       * into a Google account.
       */

      if (existingUser.authProvider !== "manual") {
        existingUser.authProvider = "google";
      }

      await existingUser.save();
    }

    // --------------------------------
    // 7. Device information
    // --------------------------------

    const device = getDevice(req);

    const ip = getIP(req);

    const location = await getLocation(ip);

    // --------------------------------
    // 8. Generate JWT access token
    // --------------------------------

    const payload = {
      _id: existingUser._id,
      role: existingUser.role,
    };

    const JWTaccessToken = generateAccessToken(payload);

    // --------------------------------
    // 9. Generate refresh token
    // --------------------------------

    const JWTrefreshToken = generateRefreshToken(payload);

    // --------------------------------
    // 10. Create session
    // --------------------------------

    await Session.create({
      userId: existingUser._id,

      role: existingUser.role,

      refreshToken: JWTrefreshToken,

      device,

      ip,

      location,

      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    // --------------------------------
    // 11. Set refresh token cookie
    // --------------------------------

    res.cookie("refreshToken", JWTrefreshToken, {
      httpOnly: true,

      secure: false, // true in production

      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // --------------------------------
    // 12. Send response
    // --------------------------------

    return res.status(200).json({
      status: "success",

      message: "Google login successful",

      accessToken: JWTaccessToken,

      role: existingUser.role,

      user: {
        _id: existingUser._id,

        email: existingUser.email,

        name: existingUser.name,

        role: existingUser.role,

        profileImage: existingUser.profileImage,
      },
    });
  } catch (err) {
    console.error("Google login error:", err);

    return res.status(500).json({
      status: "error",

      message: err.message,
    });
  }
};