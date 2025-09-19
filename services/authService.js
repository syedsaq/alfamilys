// services/authService.js
import bcrypt from "bcryptjs";
import User from "../models/User";
import  Connectdb  from "../lib/dbConnect";
import { signJwt } from "../lib/jwt";

const SALT_ROUNDS = 10;

export async function register({ name, email, password, role = "user" }) {
  await Connectdb();
  const exists = await User.findOne({ email });
  if (exists) throw new Error("Email already registered");
  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({ name, email, password: hashed, role });
  const token = await signJwt({ sub: user._id.toString(), email: user.email, role: user.role });
  return { user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role }, token };
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
