import { supabase } from '../lib/supabase';
import { AIResponse } from './geminiService';

export interface ChatSession {
  id: string;
  created_at: string;
  title: string;
}

export interface SavedMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  structured_data?: any;
  created_at: string;
}

export const chatHistoryService = {
  /**
   * Creates a new chat session
   */
  async createSession(firstMessage: string): Promise<ChatSession | null> {
    if (!supabase) return null;

    // Truncate title
    const title = firstMessage.length > 30 ? firstMessage.substring(0, 30) + '...' : firstMessage;

    const { data, error } = await supabase
      .from('chat_sessions')
      .insert([{ title }])
      .select()
      .single();

    if (error) {
      console.error('Error creating session:', error);
      return null;
    }

    return data;
  },

  /**
   * Saves a message to the database
   */
  async saveMessage(sessionId: string, role: 'user' | 'model', content: string, structuredData?: any) {
    if (!supabase || !sessionId) return;

    const { error } = await supabase
      .from('chat_messages')
      .insert([{
        session_id: sessionId,
        role,
        content,
        structured_data: structuredData || null
      }]);

    if (error) {
      console.error('Error saving message:', error);
    }
  },

  /**
   * Retrieves all chat sessions ordered by date
   */
  async getSessions(): Promise<ChatSession[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching sessions:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Retrieves all messages for a specific session
   */
  async getSessionMessages(sessionId: string): Promise<SavedMessage[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }

    return data || [];
  }
};
