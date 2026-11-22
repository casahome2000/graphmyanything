import { createClient, SupabaseClient } from "@supabase/supabase-js";

export type WaitlistResult =
  | { ok: true; stored: "supabase" | "log" }
  | { ok: false; error: string };

let adminClient: SupabaseClient | null = null;

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
    return { ok: false, error: "Please enter a valid email address." };
  }

  const client = getSupabaseAdmin();
  if (client) {
    const { error } = await client.from("waitlist").insert({
      email: normalized,
      source: source ?? "landing",
    });
    if (error) {
      if (error.code === "23505") {
        return { ok: true, stored: "supabase" };
      }
      console.error("[waitlist] Supabase insert failed:", error.message);
      return { ok: false, error: "Unable to save your email. Try again." };
    }
    return { ok: true, stored: "supabase" };
  }

  console.info("[waitlist] (no Supabase) signup:", {
    email: normalized,
    source: source ?? "landing",
    at: new Date().toISOString(),
  });
  return { ok: true, stored: "log" };
}

export { isValidEmail };