exports.checkOtpBlock = async (user) => {

  // 🔓 AUTO UNBLOCK (VERY IMPORTANT)
  if (user.otpBlockedUntil && user.otpBlockedUntil < Date.now()) {
    user.otpBlockedUntil = null;
    user.otpAttempts = 0;
    await user.save(); // save reset
  }

  // 🚫 STILL BLOCKED
  if (user.otpBlockedUntil && user.otpBlockedUntil > Date.now()) {
    const seconds = Math.ceil(
      (user.otpBlockedUntil - Date.now()) / 1000
    );

    throw new Error(`Too many attempts. Try again in ${seconds}s`);
  }
};