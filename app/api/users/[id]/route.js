// app/api/users/[id]/route.js
import { NextResponse } from "next/server";
import requireAuth from "@/lib/requireAuth";

import { getUserById, updateUser, deleteUser } from "../../../../services/userService";

export async function GET(req, { params }) {
  try {
    const payload = await requireAuth(req); // any logged-in user
    const id = params.id;
    // allow user to get own profile or admin
    if (payload.sub !== id && payload.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const user = await getUserById(id);
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data: user });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 401 });
  }
}

export async function PUT(req, { params }) {
  try {
    const payload = await requireAuth(req);
    const id = params.id;
    if (payload.sub !== id && payload.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await req.json();
    const updated = await updateUser(id, body);
    return NextResponse.json({ data: updated });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 400 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await requireAuth(req, ["admin"]);
    await deleteUser(params.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 400 });
  }
}
