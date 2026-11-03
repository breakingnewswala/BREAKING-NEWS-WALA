# BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला) — Android Application

A high-performance, native Android application built with **Kotlin** and **Jetpack Compose** for **BREAKING NEWS WALA**, the premier digital news publishing and newsroom platform covering all 55 districts and 10 administrative divisions of Madhya Pradesh, India.

## Features

### 1. Public News Portal (पाठक पोर्टल)
- **Live Breaking Ticker:** Real-time breaking news updates with prominent visual cues.
- **55 Districts of Madhya Pradesh:** Hyperlocal filtering across all 55 districts (Bhopal, Indore, Gwalior, Jabalpur, Ujjain, Sagar, Rewa, Niwari, etc.).
- **Category Taxonomies:** Browse news by 21 canonical categories including Top News, Politics, Crime, Agriculture & Mandi Bhav, Weather, Business, and Viral.
- **Devanagari Typography:** Protected line-heights and matra clipping prevention for clear Hindi reading.
- **Reading Controls:** Dynamic font scaling (A- / Standard / A+) with single-tap font size adjustment.
- **Gamified Reader Rewards:** Reader coins ledger (+5 coins awarded per article read) with profile counter.
- **Offline Bookmarks:** Save articles for offline reading.
- **Native Social Sharing:** One-tap sharing via WhatsApp, Telegram, and standard Android share intents.

### 2. Field Reporter Desk (संवाददाता डेस्क)
- **Reporter Dashboard:** Live metrics tracking stories submitted, under review, published, and revisions requested.
- **News Composer:** Draft stories with headline, summary, full story, category, and MP district beat.
- **Self-Fact-Checking Attestation:** Reporter confirmation of factual integrity and source verification.
- **Submission History:** Real-time tracking with status badges (`PUBLISHED`, `PENDING_REVIEW`, `REVISION_REQUESTED`).
- **Editorial Feedback:** Direct reviewer notes from the Chief Editor and Desk Editors.

### 3. Newsroom Editorial Desk (न्यूज़रूम डेस्क)
- **Editorial Queue:** Review pending news stories submitted from field stringers and correspondents.
- **10-Point Fact-Checking Protocol:** Statutory checklist verifying primary source, photo/video forensics, geolocation, right of reply, legal defamation risks, and editorial approval.
- **AI Newsroom Assistant:** Headline optimizer, Devanagari grammar analyzer, and factual verification insights.
- **Publishing Actions:** Instant verified publishing to the live portal or revision requests with reviewer comments.

### 4. Digital E-Paper Reader (दैनिक ई-पेपर)
- **District Editions:** Daily print-layout digital editions for Bhopal, Indore, Gwalior, Jabalpur, and Niwari.
- **Page Navigator:** Seamless multi-page switching with Previous / Next controls.
- **PDF Download:** Direct offline download functionality.

## Architecture

- **Language:** 100% Kotlin
- **UI Framework:** Jetpack Compose with Material Design 3 (M3)
- **Design Tokens:** Brand Tri-color palette (Red `#ED1727`, Yellow `#FDE900`, Blue `#344FD6`, Midnight `#0F172A`)
- **Networking:** Retrofit + OkHttp with Kotlinx Serialization
- **Local Fallback:** Offline-first mock data repository ensuring smooth functioning even when remote API is unreachable
- **Media:** Coil image loader & Android PDF rendering
