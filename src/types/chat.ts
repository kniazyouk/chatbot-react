export interface ChatTurn {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface ChatResponse {
  response: string;
  action: 'RESPOND' | 'ASK_FOR_CONTACT' | 'HANDOFF_INITIATED';
  sessionId: string;
}
