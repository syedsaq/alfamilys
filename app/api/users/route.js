// app/api/users/route.js
import { NextResponse } from "next/server";
//import { requireAuth } from "../../../../lib/requireAuth";
import { listUsers } from "../../../services/userService";
import * as yup from "yup";
import { validateBody } from "../../../lib/validate";
import { connectDB } from "../../../lib/dbConnect";
import User from "../../../models/User";
import bcrypt from "bcryptjs";
import requireAuth from "@/lib/requireAuth";

const createSchema = yup.object({
  name: yup.string().required(),
  email: yup.string().email().required(),
  password: yup.string().required().min(6),
  role: yup.string().oneOf(["user", "driver", "admin"]).default("user"),
});

export async function GET(req) {
  try {
    await requireAuth(req, ["admin"]);
    const users = await listUsers();
    return NextResponse.json({ data: users });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 401 });
  }
}

export async function POST(req) {
  try {
    await requireAuth(req, ["admin"]);
    const body = await req.json();
    const validated = await validateBody(createSchema, body);
    await connectDB();
    const exists = await User.findOne({ email: validated.email });
    if (exists) return NextResponse.json({ error: "Email exists" }, { status: 400 });
    const passwordHash = await bcrypt.hash(validated.password, 10);
    const user = await User.create({
      name: validated.name,
      email: validated.email,
      passwordHash,
      role: validated.role,
    });
    return NextResponse.json({ data: { id: user._id, name: user.name, email: user.email, role: user.role } }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message, details: err.details || null }, { status: err.status || 400 });
  }
}
