// services/userService.js
import User from "../models/User";
import Connectdb  from "../lib/dbConnect";
import mongoose from "mongoose";

export async function listUsers() {
  await Connectdb();
  return User.find().select("-passwordHash").lean();
}

export async function getUserById(id) {
  await Connectdb();
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return User.findById(id).select("-passwordHash").lean();
}

export async function updateUser(id, patch) {
  await Connectdb();
  return User.findByIdAndUpdate(id, patch, { new: true }).select("-passwordHash").lean();
}

export async function deleteUser(id) {
  await Connectdb();
  return User.findByIdAndDelete(id);
}
