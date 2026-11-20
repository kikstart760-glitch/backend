// ================= BASE TEMPLATE =================
const adminBaseTemplate = (content) => `
<!DOCTYPE html>
<html>
<body style="margin:0; padding:0; background-color:#eaf2f7; font-family:Arial, sans-serif;">

  <!-- PREHEADER -->
  <div style="display:none; max-height:0; overflow:hidden;">
    Secure Admin Access - Escape Beyond Travel
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#eaf2f7;">
    <tr>
      <td align="center">

        <!-- MAIN CONTAINER -->
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;">

          <!-- HEADER -->
          <tr>
            <td align="center" style="padding:30px 20px; background:#0f2f3a; color:#ffffff;">
              <img src="cid:logo" width="120" style="margin-bottom:10px;" />

              <div style="font-size:24px; font-weight:bold;">
                Escape Beyond Travel
              </div>

              <div style="font-size:14px; margin-top:8px;">
                Admin Portal | Secure Management
              </div>
            </td>
          </tr>

          <!-- CONTENT (CENTERED + CARD) -->
          <tr>
            <td align="center" style="background:#eaf2f7; padding:30px;">

              <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff; border:1px solid #e3e8ee;">
                <tr>
                  <td align="center" style="padding:30px; color:#333; text-align:center;">
                    ${content}
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td align="center" style="padding:20px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td bgcolor="#2bb3c0" style="padding:12px 25px;">
                    <a href="#" style="color:#ffffff; text-decoration:none; font-size:14px;">
                      Open Admin Dashboard
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="
              background:#0f2f3a;
              color:#cfd8dc;
              text-align:center;
              padding:20px;
              font-size:12px;
            ">
              <div>Escape Beyond Travel Admin</div>
              <div style="margin-top:5px;">Secure Administration Portal</div>
              <div style="margin-top:8px; font-size:11px;">
                support@escapetravel.com
              </div>
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
const adminTitleStyle = `
  font-size:20px;
  font-weight:bold;
  margin-bottom:12px;
  color:#0f2f3a;
  text-align:center;
`;

const adminTextStyle = `
  font-size:14px;
  line-height:1.7;
  color:#555;
  margin-bottom:15px;
  text-align:center;
`;

const adminOtpStyle = `
  font-size:30px;
  letter-spacing:10px;
  text-align:center;
  background:#f0f4f8;
  padding:18px;
  margin:25px auto;
  font-weight:bold;
  color:#0f2f3a;
  display:inline-block;
`;

const adminBtnStyle = `
  display:inline-block;
  padding:12px 25px;
  background:#2bb3c0;
  color:#ffffff;
  text-decoration:none;
  font-size:14px;
  margin-top:10px;
`;


// ================= ADMIN AUTH EMAILS =================

// Admin Register Success
const adminRegisterSuccessTemplate = (name) =>
  adminBaseTemplate(`
    <div style="${adminTitleStyle}">Welcome to Escape Beyond Travel Admin, ${name} 🎉</div>
    <p style="${adminTextStyle}">Your administrator account has been successfully created.</p>
    <p style="${adminTextStyle}">You now have access to the admin portal to manage the platform.</p>
  `);


// Admin Register OTP
const adminRegisterOtpTemplate = (name, otp) =>
  adminBaseTemplate(`
    <div style="${adminTitleStyle}">Verify Your Admin Account</div>
    <p style="${adminTextStyle}">Hi ${name}, use the OTP below to verify your administrator account:</p>
    <div style="${adminOtpStyle}">${otp}</div>
    <p style="${adminTextStyle}">Valid for 10 minutes. Do not share this code with anyone.</p>
  `);


// Admin Login OTP
const adminLoginOtpTemplate = (name, otp) =>
  adminBaseTemplate(`
    <div style="${adminTitleStyle}">Admin Login Verification</div>
    <p style="${adminTextStyle}">Hello ${name}, use the following OTP to securely access the admin portal:</p>
    <div style="${adminOtpStyle}">${otp}</div>
    <p style="${adminTextStyle}">If you did not attempt to log in, do not share this code and secure your account.</p>
  `);


// Admin Login Success
const adminLoginSuccessTemplate = (name, date, location, device, resetLink) =>
  adminBaseTemplate(`
    <div style="${adminTitleStyle}">Admin Login Successful, ${name} ✅</div>

    <p style="${adminTextStyle}">
      You have successfully logged into the Escape Beyond Travel Admin Portal.
    </p>

    <p style="${adminTextStyle}">
      <strong>Admin Login Details:</strong><br/>
      📅 Date: ${date}<br/>
      🌍 Location: ${location}<br/>
      📱 Device: ${device}
    </p>

    <p style="${adminTextStyle}">
      If this wasn't you, secure your administrator account immediately.
    </p>

    <a href="${resetLink}" style="${adminBtnStyle}">
      Secure Admin Account
    </a>
  `);


// Admin Forgot Password OTP
const adminForgotPasswordOtpTemplate = (name, otp) =>
  adminBaseTemplate(`
    <div style="${adminTitleStyle}">Admin Password Reset OTP</div>
    <p style="${adminTextStyle}">Hello ${name}, use the following OTP to reset your admin password:</p>
    <div style="${adminOtpStyle}">${otp}</div>
    <p style="${adminTextStyle}">This OTP expires soon. Keep it secure.</p>
  `);


// Admin Reset Password Link
const adminResetPasswordTemplate = (name, link) =>
  adminBaseTemplate(`
    <div style="${adminTitleStyle}">Reset Admin Password</div>
    <p style="${adminTextStyle}">Hi ${name}, click below to reset your administrator password:</p>
    <a href="${link}" style="${adminBtnStyle}">Reset Admin Password</a>
    <p style="${adminTextStyle}">Link expires in 15 minutes.</p>
  `);


// Admin Password Changed
const adminPasswordChangedTemplate = (name) =>
  adminBaseTemplate(`
    <div style="${adminTitleStyle}">Admin Password Changed Successfully</div>
    <p style="${adminTextStyle}">Hi ${name}, your administrator password was updated successfully.</p>
    <p style="${adminTextStyle}">
      If this wasn't you, contact support immediately.
    </p>
    <a href="mailto:support@escapetravel.com" style="${adminBtnStyle}">
      Contact Admin Support
    </a>
  `);


// Admin Resend OTP
const adminResendOtpTemplate = (name, otp) =>
  adminBaseTemplate(`
    <div style="${adminTitleStyle}">Admin OTP Resent Successfully 🔄</div>

    <p style="${adminTextStyle}">
      Hi ${name}, we have resent your admin verification OTP.
    </p>

    <div style="${adminOtpStyle}">${otp}</div>

    <p style="${adminTextStyle}">
      Valid for 10 minutes. Do not share this code with anyone.
    </p>
  `);


// ================= EXPORT =================
module.exports = {
  adminRegisterSuccessTemplate,
  adminRegisterOtpTemplate,
  adminLoginOtpTemplate,
  adminLoginSuccessTemplate,
  adminForgotPasswordOtpTemplate,
  adminResetPasswordTemplate,
  adminPasswordChangedTemplate,
  adminResendOtpTemplate,
};