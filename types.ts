export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface CodeSnippet {
  filename: string;
  language: string;
  content: string;
}
