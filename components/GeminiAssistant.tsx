import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { ChatMessage } from '../types';
import { generateCodeRefinement, askGeminiExplanation } from '../services/geminiService';

interface GeminiAssistantProps {
  code: string;
  onCodeUpdate: (newCode: string) => void;
}

const GeminiAssistant: React.FC<GeminiAssistantProps> = ({ code, onCodeUpdate }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Hi! I can help you modify this Next.js Route Handler or explain how it works. What do you need?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'chat' | 'edit'>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsLoading(true);

    try {
      if (mode === 'edit') {
        const newCode = await generateCodeRefinement(code, userMsg);
        onCodeUpdate(newCode);
        setMessages(prev => [...prev, { 
          role: 'model', 
          text: `I've updated the code based on your request: "${userMsg}". Check the Code Viewer!` 
        }]);
      } else {
        const response = await askGeminiExplanation(code, userMsg);
        setMessages(prev => [...prev, { role: 'model', text: response }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: 'Sorry, I encountered an error processing your request.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200 shadow-xl overflow-hidden">
      <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Sparkles size={20} className="text-blue-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-800">Gemini Assistant</h2>
            <p className="text-xs text-gray-500">Powered by gemini-3-pro</p>
          </div>
        </div>
        
        <div className="flex bg-gray-200 p-1 rounded-lg">
          <button
            onClick={() => setMode('chat')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              mode === 'chat' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Chat
          </button>
          <button
            onClick={() => setMode('edit')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              mode === 'edit' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Modify Code
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-gray-50/50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'model' && (
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Bot size={16} className="text-blue-600" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-white text-gray-700 border border-gray-100 rounded-bl-none'
              }`}
            >
              {msg.text}
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                <User size={16} className="text-gray-600" />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3 justify-start">
             <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Loader2 size={16} className="text-blue-600 animate-spin" />
              </div>
              <div className="bg-white text-gray-500 border border-gray-100 rounded-2xl rounded-bl-none px-4 py-2.5 text-sm shadow-sm italic">
                Thinking...
              </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-gray-100">
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode === 'chat' ? "Ask a question about the code..." : "Describe changes (e.g., 'Add branch support')"}
            className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={16} />
          </button>
        </form>
        <p className="text-[10px] text-center text-gray-400 mt-2">
          {mode === 'edit' ? 'Requests will modify the code in the viewer.' : 'Requests will only generate text explanations.'}
        </p>
      </div>
    </div>
  );
};

export default GeminiAssistant;
