import { NextResponse } from "next/server";
import { sendWaitlistConfirmationEmail } from "@/lib/waitlist-confirmation-email";
import { storeWaitlistEmail, type WaitlistSignupInput } from "@/lib/waitlist";

function pickString(
  body: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = body[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function parseBody(body: unknown): WaitlistSignupInput | null {
  if (typeof body !== "object" || body === null) return null;
  const record = body as Record<string, unknown>;
  const email = pickString(record, "email");
  if (!email) return null;
  return {
    email,
    source: pickString(record, "source"),
    utm_source: pickString(record, "utm_source") ?? null,
    utm_medium: pickString(record, "utm_medium") ?? null,
    utm_campaign: pickString(record, "utm_campaign") ?? null,
    utm_content: pickString(record, "utm_content") ?? null,
    referrer: pickString(record, "referrer") ?? null,
    landing_path: pickString(record, "landing_path") ?? null,
  };
}

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

  const signup = parseBody(body);
  if (!signup) {
    return NextResponse.json(
      { ok: false, error: "Email is required." },
      { status: 400 },
    );
  }

  const result = await storeWaitlistEmail(signup);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: result.status },
    );
  }

  if (result.isNew) {
    const normalized = signup.email.trim().toLowerCase();
    void sendWaitlistConfirmationEmail(normalized);
  }

  return NextResponse.json({ ok: true, isNew: result.isNew });
}