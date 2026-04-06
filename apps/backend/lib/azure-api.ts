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
}

export async function generateEmail(intent: EmailIntent): Promise<string> {
  // Map sliders to concrete constraints
  const toneInstruction =
    intent.tone < 0.33
      ? "Use a casual, friendly tone. Use contractions (I'm, we'll, don't). Keep greetings informal (e.g. 'Hi', 'Hey'). Avoid corporate jargon."
      : intent.tone < 0.66
        ? "Use a neutral, polite tone. Mix of contractions and full forms. Standard greetings (e.g. 'Hello', 'Hi'). Balanced professionalism."
        : "Use a formal, professional tone. No contractions. Use formal greetings (e.g. 'Dear'). Use professional language throughout.";

  const lengthInstruction =
    intent.length < 0.33
      ? "CRITICAL: Keep the email VERY SHORT — 2 to 4 sentences maximum. Get straight to the point. No filler, no pleasantries beyond a one-word greeting. Do NOT exceed 4 sentences."
      : intent.length < 0.66
        ? "Keep the email moderate length — around 5 to 8 sentences. Include a brief greeting, the main point, and a short closing."
        : "Write a detailed email — 8 to 15 sentences. Include context, explanation, and a thorough closing. Elaborate where helpful.";

  const urgencyInstruction = intent.urgency
    ? "Clearly convey urgency. Include phrases like 'time-sensitive', 'as soon as possible', or 'immediate attention needed'. Make the deadline/urgency explicit early in the email."
    : "";

  const goalInstruction = intent.goal
    ? `The communicative goal is to "${intent.goal}". Structure the email to clearly achieve this goal.`
    : "";

  const systemPrompt = `You are an email writing assistant. Write ONLY the email body — no subject line, no labels, no meta-commentary, no explanations. Output just the email text ready to send.

You MUST follow these style and formatting rules exactly:`;

  const userPrompt = `Write an email with these exact requirements:

RECIPIENT: ${intent.recipientContext}
MAIN MESSAGE: ${intent.mainMessage}

${goalInstruction}

TONE: ${toneInstruction}

LENGTH: ${lengthInstruction}

${urgencyInstruction ? `URGENCY: ${urgencyInstruction}` : ""}
${intent.extraNotes ? `ADDITIONAL CONTEXT: ${intent.extraNotes}` : ""}

Remember: Output ONLY the email body. Follow the LENGTH constraint strictly.`;

  // Scale max_tokens to match length setting
  const maxTokens =
    intent.length < 0.33 ? 200 : intent.length < 0.66 ? 512 : 1024;

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: maxTokens,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from OpenAI");
  }

  return content;
}
