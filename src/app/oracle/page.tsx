import Link from "next/link";
import { redirect } from "next/navigation";

import { signOut } from "@/app/auth/actions";
import { askOracle } from "@/app/oracle/actions";
import { createClient } from "@/lib/supabase/server";

type ReadingRow = {
  id: string;
  question: string;
  present_energy: string;
  path_a: string;
  path_b: string;
  hidden_influence: string;
  reflection_question: string;
  created_at: string;
};

const DAILY_FREE_LIMIT = 3;

function singleReply(reading: ReadingRow): string {
  const pickPath =
    (reading.question.length + new Date(reading.created_at).getUTCDate()) % 2 === 0
      ? reading.path_a
      : reading.path_b;

  return [
    reading.present_energy,
    pickPath,
    reading.hidden_influence,
    `Consider this: ${reading.reflection_question}`,
  ].join(" ");
}

function dayBoundsUtc() {
  const now = new Date();
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

export default async function OraclePage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { start, end } = dayBoundsUtc();

  const [{ count }, { data: latestRows }] = await Promise.all([
    supabase
      .from("readings")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", start.toISOString())
      .lt("created_at", end.toISOString()),
    supabase
      .from("readings")
      .select(
        "id, question, present_energy, path_a, path_b, hidden_influence, reflection_question, created_at",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  const latestReading = (latestRows?.[0] ?? null) as ReadingRow | null;
  const usedToday = count ?? 0;
  const remaining = Math.max(0, DAILY_FREE_LIMIT - usedToday);

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-4 py-10 md:px-6 md:py-14">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="oracle-eyebrow">Your Oracle</p>
          <h1 className="mt-1 font-title text-4xl text-stone-100 md:text-5xl">
            Ask Your Oracle for Guidance
          </h1>
          <p className="mt-2 text-stone-300">
            Used today: {usedToday}/{DAILY_FREE_LIMIT}
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/history" className="oracle-button inline-flex items-center">
            History
          </Link>
          <form action={signOut}>
            <button type="submit" className="oracle-button">
              Sign Out
            </button>
          </form>
        </div>
      </header>

      <p className="mb-5 rounded-lg border border-amber-200/20 bg-amber-50/5 px-4 py-3 text-sm text-amber-100">
        For entertainment purposes only. This suggests possibilities for reflection, not facts or guaranteed outcomes.
      </p>

      <section className="oracle-card p-6 md:p-8">
        <form action={askOracle}>
          <label htmlFor="question" className="text-sm text-stone-300">
            What do you need help deciding today?
          </label>
          <textarea
            id="question"
            name="question"
            rows={4}
            required
            minLength={10}
            placeholder="I am choosing between two roles and need guidance."
            className="mt-3 w-full rounded-xl border border-amber-300/20 bg-[#131118] px-4 py-3 text-stone-100 placeholder:text-stone-500 focus:border-amber-200/70 focus:outline-none"
          />

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button type="submit" className="oracle-button" disabled={remaining === 0}>
              Ask the Oracle
            </button>
          </div>
        </form>

        <p className="mt-4 text-sm text-stone-400">
          Signed in as {user.email}. {remaining} free reading
          {remaining === 1 ? "" : "s"} left today.
        </p>

        {params.message ? (
          <p className="mt-4 rounded-xl border border-emerald-200/20 bg-emerald-200/8 px-4 py-3 text-sm text-emerald-100">
            {params.message}
          </p>
        ) : null}

        {params.error ? (
          <p className="mt-4 rounded-xl border border-rose-200/20 bg-rose-200/8 px-4 py-3 text-sm text-rose-100">
            {params.error}
          </p>
        ) : null}
      </section>

      {latestReading ? (
        <section className="oracle-card mt-8 p-6 md:p-8">
          <p className="oracle-eyebrow">Latest Reply</p>
          <h2 className="mt-1 font-title text-3xl text-stone-100">Oracle Reply</h2>
          <p className="mt-3 text-sm text-stone-400">
            {new Date(latestReading.created_at).toLocaleString()}
          </p>
          <p className="mt-4 text-stone-300">Question: {latestReading.question}</p>
          <article className="tinder-card mt-5">
            <p className="text-lg leading-relaxed text-stone-100">
              {singleReply(latestReading)}
            </p>
          </article>
          <p className="mt-5 rounded-lg border border-amber-200/20 bg-amber-50/5 px-4 py-3 text-sm text-amber-100">
            Entertainment only. This reply is for reflection, not guaranteed outcomes.
          </p>
        </section>
      ) : null}
    </main>
  );
}
