import type { Metadata } from "next";

import { signInWithMagicLink } from "@/app/auth/actions";

export const metadata: Metadata = {
  title: "Sign In | Your Oracle",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-6 py-20">
      <section className="oracle-card w-full p-8 md:p-10">
        <p className="oracle-eyebrow">Your Oracle</p>
        <h1 className="mt-2 font-title text-4xl text-stone-100 md:text-5xl">
          Enter the Temple
        </h1>
        <p className="mt-4 max-w-xl text-stone-300">
          Sign in with a magic link. No password needed.
        </p>
        <p className="mt-3 rounded-lg border border-amber-200/20 bg-amber-50/5 px-4 py-2 text-sm text-amber-100">
          Entertainment only. Readings are reflective and not guaranteed predictions.
        </p>

        <form action={signInWithMagicLink} className="mt-8 space-y-4">
          <label htmlFor="email" className="block text-sm text-stone-300">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="you@example.com"
            className="w-full rounded-xl border border-amber-300/20 bg-[#131118] px-4 py-3 text-stone-100 placeholder:text-stone-500 focus:border-amber-200/70 focus:outline-none"
          />
          <button type="submit" className="oracle-button w-full md:w-auto">
            Send Magic Link
          </button>
        </form>

        {params.message ? (
          <p className="mt-4 rounded-xl border border-amber-200/20 bg-amber-100/5 px-4 py-3 text-sm text-amber-100">
            {params.message}
          </p>
        ) : null}
      </section>
    </main>
  );
}
