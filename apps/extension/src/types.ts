export interface EmailIntent {
  goal: string;
  mainMessage: string;
  recipientContext: string;
  tone: string;
  constraints: string;
}

export interface GeneratedEmail {
  content: string;
  timestamp: Date;
}

export type CommunicationGoal =
  | "request"
  | "inform"
  | "clarify"
  | "follow-up"
  | "apologize"
  | "thank";

export type ToneType =
  | "professional"
  | "friendly"
  | "formal"
  | "casual";
