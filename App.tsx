import React, { useState, useCallback, useEffect } from 'react';
import { Book, AnalysisResult, SavedItem, AppSettings, BookProgress } from './types';
import Uploader from './components/Uploader';
import Reader from './components/Reader';
import AnalysisSidebar from './components/AnalysisSidebar';
import CollectionView from './components/CollectionView';
import SettingsModal from './components/SettingsModal';
import { analyzeWord, analyzeSentence } from './services/aiService';
// Added ChevronLeft to the lucide-react icons import list
import { BookOpen, LogOut, Library, Star, Sparkles, Brain, Plus, Trash2, Clock, ChevronLeft } from 'lucide-react';

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

  // 持久化逻辑
  useEffect(() => {
    try {
      const savedBooks = localStorage.getItem('linguist_books');
      const favs = localStorage.getItem('linguist_favorites');
      const prog = localStorage.getItem('linguist_progress');
      const sett = localStorage.getItem('linguist_settings');
      
      if (savedBooks) setBooks(JSON.parse(savedBooks));
      if (favs) setFavorites(JSON.parse(favs));
      if (prog) setProgress(JSON.parse(prog));
      if (sett) setSettings(JSON.parse(sett));
    } catch (e) {
      console.error("Failed to load state from localStorage", e);
    }
  }, []);

  useEffect(() => localStorage.setItem('linguist_books', JSON.stringify(books)), [books]);
  useEffect(() => localStorage.setItem('linguist_favorites', JSON.stringify(favorites)), [favorites]);
  useEffect(() => localStorage.setItem('linguist_progress', JSON.stringify(progress)), [progress]);
  useEffect(() => localStorage.setItem('linguist_settings', JSON.stringify(settings)), [settings]);

  const currentBook = books.find(b => b.id === currentBookId) || null;

  const handleWordSelect = useCallback(async (word: string) => {
    if (!word) return;
    setIsLoadingAnalysis(true);
    setAnalysis(null);
    try {
      const data = await analyzeWord(word, settings.aiProvider, settings.deepseekApiKey);
      setAnalysis({ type: 'word', data });
    } catch (error: any) {
      console.error("Word analysis error:", error);
      alert(`分析失败: ${error.message || "未知错误"}`);
    } finally {
      setIsLoadingAnalysis(false);
    }
  }, [settings]);

  const handleSentenceSelect = useCallback(async (sentence: string) => {
    if (!sentence) return;
    setIsLoadingAnalysis(true);
    setAnalysis(null);
    try {
      const data = await analyzeSentence(sentence, settings.aiProvider, settings.deepseekApiKey);
      setAnalysis({ type: 'sentence', data });
    } catch (error: any) {
      console.error("Sentence analysis error:", error);
      alert(`分析失败: ${error.message || "未知错误"}`);
    } finally {
      setIsLoadingAnalysis(false);
    }
  }, [settings]);

  const handleProgressUpdate = useCallback((val: number) => {
    if (currentBookId) {
      setProgress(prev => ({ ...prev, [currentBookId]: val }));
    }
  }, [currentBookId]);

  const handleSaveItem = useCallback((result: AnalysisResult) => {
    const isWord = result.type === 'word';
    const content = isWord ? result.data.word : result.data.original;
    setFavorites(prev => {
      const existing = prev.find(item => item.content === content);
      if (existing) return prev.filter(item => item.content !== content);
      
      const newItem: SavedItem = {
        id: Math.random().toString(36).substr(2, 9),
        type: result.type,
        content,
        translation: isWord ? result.data.chineseMeaning : result.data.translation,
        timestamp: Date.now(),
        details: result.data
      };
      return [newItem, ...prev];
    });
  }, []);

  const handleViewDetails = useCallback((item: SavedItem) => {
    setAnalysis({ type: item.type as any, data: item.details as any });
  }, []);

  const onBookUpload = (newBook: Book) => {
    setBooks(prev => [newBook, ...prev]);
    setCurrentBookId(newBook.id);
    setView('reader');
  };

  const isCurrentItemSaved = analysis ? favorites.some(f => f.content === (analysis.type === 'word' ? analysis.data.word : analysis.data.original)) : false;

  return (
    <div className="flex flex-col md:flex-row h-screen bg-white font-sans selection:bg-indigo-100 overflow-hidden">
      {/* 极简侧边导航 */}
      <nav className="fixed bottom-0 left-0 w-full h-16 md:relative md:w-20 md:h-screen bg-white md:border-r border-gray-100 flex md:flex-col items-center justify-around md:justify-start py-0 md:py-8 z-40">
        <div 
          onClick={() => setView('home')}
          className="hidden md:flex w-10 h-10 bg-indigo-600 rounded-xl items-center justify-center text-white cursor-pointer mb-10 transition-transform active:scale-90"
        >
          <BookOpen className="w-5 h-5" />
        </div>
        
        <div className="flex-1 flex md:flex-col items-center justify-around md:justify-center gap-0 md:gap-8 w-full">
          <button onClick={() => setView('home')} className={`p-3 rounded-xl transition-all ${view === 'home' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-300 hover:text-gray-500'}`}>
            <Library className="w-6 h-6" />
          </button>
          <button onClick={() => setView('collection')} className={`p-3 rounded-xl transition-all ${view === 'collection' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-300 hover:text-gray-500'}`}>
            <Star className={`w-6 h-6 ${view === 'collection' ? 'fill-indigo-600' : ''}`} />
          </button>
          <button onClick={() => setIsSettingsOpen(true)} className="p-3 text-gray-300 hover:text-gray-500">
            <Brain className="w-6 h-6" />
          </button>
        </div>
      </nav>

      {/* 主视图区域 */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0 relative">
        {view === 'home' ? (
          <div className="flex-1 overflow-y-auto px-6 py-10 md:px-12 md:py-16">
            <header className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
              <div>
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">Personal Library</p>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">我的阅读</h1>
              </div>
              <button 
                onClick={() => setView('upload')}
                className="w-full md:w-auto flex items-center justify-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-black transition-all active:scale-95"
              >
                <Plus className="w-5 h-5" /> 添加新书
              </button>
            </header>

            <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {books.map(book => (
                <div 
                  key={book.id}
                  onClick={() => { setCurrentBookId(book.id); setView('reader'); }}
                  className="group bg-white rounded-2xl border border-gray-100 p-5 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 transition-all cursor-pointer flex flex-col"
                >
                  <div className="aspect-[3/4] mb-4 bg-gray-50 rounded-xl flex items-center justify-center relative overflow-hidden">
                    <BookOpen className="w-12 h-12 text-gray-200" />
                    <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/5 transition-colors" />
                    <div className="absolute top-3 right-3 px-2 py-0.5 bg-white border border-gray-100 rounded text-[9px] font-black uppercase tracking-widest text-gray-400">
                      {book.type}
                    </div>
                  </div>
                  <h3 className="font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">{book.title}</h3>
                  <p className="text-xs text-gray-400 mt-1 mb-4 italic truncate">{book.author}</p>
                  
                  <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                      Progress: {progress[book.id] || 0}%
                    </span>
                    <div className="h-1 w-20 bg-gray-50 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500" style={{ width: `${progress[book.id] || 0}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : view === 'upload' ? (
          <div className="flex-1 overflow-y-auto px-6 py-10 md:px-20 md:py-24">
            <button onClick={() => setView('home')} className="text-gray-400 hover:text-indigo-600 flex items-center gap-2 mb-10 font-bold text-xs transition-colors">
              <ChevronLeft className="w-4 h-4" /> 返回书架
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
            onViewDetails={handleViewDetails} 
          />
        ) : null}
      </div>

      {/* AI 分析侧边栏 */}
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