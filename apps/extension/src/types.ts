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

export interface GeneratedEmail {
  content: string;
  timestamp: Date;
}

export type CommunicationGoal =
  | "inform"
  | "request"
  | "clarify"
  | "follow-up"
  | "thank"
  | "feedback"
  | "propose"
  | "apologize";

export type LengthType = "short" | "medium" | "long";

export type UrgencyType = "low" | "medium" | "high";
