import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { AttributionPayload } from "@/lib/attribution";

export const WAITLIST_SERVER_ERROR =
  "Something went wrong, please try again.";

export type WaitlistSignupInput = {
  email: string;
  source?: string;
} & Partial<AttributionPayload>;

export type WaitlistResult =
  | { ok: true; stored: "supabase" | "log"; isNew: boolean }
  | { ok: false; error: string; status: 400 | 500 };

let adminClient: SupabaseClient | null = null;

function isProduction(): boolean {
  return process.env.VERCEL_ENV === "production";
}

function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  if (!adminClient) {
    adminClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return adminClient;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function rowFromSignup(input: WaitlistSignupInput): Record<string, string> {
  const normalized = input.email.trim().toLowerCase();
  const row: Record<string, string> = {
    email: normalized,
    source: input.source ?? "landing",
  };
  const optional: (keyof AttributionPayload)[] = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "referrer",
    "landing_path",
  ];
  for (const key of optional) {
    const value = input[key];
    if (typeof value === "string" && value.trim()) {
      row[key] = value.trim().slice(0, 512);
    }
  }
  return row;
}

export async function storeWaitlistEmail(
  input: WaitlistSignupInput,
): Promise<WaitlistResult> {
  const normalized = input.email.trim().toLowerCase();
  if (!isValidEmail(normalized)) {
    return {
      ok: false,
      error: "Please enter a valid email address.",
      status: 400,
    };
  }

  const client = getSupabaseAdmin();

  if (!client) {
    if (isProduction()) {
      console.error("[waitlist] storage not configured in production");
      return {
        ok: false,
        error: WAITLIST_SERVER_ERROR,
        status: 500,
      };
    }
    console.info("[waitlist] log-only signup:", {
      ...rowFromSignup({ ...input, email: normalized }),
      at: new Date().toISOString(),
    });
    return { ok: true, stored: "log", isNew: true };
  }

  const { error } = await client.from("waitlist").insert(rowFromSignup(input));

  if (error) {
    if (error.code === "23505") {
      return { ok: true, stored: "supabase", isNew: false };
    }
    console.error("[waitlist] insert failed:", error.message);
    return {
      ok: false,
      error: isProduction()
        ? WAITLIST_SERVER_ERROR
        : "Unable to save your email. Try again.",
      status: isProduction() ? 500 : 400,
    };
  }

  return { ok: true, stored: "supabase", isNew: true };
}

export { isValidEmail };