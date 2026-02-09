
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Book } from '../types';
import { 
  Settings, ZoomIn, ZoomOut, Type as TypeIcon, Eye, EyeOff, 
  AlignLeft, AlignJustify, MoveVertical, Image as ImageIcon,
  ChevronLeft, ChevronRight, Menu
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
  const [fontWeight, setFontWeight] = useState('400');
  const [lineHeight, setLineHeight] = useState(1.8);
  const [viewMode, setViewMode] = useState<'scroll' | 'page'>('page');
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const [showOriginalImage, setShowOriginalImage] = useState(true);
  const [isZenMode, setIsZenMode] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [progress, setProgress] = useState(initialProgress);

  const mainRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<number | null>(null);
  const lastScrollTop = useRef(0);

  // 计算分页逻辑
  const calculatePages = useCallback(() => {
    if (viewMode === 'page' && contentRef.current) {
      const containerWidth = contentRef.current.offsetWidth;
      const scrollWidth = contentRef.current.scrollWidth;
      const pages = Math.max(1, Math.ceil(scrollWidth / containerWidth));
      setTotalPages(pages);
      
      // 保持当前进度
      const pageIdx = Math.min(pages - 1, Math.floor((progress / 100) * (pages - 1)));
      setCurrentPage(pageIdx);
    }
  }, [viewMode, fontSize, lineHeight, fontWeight, progress]);

  useEffect(() => {
    const timer = setTimeout(calculatePages, 200);
    return () => clearTimeout(timer);
  }, [calculatePages, fontSize, lineHeight, viewMode]);

  useEffect(() => {
    window.addEventListener('resize', calculatePages);
    return () => window.removeEventListener('resize', calculatePages);
  }, [calculatePages]);

  // 翻页操作
  const handlePrevPage = () => {
    setCurrentPage(prev => {
      const next = Math.max(0, prev - 1);
      const p = Math.round((next / (totalPages - 1 || 1)) * 100);
      setProgress(p);
      onProgressUpdate(p);
      return next;
    });
  };

  const handleNextPage = () => {
    setCurrentPage(prev => {
      const next = Math.min(totalPages - 1, prev + 1);
      const p = Math.round((next / (totalPages - 1 || 1)) * 100);
      setProgress(p);
      onProgressUpdate(p);
      return next;
    });
  };

  // 划动手势
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (viewMode !== 'page' || touchStartRef.current === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStartRef.current - touchEnd;
    if (Math.abs(diff) > 50) {
      if (diff > 0) handleNextPage();
      else handlePrevPage();
    }
    touchStartRef.current = null;
  };

  const handleScroll = () => {
    if (viewMode !== 'scroll' || !mainRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = mainRef.current;
    
    if (scrollTop > lastScrollTop.current && scrollTop > 100) setShowHeader(false);
    else setShowHeader(true);
    lastScrollTop.current = scrollTop;

    const totalScrollable = scrollHeight - clientHeight;
    const p = totalScrollable > 0 ? Math.round((scrollTop / totalScrollable) * 100) : 0;
    if (p !== progress) {
      setProgress(p);
      onProgressUpdate(p);
    }
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

  const paragraphs = book.content.split(/\n\s*\n|\r\n\s*\r\n/).filter(p => p.trim());

  return (
    <div 
      className={`flex-1 flex flex-col overflow-hidden relative transition-colors duration-700 ${isZenMode ? 'bg-[#fdfbf7]' : 'bg-white'}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 顶部工具栏 */}
      <header className={`fixed top-0 left-0 right-0 md:left-20 h-16 bg-white/90 backdrop-blur-md z-40 border-b border-gray-50 flex items-center justify-between px-4 md:px-8 transition-transform duration-500 ${showHeader ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="flex items-center gap-3 max-w-[60%]">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
          <h1 className="font-bold text-gray-800 text-sm truncate">{book.title}</h1>
        </div>
        
        <div className="flex items-center gap-1 md:gap-4">
          <button onClick={() => setShowStyleMenu(!showStyleMenu)} className={`p-2 rounded-xl ${showStyleMenu ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400'}`}>
            <TypeIcon className="w-5 h-5" />
          </button>
          <button onClick={() => setIsZenMode(!isZenMode)} className={`p-2 rounded-xl ${isZenMode ? 'text-indigo-600' : 'text-gray-400'}`}>
            {isZenMode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
          <button onClick={onOpenSettings} className="p-2 text-gray-400 md:block hidden"><Settings className="w-5 h-5" /></button>
        </div>

        {/* 悬浮菜单 */}
        {showStyleMenu && (
          <div className="absolute top-full right-4 mt-2 w-72 bg-white rounded-3xl shadow-2xl border border-gray-50 p-6 z-50 animate-in fade-in slide-in-from-top-2">
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">阅读模式</label>
                <div className="grid grid-cols-2 gap-2 bg-gray-50 p-1 rounded-xl">
                  {['scroll', 'page'].map(m => (
                    <button key={m} onClick={() => setViewMode(m as any)} className={`py-2 rounded-lg text-xs font-bold transition-all ${viewMode === m ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400'}`}>
                      {m === 'scroll' ? '竖屏' : '翻页'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">字体大小</span>
                <div className="flex items-center gap-4 bg-gray-50 rounded-xl px-2 py-1">
                  <button onClick={() => setFontSize(f => Math.max(12, f-1))} className="p-1 text-gray-500"><ZoomOut className="w-4 h-4" /></button>
                  <span className="text-sm font-bold w-6 text-center">{fontSize}</span>
                  <button onClick={() => setFontSize(f => Math.min(40, f+1))} className="p-1 text-gray-500"><ZoomIn className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* 阅读主体 */}
      <main 
        ref={mainRef}
        onScroll={handleScroll}
        onMouseUp={handleMouseUp}
        className={`flex-1 relative flex flex-col items-center select-text ${viewMode === 'scroll' ? 'overflow-y-auto pt-24 pb-32' : 'overflow-hidden'}`}
      >
        <div className={`w-full max-w-[850px] px-6 md:px-12 transition-transform duration-500 ease-out h-full ${viewMode === 'page' ? 'pt-24 pb-20' : ''}`}>
          <div 
            ref={contentRef}
            className={`serif text-gray-800 h-full ${viewMode === 'page' ? 'columns-1 md:columns-2 gap-12' : 'space-y-10'}`}
            style={{ 
              fontSize: `${fontSize}px`,
              fontWeight: fontWeight,
              lineHeight: lineHeight,
              ...(viewMode === 'page' ? {
                transform: `translateX(calc(-${currentPage * 100}% - ${currentPage * 48}px))`,
                transition: 'transform 0.5s cubic-bezier(0.2, 0, 0, 1)',
                width: '100%',
                columnFill: 'auto'
              } : {})
            }}
          >
            <div className="mb-12 break-inside-avoid">
              <h1 className="text-3xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">{book.title}</h1>
              <div className="w-12 h-1 bg-indigo-500 rounded-full" />
            </div>

            {paragraphs.map((p, i) => (
              <p key={i} className="mb-[1.5em] break-inside-avoid-column leading-relaxed">
                {p}
              </p>
            ))}
          </div>
        </div>

        {/* 翻页指示器 - 桌面端 */}
        {viewMode === 'page' && (
          <div className="hidden md:block">
            <button onClick={handlePrevPage} disabled={currentPage === 0} className="fixed left-24 top-1/2 -translate-y-1/2 p-4 text-gray-200 hover:text-indigo-400 disabled:opacity-0 transition-all"><ChevronLeft className="w-10 h-10" /></button>
            <button onClick={handleNextPage} disabled={currentPage === totalPages - 1} className="fixed right-8 top-1/2 -translate-y-1/2 p-4 text-gray-200 hover:text-indigo-400 disabled:opacity-0 transition-all"><ChevronRight className="w-10 h-10" /></button>
          </div>
        )}
      </main>

      {/* 底部进度条 */}
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
          <button onClick={handlePrevPage} disabled={currentPage === 0} className="text-gray-400 active:text-indigo-600 disabled:opacity-20"><ChevronLeft className="w-5 h-5" /></button>
          <button onClick={handleNextPage} disabled={currentPage === totalPages - 1} className="text-gray-400 active:text-indigo-600 disabled:opacity-20"><ChevronRight className="w-5 h-5" /></button>
        </div>
      </footer>
    </div>
  );
};

export default Reader;
