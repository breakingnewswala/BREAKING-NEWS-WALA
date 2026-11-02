import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="site-container py-16 text-center" role="main">
      <div className="max-w-md mx-auto bg-gray-50 border border-gray-200 rounded-2xl p-8 shadow-xs">
        <span className="text-5xl">🧭</span>
        <h1 className="text-4xl font-extrabold text-[#ED1727] mt-4 font-mono">404</h1>
        <h2 className="text-xl font-bold text-gray-900 mt-2">
          पृष्ठ नहीं मिला (Page Not Found)
        </h2>
        <p className="text-sm text-gray-600 mt-2 leading-relaxed">
          आप जिस समाचार या पृष्ठ की तलाश कर रहे हैं, वह स्थानांतरित हो चुका है या उपलब्ध नहीं है।
        </p>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#ED1727] text-white text-sm font-semibold hover:bg-[#c9121f] transition-colors"
          >
            ← मुख्य पृष्ठ पर जाएं
          </Link>
          <Link
            href="/search"
            className="w-full sm:w-auto px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-100 transition-colors"
          >
            समाचार खोजें
          </Link>
        </div>
      </div>
    </main>
  );
}

