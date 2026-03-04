import Link from "next/link";
import { redirect } from "next/navigation";

import { signOut } from "@/app/auth/actions";
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

export default async function HistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data } = await supabase
    .from("readings")
    .select(
      "id, question, present_energy, path_a, path_b, hidden_influence, reflection_question, created_at",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const readings = (data ?? []) as ReadingRow[];

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-16">
      <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="oracle-eyebrow">Your Oracle</p>
          <h1 className="mt-2 font-title text-4xl text-stone-100 md:text-5xl">
            Reading History
          </h1>
          <p className="mt-3 text-stone-300">{readings.length} reading(s) saved</p>
        </div>
        <div className="flex gap-3">
          <Link href="/oracle" className="oracle-button inline-flex items-center">
            Back to Oracle
          </Link>
          <form action={signOut}>
            <button type="submit" className="oracle-button">
              Sign Out
            </button>
          </form>
        </div>
      </header>

      <p className="mb-6 rounded-lg border border-amber-200/20 bg-amber-50/5 px-4 py-3 text-sm text-amber-100">
        Entertainment only. Readings are reflective prompts, not guaranteed predictions or professional advice.
      </p>

      {readings.length === 0 ? (
        <section className="oracle-card p-8 md:p-10">
          <p className="text-stone-300">
            No readings yet. Ask your first question on the Oracle page.
          </p>
        </section>
      ) : (
        <section className="space-y-6">
          {readings.map((reading) => (
            <article key={reading.id} className="oracle-card p-8 md:p-10">
              <p className="text-sm text-stone-400">
                {new Date(reading.created_at).toLocaleString()}
              </p>
              <p className="mt-2 text-stone-200">Question: {reading.question}</p>

              <article className="tinder-card mt-5">
                <p className="text-lg leading-relaxed text-stone-100">
                  {singleReply(reading)}
                </p>
              </article>

              <p className="mt-5 text-sm italic text-stone-400">
                For reflection and entertainment.
              </p>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
