import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import Connectdb from "@/lib/dbConnect";
import User from "@/models/User";
import { signJwt } from "@/lib/jwt";
import { generateOtp } from "@/lib/otp";
import { sendEmail } from "@/lib/mailer";

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    await Connectdb();

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // 🚨 If not verified → regenerate OTP and send again
    if (!user.isVerified) {
      const { otp, hashedOtp, expiresAt } = await generateOtp(user._id);

      user.otp = hashedOtp;
      user.otpExpiresAt = expiresAt;
      await user.save();

      await sendEmail(
        user.email,
        "Verify your account",
        `Hello ${user.fullName},\n\nYour OTP is: ${otp}\nIt will expire in 5 minutes.`
      );

      return NextResponse.json(
        {
          error: "User not verified",
          message: "OTP sent to your email. Please verify your account.",
          userId: user._id,
        },
        { status: 403 }
      );
    }

    // ✅ Verified → Generate JWT
    const token = await signJwt(
      {
        sub: user._id.toString(),
        role: user.role,
        email: user.email,
      },
      3600 // 1h expiry
    );

    // 👇 exclude password from response
    const { password: _, otp, otpExpiresAt, ...safeUser } = user.toObject();

    return NextResponse.json({
      message: "User login successful ✅",
      token,
      user: safeUser,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// import { NextResponse } from "next/server";
// import bcrypt from "bcryptjs";
// import Connectdb from "@/lib/dbConnect";
// import User from "@/models/User";
// import { signJwt } from "@/lib/jwt";

// export async function POST(req) {
//   try {
//     const { email, password } = await req.json();
//     await Connectdb();

//     const user = await User.findOne({ email });
//     if (!user) {
//       return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
//     }

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
//     }
//    if (!user.isVerified) {
//       return NextResponse.json(
//         { error: "User not verified. Please verify your account first." },
//         { status: 403 }
//       );
//     }
//     // ✅ Generate JWT with sub claim
//     const token = await signJwt(
//       {
//         sub: user._id.toString(), // 👈 important!
//         role: user.role,
//         email: user.email,
//       },
//       3600 // 1h expiry
//     );

//     // 👇 remove password before sending user info
//     const { password: _, ...safeUser } = user.toObject();

//     return NextResponse.json({
//       message: "User login successful ✅",
//       token,
//       user: safeUser,
//     });
//   } catch (err) {
//     return NextResponse.json({ error: err.message }, { status: 500 });
//   }
// }


// // app/api/auth/login/route.js
// import { NextResponse } from "next/server";
// import bcrypt from "bcryptjs";
// import Connectdb from "@/lib/dbConnect";
// import User from "@/models/User";
// import { signJwt } from "@/lib/jwt";

// export async function POST(req) {
//   try {
//     const { email, password } = await req.json();
//     await Connectdb();

//     const user = await User.findOne({ email });
//     if (!user) {
//       return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
//     }

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
//     }

//     // ✅ Generate JWT with sub claim
//     const token = await signJwt(
//       {
//         sub: user._id.toString(), // 👈 important!
//         role: user.role,
//         email: user.email,
//       },
//       3600 // 1h expiry
//     );

//     return NextResponse.json({ token });
//   } catch (err) {
//     return NextResponse.json({ error: err.message }, { status: 500 });
//   }
// }
