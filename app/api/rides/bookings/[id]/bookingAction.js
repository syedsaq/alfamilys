import { NextResponse } from "next/server";
import Connectdb from "@/lib/dbConnect";
import Booking from "@/models/Booking";
import Notification from "@/models/Notification";
import "@/models/User";
import "@/models/Ride";
import requireAuth from "@/lib/requireAuth";

export async function handleBookingAction(req, params, action) {
  try {
    await Connectdb();
    const { id: bookingId } = await params;
    const payload = await requireAuth(req);
    const userId = payload.sub;

    if (!["accept", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const booking = await Booking.findById(bookingId)
      .populate({
        path: "offerRideId",
        populate: { path: "driver", model: "User" },
      })
      .populate("riderId");

    if (!booking)
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    // Authorization check
    if (booking.offerRideId.driver._id.toString() !== userId) {
      return NextResponse.json(
        { error: "You are not authorized to modify this booking" },
        { status: 403 }
      );
    }

    // 🚫 Prevent modification of completed or cancelled bookings
    if (["completed", "cancelled"].includes(booking.status)) {
      return NextResponse.json(
        { error: `Cannot modify a ${booking.status} booking.` },
        { status: 400 }
      );
    }

    // ✅ ACCEPT LOGIC
    if (action === "accept") {
      if (booking.status === "accepted") {
        return NextResponse.json({ message: "Already accepted" }, { status: 200 });
      }

      if (booking.status !== "pending") {
        return NextResponse.json(
          { error: `Cannot accept a ${booking.status} booking.` },
          { status: 400 }
        );
      }

      if (booking.offerRideId.availableSeats <= 0) {
        return NextResponse.json({ error: "No seats available" }, { status: 400 });
      }

      booking.status = "accepted";
      booking.offerRideId.availableSeats -= booking.seatsBooked || 1;

      await booking.save();
      await booking.offerRideId.save();

      await Notification.create({
        sender: userId,
        receiver: booking.riderId._id,
        type: "booking_accepted",
        message: `Your booking has been accepted by the driver.`,
      });

      return NextResponse.json({ message: "Booking accepted ✅", booking });
    }

    // ❌ REJECT LOGIC
    if (action === "reject") {
      // 🚫 Once accepted, cannot reject
      if (booking.status === "accepted") {
        return NextResponse.json(
          { error: "Cannot reject an already accepted booking." },
          { status: 400 }
        );
      }

      if (booking.status !== "pending") {
        return NextResponse.json(
          { error: `Cannot reject a ${booking.status} booking.` },
          { status: 400 }
        );
      }

      booking.status = "rejected";
      await booking.save();

      await Notification.create({
        sender: userId,
        receiver: booking.riderId._id,
        type: "booking_rejected",
        message: `Your booking has been rejected by the driver.`,
      });

      return NextResponse.json({ message: "Booking rejected ❌", booking });
    }
  } catch (err) {
    console.error("❌ Booking action error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// import { NextResponse } from "next/server";
// import Connectdb from "@/lib/dbConnect";
// import Booking from "@/models/Booking";
// import "@/models/User";
// import "@/models/Ride";
// import requireAuth from "@/lib/requireAuth";
// import Notification from "@/models/Notification"; // ✅ Add this line

// export async function handleBookingAction(req, params, action) {
//   try {
//     await Connectdb();

//     const { id: bookingId } = await params;
//     const payload = await requireAuth(req);
//     const userId = payload.sub;

//     // Validate action
//     if (!["accept", "reject"].includes(action)) {
//       return NextResponse.json({ error: "Invalid action" }, { status: 400 });
//     }

//     // Find the booking with populated relationships
//     const booking = await Booking.findById(bookingId)
//       .populate({
//         path: "offerRideId",
//         populate: { path: "driver", model: "User" },
//       })
//       .populate("riderId");

//     if (!booking)
//       return NextResponse.json({ error: "Booking not found" }, { status: 404 });

//     // Check driver authorization
//     if (booking.offerRideId.driver._id.toString() !== userId)
//       return NextResponse.json(
//         { error: "You are not authorized to modify this booking" },
//         { status: 403 }
//       );

//     // ✅ ACCEPT
//     if (action === "accept") {
//       if (booking.status === "accepted") {
//         return NextResponse.json({ message: "Already accepted" }, { status: 200 });
//       }

//       if (booking.offerRideId.availableSeats <= 0) {
//         return NextResponse.json({ error: "No seats available" }, { status: 400 });
//       }

//       booking.status = "accepted";
//       booking.offerRideId.availableSeats -= booking.seatsBooked || 1;

//       await booking.save();
//       await booking.offerRideId.save();

//         await Notification.create({
//         sender: userId,
//         receiver: booking.riderId._id,
//         type: "booking_accepted",
//         message: `Your booking request has been accepted by ${booking.offerRideId.driver.name}`,
//       });


//       return NextResponse.json({
//         message: "Booking accepted ✅",
//         booking,
//       });
//     }

//     // ❌ REJECT
//     if (action === "reject") {
//       booking.status = "rejected";
//       await booking.save();

//         // 🔔 Create notification for rider
//       await Notification.create({
//         sender: userId,
//         receiver: booking.riderId._id,
//         type: "booking_rejected",
//         message: `Your booking request has been rejected by ${booking.offerRideId.driver.name}`,
//       });

//       return NextResponse.json({
//         message: "Booking rejected ❌",
//         booking,
//       });
//     }
//   } catch (err) {
//     console.error("❌ Booking action error:", err);
//     return NextResponse.json({ error: err.message }, { status: 500 });
//   }
// }
