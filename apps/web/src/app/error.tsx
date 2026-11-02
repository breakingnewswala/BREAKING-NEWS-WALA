'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[Web Error Boundary caught]:', error);
  }, [error]);

  return (
    <main className="site-container py-16 text-center" role="alert">
      <div className="max-w-md mx-auto bg-red-50 border border-red-200 rounded-2xl p-8">
        <span className="text-5xl">⚠️</span>
        <h1 className="text-xl font-bold text-red-900 mt-4">
          तकनीकी त्रुटि उत्पन्न हुई
        </h1>
        <p className="text-xs text-red-700 mt-2 leading-relaxed">
          समाचार लोड करने के दौरान एक अप्रत्याशित समस्या आई है। हमारी तकनीकी टीम इसकी निगरानी कर रही है।
        </p>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#ED1727] text-white text-sm font-semibold hover:bg-[#c9121f] transition-colors"
          >
            पुनः प्रयास करें (Try Again)
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto px-5 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors"
          >
            मुख्य पृष्ठ
          </Link>
        </div>
      </div>
    </main>
  );
}

