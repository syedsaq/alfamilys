// middleware.js
import { NextResponse } from "next/server";
import { verifyJwt } from "./lib/jwt";

const PUBLIC_PATHS = ["/api/auth/login", "/api/auth/register", "/_next", "/favicon.ico", "/api/auth/verify-otp","/api/users/me","/api/roles/switch"];

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    const auth = req.headers.get("authorization") || "";
    const parts = auth.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "content-type": "application/json" } });
    }
    const token = parts[1];
    const payload = await verifyJwt(token);
    if (!payload) return new NextResponse(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: { "content-type": "application/json" } });

    // allowed: let handler re-check any DB state (middleware just rejects invalid tokens)
    return NextResponse.next();
  }

  return NextResponse.next();
}
