// models/Ride.js
import mongoose from "mongoose";

const RideSchema = new mongoose.Schema(
  {
    riderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    pickup: { type: String, required: true },
    dropoff: { type: String, required: true },
    status: { type: String, enum: ["requested", "assigned", "completed", "cancelled"], default: "requested" },
    fare: { type: Number },
  },
  { timestamps: true }
);

export default mongoose.models.Ride || mongoose.model("Ride", RideSchema);
