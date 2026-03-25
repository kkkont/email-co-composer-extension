import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface EmailIntent {
  goal: string;
  mainMessage: string;
  recipientContext: string;
  tone: string;
  length: string;
  urgency: string;
  extraNotes: string;
}

export async function generateEmail(intent: EmailIntent): Promise<string> {
  const systemPrompt = `You are a professional email writing assistant. Generate an email based on the user's intent. Write only the email body — no subject line, no meta-commentary.`;

  const userPrompt = `Write an email with the following details:
- Goal: ${intent.goal}
- Main message: ${intent.mainMessage}
- Recipient context: ${intent.recipientContext}
- Tone: ${intent.tone}
- Length: ${intent.length}
- Urgency: ${intent.urgency}
${intent.extraNotes ? `- Extra notes: ${intent.extraNotes}` : ""}`;

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 1024,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from OpenAI");
  }

  return content;
}