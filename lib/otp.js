import bcrypt from "bcryptjs";

export async function generateOtp(userId, length = 6) {
  // numeric OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // hash OTP before storing
  const hashedOtp = await bcrypt.hash(otp, 10);

  // expire in 5 minutes
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  return { otp, hashedOtp, expiresAt }; // send `otp` via email, store `hashedOtp`
}
