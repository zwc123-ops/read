
import React from 'react';
import { AnalysisResult, SavedItem } from '../types';
import { X, BookOpen, Layers, Languages, Sparkles, Star, CheckCircle, ExternalLink, Globe, ChevronDown } from 'lucide-react';

interface AnalysisSidebarProps {
  result: AnalysisResult | null;
  onClose: () => void;
  loading: boolean;
  onSave: (item: AnalysisResult) => void;
  isSaved: boolean;
}

const AnalysisSidebar: React.FC<AnalysisSidebarProps> = ({ result, onClose, loading, onSave, isSaved }) => {
  const isOpen = result || loading;

  return (
    <>
      {/* 背景遮罩 - 仅在移动端显眼 */}
      <div 
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-[55] transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      <div className={`
        fixed z-[60] bg-white shadow-2xl transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1)
        /* 移动端：底部抽屉 */
        bottom-0 left-0 right-0 rounded-t-[2.5rem] h-[85vh] translate-y-full
        /* 桌面端：右侧侧边栏 */
        md:top-0 md:right-0 md:left-auto md:w-[450px] md:h-full md:rounded-none md:translate-y-0 md:translate-x-full
        ${isOpen ? (window.innerWidth < 768 ? 'translate-y-0' : 'md:translate-x-0') : ''}
      `}>
        {/* 移动端顶部拉条 */}
        <div className="md:hidden flex justify-center pt-4 pb-2" onClick={onClose}>
          <div className="w-12 h-1.5 bg-gray-100 rounded-full" />
        </div>

        <div className="h-full flex flex-col overflow-hidden">
          <div className="px-6 md:px-10 py-6 border-b border-gray-50 flex justify-between items-center bg-white/80 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-100">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 tracking-tight">AI 分析</h2>
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
                <X className="w-5 h-5 hidden md:block" />
                <ChevronDown className="w-6 h-6 md:hidden" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 md:px-10 py-8 space-y-10 pb-20">
            {loading ? (
              <div className="space-y-10 animate-pulse">
                <div className="space-y-4">
                  <div className="h-10 bg-gray-50 rounded-2xl w-2/3"></div>
                  <div className="h-4 bg-gray-50 rounded-full w-1/3"></div>
                </div>
                <div className="h-40 bg-indigo-50/20 rounded-3xl"></div>
                <div className="h-32 bg-gray-50 rounded-3xl w-full"></div>
              </div>
            ) : result?.type === 'word' ? (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <header>
                  <div className="flex items-baseline flex-wrap gap-3 mb-2">
                    <h3 className="text-4xl font-bold text-gray-900 tracking-tight">{result.data.word}</h3>
                    <span className="text-indigo-500 font-mono text-lg">{result.data.phonetic}</span>
                  </div>
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">{result.data.partOfSpeech}</p>
                </header>

                <section className="bg-indigo-50/30 p-6 rounded-[2rem] border border-indigo-100/50">
                  <h4 className="flex items-center gap-2 text-[10px] font-black text-indigo-600 mb-4 uppercase tracking-[0.2em]">
                    <Languages className="w-3.5 h-3.5" /> 核心释义
                  </h4>
                  <p className="text-2xl text-gray-900 font-bold mb-3">{result.data.chineseMeaning}</p>
                  <p className="text-gray-500 leading-relaxed italic text-sm">{result.data.meaning}</p>
                </section>

                <section>
                  <h4 className="flex items-center gap-2 text-[10px] font-black text-gray-400 mb-5 uppercase tracking-[0.2em]">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-400" /> 使用场景
                  </h4>
                  <div className="space-y-4">
                    {result.data.examples.map((ex, i) => (
                      <div key={i} className="relative pl-6 py-1 group">
                        <div className="absolute left-0 top-0 h-full w-1 bg-indigo-100 rounded-full group-hover:bg-indigo-400 transition-colors" />
                        <p className="text-gray-700 leading-relaxed italic text-sm md:text-base">"{ex}"</p>
                      </div>
                    ))}
                  </div>
                </section>

                {result.data.synonyms.length > 0 && (
                  <section>
                    <h4 className="text-[10px] font-black text-gray-400 mb-4 uppercase tracking-[0.2em]">近义词对照</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.data.synonyms.map((s, i) => (
                        <span key={i} className="px-4 py-2 bg-gray-50 text-gray-600 text-xs md:text-sm rounded-xl font-medium">
                          {s}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                {/* Grounding Sources */}
                {result.data.sources && result.data.sources.length > 0 && (
                  <section>
                    <h4 className="flex items-center gap-2 text-[10px] font-black text-gray-400 mb-4 uppercase tracking-[0.2em]">
                      <Globe className="w-3.5 h-3.5 text-indigo-400" /> 参考来源
                    </h4>
                    <div className="space-y-2">
                      {result.data.sources.map((source, i) => (
                        <a 
                          key={i} 
                          href={source.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
                        >
                          <span className="text-xs text-gray-600 font-medium truncate flex-1">{source.title}</span>
                          <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                        </a>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            ) : result?.type === 'sentence' ? (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <section>
                  <h4 className="text-[10px] font-black text-gray-400 mb-4 uppercase tracking-[0.2em]">待析句子</h4>
                  <p className="text-lg md:text-xl font-bold text-gray-900 leading-relaxed serif italic">
                    "{result.data.original}"
                  </p>
                </section>

                <section className="bg-gray-900 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-gray-200">
                  <h4 className="flex items-center gap-2 text-[10px] font-black text-indigo-400 mb-4 uppercase tracking-[0.2em]">
                    <Languages className="w-3.5 h-3.5" /> 全文翻译
                  </h4>
                  <p className="text-lg md:text-xl font-medium leading-relaxed">{result.data.translation}</p>
                </section>

                <section>
                  <h4 className="flex items-center gap-2 text-[10px] font-black text-gray-400 mb-6 uppercase tracking-[0.2em]">
                    <Layers className="w-3.5 h-3.5 text-indigo-500" /> 语法脉络
                  </h4>
                  <div className="grid gap-4">
                    {result.data.structure.map((item, i) => (
                      <div key={i} className="p-5 bg-white border border-gray-100 rounded-2xl">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{item.part}</span>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">{item.explanation}</p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Grounding Sources */}
                {result.data.sources && result.data.sources.length > 0 && (
                  <section>
                    <h4 className="flex items-center gap-2 text-[10px] font-black text-gray-400 mb-4 uppercase tracking-[0.2em]">
                      <Globe className="w-3.5 h-3.5 text-indigo-400" /> 参考来源
                    </h4>
                    <div className="space-y-2">
                      {result.data.sources.map((source, i) => (
                        <a 
                          key={i} 
                          href={source.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
                        >
                          <span className="text-xs text-gray-600 font-medium truncate flex-1">{source.title}</span>
                          <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                        </a>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
};

export default AnalysisSidebar;
