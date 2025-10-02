// app/api/rides/match/route.js
import { NextResponse } from "next/server";
import Connectdb from "@/lib/dbConnect";
import Ride from "@/models/Ride";
import User from "@/models/User";
import requireAuth from "@/lib/requireAuth";

// 🔹 Helper: Calculate distance between two geo points (Haversine)
function haversineDistance(coord1, coord2) {
  const toRad = (x) => (x * Math.PI) / 180;

  const R = 6371; // Earth radius in km
  const dLat = toRad(coord2.latitude - coord1.latitude);
  const dLon = toRad(coord2.longitude - coord1.longitude);

  const lat1 = toRad(coord1.latitude);
  const lat2 = toRad(coord2.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) *
      Math.cos(lat1) *
      Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // distance in KM
}

export async function GET(req) {
  try {
    await Connectdb();

    // 🔒 Verify JWT
    const payload = await requireAuth(req);
    const userId = payload.sub;

    // ✅ Ensure only riders can call this
    const user = await User.findById(userId).select("role");
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (user.role !== "rider") {
      return NextResponse.json(
        { error: "Only riders can search for matching offers" },
        { status: 403 }
      );
    }

    // ✅ Extract rideId from query
    const { searchParams } = new URL(req.url);
    const rideId = searchParams.get("rideId");

    if (!rideId) {
      return NextResponse.json({ error: "rideId is required" }, { status: 400 });
    }

    // ✅ Find the rider’s ride request
    const riderRide = await Ride.findById(rideId);
    if (!riderRide || riderRide.rideType !== "request") {
      return NextResponse.json(
        { error: "Ride request not found" },
        { status: 404 }
      );
    }

    // ✅ Time filter ±30 minutes
    const minTime = new Date(riderRide.dateTime.getTime() - 30 * 60000);
    const maxTime = new Date(riderRide.dateTime.getTime() + 30 * 60000);

    // ✅ Fetch candidate offers (direction + time match)
    const offers = await Ride.find({
      rideType: "offer",
      status: "available",
      dateTime: { $gte: minTime, $lte: maxTime },
      rideDirection: riderRide.rideDirection, // 🔹 Must match direction
    }).populate("driver", "name email vehicleType model registrationNumber");

    // ✅ Distance filter (pickup + drop tolerance)
    const maxDistance = 7; // km tolerance
    const filtered = offers
      .map((offer) => {
        const pickupDist = haversineDistance(
          riderRide.pickupLocation,
          offer.pickupLocation
        );
        const dropDist = haversineDistance(
          riderRide.dropLocation,
          offer.dropLocation
        );

        if (pickupDist <= maxDistance && dropDist <= maxDistance) {
          return {
            ...offer.toObject(),
            pickupDistance: pickupDist.toFixed(2),
            dropDistance: dropDist.toFixed(2),
          };
        }
        return null;
      })
      .filter((match) => match !== null);

    // ✅ Split into matches with seats & without seats
    const matchesWithSeats = filtered.filter(
      (m) => m.availableSeats >= riderRide.requestedSeats
    );
    const matchesWithoutSeats = filtered.filter(
      (m) => m.availableSeats < riderRide.requestedSeats
    );

    // ✅ Aggregates
    const totalDrivers = matchesWithSeats.length;
    const totalAvailableSeats = matchesWithSeats.reduce(
      (sum, m) => sum + m.availableSeats,
      0
    );

    if (filtered.length === 0) {
      return NextResponse.json(
        { message: "No matching offers found" },
        { status: 200 }
      );
    }

    return NextResponse.json({
      message: "Matching offers found",
      totalDrivers,
      totalAvailableSeats,
      matchesWithSeats,
      matchesWithoutSeats,
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

// // 🔹 Helper: Calculate distance between two geo points (Haversine)
// function haversineDistance(coord1, coord2) {
//   const toRad = (x) => (x * Math.PI) / 180;

//   const R = 6371; // Earth radius in km
//   const dLat = toRad(coord2.latitude - coord1.latitude);
//   const dLon = toRad(coord2.longitude - coord1.longitude);

//   const lat1 = toRad(coord1.latitude);
//   const lat2 = toRad(coord2.latitude);

//   const a =
//     Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//     Math.sin(dLon / 2) * Math.sin(dLon / 2) *
//       Math.cos(lat1) *
//       Math.cos(lat2);

//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c; // distance in KM
// }

// export async function GET(req) {
//   try {
//     await Connectdb();

//     // 🔒 Verify JWT
//     const payload = await requireAuth(req);
//     const userId = payload.sub;

//     // ✅ Ensure only riders can call this
//     const user = await User.findById(userId).select("role");
//     if (!user) {
//       return NextResponse.json({ error: "User not found" }, { status: 404 });
//     }
//     if (user.role !== "rider") {
//       return NextResponse.json(
//         { error: "Only riders can search for matching offers" },
//         { status: 403 }
//       );
//     }

//     // ✅ Extract rideId from query
//     const { searchParams } = new URL(req.url);
//     const rideId = searchParams.get("rideId");

//     if (!rideId) {
//       return NextResponse.json({ error: "rideId is required" }, { status: 400 });
//     }

//     // ✅ Find the rider’s ride request
//     const riderRide = await Ride.findById(rideId);
//     if (!riderRide || riderRide.rideType !== "request") {
//       return NextResponse.json(
//         { error: "Ride request not found" },
//         { status: 404 }
//       );
//     }

//     // ✅ Time filter ±30 minutes
//     const minTime = new Date(riderRide.dateTime.getTime() - 30 * 60000);
//     const maxTime = new Date(riderRide.dateTime.getTime() + 30 * 60000);

//     // ✅ Fetch candidate offers
//     const offers = await Ride.find({
//       rideType: "offer",
//       status: "available",
//       dateTime: { $gte: minTime, $lte: maxTime },
//       rideDirection: riderRide.rideDirection, // 🔹 Must match direction
//       availableSeats: { $gte: riderRide.requestedSeats }, // 🔹 Enough seats
//     }).populate("driver", "name email vehicleType model registrationNumber");

//     // ✅ Distance filter (pickup + drop tolerance)
//     const maxDistance = 7; // km tolerance
//     const matches = offers
//       .map((offer) => {
//         const pickupDist = haversineDistance(
//           riderRide.pickupLocation,
//           offer.pickupLocation
//         );
//         const dropDist = haversineDistance(
//           riderRide.dropLocation,
//           offer.dropLocation
//         );

//         if (pickupDist <= maxDistance && dropDist <= maxDistance) {
//           return {
//             ...offer.toObject(),
//             pickupDistance: pickupDist.toFixed(2),
//             dropDistance: dropDist.toFixed(2),
//           };
//         }
//         return null;
//       })
//       .filter((match) => match !== null);

//     if (matches.length === 0) {
//       return NextResponse.json(
//         { message: "No matching offers found" },
//         { status: 200 }
//       );
//     }

//     return NextResponse.json({
//       message: "Matching offers found",
//       matches,
//     });
//   } catch (err) {
//     return NextResponse.json(
//       { error: err.message },
//       { status: err.status || 500 }
//     );
//   }
// }

// import { NextResponse } from "next/server";
// import Connectdb from "@/lib/dbConnect";
// import Ride from "@/models/Ride";
// import User from "@/models/User";

// function getDistance(lat1, lon1, lat2, lon2) {
//   const R = 6371; // Earth radius (km)
//   const dLat = ((lat2 - lat1) * Math.PI) / 180;
//   const dLon = ((lon2 - lon1) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//     Math.cos((lat1 * Math.PI) / 180) *
//       Math.cos((lat2 * Math.PI) / 180) *
//       Math.sin(dLon / 2) *
//       Math.sin(dLon / 2);
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// export async function GET(req) {
//   try {
//     await Connectdb();
//     const { searchParams } = new URL(req.url);
//     const rideId = searchParams.get("rideId");

//     if (!rideId) {
//       return NextResponse.json({ error: "rideId is required" }, { status: 400 });
//     }

//     // Rider request
//     const riderRide = await Ride.findById(rideId).populate("rider", "name email");
//     if (!riderRide || riderRide.rideType !== "request") {
//       return NextResponse.json({ error: "Invalid ride request" }, { status: 404 });
//     }

//     // Find matching offers
//     const offers = await Ride.find({
//       rideType: "offer",
//       status: "available",
//       rideDirection: riderRide.rideDirection,
//     }).populate("driver", "name email rating carDetails");

//     // Calculate distances
//     const matches = offers.map((offer) => {
//       const pickupDistance = getDistance(
//         riderRide.pickupLocation.latitude,
//         riderRide.pickupLocation.longitude,
//         offer.pickupLocation.latitude,
//         offer.pickupLocation.longitude
//       );
//       const dropDistance = getDistance(
//         riderRide.dropLocation.latitude,
//         riderRide.dropLocation.longitude,
//         offer.dropLocation.latitude,
//         offer.dropLocation.longitude
//       );

//       return {
//         ...offer.toObject(),
//         pickupDistance,
//         dropDistance,
//         totalDistance: pickupDistance + dropDistance,
//       };
//     });

//     // Sort by nearest
//     matches.sort((a, b) => a.totalDistance - b.totalDistance);

//     return NextResponse.json({
//       message: "Matching offers found",
//       matches: matches.slice(0, 3), // return top 3 matches
//     });
//   } catch (err) {
//     return NextResponse.json({ error: err.message }, { status: 500 });
//   }
// }
