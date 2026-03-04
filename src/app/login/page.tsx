import type { Metadata } from "next";

import { requestEmailCode, verifyEmailCode } from "@/app/auth/actions";

export const metadata: Metadata = {
  title: "Sign In | Your Oracle",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; step?: string; email?: string }>;
}) {
  const params = await searchParams;
  const isVerifyStep = params.step === "verify";
  const email = params.email ?? "";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-6 py-20">
      <section className="oracle-card w-full p-8 md:p-10">
        <p className="oracle-eyebrow">Your Oracle</p>
        <h1 className="mt-2 font-title text-4xl text-stone-100 md:text-5xl">
          Enter the Temple
        </h1>
        <p className="mt-4 max-w-xl text-stone-300">
          Sign in with an email code. No password needed.
        </p>
        <p className="mt-3 rounded-lg border border-amber-200/20 bg-amber-50/5 px-4 py-2 text-sm text-amber-100">
          Entertainment only. Readings are reflective and not guaranteed predictions.
        </p>

        {!isVerifyStep ? (
          <form action={requestEmailCode} className="mt-8 space-y-4">
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
              Send Login Code
            </button>
          </form>
        ) : (
          <form action={verifyEmailCode} className="mt-8 space-y-4">
            <input type="hidden" name="email" value={email} />
            <p className="text-sm text-stone-300">
              Code sent to <span className="text-stone-100">{email}</span>
            </p>
            <label htmlFor="token" className="block text-sm text-stone-300">
              6-digit code
            </label>
            <input
              id="token"
              name="token"
              type="text"
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              className="w-full rounded-xl border border-amber-300/20 bg-[#131118] px-4 py-3 text-stone-100 placeholder:text-stone-500 focus:border-amber-200/70 focus:outline-none"
            />
            <div className="flex flex-wrap gap-3">
              <button type="submit" className="oracle-button">
                Verify Code
              </button>
              <a href="/login" className="oracle-button inline-flex items-center">
                Use different email
              </a>
            </div>
          </form>
        )}

        {params.message ? (
          <p className="mt-4 rounded-xl border border-amber-200/20 bg-amber-100/5 px-4 py-3 text-sm text-amber-100">
            {params.message}
          </p>
        ) : null}
      </section>
    </main>
  );
}
