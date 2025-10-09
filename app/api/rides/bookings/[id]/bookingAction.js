import { NextResponse } from "next/server";
import Connectdb from "@/lib/dbConnect";
import Booking from "@/models/Booking";
import "@/models/User";
import "@/models/Ride";
import requireAuth from "@/lib/requireAuth";

export async function handleBookingAction(req, params, action) {
  try {
    await Connectdb();

    const { id: bookingId } = params;
    const payload = await requireAuth(req);
    const userId = payload.sub;

    // Validate action
    if (!["accept", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Find the booking with populated relationships
    const booking = await Booking.findById(bookingId)
      .populate({
        path: "offerRideId",
        populate: { path: "driver", model: "User" },
      })
      .populate("riderId");

    if (!booking)
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    // Check driver authorization
    if (booking.offerRideId.driver._id.toString() !== userId)
      return NextResponse.json(
        { error: "You are not authorized to modify this booking" },
        { status: 403 }
      );

    // ✅ ACCEPT
    if (action === "accept") {
      if (booking.status === "accepted") {
        return NextResponse.json({ message: "Already accepted" }, { status: 200 });
      }

      if (booking.offerRideId.availableSeats <= 0) {
        return NextResponse.json({ error: "No seats available" }, { status: 400 });
      }

      booking.status = "accepted";
      booking.offerRideId.availableSeats -= booking.seatsBooked || 1;

      await booking.save();
      await booking.offerRideId.save();

      return NextResponse.json({
        message: "Booking accepted ✅",
        booking,
      });
    }

    // ❌ REJECT
    if (action === "reject") {
      booking.status = "rejected";
      await booking.save();

      return NextResponse.json({
        message: "Booking rejected ❌",
        booking,
      });
    }
  } catch (err) {
    console.error("❌ Booking action error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
