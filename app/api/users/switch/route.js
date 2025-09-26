import { NextResponse } from "next/server";
import Connectdb from "@/lib/dbConnect";
import User from "@/models/User";
import requireAuth from "@/lib/requireAuth";

export async function PUT(req) {
  try {
    await Connectdb();

    // 🔒 check JWT
    const payload = await requireAuth(req);
    const userId = payload.sub;

    const body = await req.json();
    const { role } = body;

    if (!role || !["driver", "rider"].includes(role)) {
      return NextResponse.json(
        { error: "Role must be 'driver' or 'rider'" },
        { status: 400 }
      );
    }

    let updateData = { role };

    if (role === "driver") {
      const {
        vehicleType,
        model,
        registrationNumber,
        seatingCapacity,
        willingToOfferRide,
        acAvailable,
      } = body;

      // ✅ validate required driver fields
      if (!vehicleType || !model || !registrationNumber || !seatingCapacity) {
        return NextResponse.json(
          { error: "Missing required driver fields" },
          { status: 400 }
        );
      }

      updateData = {
        ...updateData,
        vehicleType,
        model,
        registrationNumber,
        seatingCapacity,
        willingToOfferRide,
        acAvailable,
      };
    }

    if (role === "rider") {
      // clear driver-specific fields
      updateData = {
        ...updateData,
        vehicleType: null,
        model: null,
        registrationNumber: null,
        seatingCapacity: null,
        willingToOfferRide: false,
        acAvailable: false,
      };
    }

    // 🔄 update user
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    }).select("-password");

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: `Role switched to ${role} successfully`,
      user: updatedUser,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.message },
      { status: err.status || 500 }
    );
  }
}
