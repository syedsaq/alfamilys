import { NextResponse } from "next/server";
import Connectdb from "@/lib/dbConnect";
import Booking from "@/models/Booking";
import "@/models/User";
import "@/models/Ride";
import requireAuth from "@/lib/requireAuth";

// GET /api/rides/bookings/my?status=accepted OR ?status=rejected
export async function GET(req) {
  try {
    await Connectdb();

    const payload = await requireAuth(req);
    const userId = payload.sub;

    // Parse query params
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // optional: accepted | rejected | pending

    // Build filter
    const filter = { riderId: userId };
    if (status) {
      filter.status = status;
    } else {
      // if not provided, show all except pending
      filter.status = { $in: ["accepted", "rejected"] };
    }

    // Fetch bookings with ride & driver details
    const bookings = await Booking.find(filter)
      .populate({
        path: "offerRideId",
        populate: {
          path: "driver",
          select: "name email phone",
        },
      })
      .sort({ createdAt: -1 });

    return NextResponse.json({ bookings });
  } catch (err) {
    console.error("❌ Rider bookings error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
