import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const next = requestUrl.searchParams.get("next") ?? "/oracle";
  const safeNext = next.startsWith("/") ? next : "/oracle";

  try {
    if (!code && !(tokenHash && type)) {
      return NextResponse.redirect(
        new URL("/login?message=Magic+link+is+missing+or+invalid", requestUrl.origin),
      );
    }

    const supabase = await createClient();
    let error: Error | null = null;

    if (code) {
      const result = await supabase.auth.exchangeCodeForSession(code);
      error = result.error;
    } else if (tokenHash && type) {
      const result = await supabase.auth.verifyOtp({
        type,
        token_hash: tokenHash,
      });
      error = result.error;
    }

    if (error) {
      return NextResponse.redirect(
        new URL(
          `/login?message=${encodeURIComponent("Magic link expired or invalid. Please request a new one.")}`,
          requestUrl.origin,
        ),
      );
    }
  } catch {
    return NextResponse.redirect(
      new URL(
        `/login?message=${encodeURIComponent("Sign-in failed. Please request a new magic link.")}`,
        requestUrl.origin,
      ),
    );
  }

  return NextResponse.redirect(new URL(safeNext, requestUrl.origin));
}
