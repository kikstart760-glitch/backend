const mongoose = require("mongoose");

const socialAuthSchema = new mongoose.Schema(
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
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    profileImage: {
      type: String,
    },
    isverified : {
        type: Boolean,
        default: false,
    },
    authProvider: {
      type: String,
      enum: ["manual", "google", "facebook", "github"],
      default: "manual"
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

module.exports = mongoose.model("SocialAuth", socialAuthSchema);
