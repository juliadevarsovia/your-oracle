export type OracleReadingResult = {
  binaryAnswer: "YES" | "NO" | null;
  presentEnergy: string;
  pathA: string;
  pathB: string;
  hiddenInfluence: string;
  reflectionQuestion: string;
};

type JsonRecord = Record<string, unknown>;

function hashSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function pick<T>(items: T[], seed: number, offset: number): T {
  return items[(seed + offset) % items.length];
}

function extractFocus(question: string): string {
  const words = question
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((word) => word.length >= 4);

  return words[0] ?? "this situation";
}

function looksLikeYesNoQuestion(question: string): boolean {
  const q = question.trim().toLowerCase();
  if (!q.endsWith("?")) {
    return false;
  }

  return /^(should|can|is|are|do|does|did|will|would|could|am|have|has)\b/.test(q);
}

function fallbackBinaryAnswer(question: string): "YES" | "NO" | null {
  if (!looksLikeYesNoQuestion(question)) {
    return null;
  }

  return hashSeed(question) % 2 === 0 ? "YES" : "NO";
}

function buildFallbackReading(question: string): OracleReadingResult {
  const seed = hashSeed(`${question}:${new Date().toISOString().slice(0, 10)}`);
  const focus = extractFocus(question);

  const presentEnergyOptions = [
    "This suggests you are at a threshold where clarity grows when you slow down and observe patterns before reacting.",
    "This suggests your energy is split between responsibility and desire, and balance may come from choosing one priority at a time.",
    "This suggests momentum is available, but it is asking for intention rather than speed.",
    "This suggests a quiet reset is happening, and small choices may matter more than dramatic moves right now.",
  ];

  const pathAOptions = [
    "Consider Path A as the steady route: protect your foundation, move in smaller steps, and let consistency build confidence.",
    "Consider Path A as a practical route: gather more evidence, reduce uncertainty, and commit after one clear signal.",
    "Consider Path A as the patient route: simplify what is on your plate, then expand once your core feels stable.",
    "Consider Path A as the grounded route: honor your current limits while strengthening what already works.",
  ];

  const pathBOptions = [
    "Consider Path B as the bold route: test a meaningful change and stay open to learning as you go.",
    "Consider Path B as an exploratory route: follow curiosity first, then refine direction from real feedback.",
    "Consider Path B as a creative route: allow experimentation, even if the first version is imperfect.",
    "Consider Path B as a courageous route: choose growth over comfort, while keeping one anchor point secure.",
  ];

  const hiddenInfluenceOptions = [
    "This suggests a hidden influence may be old expectations that no longer match who you are becoming.",
    "This suggests a hidden influence may be fatigue, which can make urgent choices feel more dramatic than they are.",
    "This suggests a hidden influence may be fear of disappointing others, even when your inner direction is clear.",
    "This suggests a hidden influence may be the urge to decide quickly, when more insight could emerge with a short pause.",
  ];

  const reflectionQuestionOptions = [
    `What would choosing with self-trust look like in ${focus}?`,
    `If you removed external pressure, what choice around ${focus} would feel most honest?`,
    `What small action in ${focus} would give you the clearest signal this week?`,
    `Where in ${focus} are you ready to trade certainty for aligned progress?`,
  ];

  return {
    binaryAnswer: fallbackBinaryAnswer(question),
    presentEnergy: pick(presentEnergyOptions, seed, 1),
    pathA: pick(pathAOptions, seed, 2),
    pathB: pick(pathBOptions, seed, 3),
    hiddenInfluence: pick(hiddenInfluenceOptions, seed, 4),
    reflectionQuestion: pick(reflectionQuestionOptions, seed, 5),
  };
}

function isBinaryAnswer(value: unknown): value is "YES" | "NO" | null {
  return value === "YES" || value === "NO" || value === null;
}

function isValidReading(value: unknown): value is OracleReadingResult {
  if (!value || typeof value !== "object") {
    return false;
  }

  const maybe = value as JsonRecord;
  return (
    isBinaryAnswer(maybe.binaryAnswer) &&
    typeof maybe.presentEnergy === "string" &&
    typeof maybe.pathA === "string" &&
    typeof maybe.pathB === "string" &&
    typeof maybe.hiddenInfluence === "string" &&
    typeof maybe.reflectionQuestion === "string"
  );
}

function extractText(data: JsonRecord): string | null {
  if (typeof data.output_text === "string" && data.output_text.trim().length > 0) {
    return data.output_text;
  }

  const output = data.output;
  if (!Array.isArray(output)) {
    return null;
  }

  for (const item of output) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const content = (item as JsonRecord).content;
    if (!Array.isArray(content)) {
      continue;
    }

    for (const block of content) {
      if (!block || typeof block !== "object") {
        continue;
      }

      const text = (block as JsonRecord).text;
      if (typeof text === "string" && text.trim().length > 0) {
        return text;
      }
    }
  }

  return null;
}

async function generateWithOpenAI(question: string): Promise<OracleReadingResult | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const model = process.env.ORACLE_AI_MODEL ?? "gpt-4.1-mini";

  const system = [
    "You are an oracle-style reflection guide.",
    "Never predict the future with certainty.",
    "Use language such as 'This suggests...' or 'Consider...'.",
    "If the user asked a clear yes/no question, set binaryAnswer to YES or NO.",
    "Otherwise set binaryAnswer to null.",
    "Keep each field concise (1-2 sentences).",
    "Return only valid JSON.",
  ].join(" ");

  const prompt = [
    "Create a structured oracle reading for this question:",
    question,
    "JSON keys required: binaryAnswer, presentEnergy, pathA, pathB, hiddenInfluence, reflectionQuestion",
    "No markdown.",
  ].join("\n\n");

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content: [{ type: "input_text", text: system }],
        },
        {
          role: "user",
          content: [{ type: "input_text", text: prompt }],
        },
      ],
      temperature: 0.8,
      text: {
        format: {
          type: "json_schema",
          name: "oracle_reading",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              binaryAnswer: {
                anyOf: [
                  { type: "string", enum: ["YES", "NO"] },
                  { type: "null" },
                ],
              },
              presentEnergy: { type: "string" },
              pathA: { type: "string" },
              pathB: { type: "string" },
              hiddenInfluence: { type: "string" },
              reflectionQuestion: { type: "string" },
            },
            required: [
              "binaryAnswer",
              "presentEnergy",
              "pathA",
              "pathB",
              "hiddenInfluence",
              "reflectionQuestion",
            ],
          },
        },
      },
    }),
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as JsonRecord;
  const text = extractText(data);
  if (!text) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(text);
    return isValidReading(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function generateOracleReading(
  question: string,
): Promise<OracleReadingResult> {
  const aiReading = await generateWithOpenAI(question);
  return aiReading ?? buildFallbackReading(question);
}
