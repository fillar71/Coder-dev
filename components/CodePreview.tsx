import React from 'react';
import { Sandpack } from "@codesandbox/sandpack-react";

interface CodePreviewProps {
  code: string;
  isFullHeight?: boolean;
}

const CodePreview: React.FC<CodePreviewProps> = ({ code, isFullHeight = false }) => {
  return (
    <div 
      className={`w-full rounded-lg overflow-hidden border border-gray-700 shadow-2xl bg-gray-900 ${
        isFullHeight ? 'h-full flex flex-col' : 'my-4'
      }`}
    >
      <div className="bg-gray-900 px-4 py-2 text-xs font-mono text-gray-400 border-b border-gray-700 flex justify-between items-center shrink-0">
        <span>Live Preview</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Interactive</span>
      </div>
      <div className={isFullHeight ? 'flex-1 overflow-hidden' : ''}>
        <Sandpack 
          template="react"
          theme="dark"
          files={{
            "/App.js": code,
          }}
          options={{
            showNavigator: false,
            showTabs: false,
            showLineNumbers: true, 
            showInlineErrors: true,
            editorHeight: isFullHeight ? '100%' : 400,
            classes: {
              "sp-wrapper": isFullHeight ? "h-full" : "",
              "sp-layout": isFullHeight ? "h-full" : "",
              "sp-stack": isFullHeight ? "h-full" : "",
            } 
          }}
          customSetup={{
            dependencies: {
              "lucide-react": "latest",
              "tailwindcss": "latest"
            }
          }}
        />
      </div>
    </div>
  );
};

export default CodePreview;