// app/api/auth/verify-otp/route.js
import Connectdb from "../../../../lib/dbConnect";
import User from "../../../../models/User";
import bcrypt from "bcryptjs";
import { signJwt } from "../../../../lib/jwt";

export async function POST(req) {
  try {
    await Connectdb();

    const { userId, otp } = await req.json();

    if (!userId || !otp) {
      return new Response(JSON.stringify({ error: "userId and otp are required" }), { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
    }

    if (!user.otp || !user.otpExpiresAt) {
      return new Response(JSON.stringify({ error: "No OTP found for this user" }), { status: 400 });
    }

    if (new Date() > user.otpExpiresAt) {
      return new Response(JSON.stringify({ error: "OTP expired" }), { status: 400 });
    }

    const isMatch = await bcrypt.compare(otp, user.otp);
    if (!isMatch) {
      return new Response(JSON.stringify({ error: "Invalid OTP" }), { status: 400 });
    }

    // ✅ Mark user as verified
    user.isVerified = true;
    user.otp = null;
    user.otpExpiresAt = null;
    await user.save();

    // ✅ Issue JWT token
    const token = await signJwt({ sub: user._id, email: user.email, role: user.role });

    return new Response(
      JSON.stringify({
        message: "OTP verified successfully",
      
        user: { id: user._id, email: user.email, role: user.role, fullName: user.fullName },
      }),
      { status: 200 }
    );

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
