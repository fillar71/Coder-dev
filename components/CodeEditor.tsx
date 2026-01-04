import React from 'react';

interface CodeEditorProps {
  code: string;
  onChange: (newCode: string) => void;
  fileName?: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ code, onChange, fileName = 'App.js' }) => {
  return (
    <div className="w-full h-full flex flex-col overflow-hidden rounded-lg border border-gray-800 shadow-2xl bg-[#1e1e1e]">
      <div className="flex-none px-4 py-2 bg-[#252526] border-b border-gray-800 flex justify-between items-center">
         <span className="text-xs text-gray-400 font-mono flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
            {fileName}
         </span>
         <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Manual Edit Mode</span>
      </div>
      <div className="flex-1 relative group">
        <textarea
            value={code}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 w-full h-full bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm p-4 resize-none outline-none border-none leading-relaxed custom-scrollbar selection:bg-blue-900 selection:text-white"
            spellCheck={false}
            placeholder="// Write your React code here..."
        />
      </div>
    </div>
  );
};

export default CodeEditor;