import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Category } from '../../types/index.ts';

interface CategoryNavProps {
  categories: Category[];
  selectedCategory: string;
  selectedSubcategory?: string;
  onSelectCategory: (catName: string) => void;
  onSelectSubcategory: (subcatName: string) => void;
}

export const CategoryNav: React.FC<CategoryNavProps> = ({
  categories,
  selectedCategory,
  selectedSubcategory,
  onSelectCategory,
  onSelectSubcategory
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Find active category to extract its subcategories
  const activeCategoryObj = categories.find(c => c.nameHindi === selectedCategory);
  const subcategories = activeCategoryObj?.subcategories || [];

  return (
    <nav className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 relative flex items-center">
        {/* Left scroll arrow */}
        <button
          onClick={() => scroll('left')}
          className="hidden md:flex items-center justify-center w-7 h-7 rounded-full bg-white shadow-xs border border-gray-200 text-gray-600 hover:text-red-600 hover:bg-gray-50 shrink-0 z-10"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Scrollable Categories List */}
        <div
          ref={scrollRef}
          className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-2.5 px-1 scroll-smooth w-full"
        >
          <button
            onClick={() => {
              onSelectCategory('होम');
              onSelectSubcategory('');
            }}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs sm:text-sm font-bold transition shrink-0 ${
              selectedCategory === 'होम'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-gray-700 hover:text-red-600 hover:bg-red-50'
            }`}
          >
            होम (Home)
          </button>

          {categories.filter(c => c.isActive).map(cat => {
            const isSelected = selectedCategory === cat.nameHindi;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  onSelectCategory(cat.nameHindi);
                  onSelectSubcategory('');
                }}
                className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition shrink-0 ${
                  isSelected
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-gray-700 hover:text-red-600 hover:bg-red-50'
                }`}
              >
                {cat.nameHindi}
              </button>
            );
          })}
        </div>

        {/* Right scroll arrow */}
        <button
          onClick={() => scroll('right')}
          className="hidden md:flex items-center justify-center w-7 h-7 rounded-full bg-white shadow-xs border border-gray-200 text-gray-600 hover:text-red-600 hover:bg-gray-50 shrink-0 z-10"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Subcategories Secondary Bar (if available) */}
      {subcategories.length > 0 && selectedCategory !== 'होम' && (
        <div className="bg-amber-50/70 border-t border-amber-100 py-1.5 px-4 overflow-x-auto no-scrollbar">
          <div className="max-w-7xl mx-auto flex items-center gap-2">
            <span className="text-[11px] font-bold text-amber-900 whitespace-nowrap">
              {selectedCategory} अनुभाग:
            </span>
            <button
              onClick={() => onSelectSubcategory('')}
              className={`text-xs px-2.5 py-0.5 rounded-full font-medium transition whitespace-nowrap ${
                !selectedSubcategory
                  ? 'bg-amber-600 text-white font-bold'
                  : 'bg-white text-gray-700 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              सभी
            </button>
            {subcategories.map((sub, i) => (
              <button
                key={i}
                onClick={() => onSelectSubcategory(sub)}
                className={`text-xs px-2.5 py-0.5 rounded-full font-medium transition whitespace-nowrap ${
                  selectedSubcategory === sub
                    ? 'bg-amber-600 text-white font-bold'
                    : 'bg-white text-gray-700 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};
