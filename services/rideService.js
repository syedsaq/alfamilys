// services/rideService.js
import Ride from "../models/Ride";
import connectDB  from "@/lib/dbConnect";
import mongoose from "mongoose";

export async function createRide({ riderId, pickup, dropoff }) {
  await connectDB();
  const ride = await Ride.create({ riderId, pickup, dropoff });
  return ride.toObject();
}

export async function listRides(filter = {}) {
  await connectDB();
  return Ride.find(filter).lean();
}

export async function getRideById(id) {
  await connectDB();
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return Ride.findById(id).lean();
}

export async function updateRide(id, patch) {
  await connectDB();
  return Ride.findByIdAndUpdate(id, patch, { new: true }).lean();
}

export async function deleteRide(id) {
  await connectDB();
  return Ride.findByIdAndDelete(id);
}
