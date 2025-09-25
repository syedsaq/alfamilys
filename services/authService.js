// services/authService.js
import bcrypt from "bcryptjs";
import User from "../models/User";
import  Connectdb  from "../lib/dbConnect";
import { signJwt } from "../lib/jwt";
import { generateOtp } from "../lib/otp";       // OTP generator
import { sendEmail } from "../lib/mailer"; 
const SALT_ROUNDS = 10;




export async function register(data) {
  await Connectdb();

  const exists = await User.findOne({ email: data.email });
  if (exists) throw new Error("Email already registered");

  // hash password
  const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

  // create user
  const user = await User.create({
    ...data,
    password: hashedPassword,
  });

  // generate OTP
  const { otp, hashedOtp, expiresAt } = await generateOtp(user._id);

  // store hashed OTP & expiry in DB
  user.otp = hashedOtp;
  user.otpExpiresAt = expiresAt;
  await user.save();

  // send OTP email
  await sendEmail(
    user.email,
    "Your OTP Code",
    `Hello ${user.fullName},\n\nYour OTP is: ${otp}\nIt will expire in 5 minutes.`
  );

  return {
    message: "Registration successful, OTP sent to email",
    userId: user._id,
  };
}
export async function login({ email, password }) {
  await Connectdb();
  const user = await User.findOne({ email });
  if (!user) throw new Error("Invalid credentials");
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) throw new Error("Invalid credentials");
  const token = await signJwt({ sub: user._id.toString(), email: user.email, role: user.role });
  return { user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role }, token };
}
// services/authService.js (add this)
export async function verifyOtp(userId, otp) {
  await Connectdb();

  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");
  if (!user.otp || !user.otpExpiresAt) throw new Error("No OTP found");

  if (new Date() > user.otpExpiresAt) throw new Error("OTP expired");

  const isMatch = await bcrypt.compare(otp, user.otp);
  if (!isMatch) throw new Error("Invalid OTP");

  // Mark user as verified
  user.isVerified = true;
  user.otp = null;
  user.otpExpiresAt = null;
  await user.save();

  // issue JWT
  const token = await signJwt({
    sub: user._id.toString(),
    email: user.email,
    role: user.role,
  });

  return {
    message: "OTP verified successfully",
    token,
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    },
  };
}
