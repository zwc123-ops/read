
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Book } from '../types';
// Remove non-existent 'scrolling' export
import { 
  Settings, ZoomIn, ZoomOut, Type as TypeIcon, Eye, EyeOff, 
  AlignLeft, AlignJustify, MoveVertical, Image as ImageIcon,
  ChevronLeft, ChevronRight, MousePointer2
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
  // 基础样式状态
  const [fontSize, setFontSize] = useState(19);
  const [fontWeight, setFontWeight] = useState('400');
  const [lineHeight, setLineHeight] = useState(1.8);
  const [textAlign, setTextAlign] = useState<'left' | 'justify'>('left');
  const [viewMode, setViewMode] = useState<'scroll' | 'page'>('page'); // 默认分页模式
  
  // 交互状态
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const [showOriginalImage, setShowOriginalImage] = useState(true);
  const [isZenMode, setIsZenMode] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  
  // 分页相关状态
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [progress, setProgress] = useState(initialProgress);

  const mainRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const lastScrollTop = useRef(0);

  // 计算总页数 (分页模式下)
  const calculatePages = useCallback(() => {
    if (viewMode === 'page' && contentRef.current && mainRef.current) {
      const scrollWidth = contentRef.current.scrollWidth;
      const clientWidth = contentRef.current.clientWidth;
      const pages = Math.max(1, Math.ceil(scrollWidth / clientWidth));
      setTotalPages(pages);
      
      // 尝试恢复进度到大致页数
      if (initialProgress > 0 && currentPage === 0) {
        const targetPage = Math.floor((initialProgress / 100) * (pages - 1));
        setCurrentPage(targetPage);
      }
    }
  }, [viewMode, fontSize, lineHeight, textAlign, fontWeight, book.id]);

  useEffect(() => {
    // 字体或模式改变时重新计算
    const timer = setTimeout(calculatePages, 100);
    return () => clearTimeout(timer);
  }, [calculatePages, fontSize, lineHeight, viewMode]);

  // 监听窗口调整
  useEffect(() => {
    window.addEventListener('resize', calculatePages);
    return () => window.removeEventListener('resize', calculatePages);
  }, [calculatePages]);

  // 处理键盘翻页
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewMode === 'page') {
        if (e.key === 'ArrowRight') handleNextPage();
        if (e.key === 'ArrowLeft') handlePrevPage();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, currentPage, totalPages]);

  const handlePrevPage = () => {
    setCurrentPage(prev => {
      const next = Math.max(0, prev - 1);
      updateProgressFromPage(next);
      return next;
    });
  };

  const handleNextPage = () => {
    setCurrentPage(prev => {
      const next = Math.min(totalPages - 1, prev + 1);
      updateProgressFromPage(next);
      return next;
    });
  };

  const updateProgressFromPage = (pageIdx: number) => {
    const p = Math.round((pageIdx / (totalPages - 1 || 1)) * 100);
    setProgress(p);
    onProgressUpdate(p);
  };

  const handleScroll = () => {
    if (viewMode !== 'scroll' || !mainRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = mainRef.current;
    
    if (scrollTop > lastScrollTop.current && scrollTop > 100) {
      setShowHeader(false);
      setShowStyleMenu(false);
    } else {
      setShowHeader(true);
    }
    lastScrollTop.current = scrollTop;

    const totalScrollable = scrollHeight - clientHeight;
    const currentProgress = totalScrollable > 0 ? (scrollTop / totalScrollable) * 100 : 0;
    const rounded = Math.round(currentProgress);
    if (rounded !== progress) {
      setProgress(rounded);
      onProgressUpdate(rounded);
    }
  };

  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;
    const text = selection.toString().trim();
    if (!text) return;
    const wordCount = text.split(/\s+/).length;
    if (wordCount <= 2) {
      onSelectWord(text.replace(/[.,!?;:()"]/g, ''));
    } else {
      onSelectSentence(text);
    }
  };

  const paragraphs = book.content.split(/\n\s*\n|\r\n\s*\r\n/).filter(p => p.trim());

  return (
    <div className={`flex-1 flex flex-col overflow-hidden relative transition-colors duration-700 ${isZenMode ? 'bg-[#fdfbf7]' : 'bg-white'}`}>
      {/* 顶部控制栏 */}
      <header 
        className={`fixed top-0 left-0 right-0 md:left-20 h-16 border-b border-gray-100 bg-white/90 backdrop-blur-md z-40 transition-transform duration-500 ${showHeader ? 'translate-y-0' : '-translate-y-full'}`}
      >
        <div className="h-full flex items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-2 w-2 rounded-full bg-indigo-500" />
            <h1 className="font-bold text-gray-800 truncate max-w-[150px] md:max-w-md text-sm">{book.title}</h1>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            {book.type === 'image' && book.originalImage && (
              <button 
                onClick={() => setShowOriginalImage(!showOriginalImage)}
                className={`p-2.5 rounded-xl transition-all ${showOriginalImage ? 'bg-amber-50 text-amber-600' : 'text-gray-400 hover:bg-gray-50'}`}
                title="查看原图"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
            )}

            <button 
              onClick={() => setShowStyleMenu(!showStyleMenu)}
              className={`p-2.5 rounded-xl transition-all ${showStyleMenu ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:bg-gray-50'}`}
              title="阅读设置"
            >
              <TypeIcon className="w-5 h-5" />
            </button>

            <button 
              onClick={() => setIsZenMode(!isZenMode)}
              className={`p-2.5 rounded-xl transition-all ${isZenMode ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-50'}`}
              title={isZenMode ? "退出专注模式" : "专注模式"}
            >
              {isZenMode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
            
            <button onClick={onOpenSettings} className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 样式调整菜单 */}
        {showStyleMenu && (
          <div className="absolute top-full right-4 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="space-y-6">
              {/* 阅读模式切换 */}
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">阅读模式</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setViewMode('scroll')}
                    className={`py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'scroll' ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                  >
                    垂直滚动
                  </button>
                  <button 
                    onClick={() => setViewMode('page')}
                    className={`py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'page' ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                  >
                    左右翻页
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">字体大小</label>
                <div className="flex items-center justify-between bg-gray-50 rounded-xl p-1">
                  <button onClick={() => setFontSize(prev => Math.max(12, prev - 1))} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-600">
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-bold text-gray-800">{fontSize}px</span>
                  <button onClick={() => setFontSize(prev => Math.min(48, prev + 1))} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-600">
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">行间距</label>
                  <div className="flex bg-gray-50 rounded-xl p-1">
                    {[1.4, 1.8, 2.2].map(lh => (
                      <button 
                        key={lh}
                        onClick={() => setLineHeight(lh)}
                        className={`flex-1 flex items-center justify-center p-2 rounded-lg transition-all ${lineHeight === lh ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-100'}`}
                      >
                        <MoveVertical className="w-3.5 h-3.5" />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">粗细</label>
                  <div className="flex bg-gray-50 rounded-xl p-1">
                    {['400', '600'].map(w => (
                      <button 
                        key={w}
                        onClick={() => setFontWeight(w)}
                        className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all ${fontWeight === w ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-100'}`}
                      >
                        {w === '400' ? '标准' : '加粗'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="absolute bottom-0 left-0 h-[2px] bg-indigo-100 w-full">
          <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </header>

      {/* 主阅读区域 */}
      <main 
        ref={mainRef}
        onScroll={handleScroll}
        onMouseUp={handleMouseUp}
        className={`flex-1 relative flex flex-col items-center scroll-smooth selection:bg-indigo-100 overflow-hidden ${viewMode === 'scroll' ? 'overflow-y-auto pt-24 pb-32' : ''}`}
      >
        {/* 翻页导航热区 (仅在分页模式显示) */}
        {viewMode === 'page' && (
          <>
            <div 
              onClick={handlePrevPage}
              className="fixed left-20 top-16 bottom-0 w-24 z-20 cursor-w-resize group flex items-center justify-center"
            >
              <div className="p-3 bg-white/20 backdrop-blur rounded-full text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronLeft className="w-6 h-6" />
              </div>
            </div>
            <div 
              onClick={handleNextPage}
              className="fixed right-0 top-16 bottom-0 w-24 z-20 cursor-e-resize group flex items-center justify-center"
            >
              <div className="p-3 bg-white/20 backdrop-blur rounded-full text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight className="w-6 h-6" />
              </div>
            </div>
          </>
        )}

        <div className={`max-w-[850px] w-full h-full transition-all duration-500 flex flex-col ${viewMode === 'page' ? 'pt-24 pb-20' : ''}`}>
          
          <div 
            ref={contentRef}
            className={`serif text-gray-800 transition-all duration-700 h-full ${
              viewMode === 'page' 
              ? 'columns-1 md:columns-2 gap-12 overflow-visible' 
              : 'space-y-10'
            }`}
            style={{ 
              fontSize: `${fontSize}px`,
              fontWeight: fontWeight,
              lineHeight: lineHeight,
              textAlign: textAlign,
              letterSpacing: '-0.01em',
              // 翻页模式的关键样式
              ...(viewMode === 'page' ? {
                transform: `translateX(calc(-${currentPage * 100}% - ${currentPage * 48}px))`,
                transition: 'transform 0.5s cubic-bezier(0.2, 0, 0, 1)',
                width: '100%',
                columnFill: 'auto'
              } : {})
            }}
          >
            {/* 首页标题 - 仅在第一页显示较美观 */}
            <div className="mb-12 text-center md:text-left break-inside-avoid-column">
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-2">Chapter Content</p>
              <h1 className="text-3xl md:text-5xl font-bold text-gray-900 leading-tight serif mb-4">{book.title}</h1>
              <div className="h-px w-12 bg-indigo-100 mb-8" />
            </div>

            {paragraphs.map((para, i) => (
              <p key={i} className={`mb-[1.5em] relative group px-2 md:px-0 break-inside-avoid-column`}>
                <span className="absolute -left-4 top-0 h-full w-1 bg-indigo-500/0 group-hover:bg-indigo-500/10 rounded-full transition-all" />
                {para}
              </p>
            ))}
          </div>
        </div>
      </main>

      {/* 底部状态栏 */}
      <footer className="fixed bottom-0 left-0 right-0 md:left-20 h-12 bg-white/80 backdrop-blur border-t border-gray-50 flex items-center justify-between px-8 z-30">
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
            {viewMode === 'page' ? `PAGE ${currentPage + 1} / ${totalPages}` : `${progress}% COMPLETED`}
          </span>
          {viewMode === 'page' && (
             <div className="flex gap-1">
               {Array.from({ length: Math.min(totalPages, 10) }).map((_, i) => (
                 <div key={i} className={`h-1 rounded-full transition-all ${Math.floor((currentPage / totalPages) * 10) === i ? 'w-4 bg-indigo-400' : 'w-1 bg-gray-100'}`} />
               ))}
             </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
           <button onClick={handlePrevPage} disabled={currentPage === 0} className="p-1 text-gray-300 hover:text-indigo-600 disabled:opacity-30">
             <ChevronLeft className="w-4 h-4" />
           </button>
           <button onClick={handleNextPage} disabled={currentPage === totalPages - 1} className="p-1 text-gray-300 hover:text-indigo-600 disabled:opacity-30">
             <ChevronRight className="w-4 h-4" />
           </button>
        </div>
      </footer>
    </div>
  );
};

export default Reader;
