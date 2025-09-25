import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  role: { 
    type: String, 
    enum: ["rider", "driver"], 
    required: true 
  },
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mobile: { type: String, required: true },
  department: { type: String, required: true },
  designation: { type: String, required: true },
  password: { type: String, required: true },
  cnic: { type: String, required: true },
  otp: { type: String },            // hashed OTP 
  otpExpiresAt: { type: Date },     // expiry time
  isVerified: { type: Boolean, default: false },
  // Rider fields (basic) — no extras

  // Driver-specific fields
  vehicleType: { type: String },   // dropdown
  model: { type: String },
  registrationNumber: { type: String },
  seatingCapacity: { type: Number },
  willingToOfferRide: { type: Boolean }, 
  acAvailable: { type: Boolean }
}, { timestamps: true });

// Custom collection name
export default mongoose.models.User || mongoose.model("User", UserSchema, "users");
