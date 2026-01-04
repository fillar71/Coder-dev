import React, { useState } from 'react';
import { Folder, FolderOpen, FileCode, ChevronRight, ChevronDown, FileJson, FileType, File } from 'lucide-react';

export interface FileNode {
  name: string;
  type: 'folder' | 'file';
  children?: FileNode[];
}

interface FileExplorerProps {
  onSelectFile: (path: string) => void;
  className?: string;
}

// Mock File System representing a standard Next.js App Router structure
const MOCK_FILE_SYSTEM: FileNode[] = [
  {
    name: 'app',
    type: 'folder',
    children: [
      { name: 'api', type: 'folder', children: [
        { name: 'commit', type: 'folder', children: [
            { name: 'route.ts', type: 'file' }
        ]}
      ]},
      { name: 'favicon.ico', type: 'file' },
      { name: 'globals.css', type: 'file' },
      { name: 'layout.tsx', type: 'file' },
      { name: 'page.tsx', type: 'file' },
      { name: 'loading.tsx', type: 'file' },
      { name: 'error.tsx', type: 'file' },
    ]
  },
  {
    name: 'components',
    type: 'folder',
    children: [
      { name: 'ui', type: 'folder', children: [
        { name: 'button.tsx', type: 'file' },
        { name: 'card.tsx', type: 'file' },
        { name: 'input.tsx', type: 'file' },
      ]},
      { name: 'CommitCard.tsx', type: 'file' },
      { name: 'CodePreview.tsx', type: 'file' },
      { name: 'FileExplorer.tsx', type: 'file' },
      { name: 'Header.tsx', type: 'file' },
    ]
  },
  {
    name: 'lib',
    type: 'folder',
    children: [
      { name: 'utils.ts', type: 'file' },
      { name: 'gemini.ts', type: 'file' },
    ]
  },
  {
    name: 'public',
    type: 'folder',
    children: [
      { name: 'logo.svg', type: 'file' },
    ]
  },
  { name: '.gitignore', type: 'file' },
  { name: 'next.config.js', type: 'file' },
  { name: 'package.json', type: 'file' },
  { name: 'tailwind.config.ts', type: 'file' },
  { name: 'tsconfig.json', type: 'file' },
  { name: 'README.md', type: 'file' },
];

const FileIcon: React.FC<{ name: string }> = ({ name }) => {
  if (name.endsWith('.tsx') || name.endsWith('.ts') || name.endsWith('.js')) return <FileCode size={14} className="text-blue-500" />;
  if (name.endsWith('.json')) return <FileJson size={14} className="text-yellow-500" />;
  if (name.endsWith('.css')) return <FileType size={14} className="text-sky-400" />;
  return <File size={14} className="text-gray-400" />;
};

interface FileTreeNodeProps {
  node: FileNode;
  path: string;
  onSelect: (p: string) => void;
}

const FileTreeNode: React.FC<FileTreeNodeProps> = ({ node, path, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const currentPath = path ? `${path}/${node.name}` : node.name;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.type === 'folder') {
      setIsOpen(!isOpen);
    } else {
      onSelect(currentPath);
    }
  };

  return (
    <div className="select-none">
      <div 
        onClick={handleClick}
        className={`flex items-center gap-1.5 px-2 py-1 cursor-pointer hover:bg-gray-100 transition-colors text-xs rounded-sm mx-1 ${isOpen ? 'bg-gray-50' : ''}`}
        style={{ paddingLeft: path ? '1.5rem' : '0.5rem' }}
      >
        <span className="text-gray-400 shrink-0 w-4 flex justify-center">
          {node.type === 'folder' && (
            isOpen ? <ChevronDown size={10} /> : <ChevronRight size={10} />
          )}
        </span>
        
        <span className="shrink-0">
          {node.type === 'folder' ? (
             isOpen ? <FolderOpen size={14} className="text-blue-400" /> : <Folder size={14} className="text-blue-300" />
          ) : (
             <FileIcon name={node.name} />
          )}
        </span>
        
        <span className={`font-mono truncate ${node.type === 'folder' ? 'font-medium text-gray-700' : 'text-gray-600'}`}>
          {node.name}
        </span>
      </div>
      
      {node.type === 'folder' && isOpen && node.children && (
        <div className="border-l border-gray-100 ml-3 pl-1">
          {node.children.map((child) => (
            <FileTreeNode key={child.name} node={child} path={currentPath} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
};

const FileExplorer: React.FC<FileExplorerProps> = ({ onSelectFile, className = '' }) => {
  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden flex flex-col ${className}`}>
      <div className="bg-gray-50 px-3 py-2 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
        Project Explorer
      </div>
      <div className="overflow-y-auto max-h-64 p-1 custom-scrollbar">
        {MOCK_FILE_SYSTEM.map((node) => (
          <FileTreeNode key={node.name} node={node} path="" onSelect={onSelectFile} />
        ))}
      </div>
    </div>
  );
};

export default FileExplorer;