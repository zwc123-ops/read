
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Book } from '../types';
import { 
  Settings, ZoomIn, ZoomOut, Type as TypeIcon, Eye, EyeOff, 
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

const Reader: React.FC<ReaderProps> = ({ book, initialProgress, onSelectWord, onSelectSentence, onProgressUpdate, onOpenSettings }) => {
  const [fontSize, setFontSize] = useState(18);
  const [lineHeight, setLineHeight] = useState(1.8);
  const [viewMode, setViewMode] = useState<'scroll' | 'page'>('page');
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [progress, setProgress] = useState(initialProgress);

  const mainRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<number | null>(null);
  const lastScrollTop = useRef(0);

  const calculatePages = useCallback(() => {
    if (viewMode === 'page' && contentRef.current) {
      const containerWidth = contentRef.current.offsetWidth || 1;
      const scrollWidth = contentRef.current.scrollWidth || 1;
      const pages = Math.max(1, Math.ceil(scrollWidth / containerWidth));
      
      setTotalPages(pages);
      // 根据之前的进度计算新页面索引
      const safeProgress = Math.min(100, Math.max(0, progress));
      const pageIdx = Math.min(pages - 1, Math.round((safeProgress / 100) * (pages - 1)));
      setCurrentPage(isNaN(pageIdx) ? 0 : pageIdx);
    }
  }, [viewMode, fontSize, lineHeight, progress]);

  useEffect(() => {
    const timer = setTimeout(calculatePages, 300);
    return () => clearTimeout(timer);
  }, [calculatePages, fontSize, lineHeight, viewMode]);

  useEffect(() => {
    window.addEventListener('resize', calculatePages);
    return () => window.removeEventListener('resize', calculatePages);
  }, [calculatePages]);

  const handlePrevPage = () => {
    if (currentPage > 0) {
      const next = currentPage - 1;
      setCurrentPage(next);
      const p = Math.round((next / (totalPages - 1 || 1)) * 100);
      setProgress(p);
      onProgressUpdate(p);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      const next = currentPage + 1;
      setCurrentPage(next);
      const p = Math.round((next / (totalPages - 1 || 1)) * 100);
      setProgress(p);
      onProgressUpdate(p);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => { touchStartRef.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (viewMode !== 'page' || touchStartRef.current === null) return;
    const diff = touchStartRef.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) handleNextPage();
      else handlePrevPage();
    }
    touchStartRef.current = null;
  };

  const handleScroll = () => {
    if (viewMode !== 'scroll' || !mainRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = mainRef.current;
    setShowHeader(scrollTop <= 100 || scrollTop < lastScrollTop.current);
    lastScrollTop.current = scrollTop;
    const p = Math.round((scrollTop / (scrollHeight - clientHeight || 1)) * 100);
    if (p !== progress) { setProgress(p); onProgressUpdate(p); }
  };

  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;
    const text = selection.toString().trim();
    if (text.length > 1) {
      const wordCount = text.split(/\s+/).length;
      if (wordCount <= 2) onSelectWord(text.replace(/[.,!?;:()"]/g, ''));
      else onSelectSentence(text);
    }
  };

  const paragraphs = book.content.split(/\n\s*\n/).filter(p => p.trim());

  return (
    <div 
      className={`flex-1 flex flex-col overflow-hidden relative transition-colors duration-700 ${isZenMode ? 'bg-[#fdfbf7]' : 'bg-white'}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <header className={`fixed top-0 left-0 right-0 md:left-20 h-16 bg-white/90 backdrop-blur-md z-40 border-b border-gray-50 flex items-center justify-between px-4 md:px-8 transition-transform duration-500 ${showHeader ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="flex items-center gap-3 max-w-[60%]">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
          <h1 className="font-bold text-gray-800 text-sm truncate">{book.title}</h1>
        </div>
        <div className="flex items-center gap-1 md:gap-4">
          <button onClick={() => setShowStyleMenu(!showStyleMenu)} className={`p-2 rounded-xl ${showStyleMenu ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400'}`}><TypeIcon className="w-5 h-5" /></button>
          <button onClick={() => setIsZenMode(!isZenMode)} className={`p-2 rounded-xl ${isZenMode ? 'text-indigo-600' : 'text-gray-400'}`}>{isZenMode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>
          <button onClick={onOpenSettings} className="p-2 text-gray-400 hidden md:block"><Settings className="w-5 h-5" /></button>
        </div>
        {showStyleMenu && (
          <div className="absolute top-full right-4 mt-2 w-72 bg-white rounded-3xl shadow-2xl border border-gray-50 p-6 z-50">
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase mb-3 block">阅读模式</label>
                <div className="grid grid-cols-2 gap-2 bg-gray-50 p-1 rounded-xl">
                  {['scroll', 'page'].map(m => (
                    <button key={m} onClick={() => setViewMode(m as any)} className={`py-2 rounded-lg text-xs font-bold ${viewMode === m ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400'}`}>
                      {m === 'scroll' ? '竖屏' : '翻页'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-gray-400 uppercase">字体大小</span>
                <div className="flex items-center gap-4 bg-gray-50 rounded-xl px-2 py-1">
                  <button onClick={() => setFontSize(f => Math.max(12, f-2))} className="p-1 text-gray-500"><ZoomOut className="w-4 h-4" /></button>
                  <span className="text-sm font-bold w-6 text-center">{fontSize}</span>
                  <button onClick={() => setFontSize(f => Math.min(32, f+2))} className="p-1 text-gray-500"><ZoomIn className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      <main 
        ref={mainRef}
        onScroll={handleScroll}
        onMouseUp={handleMouseUp}
        className={`flex-1 relative select-text ${viewMode === 'scroll' ? 'overflow-y-auto pt-24 pb-32' : 'overflow-hidden'}`}
      >
        <div className={`mx-auto max-w-[850px] px-6 md:px-12 h-full ${viewMode === 'page' ? 'pt-24 pb-20' : ''}`}>
          <div 
            ref={contentRef}
            className={`serif text-gray-800 h-full ${viewMode === 'page' ? 'columns-1 md:columns-2 gap-12' : 'space-y-8'}`}
            style={{ 
              fontSize: `${fontSize}px`, lineHeight: lineHeight,
              ...(viewMode === 'page' ? {
                transform: `translateX(calc(-${currentPage * 100}% - ${currentPage * 48}px))`,
                transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                width: '100%', columnFill: 'auto'
              } : {})
            }}
          >
            <div className="mb-10 break-inside-avoid">
              <h1 className="text-3xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">{book.title}</h1>
              <div className="w-12 h-1 bg-indigo-500 rounded-full" />
            </div>
            {paragraphs.map((p, i) => <p key={i} className="mb-[1.5em] break-inside-avoid-column">{p}</p>)}
          </div>
        </div>
      </main>

      <footer className="h-10 md:h-12 bg-white/80 backdrop-blur border-t border-gray-50 flex items-center justify-between px-6 z-30 md:ml-20">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black text-gray-400 tracking-widest uppercase">
            {viewMode === 'page' ? `PAGE ${currentPage + 1} / ${totalPages}` : `${progress}% READ`}
          </span>
          <div className="w-20 h-1 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <div className="flex gap-4 md:hidden">
          <button onClick={handlePrevPage} disabled={currentPage === 0} className="text-gray-400 disabled:opacity-20"><ChevronLeft className="w-5 h-5" /></button>
          <button onClick={handleNextPage} disabled={currentPage === totalPages - 1} className="text-gray-400 disabled:opacity-20"><ChevronRight className="w-5 h-5" /></button>
        </div>
      </footer>
    </div>
  );
};

export default Reader;
