// app/api/rides/[id]/route.js
import { NextResponse } from "next/server";
import { requireAuth } from "../../../../lib/requireAuth";
import { getRideById, updateRide, deleteRide } from "../../../../services/rideService";

export async function GET(req, { params }) {
  try {
    const payload = await requireAuth(req);
    const ride = await getRideById(params.id);
    if (!ride) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (payload.role !== "admin" && ride.riderId.toString() !== payload.sub && String(ride.driverId) !== payload.sub) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ data: ride });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 401 });
  }
}

export async function PUT(req, { params }) {
  try {
    const payload = await requireAuth(req);
    const ride = await getRideById(params.id);
    if (!ride) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (payload.role !== "admin" && ride.riderId.toString() !== payload.sub && String(ride.driverId) !== payload.sub) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const data = await req.json();
    const updated = await updateRide(params.id, data);
    return NextResponse.json({ data: updated });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 400 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await requireAuth(req, ["admin"]);
    await deleteRide(params.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 400 });
  }
}
