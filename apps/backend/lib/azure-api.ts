import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface EmailIntent {
  goal: string;
  mainMessage: string;
  recipientContext: string;
  tone: number;
  relationalDistance: number;
  length: number;
  urgency: boolean;
  extraNotes: string;
}

export async function generateEmail(intent: EmailIntent): Promise<string> {
  const systemPrompt = `You are a professional email writing assistant. Generate an email based on the user's intent and contextual parameters. Write only the email body — no subject line, no meta-commentary.

Parameters guidance:
- Tone: 0 is Casual, 1 is Formal
- Relational Distance: 0 is Colleague (equal), 1 is Manager (hierarchical)
- Length: 0 is Brief, 1 is Detailed
- Urgency: true indicates immediate action needed`;

  const toneLabel =
    intent.tone < 0.3
      ? "very casual"
      : intent.tone < 0.6
        ? "casual/neutral"
        : "professional/formal";
  const distanceLabel =
    intent.relationalDistance < 0.5 ? "colleague/peer" : "manager/superior";
  const lengthLabel =
    intent.length < 0.3
      ? "very brief"
      : intent.length < 0.7
        ? "moderate"
        : "detailed";

  const userPrompt = `Write an email with the following parameters:
- Goal: ${intent.goal}
- Main message: ${intent.mainMessage}
- Recipient: ${intent.recipientContext}
- Tone: ${toneLabel} (${Math.round(intent.tone * 10)} / 10 on formality scale)
- Relational Distance: ${distanceLabel} (${Math.round(intent.relationalDistance * 100)}%)
- Length: ${lengthLabel} (${Math.round(intent.length * 10)} / 10 on verbosity scale)
- Urgency: ${intent.urgency ? "High - indicate immediate action needed" : "Normal"}
${intent.extraNotes ? `- Additional context: ${intent.extraNotes}` : ""}`;

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
