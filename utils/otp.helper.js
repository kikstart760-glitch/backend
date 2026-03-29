const bcrypt = require("bcryptjs");

// generate 6 digit OTP
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// hash OTP
const hashOtp = async (otp) => {
  return await bcrypt.hash(otp, 10);
};

// compare OTP
const compareOtp = async (otp, hashedOtp) => {
  return await bcrypt.compare(otp, hashedOtp);
};

module.exports = {
  generateOtp,
  hashOtp,
  compareOtp
};