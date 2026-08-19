const mongoose = require("mongoose");

const authSchema = new mongoose.Schema(
    {
    name: {
        type: String,
        required: [true, "Please provide your name"],
    },
    email: {
        type: String,
        required: [true, "Please provide your email"],          
        unique: true,
    },
    authProvider: {
      type: String,
      enum: ["manual", "google", "facebook", "github"],
      default: "manual"
    },
    phone : {
        type: String,
        required: [function() {
            return this.authProvider === "manual";
        }, "Please provide your phone number"],
        unique: true,
    },
    formattedPhone : {
        type: String,
    },
    location: {
        type: String,
        required: [function() {
            return this.authProvider === "manual";
        }, "Please provide your location"],       
    },
    pincode : {
        type: String,
        required: [function() {
            return this.authProvider === "manual";
        }, "Please provide your pincode"],
    },
    password: {
        type: String,
        required: [function() {
            return this.authProvider === "manual";
        }, "Please provide your password"],
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    profileImage: {
      type: String,
    },
    otp : {
        type: String,
    },
    otpExpiry : {
        type: Date,
    },
    otpCooldown: {
        type: Date,
    },
    otpRequestCount: { 
        type: Number,
        default: 0 
    },
    otpAttempts: {
        type: Number,
        default: 0
    },
    otpBlockedUntil: {
        type: Date
    },
    isverified : {
        type: Boolean,
        default: false,
    },
    isOtpVerified: {
        type: Boolean,
        default: false,
    },
    resetPasswordToken: {
        type: String,
    },
    resetPasswordTokenExpiry: {
        type: Date,
    },
    otpRequestDate: {
        type: Date,
    },
    deleteAt: {
        type: Date,
        default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        index: { expires: 0 }
    },
    loginAttempts: { 
        type: Number, 
        default: 0 
    },
    lockUntil: {
        type: Date,
        default: null
    },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user"
    }
},
{
    timestamps: true,
},
);

module.exports = mongoose.model("Auth", authSchema);
