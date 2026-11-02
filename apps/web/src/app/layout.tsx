import React from 'react';
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { StickyBottomMobileBanner } from '../components/ads';
import { fetchCategories, fetchBreakingBulletins } from '../lib/api';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#ED1727',
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://breakingnewswala.in'),
  title: {
    default: 'BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला) — मध्य प्रदेश का सबसे तेज़ डिजिटल न्यूज़ नेटवर्क',
    template: '%s | BREAKING NEWS WALA',
  },
  description:
    'मध्य प्रदेश के सभी 55 जिलों, 10 संभागों और ग्रामीण अंचलों की ताज़ा ब्रेकिंग न्यूज़, वीडियो रिपोर्ट और निष्पक्ष हाइपरलोकल पत्रकारिता।',
  applicationName: 'BREAKING NEWS WALA',
  authors: [{ name: 'BREAKING NEWS WALA Editorial Desk' }],
  publisher: 'BREAKING NEWS WALA Media Network',
  keywords: [
    'मध्य प्रदेश समाचार',
    'MP Breaking News',
    'Bhopal News',
    'Indore News',
    'Niwari News',
    'ब्रेकिंग न्यूज़ वाला',
    'हाइपरलोकल न्यूज़',
    'Madhya Pradesh Hindi News',
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)',
    description: 'मध्य प्रदेश का सबसे तेज़ और विश्वसनीय हाइपरलोकल न्यूज़ नेटवर्क।',
    url: 'https://breakingnewswala.in',
    siteName: 'BREAKING NEWS WALA',
    locale: 'hi_IN',
    type: 'website',
    images: [
      {
        url: '/brand/logo.png',
        width: 600,
        height: 180,
        alt: 'BREAKING NEWS WALA लोगो',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)',
    description: 'मध्य प्रदेश का सबसे तेज़ और विश्वसनीय हाइपरलोकल न्यूज़ नेटवर्क।',
    images: ['/brand/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [categories, bulletins] = await Promise.all([
    fetchCategories(),
    fetchBreakingBulletins(),
  ]);

  return (
    <html lang="hi" dir="ltr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+Devanagari:wght@400;500;600;700;800&family=Rozha+One&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-white text-gray-900 font-sans antialiased selection:bg-[#FDE900] selection:text-black">
        {/* Accessibility Skip-to-Content Link */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-[#ED1727] focus:text-white focus:px-4 focus:py-2 focus:rounded focus:shadow-lg focus:outline-none"
        >
          मुख्य सामग्री पर जाएं (Skip to main content)
        </a>

        {/* Global Masthead & Navigation */}
        <Header categories={categories} bulletins={bulletins} />

        {/* Main Content Area */}
        <div id="main-content" className="flex-1 w-full">
          {children}
        </div>

        {/* Global Footer */}
        <Footer />

        {/* Mobile Bottom Sticky Ad Banner (Entitlement-Aware & ASCI Disclosed) */}
        <StickyBottomMobileBanner />
      </body>
    </html>
  );
}
