export interface ChatTurn {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface GeminiResponse {
  response: string;
  action: 'RESPOND' | 'ASK_FOR_CONTACT' | 'INITIATE_HANDOFF';
}

export interface Session {
  history: ChatTurn[];
  handoffStatus: 'none' | 'pending' | 'active';
  contactInfo?: string;
}

export interface WhatsappMessage {
  from: string;
  text: string;
  timestamp: string;
}
