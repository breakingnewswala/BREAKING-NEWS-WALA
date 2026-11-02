'use client';

import React, { useState, useEffect } from 'react';

type FontSize = 'sm' | 'md' | 'lg';

export const FontSizeSwitcher: React.FC = () => {
  const [size, setSize] = useState<FontSize>('md');

  useEffect(() => {
    const articleBody = document.getElementById('article-content-body');
    if (!articleBody) return;

    if (size === 'sm') {
      articleBody.style.fontSize = '1.0rem';     // 16px
      articleBody.style.lineHeight = '1.8';
    } else if (size === 'md') {
      articleBody.style.fontSize = '1.125rem';   // 18px (Default)
      articleBody.style.lineHeight = '1.85';
    } else if (size === 'lg') {
      articleBody.style.fontSize = '1.375rem';   // 22px
      articleBody.style.lineHeight = '1.9';
    }
  }, [size]);

  return (
    <div className="inline-flex items-center bg-gray-100 rounded-lg p-1 border border-gray-200" role="group" aria-label="अक्षर का आकार चुनें">
      <span className="text-xs text-gray-500 font-medium px-2 hidden sm:inline">फॉन्ट:</span>
      <button
        type="button"
        onClick={() => setSize('sm')}
        aria-label="छोटा फॉन्ट (16px)"
        title="छोटा आकार"
        className={`px-2.5 py-1 text-xs font-bold rounded transition-colors ${
          size === 'sm'
            ? 'bg-white text-[#ED1727] shadow-sm'
            : 'text-gray-700 hover:text-gray-900'
        }`}
      >
        अ-
      </button>

      <button
        type="button"
        onClick={() => setSize('md')}
        aria-label="सामान्य फॉन्ट (18px)"
        title="सामान्य आकार"
        className={`px-2.5 py-1 text-sm font-bold rounded transition-colors ${
          size === 'md'
            ? 'bg-white text-[#ED1727] shadow-sm'
            : 'text-gray-700 hover:text-gray-900'
        }`}
      >
        अ
      </button>

      <button
        type="button"
        onClick={() => setSize('lg')}
        aria-label="बड़ा फॉन्ट (22px)"
        title="बड़ा आकार"
        className={`px-2.5 py-1 text-base font-bold rounded transition-colors ${
          size === 'lg'
            ? 'bg-white text-[#ED1727] shadow-sm'
            : 'text-gray-700 hover:text-gray-900'
        }`}
      >
        अ+
      </button>
    </div>
  );
};

export default FontSizeSwitcher;

