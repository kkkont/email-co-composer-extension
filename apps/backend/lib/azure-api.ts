import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface EmailIntent {
  goal: string;
  mainMessage: string;
  recipientContext: string;
  tone: number;
  length: number;
  urgency: boolean;
  extraNotes: string;
  language: string;
  /** If present, use this as the base to refine rather than generating from scratch */
  currentDraft?: string;
}

export async function generateEmail(intent: EmailIntent): Promise<string> {
  const toneInstruction =
    intent.tone < 0.2
      ? "Use a very casual, friendly tone. Heavy use of contractions. Informal greetings (e.g. 'Hey'). Conversational language, like texting a friend."
      : intent.tone < 0.4
        ? "Use a casual, relaxed tone. Use contractions freely. Informal greetings (e.g. 'Hi'). Avoid corporate jargon."
        : intent.tone < 0.6
          ? "Use a neutral, polite tone. Mix of contractions and full forms. Standard greetings (e.g. 'Hello'). Balanced professionalism."
          : intent.tone < 0.8
            ? "Use a formal, professional tone. Minimal contractions. Professional greetings (e.g. 'Dear'). Business-appropriate language."
            : "Use a very formal, highly professional tone. No contractions at all. Formal greetings (e.g. 'Dear Mr./Ms.'). Polished, executive-level language.";

  const lengthInstruction =
    intent.length < 0.2
      ? "CRITICAL: Keep the email EXTREMELY SHORT — 1 to 2 sentences only. Just the essential point. No greeting beyond a name. Do NOT exceed 2 sentences."
      : intent.length < 0.4
        ? "CRITICAL: Keep the email VERY SHORT — 2 to 4 sentences maximum. Get straight to the point. Minimal pleasantries. Do NOT exceed 4 sentences."
        : intent.length < 0.6
          ? "Keep the email moderate length — around 5 to 8 sentences. Include a brief greeting, the main point, and a short closing."
          : intent.length < 0.8
            ? "Write a detailed email — 8 to 12 sentences. Include context, explanation, and a thorough closing."
            : "Write a comprehensive, detailed email — 12 to 18 sentences. Elaborate fully, provide background, reasoning, and a complete closing.";

  const urgencyInstruction = intent.urgency
    ? "Clearly convey urgency. Include phrases like 'time-sensitive', 'as soon as possible', or 'immediate attention needed'. Make the deadline/urgency explicit early in the email."
    : "";

  const goalInstruction = intent.goal
    ? `The communicative goal is to "${intent.goal}". Structure the email to clearly achieve this goal.`
    : "";

  const languageInstruction =
    intent.language && intent.language !== "en"
      ? `IMPORTANT: Write the entire email in ${intent.language} language.`
      : "";

  const systemPrompt = `You are an email writing assistant. Write ONLY the email body — no subject line, no labels, no meta-commentary, no explanations. Output just the email text ready to send.
${languageInstruction ? `\n${languageInstruction}\n` : ""}
You MUST follow these style and formatting rules exactly:
- Use proper paragraph formatting: separate the greeting, each body paragraph, and the closing with blank lines.
- Never output the entire email as a single paragraph.`;

  // ── Build user prompt ─────────────────────────────────────────────────────
  const userPrompt = `Write an email with these exact requirements:

RECIPIENT: ${intent.recipientContext}
MAIN MESSAGE: ${intent.mainMessage}

${goalInstruction}

TONE: ${toneInstruction}

LENGTH: ${lengthInstruction}

${urgencyInstruction ? `URGENCY: ${urgencyInstruction}` : ""}
${intent.extraNotes ? `ADDITIONAL CONTEXT: ${intent.extraNotes}` : ""}

Remember: Output ONLY the email body. Follow the LENGTH constraint strictly.`;

  const maxTokens =
    intent.length < 0.2
      ? 128
      : intent.length < 0.4
        ? 200
        : intent.length < 0.6
          ? 512
          : intent.length < 0.8
            ? 768
            : 1024;

  const response = await client.chat.completions.create({
    model: "gpt-5-nano-2025-08-07",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    max_completion_tokens: maxTokens,
    reasoning_effort: "minimal",
  });

  console.log("OpenAI response:", JSON.stringify(response, null, 2));
  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from OpenAI");
  }

  return content;
}