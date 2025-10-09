import { NextResponse } from "next/server";
import Connectdb from "@/lib/dbConnect";
import Booking from "@/models/Booking";
import Ride from "@/models/Ride";
import User from "@/models/User";
import requireAuth from "@/lib/requireAuth";


export async function GET(req) {
  try {
    await Connectdb();

    // 🔒 Authenticate user
    const payload = await requireAuth(req);
    const userId = payload.sub;

    // Get role from query string
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");

    if (!role || !["driver", "rider"].includes(role)) {
      return NextResponse.json({ error: "Invalid or missing role" }, { status: 400 });
    }

    const user = await User.findById(userId).select("role name");
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (user.role !== role)
      return NextResponse.json({ error: `Only ${user.role}s can access this endpoint` }, { status: 403 });

    // 🚗 DRIVER view
    if (role === "driver") {
      // Get driver’s active offers
      const offers = await Ride.find({ driver: userId, rideType: "offer" }).lean();

      const rideIds = offers.map((r) => r._id);

      // Fetch bookings for these rides
      const bookings = await Booking.find({ offerRideId: { $in: rideIds } })
        .populate("riderId", "name email profilePic")
        .populate("offerRideId", "pickupLocation dropLocation dateTime rideDirection")
        .lean();

      // Group bookings by status
      const pending = bookings.filter((b) => b.status === "pending");
      const accepted = bookings.filter((b) => b.status === "accepted");

      return NextResponse.json({
        summary: {
          totalRidersWaiting: bookings.length,
          matchingRoute: pending.length,
          pendingRequests: pending.length,
          acceptedRequests: accepted.length,
        },
        activeOffers: offers.map((offer) => ({
          offerId: offer._id,
          vehicle: offer.vehicleType || "N/A",
          model: offer.model || "N/A",
          availableSeats: offer.availableSeats,
          bookedSeats: bookings.filter(
            (b) => b.offerRideId._id.toString() === offer._id.toString() && b.status === "accepted"
          ).length,
        })),
        requests: pending.map((b) => ({
          bookingId: b._id,
          riderName: b.riderId.name,
          pickup: b.offerRideId.pickupLocation,
          drop: b.offerRideId.dropLocation,
          rideDirection: b.offerRideId.rideDirection,
          dateTime: b.offerRideId.dateTime,
          status: b.status,
        })),
      });
    }

    // 🚶 RIDER view (optional)
    if (role === "rider") {
      const bookings = await Booking.find({ riderId: userId })
        .populate("offerRideId", "driver availableSeats dateTime rideDirection")
        .lean();

      return NextResponse.json({ bookings });
    }
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
export async function PATCH(req, context) {
  try {
    await Connectdb();

    const { params } = context;
    const bookingId = params.id;
    const url = req.url.toLowerCase();

    // Determine action from endpoint
    const action = url.includes("/accept")
      ? "accept"
      : url.includes("/reject")
      ? "reject"
      : null;

    if (!action) {
      return NextResponse.json({ error: "Invalid endpoint" }, { status: 400 });
    }

    const payload = await requireAuth(req);
    const userId = payload.sub;

    // Find booking
    const booking = await Booking.findById(bookingId)
      .populate({
        path: "offerRideId",
        populate: { path: "driver", model: "User" },
      })
      .populate("riderId");

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Ensure driver is authorized
    if (booking.offerRideId.driver._id.toString() !== userId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    /* ---------------------------- ACCEPT ACTION ---------------------------- */
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

      return NextResponse.json({ message: "Booking accepted ✅", booking });
    }

    /* ---------------------------- REJECT ACTION ---------------------------- */
    if (action === "reject") {
      booking.status = "rejected";
      await booking.save();

      return NextResponse.json({ message: "Booking rejected ❌", booking });
    }
  } catch (err) {
    console.error("❌ Booking PATCH error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}