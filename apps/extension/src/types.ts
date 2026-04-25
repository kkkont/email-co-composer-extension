export interface EmailIntent {
  goal: string;
  mainMessage: string;
  recipientContext: string;
  tone: number;
  length: number;
  urgency: boolean;
  extraNotes: string;
}

export interface Draft {
  id: string;
  /** Groups drafts by originating generation session */
  sessionId: string;
  intent: EmailIntent;
  content: string;
  timestamp: Date;
  /** ID of the draft this was refined from */
  parentId?: string;
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