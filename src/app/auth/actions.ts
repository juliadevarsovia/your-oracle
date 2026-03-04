"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestEmailCode(formData: FormData) {
  const email = formData.get("email")?.toString().trim().toLowerCase();

  if (!email) {
    redirect("/login?message=Please+enter+your+email");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
    },
  });

  if (error) {
    redirect(`/login?message=${encodeURIComponent(error.message)}`);
  }

  redirect(
    `/login?step=verify&email=${encodeURIComponent(email)}&message=${encodeURIComponent(
      "Code sent. Check your email for a 6-digit code.",
    )}`,
  );
}

export async function verifyEmailCode(formData: FormData) {
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const token = formData
    .get("token")
    ?.toString()
    .trim()
    .replace(/\s+/g, "");

  if (!email) {
    redirect("/login?message=Missing+email");
  }

  if (!token || token.length < 6) {
    redirect(
      `/login?step=verify&email=${encodeURIComponent(email)}&message=${encodeURIComponent(
        "Enter the 6-digit code from your email.",
      )}`,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });

  if (error) {
    redirect(
      `/login?step=verify&email=${encodeURIComponent(email)}&message=${encodeURIComponent(
        "Invalid or expired code. Request a new one.",
      )}`,
    );
  }

  redirect("/oracle");
}
