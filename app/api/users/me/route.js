// import { NextResponse } from "next/server";
// import Connectdb from "../../../../lib/dbConnect";
// import User from "../../../../models/User";
// import { requireAuth } from "../../../../lib/requireAuth";



// app/api/users/route.js
import { NextResponse } from "next/server";
//import { requireAuth } from "../../../../lib/requireAuth";

import Connectdb  from "@/lib/dbConnect";
import User from "@/models/User";

import requireAuth from "@/lib/requireAuth";


export async function GET(req) {
  try {
    const payload = await requireAuth(req); // ✅ verifies JWT
    await Connectdb();

    const user = await User.findById(payload.sub).select("-password");
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ data: user });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 401 });
  }
}