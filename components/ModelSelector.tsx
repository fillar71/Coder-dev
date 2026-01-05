import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Cpu, Zap, Brain, Sparkles } from 'lucide-react';
import { AIModelConfig, AVAILABLE_MODELS } from '../types';

interface ModelSelectorProps {
  currentModel: AIModelConfig;
  onSelect: (model: AIModelConfig) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ currentModel, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'google': return <Sparkles size={14} className="text-blue-500" />;
      case 'groq': return <Zap size={14} className="text-orange-500" />;
      case 'openai': return <Brain size={14} className="text-green-500" />;
      default: return <Cpu size={14} className="text-gray-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-all text-xs font-medium text-gray-700 w-48 justify-between"
      >
        <div className="flex items-center gap-2 truncate">
          {getProviderIcon(currentModel.provider)}
          <span className="truncate">{currentModel.name}</span>
        </div>
        <ChevronDown size={12} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Select AI Model
          </div>
          <div className="max-h-64 overflow-y-auto">
            {AVAILABLE_MODELS.map((model) => (
              <button
                key={model.id}
                onClick={() => {
                  onSelect(model);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 hover:bg-blue-50 transition-colors flex items-start gap-3 group border-b border-gray-50 last:border-0 ${
                  currentModel.id === model.id ? 'bg-blue-50/50' : ''
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {getProviderIcon(model.provider)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-xs font-semibold truncate ${currentModel.id === model.id ? 'text-blue-700' : 'text-gray-700'}`}>
                    {model.name}
                  </div>
                  <div className="text-[10px] text-gray-400 truncate mt-0.5 group-hover:text-blue-500/70">
                    {model.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelSelector;