import React, { useState } from 'react';
import { X, Search, Clock, MapPin, Eye } from 'lucide-react';
import { Article } from '../../types/index.ts';

interface SearchModalProps {
  onClose: () => void;
  onSelectArticle: (article: Article) => void;
  articles: Article[];
}

export const SearchModal: React.FC<SearchModalProps> = ({ onClose, onSelectArticle, articles }) => {
  const [query, setQuery] = useState('');

  const quickKeywords = ['निवाड़ी', 'भोपाल', 'इंदौर', 'क्रिकेट', 'मौसम', 'ओरछा', 'मेट्रो', 'मंडी'];

  const results = query.trim() ? articles.filter(a =>
    a.title.toLowerCase().includes(query.toLowerCase()) ||
    a.content.toLowerCase().includes(query.toLowerCase()) ||
    a.district.toLowerCase().includes(query.toLowerCase()) ||
    a.category.toLowerCase().includes(query.toLowerCase())
  ) : [];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-start justify-center p-4 pt-16">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Bar */}
        <div className="p-4 border-b border-gray-200 flex items-center gap-3 bg-gray-50">
          <Search className="w-5 h-5 text-red-600 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="खबरें, जिले, विषय या कीवर्ड खोजें..."
            className="flex-1 text-sm sm:text-base font-semibold bg-transparent focus:outline-hidden text-gray-900"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500 text-xs font-bold px-3 py-1"
          >
            बंद करें
          </button>
        </div>

        {/* Quick Tag Pills */}
        <div className="px-4 py-2.5 bg-amber-50/50 border-b border-amber-100 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="font-bold text-gray-600 shrink-0">लोकप्रिय खोज:</span>
          {quickKeywords.map(kw => (
            <button
              key={kw}
              onClick={() => setQuery(kw)}
              className="bg-white hover:bg-amber-100 text-gray-800 px-2.5 py-0.5 rounded-full border border-amber-200 font-medium transition shrink-0"
            >
              {kw}
            </button>
          ))}
        </div>

        {/* Search Results / Empty State */}
        <div className="p-4 overflow-y-auto flex-1 divide-y divide-gray-100">
          {!query.trim() ? (
            <div className="py-12 text-center text-gray-400 text-sm">
              कृपया सर्च बॉक्स में कोई शब्द या जिले का नाम टाइप करें
            </div>
          ) : results.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-sm">
              "{query}" से संबंधित कोई समाचार नहीं मिला
            </div>
          ) : (
            results.map(art => (
              <div
                key={art.id}
                onClick={() => {
                  onSelectArticle(art);
                  onClose();
                }}
                className="py-3 flex gap-3 hover:bg-red-50/50 rounded-lg p-2 transition cursor-pointer group"
              >
                <img 
                  src={art.thumbnail} 
                  alt={art.title} 
                  className="w-20 h-16 rounded object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-[11px] font-bold text-red-600 mb-1">
                    <span>{art.category}</span>
                    <span>•</span>
                    <span className="text-gray-500 flex items-center gap-0.5">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      {art.district}
                    </span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-red-600 line-clamp-2">
                    {art.title}
                  </h4>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
