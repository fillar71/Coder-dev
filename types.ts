export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  structuredData?: any;
}

export interface CodeSnippet {
  filename: string;
  language: string;
  content: string;
}

export type AIProvider = 'google' | 'groq' | 'openai';

export interface AIModelConfig {
  id: string;
  name: string;
  provider: AIProvider;
  description: string;
}

export interface RepoConfig {
  owner: string;
  repo: string;
  branch: string;
  token?: string;
}

export const AVAILABLE_MODELS: AIModelConfig[] = [
  { 
    id: 'gemini-2.0-flash', 
    name: 'Gemini 2.0 Flash', 
    provider: 'google',
    description: 'Fastest Google model, great for everyday tasks.' 
  },
  { 
    id: 'gemini-1.5-pro', 
    name: 'Gemini 1.5 Pro', 
    provider: 'google',
    description: 'High reasoning capability for complex logic.' 
  },
  { 
    id: 'llama-3.3-70b-versatile', 
    name: 'Llama 3.3 70B (Groq)', 
    provider: 'groq',
    description: 'Ultra-fast inference via Groq.' 
  },
  { 
    id: 'gpt-4o', 
    name: 'GPT-4o (OpenAI)', 
    provider: 'openai',
    description: 'OpenAI flagship model.' 
  }
];