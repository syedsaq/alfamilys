import  Connectdb  from "../../../../lib/dbConnect";
import User from "../../../../models/User";
import bcrypt from "bcryptjs";
import { generateOtp } from "../../../../lib/otp";
import { sendEmail } from "../../../../lib/mailer";


export async function POST(req) {
  try {
    await Connectdb();

    const body = await req.json();
    const { 
      role, fullName, email, mobile, department, designation, password, cnic,
      vehicleType, model, registrationNumber, seatingCapacity, willingToOfferRide, acAvailable
    } = body;

    // ✅ Basic validation
    if (!role || !["rider", "driver"].includes(role)) {
      return new Response(JSON.stringify({ error: "Role must be rider or driver" }), { status: 400 });
    }

    if (!fullName || !email || !mobile || !department || !designation || !password || !cnic) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }

    // ✅ Driver-specific required fields
    if (role === "driver") {
      if (!vehicleType || !model || !registrationNumber || !seatingCapacity) {
        return new Response(JSON.stringify({ error: "Driver fields are required" }), { status: 400 });
      }
    }

    // ✅ Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return new Response(JSON.stringify({ error: "User already exists" }), { status: 400 });
    }

    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Create new user
    const newUser = await User.create({
      role,
      fullName,
      email,
      mobile,
      department,
      designation,
      password: hashedPassword,
      cnic,
      ...(role === "driver" && {
        vehicleType,
        model,
        registrationNumber,
        seatingCapacity,
        willingToOfferRide,
        acAvailable
      })
    });

    // ✅ Generate OTP
    const { otp, hashedOtp, expiresAt } = await generateOtp(newUser._id);
    newUser.otp = hashedOtp;
    newUser.otpExpiresAt = expiresAt;
    await newUser.save();

    // ✅ Send OTP email
    await sendEmail(
      newUser.email,
      "Your OTP Code",
      `Hello ${newUser.fullName},\n\nYour OTP is: ${otp}\nIt will expire in 5 minutes.`
    );

    return new Response(JSON.stringify({ 
      message: "User registered successfully. OTP sent to email.", 
      userId: newUser._id 
    }), { status: 201 });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}