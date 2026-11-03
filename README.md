# BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला) — React Web Application

मध्य प्रदेश का सबसे तेज़ व विश्वसनीय डिजिटल न्यूज़ नेटवर्क — 55 जिले, ई-पेपर, लाइव ब्रेकिंग न्यूज़, AI संपादकीय सहायक एवं फील्ड रिपोर्टर डेस्क।

Rewritten as a modern, high-performance **React + TypeScript + Vite + Tailwind CSS** application preserving 100% of the core features and business logic from the original BREAKING NEWS WALA platform.

---

## 🌟 Core Features & Modules (मुख्य विशेषताएं)

### 1. Public News Portal (पाठक पोर्टल)
- **Live Breaking Ticker:** Real-time animated breaking news ticker with pulsing LIVE badge and district tags.
- **55 Districts of Madhya Pradesh:** Hyperlocal filtering across all 55 districts (Bhopal, Indore, Gwalior, Jabalpur, Ujjain, Sagar, Rewa, Niwari, etc.) categorized across 10 administrative divisions.
- **Category Taxonomies:** Browse news by canonical categories including Top News, Madhya Pradesh, Politics, Crime & Law, Agriculture & Mandi Bhav, Weather, Business & Jobs, and Viral.
- **Devanagari Typography:** Optimized font hierarchy with Google Fonts (Noto Sans Devanagari, Rozha One, Inter) protecting matra rendering.
- **Reading Controls & Accessibility:** Dynamic font scaling (A- / Standard / A+) with single-tap font size adjustment.
- **AI Hindi Audio Read-Aloud:** Browser Web Speech API text-to-speech audio reader ("खबर सुनें") in Hindi.
- **AI 3-Point Fast Summary:** Instant 3-bullet Devanagari summary focusing on public interest and Madhya Pradesh regional impact.
- **Gamified Reader Rewards:** Reader coins ledger (+5 coins awarded per article read) with live coin wallet balance.
- **Offline & Saved Bookmarks:** Save articles for quick access with dedicated bookmarks tab.
- **Social Sharing:** One-tap sharing via WhatsApp with formatted headline and link, plus native clipboard copy.

### 2. Field Reporter Desk (संवाददाता डेस्क)
- **Reporter Dashboard:** Live metrics tracking stories submitted, under review, published, and revisions requested. Trust Score pill (★ विश्वास स्कोर: 98%).
- **News Composer:** Draft stories with headline, summary, full story, category, ground photo URL, and MP district beat.
- **AI Field Assistant:** Translates raw field notes into publication-grade journalism with suggested headlines, lead paragraphs, and fact-checking guidance.
- **Field Voice Note Dictation:** Simulation of voice recording for stringers in rural MP.
- **10-Point Self-Verification Checklist:** Mandatory 4-step declaration ensuring authentic field sources, official remarks, verified media, and social harmony.
- **Submission History:** Real-time tracking with status badges (`PUBLISHED`, `PENDING_REVIEW`, `UNDER_REVIEW`, `REVISION_REQUESTED`).
- **Editorial Feedback:** Direct reviewer notes from the Chief Editor and Desk Editors.

### 3. Newsroom Editorial Desk (सेंट्रल न्यूज़रूम डेस्क)
- **Editorial Review Queue:** Review pending news stories submitted by district stringers and correspondents across MP.
- **10-Point Fact-Checking Protocol & AI Auditor:** Verification covering primary sources, administrative quotes, Devanagari grammar, communal harmony, and clickbait prevention with credibility score.
- **Editorial Publishing Actions:** Single-click "स्वीकृत करें व लाइव प्रकाशित करें" (Approve & Publish to live feeds), "संशोधन हेतु वापस भेजें" (Request Revision with comments), or "अस्वीकृत करें" (Reject).
- **Statewide Emergency Breaking Alert:** Modal broadcaster pushing notifications across MP via FCM topics simulation.

### 4. Digital E-Paper Reader (दैनिक ई-पेपर)
- **District Editions:** Daily print-layout broadsheet editions for Bhopal, Indore, Gwalior, Jabalpur, and Niwari.
- **Broadsheet Viewer:** Zoom in, zoom out, reset, and authentic newspaper header.
- **Page Navigator:** Previous / Next page controls with thumbnail strip for quick jumping.
- **PDF Download & Share:** Instant download notification and link sharing.

### 5. Profile & Grievance Redressal (प्रोफ़ाइल व सेटिंग्स)
- **Active Persona Switcher:** Reader, Field Reporter, and Newsroom Admin mode toggling.
- **Coin Wallet:** Balance tracker and Silver Reader level.
- **Notification Toggles:** Breaking news alerts, district alerts, quiet hours.
- **Statutory Grievance Redressal:** Indian IT Rules 2021 and DPDPA compliance officer contacts.

---

## 🛠️ Technology Stack

- **Framework:** React 19 + TypeScript + Vite 6
- **Styling:** Tailwind CSS v4 with Brand Tri-Color Palette (Red `#ED1727`, Yellow `#FDE900`, Blue `#344FD6`)
- **Icons:** Lucide React
- **Typography:** Noto Sans Devanagari + Inter
- **Port:** Dev server listening on port 3000 (`host 0.0.0.0`)

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```
