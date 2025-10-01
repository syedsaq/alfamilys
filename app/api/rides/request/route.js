import { NextResponse } from "next/server";
import Connectdb from "@/lib/dbConnect";
import Ride from "@/models/Ride";
import User from "@/models/User";
import requireAuth from "@/lib/requireAuth";

export async function POST(req) {
  try {
    await Connectdb();

    // ✅ Auth
    const payload = await requireAuth(req);
    const userId = payload.sub;

    // ✅ Check role
    const user = await User.findById(userId).select("role");
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (user.role !== "rider") {
      return NextResponse.json({ error: "Only riders can request rides" }, { status: 403 });
    }

    // ✅ Parse body
    const body = await req.json();
    const { pickupLocation, dropLocation, dateTime, requestedSeats, notes, rideDirection } = body;

    if (
      !pickupLocation?.latitude ||
      !pickupLocation?.longitude ||
      !dropLocation?.latitude ||
      !dropLocation?.longitude ||
      !dateTime ||
      !requestedSeats
    ) {
      return NextResponse.json({ error: "Missing required ride request fields" }, { status: 400 });
    }

    // ✅ Save
    const newRide = await Ride.create({
      rideType: "request",
      rider: userId,
      pickupLocation,
      dropLocation,
      dateTime,
      requestedSeats,
      notes,
      rideDirection,
    });

    return NextResponse.json({ message: "Ride requested successfully 🚖", ride: newRide });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}
