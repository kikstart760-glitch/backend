const adminOtpSMS = ({
  otp,
  type,
  appName = "EscapeTravel Admin",
  expiry = 5
}) => {
  const brand = `[${appName}]`;

  switch (type) {
    case "signup":
      return `${brand} Admin account verification code: ${otp}. It expires in ${expiry} minutes. Do not share this code with anyone.`;

    case "login":
      return `${brand} Admin login verification code: ${otp}. It is valid for ${expiry} minutes. If this wasn't you, secure your admin account immediately.`;

    case "reset":
      return `${brand} Admin password reset code: ${otp}. This code will expire in ${expiry} minutes. Do not share it. If you didn't request this, secure your account immediately.`;

    case "resend":
      return `${brand} Your admin OTP has been resent: ${otp}. It is valid for ${expiry} minutes. Do not share this code. If you did not request this, please ignore this message.`;

    default:
      return `${brand} Your admin OTP is ${otp}. Valid for ${expiry} minutes. Do not share this code.`;
  }
};

module.exports = { adminOtpSMS };