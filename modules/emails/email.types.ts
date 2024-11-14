// src/types/index.ts
export interface EmailData {
  to: string;
  // Add other email data properties as needed
}

export interface EmailEvent {
  type: string;
  timestamp: string;
  data: Record<string, unknown>;
}
