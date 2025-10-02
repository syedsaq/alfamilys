import { NextResponse } from "next/server";
import Connectdb from "@/lib/dbConnect";
import Ride from "@/models/Ride";
import User from "@/models/User";
import Booking from "@/models/Booking";
import requireAuth from "@/lib/requireAuth";
import { sendEmail } from "@/lib/mailer";

export async function POST(req) {
  try {
    await Connectdb();

    // 🔒 Auth
    const payload = await requireAuth(req);
    const userId = payload.sub;

    // ✅ Check role
    const user = await User.findById(userId).select("role fullName email");
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (user.role !== "rider") {
      return NextResponse.json({ error: "Only riders can request seats" }, { status: 403 });
    }

    // ✅ Parse request
    const body = await req.json();
    const { rideId } = body;

    if (!rideId) {
      return NextResponse.json({ error: "rideId is required" }, { status: 400 });
    }

    // ✅ Find ride offer
    const ride = await Ride.findById(rideId).populate("driver", "fullName email");
    if (!ride || ride.rideType !== "offer") {
      return NextResponse.json({ error: "Ride offer not found" }, { status: 404 });
    }

    // ✅ Use rider’s originally requested seats
    const seatsRequested = ride.requestedSeats || 1;

    if (ride.availableSeats < seatsRequested) {
      return NextResponse.json({ error: "Not enough available seats" }, { status: 400 });
    }

    // ✅ Create booking
    const booking = await Booking.create({
      ride: ride._id,
      rider: userId,
      seats: seatsRequested,
    });

    // ✅ Update available seats
    ride.availableSeats -= seatsRequested;
    await ride.save();

    // ✅ Notify driver
    await sendEmail(
      ride.driver.email,
      "New Ride Booking Request",
      `Hello ${ride.driver.fullName},\n\n${user.fullName} requested ${seatsRequested} seat(s) on your ride.\n\nRide ID: ${ride._id}`
    );

    return NextResponse.json({
      message: "Seat request sent successfully ✅",
      booking,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}
