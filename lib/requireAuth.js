// lib/requireAuth.js
import { verifyJwt } from "./jwt";

export async function requireAuth(req, requiredRoles = null) {
  const auth = req.headers.get("authorization");
  if (!auth) {
    const err = new Error("Missing Authorization header");
    err.status = 401;
    throw err;
  }
  const parts = auth.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    const err = new Error("Invalid Authorization header");
    err.status = 401;
    throw err;
  }
  const token = parts[1];
  const payload = await verifyJwt(token);
  if (!payload) {
    const err = new Error("Invalid or expired token");
    err.status = 401;
    throw err;
  }
  if (requiredRoles && !requiredRoles.includes(payload.role)) {
    const err = new Error("Forbidden");
    err.status = 403;
    throw err;
  }
  return payload; // contains sub, email, role, iat, exp
}
