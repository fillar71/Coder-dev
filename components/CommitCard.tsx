import React, { useState, useEffect, useRef } from 'react';
import { Github, FileCode, Loader2, AlertCircle, CheckCircle, ChevronDown, History, FolderSearch } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import FileExplorer from './FileExplorer';

interface CommitCardProps {
  data: {
    file_path?: string;
    commit_message?: string;
    new_content?: string;
  };
  onCommit: (data: any) => Promise<void>;
}

interface CommitHistoryItem {
  filePath: string;
  message: string;
  timestamp: number;
}

const COMMON_PATHS = [
  "app/page.tsx",
  "app/layout.tsx",
  "app/loading.tsx",
  "app/error.tsx",
  "app/not-found.tsx",
  "app/globals.css",
  "app/api/route.ts",
  "components/ui/button.tsx",
  "components/ui/card.tsx",
  "components/Header.tsx",
  "components/Footer.tsx",
  "lib/utils.ts",
  "types/index.ts",
  "next.config.js",
  "tailwind.config.ts",
  "package.json"
];

const CommitCard: React.FC<CommitCardProps> = ({ data, onCommit }) => {
  const [isChecked, setIsChecked] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Local state for file path editing
  const [filePath, setFilePath] = useState(data.file_path || '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showExplorer, setShowExplorer] = useState(false);
  
  // Commit History State
  const [recentCommits, setRecentCommits] = useState<CommitHistoryItem[]>([]);
  
  const suggestionsRef = useRef<HTMLUListElement>(null);
  const explorerRef = useRef<HTMLDivElement>(null);

  // Load history from local storage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('commit_history');
    if (savedHistory) {
      try {
        setRecentCommits(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse commit history", e);
      }
    }
  }, []);

  // Click outside to close explorer
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (explorerRef.current && !explorerRef.current.contains(event.target as Node)) {
        setShowExplorer(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const saveToHistory = (path: string, msg: string) => {
    const newItem: CommitHistoryItem = {
      filePath: path,
      message: msg,
      timestamp: Date.now()
    };
    
    // Prepend new item, remove duplicates if necessary (optional), keep last 5
    const updatedHistory = [newItem, ...recentCommits].slice(0, 5);
    
    setRecentCommits(updatedHistory);
    localStorage.setItem('commit_history', JSON.stringify(updatedHistory));
  };

  // Update filtered suggestions based on input
  const filteredPaths = COMMON_PATHS.filter(path => 
    path.toLowerCase().includes(filePath.toLowerCase()) && path !== filePath
  ).slice(0, 5);

  const handleCommitClick = async () => {
    if (!isChecked) return;
    
    setStatus('loading');
    setErrorMessage('');

    try {
      // Use the local filePath which might have been edited by the user
      await onCommit({ ...data, file_path: filePath });
      
      // Save to history on success
      saveToHistory(filePath, data.commit_message || `Update ${filePath}`);
      
      setStatus('success');
    } catch (error: any) {
      setStatus('error');
      setErrorMessage(error.message || 'Failed to commit changes.');
    }
  };

  const handlePathSelect = (path: string) => {
    setFilePath(path);
    setShowSuggestions(false);
  };
  
  const handleExplorerSelect = (path: string) => {
    setFilePath(path);
    setShowExplorer(false);
    setShowSuggestions(false);
  };

  // Close suggestions on blur (with delay to allow click)
  const handleBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm mt-2 overflow-visible transition-all hover:shadow-md relative z-10">
      {/* Header with Editable File Path */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100 rounded-t-lg">
        <div className="flex-1 mr-4 relative">
            <div className="flex gap-2">
              <div className={`flex-1 flex items-center gap-2 px-2 py-1.5 rounded-md border transition-colors ${
                  showSuggestions ? 'border-blue-400 ring-2 ring-blue-100 bg-white' : 'border-transparent hover:border-gray-300 hover:bg-white'
              }`}>
                <FileCode size={14} className="text-blue-500 shrink-0" />
                <input 
                  type="text" 
                  value={filePath}
                  onChange={(e) => setFilePath(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={handleBlur}
                  className="w-full bg-transparent outline-none text-xs font-mono text-gray-700 font-medium placeholder:text-gray-400"
                  placeholder="path/to/file.tsx"
                  disabled={status === 'loading' || status === 'success'}
                />
                <ChevronDown size={12} className={`text-gray-400 transition-transform ${showSuggestions ? 'rotate-180' : ''}`} />
              </div>
              
              <button 
                onClick={() => setShowExplorer(!showExplorer)}
                className={`p-1.5 rounded-md border transition-colors ${showExplorer ? 'bg-blue-100 border-blue-200 text-blue-600' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                title="Browse Repository"
              >
                <FolderSearch size={14} />
              </button>
            </div>

            {/* Autocomplete Dropdown */}
            {showSuggestions && filteredPaths.length > 0 && !showExplorer && (
              <ul ref={suggestionsRef} className="absolute top-full left-0 w-[calc(100%-40px)] mt-1 bg-white border border-gray-200 rounded-md shadow-xl z-50 overflow-hidden max-h-48 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                {filteredPaths.map((path) => (
                  <li 
                    key={path}
                    onClick={() => handlePathSelect(path)}
                    className="px-3 py-2 text-xs font-mono text-gray-600 hover:bg-blue-50 hover:text-blue-700 cursor-pointer border-b border-gray-50 last:border-0 flex items-center gap-2"
                  >
                    <FileCode size={12} className="opacity-50" />
                    {path}
                  </li>
                ))}
              </ul>
            )}
            
            {/* File Explorer Dropdown */}
            {showExplorer && (
              <div ref={explorerRef} className="absolute top-full left-0 w-full mt-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                 <FileExplorer onSelectFile={handleExplorerSelect} />
              </div>
            )}
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
           <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${
             status === 'success' ? 'bg-green-100 text-green-700' : 
             status === 'error' ? 'bg-red-100 text-red-700' :
             'bg-yellow-100 text-yellow-800'
           }`}>
             {status === 'success' ? 'Committed' : status === 'error' ? 'Failed' : 'Pending'}
           </span>
        </div>
      </div>

      {/* Code Preview */}
      <div className="bg-gray-900 border-b border-gray-800 relative group">
        <div className="max-h-48 overflow-auto custom-scrollbar p-3">
          <SyntaxHighlighter 
            language="typescript" 
            style={vscDarkPlus}
            customStyle={{ margin: 0, padding: 0, fontSize: '0.75rem', background: 'transparent' }}
            showLineNumbers={true}
          >
            {data.new_content || ''}
          </SyntaxHighlighter>
        </div>
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-gray-300 text-[10px] px-2 py-1 rounded">
          Preview
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 space-y-4">
        {/* Error Message */}
        {status === 'error' && (
          <div className="flex items-start gap-2 p-3 bg-red-50 text-red-700 text-xs rounded-md border border-red-100 animate-in slide-in-from-top-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold">Commit Failed</p>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Success Message */}
         {status === 'success' && (
          <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 text-xs rounded-md border border-green-100 animate-in slide-in-from-top-2">
            <CheckCircle size={16} className="shrink-0" />
            <div>
              <p className="font-bold">Successfully Committed</p>
              <p>Changes have been pushed to the repository.</p>
            </div>
          </div>
        )}

        {/* Action Area */}
        {status !== 'success' && (
          <div className="space-y-3">
             <div className="flex items-start gap-2">
                <div className="relative flex items-center">
                  <input 
                    type="checkbox" 
                    id={`confirm-${data.commit_message}`}
                    checked={isChecked}
                    onChange={(e) => setIsChecked(e.target.checked)}
                    disabled={status === 'loading'}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5 cursor-pointer"
                  />
                </div>
                <label htmlFor={`confirm-${data.commit_message}`} className="text-xs text-gray-600 leading-tight cursor-pointer select-none">
                  I confirm the changes to <span className="font-mono text-gray-800 bg-gray-100 px-1 rounded">{filePath}</span> and the commit message: <span className="font-medium text-gray-800">"{data.commit_message}"</span>
                </label>
             </div>

             <button 
                onClick={handleCommitClick}
                disabled={!isChecked || status === 'loading'}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-md transition-all shadow-sm ${
                  status === 'loading'
                    ? 'bg-blue-600 text-white opacity-80 cursor-wait'
                    : isChecked
                      ? 'bg-blue-600 hover:bg-blue-700 text-white active:scale-[0.99]'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Committing Changes...
                  </>
                ) : (
                  <>
                    <Github size={14} />
                    Commit Changes
                  </>
                )}
              </button>
          </div>
        )}
      </div>

      {/* Recent History Section */}
      {recentCommits.length > 0 && (
        <div className="bg-gray-50/50 border-t border-gray-100 p-4 rounded-b-lg">
          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <History size={12} /> Recent Local Commits
          </h4>
          <ul className="space-y-3">
            {recentCommits.map((commit, idx) => (
              <li key={idx} className="flex flex-col gap-1 text-xs group">
                <div className="flex items-center justify-between text-gray-700 font-medium">
                  <div className="flex items-center gap-1.5 truncate pr-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0"></span>
                    <span className="truncate" title={commit.message}>{commit.message}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between pl-3">
                  <span className="font-mono text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded truncate max-w-[180px]" title={commit.filePath}>
                    {commit.filePath}
                  </span>
                  <span className="text-[10px] text-gray-300 whitespace-nowrap">
                    {formatTime(commit.timestamp)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CommitCard;