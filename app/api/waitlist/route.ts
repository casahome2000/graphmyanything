import { NextResponse } from "next/server";
import { sendWaitlistConfirmationEmail } from "@/lib/waitlist-confirmation-email";
import { storeWaitlistEmail } from "@/lib/waitlist";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const email =
    typeof body === "object" &&
    body !== null &&
    "email" in body &&
    typeof (body as { email: unknown }).email === "string"
      ? (body as { email: string }).email
      : "";

  const source =
    typeof body === "object" &&
    body !== null &&
    "source" in body &&
    typeof (body as { source: unknown }).source === "string"
      ? (body as { source: string }).source
      : undefined;

  const result = await storeWaitlistEmail(email, source);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: result.status },
    );
  }

  if (result.isNew) {
    const normalized = email.trim().toLowerCase();
    void sendWaitlistConfirmationEmail(normalized);
  }

  return NextResponse.json({ ok: true });
}