
import React, { useState, useCallback, useEffect } from 'react';
import { Book, AnalysisResult, SavedItem, AppSettings, BookProgress } from './types';
import Uploader from './components/Uploader';
import Reader from './components/Reader';
import AnalysisSidebar from './components/AnalysisSidebar';
import CollectionView from './components/CollectionView';
import SettingsModal from './components/SettingsModal';
import { analyzeWord, analyzeSentence } from './services/aiService';
import { Library, Star, Brain, Plus, ChevronLeft, Layout, BookOpen, Clock } from 'lucide-react';

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

  useEffect(() => {
    const safeLoad = (key: string, setter: (val: any) => void) => {
      try {
        const saved = localStorage.getItem(key);
        if (saved && saved !== 'undefined') setter(JSON.parse(saved));
      } catch (e) { console.error(e); }
    };
    safeLoad('linguist_books', setBooks);
    safeLoad('linguist_favorites', setFavorites);
    safeLoad('linguist_progress', setProgress);
    safeLoad('linguist_settings', setSettings);
  }, []);

  useEffect(() => localStorage.setItem('linguist_books', JSON.stringify(books)), [books]);
  useEffect(() => localStorage.setItem('linguist_favorites', JSON.stringify(favorites)), [favorites]);
  useEffect(() => localStorage.setItem('linguist_progress', JSON.stringify(progress)), [progress]);
  useEffect(() => localStorage.setItem('linguist_settings', JSON.stringify(settings)), [settings]);

  const onBookUpload = useCallback((book: Book) => {
    setBooks(prev => [book, ...prev]);
    setCurrentBookId(book.id);
    setView('reader');
  }, []);

  const handleWordSelect = useCallback(async (word: string) => {
    setIsLoadingAnalysis(true);
    setAnalysis(null);
    try {
      const data = await analyzeWord(word, settings.aiProvider, settings.deepseekApiKey);
      setAnalysis({ type: 'word', data });
    } catch (error) { console.error(error); } finally { setIsLoadingAnalysis(false); }
  }, [settings]);

  const handleSentenceSelect = useCallback(async (sentence: string) => {
    setIsLoadingAnalysis(true);
    setAnalysis(null);
    try {
      const data = await analyzeSentence(sentence, settings.aiProvider, settings.deepseekApiKey);
      setAnalysis({ type: 'sentence', data });
    } catch (error) { console.error(error); } finally { setIsLoadingAnalysis(false); }
  }, [settings]);

  const handleProgressUpdate = (val: number) => {
    if (currentBookId) setProgress(prev => ({ ...prev, [currentBookId]: val }));
  };

  const handleSaveItem = (result: AnalysisResult) => {
    const isWord = result.type === 'word';
    const content = isWord ? result.data.word : result.data.original;
    setFavorites(prev => {
      if (prev.find(f => f.content === content)) return prev.filter(f => f.content !== content);
      return [{
        id: Math.random().toString(36).substring(2, 11),
        type: result.type,
        content,
        translation: isWord ? result.data.chineseMeaning : result.data.translation,
        timestamp: Date.now(),
        details: result.data
      }, ...prev];
    });
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-white selection:bg-indigo-100">
      <nav className="fixed bottom-0 left-0 w-full h-16 md:relative md:w-20 md:h-screen bg-white md:border-r border-gray-100 flex md:flex-col items-center justify-around md:justify-start md:py-10 z-[55] border-t md:border-t-0">
        <div className="hidden md:block mb-12"><div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white"><Layout className="w-5 h-5" /></div></div>
        <button onClick={() => setView('home')} className={`p-3 rounded-2xl transition-all ${view === 'home' ? 'text-indigo-600 bg-indigo-50 shadow-inner' : 'text-gray-300'}`}><Library className="w-6 h-6" /></button>
        <button onClick={() => setView('collection')} className={`p-3 rounded-2xl transition-all ${view === 'collection' ? 'text-indigo-600 bg-indigo-50 shadow-inner' : 'text-gray-300'}`}><Star className="w-6 h-6" /></button>
        <div className="flex-1" />
        <button onClick={() => setIsSettingsOpen(true)} className="p-3 text-gray-300 mb-6 hidden md:block"><Brain className="w-6 h-6" /></button>
      </nav>

      <div className="flex-1 overflow-hidden relative pb-16 md:pb-0">
        {view === 'home' ? (
          <div className="h-full overflow-y-auto bg-[#f9fafb] px-6 py-10 md:px-16 md:py-20">
            <header className="max-w-6xl mx-auto flex justify-between items-center mb-16">
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">我的书架</h1>
              <button onClick={() => setView('upload')} className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all text-indigo-600 border border-gray-50"><Plus className="w-6 h-6" /></button>
            </header>

            <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-y-12 gap-x-8">
              {books.map(book => (
                <div key={book.id} onClick={() => { setCurrentBookId(book.id); setView('reader'); }} className="group cursor-pointer flex flex-col items-center text-center">
                  <div className="relative w-full aspect-[3/4.2] mb-5 transform transition-all duration-500 group-hover:-translate-y-3 group-hover:rotate-1">
                    {/* 书脊阴影模拟 2.5D */}
                    <div className="absolute inset-0 bg-black/10 rounded-r-lg blur-md translate-x-2 translate-y-2 group-hover:translate-x-4 group-hover:translate-y-4" />
                    <div className="absolute inset-0 bg-white rounded-l-sm rounded-r-lg overflow-hidden shadow-sm border border-gray-100 flex items-center justify-center">
                      {book.originalImage ? (
                        <img src={book.originalImage} className="w-full h-full object-cover" />
                      ) : (
                        <div className="p-4 flex flex-col items-center gap-3">
                          <BookOpen className="w-10 h-10 text-indigo-100" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">{book.type}</span>
                        </div>
                      )}
                      {/* 书脊纹理 */}
                      <div className="absolute left-0 inset-y-0 w-2 bg-black/5 border-r border-black/5" />
                    </div>
                    {/* 阅读进度 */}
                    <div className="absolute bottom-3 left-4 right-4 h-1 bg-black/5 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 transition-all duration-700" style={{ width: `${progress[book.id] || 0}%` }} />
                    </div>
                  </div>
                  <h3 className="font-bold text-gray-800 truncate w-full text-sm">{book.title}</h3>
                  <div className="flex items-center gap-1 mt-1 opacity-30">
                     <Clock className="w-3 h-3" />
                     <span className="text-[9px] font-black uppercase">已读 {progress[book.id] || 0}%</span>
                  </div>
                </div>
              ))}
              <div onClick={() => setView('upload')} className="aspect-[3/4.2] rounded-[2rem] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-gray-200 hover:border-indigo-200 hover:text-indigo-300 transition-all group cursor-pointer">
                <Plus className="w-12 h-12 mb-2 opacity-20 group-hover:opacity-100" />
                <span className="text-[10px] font-black uppercase">导入书籍</span>
              </div>
            </div>
          </div>
        ) : view === 'upload' ? (
          <div className="h-full overflow-y-auto px-6 py-10 md:px-20 bg-white">
            <button onClick={() => setView('home')} className="flex items-center gap-2 mb-10 font-bold text-xs text-gray-400"><ChevronLeft className="w-4 h-4" /> 返回</button>
            <Uploader onUpload={onBookUpload} />
          </div>
        ) : view === 'reader' && currentBookId ? (
          <Reader 
            book={books.find(b => b.id === currentBookId)!} 
            initialProgress={progress[currentBookId] || 0}
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

      <AnalysisSidebar result={analysis} onClose={() => setAnalysis(null)} loading={isLoadingAnalysis} onSave={handleSaveItem} isSaved={!!analysis && favorites.some(f => f.content === (analysis.type === 'word' ? analysis.data.word : analysis.data.original))} />
      {isSettingsOpen && <SettingsModal settings={settings} onUpdate={setSettings} onClose={() => setIsSettingsOpen(false)} />}
    </div>
  );
};

export default App;
