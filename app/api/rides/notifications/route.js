import { NextResponse } from "next/server";
import Connectdb from "@/lib/dbConnect";
import Notification from "@/models/Notification";
import requireAuth from "@/lib/requireAuth";

export async function GET(req) {
  try {
    await Connectdb();

    const payload = await requireAuth(req);
    const userId = payload.sub;

    const notifications = await Notification.find({ receiver: userId })
      .populate("sender", "name email")
      .sort({ createdAt: -1 });

    return NextResponse.json({ notifications });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
