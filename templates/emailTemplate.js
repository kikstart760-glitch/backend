// ================= BASE TEMPLATE =================
const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<body style="margin:0; padding:0; background-color:#f4f6f8; font-family:Arial, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8; padding:20px 0;">
    <tr>
      <td align="center">

        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:8px; overflow:hidden;">
          
          <!-- HEADER -->
          <tr>
            <td align="center" style="background:#ff416c; padding:20px;">
              <img src="cid:logo" width="120" style="display:block;" />
            </td>
          </tr>

          <!-- CONTENT -->
          <tr>
            <td style="padding:30px; color:#333;">
              ${content}
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td align="center" style="font-size:12px; color:#888; padding:20px; background:#fafafa;">
              Need help? support@kikstart.com
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`;


// ================= COMMON STYLES =================
const titleStyle = "font-size:22px; font-weight:bold; margin-bottom:10px;";
const textStyle = "font-size:14px; line-height:1.6; margin-bottom:15px;";
const otpStyle = `
  font-size:28px;
  letter-spacing:8px;
  text-align:center;
  background:#f1f3f6;
  padding:15px;
  border-radius:6px;
  margin:20px 0;
  font-weight:bold;
`;
const btnStyle = `
  display:inline-block;
  padding:12px 25px;
  background:#ff416c;
  color:#ffffff;
  text-decoration:none;
  border-radius:5px;
  font-size:14px;
`;


// ================= AUTH EMAILS =================

// Register Success
const registerSuccessTemplate = (name) =>
  baseTemplate(`
    <div style="${titleStyle}">Welcome to KikStart, ${name} 🎉</div>
    <p style="${textStyle}">Your account has been successfully created.</p>
    <p style="${textStyle}">Start exploring and enjoy 🚀</p>
    <a href="#" style="${btnStyle}">Get Started</a>
  `);

// Register OTP
const registerOtpTemplate = (name, otp) =>
  baseTemplate(`
    <div style="${titleStyle}">Verify Your Account</div>
    <p style="${textStyle}">Hi ${name}, use the OTP below:</p>
    <div style="${otpStyle}">${otp}</div>
    <p style="${textStyle}">Valid for 10 minutes. Do not share.</p>
  `);

// Login OTP
const loginOtpTemplate = (name, otp) =>
  baseTemplate(`
    <div style="${titleStyle}">Login Verification</div>
    <p style="${textStyle}">Hello ${name}, your login OTP:</p>
    <div style="${otpStyle}">${otp}</div>
    <p style="${textStyle}">If not you, secure your account immediately.</p>
  `);

// Login Success
const loginSuccessTemplate = (name, date, location, device, resetLink) =>
  baseTemplate(`
    <div style="${titleStyle}">Login Successful, ${name} ✅</div>

    <p style="${textStyle}">
      Hi ${name}, you have successfully logged into your KikStart account.
    </p>

    <p style="${textStyle}">
      <strong>Login Details:</strong><br/>
      📅 Date: ${date}<br/>
      🌍 Location: ${location}<br/>
      📱 Device: ${device}
    </p>

    <p style="${textStyle}">
      If this wasn't you, secure your account immediately.
    </p>

    <a href="${resetLink}" style="${btnStyle}">
      Secure My Account
    </a>
  `);

// Forgot Password OTP
const forgotPasswordOtpTemplate = (name, otp) =>
  baseTemplate(`
    <div style="${titleStyle}">Password Reset OTP</div>
    <p style="${textStyle}">Hello ${name}, your OTP:</p>
    <div style="${otpStyle}">${otp}</div>
    <p style="${textStyle}">Expires soon. Keep secure.</p>
  `);

// Reset Password Link
const resetPasswordTemplate = (name, link) =>
  baseTemplate(`
    <div style="${titleStyle}">Reset Your Password</div>
    <p style="${textStyle}">Hi ${name}, click below:</p>
    <a href="${link}" style="${btnStyle}">Reset Password</a>
    <p style="${textStyle}">Link expires in 15 minutes.</p>
  `);

// Password Changed
const passwordChangedTemplate = (name) =>
  baseTemplate(`
    <div style="${titleStyle}">Password Changed Successfully</div>
    <p style="${textStyle}">Hi ${name}, your password was updated.</p>
    <p style="${textStyle}">
      If this wasn’t you, contact support immediately.
    </p>
    <a href="mailto:support@kikstart.com" style="${btnStyle}">
      Contact Support
    </a>
  `);

// Resend OTP
const resendOtpTemplate = (name, otp) =>
  baseTemplate(`
    <div style="${titleStyle}">OTP Resent Successfully 🔄</div>

    <p style="${textStyle}">
      Hi ${name}, we have resent your OTP.
    </p>

    <div style="${otpStyle}">${otp}</div>

    <p style="${textStyle}">
      Valid for 10 minutes. Do not share.
    </p>
  `);


// ================= EXPORT =================
module.exports = {
  registerSuccessTemplate,
  registerOtpTemplate,
  loginOtpTemplate,
  loginSuccessTemplate,
  forgotPasswordOtpTemplate,
  resetPasswordTemplate,
  passwordChangedTemplate,
  resendOtpTemplate,
};