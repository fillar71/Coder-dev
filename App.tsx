import React, { useState, useRef, useEffect } from 'react';
import { Send, Github, Bot, User, Loader2, Terminal, MessageSquare, Eye, Code, PlusCircle, History, Layers } from 'lucide-react';
import { chatWithAI, AIResponse } from './services/geminiService';
import { chatHistoryService, ChatSession } from './services/chatHistoryService';
import CodePreview from './components/CodePreview';
import CommitCard from './components/CommitCard';
import CodeEditor from './components/CodeEditor';
import ChatHistorySidebar from './components/ChatHistorySidebar';
import ModelSelector from './components/ModelSelector';
import { AIModelConfig, AVAILABLE_MODELS } from './types';

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  structuredData?: AIResponse['structuredData'];
}

const INITIAL_MESSAGE: Message = { 
  id: '1', 
  role: 'model', 
  content: 'Hello! I am your AI Fullstack Engineer. I can help you write React components and commit them directly to your GitHub repository via your route handler. What shall we build today?' 
};

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'chat' | 'editor' | 'preview'>('chat');
  const [currentCode, setCurrentCode] = useState<string>('');
  
  // Model State
  // Default to Gemini 2.0 Flash
  const [currentModel, setCurrentModel] = useState<AIModelConfig>(AVAILABLE_MODELS[0]);
  
  // History State
  const [showHistory, setShowHistory] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (viewMode === 'chat') {
      scrollToBottom();
    }
  }, [messages, viewMode]);

  // Load sessions on mount or when sidebar opens
  useEffect(() => {
    if (showHistory) {
      loadSessions();
    }
  }, [showHistory]);

  const loadSessions = async () => {
    const loadedSessions = await chatHistoryService.getSessions();
    setSessions(loadedSessions);
  };

  const handleNewChat = () => {
    setMessages([{ ...INITIAL_MESSAGE, id: Date.now().toString() }]);
    setCurrentCode('');
    setViewMode('chat');
    setInput('');
    setCurrentSessionId(null);
  };

  const handleLoadSession = async (sessionId: string) => {
    setIsLoading(true);
    try {
      const dbMessages = await chatHistoryService.getSessionMessages(sessionId);
      
      const uiMessages: Message[] = dbMessages.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        structuredData: m.structured_data
      }));
      
      // If empty (shouldn't happen), use initial
      if (uiMessages.length === 0) {
        setMessages([INITIAL_MESSAGE]);
      } else {
        setMessages(uiMessages);
      }
      
      // Restore code state from the last message that had code
      const lastCodeMessage = [...uiMessages].reverse().find(m => m.structuredData?.preview_content);
      if (lastCodeMessage?.structuredData?.preview_content) {
        setCurrentCode(lastCodeMessage.structuredData.preview_content);
      }

      setCurrentSessionId(sessionId);
      setViewMode('chat');
    } catch (error) {
      console.error("Failed to load session", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    if (viewMode === 'preview' || viewMode === 'editor') setViewMode('chat');

    const userContent = input.trim();
    const userMessageId = Date.now().toString();
    const userMessage: Message = {
      id: userMessageId,
      role: 'user',
      content: userContent
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Session Management: Create session if it doesn't exist
    let activeSessionId = currentSessionId;
    try {
      if (!activeSessionId) {
        const newSession = await chatHistoryService.createSession(userContent);
        if (newSession) {
          activeSessionId = newSession.id;
          setCurrentSessionId(newSession.id);
          // If we just created a session, reload the list in background if history is open
          if (showHistory) loadSessions();
        }
      }

      // Save user message to Supabase
      if (activeSessionId) {
        await chatHistoryService.saveMessage(activeSessionId, 'user', userContent);
      }

      // Prepare history for API
      const history = messages.map(m => ({ role: m.role, text: m.content }));

      // Call AI with current Model Configuration
      const response = await chatWithAI(history, userContent, currentModel);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: response.text,
        structuredData: response.structuredData
      };
      
      if (response.structuredData?.preview_content) {
        setCurrentCode(response.structuredData.preview_content);
      }
      
      setMessages(prev => [...prev, aiMessage]);

      // Save AI message to Supabase
      if (activeSessionId) {
        await chatHistoryService.saveMessage(
          activeSessionId, 
          'model', 
          response.text, 
          response.structuredData
        );
      }

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'model', 
        content: "Sorry, something went wrong processing your request." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommit = async (data: NonNullable<AIResponse['structuredData']>) => {
    if (!data.new_content || !data.file_path) {
      throw new Error("Invalid commit data: missing content or file path.");
    }

    try {
      const response = await fetch('/api/commit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_path: data.file_path,
          new_content: data.new_content,
          commit_message: data.commit_message || `Update ${data.file_path}`
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to commit changes');
      }

      // Optional: You could show a toast here with result.html_url
    } catch (error: any) {
      console.error('Commit API Error:', error);
      throw error; // Propagate error to CommitCard for display
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden">
      
      <ChatHistorySidebar 
        isOpen={showHistory} 
        onClose={() => setShowHistory(false)}
        sessions={sessions}
        onSelectSession={handleLoadSession}
        currentSessionId={currentSessionId}
      />

      {/* Header */}
      <header className="flex-none bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          {/* History Toggle */}
          <button 
            onClick={() => setShowHistory(true)}
            className="p-2 mr-1 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Chat History"
          >
            <History size={20} />
          </button>

          <div className="p-2 bg-gray-900 rounded-lg shadow-md hidden sm:block">
            <Terminal className="text-white" size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                AI Dev Chat
              </h1>
              <button 
                onClick={handleNewChat}
                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
                title="Start New Chat"
              >
                <PlusCircle size={16} />
              </button>
            </div>
            {/* Model Selector placed in header subtile area for mobile or next to title */}
            <div className="mt-1">
               <ModelSelector currentModel={currentModel} onSelect={setCurrentModel} />
            </div>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
          <button
            onClick={() => setViewMode('chat')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              viewMode === 'chat' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <MessageSquare size={14} />
            Chat
          </button>
          <button
            onClick={() => setViewMode('editor')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              viewMode === 'editor' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Code size={14} />
            Editor
          </button>
          <button
            onClick={() => setViewMode('preview')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              viewMode === 'preview' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Eye size={14} />
            Preview
          </button>
        </div>

        <a href="https://github.com" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-gray-900 transition-colors hidden sm:block">
          <Github size={24} />
        </a>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        
        {/* Chat View */}
        <div className={`h-full overflow-y-auto p-4 sm:p-6 space-y-6 ${viewMode === 'chat' ? 'block' : 'hidden'}`}>
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex gap-4 max-w-5xl mx-auto ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'model' && (
                <div className="w-10 h-10 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Bot size={20} className="text-blue-600" />
                </div>
              )}

              <div className={`flex flex-col gap-2 max-w-[95%] sm:max-w-[75%]`}>
                <div 
                  className={`px-5 py-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-br-none' 
                      : 'bg-white border border-gray-200 text-gray-700 rounded-bl-none'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>

                {msg.role === 'model' && msg.structuredData && (
                  <div className="mt-2 animate-fade-in">
                    {/* Small Inline Preview in Chat */}
                    {msg.structuredData.preview_content && (
                       <CodePreview code={msg.structuredData.preview_content} />
                    )}

                    {/* Commit Card */}
                    {msg.structuredData.action === 'COMMIT' && (
                      <CommitCard 
                        data={msg.structuredData} 
                        onCommit={handleCommit} 
                      />
                    )}
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-10 h-10 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <User size={20} className="text-gray-600" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start max-w-5xl mx-auto pl-14">
              <div className="bg-white border border-gray-200 px-4 py-2 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-blue-500" />
                <span className="text-xs text-gray-400 font-medium">
                  Generating with <span className="font-semibold">{currentModel.name}</span>...
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Editor View */}
        <div className={`h-full w-full p-4 bg-gray-100 flex flex-col items-center justify-center ${viewMode === 'editor' ? 'block' : 'hidden'}`}>
           {currentCode ? (
             <div className="w-full h-full max-w-6xl">
                <CodeEditor code={currentCode} onChange={setCurrentCode} />
             </div>
           ) : (
             <div className="text-center text-gray-400">
                <Code size={48} className="mx-auto mb-4 opacity-50" />
                <p className="font-medium">No code to edit</p>
                <p className="text-xs mt-1">Ask the AI to generate some code first.</p>
             </div>
           )}
        </div>

        {/* Preview View */}
        <div className={`h-full w-full p-4 bg-gray-100 flex flex-col items-center justify-center ${viewMode === 'preview' ? 'block' : 'hidden'}`}>
           {currentCode ? (
             <div className="w-full h-full max-w-6xl">
                <CodePreview code={currentCode} isFullHeight={true} />
             </div>
           ) : (
             <div className="text-center text-gray-400">
                <Layers size={48} className="mx-auto mb-4 opacity-50" />
                <p className="font-medium">No preview available</p>
                <p className="text-xs mt-1">Ask the AI to generate some UI code to see it here.</p>
             </div>
           )}
        </div>

      </div>

      {/* Input Area */}
      <div className="flex-none p-4 sm:p-6 bg-white border-t border-gray-200 z-20">
        <form onSubmit={handleSend} className="max-w-5xl mx-auto relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              viewMode === 'preview' ? "Request changes to the preview..." : 
              viewMode === 'editor' ? "Ask for help with the code..." :
              `Ask ${currentModel.name} to build something...`
            }
            className="w-full pl-5 pr-14 py-4 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm placeholder:text-gray-400"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            <Send size={18} />
          </button>
        </form>
        <p className="text-center text-[10px] text-gray-400 mt-3">
          Using {currentModel.name}. AI generated code can be incorrect.
        </p>
      </div>
    </div>
  );
};

export default App;