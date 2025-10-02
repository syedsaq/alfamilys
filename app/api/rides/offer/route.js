import { NextResponse } from "next/server";
import Connectdb from "@/lib/dbConnect";
import Ride from "@/models/Ride";
import User from "@/models/User";
import requireAuth from "@/lib/requireAuth";

export async function POST(req) {
  try {
    await Connectdb();

    // 🔒 JWT Authentication
    const payload = await requireAuth(req);
    const userId = payload.sub;

    // ✅ Ensure role is driver
    const user = await User.findById(userId).select("role");
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (user.role !== "driver") {
      return NextResponse.json(
        { error: "Only drivers can offer rides" },
        { status: 403 }
      );
    }

    // ✅ Parse request body
    const body = await req.json();
    const {
      pickupLocation,
      dropLocation,
      availableSeats,
      dateTime,
      notes,
      acAvailable = false,
      rideDirection,
    } = body;

    // ✅ Validate input
    if (!pickupLocation?.latitude || !pickupLocation?.longitude) {
      return NextResponse.json(
        { error: "Pickup location latitude and longitude are required" },
        { status: 400 }
      );
    }

    if (!dropLocation?.latitude || !dropLocation?.longitude) {
      return NextResponse.json(
        { error: "Drop location latitude and longitude are required" },
        { status: 400 }
      );
    }

    if (!dateTime) {
      return NextResponse.json(
        { error: "Date and time are required" },
        { status: 400 }
      );
    }

    if (!availableSeats || availableSeats <= 0) {
      return NextResponse.json(
        { error: "Available seats must be greater than 0" },
        { status: 400 }
      );
    }

    if (!rideDirection) {
      return NextResponse.json(
        { error: "Ride direction (home-to-office or office-to-home) is required" },
        { status: 400 }
      );
    }

    // ✅ Create ride offer
    const newRideOffer = await Ride.create({
      rideType: "offer",
      driver: userId,
      pickupLocation,
      dropLocation,
      availableSeats,
      dateTime,
      notes,
      acAvailable,
      rideDirection,
    });

    return NextResponse.json({
      message: "Ride offer created successfully 🚗",
      ride: newRideOffer,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.message },
      { status: err.status || 500 }
    );
  }
}

// import { NextResponse } from "next/server";
// import Connectdb from "@/lib/dbConnect";
// import Ride from "@/models/Ride";
// import User from "@/models/User";
// import requireAuth from "@/lib/requireAuth";

// export async function POST(req) {
//   try {
//     await Connectdb();

//     // ✅ Auth
//     const payload = await requireAuth(req);
//     const userId = payload.sub;

//     // ✅ Check role
//     const user = await User.findById(userId).select("role");
//     if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
//     if (user.role !== "driver") {
//       return NextResponse.json({ error: "Only drivers can offer rides" }, { status: 403 });
//     }

//     // ✅ Parse body
//     const body = await req.json();
//     const { pickupLocation, dropLocation, availableSeats, dateTime, notes, acAvailable, rideDirection } = body;

//     if (
//       !pickupLocation?.latitude ||
//       !pickupLocation?.longitude ||
//       !dropLocation?.latitude ||
//       !dropLocation?.longitude ||
//       !dateTime ||
//       !availableSeats
//     ) {
//       return NextResponse.json({ error: "Missing required ride offer fields" }, { status: 400 });
//     }

//     // ✅ Save
//     const newRideOffer = await Ride.create({
//       rideType: "offer",
//       driver: userId,
//       pickupLocation,
//       dropLocation,
//       availableSeats,
//       dateTime,
//       notes,
//       acAvailable,
//       rideDirection,
//     });

//     return NextResponse.json({ message: "Ride offer created successfully 🚗", ride: newRideOffer });
//   } catch (err) {
//     return NextResponse.json({ error: err.message }, { status: err.status || 500 });
//   }
// }
