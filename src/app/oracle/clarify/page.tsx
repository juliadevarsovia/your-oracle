import Link from "next/link";
import { redirect } from "next/navigation";

import { signOut } from "@/app/auth/actions";
import { askOracle } from "@/app/oracle/actions";
import { createClient } from "@/lib/supabase/server";

export default async function ClarifyPage({
  searchParams,
}: {
  searchParams: Promise<{ original?: string; prompt?: string }>;
}) {
  const params = await searchParams;
  const originalQuestion = params.original?.trim() ?? "";
  const prompt = params.prompt?.trim() ?? "";

  if (!originalQuestion || !prompt) {
    redirect("/oracle");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-4 py-10 md:px-6 md:py-14">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="oracle-eyebrow">Your Oracle</p>
          <h1 className="mt-1 font-title text-4xl text-stone-100 md:text-5xl">
            Clarification Requested
          </h1>
        </div>
        <div className="flex gap-3">
          <Link href="/oracle" className="oracle-button inline-flex items-center">
            Back
          </Link>
          <form action={signOut}>
            <button type="submit" className="oracle-button">
              Sign Out
            </button>
          </form>
        </div>
      </header>

      <p className="mb-5 rounded-lg border border-amber-200/20 bg-amber-50/5 px-4 py-3 text-sm text-amber-100">
        Entertainment only. This oracle exchange is for reflection and not guaranteed outcomes.
      </p>

      <section className="oracle-card p-6 md:p-8">
        <p className="text-sm text-stone-300">Your original question</p>
        <p className="mt-2 text-stone-100">{originalQuestion}</p>

        <p className="mt-6 text-sm text-stone-300">The Oracle asks</p>
        <p className="mt-2 text-lg text-amber-100">{prompt}</p>

        <form action={askOracle} className="mt-6">
          <input type="hidden" name="mode" value="clarify" />
          <input type="hidden" name="originalQuestion" value={originalQuestion} />
          <label htmlFor="question" className="text-sm text-stone-300">
            Your clarification
          </label>
          <textarea
            id="question"
            name="question"
            rows={4}
            required
            minLength={10}
            placeholder="I am mostly afraid of letting people down if I choose the riskier path."
            className="mt-3 w-full rounded-xl border border-amber-300/20 bg-[#131118] px-4 py-3 text-stone-100 placeholder:text-stone-500 focus:border-amber-200/70 focus:outline-none"
          />

          <button type="submit" className="oracle-button mt-5">
            Send Clarification
          </button>
        </form>
      </section>
    </main>
  );
}
