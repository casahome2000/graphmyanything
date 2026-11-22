import { createClient, SupabaseClient } from "@supabase/supabase-js";

export const WAITLIST_SERVER_ERROR =
  "Something went wrong, please try again.";

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

export async function storeWaitlistEmail(
  email: string,
  source?: string,
): Promise<WaitlistResult> {
  const normalized = email.trim().toLowerCase();
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
      email: normalized,
      source: source ?? "landing",
      at: new Date().toISOString(),
    });
    return { ok: true, stored: "log", isNew: true };
  }

  const { error } = await client.from("waitlist").insert({
    email: normalized,
    source: source ?? "landing",
  });

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