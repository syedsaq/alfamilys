import { NextResponse } from "next/server";
import Connectdb from "@/lib/dbConnect";
import requireAuth from "@/lib/requireAuth";
import Ride from "@/models/Ride";
import User from "@/models/User";
import Booking from "@/models/Booking";

export async function POST(req) {
  try {
    await Connectdb();

    // ✅ Auth
    const payload = await requireAuth(req);
    const userId = payload.sub;

    // ✅ Parse Body
    const body = await req.json();
    const { offerRideId, requestRideId } = body;

    if (!offerRideId || !requestRideId) {
      return NextResponse.json(
        { error: "offerRideId and requestRideId are required" },
        { status: 400 }
      );
    }

    // ✅ Find Offer Ride (Driver)
    const offerRide = await Ride.findById(offerRideId);
    if (!offerRide)
      return NextResponse.json({ error: "Offer ride not found" }, { status: 404 });

    // ✅ Find Request Ride (Rider)
    const requestRide = await Ride.findById(requestRideId);
    if (!requestRide)
      return NextResponse.json({ error: "Request ride not found" }, { status: 404 });

    // ✅ Prevent same user booking their own ride
    if (offerRide.driver.toString() === userId) {
      return NextResponse.json(
        { error: "You cannot book your own ride" },
        { status: 403 }
      );
    }

    // ✅ Check available seats
    if (offerRide.availableSeats <= 0) {
      return NextResponse.json(
        { error: "No seats available in this ride" },
        { status: 400 }
      );
    }

    const seatsToBook = requestRide.requestedSeats || 1;

    if (offerRide.availableSeats < seatsToBook) {
      return NextResponse.json(
        { error: "Not enough seats available" },
        { status: 400 }
      );
    }

    // ✅ Create Booking
    const booking = await Booking.create({
      offerRideId,
      requestRideId,
      riderId: userId,
      driverId: offerRide.driver,
      seatsBooked: seatsToBook,
      notes: requestRide.notes || "",
      driverNotified: true, // 🔔 notify driver of new booking
    });

    // ✅ Update available seats
    offerRide.availableSeats -= seatsToBook;
    await offerRide.save();

    return NextResponse.json({
      message: "Seat booked successfully 🚗",
      booking,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
