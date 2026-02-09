
import React from 'react';
import { AnalysisResult, SavedItem } from '../types';
import { X, BookOpen, Layers, Lightbulb, Languages, Sparkles, Star, CheckCircle, ExternalLink, Globe } from 'lucide-react';

interface AnalysisSidebarProps {
  result: AnalysisResult | null;
  onClose: () => void;
  loading: boolean;
  onSave: (item: AnalysisResult) => void;
  isSaved: boolean;
}

const AnalysisSidebar: React.FC<AnalysisSidebarProps> = ({ result, onClose, loading, onSave, isSaved }) => {
  // 使用稍微宽一点的侧边栏，但排版更呼吸感
  return (
    <div className={`fixed right-0 top-0 h-full w-full md:w-[450px] bg-white shadow-[-30px_0_60px_-15px_rgba(0,0,0,0.08)] z-[60] transform transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1) border-l border-gray-50 overflow-y-auto ${result || loading ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="p-6 md:p-10">
        <div className="flex justify-between items-center mb-10 sticky top-0 bg-white/80 backdrop-blur-sm py-4 z-10 border-b border-gray-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-100">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">AI 解析</h2>
          </div>
          <div className="flex items-center gap-2">
            {result && (
              <button 
                onClick={() => onSave(result)}
                className={`p-2.5 rounded-xl transition-all ${isSaved ? 'text-yellow-500 bg-yellow-50' : 'text-gray-400 hover:bg-gray-100'}`}
              >
                {isSaved ? <CheckCircle className="w-5 h-5" /> : <Star className="w-5 h-5" />}
              </button>
            )}
            <button onClick={onClose} className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors text-gray-400">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-10 animate-pulse">
            <div className="space-y-4">
              <div className="h-10 bg-gray-50 rounded-2xl w-2/3"></div>
              <div className="h-4 bg-gray-50 rounded-full w-1/3"></div>
            </div>
            <div className="h-40 bg-indigo-50/20 rounded-3xl"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-50 rounded-full w-full"></div>
              <div className="h-4 bg-gray-50 rounded-full w-5/6"></div>
            </div>
          </div>
        ) : result?.type === 'word' ? (
          <div className="space-y-10">
            <header>
              <div className="flex items-baseline flex-wrap gap-3 mb-2">
                <h3 className="text-4xl font-bold text-gray-900 tracking-tight">{result.data.word}</h3>
                <span className="text-indigo-500 font-mono text-lg">{result.data.phonetic}</span>
              </div>
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">{result.data.partOfSpeech}</p>
            </header>

            <section className="bg-indigo-50/30 p-6 rounded-3xl border border-indigo-100/50">
              <h4 className="flex items-center gap-2 text-[10px] font-black text-indigo-600 mb-4 uppercase tracking-[0.2em]">
                <Languages className="w-3.5 h-3.5" /> 核心释义
              </h4>
              <p className="text-2xl text-gray-900 font-bold mb-3">{result.data.chineseMeaning}</p>
              <p className="text-gray-500 leading-relaxed italic">{result.data.meaning}</p>
            </section>

            <section>
              <h4 className="flex items-center gap-2 text-[10px] font-black text-gray-400 mb-5 uppercase tracking-[0.2em]">
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" /> 使用场景
              </h4>
              <div className="space-y-4">
                {result.data.examples.map((ex, i) => (
                  <div key={i} className="relative pl-6 py-1">
                    <div className="absolute left-0 top-0 h-full w-1 bg-indigo-100 rounded-full" />
                    <p className="text-gray-700 leading-relaxed italic">"{ex}"</p>
                  </div>
                ))}
              </div>
            </section>

            {result.data.synonyms.length > 0 && (
              <section>
                <h4 className="text-[10px] font-black text-gray-400 mb-4 uppercase tracking-[0.2em]">近义词对照</h4>
                <div className="flex flex-wrap gap-2">
                  {result.data.synonyms.map((s, i) => (
                    <span key={i} className="px-4 py-2 bg-gray-50 text-gray-600 text-sm rounded-xl font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {result.data.sources && result.data.sources.length > 0 && (
              <section className="pt-10 border-t border-gray-50">
                <h4 className="flex items-center gap-2 text-[10px] font-black text-gray-300 mb-4 uppercase tracking-widest">
                  <Globe className="w-3 h-3" /> 数据来源
                </h4>
                <div className="grid gap-2">
                  {result.data.sources.map((s, i) => (
                    <a key={i} href={s.url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 bg-gray-50/50 hover:bg-white border border-transparent hover:border-gray-100 rounded-xl transition-all">
                      <span className="text-xs text-gray-500 font-medium truncate">{s.title}</span>
                      <ExternalLink className="w-3 h-3 text-gray-300" />
                    </a>
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : result?.type === 'sentence' ? (
          <div className="space-y-10">
            <section>
              <h4 className="text-[10px] font-black text-gray-400 mb-4 uppercase tracking-[0.2em]">待析句子</h4>
              <p className="text-xl font-bold text-gray-900 leading-relaxed serif italic">
                "{result.data.original}"
              </p>
            </section>

            <section className="bg-gray-900 p-8 rounded-[2rem] text-white shadow-xl shadow-gray-200">
              <h4 className="flex items-center gap-2 text-[10px] font-black text-indigo-400 mb-4 uppercase tracking-[0.2em]">
                <Languages className="w-3.5 h-3.5" /> 全文翻译
              </h4>
              <p className="text-xl font-medium leading-relaxed">{result.data.translation}</p>
            </section>

            <section>
              <h4 className="flex items-center gap-2 text-[10px] font-black text-gray-400 mb-6 uppercase tracking-[0.2em]">
                <Layers className="w-3.5 h-3.5 text-indigo-500" /> 语法脉络
              </h4>
              <div className="grid gap-4">
                {result.data.structure.map((item, i) => (
                  <div key={i} className="group p-5 bg-white border border-gray-100 rounded-2xl hover:border-indigo-100 transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{item.part}</span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{item.explanation}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h4 className="text-[10px] font-black text-gray-400 mb-4 uppercase tracking-[0.2em]">知识要点</h4>
              <div className="flex flex-wrap gap-2">
                {result.data.grammarPoints.map((gp, i) => (
                  <span key={i} className="px-4 py-2 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-xl">
                    {gp}
                  </span>
                ))}
              </div>
            </section>
          </div>
        ) : null}
        
        <div className="h-20" />
      </div>
    </div>
  );
};

export default AnalysisSidebar;
