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
  sessionId: string;
  intent: EmailIntent;
  content: string;
  timestamp: Date;
  parentId?: string;
}