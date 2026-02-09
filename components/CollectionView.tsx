
import React, { useState } from 'react';
import { SavedItem } from '../types';
import { Trash2, Search, Calendar, ChevronRight, BookOpen, Layers } from 'lucide-react';

interface CollectionViewProps {
  items: SavedItem[];
  onRemove: (id: string) => void;
  onViewDetails: (item: SavedItem) => void;
}

const CollectionView: React.FC<CollectionViewProps> = ({ items, onRemove, onViewDetails }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = items.filter(item => 
    item.content.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.translation.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => b.timestamp - a.timestamp);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
      <header className="px-6 md:px-8 py-5 md:py-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">我的收藏</h1>
          <p className="text-[10px] md:text-sm text-gray-400 mt-1 uppercase font-black tracking-widest">已收藏 {items.length} 个项目</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="搜索单词或句子..." 
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        {filteredItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-40 px-10">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Search className="w-6 h-6 md:w-8 md:h-8" />
            </div>
            <p className="text-base md:text-lg font-medium">没有找到相关内容</p>
            <p className="text-xs md:text-sm">在阅读时选中内容并分析后即可点击收藏</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:gap-4 max-w-4xl mx-auto">
            {filteredItems.map((item) => (
              <div 
                key={item.id} 
                className="group bg-white border border-gray-100 p-4 md:p-5 rounded-2xl hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/5 transition-all flex items-start justify-between gap-3 md:gap-4 cursor-pointer"
                onClick={() => onViewDetails(item)}
              >
                <div className="flex items-start gap-3 md:gap-4 flex-1 min-w-0">
                  <div className={`mt-1 p-2 rounded-lg flex-shrink-0 ${item.type === 'word' ? 'bg-indigo-50 text-indigo-600' : 'bg-green-50 text-green-600'}`}>
                    {item.type === 'word' ? <BookOpen className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <Layers className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-900 truncate text-sm md:text-base">{item.content}</h3>
                      <span className="text-[9px] uppercase font-black text-gray-300 tracking-widest flex-shrink-0">{item.type}</span>
                    </div>
                    <p className="text-gray-500 text-xs md:text-sm line-clamp-2 md:line-clamp-1">{item.translation}</p>
                    <div className="flex items-center gap-3 mt-2 md:mt-3 text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(item.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 md:gap-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(item.id);
                    }}
                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="删除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="p-1 text-gray-200 group-hover:text-indigo-500 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CollectionView;
