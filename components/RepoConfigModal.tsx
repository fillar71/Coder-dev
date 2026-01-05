import React, { useState, useEffect } from 'react';
import { Github, Save, X, AlertCircle } from 'lucide-react';
import { RepoConfig } from '../types';

interface RepoConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: RepoConfig;
  onSave: (config: RepoConfig) => void;
}

const RepoConfigModal: React.FC<RepoConfigModalProps> = ({ isOpen, onClose, config, onSave }) => {
  const [formData, setFormData] = useState<RepoConfig>(config);
  
  // Reset form when config changes or modal opens
  useEffect(() => {
    setFormData(config);
  }, [config, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-gray-900 px-6 py-4 flex items-center justify-between">
          <h2 className="text-white font-bold flex items-center gap-2">
            <Github size={20} />
            Repository Settings
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg text-xs text-blue-800 flex items-start gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <p>
              Connect a GitHub repository to give the AI context about your file structure. This helps it understand your imports and project layout.
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Owner / Organization</label>
              <input
                type="text"
                required
                value={formData.owner}
                onChange={(e) => setFormData(prev => ({ ...prev, owner: e.target.value }))}
                placeholder="e.g. vercel"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Repository Name</label>
              <input
                type="text"
                required
                value={formData.repo}
                onChange={(e) => setFormData(prev => ({ ...prev, repo: e.target.value }))}
                placeholder="e.g. next.js"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Branch</label>
              <input
                type="text"
                required
                value={formData.branch}
                onChange={(e) => setFormData(prev => ({ ...prev, branch: e.target.value }))}
                placeholder="e.g. main"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Personal Access Token (Optional)
              </label>
              <input
                type="password"
                value={formData.token || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, token: e.target.value }))}
                placeholder="ghp_..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                Leave blank if you have `GITHUB_TOKEN` set in your environment variables (.env).
                Required for reading private repos.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Save size={16} />
              Save Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RepoConfigModal;