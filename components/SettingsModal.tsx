
import React from 'react';
import { X, Cpu, Key, ShieldCheck } from 'lucide-react';
import { AppSettings, AIProvider } from '../types';

interface SettingsModalProps {
  settings: AppSettings;
  onUpdate: (settings: AppSettings) => void;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ settings, onUpdate, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-600" />
            系统设置
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-8 space-y-8">
          <section>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">AI 引擎选择</h3>
            <div className="grid grid-cols-2 gap-3">
              {(['gemini', 'deepseek'] as AIProvider[]).map((provider) => (
                <button
                  key={provider}
                  onClick={() => onUpdate({ ...settings, aiProvider: provider })}
                  className={`py-3 px-4 rounded-xl border-2 transition-all font-bold capitalize flex items-center justify-center gap-2 ${
                    settings.aiProvider === provider 
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm' 
                    : 'border-gray-100 text-gray-400 hover:border-gray-200'
                  }`}
                >
                  {settings.aiProvider === provider && <ShieldCheck className="w-4 h-4" />}
                  {provider}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[10px] text-gray-400">Gemini 使用系统内置密钥，DeepSeek 需要您提供自己的 API Key。</p>
          </section>

          {settings.aiProvider === 'deepseek' && (
            <section className="animate-in slide-in-from-top-4 duration-300">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Key className="w-4 h-4" /> DeepSeek API Key
              </h3>
              <input
                type="password"
                placeholder="在此输入您的 API Key..."
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm"
                value={settings.deepseekApiKey || ''}
                onChange={(e) => onUpdate({ ...settings, deepseekApiKey: e.target.value })}
              />
              <p className="mt-3 text-xs text-gray-500 bg-amber-50 p-3 rounded-lg border border-amber-100 leading-relaxed">
                您的密钥将仅保存在浏览器本地，不会上传到我们的服务器。
              </p>
            </section>
          )}
        </div>

        <div className="px-8 py-6 bg-gray-50 flex justify-end">
          <button 
            onClick={onClose}
            className="bg-indigo-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
