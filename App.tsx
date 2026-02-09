
import React, { useState, useCallback, useEffect } from 'react';
import { Book, AnalysisResult, SavedItem, AppSettings, BookProgress } from './types';
import Uploader from './components/Uploader';
import Reader from './components/Reader';
import AnalysisSidebar from './components/AnalysisSidebar';
import CollectionView from './components/CollectionView';
import SettingsModal from './components/SettingsModal';
import { analyzeWord, analyzeSentence } from './services/aiService';
import { Library, Star, Brain, Plus, ChevronLeft, Layout, BookOpen } from 'lucide-react';

const App: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [currentBookId, setCurrentBookId] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [view, setView] = useState<'home' | 'reader' | 'collection' | 'upload'>('home');
  const [favorites, setFavorites] = useState<SavedItem[]>([]);
  const [progress, setProgress] = useState<BookProgress>({});
  const [settings, setSettings] = useState<AppSettings>({ aiProvider: 'gemini' });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // 安全加载数据
  useEffect(() => {
    const safeLoad = (key: string, setter: (val: any) => void) => {
      try {
        const saved = localStorage.getItem(key);
        if (saved && saved !== 'undefined' && saved !== 'null') {
          setter(JSON.parse(saved));
        }
      } catch (e) {
        console.error(`Failed to load ${key}:`, e);
      }
    };

    safeLoad('linguist_books', setBooks);
    safeLoad('linguist_favorites', setFavorites);
    safeLoad('linguist_progress', setProgress);
    safeLoad('linguist_settings', setSettings);
  }, []);

  // 数据持久化
  useEffect(() => {
    if (books.length > 0) localStorage.setItem('linguist_books', JSON.stringify(books));
  }, [books]);
  useEffect(() => localStorage.setItem('linguist_favorites', JSON.stringify(favorites)), [favorites]);
  useEffect(() => localStorage.setItem('linguist_progress', JSON.stringify(progress)), [progress]);
  useEffect(() => localStorage.setItem('linguist_settings', JSON.stringify(settings)), [settings]);

  const currentBook = books.find(b => b.id === currentBookId) || null;

  const onBookUpload = useCallback((book: Book) => {
    setBooks(prev => [book, ...prev]);
    setCurrentBookId(book.id);
    setView('reader');
  }, []);

  const handleWordSelect = useCallback(async (word: string) => {
    if (!word || isLoadingAnalysis) return;
    setIsLoadingAnalysis(true);
    setAnalysis(null);
    try {
      const data = await analyzeWord(word, settings.aiProvider, settings.deepseekApiKey);
      setAnalysis({ type: 'word', data });
    } catch (error: any) {
      console.error(error);
      alert(`分析失败: ${error.message || '网络或 API 错误'}`);
    } finally {
      setIsLoadingAnalysis(false);
    }
  }, [settings, isLoadingAnalysis]);

  const handleSentenceSelect = useCallback(async (sentence: string) => {
    if (!sentence || isLoadingAnalysis) return;
    setIsLoadingAnalysis(true);
    setAnalysis(null);
    try {
      const data = await analyzeSentence(sentence, settings.aiProvider, settings.deepseekApiKey);
      setAnalysis({ type: 'sentence', data });
    } catch (error: any) {
      console.error(error);
      alert(`分析失败: ${error.message || '网络或 API 错误'}`);
    } finally {
      setIsLoadingAnalysis(false);
    }
  }, [settings, isLoadingAnalysis]);

  const handleProgressUpdate = useCallback((val: number) => {
    if (currentBookId) setProgress(prev => ({ ...prev, [currentBookId]: val }));
  }, [currentBookId]);

  const handleSaveItem = useCallback((result: AnalysisResult) => {
    const isWord = result.type === 'word';
    const content = isWord ? result.data.word : result.data.original;
    setFavorites(prev => {
      const existing = prev.find(item => item.content === content);
      if (existing) return prev.filter(item => item.content !== content);
      const newItem: SavedItem = {
        id: Math.random().toString(36).substring(2, 11),
        type: result.type,
        content,
        translation: isWord ? result.data.chineseMeaning : result.data.translation,
        timestamp: Date.now(),
        details: result.data
      };
      return [newItem, ...prev];
    });
  }, []);

  const isCurrentItemSaved = analysis ? favorites.some(f => f.content === (analysis.type === 'word' ? analysis.data.word : analysis.data.original)) : false;

  return (
    <div className="flex flex-col md:flex-row h-screen bg-white overflow-hidden selection:bg-indigo-100">
      {/* 侧边/底部导航 */}
      <nav className="fixed bottom-0 left-0 w-full h-16 md:relative md:w-20 md:h-screen bg-white/90 backdrop-blur-xl md:border-r border-gray-100 flex md:flex-col items-center justify-around md:justify-start py-0 md:py-8 z-[55] pb-safe border-t md:border-t-0">
        <div onClick={() => setView('home')} className="hidden md:flex w-12 h-12 bg-indigo-600 rounded-2xl items-center justify-center text-white cursor-pointer mb-10 shadow-lg shadow-indigo-100 hover:scale-105 transition-all">
          <Layout className="w-6 h-6" />
        </div>
        
        <div className="flex-1 flex md:flex-col items-center justify-around md:justify-center gap-2 md:gap-10 w-full">
          <button onClick={() => setView('home')} className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${view === 'home' ? 'text-indigo-600 md:bg-indigo-50' : 'text-gray-300 hover:text-gray-400'}`}>
            <Library className="w-6 h-6" />
            <span className="text-[10px] font-bold md:hidden">书架</span>
          </button>
          <button onClick={() => setView('collection')} className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${view === 'collection' ? 'text-indigo-600 md:bg-indigo-50' : 'text-gray-300 hover:text-gray-400'}`}>
            <Star className={`w-6 h-6 ${view === 'collection' ? 'fill-indigo-600' : ''}`} />
            <span className="text-[10px] font-bold md:hidden">收藏</span>
          </button>
          <button onClick={() => setIsSettingsOpen(true)} className="flex flex-col items-center gap-1 p-2 text-gray-300 hover:text-gray-400">
            <Brain className="w-6 h-6" />
            <span className="text-[10px] font-bold md:hidden">设置</span>
          </button>
        </div>
      </nav>

      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0 relative">
        {view === 'home' ? (
          <div className="flex-1 overflow-y-auto px-5 py-8 md:px-12 md:py-16 bg-gray-50/30">
            <header className="max-w-6xl mx-auto flex justify-between items-end mb-10">
              <div>
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">Library</p>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">我的书架</h1>
              </div>
              <button onClick={() => setView('upload')} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-2xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">
                <Plus className="w-5 h-5" /> <span className="hidden sm:inline">导入新书</span>
              </button>
            </header>

            <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-8">
              {books.map(book => (
                <div key={book.id} onClick={() => { setCurrentBookId(book.id); setView('reader'); }} className="group cursor-pointer flex flex-col">
                  <div className="aspect-[3/4] mb-4 bg-white rounded-[2rem] border border-gray-100 flex items-center justify-center relative overflow-hidden shadow-sm group-hover:shadow-2xl group-hover:shadow-indigo-500/10 transition-all duration-500 group-hover:-translate-y-2">
                    {book.originalImage ? (
                       <img src={book.originalImage} className="w-full h-full object-cover" alt="" />
                    ) : (
                       <div className="flex flex-col items-center gap-2 opacity-20">
                         <BookOpen className="w-12 h-12 text-gray-400" />
                         <span className="text-[10px] font-black uppercase tracking-widest">{book.type}</span>
                       </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="h-1 w-full bg-white/30 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 transition-all duration-700" style={{ width: `${progress[book.id] || 0}%` }} />
                      </div>
                    </div>
                  </div>
                  <h3 className="font-bold text-gray-800 truncate text-sm px-1">{book.title}</h3>
                  <p className="text-[10px] text-gray-400 mt-1 uppercase font-black tracking-widest px-1">已读 {progress[book.id] || 0}%</p>
                </div>
              ))}
              {books.length === 0 && (
                <div onClick={() => setView('upload')} className="col-span-full py-20 border-2 border-dashed border-gray-100 rounded-[3rem] flex flex-col items-center justify-center text-gray-300 hover:border-indigo-200 hover:text-indigo-400 transition-all cursor-pointer group">
                  <Plus className="w-12 h-12 mb-4 opacity-10 group-hover:opacity-100 transition-opacity" />
                  <p className="font-bold text-sm">还没有书籍，点击上传一本吧</p>
                </div>
              )}
            </div>
          </div>
        ) : view === 'upload' ? (
          <div className="flex-1 overflow-y-auto px-6 py-10 md:px-20 md:py-24">
            <button onClick={() => setView('home')} className="flex items-center gap-2 mb-10 font-bold text-xs text-gray-400 hover:text-indigo-600 transition-colors">
              <ChevronLeft className="w-4 h-4" /> 返回主页
            </button>
            <Uploader onUpload={onBookUpload} />
          </div>
        ) : view === 'reader' && currentBook ? (
          <Reader 
            book={currentBook} 
            initialProgress={progress[currentBook.id] || 0}
            onSelectWord={handleWordSelect} 
            onSelectSentence={handleSentenceSelect}
            onProgressUpdate={handleProgressUpdate}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        ) : view === 'collection' ? (
          <CollectionView 
            items={favorites} 
            onRemove={(id) => setFavorites(f => f.filter(x => x.id !== id))} 
            onViewDetails={(item) => setAnalysis({ type: item.type as any, data: item.details as any })} 
          />
        ) : null}
      </div>

      <AnalysisSidebar 
        result={analysis} 
        onClose={() => setAnalysis(null)} 
        loading={isLoadingAnalysis} 
        onSave={handleSaveItem} 
        isSaved={isCurrentItemSaved} 
      />
      
      {isSettingsOpen && (
        <SettingsModal 
          settings={settings} 
          onUpdate={setSettings} 
          onClose={() => setIsSettingsOpen(false)} 
        />
      )}
    </div>
  );
};

export default App;
