import React, { useState } from 'react';
import { Copy, Check, FileCode } from 'lucide-react';

interface CodeViewerProps {
  code: string;
  filename: string;
}

const CodeViewer: React.FC<CodeViewerProps> = ({ code, filename }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-lg overflow-hidden border border-gray-700 shadow-xl">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2 text-gray-200">
          <FileCode size={18} className="text-blue-400" />
          <span className="font-mono text-sm font-medium">{filename}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
        >
          {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
          {copied ? 'Copied!' : 'Copy Code'}
        </button>
      </div>
      <div className="flex-1 overflow-auto p-4 custom-scrollbar">
        <pre className="font-mono text-sm text-gray-300 whitespace-pre-wrap break-all leading-relaxed">
          {code}
        </pre>
      </div>
    </div>
  );
};

export default CodeViewer;
