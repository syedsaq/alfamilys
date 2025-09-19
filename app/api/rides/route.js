// app/api/rides/route.js
import { NextResponse } from "next/server";
import { requireAuth } from "../../../lib/requireAuth";
import * as yup from "yup";
import { validateBody } from "../../../lib/validate";
import { createRide, listRides } from "../../../services/rideService";

const createSchema = yup.object({
  pickup: yup.string().required(),
  dropoff: yup.string().required(),
});

export async function GET(req) {
  try {
    const payload = await requireAuth(req);
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const filter = {};
    if (payload.role !== "admin") {
      // non-admins see rides where they are rider or driver
      filter.$or = [{ riderId: payload.sub }, { driverId: payload.sub }];
    }
    if (status) filter.status = status;
    const rides = await listRides(filter);
    return NextResponse.json({ data: rides });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 401 });
  }
}

export async function POST(req) {
  try {
    const payload = await requireAuth(req);
    const body = await req.json();
    const validated = await validateBody(createSchema, body);
    const ride = await createRide({ riderId: payload.sub, pickup: validated.pickup, dropoff: validated.dropoff });
    return NextResponse.json({ data: ride }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message, details: err.details || null }, { status: err.status || 400 });
  }
}
