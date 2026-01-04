import React from 'react';
import { X, MessageSquare, Clock, ArrowRight } from 'lucide-react';
import { ChatSession } from '../services/chatHistoryService';

interface ChatHistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  onSelectSession: (sessionId: string) => void;
  currentSessionId: string | null;
}

const ChatHistorySidebar: React.FC<ChatHistorySidebarProps> = ({ 
  isOpen, 
  onClose, 
  sessions, 
  onSelectSession,
  currentSessionId
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <Clock size={18} className="text-blue-600" />
            Chat History
          </h2>
          <button 
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-all"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          {sessions.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <MessageSquare size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No history found</p>
            </div>
          ) : (
            sessions.map((session) => (
              <div 
                key={session.id}
                onClick={() => {
                  onSelectSession(session.id);
                  onClose();
                }}
                className={`group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                  currentSessionId === session.id 
                    ? 'bg-blue-50 border-blue-200 shadow-sm' 
                    : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-100'
                }`}
              >
                <div className={`p-2 rounded-lg shrink-0 ${currentSessionId === session.id ? 'bg-blue-200 text-blue-700' : 'bg-gray-100 text-gray-500 group-hover:bg-white group-hover:shadow-sm'}`}>
                  <MessageSquare size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`text-sm font-medium truncate ${currentSessionId === session.id ? 'text-blue-900' : 'text-gray-700'}`}>
                    {session.title || 'Untitled Conversation'}
                  </h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {formatDate(session.created_at)}
                  </p>
                </div>
                {currentSessionId === session.id && (
                  <ArrowRight size={14} className="text-blue-500" />
                )}
              </div>
            ))
          )}
        </div>
        
        <div className="p-4 border-t border-gray-100 bg-gray-50 text-[10px] text-gray-500 text-center">
          Powered by Supabase & Gemini
        </div>
      </div>
    </>
  );
};

export default ChatHistorySidebar;
