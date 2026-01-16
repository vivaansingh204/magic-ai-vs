export type MessageRole = 'user' | 'model' | 'system';

export interface MessagePart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  parts: MessagePart[];
  timestamp: Date;
  sources?: GroundingSource[];
  isGenerating?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  lastTimestamp: number;
}

export interface VoiceSession {
  id: string;
  title: string;
  transcript: string;
  timestamp: number;
}

export interface Note {
  id: string;
  content: string;
  timestamp: number;
  source?: 'manual' | 'chat';
}

export interface AccountSettings {
  language: Language;
  theme: 'light' | 'dark';
  voice: 'Vivaan' | 'Suchita';
  location: string;
  timezone: string;
  isPublished?: boolean;
}

export interface UserAccount {
  id: string;
  name: string;
  sessions: ChatSession[];
  voiceSessions?: VoiceSession[];
  notes: Note[];
  settings: AccountSettings;
}

export enum AppMode {
  CHAT = 'chat',
  VISION = 'vision',
  VOICE = 'voice',
  IMAGE_GEN = 'image_gen',
  DRAW = 'draw',
  NOTES = 'notes',
  GAME = 'game',
  SETTINGS = 'settings',
  ACCOUNTS = 'accounts'
}

export type Language = 'English' | 'Hindi' | 'French' | 'German';