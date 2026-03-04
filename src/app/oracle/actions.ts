"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { generateOracleReading } from "@/lib/oracle/generate-reading";
import { createClient } from "@/lib/supabase/server";

const DAILY_FREE_LIMIT = 3;

const CLARIFICATION_QUESTIONS = [
  "Before I answer, what outcome are you most afraid of in this decision?",
  "Name the one value you refuse to compromise while choosing this path.",
  "If you trusted yourself fully, what option would you test first for 7 days?",
  "What part of this choice is truly yours, and what part belongs to outside pressure?",
];

function dayBoundsUtc() {
  const now = new Date();
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

function shouldAskClarification(totalReadings: number): boolean {
  if (totalReadings < 2) {
    return false;
  }

  const chance = totalReadings % 3 === 2 ? 0.65 : 0.18;
  return Math.random() < chance;
}

export async function askOracle(formData: FormData) {
  const question = formData.get("question")?.toString().trim();
  const mode = formData.get("mode")?.toString();
  const originalQuestion = formData.get("originalQuestion")?.toString().trim();

  if (!question || question.length < 10) {
    redirect("/oracle?error=Please+enter+a+question+with+at+least+10+characters");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { start, end } = dayBoundsUtc();

  const [{ count: todayCount, error: countError }, { count: totalCount }] =
    await Promise.all([
      supabase
        .from("readings")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", start.toISOString())
        .lt("created_at", end.toISOString()),
      supabase
        .from("readings")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
    ]);

  if (countError) {
    redirect("/oracle?error=Could+not+check+daily+limit");
  }

  if ((todayCount ?? 0) >= DAILY_FREE_LIMIT) {
    redirect(
      "/oracle?error=Daily+limit+reached.+You+used+all+free+readings+for+today.&limit=1",
    );
  }

  if (mode !== "clarify" && shouldAskClarification(totalCount ?? 0)) {
    const randomQuestion =
      CLARIFICATION_QUESTIONS[
        Math.floor(Math.random() * CLARIFICATION_QUESTIONS.length)
      ];

    redirect(
      `/oracle/clarify?original=${encodeURIComponent(question)}&prompt=${encodeURIComponent(randomQuestion)}`,
    );
  }

  const promptForModel =
    mode === "clarify" && originalQuestion
      ? `Original question: ${originalQuestion}\n\nClarification from user: ${question}`
      : question;

  const reading = await generateOracleReading(promptForModel);
  const yesNoLead = reading.binaryAnswer
    ? `Oracle answer: ${reading.binaryAnswer}. `
    : "";

  const { error: insertError } = await supabase.from("readings").insert({
    user_id: user.id,
    question: mode === "clarify" && originalQuestion ? originalQuestion : question,
    present_energy: `${yesNoLead}${reading.presentEnergy}`,
    path_a: reading.pathA,
    path_b: reading.pathB,
    hidden_influence: reading.hiddenInfluence,
    reflection_question: reading.reflectionQuestion,
  });

  if (insertError) {
    redirect(`/oracle?error=${encodeURIComponent(insertError.message)}`);
  }

  revalidatePath("/oracle");
  revalidatePath("/history");
  revalidatePath("/oracle/clarify");
  redirect("/oracle?message=Your+oracle+reading+is+ready");
}
