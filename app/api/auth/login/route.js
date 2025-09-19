// app/api/auth/login/route.js
import { NextResponse } from "next/server";
import * as yup from "yup";
import { validateBody } from "../../../../lib/validate";
import { login } from "../../../../services/authService";

const schema = yup.object({
  email: yup.string().email().required(),
  password: yup.string().required(),
});

export async function POST(req) {
  try {
    const body = await req.json();
    const validated = await validateBody(schema, body);
    const result = await login(validated);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
