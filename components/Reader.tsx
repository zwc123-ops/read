
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Book } from '../types';
import { 
  ZoomIn, ZoomOut, Type as TypeIcon, 
  Share2, Sparkles, Languages, Search,
  ChevronLeft, ChevronRight
} from 'lucide-react';

interface ReaderProps {
  book: Book;
  initialProgress: number;
  onSelectWord: (word: string) => void;
  onSelectSentence: (sentence: string) => void;
  onProgressUpdate: (progress: number) => void;
  onOpenSettings: () => void;
}

type ReaderTheme = 'classic' | 'sepia' | 'dark';

const Reader: React.FC<ReaderProps> = ({ book, initialProgress, onSelectWord, onSelectSentence, onProgressUpdate, onOpenSettings }) => {
  const [fontSize, setFontSize] = useState(19);
  const [theme, setTheme] = useState<ReaderTheme>('classic');
  const [viewMode, setViewMode] = useState<'scroll' | 'page'>('page');
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [progress, setProgress] = useState(initialProgress);
  const [selectionMenu, setSelectionMenu] = useState<{ x: number, y: number, text: string } | null>(null);

  const mainRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<number | null>(null);

  const themes: Record<ReaderTheme, { bg: string, text: string, secondary: string }> = {
    classic: { bg: '#ffffff', text: '#1a1a1a', secondary: '#f3f4f6' },
    sepia: { bg: '#f4ecd8', text: '#5b4636', secondary: '#e8dec2' },
    dark: { bg: '#1a1a1a', text: '#a0a0a0', secondary: '#262626' }
  };

  // 计算总页数
  const calculatePages = useCallback(() => {
    if (viewMode === 'page' && contentRef.current) {
      const containerWidth = contentRef.current.offsetWidth || 1;
      const scrollWidth = contentRef.current.scrollWidth || 1;
      const pages = Math.max(1, Math.ceil(scrollWidth / containerWidth));
      setTotalPages(pages);
      
      // 根据进度定位到具体页面
      const pageIdx = Math.min(pages - 1, Math.round((progress / 100) * (pages - 1)));
      setCurrentPage(isNaN(pageIdx) ? 0 : pageIdx);
    }
  }, [viewMode, fontSize, progress]);

  useEffect(() => {
    const timer = setTimeout(calculatePages, 300);
    return () => clearTimeout(timer);
  }, [calculatePages, fontSize, viewMode, theme]);

  // 翻页处理逻辑
  const handlePrevPage = useCallback(() => {
    if (currentPage > 0) {
      const next = currentPage - 1;
      setCurrentPage(next);
      const p = Math.round((next / (totalPages - 1 || 1)) * 100);
      setProgress(p);
      onProgressUpdate(p);
    }
  }, [currentPage, totalPages, onProgressUpdate]);

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages - 1) {
      const next = currentPage + 1;
      setCurrentPage(next);
      const p = Math.round((next / (totalPages - 1 || 1)) * 100);
      setProgress(p);
      onProgressUpdate(p);
    }
  }, [currentPage, totalPages, onProgressUpdate]);

  // 键盘翻页监听
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewMode !== 'page') return;
      if (e.key === 'ArrowLeft') handlePrevPage();
      if (e.key === 'ArrowRight') handleNextPage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, handlePrevPage, handleNextPage]);

  // 滚轮翻页监听
  const handleWheel = (e: React.WheelEvent) => {
    if (viewMode !== 'page') return;
    if (Math.abs(e.deltaY) < 10) return; // 忽略微小滚动
    if (e.deltaY > 0) handleNextPage();
    else handlePrevPage();
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setSelectionMenu(null);
      return;
    }
    const text = selection.toString().trim();
    if (text.length > 1) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelectionMenu({
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
        text: text
      });
    }
  };

  const triggerAnalysis = (type: 'word' | 'sentence') => {
    if (!selectionMenu) return;
    if (type === 'word') onSelectWord(selectionMenu.text.replace(/[.,!?;:()"]/g, ''));
    else onSelectSentence(selectionMenu.text);
    setSelectionMenu(null);
    window.getSelection()?.removeAllRanges();
  };

  const paragraphs = book.content.split(/\n\s*\n/).filter(p => p.trim());

  return (
    <div 
      className="flex-1 flex flex-col overflow-hidden relative select-none" 
      style={{ backgroundColor: themes[theme].bg, color: themes[theme].text }}
      onWheel={handleWheel}
    >
      {/* 顶部导航 */}
      <header className={`fixed top-0 left-0 right-0 md:left-20 h-16 bg-inherit backdrop-blur-md z-40 border-b transition-transform duration-500 flex items-center justify-between px-6 ${showHeader ? 'translate-y-0' : '-translate-y-full'}`} style={{ borderColor: themes[theme].secondary }}>
        <h1 className="font-bold text-sm truncate max-w-[200px]">{book.title}</h1>
        <div className="flex items-center gap-4">
          <button onClick={() => setShowStyleMenu(!showStyleMenu)} className="p-2 opacity-60 hover:opacity-100 transition-opacity"><TypeIcon className="w-5 h-5" /></button>
          <button className="p-2 opacity-60 hover:opacity-100 transition-opacity hidden md:block"><Share2 className="w-5 h-5" /></button>
        </div>
      </header>

      {/* 选中文本菜单 */}
      {selectionMenu && (
        <div 
          className="fixed z-[100] -translate-x-1/2 -translate-y-full flex items-center bg-gray-900 text-white rounded-full shadow-2xl px-2 py-1.5 animate-in zoom-in-95 duration-200"
          style={{ left: selectionMenu.x, top: selectionMenu.y }}
        >
          <button onClick={() => triggerAnalysis('word')} className="px-4 py-1.5 flex flex-col items-center gap-0.5 hover:bg-white/10 rounded-full transition-colors">
            <Search className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold">查询</span>
          </button>
          <div className="w-[1px] h-6 bg-white/10 mx-1" />
          <button onClick={() => triggerAnalysis('sentence')} className="px-4 py-1.5 flex flex-col items-center gap-0.5 hover:bg-white/10 rounded-full transition-colors text-indigo-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold">AI分析</span>
          </button>
          <div className="w-[1px] h-6 bg-white/10 mx-1" />
          <button className="px-4 py-1.5 flex flex-col items-center gap-0.5 hover:bg-white/10 rounded-full transition-colors">
            <Languages className="w-3.5 h-3.5 text-green-400" />
            <span className="text-[10px] font-bold">笔记</span>
          </button>
        </div>
      )}

      {/* 阅读器主区域 */}
      <main 
        ref={mainRef}
        onMouseUp={handleMouseUp}
        className={`flex-1 relative transition-all duration-300 ${viewMode === 'scroll' ? 'overflow-y-auto pt-24 pb-32' : 'overflow-hidden'}`}
      >
        <div className={`mx-auto max-w-[800px] px-8 md:px-12 h-full ${viewMode === 'page' ? 'pt-24 pb-20' : ''}`}>
          <div 
            ref={contentRef}
            className={`serif select-text h-full ${viewMode === 'page' ? 'columns-1 md:columns-2 gap-16' : 'space-y-10'}`}
            style={{ 
              fontSize: `${fontSize}px`, lineHeight: 1.85,
              ...(viewMode === 'page' ? {
                transform: `translateX(calc(-${currentPage * 100}% - ${currentPage * 64}px))`,
                transition: 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)',
                width: '100%', columnFill: 'auto'
              } : {})
            }}
          >
            <div className="mb-12 break-inside-avoid">
              <h1 className="text-4xl md:text-6xl font-black leading-tight mb-8" style={{ opacity: theme === 'dark' ? 0.8 : 1 }}>{book.title}</h1>
              <div className="w-16 h-1 bg-indigo-500 rounded-full opacity-50" />
            </div>
            {paragraphs.map((p, i) => <p key={i} className="mb-[1.6em] text-justify tracking-wide leading-relaxed break-inside-avoid-column">{p}</p>)}
          </div>
        </div>
        
        {/* 交互点击层 (翻页模式有效) */}
        {viewMode === 'page' && (
          <div className="absolute inset-0 z-20 flex pointer-events-none">
            {/* 左侧翻页区 */}
            <div 
              className="w-1/4 h-full pointer-events-auto cursor-w-resize group relative"
              onClick={(e) => { e.stopPropagation(); handlePrevPage(); }}
            >
              <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronLeft className="w-6 h-6 opacity-40" />
              </div>
            </div>
            {/* 中间菜单区 */}
            <div 
              className="flex-1 h-full pointer-events-auto cursor-default"
              onClick={() => { if(!selectionMenu) setShowHeader(!showHeader); setShowStyleMenu(false); }}
            />
            {/* 右侧翻页区 */}
            <div 
              className="w-1/4 h-full pointer-events-auto cursor-e-resize group relative"
              onClick={(e) => { e.stopPropagation(); handleNextPage(); }}
            >
              <div className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight className="w-6 h-6 opacity-40" />
              </div>
            </div>
          </div>
        )}

        {/* 滚动模式下的菜单切换 */}
        {viewMode === 'scroll' && (
          <div className="absolute inset-0 z-10" onClick={() => { setShowHeader(!showHeader); setShowStyleMenu(false); }} />
        )}
      </main>

      {/* 底部进度 */}
      <footer className="h-10 flex items-center justify-between px-8 text-[10px] font-bold opacity-40 uppercase tracking-widest md:ml-20">
        <div className="flex items-center gap-4">
          <span>{viewMode === 'page' ? `PAGE ${currentPage + 1} / ${totalPages}` : `${progress}%`}</span>
          <div className="w-32 h-[1px] bg-current opacity-10 hidden md:block" />
        </div>
        <span>{book.type}</span>
      </footer>

      {/* 样式菜单 */}
      {showStyleMenu && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-white rounded-[2.5rem] shadow-2xl p-8 z-50 text-gray-900 animate-in slide-in-from-bottom-10">
          <div className="space-y-8">
            <div className="flex justify-around">
              {(['classic', 'sepia', 'dark'] as ReaderTheme[]).map(t => (
                <button 
                  key={t} 
                  onClick={() => setTheme(t)}
                  className={`w-12 h-12 rounded-full border-2 transition-all ${theme === t ? 'border-indigo-600 scale-110 shadow-lg' : 'border-transparent'}`}
                  style={{ backgroundColor: themes[t].bg }}
                />
              ))}
            </div>
            <div className="flex items-center justify-between bg-gray-50 p-2 rounded-2xl">
              <button onClick={() => setFontSize(f => Math.max(14, f-1))} className="p-3 hover:bg-white rounded-xl transition-colors"><ZoomOut className="w-5 h-5" /></button>
              <span className="font-black text-sm">{fontSize}</span>
              <button onClick={() => setFontSize(f => Math.min(30, f+1))} className="p-3 hover:bg-white rounded-xl transition-colors"><ZoomIn className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {['scroll', 'page'].map(m => (
                <button 
                  key={m} 
                  onClick={() => setViewMode(m as any)}
                  className={`py-3 rounded-2xl font-bold text-xs ${viewMode === m ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-50 text-gray-400'}`}
                >
                  {m === 'scroll' ? '上下翻页' : '左右翻页'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reader;
