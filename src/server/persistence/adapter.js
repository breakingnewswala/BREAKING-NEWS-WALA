/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Production Persistence Layer & Repository Adapter Architecture
 * Grounded in docs/11-Architecture.md, docs/12-Database.md, docs/13-API.md
 * Master Execution: BNW-004
 * 
 * Provides:
 * 1. IPersistenceAdapter contract
 * 2. AtomicJsonStorage with temp-write + rename, backup rotation, and corrupted file quarantine
 * 3. LocalJsonAdapter with concurrency serialization and editorial race-condition protection (409 Conflict)
 * 4. ProductionGuardAdapter strictly preventing silent local JSON fallbacks in production
 * 5. PrismaPostgresAdapter interface ready for production PostgreSQL connection
 * 6. getPersistenceAdapter() factory
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { INITIAL_AI_PROMPTS } from '../ai/defaultPrompts.js';
import {
  CANONICAL_SEED_PROVIDERS,
  INITIAL_NEWS_SOURCES,
  INITIAL_SOCIAL_ACCOUNTS,
  INITIAL_WHATSAPP_TEMPLATES,
  INITIAL_WHATSAPP_SUBSCRIBERS,
} from '../integrations/constants.js';
import {
  CANONICAL_SUBSCRIPTION_PLANS,
  CANONICAL_SEED_ADVERTISERS,
  CANONICAL_SEED_CAMPAIGNS,
} from '../monetization/constants.js';
import {
  CANONICAL_AUDIENCE_SEGMENTS,
} from '../audience/constants.js';
import {
  buildAllDistrictAndCategoryArticles,
  MP_55_DISTRICTS,
  MP_SEED_MANDI_RATES,
  MP_SEED_PENDING_STORIES,
  MP_SEED_REPORTERS,
} from '../../shared/mpHyperlocalSeed.js';
import { INITIAL_EPAPER_TEMPLATES } from './defaultEpaperTemplates.js';
import { validateTemplate, BROADSHEET_CONSTANTS as TEMPLATE_CONSTANTS } from '../epaper/templateValidator.js';
import { BroadsheetAdManager, ALL_SUPPORTED_SLOTS, BROADSHEET_RATE_CARDS } from '../monetization/epaperAds.js';
import { QualityCheckerEngine, QUALITY_SEVERITY } from '../epaper/qualityCheckerEngine.js';

export {
  INITIAL_AI_PROMPTS,
  CANONICAL_SEED_PROVIDERS,
  INITIAL_NEWS_SOURCES,
  INITIAL_SOCIAL_ACCOUNTS,
  INITIAL_WHATSAPP_TEMPLATES,
  INITIAL_WHATSAPP_SUBSCRIBERS,
  CANONICAL_SUBSCRIPTION_PLANS,
  CANONICAL_SEED_ADVERTISERS,
  CANONICAL_SEED_CAMPAIGNS,
  CANONICAL_AUDIENCE_SEGMENTS,
  INITIAL_EPAPER_TEMPLATES,
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../../.data');
const DEFAULT_STORE_FILE = path.join(DATA_DIR, 'bnw_persistence.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error('[Persistence] Failed to create data directory:', err.message);
  }
}

export function parseNormalizedTimestamp(val) {
  if (!val) return new Date().toISOString();
  if (typeof val === 'string') {
    if (val.includes('घंटे पहले')) {
      const hours = parseInt(val, 10) || 1;
      return new Date(Date.now() - hours * 3600 * 1000).toISOString();
    }
    if (val.includes('मिनट पहले')) {
      const mins = parseInt(val, 10) || 1;
      return new Date(Date.now() - mins * 60 * 1000).toISOString();
    }
    if (val.includes('दिन पहले')) {
      const days = parseInt(val, 10) || 1;
      return new Date(Date.now() - days * 86400 * 1000).toISOString();
    }
  }
  const time = new Date(val).getTime();
  if (Number.isNaN(time)) {
    return new Date().toISOString();
  }
  return new Date(val).toISOString();
}

// -------------------------------------------------------------
// CANONICAL SEED DATA DEFINITIONS
// -------------------------------------------------------------

export const INITIAL_CATEGORIES = [
  { id: 'cat-top', slug: 'top-news', nameHi: 'टॉप न्यूज़', nameEn: 'Top News', sortOrder: 1 },
  { id: 'cat-mp', slug: 'madhya-pradesh', nameHi: 'मध्य प्रदेश', nameEn: 'Madhya Pradesh', sortOrder: 2 },
  { id: 'cat-politics', slug: 'politics', nameHi: 'राजनीति', nameEn: 'Politics', sortOrder: 3 },
  { id: 'cat-crime', slug: 'crime', nameHi: 'क्राइम एवं कानून', nameEn: 'Crime & Law', sortOrder: 4 },
  { id: 'cat-agri', slug: 'agriculture', nameHi: 'कृषि एवं मंडी भाव', nameEn: 'Agriculture & Mandi', sortOrder: 5 },
  { id: 'cat-weather', slug: 'weather', nameHi: 'मौसम एवं पर्यावरण', nameEn: 'Weather', sortOrder: 6 },
  { id: 'cat-business', slug: 'business', nameHi: 'व्यापार एवं रोजगार', nameEn: 'Business & Jobs', sortOrder: 7 },
  { id: 'cat-viral', slug: 'viral', nameHi: 'वायरल खबरें', nameEn: 'Viral & Social', sortOrder: 8 },
  { id: 'cat-nat', slug: 'national', nameHi: 'देश', nameEn: 'National', sortOrder: 9 },
  { id: 'cat-world', slug: 'international', nameHi: 'विदेश', nameEn: 'International', sortOrder: 10 },
  { id: 'cat-sports', slug: 'sports', nameHi: 'खेल', nameEn: 'Sports', sortOrder: 11 },
  { id: 'cat-pol', slug: 'politics-legacy', nameHi: 'राजनीति', nameEn: 'Politics', sortOrder: 12 },
  { id: 'cat-gov', slug: 'governance', nameHi: 'शासन एवं नीतियां', nameEn: 'Governance', sortOrder: 13 },
  { id: 'cat-farm', slug: 'agriculture-legacy', nameHi: 'किसान व मंडी', nameEn: 'Agriculture & Mandi', sortOrder: 14 },
  { id: 'cat-dev', slug: 'development', nameHi: 'विकास व इंफ्रा', nameEn: 'Development', sortOrder: 15 },
  { id: 'cat-rel', slug: 'culture-religion', nameHi: 'धर्म व संस्कृति', nameEn: 'Culture & Religion', sortOrder: 16 },
];

export const INITIAL_DISTRICTS = MP_55_DISTRICTS;

export const INITIAL_REPORTERS = MP_SEED_REPORTERS;

export const INITIAL_ARTICLES = [
  {
    id: 'art-001',
    slug: 'mp-budget-session-farmers-bonus-announced',
    title: 'मध्य प्रदेश विधानसभा: गेहूं पर ₹125 अतिरिक्त बोनस की घोषणा, किसानों के खातों में डीबीटी से पहुंचेगी राशि',
    summary: 'विधानसभा में कृषि मंत्री ने प्रदेश के 45 लाख पंजीकृत किसानों के लिए महत्वपूर्ण घोषणा की। समर्थन मूल्य के अतिरिक्त 125 रुपये प्रति क्विंटल प्रोत्साहन राशि सीधे बैंक खाते में जमा होगी।',
    content: 'भोपाल। मध्य प्रदेश विधानसभा के बजट सत्र के तीसरे दिन राज्य सरकार ने प्रदेश के किसानों के लिए ऐतिहासिक निर्णय लेते हुए रबी विपणन वर्ष 2026-27 के लिए गेहूं उपार्जन पर ₹125 प्रति क्विंटल अतिरिक्त बोनस की घोषणा की है। कृषि मंत्री ने सदन में वक्तव्य देते हुए बताया कि मुख्यमंत्री किसान कल्याण योजना एवं उपार्जन नीति के तहत यह राशि सीधे प्रत्यक्ष लाभ अंतरण (DBT) के माध्यम से किसानों के आधार-लिंक्ड बैंक खातों में स्थानांतरित की जाएगी।\n\nप्रदेश भर में 3,800 से अधिक प्राथमिक कृषि साख सहकारी समितियों (पैक्स) और उपार्जन केंद्रों पर 15 मार्च से ऑनलाइन स्लॉट बुकिंग प्रारंभ होगी। खाद्य एवं नागरिक आपूर्ति विभाग ने स्पष्ट किया है कि बायोमेट्रिक ई-केवाईसी सत्यापन के उपरांत ही तौल पर्ची जारी की जाएगी। इस योजना से राज्य के राजकोष पर लगभग ₹1,850 करोड़ का अतिरिक्त वित्तीय भार आएगा, जिसका विधिवत बजटीय प्रावधान अनुपूरक मांगों में कर लिया गया है।',
    status: 'PUBLISHED',
    featuredImage: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1200&auto=format&fit=crop&q=80',
    imageCaption: 'भोपाल विधानसभा में बजट सत्र के दौरान नीतिगत घोषणा करते कृषि मंत्री।',
    imageAttribution: 'बीएनडब्ल्यू विशेष संवाददाता / विधानसभा प्रेस दीर्घा',
    categoryId: 'cat-farm',
    categoryName: 'किसान व मंडी',
    districtId: 'dist-bhopal',
    districtName: 'भोपाल',
    authorId: 'rep-001',
    authorName: 'राजेश पटेल',
    authorRole: 'वरिष्ठ संवाददाता',
    isBreaking: true,
    viewCount: 14250,
    shareCount: 1840,
    createdAt: '2026-11-04T09:30:00.000Z',
    publishedAt: '2026-11-04T10:00:00.000Z',
    factChecked: true,
    factCheckScore: 98,
    tags: ['किसान', 'गेहूं बोनस', 'भोपाल', 'विधानसभा', 'कृषि'],
  },
  {
    id: 'art-002',
    slug: 'indore-metro-super-corridor-trial-run',
    title: 'इंदौर मेट्रो: सुपर कॉरिडोर से गांधी नगर स्टेशन तक स्पीड ट्रायल सफल, जून से नियमित यात्री सेवा की तैयारी',
    summary: 'इंदौर में येलो लाइन के प्रायोरिटी कॉरिडोर पर मेट्रो का 80 किमी प्रति घंटे की रफ्तार से ट्रायल रन पूर्ण। संरक्षा आयुक्त के अंतिम निरीक्षण के बाद आम नागरिकों के लिए शुरू होगी सेवा।',
    content: 'इंदौर। स्वच्छता में देश में नंबर-1 शहर इंदौर ने सार्वजनिक परिवहन क्रांति की ओर एक और निर्णायक कदम बढ़ा दिया है। मध्य प्रदेश मेट्रो रेल कॉर्पोरेशन लिमिटेड (MPMRCL) ने गुरुवार को इंदौर मेट्रो के सुपर कॉरिडोर स्थित डिपो से गांधी नगर स्टेशन के बीच 80 किमी प्रति घंटे की अधिकतम स्वीकृत गति से फुल-लोड स्पीड ट्रायल रन सफलतापूर्वक पूरा कर लिया।\n\nमेट्रो कमिश्नर फॉर मेट्रो रेल सेफ्टी (CMRS) द्वारा आगामी सप्ताह में ट्रैक, सिग्नैलिंग, ओवरहेड इलेक्ट्रिफिकेशन (OHE) और स्वचालित ट्रेन नियंत्रण प्रणाली का अंतिम तकनीकी ऑडिट किया जाएगा। 5.9 किलोमीटर लंबे इस प्राथमिकता वाले हिस्से पर 5 विश्वस्तरीय स्टेशन निर्मित किए गए हैं, जहां यात्रियों के लिए टिकट वेंडिंग मशीन, स्वचालित फेयर कलेक्शन गेट और दिव्यांग-अनुकूल एलीवेटर की सुविधाएं पूरी हो चुकी हैं।',
    status: 'PUBLISHED',
    featuredImage: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=1200&auto=format&fit=crop&q=80',
    imageCaption: 'इंदौर सुपर कॉरिडोर पर सफल ट्रायल रन करती येलो लाइन मेट्रो ट्रेन।',
    imageAttribution: 'बीएनडब्ल्यू इंदौर ब्यूरो',
    categoryId: 'cat-dev',
    categoryName: 'विकास व इंफ्रा',
    districtId: 'dist-indore',
    districtName: 'इंदौर',
    authorId: 'rep-002',
    authorName: 'सुनीता शर्मा',
    authorRole: 'वरिष्ठ संवाददाता',
    isBreaking: false,
    viewCount: 9820,
    shareCount: 890,
    createdAt: '2026-11-04T11:15:00.000Z',
    publishedAt: '2026-11-04T11:45:00.000Z',
    factChecked: true,
    factCheckScore: 96,
    tags: ['इंदौर', 'मेट्रो', 'सुपर कॉरिडोर', 'विकास'],
  },
  {
    id: 'art-003',
    slug: 'ujjain-mahakal-corridor-new-crowd-management',
    title: 'उज्जैन महाकाल मंदिर: महाशिवरात्रि पर्व पर 15 लाख श्रद्धालुओं हेतु 3-स्तरीय दर्शन व्यवस्था लागू',
    summary: 'श्री महाकालेश्वर प्रबंध समिति ने त्रिवेणी संग्रहालय से नंदी हॉल तक नई जिग-जैग बैरिकेडिंग व एयर-कूल्ड होल्डिंग एरिया स्थापित किया।',
    content: 'उज्जैन। विश्व प्रसिद्ध ज्योतिर्लिंग भगवान श्री महाकालेश्वर मंदिर में महाशिवरात्रि महापर्व 2026 के उपलक्ष्य में जिला प्रशासन एवं मंदिर प्रबंध समिति ने दर्शनार्थियों की अभूतपूर्व भीड़ के दृष्टिगत व्यापक सुगम दर्शन योजना लागू की है।\n\nकलेक्टर एवं मंदिर प्रबंध समिति अध्यक्ष ने बताया कि सामान्य दर्शनार्थियों को त्रिवेणी संग्रहालय से चारधाम मंदिर होकर नंदी द्वार से श्री महाकाल लोक होते हुए मानसरोवर भवन के माध्यम से प्रवेश दिया जाएगा। इस मार्ग पर 10 पेयजल कियोस्क, मेडिकल पोस्ट और निरंतर उद्घोषणा प्रणाली स्थापित की गई है।',
    status: 'PUBLISHED',
    featuredImage: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=1200&auto=format&fit=crop&q=80',
    imageCaption: 'महाकाल लोक परिसर में दर्शन व्यवस्थाओं का निरीक्षण करते अधिकारी।',
    imageAttribution: 'बीएनडब्ल्यू उज्जैन संभाग ब्यूरो',
    categoryId: 'cat-rel',
    categoryName: 'धर्म व संस्कृति',
    districtId: 'dist-ujjain',
    districtName: 'उज्जैन',
    authorId: 'rep-002',
    authorName: 'सुनीता शर्मा',
    authorRole: 'वरिष्ठ संवाददाता',
    isBreaking: false,
    viewCount: 16500,
    shareCount: 2450,
    createdAt: '2026-11-04T12:00:00.000Z',
    publishedAt: '2026-11-04T12:30:00.000Z',
    factChecked: true,
    factCheckScore: 99,
    tags: ['उज्जैन', 'महाकाल', 'महाशिवरात्रि', 'धर्म'],
  },
];

export const INITIAL_PENDING_STORIES = [
  {
    id: 'art-pending-101',
    slug: 'gwalior-fort-light-sound-show-upgrade',
    title: 'ग्वालियर किला: लाइट एंड साउंड शो का अत्याधुनिक 4K 3D प्रोजेक्शन मैपिंग के साथ पुनरुद्धार',
    summary: 'पर्यटन विकास निगम ने ऐतिहासिक मान मंदिर महल पर नए लेजर शो का ट्रायल किया, अगले माह से आम पर्यटकों के लिए होगा शुरू।',
    content: 'ग्वालियर। विश्वविख्यात ग्वालियर दुर्ग की ऐतिहासिक दीवारों पर अब सदियों पुराना इतिहास अत्याधुनिक 4K 3D लेजर प्रोजेक्शन मैपिंग तकनीक से जीवंत होगा। पर्यटन विभाग द्वारा ₹12 करोड़ की लागत से तैयार मान मंदिर पैलेस के नवीन लाइट एंड साउंड शो का पहला तकनीकी ट्रायल सफल रहा।',
    status: 'PENDING_REVIEW',
    featuredImage: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=1200&auto=format&fit=crop&q=80',
    imageCaption: 'ग्वालियर दुर्ग पर लेजर शो का ट्रायल रन।',
    imageAttribution: 'बीएनडब्ल्यू संवाददाता अमित वर्मा',
    categoryId: 'cat-dev',
    categoryName: 'विकास व इंफ्रा',
    districtId: 'dist-gwalior',
    districtName: 'ग्वालियर',
    authorId: 'rep-003',
    authorName: 'अमित वर्मा',
    authorRole: 'फील्ड संवाददाता',
    isBreaking: false,
    viewCount: 0,
    shareCount: 0,
    createdAt: '2026-11-04T14:10:00.000Z',
    factChecked: false,
    tags: ['ग्वालियर', 'पर्यटन', 'किला'],
  },
  {
    id: 'art-pending-102',
    slug: 'rewa-solar-park-expansion-phase-two',
    title: 'रीवा अल्ट्रा मेगा सोलर प्लांट: 250 मेगावाट की दूसरी इकाई का ग्रिड सिंक्रोनाइजेशन पूर्ण',
    summary: 'गुढ़ तहसील स्थित एशिया के बड़े सौर ऊर्जा संयंत्र से दिल्ली मेट्रो और मध्य प्रदेश पावर ट्रांसमिशन को अतिरिक्त हरित ऊर्जा की आपूर्ति शुरू।',
    content: 'रीवा। रीवा जिले के गुढ़ स्थित 750 मेगावाट क्षमता वाले प्रतिष्ठित रीवा अल्ट्रा मेगा सोलर पार्क (RUMSL) के फेज-2 विस्तार का ग्रिड सिंक्रोनाइजेशन पावरग्रिड कॉर्पोरेशन के 400 केवी सब-स्टेशन के साथ सफलतापूर्वक पूरा कर लिया गया है।',
    status: 'PENDING_REVIEW',
    featuredImage: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=1200&auto=format&fit=crop&q=80',
    imageCaption: 'रीवा सोलर प्लांट में फोटोवोल्टिक पैनल्स का निरीक्षण।',
    imageAttribution: 'बीएनडब्ल्यू रीवा ब्यूरो',
    categoryId: 'cat-dev',
    categoryName: 'विकास व इंफ्रा',
    districtId: 'dist-rewa',
    districtName: 'रीवा',
    authorId: 'rep-004',
    authorName: 'विक्रम सिंह',
    authorRole: 'फील्ड संवाददाता',
    isBreaking: false,
    viewCount: 0,
    shareCount: 0,
    createdAt: '2026-11-04T15:20:00.000Z',
    factChecked: false,
    tags: ['रीवा', 'सौर ऊर्जा', 'विकास'],
  },
];

export const INITIAL_TICKERS = [
  { id: 'tick-01', textHindi: 'विधानसभा में गेहूं उपार्जन पर ₹125 प्रति क्विंटल अतिरिक्त बोनस की ऐतिहासिक घोषणा।', districtName: 'भोपाल', priority: 'critical', isActive: true, createdAt: '2026-11-04T10:00:00.000Z' },
  { id: 'tick-02', textHindi: 'इंदौर मेट्रो: सुपर कॉरिडोर से गांधी नगर स्टेशन के बीच 80 किमी/घंटे स्पीड ट्रायल सफल।', districtName: 'इंदौर', priority: 'normal', isActive: true, createdAt: '2026-11-04T11:45:00.000Z' },
  { id: 'tick-03', textHindi: 'उज्जैन महाकाल मंदिर: महाशिवरात्रि पर 15 लाख श्रद्धालुओं के सुगम दर्शन हेतु त्रि-स्तरीय सुरक्षा व्यवस्था।', districtName: 'उज्जैन', priority: 'normal', isActive: true, createdAt: '2026-11-04T12:30:00.000Z' },
];

export const INITIAL_ADS = [
  { id: 'ad-01', placement: 'top_leaderboard', title: 'मध्य प्रदेश पर्यटन — हिंदुस्तान का दिल देखो (पचमढ़ी, कान्हा व ओरछा सफारी)', imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80', targetUrl: 'https://www.mptourism.com', advertiserName: 'मप्र पर्यटन विकास निगम', isActive: true, impressionsCount: 1842, clicksCount: 129 },
  { id: 'ad-02', placement: 'in_feed', title: 'मध्य प्रदेश हस्तशिल्प: चंदेरी व महेश्वरी हैंडलूम वस्त्रों पर 30% तक की छूट', imageUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&auto=format&fit=crop&q=80', targetUrl: 'https://khadi.mp.gov.in', advertiserName: 'मप्र खादी एवं ग्रामोद्योग बोर्ड', isActive: true, impressionsCount: 1410, clicksCount: 94 },
  { id: 'ad-03', placement: 'sidebar', title: 'सांची दुग्ध संघ — शुद्ध घी, पनीर और दुग्ध उत्पाद अब हर ज़िले में उपलब्ध', imageUrl: 'https://images.unsplash.com/photo-1527153857715-3908f2ae5e81?w=600&auto=format&fit=crop&q=80', targetUrl: 'https://sanchidairy.com', advertiserName: 'सांची दुग्ध संघ', isActive: true, impressionsCount: 1190, clicksCount: 78 },
];

export const INITIAL_USERS = [
  { id: 'usr-master-1', identifier: 'master_admin', fullName: 'मास्टर एडमिन (BNW Live)', email: 'live.bnwtv@gmail.com', phoneNumber: '+919800000000', roles: ['MASTER_ADMIN', 'SUPER_ADMIN', 'ADMIN', 'CHIEF_EDITOR', 'EDITOR', 'REPORTER', 'READER'], badgeNumber: 'BNW-MA-001', passwordHash: '$argon2id$v=19$m=65536,t=3,p=1$M8c5YD5Xe48JKvpnM3kdAg$mxpNsuwzww6FWqXJAR5RZcSgvyGOwLS/AaDzw9OG0fI' },
  { id: 'usr-admin-1', identifier: 'admin', fullName: 'प्रधान संपादक / सिस्टम एडमिनिस्ट्रेटर', email: 'admin@breakingnewswala.com', phoneNumber: '+919800000001', roles: ['ADMIN', 'EDITOR', 'SUPER_ADMIN'], passwordHash: '$argon2id$v=19$m=65536,t=3,p=1$M8c5YD5Xe48JKvpnM3kdAg$mxpNsuwzww6FWqXJAR5RZcSgvyGOwLS/AaDzw9OG0fI' },
  { id: 'usr-editor-1', identifier: 'editor', fullName: 'दिनेश अग्निहोत्री (डेस्क संपादक)', email: 'editor@breakingnewswala.com', phoneNumber: '+919800000002', roles: ['EDITOR'], passwordHash: '$argon2id$v=19$m=65536,t=3,p=1$M8c5YD5Xe48JKvpnM3kdAg$mxpNsuwzww6FWqXJAR5RZcSgvyGOwLS/AaDzw9OG0fI' },
  { id: 'usr-editor-2', identifier: 'editor_two', fullName: 'समीक्षक संपादक (डेस्क 2)', email: 'editor2@breakingnewswala.com', phoneNumber: '+919800000003', roles: ['EDITOR'], passwordHash: '$argon2id$v=19$m=65536,t=3,p=1$M8c5YD5Xe48JKvpnM3kdAg$mxpNsuwzww6FWqXJAR5RZcSgvyGOwLS/AaDzw9OG0fI' },
  { id: 'usr-rep-1', identifier: 'rep_bhopal', fullName: 'राजेश पटेल (भोपाल ब्यूरो)', email: 'rajesh.patel@breakingnewswala.com', phoneNumber: '+919826011223', roles: ['REPORTER'], badgeNumber: 'BNW-REP-0101', passwordHash: '$argon2id$v=19$m=65536,t=3,p=1$M8c5YD5Xe48JKvpnM3kdAg$mxpNsuwzww6FWqXJAR5RZcSgvyGOwLS/AaDzw9OG0fI' },
  { id: 'usr-rep-2', identifier: 'rep_indore', fullName: 'सुनीता शर्मा (इंदौर ब्यूरो)', email: 'sunita.sharma@breakingnewswala.com', phoneNumber: '+919425088771', roles: ['REPORTER'], badgeNumber: 'BNW-REP-0102', passwordHash: '$argon2id$v=19$m=65536,t=3,p=1$M8c5YD5Xe48JKvpnM3kdAg$mxpNsuwzww6FWqXJAR5RZcSgvyGOwLS/AaDzw9OG0fI' },
];

export const INITIAL_AUDIT_LOGS = [
  { id: 'log-01', actorName: 'दिनेश अग्निहोत्री', actorRole: 'EDITOR', actionType: 'ARTICLE_PUBLISHED', description: 'लेख प्रकाशित किया: "मध्य प्रदेश विधानसभा: गेहूं पर ₹125 अतिरिक्त बोनस..."', ipAddress: '103.21.124.5', timestamp: '2026-11-04 10:00:15' },
  { id: 'log-02', actorName: 'सिस्टम ऑटोमेशन', actorRole: 'SYSTEM', actionType: 'TICKER_UPDATED', description: 'ब्रेकिंग टिकर सक्रिय किया: इंदौर मेट्रो स्पीड ट्रायल', ipAddress: '127.0.0.1', timestamp: '2026-11-04 11:45:00' },
  { id: 'log-03', actorName: 'राजेश पटेल', actorRole: 'REPORTER', actionType: 'USER_VERIFIED', description: 'संवाददाता डिजिटल प्रेस आईडी सत्यापन (QR स्कैन)', ipAddress: '49.36.128.91', timestamp: '2026-11-04 13:20:10' },
];

export const INITIAL_GRAPHIC_TEMPLATES = [
  {
    id: 'tpl-breaking-01',
    title: 'ब्रेकिंग न्यूज़ प्रीमियम कार्ड (Breaking News Card)',
    slug: 'breaking-news-premium',
    category: 'BREAKING',
    aspectRatio: '4:5',
    width: 1080,
    height: 1350,
    themeColor: '#ED1727',
    backgroundStyle: 'gradient-red',
    backgroundColor: '#0F172A',
    isDefault: true,
    isActive: true,
    allowedRoles: ['ADMIN', 'EDITOR', 'REPORTER'],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'tpl-politics-01',
    title: 'राजनीतिक हलचल व विधानसभा कार्ड (Political News)',
    slug: 'political-news-card',
    category: 'POLITICS',
    aspectRatio: '4:5',
    width: 1080,
    height: 1350,
    themeColor: '#EA580C',
    backgroundStyle: 'dark-charcoal',
    backgroundColor: '#0F172A',
    isDefault: false,
    isActive: true,
    allowedRoles: ['ADMIN', 'EDITOR', 'REPORTER'],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'tpl-crime-01',
    title: 'क्राइम एवं कानून व्यवस्था (Crime & Police Action)',
    slug: 'crime-police-action',
    category: 'CRIME',
    aspectRatio: '4:5',
    width: 1080,
    height: 1350,
    themeColor: '#DC2626',
    backgroundStyle: 'dark-charcoal',
    backgroundColor: '#090D16',
    isDefault: false,
    isActive: true,
    allowedRoles: ['ADMIN', 'EDITOR', 'REPORTER'],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'tpl-governance-01',
    title: 'शासकीय योजना एवं जनकल्याण (Govt Schemes & Policy)',
    slug: 'governance-schemes-card',
    category: 'GOVERNMENT',
    aspectRatio: '4:5',
    width: 1080,
    height: 1350,
    themeColor: '#2563EB',
    backgroundStyle: 'navy-blue',
    backgroundColor: '#0A192F',
    isDefault: false,
    isActive: true,
    allowedRoles: ['ADMIN', 'EDITOR', 'REPORTER'],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'tpl-education-01',
    title: 'शिक्षा व रोजगार समाचार (Education & Job Alerts)',
    slug: 'education-jobs-square',
    category: 'EDUCATION',
    aspectRatio: '1:1',
    width: 1080,
    height: 1080,
    themeColor: '#059669',
    backgroundStyle: 'dark-charcoal',
    backgroundColor: '#064E3B',
    isDefault: false,
    isActive: true,
    allowedRoles: ['ADMIN', 'EDITOR', 'REPORTER'],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'tpl-sports-01',
    title: 'खेल जगत व खिलाड़ी (Sports News Square)',
    slug: 'sports-news-square',
    category: 'SPORTS',
    aspectRatio: '1:1',
    width: 1080,
    height: 1080,
    themeColor: '#D97706',
    backgroundStyle: 'gradient-red',
    backgroundColor: '#1E293B',
    isDefault: false,
    isActive: true,
    allowedRoles: ['ADMIN', 'EDITOR', 'REPORTER'],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'tpl-business-01',
    title: 'व्यापार एवं मंडी भाव (Business & Mandi Bhav)',
    slug: 'business-mandi-bhav',
    category: 'BUSINESS',
    aspectRatio: '1:1',
    width: 1080,
    height: 1080,
    themeColor: '#2563EB',
    backgroundStyle: 'navy-blue',
    backgroundColor: '#0F172A',
    isDefault: false,
    isActive: true,
    allowedRoles: ['ADMIN', 'EDITOR', 'REPORTER'],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'tpl-district-01',
    title: 'जिला विशेष ग्राउंड रिपोर्ट (District Special)',
    slug: 'district-ground-report',
    category: 'DISTRICT',
    aspectRatio: '3:4',
    width: 1080,
    height: 1440,
    themeColor: '#7C3AED',
    backgroundStyle: 'dark-charcoal',
    backgroundColor: '#1E1B4B',
    isDefault: false,
    isActive: true,
    allowedRoles: ['ADMIN', 'EDITOR', 'REPORTER'],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'tpl-weather-01',
    title: 'मौसम चेतावनी व अलर्ट (Weather Story 9:16)',
    slug: 'weather-story-alert',
    category: 'WEATHER',
    aspectRatio: '9:16',
    width: 1080,
    height: 1920,
    themeColor: '#0284C7',
    backgroundStyle: 'navy-blue',
    backgroundColor: '#075985',
    isDefault: false,
    isActive: true,
    allowedRoles: ['ADMIN', 'EDITOR', 'REPORTER'],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'tpl-festival-01',
    title: 'पर्व एवं त्यौहार शुभकामनाएं (Festival Wishes)',
    slug: 'festival-wishes-square',
    category: 'FESTIVAL',
    aspectRatio: '1:1',
    width: 1080,
    height: 1080,
    themeColor: '#E11D48',
    backgroundStyle: 'gradient-red',
    backgroundColor: '#881337',
    isDefault: false,
    isActive: true,
    allowedRoles: ['ADMIN', 'EDITOR', 'REPORTER'],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'tpl-special-01',
    title: 'विशेष अन्वेषण व जांच रिपोर्ट (Special Report 16:9)',
    slug: 'special-investigation-landscape',
    category: 'SPECIAL',
    aspectRatio: '16:9',
    width: 1920,
    height: 1080,
    themeColor: '#B91C1C',
    backgroundStyle: 'dark-charcoal',
    backgroundColor: '#0F172A',
    isDefault: false,
    isActive: true,
    allowedRoles: ['ADMIN', 'EDITOR'],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

export const INITIAL_VIDEO_TEMPLATES = [
  {
    id: 'tpl-vid-breaking-01',
    title: 'ब्रेकिंग न्यूज़ फ़्लैश रील (9:16)',
    description: '30-सेकंड का त्वरित मोबाइल रील/शॉर्ट्स फॉर्मेट। तीव्र लाल अलर्ट, ब्रेकिंग टिकर एवं आउट्रो स्टिंग।',
    category: 'BREAKING',
    aspectRatio: '9:16',
    defaultDurationSec: 30,
    themeColor: '#ED1727',
    isDefault: true,
    isActive: true,
    allowedRoles: ['ADMIN', 'EDITOR', 'REPORTER'],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    scenes: [
      {
        id: 'scn-brk-1',
        title: 'ओपनिंग अलर्ट',
        order: 0,
        durationSec: 5,
        backgroundStyle: 'gradient-red',
        headline: 'बड़ी खबर: मध्य प्रदेश से इस वक्त की सबसे बड़ी खबर',
        subtext: 'ताज़ा घटनाक्रम पर सीधे ग्राउंड ज़ीरो से रिपोर्ट',
        lowerThird: 'ब्रेकिंग न्यूज़ अलर्ट | विशेष बुलेटिन',
        district: 'मध्य प्रदेश',
        category: 'ब्रेकिंग न्यूज़',
        showLogo: true,
        showTicker: true,
        transition: 'cut',
      },
      {
        id: 'scn-brk-2',
        title: 'मुख्य घटना विवरण',
        order: 1,
        durationSec: 15,
        backgroundStyle: 'dark-charcoal',
        imageUrl: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200&auto=format&fit=crop&q=80',
        headline: 'प्रशासनिक अधिकारियों की आपात बैठक, दिए गए सख्त निर्देश',
        subtext: 'संबंधित विभाग ने रिपोर्ट मांगी, मौके पर वरिष्ठ अधिकारी तैनात',
        lowerThird: 'सीधी रिपोर्ट | ग्राउंड ज़ीरो',
        district: 'भोपाल',
        category: 'प्रशासन',
        showLogo: true,
        showTicker: true,
        transition: 'slide-left',
      },
      {
        id: 'scn-brk-3',
        title: 'निष्कर्ष व आउट्रो',
        order: 2,
        durationSec: 10,
        backgroundStyle: 'navy-blue',
        headline: 'पल-पल की ताज़ा अपडेट के लिए बने रहें ब्रेकिंग न्यूज़ वाला के साथ',
        subtext: 'breakingnewswala.com पर पढ़ें पूरी खबर',
        lowerThird: 'विश्वसनीय व निष्पक्ष पत्रकारिता',
        district: 'मध्य प्रदेश',
        category: 'चैनल संदेश',
        showLogo: true,
        showTicker: false,
        transition: 'fade',
      },
    ],
  },
  {
    id: 'tpl-vid-politics-01',
    title: 'राजनीतिक हलचल व विधानसभा बुलेटिन (16:9)',
    description: 'यूट्यूब एवं वेब पोर्टल हेतु विस्तृत 16:9 लैंडस्केप वीडियो रिपोर्ट।',
    category: 'POLITICS',
    aspectRatio: '16:9',
    defaultDurationSec: 45,
    themeColor: '#EA580C',
    isDefault: false,
    isActive: true,
    allowedRoles: ['ADMIN', 'EDITOR', 'REPORTER'],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    scenes: [
      {
        id: 'scn-pol-1',
        title: 'राजनीतिक शीर्षक',
        order: 0,
        durationSec: 10,
        backgroundStyle: 'dark-charcoal',
        imageUrl: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1200&auto=format&fit=crop&q=80',
        headline: 'मध्य प्रदेश: विधानसभा सत्र को लेकर सियासी सरगर्मियां तेज़',
        subtext: 'पक्ष और विपक्ष की बैठकों का दौर जारी, रणनीतियों पर मंथन',
        lowerThird: 'सियासत का संग्राम | भोपाल',
        district: 'भोपाल',
        category: 'राजनीति',
        showLogo: true,
        showTicker: true,
        transition: 'fade',
      },
      {
        id: 'scn-pol-2',
        title: 'नेताओं के बयान व विश्लेषण',
        order: 1,
        durationSec: 25,
        backgroundStyle: 'navy-blue',
        headline: 'विधायकों के सवालों के जवाब हेतु विभागों ने कसी कमर',
        subtext: 'बजट प्रावधानों एवं जनहित के मुद्दों पर होगी गर्मागर्म बहस',
        lowerThird: 'विधानसभा विशेष कवरेज',
        district: 'मध्य प्रदेश',
        category: 'राजनीति',
        showLogo: true,
        showTicker: true,
        transition: 'slide-left',
      },
      {
        id: 'scn-pol-3',
        title: 'आउट्रो व विश्लेषण',
        order: 2,
        durationSec: 10,
        backgroundStyle: 'dark-charcoal',
        headline: 'राजनीतिक विश्लेषण के लिए चैनल सब्सक्राइब करें',
        subtext: 'ब्रेकिंग न्यूज़ वाला — निष्पक्ष आवाज़',
        lowerThird: 'breakingnewswala.com',
        district: 'मध्य प्रदेश',
        category: 'विशेष रिपोर्ट',
        showLogo: true,
        showTicker: false,
        transition: 'fade',
      },
    ],
  },
  {
    id: 'tpl-vid-crime-01',
    title: 'क्राइम एवं कानून व्यवस्था अलर्ट (4:5)',
    description: 'सोशल मीडिया फीड के लिए डार्क क्रिमसन थीम वाला क्राइम रिपोर्ट फॉर्मेट।',
    category: 'CRIME',
    aspectRatio: '4:5',
    defaultDurationSec: 30,
    themeColor: '#DC2626',
    isDefault: false,
    isActive: true,
    allowedRoles: ['ADMIN', 'EDITOR', 'REPORTER'],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    scenes: [
      {
        id: 'scn-crm-1',
        title: 'वारदात का विवरण',
        order: 0,
        durationSec: 12,
        backgroundStyle: 'dark-charcoal',
        imageUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1200&auto=format&fit=crop&q=80',
        headline: 'बड़ी कार्रवाई: पुलिस टीम ने अंतरराज्यीय गिरोह का किया पर्दाफाश',
        subtext: 'लाखों का मशरूका बरामद, मुख्य आरोपी पुलिस गिरफ्त में',
        lowerThird: 'क्राइम फाइल | पुलिस कार्रवाई',
        district: 'इंदौर',
        category: 'अपराध व कानून',
        showLogo: true,
        showTicker: true,
        transition: 'cut',
      },
      {
        id: 'scn-crm-2',
        title: 'दिशा-निर्देश व सुरक्षा',
        order: 1,
        durationSec: 18,
        backgroundStyle: 'gradient-red',
        headline: 'शहर में रात्रि गश्त और सुरक्षा चेकिंग बढ़ाने के निर्देश',
        subtext: 'नागरिकों से संदिग्ध गतिविधियों की तत्काल सूचना देने की अपील',
        lowerThird: 'सुरक्षा अलर्ट | जनहित में जारी',
        district: 'इंदौर',
        category: 'अपराध व कानून',
        showLogo: true,
        showTicker: true,
        transition: 'fade',
      },
    ],
  },
  {
    id: 'tpl-vid-government-01',
    title: 'सरकारी योजना एवं जनहित बुलेटिन (16:9)',
    description: 'कल्याणकारी योजनाओं, कैबिनेट निर्णयों और जनहितैषी घोषणाओं का स्पष्ट विवरण।',
    category: 'GOVERNMENT',
    aspectRatio: '16:9',
    defaultDurationSec: 40,
    themeColor: '#2563EB',
    isDefault: false,
    isActive: true,
    allowedRoles: ['ADMIN', 'EDITOR', 'REPORTER'],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    scenes: [
      {
        id: 'scn-gov-1',
        title: 'योजना की घोषणा',
        order: 0,
        durationSec: 15,
        backgroundStyle: 'navy-blue',
        headline: 'कैबिनेट का बड़ा फैसला: युवाओं व किसानों के लिए नई कल्याणकारी योजना',
        subtext: 'पात्र हितग्राहियों को मिलेगा सीधा लाभ, आवेदन प्रक्रिया प्रारंभ',
        lowerThird: 'शासकीय निर्णय | मध्य प्रदेश',
        district: 'भोपाल',
        category: 'सरकारी योजनाएं',
        showLogo: true,
        showTicker: true,
        transition: 'fade',
      },
      {
        id: 'scn-gov-2',
        title: 'पात्रता व प्रक्रिया',
        order: 1,
        durationSec: 25,
        backgroundStyle: 'dark-charcoal',
        headline: 'आधिकारिक पोर्टल पर ऑनलाइन आवेदन की सुविधा, जानें आवश्यक दस्तावेज',
        subtext: 'विभागीय नोडल अधिकारी तैनात, प्रत्येक ब्लॉक में लगेंगे शिविर',
        lowerThird: 'जनहित जानकारी | विशेष प्रस्तुति',
        district: 'मध्य प्रदेश',
        category: 'सरकारी योजनाएं',
        showLogo: true,
        showTicker: false,
        transition: 'slide-left',
      },
    ],
  },
  {
    id: 'tpl-vid-district-01',
    title: 'जिला विशेष ग्राउंड रिपोर्ट (3:4)',
    description: '55 जिलों की ज़मीनी समस्याओं और स्थानीय विकास कार्यों की वीडियो रिपोर्ट।',
    category: 'DISTRICT',
    aspectRatio: '3:4',
    defaultDurationSec: 35,
    themeColor: '#7C3AED',
    isDefault: false,
    isActive: true,
    allowedRoles: ['ADMIN', 'EDITOR', 'REPORTER'],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    scenes: [
      {
        id: 'scn-dst-1',
        title: 'स्थानीय समस्या',
        order: 0,
        durationSec: 15,
        backgroundStyle: 'dark-charcoal',
        headline: 'जिला ग्राउंड ज़ीरो: पुल निर्माण में देरी से 15 गांवों का संपर्क बाधित',
        subtext: 'ग्रामीणों ने जिला प्रशासन को सौंपा ज्ञापन, तत्काल कार्य शुरू करने की मांग',
        lowerThird: 'जनता की आवाज़ | ग्राउंड रिपोर्ट',
        district: 'जबलपुर',
        category: 'जिला हलचल',
        showLogo: true,
        showTicker: true,
        transition: 'fade',
      },
      {
        id: 'scn-dst-2',
        title: 'प्रशासनिक संज्ञान',
        order: 1,
        durationSec: 20,
        backgroundStyle: 'navy-blue',
        headline: 'कलेक्टर ने निर्माण एजेंसी को दिया 30 दिन का अल्टीमेटम',
        subtext: 'समय सीमा में कार्य पूर्ण न होने पर होगी कड़ी दंडात्मक कार्रवाई',
        lowerThird: 'प्रशासनिक संज्ञान | असरदार पत्रकारिता',
        district: 'जबलपुर',
        category: 'जिला हलचल',
        showLogo: true,
        showTicker: true,
        transition: 'cut',
      },
    ],
  },
  {
    id: 'tpl-vid-sports-01',
    title: 'खेल जगत व खिलाड़ी समाचार (1:1)',
    description: 'मैच परिणाम, स्थानीय खेल प्रतिभाओं व प्रतियोगिताओं का स्क्वायर वीडियो।',
    category: 'SPORTS',
    aspectRatio: '1:1',
    defaultDurationSec: 25,
    themeColor: '#D97706',
    isDefault: false,
    isActive: true,
    allowedRoles: ['ADMIN', 'EDITOR', 'REPORTER'],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    scenes: [
      {
        id: 'scn-spt-1',
        title: 'शानदार जीत',
        order: 0,
        durationSec: 12,
        backgroundStyle: 'gradient-red',
        headline: 'राज्य स्तरीय खेल प्रतियोगिता: मध्य प्रदेश के खिलाड़ियों का दबदबा',
        subtext: 'स्वर्ण व रजत पदकों के साथ अंक तालिका में शीर्ष स्थान हासिल किया',
        lowerThird: 'खेल जगत | शानदार प्रदर्शन',
        district: 'ग्वालियर',
        category: 'खेल',
        showLogo: true,
        showTicker: true,
        transition: 'zoom-in',
      },
      {
        id: 'scn-spt-2',
        title: 'खिलाड़ी का संदेश',
        order: 1,
        durationSec: 13,
        backgroundStyle: 'dark-charcoal',
        headline: 'कोच और परिजनों को दिया सफलता का श्रेय, राष्ट्रीय स्तर की तैयारी शुरू',
        subtext: 'खेल एवं युवा कल्याण विभाग ने की नकद पुरस्कार की घोषणा',
        lowerThird: 'मध्य प्रदेश का गौरव',
        district: 'ग्वालियर',
        category: 'खेल',
        showLogo: true,
        showTicker: false,
        transition: 'fade',
      },
    ],
  },
  {
    id: 'tpl-vid-business-01',
    title: 'व्यापार एवं मंडी भाव बुलेटिन (1:1)',
    description: 'किसानों एवं व्यापारियों के लिए अनाज, दलहन व तिलहन के ताज़ा मंडी भाव।',
    category: 'BUSINESS',
    aspectRatio: '1:1',
    defaultDurationSec: 25,
    themeColor: '#059669',
    isDefault: false,
    isActive: true,
    allowedRoles: ['ADMIN', 'EDITOR', 'REPORTER'],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    scenes: [
      {
        id: 'scn-biz-1',
        title: 'ताज़ा मंडी दरें',
        order: 0,
        durationSec: 13,
        backgroundStyle: 'dark-charcoal',
        headline: 'आज के प्रमुख कृषि उपज मंडी भाव: सोयाबीन, गेहूं और चना दरों में उछाल',
        subtext: 'इंदौर, उज्जैन और सीहोर मंडियों में आवक बढ़ी, जानें सटीक दरें',
        lowerThird: 'मंडी समाचार | किसान बुलेटिन',
        district: 'उज्जैन',
        category: 'व्यापार व मंडी',
        showLogo: true,
        showTicker: true,
        transition: 'slide-left',
      },
      {
        id: 'scn-biz-2',
        title: 'बाज़ार रुझान',
        order: 1,
        durationSec: 12,
        backgroundStyle: 'navy-blue',
        headline: 'व्यापारियों के अनुसार आगामी दिनों में दरों में स्थिरता की संभावना',
        subtext: 'प्रतिदिन सटीक मंडी भाव जानने हेतु फॉलो करें ब्रेकिंग न्यूज़ वाला',
        lowerThird: 'सटीक व विश्वसनीय बाज़ार अपडेट',
        district: 'मध्य प्रदेश',
        category: 'व्यापार व मंडी',
        showLogo: true,
        showTicker: false,
        transition: 'fade',
      },
    ],
  },
  {
    id: 'tpl-vid-education-01',
    title: 'शिक्षा व रोजगार अलर्ट (9:16)',
    description: 'भर्ती परीक्षाएं, परिणाम और प्रवेश प्रक्रियाओं की त्वरित मोबाइल रील।',
    category: 'EDUCATION',
    aspectRatio: '9:16',
    defaultDurationSec: 30,
    themeColor: '#10B981',
    isDefault: false,
    isActive: true,
    allowedRoles: ['ADMIN', 'EDITOR', 'REPORTER'],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    scenes: [
      {
        id: 'scn-edu-1',
        title: 'भर्ती अधिसूचना',
        order: 0,
        durationSec: 15,
        backgroundStyle: 'dark-charcoal',
        headline: 'बड़ी भर्ती: मध्य प्रदेश कर्मचारी चयन मंडल ने जारी किया नया नोटिफिकेशन',
        subtext: 'हज़ारों पदों पर सीधी भर्ती, योग्यता एवं अंतिम तिथि की जांच करें',
        lowerThird: 'रोजगार समाचार | शिक्षा विभाग',
        district: 'मध्य प्रदेश',
        category: 'शिक्षा व रोज़गार',
        showLogo: true,
        showTicker: true,
        transition: 'cut',
      },
      {
        id: 'scn-edu-2',
        title: 'आवेदन निर्देश',
        order: 1,
        durationSec: 15,
        backgroundStyle: 'navy-blue',
        headline: 'ऑनलाइन आवेदन प्रारंभ, अंतिम तिथि से पूर्व करें आवेदन',
        subtext: 'पूरी अधिसूचना पढ़ने के लिए breakingnewswala.com पर जाएं',
        lowerThird: 'युवाओं के लिए महत्वपूर्ण सूचना',
        district: 'मध्य प्रदेश',
        category: 'शिक्षा व रोज़गार',
        showLogo: true,
        showTicker: false,
        transition: 'fade',
      },
    ],
  },
  {
    id: 'tpl-vid-weather-01',
    title: 'मौसम चेतावनी व अलर्ट रील (9:16)',
    description: 'वर्षा, आंधी एवं शीतलहर की मौसम विभाग द्वारा जारी त्वरित चेतावनी।',
    category: 'WEATHER',
    aspectRatio: '9:16',
    defaultDurationSec: 25,
    themeColor: '#0284C7',
    isDefault: false,
    isActive: true,
    allowedRoles: ['ADMIN', 'EDITOR', 'REPORTER'],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    scenes: [
      {
        id: 'scn-wth-1',
        title: 'मौसम चेतावनी',
        order: 0,
        durationSec: 12,
        backgroundStyle: 'navy-blue',
        headline: 'मौसम अलर्ट: आगामी 48 घंटों में भारी बारिश और आकाशीय बिजली की चेतावनी',
        subtext: 'मौसम केंद्र ने 12 जिलों में येलो और ऑरेंज अलर्ट किया जारी',
        lowerThird: 'मौसम बुलेटिन | तत्काल प्रभाव से',
        district: 'मध्य प्रदेश',
        category: 'मौसम',
        showLogo: true,
        showTicker: true,
        transition: 'cut',
      },
      {
        id: 'scn-wth-2',
        title: 'सावधानी निर्देश',
        order: 1,
        durationSec: 13,
        backgroundStyle: 'dark-charcoal',
        headline: 'नागरिकों से खराब मौसम में सुरक्षित स्थानों पर रहने की अपील',
        subtext: 'हेल्पलाइन नंबर जारी, आपात स्थिति में तुरंत संपर्क करें',
        lowerThird: 'जनहित में प्रसारित सूचना',
        district: 'मध्य प्रदेश',
        category: 'मौसम',
        showLogo: true,
        showTicker: false,
        transition: 'fade',
      },
    ],
  },
  {
    id: 'tpl-vid-special-01',
    title: 'विशेष अन्वेषण व जांच रिपोर्ट (16:9)',
    description: 'विस्तृत खोजी पत्रकारिता, दस्तावेजी साक्ष्य एवं स्टिंग विश्लेषण।',
    category: 'SPECIAL',
    aspectRatio: '16:9',
    defaultDurationSec: 50,
    themeColor: '#B91C1C',
    isDefault: false,
    isActive: true,
    allowedRoles: ['ADMIN', 'EDITOR'],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    scenes: [
      {
        id: 'scn-spc-1',
        title: 'खुलासा एवं भूमिका',
        order: 0,
        durationSec: 20,
        backgroundStyle: 'dark-charcoal',
        headline: 'विशेष पड़ताल: सरकारी राशि में अनियमितता का बड़ा खुलासा',
        subtext: 'कागजों में बनी सड़कें, धरातल पर गड्ढे; ग्रामीणों ने उठाए गंभीर सवाल',
        lowerThird: 'खोजी पत्रकारिता | बड़ा खुलासा',
        district: 'रीवा',
        category: 'विशेष रिपोर्ट',
        showLogo: true,
        showTicker: true,
        transition: 'fade',
      },
      {
        id: 'scn-spc-2',
        title: 'निष्कर्ष व कार्रवाई',
        order: 1,
        durationSec: 30,
        backgroundStyle: 'gradient-red',
        headline: 'जांच समिति गठित, दोषियों के विरुद्ध होगी एफआईआर दर्ज',
        subtext: 'ब्रेकिंग न्यूज़ वाला की खबर का बड़ा असर, वरिष्ठ अधिकारियों ने लिया संज्ञान',
        lowerThird: 'असरदार पत्रकारिता का परिणाम',
        district: 'रीवा',
        category: 'विशेष रिपोर्ट',
        showLogo: true,
        showTicker: false,
        transition: 'slide-left',
      },
    ],
  },
  {
    id: 'tpl-vid-festival-01',
    title: 'पर्व एवं त्यौहार शुभकामनाएं (1:1)',
    description: 'दीपावली, होली, ईद, नववर्ष व राष्ट्रीय पर्वों पर चैनल की ओर से मंगलकामनाएं।',
    category: 'FESTIVAL',
    aspectRatio: '1:1',
    defaultDurationSec: 20,
    themeColor: '#E11D48',
    isDefault: false,
    isActive: true,
    allowedRoles: ['ADMIN', 'EDITOR', 'REPORTER'],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    scenes: [
      {
        id: 'scn-fst-1',
        title: 'मंगलकामनाएं संदेश',
        order: 0,
        durationSec: 10,
        backgroundStyle: 'breaking-yellow',
        headline: 'समस्त प्रदेशवासियों को पावन पर्व की हार्दिक शुभकामनाएं',
        subtext: 'आपके जीवन में सुख, शांति, समृद्धि और उत्तम स्वास्थ्य की कामना',
        lowerThird: 'हार्दिक मंगलकामनाएं | बधाई संदेश',
        district: 'मध्य प्रदेश',
        category: 'त्यौहार व बधाई',
        showLogo: true,
        showTicker: false,
        transition: 'zoom-in',
      },
      {
        id: 'scn-fst-2',
        title: 'चैनल संदेश',
        order: 1,
        durationSec: 10,
        backgroundStyle: 'gradient-red',
        headline: 'ब्रेकिंग न्यूज़ वाला परिवार की ओर से सप्रेम बधाई',
        subtext: 'सदैव सत्य और निष्पक्ष पत्रकारिता के साथ',
        lowerThird: 'breakingnewswala.com',
        district: 'मध्य प्रदेश',
        category: 'त्यौहार व बधाई',
        showLogo: true,
        showTicker: false,
        transition: 'fade',
      },
    ],
  },
];

// -------------------------------------------------------------
// 1. ATOMIC JSON FILE STORAGE IMPLEMENTATION
// -------------------------------------------------------------

export class AtomicJsonStorage {
  constructor(filePath = DEFAULT_STORE_FILE) {
    this.filePath = filePath;
    this.tempPath = `${filePath}.tmp`;
    this.backupPath = `${filePath}.bak`;
    this.writePromise = Promise.resolve();
  }

  read() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.articles)) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn(`[AtomicJsonStorage] Primary store read failed: ${err.message}. Attempting quarantine & backup recovery.`);
      // Quarantine corrupted file
      try {
        const corruptedName = `${this.filePath}.corrupted.${Date.now()}.json`;
        if (fs.existsSync(this.filePath)) {
          fs.renameSync(this.filePath, corruptedName);
          console.warn(`[AtomicJsonStorage] Quarantined corrupted store to: ${corruptedName}`);
        }
      } catch (qErr) {
        console.error(`[AtomicJsonStorage] Failed to quarantine corrupted file: ${qErr.message}`);
      }

      // Try backup
      try {
        if (fs.existsSync(this.backupPath)) {
          const backupRaw = fs.readFileSync(this.backupPath, 'utf-8');
          const backupParsed = JSON.parse(backupRaw);
          if (backupParsed && Array.isArray(backupParsed.articles)) {
            console.log('[AtomicJsonStorage] Successfully recovered data from backup file.');
            return backupParsed;
          }
        }
      } catch (bErr) {
        console.error(`[AtomicJsonStorage] Backup recovery failed: ${bErr.message}`);
      }
    }
    return null;
  }

  write(data) {
    const serialized = JSON.stringify(data, null, 2);
    // 1. Write to temporary file
    fs.writeFileSync(this.tempPath, serialized, 'utf-8');

    // 2. Rotate existing primary file to backup
    if (fs.existsSync(this.filePath)) {
      try {
        fs.copyFileSync(this.filePath, this.backupPath);
      } catch (copyErr) {
        // Non-fatal if backup copy fails
      }
    }

    // 3. Atomically rename temp file to primary file (with Windows EPERM/EBUSY/ENOENT resilience)
    try {
      if (fs.existsSync(this.tempPath)) {
        fs.renameSync(this.tempPath, this.filePath);
      }
    } catch (renameErr) {
      if (renameErr.code === 'EPERM' || renameErr.code === 'EBUSY' || renameErr.code === 'ENOENT') {
        try {
          if (fs.existsSync(this.tempPath)) {
            fs.copyFileSync(this.tempPath, this.filePath);
            try { fs.unlinkSync(this.tempPath); } catch {}
          } else {
            fs.writeFileSync(this.filePath, serialized, 'utf-8');
          }
        } catch (copyErr) {
          console.error('[AtomicJsonStorage] Windows atomic write fallback error:', copyErr.message);
        }
      } else {
        throw renameErr;
      }
    }
  }

  async queueWrite(data) {
    this.writePromise = this.writePromise
      .then(() => this.write(data))
      .catch((err) => {
        console.error('[AtomicJsonStorage] Serialized write error:', err.message);
      });
    return this.writePromise;
  }
}

// -------------------------------------------------------------
// 2. LOCAL JSON ADAPTER (Development & Testing)
// -------------------------------------------------------------

export class LocalJsonAdapter {
  constructor(filePath = DEFAULT_STORE_FILE) {
    this.storage = new AtomicJsonStorage(filePath);
    this.data = {
      articles: [],
      categories: INITIAL_CATEGORIES,
      districts: INITIAL_DISTRICTS,
      reporters: INITIAL_REPORTERS,
      tickers: INITIAL_TICKERS,
      ads: INITIAL_ADS,
      users: INITIAL_USERS,
      sessions: [],
      reviews: [],
      auditLogs: INITIAL_AUDIT_LOGS,
      activeAlert: null,
      graphicTemplates: [...INITIAL_GRAPHIC_TEMPLATES],
      graphics: [],
      videoTemplates: [...INITIAL_VIDEO_TEMPLATES],
      videoProjects: [],
      videoRenderJobs: [],
      aiPrompts: [...INITIAL_AI_PROMPTS],
      aiUsage: [],
      aiHistory: [],
      apiProviders: [...CANONICAL_SEED_PROVIDERS],
      apiUsageLogs: [],
      newsSources: [...INITIAL_NEWS_SOURCES],
      rssImportedItems: [],
      socialAccounts: [...INITIAL_SOCIAL_ACCOUNTS],
      socialPublishingJobs: [],
      whatsappTemplates: [...INITIAL_WHATSAPP_TEMPLATES],
      whatsappSubscribers: [...INITIAL_WHATSAPP_SUBSCRIBERS],
      webhooks: [],
      webhookLogs: [],
      subscriptionPlans: [...CANONICAL_SUBSCRIPTION_PLANS],
      customerSubscriptions: [],
      paymentOrders: [],
      transactions: [],
      refunds: [],
      advertisers: [...CANONICAL_SEED_ADVERTISERS],
      campaigns: [...CANONICAL_SEED_CAMPAIGNS],
      sponsoredContent: [],
      crmNotes: [],
      crmProposals: [],
      invoices: [],
      financialAuditLogs: [],
      userPreferences: {},
      readingHistory: [],
      bookmarks: [],
      followedTopics: [],
      followedDistricts: [],
      notifications: [],
      engagementEvents: [],
      audienceSegments: [...CANONICAL_AUDIENCE_SEGMENTS],
      readerFeedback: [],
      comments: [],
      deletionRequests: [],
      mandiRates: [...MP_SEED_MANDI_RATES],
      epaperEditions: [],
      epaperPages: [],
      epaperTemplates: [...INITIAL_EPAPER_TEMPLATES],
      epaperWhatsAppGenerations: [],
      epaperAdSubmissions: [],
      epaperEditionVersions: [],
    };
    this.init();
  }

  init() {
    const loaded = this.storage.read();
    if (loaded) {
      this.data = loaded;
      this.data.sessions = this.data.sessions || [];
      this.data.users = this.data.users || [];
      this.data.graphicTemplates = this.data.graphicTemplates && this.data.graphicTemplates.length > 0
        ? this.data.graphicTemplates
        : [...INITIAL_GRAPHIC_TEMPLATES];
      // Ensure baseline built-in templates have updated dimensions and aspect ratios
      for (const initT of INITIAL_GRAPHIC_TEMPLATES) {
        const idx = this.data.graphicTemplates.findIndex((t) => t.id === initT.id);
        if (idx >= 0) {
          this.data.graphicTemplates[idx] = {
            ...initT,
            ...this.data.graphicTemplates[idx],
            aspectRatio: initT.aspectRatio,
            width: initT.width,
            height: initT.height,
          };
        } else {
          this.data.graphicTemplates.push({ ...initT });
        }
      }
      this.data.graphics = this.data.graphics || [];

      // Initialize Video Production Studio collections
      this.data.videoTemplates = this.data.videoTemplates && this.data.videoTemplates.length > 0
        ? this.data.videoTemplates
        : [...INITIAL_VIDEO_TEMPLATES];
      for (const initVT of INITIAL_VIDEO_TEMPLATES) {
        const idx = this.data.videoTemplates.findIndex((t) => t.id === initVT.id);
        if (idx >= 0) {
          this.data.videoTemplates[idx] = {
            ...initVT,
            ...this.data.videoTemplates[idx],
            category: initVT.category,
            aspectRatio: initVT.aspectRatio,
          };
        } else {
          this.data.videoTemplates.push({ ...initVT });
        }
      }
      this.data.videoProjects = this.data.videoProjects || [];
      this.data.videoRenderJobs = this.data.videoRenderJobs || [];
      this.data.aiPrompts = this.data.aiPrompts && this.data.aiPrompts.length > 0
        ? this.data.aiPrompts
        : [...INITIAL_AI_PROMPTS];
      this.data.aiUsage = this.data.aiUsage || [];
      this.data.aiHistory = this.data.aiHistory || [];

      // Ensure built-in AI prompts exist
      for (const initP of INITIAL_AI_PROMPTS) {
        if (!this.data.aiPrompts.some((p) => p.id === initP.id)) {
          this.data.aiPrompts.push({ ...initP });
        }
      }


      // Initialize Video Production Studio collections
      this.data.videoTemplates = this.data.videoTemplates && this.data.videoTemplates.length > 0
        ? this.data.videoTemplates
        : [...INITIAL_VIDEO_TEMPLATES];
      for (const initVT of INITIAL_VIDEO_TEMPLATES) {
        const idx = this.data.videoTemplates.findIndex((t) => t.id === initVT.id);
        if (idx >= 0) {
          this.data.videoTemplates[idx] = {
            ...initVT,
            ...this.data.videoTemplates[idx],
            category: initVT.category,
            aspectRatio: initVT.aspectRatio,
          };
        } else {
          this.data.videoTemplates.push({ ...initVT });
        }
      }
      this.data.videoProjects = this.data.videoProjects || [];
      this.data.videoRenderJobs = this.data.videoRenderJobs || [];

      // Ensure built-in AI prompts exist
      for (const initP of INITIAL_AI_PROMPTS) {
        if (!this.data.aiPrompts.some((p) => p.id === initP.id)) {
          this.data.aiPrompts.push({ ...initP });
        }
      }

      // Ensure Integrations & API Pool collections exist
      this.data.apiProviders = this.data.apiProviders && this.data.apiProviders.length > 0
        ? this.data.apiProviders
        : [...CANONICAL_SEED_PROVIDERS];
      for (const initP of CANONICAL_SEED_PROVIDERS) {
        if (!this.data.apiProviders.some((p) => p.id === initP.id)) {
          this.data.apiProviders.push({ ...initP });
        }
      }
      this.data.apiUsageLogs = this.data.apiUsageLogs || [];

      this.data.newsSources = this.data.newsSources && this.data.newsSources.length > 0
        ? this.data.newsSources
        : [...INITIAL_NEWS_SOURCES];
      for (const initS of INITIAL_NEWS_SOURCES) {
        if (!this.data.newsSources.some((s) => s.id === initS.id)) {
          this.data.newsSources.push({ ...initS });
        }
      }
      this.data.rssImportedItems = this.data.rssImportedItems || [];

      this.data.socialAccounts = this.data.socialAccounts && this.data.socialAccounts.length > 0
        ? this.data.socialAccounts
        : [...INITIAL_SOCIAL_ACCOUNTS];
      for (const initA of INITIAL_SOCIAL_ACCOUNTS) {
        if (!this.data.socialAccounts.some((a) => a.id === initA.id)) {
          this.data.socialAccounts.push({ ...initA });
        }
      }
      this.data.socialPublishingJobs = this.data.socialPublishingJobs || [];

      this.data.whatsappTemplates = this.data.whatsappTemplates && this.data.whatsappTemplates.length > 0
        ? this.data.whatsappTemplates
        : [...INITIAL_WHATSAPP_TEMPLATES];
      for (const initT of INITIAL_WHATSAPP_TEMPLATES) {
        if (!this.data.whatsappTemplates.some((t) => t.id === initT.id)) {
          this.data.whatsappTemplates.push({ ...initT });
        }
      }
      this.data.whatsappSubscribers = this.data.whatsappSubscribers && this.data.whatsappSubscribers.length > 0
        ? this.data.whatsappSubscribers
        : [...INITIAL_WHATSAPP_SUBSCRIBERS];
      for (const initSub of INITIAL_WHATSAPP_SUBSCRIBERS) {
        if (!this.data.whatsappSubscribers.some((s) => s.phoneNumber === initSub.phoneNumber)) {
          this.data.whatsappSubscribers.push({ ...initSub });
        }
      }
      this.data.webhooks = this.data.webhooks || [];
      this.data.webhookLogs = this.data.webhookLogs || [];

      // Ensure Monetization collections exist
      this.data.subscriptionPlans = this.data.subscriptionPlans && this.data.subscriptionPlans.length > 0
        ? this.data.subscriptionPlans
        : [...CANONICAL_SUBSCRIPTION_PLANS];
      for (const initP of CANONICAL_SUBSCRIPTION_PLANS) {
        if (!this.data.subscriptionPlans.some((p) => p.id === initP.id || p.code === initP.code)) {
          this.data.subscriptionPlans.push({ ...initP });
        }
      }
      this.data.customerSubscriptions = this.data.customerSubscriptions || [];
      this.data.paymentOrders = this.data.paymentOrders || [];
      this.data.transactions = this.data.transactions || [];
      this.data.refunds = this.data.refunds || [];

      this.data.advertisers = this.data.advertisers && this.data.advertisers.length > 0
        ? this.data.advertisers
        : [...CANONICAL_SEED_ADVERTISERS];
      for (const initA of CANONICAL_SEED_ADVERTISERS) {
        if (!this.data.advertisers.some((a) => a.id === initA.id)) {
          this.data.advertisers.push({ ...initA });
        }
      }

      this.data.campaigns = this.data.campaigns && this.data.campaigns.length > 0
        ? this.data.campaigns
        : [...CANONICAL_SEED_CAMPAIGNS];
      for (const initC of CANONICAL_SEED_CAMPAIGNS) {
        if (!this.data.campaigns.some((c) => c.id === initC.id)) {
          this.data.campaigns.push({ ...initC });
        }
      }
      this.data.sponsoredContent = this.data.sponsoredContent || [];
      this.data.crmNotes = this.data.crmNotes || [];
      this.data.crmProposals = this.data.crmProposals || [];
      this.data.invoices = this.data.invoices || [];
      this.data.financialAuditLogs = this.data.financialAuditLogs || [];

      // Ensure Audience & Engagement Intelligence collections exist
      this.data.userPreferences = this.data.userPreferences || {};
      this.data.readingHistory = this.data.readingHistory || [];
      this.data.bookmarks = this.data.bookmarks || [];
      this.data.followedTopics = this.data.followedTopics || [];
      this.data.followedDistricts = this.data.followedDistricts || [];
      this.data.notifications = this.data.notifications || [];
      this.data.engagementEvents = this.data.engagementEvents || [];
      this.data.audienceSegments = this.data.audienceSegments && this.data.audienceSegments.length > 0
        ? this.data.audienceSegments
        : [...CANONICAL_AUDIENCE_SEGMENTS];
      for (const initSeg of CANONICAL_AUDIENCE_SEGMENTS) {
        if (!this.data.audienceSegments.some((s) => s.id === initSeg.id || s.code === initSeg.code)) {
          this.data.audienceSegments.push({ ...initSeg });
        }
      }
      this.data.readerFeedback = this.data.readerFeedback || [];
      this.data.comments = this.data.comments || [];
      this.data.deletionRequests = this.data.deletionRequests || [];

      // Merge any new INITIAL_USERS not present in loaded store
      const existingIds = new Set(this.data.users.map((u) => u.identifier || u.id));
      for (const initU of INITIAL_USERS) {
        if (!existingIds.has(initU.identifier) && !existingIds.has(initU.id)) {
          this.data.users.push({ ...initU });
        }
      }
      // Ensure all users have real Argon2id password hashes
      for (const u of this.data.users) {
        if (!u.passwordHash || u.passwordHash === 'mock_hash') {
          u.passwordHash = '$argon2id$v=19$m=65536,t=3,p=1$M8c5YD5Xe48JKvpnM3kdAg$mxpNsuwzww6FWqXJAR5RZcSgvyGOwLS/AaDzw9OG0fI';
        }
      }

      // Sync all 55 districts and categories
      this.data.districts = [...MP_55_DISTRICTS];
      this.data.categories = [...INITIAL_CATEGORIES];

      // Merge any missing 19-bureau reporters covering all 55 districts
      this.data.reporters = this.data.reporters || [];
      for (const seedRep of MP_SEED_REPORTERS) {
        if (!this.data.reporters.some((r) => r.id === seedRep.id || r.badgeNumber === seedRep.badgeNumber)) {
          this.data.reporters.push({ ...seedRep });
        }
      }

      // Merge full 55-district & all-category articles + extra pending stories without overwriting existing items
      this.data.articles = this.data.articles || [];
      const fullSeedArticles = [
        ...buildAllDistrictAndCategoryArticles(this.data.articles),
        ...MP_SEED_PENDING_STORIES,
      ];
      for (const seedArt of fullSeedArticles) {
        if (!this.data.articles.some((a) => a.id === seedArt.id)) {
          this.data.articles.push({ ...seedArt });
        }
      }

      // Merge mandi rates
      this.data.mandiRates = Array.isArray(this.data.mandiRates) && this.data.mandiRates.length > 0
        ? this.data.mandiRates
        : [...MP_SEED_MANDI_RATES];

      // Ensure ads have impression/click telemetry counters
      this.data.ads = (this.data.ads && this.data.ads.length > 0 ? this.data.ads : [...INITIAL_ADS]).map((a) => ({
        impressionsCount: 0,
        clicksCount: 0,
        ...a,
      }));

      // Initialize E-Paper Studio collections
      this.data.epaperEditions = this.data.epaperEditions || [];
      this.data.epaperPages = this.data.epaperPages || [];
      this.data.epaperTemplates = Array.isArray(this.data.epaperTemplates) && this.data.epaperTemplates.length > 0
        ? this.data.epaperTemplates
        : [...INITIAL_EPAPER_TEMPLATES];
      for (const initTpl of INITIAL_EPAPER_TEMPLATES) {
        if (!this.data.epaperTemplates.some((t) => t.id === initTpl.id)) {
          this.data.epaperTemplates.push({ ...initTpl });
        }
      }
      this.data.epaperWhatsAppGenerations = this.data.epaperWhatsAppGenerations || [];
      this.data.epaperAdSubmissions = this.data.epaperAdSubmissions || [];
      this.data.epaperEditionVersions = this.data.epaperEditionVersions || [];
    } else {
      const seedArticles = [
        ...INITIAL_ARTICLES,
        ...INITIAL_PENDING_STORIES,
        ...buildAllDistrictAndCategoryArticles(INITIAL_ARTICLES),
        ...MP_SEED_PENDING_STORIES,
      ];
      this.data.articles = seedArticles;
      this.data.mandiRates = [...MP_SEED_MANDI_RATES];
      this.data.sessions = [];
      this.data.users = [...INITIAL_USERS];
      this.data.graphicTemplates = [...INITIAL_GRAPHIC_TEMPLATES];
      this.data.graphics = [];
      this.data.videoTemplates = [...INITIAL_VIDEO_TEMPLATES];
      this.data.videoProjects = [];
      this.data.videoRenderJobs = [];
      this.data.aiPrompts = [...INITIAL_AI_PROMPTS];
      this.data.aiUsage = [];
      this.data.aiHistory = [];
      this.data.apiProviders = [...CANONICAL_SEED_PROVIDERS];
      this.data.apiUsageLogs = [];
      this.data.newsSources = [...INITIAL_NEWS_SOURCES];
      this.data.rssImportedItems = [];
      this.data.socialAccounts = [...INITIAL_SOCIAL_ACCOUNTS];
      this.data.socialPublishingJobs = [];
      this.data.whatsappTemplates = [...INITIAL_WHATSAPP_TEMPLATES];
      this.data.whatsappSubscribers = [...INITIAL_WHATSAPP_SUBSCRIBERS];
      this.data.webhooks = [];
      this.data.webhookLogs = [];
      this.data.epaperEditions = [];
      this.data.epaperPages = [];
      this.data.epaperTemplates = [...INITIAL_EPAPER_TEMPLATES];
      this.data.epaperWhatsAppGenerations = [];
      this.data.epaperAdSubmissions = [];
      this.data.epaperEditionVersions = [];
      this.storage.write(this.data);
    }
  }

  save() {
    this.storage.write(this.data);
  }

  async getArticles(params = {}) {
    let list = [...this.data.articles];

    if (params.status && params.status !== 'all') {
      const norm = params.status.toUpperCase();
      list = list.filter((a) => a.status === norm);
    } else if (!params.status) {
      list = list.filter((a) => a.status === 'PUBLISHED');
    }

    if (params.categoryId) {
      list = list.filter((a) => a.categoryId === params.categoryId);
    }
    if (params.locationId || params.districtId) {
      const loc = params.locationId || params.districtId;
      list = list.filter((a) => a.districtId === loc);
    }
    if (params.priority && params.priority !== 'ALL') {
      list = list.filter(
        (a) => String(a.priority || '').toUpperCase() === params.priority.toUpperCase()
      );
    }
    if (params.editorId) {
      list = list.filter(
        (a) =>
          a.lastEditorId === params.editorId ||
          a.assignedEditorId === params.editorId ||
          a.claimedBy === params.editorId
      );
    }
    if (params.isBreaking !== undefined && params.isBreaking !== null) {
      const bBool = params.isBreaking === 'true' || params.isBreaking === true;
      list = list.filter((a) => Boolean(a.isBreaking) === bBool);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          (a.content && a.content.toLowerCase().includes(q)) ||
          (a.districtName && a.districtName.toLowerCase().includes(q)) ||
          (a.authorName && a.authorName.toLowerCase().includes(q))
      );
    }

    const total = list.length;
    const page = parseInt(params.page || '1', 10);
    const limit = parseInt(params.limit || '20', 10);
    const startIndex = (page - 1) * limit;
    const paginated = list.slice(startIndex, startIndex + limit);

    return {
      items: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async getArticleByIdOrSlug(idOrSlug) {
    return this.data.articles.find((a) => a.id === idOrSlug || a.slug === idOrSlug) || null;
  }

  async createDraft(payload, user) {
    const newId = `art-${Date.now()}`;
    const slug = `draft-${Date.now()}`;
    const category = this.data.categories.find((c) => c.id === payload.categoryId);
    const district = this.data.districts.find((d) => d.id === payload.districtId);

    const newArticle = {
      id: newId,
      slug,
      title: payload.title,
      summary: payload.summary || payload.content.slice(0, 150),
      content: payload.content,
      status: 'DRAFT',
      featuredImage: payload.featuredImage || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200&auto=format&fit=crop&q=80',
      imageCaption: payload.imageCaption || '',
      imageAttribution: payload.imageAttribution || (user?.fullName ? `${user.fullName}` : 'बीएनडब्ल्यू फील्ड संवाददाता'),
      categoryId: payload.categoryId || 'cat-mp',
      categoryName: category?.nameHi || 'मध्य प्रदेश',
      districtId: payload.districtId || 'dist-bhopal',
      districtName: district?.nameHi || 'भोपाल',
      authorId: user?.id || payload.authorId || 'rep-001',
      authorName: user?.fullName || payload.authorName || 'राजेश पटेल',
      authorRole: payload.authorRole || 'फील्ड संवाददाता',
      isBreaking: Boolean(payload.isBreaking),
      viewCount: 0,
      shareCount: 0,
      createdAt: new Date().toISOString(),
      factChecked: false,
      isAiAssisted: Boolean(payload.isAiAssisted),
      aiModel: payload.aiModel || null,
      sourceAttribution: payload.sourceAttribution || null,
      editorialNotes: payload.editorialNotes || null,
      tags: payload.tags || [district?.nameHi || 'मध्य प्रदेश'],
    };

    this.data.articles.unshift(newArticle);
    this.save();
    return newArticle;
  }

  async updateDraft(id, payload) {
    const target = this.data.articles.find((a) => a.id === id);
    if (!target) return null;

    Object.assign(target, {
      title: payload.title !== undefined ? payload.title : (payload.headline !== undefined ? payload.headline : target.title),
      summary: payload.summary !== undefined ? payload.summary : target.summary,
      content: payload.content !== undefined ? payload.content : target.content,
      subheadline: payload.subheadline !== undefined ? payload.subheadline : target.subheadline,
      categoryId: payload.categoryId !== undefined ? payload.categoryId : target.categoryId,
      districtId: payload.districtId !== undefined ? payload.districtId : target.districtId,
      featuredImage: payload.featuredImage !== undefined ? payload.featuredImage : target.featuredImage,
      imageUrl: payload.imageUrl !== undefined ? payload.imageUrl : (payload.featuredImage !== undefined ? payload.featuredImage : target.imageUrl),
      isBreaking: payload.isBreaking !== undefined ? payload.isBreaking : target.isBreaking,
      version: (target.version || 1) + 1,
      updatedAt: new Date().toISOString(),
    });

    this.save();
    return target;
  }

  async submitArticle(id) {
    const target = this.data.articles.find((a) => a.id === id);
    if (!target) return null;

    target.status = 'PENDING_REVIEW';
    target.submittedAt = new Date().toISOString();
    target.version = (target.version || 1) + 1;
    this.save();
    return target;
  }

  /**
   * Editorial Review with Concurrency & Race Condition Safety (Section 9)
   */
  async reviewArticle(id, action, params = {}, user = null) {
    const target = this.data.articles.find((a) => a.id === id);
    if (!target) return null;

    // RACE CONDITION CHECK 1: Claiming an article
    if (action === 'claim') {
      if ((target.status === 'UNDER_REVIEW' || target.status === 'IN_REVIEW') && target.lastEditorId && target.lastEditorId !== (user?.id || params.assignedEditorId || 'editor-1')) {
        return {
          conflict: true,
          code: 'ERR_ARTICLE_ALREADY_CLAIMED',
          message: 'यह लेख पहले से ही किसी अन्य संपादक द्वारा क्लेम किया जा चुका है।',
        };
      }
      target.status = 'UNDER_REVIEW';
      target.lastEditorId = params.assignedEditorId || user?.id || 'editor-1';
      target.claimedBy = params.assignedEditorName || user?.fullName || 'मुख्य संपादक (Desk Editor)';
      target.claimedAt = new Date().toISOString();
      target.assignedEditorId = target.lastEditorId;
      target.assignedEditorName = target.claimedBy;
      if (params.headline || params.title || params.updatedTitle) {
        target.title = params.headline || params.title || params.updatedTitle;
      }
      if (params.content !== undefined) target.content = params.content;
      target.version = (target.version || 1) + 1;
    } 
    // RACE CONDITION CHECK 2: Double publication prevention
    else if (action === 'approve') {
      if (target.status === 'PUBLISHED') {
        return {
          conflict: true,
          code: 'ERR_ARTICLE_ALREADY_APPROVED',
          message: 'यह लेख पहले ही प्रकाशित किया जा चुका है।',
        };
      }
      if (params.updatedTitle || params.headline || params.title) {
        target.title = params.updatedTitle || params.headline || params.title;
      }
      if (params.updatedContent || params.content) target.content = params.updatedContent || params.content;
      target.status = 'PUBLISHED';
      target.publishedAt = new Date().toISOString();
      target.factChecked = true;
      target.factCheckScore = 98;
      target.lastEditorId = user?.id || 'editor-1';
      target.version = (target.version || 1) + 1;
    } else if (action === 'request_changes' || action === 'request_revision') {
      target.status = 'REVISION_REQUESTED';
      target.editorialNotes = params.feedbackComments || params.notes || 'कृपया तथ्यों की पुनः पुष्टि करें।';
      target.version = (target.version || 1) + 1;
    } else if (action === 'reject') {
      if (!params.reasonCode && !params.reason && !params.rejectionReason && !params.feedbackComments) {
        return {
          error: true,
          statusCode: 400,
          code: 'ERR_REJECTION_REASON_REQUIRED',
          message: 'अस्वीकृति का कारण अनिवार्य है।',
        };
      }
      target.status = 'REJECTED';
      target.rejectionReason = params.reasonCode || params.reason || params.rejectionReason || 'EDITORIAL_POLICY_VIOLATION';
      target.rejectionReasonCode = params.reasonCode || target.rejectionReason;
      target.editorialNotes = params.feedbackComments || 'संपादकीय मानकों के अनुरूप नहीं।';
      target.version = (target.version || 1) + 1;
    } else if (action === 'reassign' || action === 'assign') {
      target.status = 'ASSIGNED';
      target.assignedEditorId = params.editorId || params.assignedEditorId || user?.id || 'editor-1';
      target.assignedEditorName = params.editorName || params.assignedEditorName || 'डेस्क संपादक';
      target.version = (target.version || 1) + 1;
    } else if (action === 'priority') {
      target.priority = params.priority || 'NORMAL';
      target.version = (target.version || 1) + 1;
    } else if (action === 'breaking') {
      target.isBreaking = params.isBreaking !== undefined ? Boolean(params.isBreaking) : true;
      if (params.priority) {
        target.priority = params.priority;
      } else if (target.isBreaking) {
        target.priority = 'BREAKING';
      }
      target.version = (target.version || 1) + 1;
    } else if (action === 'schedule') {
      target.scheduledAt = params.scheduledAt || new Date().toISOString();
      target.status = 'APPROVED';
      target.lastEditorId = user?.id || 'editor-1';
      target.version = (target.version || 1) + 1;
    } else if (action === 'editorial_notes') {
      const note = params.notes || params.editorialNotes || params.feedbackComments || '';
      target.editorialNotes = target.editorialNotes
        ? `${target.editorialNotes}\n[${new Date().toISOString()}] ${note}`
        : note;
      target.version = (target.version || 1) + 1;
    }

    // Record revision history
    if (!Array.isArray(target.revisionHistory)) {
      target.revisionHistory = [];
    }
    target.revisionHistory.push({
      timestamp: new Date().toISOString(),
      action,
      reviewerId: user?.id || 'editor-1',
      reviewerName: user?.fullName || 'डेस्क संपादक',
      comments: params.reasonCode || params.reason || params.notes || params.feedbackComments || '',
    });

    this.save();
    return target;
  }

  async getCategories() {
    return this.data.categories;
  }

  async getDistricts() {
    return this.data.districts;
  }

  async getReporters() {
    return this.data.reporters;
  }

  async updateReporterRole(id, newRole) {
    const rep = this.data.reporters.find((r) => r.id === id);
    if (!rep) return null;
    rep.role = newRole || (rep.role === 'trusted_reporter' ? 'reporter' : 'trusted_reporter');
    this.save();
    return rep;
  }

  async updateReporterStatus(id, newStatus) {
    const rep = this.data.reporters.find((r) => r.id === id);
    if (!rep) return null;
    rep.status = newStatus;
    rep.verificationStatus = newStatus;
    this.save();
    return rep;
  }

  async assignReporterBeats(id, beats = [], districts = []) {
    const rep = this.data.reporters.find((r) => r.id === id);
    if (!rep) return null;
    if (Array.isArray(beats)) rep.beats = beats;
    if (Array.isArray(districts)) rep.assignedDistricts = districts;
    this.save();
    return rep;
  }

  async getReporterPerformance(reporterId) {
    const articles = this.data.articles.filter((a) => a.authorId === reporterId);
    const filed = articles.length;
    const published = articles.filter((a) => a.status === 'PUBLISHED').length;
    const rejected = articles.filter((a) => a.status === 'REJECTED').length;
    const pending = articles.filter(
      (a) =>
        a.status === 'PENDING_REVIEW' ||
        a.status === 'UNDER_REVIEW' ||
        a.status === 'IN_REVIEW' ||
        a.status === 'ASSIGNED'
    ).length;
    const approvalRate = filed > 0 ? Math.round((published / filed) * 100) : 100;
    return {
      reporterId,
      totalStoriesFiled: filed,
      totalStoriesPublished: published,
      totalStoriesRejected: rejected,
      pendingReview: pending,
      approvalRate,
    };
  }

  async getTickers() {
    return this.data.tickers;
  }

  async createTicker(payload) {
    const newTicker = {
      id: `tick-${Date.now()}`,
      textHindi: payload.textHindi,
      districtName: payload.districtName || 'मध्य प्रदेश',
      priority: payload.priority || 'normal',
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    this.data.tickers.unshift(newTicker);
    this.save();
    return newTicker;
  }

  async toggleTicker(id) {
    const ticker = this.data.tickers.find((t) => t.id === id);
    if (!ticker) return null;
    ticker.isActive = !ticker.isActive;
    this.save();
    return ticker;
  }

  async deleteTicker(id) {
    const beforeCount = this.data.tickers.length;
    this.data.tickers = this.data.tickers.filter((t) => t.id !== id);
    if (this.data.tickers.length !== beforeCount) {
      this.save();
      return true;
    }
    return false;
  }

  async getAds() {
    return this.data.ads;
  }

  async createAd(payload) {
    const newAd = {
      id: `ad-${Date.now()}`,
      placement: payload.placement || 'in_feed',
      title: String(payload.title || '').trim(),
      imageUrl: payload.imageUrl || 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&auto=format&fit=crop&q=80',
      targetUrl: payload.targetUrl || 'https://breakingnewswala.com',
      advertiserName: String(payload.advertiserName || 'प्रायोजक').trim(),
      isActive: payload.isActive !== false,
      impressionsCount: 0,
      clicksCount: 0,
    };
    this.data.ads.unshift(newAd);
    this.save();
    return newAd;
  }

  async toggleAd(id) {
    const ad = this.data.ads.find((a) => a.id === id);
    if (!ad) return null;
    ad.isActive = !ad.isActive;
    this.save();
    return ad;
  }

  async deleteAd(id) {
    const before = this.data.ads.length;
    this.data.ads = this.data.ads.filter((a) => a.id !== id);
    if (this.data.ads.length !== before) {
      this.save();
      return true;
    }
    return false;
  }

  async recordAdBannerMetric(adId, metricType) {
    const ad = this.data.ads.find((a) => a.id === adId);
    if (!ad) return null;
    if (metricType === 'impression') {
      ad.impressionsCount = (ad.impressionsCount || 0) + 1;
    } else if (metricType === 'click') {
      ad.clicksCount = (ad.clicksCount || 0) + 1;
    }
    this.save();
    return ad;
  }

  async getMandiRates() {
    return this.data.mandiRates || [...MP_SEED_MANDI_RATES];
  }

  async createMandiRate(payload) {
    this.data.mandiRates = this.data.mandiRates || [];
    const newRate = {
      id: `mandi-${Date.now()}`,
      commodityName: String(payload.commodityName || '').trim(),
      mandiName: String(payload.mandiName || '').trim(),
      districtName: String(payload.districtName || '').trim(),
      modalPrice: Number(payload.modalPrice) || 0,
      minPrice: Number(payload.minPrice) || 0,
      maxPrice: Number(payload.maxPrice) || 0,
      unit: payload.unit || '₹ / क्विंटल',
      updatedAt: payload.updatedAt || 'अभी-अभी अपडेट',
    };
    this.data.mandiRates.unshift(newRate);
    this.save();
    return newRate;
  }

  async updateMandiRate(id, payload) {
    this.data.mandiRates = this.data.mandiRates || [];
    const item = this.data.mandiRates.find((m) => m.id === id);
    if (!item) return null;
    if (payload.commodityName !== undefined) item.commodityName = String(payload.commodityName).trim();
    if (payload.mandiName !== undefined) item.mandiName = String(payload.mandiName).trim();
    if (payload.districtName !== undefined) item.districtName = String(payload.districtName).trim();
    if (payload.modalPrice !== undefined) item.modalPrice = Number(payload.modalPrice);
    if (payload.minPrice !== undefined) item.minPrice = Number(payload.minPrice);
    if (payload.maxPrice !== undefined) item.maxPrice = Number(payload.maxPrice);
    item.updatedAt = payload.updatedAt || 'अभी-अभी अपडेट';
    this.save();
    return item;
  }

  async deleteMandiRate(id) {
    this.data.mandiRates = this.data.mandiRates || [];
    const before = this.data.mandiRates.length;
    this.data.mandiRates = this.data.mandiRates.filter((m) => m.id !== id);
    if (this.data.mandiRates.length !== before) {
      this.save();
      return true;
    }
    return false;
  }

  async getReporterByBadge(badgeNumber) {
    const clean = String(badgeNumber || '').trim().toUpperCase();
    return (this.data.reporters || []).find((r) => String(r.badgeNumber || '').toUpperCase() === clean) || null;
  }

  async getAuditLogs() {
    return this.data.auditLogs;
  }

  addAuditLog(actorName, actorRole, actionType, description, req) {
    const ip = req?.headers?.['x-forwarded-for'] || req?.socket?.remoteAddress || '127.0.0.1';
    const logItem = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      actorName: actorName || 'सिस्टम',
      actorRole: actorRole || 'SYSTEM',
      actionType,
      action: actionType,
      description,
      ipAddress: String(ip).split(',')[0].trim(),
      timestamp: new Date().toISOString(),
    };
    this.data.auditLogs.unshift(logItem);
    if (this.data.auditLogs.length > 200) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 200);
    }
    this.save();
    return logItem;
  }

  async getActiveAlert() {
    return this.data.activeAlert;
  }

  async setActiveAlert(alert) {
    this.data.activeAlert = {
      title: alert.title || 'राज्यव्यापी आपात अलर्ट',
      district: alert.district || 'मध्य प्रदेश',
      timestamp: new Date().toISOString(),
    };
    this.save();
    return this.data.activeAlert;
  }

  async getEditorialStats() {
    const all = this.data.articles;
    const pendingReview = all.filter((a) => a.status === 'PENDING_REVIEW').length;
    const underReview = all.filter((a) => a.status === 'UNDER_REVIEW').length;
    const revisionRequested = all.filter((a) => a.status === 'REVISION_REQUESTED').length;
    const published = all.filter((a) => a.status === 'PUBLISHED').length;
    const rejected = all.filter((a) => a.status === 'REJECTED').length;
    const breakingNews = all.filter((a) => a.status === 'PUBLISHED' && a.isBreaking).length;

    return {
      totalIncoming: pendingReview + underReview,
      pendingReview,
      underReview,
      revisionRequested,
      publishedToday: published,
      publishedTotal: published,
      rejected,
      breakingNews,
    };
  }

  // --- User & Identity Management ---
  async getUsers() {
    return this.data.users || [];
  }

  async findUserById(id) {
    const users = this.data.users || [];
    return users.find((u) => u.id === id) || null;
  }

  async findUserByIdentifier(identifier) {
    if (!identifier) return null;
    const users = this.data.users || [];
    const lower = identifier.toLowerCase();
    return (
      users.find(
        (u) =>
          u.identifier?.toLowerCase() === lower ||
          u.email?.toLowerCase() === lower ||
          u.phoneNumber === identifier ||
          u.id === identifier
      ) || null
    );
  }

  async createUser(userData) {
    const users = this.data.users || [];
    const newUser = {
      id: userData.id || `usr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      identifier: userData.identifier || userData.email?.split('@')[0] || `user_${Date.now()}`,
      fullName: userData.fullName || 'Anonymous User',
      email: userData.email || null,
      phoneNumber: userData.phoneNumber || null,
      roles: userData.roles || ['REPORTER'],
      passwordHash: userData.passwordHash || '',
      status: userData.status || 'active',
      mustChangePassword: Boolean(userData.mustChangePassword),
      badgeNumber: userData.badgeNumber || 'BNW-REP-0999',
      createdAt: userData.createdAt || new Date().toISOString(),
    };
    users.push(newUser);
    this.data.users = users;
    await this.storage.queueWrite(this.data);
    return newUser;
  }

  async updateUser(userId, data) {
    if (!userId) return null;
    const users = this.data.users || [];
    const index = users.findIndex((u) => u.id === userId);
    if (index === -1) return null;
    users[index] = {
      ...users[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    this.data.users = users;
    await this.storage.queueWrite(this.data);
    return { ...users[index] };
  }

  // --- Session & Refresh Token Management ---
  async createSession(sessionData) {
    this.data.sessions = this.data.sessions || [];
    const newSession = {
      id: sessionData.id || `sess-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userId: sessionData.userId,
      refreshTokenHash: sessionData.refreshTokenHash || sessionData.tokenHash,
      expiresAt: sessionData.expiresAt instanceof Date ? sessionData.expiresAt.toISOString() : sessionData.expiresAt,
      ipAddress: sessionData.ipAddress || null,
      clientType: sessionData.clientType || null,
      revokedAt: null,
      createdAt: new Date().toISOString(),
    };
    this.data.sessions.push(newSession);
    await this.storage.queueWrite(this.data);
    return newSession;
  }

  async findSessionByTokenHash(refreshTokenHash) {
    if (!refreshTokenHash) return null;
    const sessions = this.data.sessions || [];
    const session = sessions.find((s) => s.refreshTokenHash === refreshTokenHash);
    if (!session) return null;
    const user = await this.findUserById(session.userId);
    return { ...session, user };
  }

  async revokeSession(sessionId) {
    const sessions = this.data.sessions || [];
    const found = sessions.find((s) => s.id === sessionId);
    if (found) {
      found.revokedAt = new Date().toISOString();
      await this.storage.queueWrite(this.data);
      return true;
    }
    return false;
  }

  async revokeAllUserSessions(userId) {
    const sessions = this.data.sessions || [];
    let count = 0;
    const now = new Date().toISOString();
    for (const s of sessions) {
      if (s.userId === userId && !s.revokedAt) {
        s.revokedAt = now;
        count++;
      }
    }
    if (count > 0) {
      await this.storage.queueWrite(this.data);
    }
    return count;
  }

  // --- Graphic Templates Management (GFX-01, GFX-02, GFX-03) ---
  async getGraphicTemplates(params = {}) {
    let list = [...(this.data.graphicTemplates || [])];
    if (params.category && params.category !== 'ALL') {
      list = list.filter((t) => t.category === params.category);
    }
    if (params.aspectRatio && params.aspectRatio !== 'ALL') {
      list = list.filter((t) => t.aspectRatio === params.aspectRatio);
    }
    if (params.activeOnly !== false) {
      list = list.filter((t) => t.isActive !== false);
    }
    return list;
  }

  async getGraphicTemplateById(id) {
    const list = this.data.graphicTemplates || [];
    return list.find((t) => t.id === id) || null;
  }

  async saveGraphicTemplate(templateData, user = null) {
    if (!this.data.graphicTemplates) this.data.graphicTemplates = [];
    const id = templateData.id || `tpl-${Date.now()}`;
    const existingIndex = this.data.graphicTemplates.findIndex((t) => t.id === id);

    const record = {
      ...templateData,
      id,
      updatedAt: new Date().toISOString(),
      createdAt: existingIndex >= 0 ? this.data.graphicTemplates[existingIndex].createdAt : new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      this.data.graphicTemplates[existingIndex] = record;
    } else {
      this.data.graphicTemplates.push(record);
    }
    this.save();
    return record;
  }

  async duplicateGraphicTemplate(id, user = null) {
    const orig = await this.getGraphicTemplateById(id);
    if (!orig) return null;
    const clone = {
      ...orig,
      id: `tpl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: `${orig.title} (प्रतिलिपि)`,
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.graphicTemplates.push(clone);
    this.save();
    return clone;
  }

  async deleteGraphicTemplate(id, user = null) {
    if (!this.data.graphicTemplates) return false;
    const idx = this.data.graphicTemplates.findIndex((t) => t.id === id);
    if (idx === -1) return false;
    this.data.graphicTemplates.splice(idx, 1);
    this.save();
    return true;
  }

  // --- Graphics Asset & Draft Management (GFX-04, GFX-05) ---
  async getGraphics(params = {}, user = null) {
    let list = [...(this.data.graphics || [])];
    if (params.status && params.status !== 'ALL') {
      list = list.filter((g) => g.status === params.status);
    }
    if (params.articleId) {
      list = list.filter((g) => g.articleId === params.articleId);
    }
    if (params.createdBy) {
      list = list.filter((g) => g.createdBy === params.createdBy);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter((g) =>
        (g.title || '').toLowerCase().includes(q) ||
        (g.headline || '').toLowerCase().includes(q) ||
        (g.districtName || '').toLowerCase().includes(q)
      );
    }
    const page = Math.max(1, parseInt(params.page || '1', 10));
    const limit = Math.max(1, parseInt(params.limit || '20', 10));
    const total = list.length;
    const startIndex = (page - 1) * limit;
    const paginated = list.slice(startIndex, startIndex + limit);
    return {
      items: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async getGraphicById(id) {
    const list = this.data.graphics || [];
    return list.find((g) => g.id === id) || null;
  }

  async saveGraphic(graphicData, user = null) {
    if (!this.data.graphics) this.data.graphics = [];
    const id = graphicData.id || `gfx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const existingIndex = this.data.graphics.findIndex((g) => g.id === id);

    const record = {
      ...graphicData,
      id,
      version: existingIndex >= 0 ? (this.data.graphics[existingIndex].version || 1) + 1 : 1,
      updatedAt: new Date().toISOString(),
      createdAt: existingIndex >= 0 ? this.data.graphics[existingIndex].createdAt : new Date().toISOString(),
      createdBy: existingIndex >= 0 ? this.data.graphics[existingIndex].createdBy : (user?.id || 'usr-desk'),
      createdByName: existingIndex >= 0 ? this.data.graphics[existingIndex].createdByName : (user?.fullName || 'संपादकीय डेस्क'),
      createdByRole: existingIndex >= 0 ? this.data.graphics[existingIndex].createdByRole : (user?.roles?.[0] || 'EDITOR'),
    };

    if (existingIndex >= 0) {
      this.data.graphics[existingIndex] = record;
    } else {
      this.data.graphics.unshift(record);
    }
    this.save();
    return record;
  }

  async updateGraphicStatus(id, newStatus, user = null) {
    const gfx = await this.getGraphicById(id);
    if (!gfx) return null;
    gfx.status = newStatus;
    gfx.version = (gfx.version || 1) + 1;
    gfx.updatedAt = new Date().toISOString();
    if (newStatus === 'APPROVED') {
      gfx.approvedBy = user?.id || 'usr-desk-chief';
      gfx.approvedAt = new Date().toISOString();
    }
    this.save();
    return gfx;
  }

  async deleteGraphic(id, user = null) {
    if (!this.data.graphics) return false;
    const idx = this.data.graphics.findIndex((g) => g.id === id);
    if (idx === -1) return false;
    this.data.graphics.splice(idx, 1);
    this.save();
    return true;
  }

  // --- Video Studio Management (VID-001 - VID-015) ---
  async getVideoTemplates(params = {}) {
    let list = [...(this.data.videoTemplates || [])];
    if (params.category && params.category !== 'ALL') {
      list = list.filter((t) => t.category === params.category);
    }
    if (params.aspectRatio && params.aspectRatio !== 'ALL') {
      list = list.filter((t) => t.aspectRatio === params.aspectRatio);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (t) =>
          (t.title || '').toLowerCase().includes(q) ||
          (t.description || '').toLowerCase().includes(q) ||
          (t.category || '').toLowerCase().includes(q)
      );
    }
    return list;
  }

  async getVideoTemplateById(id) {
    const list = this.data.videoTemplates || [];
    return list.find((t) => t.id === id) || null;
  }

  async saveVideoTemplate(templateData, user = null) {
    if (!this.data.videoTemplates) this.data.videoTemplates = [];
    const id = templateData.id || `tpl-vid-${Date.now()}`;
    const existingIndex = this.data.videoTemplates.findIndex((t) => t.id === id);

    const record = {
      ...templateData,
      id,
      updatedAt: new Date().toISOString(),
      createdAt:
        existingIndex >= 0 ? this.data.videoTemplates[existingIndex].createdAt : new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      this.data.videoTemplates[existingIndex] = record;
    } else {
      this.data.videoTemplates.push(record);
    }
    this.save();
    return record;
  }

  async duplicateVideoTemplate(id, user = null) {
    const orig = await this.getVideoTemplateById(id);
    if (!orig) return null;
    const clone = {
      ...orig,
      id: `tpl-vid-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: `${orig.title} (प्रतिलिपि)`,
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.videoTemplates.push(clone);
    this.save();
    return clone;
  }

  async deleteVideoTemplate(id, user = null) {
    if (!this.data.videoTemplates) return false;
    const idx = this.data.videoTemplates.findIndex((t) => t.id === id);
    if (idx === -1) return false;
    this.data.videoTemplates.splice(idx, 1);
    this.save();
    return true;
  }

  async getVideoProjects(params = {}, user = null) {
    let list = [...(this.data.videoProjects || [])];
    if (params.status && params.status !== 'ALL') {
      list = list.filter((p) => p.status === params.status);
    }
    if (params.aspectRatio && params.aspectRatio !== 'ALL') {
      list = list.filter((p) => p.aspectRatio === params.aspectRatio);
    }
    if (params.createdBy) {
      list = list.filter((p) => p.createdBy === params.createdBy);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (p) =>
          (p.title || '').toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q) ||
          (p.districtName || '').toLowerCase().includes(q)
      );
    }

    list.sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
    );

    const page = Math.max(1, parseInt(params.page || '1', 10));
    const limit = Math.max(1, parseInt(params.limit || '20', 10));
    const total = list.length;
    const startIndex = (page - 1) * limit;
    const paginated = list.slice(startIndex, startIndex + limit);

    return {
      items: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async getVideoProjectById(id) {
    const list = this.data.videoProjects || [];
    return list.find((p) => p.id === id) || null;
  }

  async saveVideoProject(projectData, user = null) {
    if (!this.data.videoProjects) this.data.videoProjects = [];
    const id = projectData.id || `vid-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const existingIndex = this.data.videoProjects.findIndex((p) => p.id === id);

    // OCC Check
    if (
      existingIndex >= 0 &&
      projectData.expectedVersion !== undefined &&
      this.data.videoProjects[existingIndex].version !== projectData.expectedVersion
    ) {
      return {
        error: true,
        statusCode: 409,
        code: 'ERR_VERSION_CONFLICT',
        message: 'वीडियो प्रोजेक्ट का संस्करण पुराना है। किसी अन्य उपयोगकर्ता ने इसे हाल ही में अपडेट किया है।',
      };
    }

    const existing = existingIndex >= 0 ? this.data.videoProjects[existingIndex] : null;
    const record = {
      ...(existing || {}),
      ...projectData,
      id,
      version: existing ? (existing.version || 1) + 1 : 1,
      updatedAt: new Date().toISOString(),
      createdAt: existing ? existing.createdAt : new Date().toISOString(),
      createdBy: existing ? existing.createdBy : (user?.id || 'usr-desk'),
      createdByName:
        existing ? existing.createdByName : (user?.fullName || 'संपादकीय डेस्क'),
      createdByRole:
        existing ? existing.createdByRole : (user?.roles?.[0] || 'EDITOR'),
    };

    if (existingIndex >= 0) {
      this.data.videoProjects[existingIndex] = record;
    } else {
      this.data.videoProjects.unshift(record);
    }
    this.save();
    return record;
  }

  async deleteVideoProject(id, user = null) {
    if (!this.data.videoProjects) return false;
    const idx = this.data.videoProjects.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    this.data.videoProjects.splice(idx, 1);
    this.save();
    return true;
  }

  // --- Video Render Queue Management (VID-010, VID-012) ---
  async getVideoRenderJobs(params = {}) {
    let list = [...(this.data.videoRenderJobs || [])];
    if (params.status && params.status !== 'ALL') {
      list = list.filter((j) => j.status === params.status);
    }
    if (params.projectId) {
      list = list.filter((j) => j.projectId === params.projectId);
    }
    list.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return list;
  }

  async getVideoRenderJobById(id) {
    const list = this.data.videoRenderJobs || [];
    return list.find((j) => j.id === id) || null;
  }

  async createVideoRenderJob(jobData, user = null) {
    if (!this.data.videoRenderJobs) this.data.videoRenderJobs = [];
    const id = jobData.id || `job-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const job = {
      ...jobData,
      id,
      status: jobData.status || 'PENDING',
      progressPercent: jobData.progressPercent || 0,
      retryCount: jobData.retryCount || 0,
      createdBy: user?.id || 'usr-desk',
      createdAt: new Date().toISOString(),
    };
    this.data.videoRenderJobs.unshift(job);
    this.save();
    return job;
  }

  async updateVideoRenderJob(id, updates) {
    const job = await this.getVideoRenderJobById(id);
    if (!job) return null;
    Object.assign(job, updates);
    if (updates.status === 'COMPLETED' || updates.status === 'FAILED') {
      job.completedAt = new Date().toISOString();
    }
    this.save();
    return job;
  }

  // --- AI Newsroom & Prompt Management (AGT-PRM-001, AGT-USG-002) ---
  async getAiPrompts(params = {}, user = null) {
    let list = [...(this.data.aiPrompts || [])];
    if (params.category && params.category !== 'ALL') {
      list = list.filter((p) => p.category === params.category);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          (Array.isArray(p.tags) && p.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }
    list.sort((a, b) => (b.sortOrder || 99) - (a.sortOrder || 99) || (a.title || '').localeCompare(b.title || ''));
    return list;
  }

  async getAiPromptById(id) {
    const list = this.data.aiPrompts || [];
    return list.find((p) => p.id === id) || null;
  }

  async saveAiPrompt(promptData, user = null) {
    if (!this.data.aiPrompts) this.data.aiPrompts = [...INITIAL_AI_PROMPTS];
    const id = promptData.id || `prm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const existingIndex = this.data.aiPrompts.findIndex((p) => p.id === id);

    const now = new Date().toISOString();
    const existing = existingIndex >= 0 ? this.data.aiPrompts[existingIndex] : null;
    const record = {
      ...(existing || {}),
      ...promptData,
      id,
      version: existing ? (existing.version || 1) + 1 : 1,
      isDefault: existing?.isDefault ?? false,
      updatedAt: now,
      createdAt: existing?.createdAt || now,
      createdBy: existing?.createdBy || user?.id || 'system',
    };

    if (existingIndex >= 0) {
      this.data.aiPrompts[existingIndex] = record;
    } else {
      this.data.aiPrompts.unshift(record);
    }
    this.save();
    return record;
  }

  async deleteAiPrompt(id, user = null) {
    if (!this.data.aiPrompts) return false;
    const idx = this.data.aiPrompts.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    if (this.data.aiPrompts[idx].isDefault) {
      return { error: true, statusCode: 403, message: 'सिस्टम डिफ़ॉल्ट प्रॉम्ट को हटाया नहीं जा सकता।' };
    }
    this.data.aiPrompts.splice(idx, 1);
    this.save();
    return true;
  }

  async recordAiUsage(usageRecord) {
    if (!this.data.aiUsage) this.data.aiUsage = [];
    const id = usageRecord.id || `usg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const record = {
      ...usageRecord,
      id,
      timestamp: usageRecord.timestamp || new Date().toISOString(),
    };
    this.data.aiUsage.unshift(record);
    if (this.data.aiUsage.length > 5000) {
      this.data.aiUsage = this.data.aiUsage.slice(0, 5000);
    }
    this.save();
    return record;
  }

  async getAiUsageStats(params = {}, user = null) {
    const list = this.data.aiUsage || [];
    let filtered = list;
    if (params.userId) {
      filtered = filtered.filter((u) => u.userId === params.userId);
    }
    if (params.promptCategory) {
      filtered = filtered.filter((u) => u.promptCategory === params.promptCategory);
    }

    const totalCalls = filtered.length;
    const totalTokens = filtered.reduce((sum, u) => sum + (u.totalTokens || 0), 0);
    const totalCostInr = filtered.reduce((sum, u) => sum + (u.estimatedCostInr || 0), 0);
    const callsByCategory = {};
    const callsByProvider = {};

    for (const u of filtered) {
      callsByCategory[u.promptCategory] = (callsByCategory[u.promptCategory] || 0) + 1;
      callsByProvider[u.provider] = (callsByProvider[u.provider] || 0) + 1;
    }

    return {
      totalCalls,
      totalTokens,
      totalCostInr: Number(totalCostInr.toFixed(4)),
      callsByCategory,
      callsByProvider,
      recentRecords: filtered.slice(0, 20),
    };
  }

  async saveAiHistoryItem(item, user = null) {
    if (!this.data.aiHistory) this.data.aiHistory = [];
    const id = item.id || `aih-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const record = {
      ...item,
      id,
      userId: item.userId || user?.id || 'usr-desk',
      userRole: item.userRole || user?.role || 'REPORTER',
      createdAt: item.createdAt || new Date().toISOString(),
      isDraftSaved: Boolean(item.isDraftSaved),
    };
    this.data.aiHistory.unshift(record);
    if (this.data.aiHistory.length > 1000) {
      this.data.aiHistory = this.data.aiHistory.slice(0, 1000);
    }
    this.save();
    return record;
  }

  async getAiHistory(params = {}, user = null) {
    let list = [...(this.data.aiHistory || [])];
    if (params.category && params.category !== 'ALL') {
      list = list.filter((h) => h.category === params.category);
    }
    if (params.userId) {
      list = list.filter((h) => h.userId === params.userId);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (h) =>
          h.headline?.toLowerCase().includes(q) ||
          h.inputSnippet?.toLowerCase().includes(q) ||
          h.district?.toLowerCase().includes(q)
      );
    }
    const page = Math.max(1, parseInt(params.page || 1, 10));
    const limit = Math.min(100, Math.max(1, parseInt(params.limit || 20, 10)));
    const total = list.length;
    const items = list.slice((page - 1) * limit, page * limit);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getAiHistoryById(id) {
    const list = this.data.aiHistory || [];
    return list.find((h) => h.id === id) || null;
  }

  async deleteAiHistoryItem(id, user = null) {
    if (!this.data.aiHistory) return false;
    const idx = this.data.aiHistory.findIndex((h) => h.id === id);
    if (idx === -1) return false;
    this.data.aiHistory.splice(idx, 1);
    this.save();
    return true;
  }

  // =========================================================================
  // MASTER EXECUTION 024: API POOL & THIRD-PARTY INTEGRATIONS PERSISTENCE
  // =========================================================================

  // 1. API Provider Registry
  async getApiProviders(category = null, user = null) {
    let list = [...(this.data.apiProviders || [])];
    if (category) {
      list = list.filter((p) => p.category === category);
    }
    return list;
  }

  async getApiProviderById(id, user = null) {
    const list = this.data.apiProviders || [];
    return list.find((p) => p.id === id || p.providerId === id) || null;
  }

  async saveApiProvider(providerData, user = null) {
    if (!this.data.apiProviders) this.data.apiProviders = [...CANONICAL_SEED_PROVIDERS];
    const id = providerData.id || `prov-${providerData.providerId}-${Date.now()}`;
    const idx = this.data.apiProviders.findIndex((p) => p.id === id || p.providerId === providerData.providerId);
    const now = new Date().toISOString();

    const record = {
      ...(idx >= 0 ? this.data.apiProviders[idx] : {}),
      ...providerData,
      id,
      updatedAt: now,
      createdAt: idx >= 0 ? this.data.apiProviders[idx].createdAt : now,
    };

    if (idx >= 0) {
      this.data.apiProviders[idx] = record;
    } else {
      this.data.apiProviders.push(record);
    }
    this.save();
    return record;
  }

  async deleteApiProvider(id, user = null) {
    if (!this.data.apiProviders) return false;
    const idx = this.data.apiProviders.findIndex((p) => p.id === id || p.providerId === id);
    if (idx === -1) return false;
    this.data.apiProviders.splice(idx, 1);
    this.save();
    return true;
  }

  // 2. RSS & News Sources Management
  async getRssSources(params = {}, user = null) {
    let list = [...(this.data.newsSources || [])];
    if (params.status && params.status !== 'all') {
      list = list.filter((s) => s.status === params.status);
    }
    if (params.category && params.category !== 'all') {
      list = list.filter((s) => s.sourceCategory === params.category);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter((s) => s.name?.toLowerCase().includes(q) || s.feedUrl?.toLowerCase().includes(q));
    }
    return {
      items: list,
      total: list.length,
    };
  }

  async getRssSourceById(id, user = null) {
    const list = this.data.newsSources || [];
    return list.find((s) => s.id === id) || null;
  }

  async saveRssSource(sourceData, user = null) {
    if (!this.data.newsSources) this.data.newsSources = [...INITIAL_NEWS_SOURCES];
    const id = sourceData.id || `src-rss-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const idx = this.data.newsSources.findIndex((s) => s.id === id);
    const now = new Date().toISOString();

    const record = {
      ...(idx >= 0 ? this.data.newsSources[idx] : {}),
      ...sourceData,
      id,
      updatedAt: now,
      createdAt: idx >= 0 ? this.data.newsSources[idx].createdAt : now,
    };

    if (idx >= 0) {
      this.data.newsSources[idx] = record;
    } else {
      this.data.newsSources.push(record);
    }
    this.save();
    return record;
  }

  async deleteRssSource(id, user = null) {
    if (!this.data.newsSources) return false;
    const idx = this.data.newsSources.findIndex((s) => s.id === id);
    if (idx === -1) return false;
    this.data.newsSources.splice(idx, 1);
    this.save();
    return true;
  }

  // 3. RSS Imported Wire Items & Deduplication
  async getRssItems(params = {}, user = null) {
    let list = [...(this.data.rssImportedItems || [])];
    if (params.sourceId) {
      list = list.filter((i) => i.rssSourceId === params.sourceId);
    }
    if (params.status) {
      list = list.filter((i) => i.status === params.status);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter((i) => i.originalTitle?.toLowerCase().includes(q) || i.originalSummary?.toLowerCase().includes(q));
    }
    const page = Math.max(1, parseInt(params.page || 1, 10));
    const limit = Math.min(100, Math.max(1, parseInt(params.limit || 20, 10)));
    const total = list.length;
    const items = list.slice((page - 1) * limit, page * limit);
    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getRssItemById(id, user = null) {
    const list = this.data.rssImportedItems || [];
    return list.find((i) => i.id === id) || null;
  }

  async hasRssItemHash(guidHash) {
    const list = this.data.rssImportedItems || [];
    return list.some((i) => i.guidHash === guidHash);
  }

  async saveRssItem(itemData, user = null) {
    if (!this.data.rssImportedItems) this.data.rssImportedItems = [];
    const id = itemData.id || `rss-item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const idx = this.data.rssImportedItems.findIndex((i) => i.id === id);

    const record = {
      ...(idx >= 0 ? this.data.rssImportedItems[idx] : {}),
      ...itemData,
      id,
    };

    if (idx >= 0) {
      this.data.rssImportedItems[idx] = record;
    } else {
      this.data.rssImportedItems.unshift(record);
    }
    if (this.data.rssImportedItems.length > 2000) {
      this.data.rssImportedItems = this.data.rssImportedItems.slice(0, 2000);
    }
    this.save();
    return record;
  }

  async updateRssItemStatus(id, status, generatedNewsId = null, user = null) {
    const item = await this.getRssItemById(id, user);
    if (!item) return null;
    item.status = status;
    if (generatedNewsId) item.generatedNewsId = generatedNewsId;
    this.save();
    return item;
  }

  // 4. Social Media Accounts
  async getSocialAccounts(platform = null, user = null) {
    let list = [...(this.data.socialAccounts || [])];
    if (platform) {
      list = list.filter((a) => a.platform === platform);
    }
    return list;
  }

  async getSocialAccountById(id, user = null) {
    const list = this.data.socialAccounts || [];
    return list.find((a) => a.id === id) || null;
  }

  async saveSocialAccount(accountData, user = null) {
    if (!this.data.socialAccounts) this.data.socialAccounts = [...INITIAL_SOCIAL_ACCOUNTS];
    const id = accountData.id || `acc-${accountData.platform}-${Date.now()}`;
    const idx = this.data.socialAccounts.findIndex((a) => a.id === id);
    const now = new Date().toISOString();

    const record = {
      ...(idx >= 0 ? this.data.socialAccounts[idx] : {}),
      ...accountData,
      id,
      updatedAt: now,
      createdAt: idx >= 0 ? this.data.socialAccounts[idx].createdAt : now,
    };

    if (idx >= 0) {
      this.data.socialAccounts[idx] = record;
    } else {
      this.data.socialAccounts.push(record);
    }
    this.save();
    return record;
  }

  async deleteSocialAccount(id, user = null) {
    if (!this.data.socialAccounts) return false;
    const idx = this.data.socialAccounts.findIndex((a) => a.id === id);
    if (idx === -1) return false;
    this.data.socialAccounts.splice(idx, 1);
    this.save();
    return true;
  }

  // 5. Social Media Publishing Jobs
  async getSocialPublishingJobs(status = null, user = null) {
    let list = [...(this.data.socialPublishingJobs || [])];
    if (status && status !== 'ALL') {
      list = list.filter((j) => j.status === status);
    }
    return list;
  }

  async getSocialPublishingJobById(id, user = null) {
    const list = this.data.socialPublishingJobs || [];
    return list.find((j) => j.id === id) || null;
  }

  async saveSocialPublishingJob(jobData, user = null) {
    if (!this.data.socialPublishingJobs) this.data.socialPublishingJobs = [];
    const id = jobData.id || `job-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const idx = this.data.socialPublishingJobs.findIndex((j) => j.id === id);
    const now = new Date().toISOString();

    const record = {
      ...(idx >= 0 ? this.data.socialPublishingJobs[idx] : {}),
      ...jobData,
      id,
      updatedAt: now,
      createdAt: idx >= 0 ? this.data.socialPublishingJobs[idx].createdAt : now,
    };

    if (idx >= 0) {
      this.data.socialPublishingJobs[idx] = record;
    } else {
      this.data.socialPublishingJobs.unshift(record);
    }
    this.save();
    return record;
  }

  // 6. WhatsApp Business Platform
  async getWhatsAppTemplates(user = null) {
    return [...(this.data.whatsappTemplates || [])];
  }

  async getWhatsAppTemplateById(id, user = null) {
    const list = this.data.whatsappTemplates || [];
    return list.find((t) => t.id === id || t.name === id) || null;
  }

  async saveWhatsAppTemplate(templateData, user = null) {
    if (!this.data.whatsappTemplates) this.data.whatsappTemplates = [...INITIAL_WHATSAPP_TEMPLATES];
    const id = templateData.id || `tpl-wa-${Date.now()}`;
    const idx = this.data.whatsappTemplates.findIndex((t) => t.id === id || t.name === templateData.name);
    const now = new Date().toISOString();

    const record = {
      ...(idx >= 0 ? this.data.whatsappTemplates[idx] : {}),
      ...templateData,
      id,
      updatedAt: now,
      createdAt: idx >= 0 ? this.data.whatsappTemplates[idx].createdAt : now,
    };

    if (idx >= 0) {
      this.data.whatsappTemplates[idx] = record;
    } else {
      this.data.whatsappTemplates.push(record);
    }
    this.save();
    return record;
  }

  async getWhatsAppSubscribers(params = {}, user = null) {
    let list = [...(this.data.whatsappSubscribers || [])];
    if (params.status) {
      list = list.filter((s) => s.status === params.status);
    }
    if (params.district) {
      list = list.filter((s) => s.district === params.district);
    }
    return list;
  }

  async getWhatsAppSubscriberByPhone(phone) {
    const list = this.data.whatsappSubscribers || [];
    const clean = String(phone).replace(/[^0-9+]/g, '');
    return list.find((s) => s.phoneNumber === clean) || null;
  }

  async saveWhatsAppSubscriber(subData, user = null) {
    if (!this.data.whatsappSubscribers) this.data.whatsappSubscribers = [...INITIAL_WHATSAPP_SUBSCRIBERS];
    const cleanPhone = String(subData.phoneNumber).replace(/[^0-9+]/g, '');
    const idx = this.data.whatsappSubscribers.findIndex((s) => s.phoneNumber === cleanPhone);

    const record = {
      ...(idx >= 0 ? this.data.whatsappSubscribers[idx] : {}),
      ...subData,
      phoneNumber: cleanPhone,
      id: subData.id || (idx >= 0 ? this.data.whatsappSubscribers[idx].id : `sub-wa-${Date.now()}`),
    };

    if (idx >= 0) {
      this.data.whatsappSubscribers[idx] = record;
    } else {
      this.data.whatsappSubscribers.unshift(record);
    }
    this.save();
    return record;
  }

  // 7. Webhooks & Ingress Logs
  async getWebhooks(user = null) {
    return [...(this.data.webhooks || [])];
  }

  async getWebhookById(id, user = null) {
    const list = this.data.webhooks || [];
    return list.find((w) => w.id === id || w.providerId === id) || null;
  }

  async saveWebhook(webhookData, user = null) {
    if (!this.data.webhooks) this.data.webhooks = [];
    const id = webhookData.id || `wh-${Date.now()}`;
    const idx = this.data.webhooks.findIndex((w) => w.id === id || w.providerId === webhookData.providerId);
    const now = new Date().toISOString();

    const record = {
      ...(idx >= 0 ? this.data.webhooks[idx] : {}),
      ...webhookData,
      id,
      updatedAt: now,
      createdAt: idx >= 0 ? this.data.webhooks[idx].createdAt : now,
    };

    if (idx >= 0) {
      this.data.webhooks[idx] = record;
    } else {
      this.data.webhooks.push(record);
    }
    this.save();
    return record;
  }

  async getWebhookLogs(limit = 100, user = null) {
    const list = this.data.webhookLogs || [];
    return list.slice(0, Math.min(limit, 500));
  }

  async saveWebhookLog(logData, user = null) {
    if (!this.data.webhookLogs) this.data.webhookLogs = [];
    const id = logData.id || `wh-log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const record = {
      ...logData,
      id,
      receivedAt: logData.receivedAt || new Date().toISOString(),
    };
    this.data.webhookLogs.unshift(record);
    if (this.data.webhookLogs.length > 2000) {
      this.data.webhookLogs = this.data.webhookLogs.slice(0, 2000);
    }
    this.save();
    return record;
  }

  // --- Video Studio Management (VID-001 - VID-015) ---
  async getVideoTemplates(params = {}) {
    let list = [...(this.data.videoTemplates || [])];
    if (params.category && params.category !== 'ALL') {
      list = list.filter((t) => t.category === params.category);
    }
    if (params.aspectRatio && params.aspectRatio !== 'ALL') {
      list = list.filter((t) => t.aspectRatio === params.aspectRatio);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (t) =>
          (t.title || '').toLowerCase().includes(q) ||
          (t.description || '').toLowerCase().includes(q) ||
          (t.category || '').toLowerCase().includes(q)
      );
    }
    return list;
  }

  async getVideoTemplateById(id) {
    const list = this.data.videoTemplates || [];
    return list.find((t) => t.id === id) || null;
  }

  async saveVideoTemplate(templateData, user = null) {
    if (!this.data.videoTemplates) this.data.videoTemplates = [];
    const id = templateData.id || `tpl-vid-${Date.now()}`;
    const existingIndex = this.data.videoTemplates.findIndex((t) => t.id === id);

    const record = {
      ...templateData,
      id,
      updatedAt: new Date().toISOString(),
      createdAt:
        existingIndex >= 0 ? this.data.videoTemplates[existingIndex].createdAt : new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      this.data.videoTemplates[existingIndex] = record;
    } else {
      this.data.videoTemplates.push(record);
    }
    this.save();
    return record;
  }

  async duplicateVideoTemplate(id, user = null) {
    const orig = await this.getVideoTemplateById(id);
    if (!orig) return null;
    const clone = {
      ...orig,
      id: `tpl-vid-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: `${orig.title} (प्रतिलिपि)`,
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.videoTemplates.push(clone);
    this.save();
    return clone;
  }

  async deleteVideoTemplate(id, user = null) {
    if (!this.data.videoTemplates) return false;
    const idx = this.data.videoTemplates.findIndex((t) => t.id === id);
    if (idx === -1) return false;
    this.data.videoTemplates.splice(idx, 1);
    this.save();
    return true;
  }

  async getVideoProjects(params = {}, user = null) {
    let list = [...(this.data.videoProjects || [])];
    if (params.status && params.status !== 'ALL') {
      list = list.filter((p) => p.status === params.status);
    }
    if (params.aspectRatio && params.aspectRatio !== 'ALL') {
      list = list.filter((p) => p.aspectRatio === params.aspectRatio);
    }
    if (params.createdBy) {
      list = list.filter((p) => p.createdBy === params.createdBy);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (p) =>
          (p.title || '').toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q) ||
          (p.districtName || '').toLowerCase().includes(q)
      );
    }

    list.sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
    );

    const page = Math.max(1, parseInt(params.page || '1', 10));
    const limit = Math.max(1, parseInt(params.limit || '20', 10));
    const total = list.length;
    const startIndex = (page - 1) * limit;
    const paginated = list.slice(startIndex, startIndex + limit);

    return {
      items: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async getVideoProjectById(id) {
    const list = this.data.videoProjects || [];
    return list.find((p) => p.id === id) || null;
  }

  async saveVideoProject(projectData, user = null) {
    if (!this.data.videoProjects) this.data.videoProjects = [];
    const id = projectData.id || `vid-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const existingIndex = this.data.videoProjects.findIndex((p) => p.id === id);

    // OCC Check
    if (
      existingIndex >= 0 &&
      projectData.expectedVersion !== undefined &&
      this.data.videoProjects[existingIndex].version !== projectData.expectedVersion
    ) {
      return {
        error: true,
        statusCode: 409,
        code: 'ERR_VERSION_CONFLICT',
        message: 'वीडियो प्रोजेक्ट का संस्करण पुराना है। किसी अन्य उपयोगकर्ता ने इसे हाल ही में अपडेट किया है।',
      };
    }

    const existing = existingIndex >= 0 ? this.data.videoProjects[existingIndex] : null;
    const record = {
      ...(existing || {}),
      ...projectData,
      id,
      version: existing ? (existing.version || 1) + 1 : 1,
      updatedAt: new Date().toISOString(),
      createdAt: existing ? existing.createdAt : new Date().toISOString(),
      createdBy: existing ? existing.createdBy : (user?.id || 'usr-desk'),
      createdByName:
        existing ? existing.createdByName : (user?.fullName || 'संपादकीय डेस्क'),
      createdByRole:
        existing ? existing.createdByRole : (user?.roles?.[0] || 'EDITOR'),
    };

    if (existingIndex >= 0) {
      this.data.videoProjects[existingIndex] = record;
    } else {
      this.data.videoProjects.unshift(record);
    }
    this.save();
    return record;
  }

  async deleteVideoProject(id, user = null) {
    if (!this.data.videoProjects) return false;
    const idx = this.data.videoProjects.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    this.data.videoProjects.splice(idx, 1);
    this.save();
    return true;
  }

  // --- Video Render Queue Management (VID-010, VID-012) ---
  async getVideoRenderJobs(params = {}) {
    let list = [...(this.data.videoRenderJobs || [])];
    if (params.status && params.status !== 'ALL') {
      list = list.filter((j) => j.status === params.status);
    }
    if (params.projectId) {
      list = list.filter((j) => j.projectId === params.projectId);
    }
    list.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return list;
  }

  async getVideoRenderJobById(id) {
    const list = this.data.videoRenderJobs || [];
    return list.find((j) => j.id === id) || null;
  }

  async createVideoRenderJob(jobData, user = null) {
    if (!this.data.videoRenderJobs) this.data.videoRenderJobs = [];
    const id = jobData.id || `job-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const job = {
      ...jobData,
      id,
      status: jobData.status || 'PENDING',
      progressPercent: jobData.progressPercent || 0,
      retryCount: jobData.retryCount || 0,
      createdBy: user?.id || 'usr-desk',
      createdAt: new Date().toISOString(),
    };
    this.data.videoRenderJobs.unshift(job);
    this.save();
    return job;
  }

  async updateVideoRenderJob(id, updates) {
    const job = await this.getVideoRenderJobById(id);
    if (!job) return null;
    Object.assign(job, updates);
    if (updates.status === 'COMPLETED' || updates.status === 'FAILED') {
      job.completedAt = new Date().toISOString();
    }
    this.save();
    return job;
  }

  // --- AI Newsroom & Prompt Management (AGT-PRM-001, AGT-USG-002) ---
  async getAiPrompts(params = {}, user = null) {
    let list = [...(this.data.aiPrompts || [])];
    if (params.category && params.category !== 'ALL') {
      list = list.filter((p) => p.category === params.category);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          (Array.isArray(p.tags) && p.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }
    list.sort((a, b) => (b.sortOrder || 99) - (a.sortOrder || 99) || (a.title || '').localeCompare(b.title || ''));
    return list;
  }

  async getAiPromptById(id) {
    const list = this.data.aiPrompts || [];
    return list.find((p) => p.id === id) || null;
  }

  async saveAiPrompt(promptData, user = null) {
    if (!this.data.aiPrompts) this.data.aiPrompts = [...INITIAL_AI_PROMPTS];
    const id = promptData.id || `prm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const existingIndex = this.data.aiPrompts.findIndex((p) => p.id === id);

    const now = new Date().toISOString();
    const existing = existingIndex >= 0 ? this.data.aiPrompts[existingIndex] : null;
    const record = {
      ...(existing || {}),
      ...promptData,
      id,
      version: existing ? (existing.version || 1) + 1 : 1,
      isDefault: existing?.isDefault ?? false,
      updatedAt: now,
      createdAt: existing?.createdAt || now,
      createdBy: existing?.createdBy || user?.id || 'system',
    };

    if (existingIndex >= 0) {
      this.data.aiPrompts[existingIndex] = record;
    } else {
      this.data.aiPrompts.unshift(record);
    }
    this.save();
    return record;
  }

  async deleteAiPrompt(id, user = null) {
    if (!this.data.aiPrompts) return false;
    const idx = this.data.aiPrompts.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    if (this.data.aiPrompts[idx].isDefault) {
      return { error: true, statusCode: 403, message: 'सिस्टम डिफ़ॉल्ट प्रॉम्ट को हटाया नहीं जा सकता।' };
    }
    this.data.aiPrompts.splice(idx, 1);
    this.save();
    return true;
  }

  async recordAiUsage(usageRecord) {
    if (!this.data.aiUsage) this.data.aiUsage = [];
    const id = usageRecord.id || `usg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const record = {
      ...usageRecord,
      id,
      timestamp: usageRecord.timestamp || new Date().toISOString(),
    };
    this.data.aiUsage.unshift(record);
    if (this.data.aiUsage.length > 5000) {
      this.data.aiUsage = this.data.aiUsage.slice(0, 5000);
    }
    this.save();
    return record;
  }

  async getAiUsageStats(params = {}, user = null) {
    const list = this.data.aiUsage || [];
    let filtered = list;
    if (params.userId) {
      filtered = filtered.filter((u) => u.userId === params.userId);
    }
    if (params.promptCategory) {
      filtered = filtered.filter((u) => u.promptCategory === params.promptCategory);
    }

    const totalCalls = filtered.length;
    const totalTokens = filtered.reduce((sum, u) => sum + (u.totalTokens || 0), 0);
    const totalCostInr = filtered.reduce((sum, u) => sum + (u.estimatedCostInr || 0), 0);
    const callsByCategory = {};
    const callsByProvider = {};

    for (const u of filtered) {
      callsByCategory[u.promptCategory] = (callsByCategory[u.promptCategory] || 0) + 1;
      callsByProvider[u.provider] = (callsByProvider[u.provider] || 0) + 1;
    }

    return {
      totalCalls,
      totalTokens,
      totalCostInr: Number(totalCostInr.toFixed(4)),
      callsByCategory,
      callsByProvider,
      recentRecords: filtered.slice(0, 20),
    };
  }

  async saveAiHistoryItem(item, user = null) {
    if (!this.data.aiHistory) this.data.aiHistory = [];
    const id = item.id || `aih-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const record = {
      ...item,
      id,
      userId: item.userId || user?.id || 'usr-desk',
      userRole: item.userRole || user?.role || 'REPORTER',
      createdAt: item.createdAt || new Date().toISOString(),
      isDraftSaved: Boolean(item.isDraftSaved),
    };
    this.data.aiHistory.unshift(record);
    if (this.data.aiHistory.length > 1000) {
      this.data.aiHistory = this.data.aiHistory.slice(0, 1000);
    }
    this.save();
    return record;
  }

  async getAiHistory(params = {}, user = null) {
    let list = [...(this.data.aiHistory || [])];
    if (params.category && params.category !== 'ALL') {
      list = list.filter((h) => h.category === params.category);
    }
    if (params.userId) {
      list = list.filter((h) => h.userId === params.userId);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (h) =>
          h.headline?.toLowerCase().includes(q) ||
          h.inputSnippet?.toLowerCase().includes(q) ||
          h.district?.toLowerCase().includes(q)
      );
    }
    const page = Math.max(1, parseInt(params.page || 1, 10));
    const limit = Math.min(100, Math.max(1, parseInt(params.limit || 20, 10)));
    const total = list.length;
    const items = list.slice((page - 1) * limit, page * limit);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getAiHistoryById(id) {
    const list = this.data.aiHistory || [];
    return list.find((h) => h.id === id) || null;
  }

  async deleteAiHistoryItem(id, user = null) {
    if (!this.data.aiHistory) return false;
    const idx = this.data.aiHistory.findIndex((h) => h.id === id);
    if (idx === -1) return false;
    this.data.aiHistory.splice(idx, 1);
    this.save();
    return true;
  }

  // =========================================================================
  // MASTER EXECUTION 024: API POOL & THIRD-PARTY INTEGRATIONS PERSISTENCE
  // =========================================================================

  // 1. API Provider Registry
  async getApiProviders(category = null, user = null) {
    let list = [...(this.data.apiProviders || [])];
    if (category) {
      list = list.filter((p) => p.category === category);
    }
    return list;
  }

  async getApiProviderById(id, user = null) {
    const list = this.data.apiProviders || [];
    return list.find((p) => p.id === id || p.providerId === id) || null;
  }

  async saveApiProvider(providerData, user = null) {
    if (!this.data.apiProviders) this.data.apiProviders = [...CANONICAL_SEED_PROVIDERS];
    const id = providerData.id || `prov-${providerData.providerId}-${Date.now()}`;
    const idx = this.data.apiProviders.findIndex((p) => p.id === id || p.providerId === providerData.providerId);
    const now = new Date().toISOString();

    const record = {
      ...(idx >= 0 ? this.data.apiProviders[idx] : {}),
      ...providerData,
      id,
      updatedAt: now,
      createdAt: idx >= 0 ? this.data.apiProviders[idx].createdAt : now,
    };

    if (idx >= 0) {
      this.data.apiProviders[idx] = record;
    } else {
      this.data.apiProviders.push(record);
    }
    this.save();
    return record;
  }

  async deleteApiProvider(id, user = null) {
    if (!this.data.apiProviders) return false;
    const idx = this.data.apiProviders.findIndex((p) => p.id === id || p.providerId === id);
    if (idx === -1) return false;
    this.data.apiProviders.splice(idx, 1);
    this.save();
    return true;
  }

  // 2. RSS & News Sources Management
  async getRssSources(params = {}, user = null) {
    let list = [...(this.data.newsSources || [])];
    if (params.status && params.status !== 'all') {
      list = list.filter((s) => s.status === params.status);
    }
    if (params.category && params.category !== 'all') {
      list = list.filter((s) => s.sourceCategory === params.category);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter((s) => s.name?.toLowerCase().includes(q) || s.feedUrl?.toLowerCase().includes(q));
    }
    return {
      items: list,
      total: list.length,
    };
  }

  async getRssSourceById(id, user = null) {
    const list = this.data.newsSources || [];
    return list.find((s) => s.id === id) || null;
  }

  async saveRssSource(sourceData, user = null) {
    if (!this.data.newsSources) this.data.newsSources = [...INITIAL_NEWS_SOURCES];
    const id = sourceData.id || `src-rss-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const idx = this.data.newsSources.findIndex((s) => s.id === id);
    const now = new Date().toISOString();

    const record = {
      ...(idx >= 0 ? this.data.newsSources[idx] : {}),
      ...sourceData,
      id,
      updatedAt: now,
      createdAt: idx >= 0 ? this.data.newsSources[idx].createdAt : now,
    };

    if (idx >= 0) {
      this.data.newsSources[idx] = record;
    } else {
      this.data.newsSources.push(record);
    }
    this.save();
    return record;
  }

  async deleteRssSource(id, user = null) {
    if (!this.data.newsSources) return false;
    const idx = this.data.newsSources.findIndex((s) => s.id === id);
    if (idx === -1) return false;
    this.data.newsSources.splice(idx, 1);
    this.save();
    return true;
  }

  // 3. RSS Imported Wire Items & Deduplication
  async getRssItems(params = {}, user = null) {
    let list = [...(this.data.rssImportedItems || [])];
    if (params.sourceId) {
      list = list.filter((i) => i.rssSourceId === params.sourceId);
    }
    if (params.status) {
      list = list.filter((i) => i.status === params.status);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter((i) => i.originalTitle?.toLowerCase().includes(q) || i.originalSummary?.toLowerCase().includes(q));
    }
    const page = Math.max(1, parseInt(params.page || 1, 10));
    const limit = Math.min(100, Math.max(1, parseInt(params.limit || 20, 10)));
    const total = list.length;
    const items = list.slice((page - 1) * limit, page * limit);
    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getRssItemById(id, user = null) {
    const list = this.data.rssImportedItems || [];
    return list.find((i) => i.id === id) || null;
  }

  async hasRssItemHash(guidHash) {
    const list = this.data.rssImportedItems || [];
    return list.some((i) => i.guidHash === guidHash);
  }

  async saveRssItem(itemData, user = null) {
    if (!this.data.rssImportedItems) this.data.rssImportedItems = [];
    const id = itemData.id || `rss-item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const idx = this.data.rssImportedItems.findIndex((i) => i.id === id);

    const record = {
      ...(idx >= 0 ? this.data.rssImportedItems[idx] : {}),
      ...itemData,
      id,
    };

    if (idx >= 0) {
      this.data.rssImportedItems[idx] = record;
    } else {
      this.data.rssImportedItems.unshift(record);
    }
    if (this.data.rssImportedItems.length > 2000) {
      this.data.rssImportedItems = this.data.rssImportedItems.slice(0, 2000);
    }
    this.save();
    return record;
  }

  async updateRssItemStatus(id, status, generatedNewsId = null, user = null) {
    const item = await this.getRssItemById(id, user);
    if (!item) return null;
    item.status = status;
    if (generatedNewsId) item.generatedNewsId = generatedNewsId;
    this.save();
    return item;
  }

  // 4. Social Media Accounts
  async getSocialAccounts(platform = null, user = null) {
    let list = [...(this.data.socialAccounts || [])];
    if (platform) {
      list = list.filter((a) => a.platform === platform);
    }
    return list;
  }

  async getSocialAccountById(id, user = null) {
    const list = this.data.socialAccounts || [];
    return list.find((a) => a.id === id) || null;
  }

  async saveSocialAccount(accountData, user = null) {
    if (!this.data.socialAccounts) this.data.socialAccounts = [...INITIAL_SOCIAL_ACCOUNTS];
    const id = accountData.id || `acc-${accountData.platform}-${Date.now()}`;
    const idx = this.data.socialAccounts.findIndex((a) => a.id === id);
    const now = new Date().toISOString();

    const record = {
      ...(idx >= 0 ? this.data.socialAccounts[idx] : {}),
      ...accountData,
      id,
      updatedAt: now,
      createdAt: idx >= 0 ? this.data.socialAccounts[idx].createdAt : now,
    };

    if (idx >= 0) {
      this.data.socialAccounts[idx] = record;
    } else {
      this.data.socialAccounts.push(record);
    }
    this.save();
    return record;
  }

  async deleteSocialAccount(id, user = null) {
    if (!this.data.socialAccounts) return false;
    const idx = this.data.socialAccounts.findIndex((a) => a.id === id);
    if (idx === -1) return false;
    this.data.socialAccounts.splice(idx, 1);
    this.save();
    return true;
  }

  // 5. Social Media Publishing Jobs
  async getSocialPublishingJobs(status = null, user = null) {
    let list = [...(this.data.socialPublishingJobs || [])];
    if (status && status !== 'ALL') {
      list = list.filter((j) => j.status === status);
    }
    return list;
  }

  async getSocialPublishingJobById(id, user = null) {
    const list = this.data.socialPublishingJobs || [];
    return list.find((j) => j.id === id) || null;
  }

  async saveSocialPublishingJob(jobData, user = null) {
    if (!this.data.socialPublishingJobs) this.data.socialPublishingJobs = [];
    const id = jobData.id || `job-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const idx = this.data.socialPublishingJobs.findIndex((j) => j.id === id);
    const now = new Date().toISOString();

    const record = {
      ...(idx >= 0 ? this.data.socialPublishingJobs[idx] : {}),
      ...jobData,
      id,
      updatedAt: now,
      createdAt: idx >= 0 ? this.data.socialPublishingJobs[idx].createdAt : now,
    };

    if (idx >= 0) {
      this.data.socialPublishingJobs[idx] = record;
    } else {
      this.data.socialPublishingJobs.unshift(record);
    }
    this.save();
    return record;
  }

  // 6. WhatsApp Business Platform
  async getWhatsAppTemplates(user = null) {
    return [...(this.data.whatsappTemplates || [])];
  }

  async getWhatsAppTemplateById(id, user = null) {
    const list = this.data.whatsappTemplates || [];
    return list.find((t) => t.id === id || t.name === id) || null;
  }

  async saveWhatsAppTemplate(templateData, user = null) {
    if (!this.data.whatsappTemplates) this.data.whatsappTemplates = [...INITIAL_WHATSAPP_TEMPLATES];
    const id = templateData.id || `tpl-wa-${Date.now()}`;
    const idx = this.data.whatsappTemplates.findIndex((t) => t.id === id || t.name === templateData.name);
    const now = new Date().toISOString();

    const record = {
      ...(idx >= 0 ? this.data.whatsappTemplates[idx] : {}),
      ...templateData,
      id,
      updatedAt: now,
      createdAt: idx >= 0 ? this.data.whatsappTemplates[idx].createdAt : now,
    };

    if (idx >= 0) {
      this.data.whatsappTemplates[idx] = record;
    } else {
      this.data.whatsappTemplates.push(record);
    }
    this.save();
    return record;
  }

  async getWhatsAppSubscribers(params = {}, user = null) {
    let list = [...(this.data.whatsappSubscribers || [])];
    if (params.status) {
      list = list.filter((s) => s.status === params.status);
    }
    if (params.district) {
      list = list.filter((s) => s.district === params.district);
    }
    return list;
  }

  async getWhatsAppSubscriberByPhone(phone) {
    const list = this.data.whatsappSubscribers || [];
    const clean = String(phone).replace(/[^0-9+]/g, '');
    return list.find((s) => s.phoneNumber === clean) || null;
  }

  async saveWhatsAppSubscriber(subData, user = null) {
    if (!this.data.whatsappSubscribers) this.data.whatsappSubscribers = [...INITIAL_WHATSAPP_SUBSCRIBERS];
    const cleanPhone = String(subData.phoneNumber).replace(/[^0-9+]/g, '');
    const idx = this.data.whatsappSubscribers.findIndex((s) => s.phoneNumber === cleanPhone);

    const record = {
      ...(idx >= 0 ? this.data.whatsappSubscribers[idx] : {}),
      ...subData,
      phoneNumber: cleanPhone,
      id: subData.id || (idx >= 0 ? this.data.whatsappSubscribers[idx].id : `sub-wa-${Date.now()}`),
    };

    if (idx >= 0) {
      this.data.whatsappSubscribers[idx] = record;
    } else {
      this.data.whatsappSubscribers.unshift(record);
    }
    this.save();
    return record;
  }

  // 7. Webhooks & Ingress Logs
  async getWebhooks(user = null) {
    return [...(this.data.webhooks || [])];
  }

  async getWebhookById(id, user = null) {
    const list = this.data.webhooks || [];
    return list.find((w) => w.id === id || w.providerId === id) || null;
  }

  async saveWebhook(webhookData, user = null) {
    if (!this.data.webhooks) this.data.webhooks = [];
    const id = webhookData.id || `wh-${Date.now()}`;
    const idx = this.data.webhooks.findIndex((w) => w.id === id || w.providerId === webhookData.providerId);
    const now = new Date().toISOString();

    const record = {
      ...(idx >= 0 ? this.data.webhooks[idx] : {}),
      ...webhookData,
      id,
      updatedAt: now,
      createdAt: idx >= 0 ? this.data.webhooks[idx].createdAt : now,
    };

    if (idx >= 0) {
      this.data.webhooks[idx] = record;
    } else {
      this.data.webhooks.push(record);
    }
    this.save();
    return record;
  }

  async getWebhookLogs(limit = 100, user = null) {
    const list = this.data.webhookLogs || [];
    return list.slice(0, Math.min(limit, 500));
  }

  async saveWebhookLog(logData, user = null) {
    if (!this.data.webhookLogs) this.data.webhookLogs = [];
    const id = logData.id || `wh-log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const record = {
      ...logData,
      id,
      receivedAt: logData.receivedAt || new Date().toISOString(),
    };
    this.data.webhookLogs.unshift(record);
    if (this.data.webhookLogs.length > 2000) {
      this.data.webhookLogs = this.data.webhookLogs.slice(0, 2000);
    }
    this.save();
    return record;
  }

  // -------------------------------------------------------------
  // MONETIZATION: Subscriptions
  // -------------------------------------------------------------
  async getSubscriptionPlans(user = null) {
    return this.data.subscriptionPlans || [];
  }

  async getSubscriptionPlanById(id, user = null) {
    const list = this.data.subscriptionPlans || [];
    return list.find((p) => p.id === id || p.code === id) || null;
  }

  async saveSubscriptionPlan(plan, user = null) {
    if (!this.data.subscriptionPlans) this.data.subscriptionPlans = [];
    const id = plan.id || `sub-plan-${Date.now()}`;
    const idx = this.data.subscriptionPlans.findIndex((p) => p.id === id || p.code === plan.code);
    const now = new Date().toISOString();
    const record = {
      ...(idx >= 0 ? this.data.subscriptionPlans[idx] : {}),
      ...plan,
      id,
      updatedAt: now,
      createdAt: idx >= 0 ? this.data.subscriptionPlans[idx].createdAt : now,
    };
    if (idx >= 0) {
      this.data.subscriptionPlans[idx] = record;
    } else {
      this.data.subscriptionPlans.push(record);
    }
    this.save();
    return record;
  }

  async getCustomerSubscriptions(user = null) {
    return this.data.customerSubscriptions || [];
  }

  async getCustomerSubscriptionById(id, user = null) {
    const list = this.data.customerSubscriptions || [];
    return list.find((s) => s.id === id) || null;
  }

  async getCustomerSubscriptionsByUserId(userId, user = null) {
    const list = this.data.customerSubscriptions || [];
    return list.filter((s) => s.userId === userId);
  }

  async saveCustomerSubscription(sub, user = null) {
    if (!this.data.customerSubscriptions) this.data.customerSubscriptions = [];
    const id = sub.id || `sub-${Date.now()}`;
    const idx = this.data.customerSubscriptions.findIndex((s) => s.id === id);
    const now = new Date().toISOString();
    const record = {
      ...(idx >= 0 ? this.data.customerSubscriptions[idx] : {}),
      ...sub,
      id,
      updatedAt: now,
      createdAt: idx >= 0 ? this.data.customerSubscriptions[idx].createdAt : now,
    };
    if (idx >= 0) {
      this.data.customerSubscriptions[idx] = record;
    } else {
      this.data.customerSubscriptions.unshift(record);
    }
    this.save();
    return record;
  }

  // -------------------------------------------------------------
  // MONETIZATION: Payments & Orders
  // -------------------------------------------------------------
  async getPaymentOrders(user = null) {
    return this.data.paymentOrders || [];
  }

  async getPaymentOrderById(id, user = null) {
    const list = this.data.paymentOrders || [];
    return list.find((o) => o.id === id || o.orderNumber === id || o.providerOrderId === id) || null;
  }

  async savePaymentOrder(order, user = null) {
    if (!this.data.paymentOrders) this.data.paymentOrders = [];
    const id = order.id || `pord-${Date.now()}`;
    const idx = this.data.paymentOrders.findIndex((o) => o.id === id || o.orderNumber === order.orderNumber);
    const now = new Date().toISOString();
    const record = {
      ...(idx >= 0 ? this.data.paymentOrders[idx] : {}),
      ...order,
      id,
      updatedAt: now,
      createdAt: idx >= 0 ? this.data.paymentOrders[idx].createdAt : now,
    };
    if (idx >= 0) {
      this.data.paymentOrders[idx] = record;
    } else {
      this.data.paymentOrders.unshift(record);
    }
    this.save();
    return record;
  }

  async getTransactions(user = null) {
    return this.data.transactions || [];
  }

  async getTransactionById(id, user = null) {
    const list = this.data.transactions || [];
    return list.find((t) => t.id === id || t.transactionNumber === id || t.providerPaymentId === id) || null;
  }

  async saveTransaction(txn, user = null) {
    if (!this.data.transactions) this.data.transactions = [];
    const id = txn.id || `txn-${Date.now()}`;
    const idx = this.data.transactions.findIndex((t) => t.id === id || t.transactionNumber === txn.transactionNumber);
    const now = new Date().toISOString();
    const record = {
      ...(idx >= 0 ? this.data.transactions[idx] : {}),
      ...txn,
      id,
      updatedAt: now,
      createdAt: idx >= 0 ? this.data.transactions[idx].createdAt : now,
    };
    if (idx >= 0) {
      this.data.transactions[idx] = record;
    } else {
      this.data.transactions.unshift(record);
    }
    this.save();
    return record;
  }

  async getRefunds(user = null) {
    return this.data.refunds || [];
  }

  async getRefundById(id, user = null) {
    const list = this.data.refunds || [];
    return list.find((r) => r.id === id || r.refundNumber === id) || null;
  }

  async saveRefund(refund, user = null) {
    if (!this.data.refunds) this.data.refunds = [];
    const id = refund.id || `ref-${Date.now()}`;
    const idx = this.data.refunds.findIndex((r) => r.id === id);
    const now = new Date().toISOString();
    const record = {
      ...(idx >= 0 ? this.data.refunds[idx] : {}),
      ...refund,
      id,
      updatedAt: now,
      createdAt: idx >= 0 ? this.data.refunds[idx].createdAt : now,
    };
    if (idx >= 0) {
      this.data.refunds[idx] = record;
    } else {
      this.data.refunds.unshift(record);
    }
    this.save();
    return record;
  }

  // -------------------------------------------------------------
  // MONETIZATION: Advertisers & Campaigns
  // -------------------------------------------------------------
  async getAdvertisers(user = null) {
    return this.data.advertisers || [];
  }

  async getAdvertiserById(id, user = null) {
    const list = this.data.advertisers || [];
    return list.find((a) => a.id === id) || null;
  }

  async saveAdvertiser(adv, user = null) {
    if (!this.data.advertisers) this.data.advertisers = [];
    const id = adv.id || `adv-${Date.now()}`;
    const idx = this.data.advertisers.findIndex((a) => a.id === id);
    const now = new Date().toISOString();
    const record = {
      ...(idx >= 0 ? this.data.advertisers[idx] : {}),
      ...adv,
      id,
      updatedAt: now,
      createdAt: idx >= 0 ? this.data.advertisers[idx].createdAt : now,
    };
    if (idx >= 0) {
      this.data.advertisers[idx] = record;
    } else {
      this.data.advertisers.unshift(record);
    }
    this.save();
    return record;
  }

  async getCampaigns(user = null) {
    return this.data.campaigns || [];
  }

  async getCampaignById(id, user = null) {
    const list = this.data.campaigns || [];
    return list.find((c) => c.id === id) || null;
  }

  async getCampaignsByAdvertiserId(advertiserId, user = null) {
    const list = this.data.campaigns || [];
    return list.filter((c) => c.advertiserId === advertiserId);
  }

  async saveCampaign(campaign, user = null) {
    if (!this.data.campaigns) this.data.campaigns = [];
    const id = campaign.id || `cmp-${Date.now()}`;
    const idx = this.data.campaigns.findIndex((c) => c.id === id);
    const now = new Date().toISOString();
    const record = {
      ...(idx >= 0 ? this.data.campaigns[idx] : {}),
      ...campaign,
      id,
      updatedAt: now,
      createdAt: idx >= 0 ? this.data.campaigns[idx].createdAt : now,
    };
    if (idx >= 0) {
      this.data.campaigns[idx] = record;
    } else {
      this.data.campaigns.unshift(record);
    }
    this.save();
    return record;
  }

  // -------------------------------------------------------------
  // MONETIZATION: Sponsored Content
  // -------------------------------------------------------------
  async getSponsoredArticles(user = null) {
    return this.data.sponsoredContent || [];
  }

  async getSponsoredArticleById(id, user = null) {
    const list = this.data.sponsoredContent || [];
    return list.find((s) => s.id === id) || null;
  }

  async saveSponsoredArticle(article, user = null) {
    if (!this.data.sponsoredContent) this.data.sponsoredContent = [];
    const id = article.id || `spon-${Date.now()}`;
    const idx = this.data.sponsoredContent.findIndex((s) => s.id === id);
    const now = new Date().toISOString();
    const record = {
      ...(idx >= 0 ? this.data.sponsoredContent[idx] : {}),
      ...article,
      id,
      updatedAt: now,
      createdAt: idx >= 0 ? this.data.sponsoredContent[idx].createdAt : now,
    };
    if (idx >= 0) {
      this.data.sponsoredContent[idx] = record;
    } else {
      this.data.sponsoredContent.unshift(record);
    }
    this.save();
    return record;
  }

  // -------------------------------------------------------------
  // MONETIZATION: CRM (Notes & Proposals)
  // -------------------------------------------------------------
  async getCrmNotes(advertiserId, user = null) {
    const list = this.data.crmNotes || [];
    if (!advertiserId) return list;
    return list.filter((n) => n.advertiserId === advertiserId);
  }

  async getCrmNotesByAdvertiserId(advertiserId, user = null) {
    return this.getCrmNotes(advertiserId, user);
  }

  async saveCrmNote(note, user = null) {
    if (!this.data.crmNotes) this.data.crmNotes = [];
    const id = note.id || `crm-note-${Date.now()}`;
    const idx = this.data.crmNotes.findIndex((n) => n.id === id);
    const now = new Date().toISOString();
    const record = {
      ...(idx >= 0 ? this.data.crmNotes[idx] : {}),
      ...note,
      id,
      createdAt: idx >= 0 ? this.data.crmNotes[idx].createdAt : now,
    };
    if (idx >= 0) {
      this.data.crmNotes[idx] = record;
    } else {
      this.data.crmNotes.unshift(record);
    }
    this.save();
    return record;
  }

  async getCrmProposals(advertiserId, user = null) {
    const list = this.data.crmProposals || [];
    if (!advertiserId) return list;
    return list.filter((p) => p.advertiserId === advertiserId);
  }

  async getCrmProposalById(id, user = null) {
    const list = this.data.crmProposals || [];
    return list.find((p) => p.id === id || p.proposalNumber === id) || null;
  }

  async saveCrmProposal(proposal, user = null) {
    if (!this.data.crmProposals) this.data.crmProposals = [];
    const id = proposal.id || `prop-${Date.now()}`;
    const idx = this.data.crmProposals.findIndex((p) => p.id === id || p.proposalNumber === proposal.proposalNumber);
    const now = new Date().toISOString();
    const record = {
      ...(idx >= 0 ? this.data.crmProposals[idx] : {}),
      ...proposal,
      id,
      updatedAt: now,
      createdAt: idx >= 0 ? this.data.crmProposals[idx].createdAt : now,
    };
    if (idx >= 0) {
      this.data.crmProposals[idx] = record;
    } else {
      this.data.crmProposals.unshift(record);
    }
    this.save();
    return record;
  }

  // -------------------------------------------------------------
  // MONETIZATION: Invoices & Financial Records
  // -------------------------------------------------------------
  async getInvoices(user = null) {
    return this.data.invoices || [];
  }

  async getInvoiceById(id, user = null) {
    const list = this.data.invoices || [];
    return list.find((i) => i.id === id || i.invoiceNumber === id) || null;
  }

  async saveInvoice(invoice, user = null) {
    if (!this.data.invoices) this.data.invoices = [];
    const id = invoice.id || `inv-${Date.now()}`;
    const idx = this.data.invoices.findIndex((i) => i.id === id || i.invoiceNumber === invoice.invoiceNumber);
    const now = new Date().toISOString();
    const record = {
      ...(idx >= 0 ? this.data.invoices[idx] : {}),
      ...invoice,
      id,
      updatedAt: now,
      createdAt: idx >= 0 ? this.data.invoices[idx].createdAt : now,
    };
    if (idx >= 0) {
      this.data.invoices[idx] = record;
    } else {
      this.data.invoices.unshift(record);
    }
    this.save();
    return record;
  }

  async getFinancialAuditLogs(limit = 100, user = null) {
    const list = this.data.financialAuditLogs || [];
    return list.slice(0, Math.min(limit, 500));
  }

  async saveFinancialAuditLog(logData, user = null) {
    if (!this.data.financialAuditLogs) this.data.financialAuditLogs = [];
    const id = logData.id || `fin-log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const record = {
      ...logData,
      id,
      timestamp: logData.timestamp || new Date().toISOString(),
    };
    this.data.financialAuditLogs.unshift(record);
    if (this.data.financialAuditLogs.length > 2000) {
      this.data.financialAuditLogs = this.data.financialAuditLogs.slice(0, 2000);
    }
    this.save();
    return record;
  }

  async appendFinancialAuditLog(logData, user = null) {
    return this.saveFinancialAuditLog(logData, user);
  }

  // -------------------------------------------------------------
  // AUDIENCE & ENGAGEMENT INTELLIGENCE: User Preferences & DPDPA
  // -------------------------------------------------------------
  async getUserPreferences(userId, user = null) {
    if (!this.data.userPreferences) this.data.userPreferences = {};
    return this.data.userPreferences[userId] || null;
  }

  async saveUserPreferences(userId, prefs, user = null) {
    if (!this.data.userPreferences) this.data.userPreferences = {};
    const record = {
      ...(this.data.userPreferences[userId] || {}),
      ...prefs,
      userId,
      updatedAt: new Date().toISOString(),
    };
    this.data.userPreferences[userId] = record;
    this.save();
    return record;
  }

  // -------------------------------------------------------------
  // AUDIENCE & ENGAGEMENT: Bookmarks
  // -------------------------------------------------------------
  async getBookmarks(userId, options = {}, user = null) {
    const list = this.data.bookmarks || [];
    if (!userId) return list;
    return list.filter((b) => b.userId === userId);
  }

  async saveBookmark(bookmark, user = null) {
    if (!this.data.bookmarks) this.data.bookmarks = [];
    const id = bookmark.id || `bm-${Date.now()}`;
    const idx = this.data.bookmarks.findIndex((b) => b.userId === bookmark.userId && b.articleId === bookmark.articleId);
    const record = {
      ...(idx >= 0 ? this.data.bookmarks[idx] : {}),
      ...bookmark,
      id,
      createdAt: idx >= 0 ? this.data.bookmarks[idx].createdAt : new Date().toISOString(),
    };
    if (idx >= 0) {
      this.data.bookmarks[idx] = record;
    } else {
      this.data.bookmarks.unshift(record);
    }
    this.save();
    return record;
  }

  async deleteBookmark(userId, articleId, user = null) {
    if (!this.data.bookmarks) return false;
    const initialLen = this.data.bookmarks.length;
    this.data.bookmarks = this.data.bookmarks.filter(
      (b) => !(b.userId === userId && b.articleId === articleId)
    );
    const deleted = this.data.bookmarks.length < initialLen;
    if (deleted) this.save();
    return deleted;
  }

  // -------------------------------------------------------------
  // AUDIENCE & ENGAGEMENT: Reading History
  // -------------------------------------------------------------
  async getReadingHistory(userId, limit = 50, user = null) {
    const list = this.data.readingHistory || [];
    if (!userId) return list.slice(0, limit);
    return list.filter((h) => h.userId === userId).slice(0, limit);
  }

  async saveReadingHistory(historyRecord, user = null) {
    if (!this.data.readingHistory) this.data.readingHistory = [];
    const id = historyRecord.id || `rh-${Date.now()}`;
    const record = { ...historyRecord, id };
    this.data.readingHistory.unshift(record);
    if (this.data.readingHistory.length > 5000) {
      this.data.readingHistory = this.data.readingHistory.slice(0, 5000);
    }
    this.save();
    return record;
  }

  async clearReadingHistory(userId, user = null) {
    if (!this.data.readingHistory || !userId) return false;
    this.data.readingHistory = this.data.readingHistory.filter((h) => h.userId !== userId);
    this.save();
    return true;
  }

  // -------------------------------------------------------------
  // AUDIENCE & ENGAGEMENT: Followed Topics & Districts
  // -------------------------------------------------------------
  async getFollowedTopics(userId, user = null) {
    const list = this.data.followedTopics || [];
    if (!userId) return list;
    return list.filter((t) => t.userId === userId);
  }

  async saveFollowedTopic(record, user = null) {
    if (!this.data.followedTopics) this.data.followedTopics = [];
    const exists = this.data.followedTopics.some((t) => t.userId === record.userId && t.topic === record.topic);
    if (!exists) {
      this.data.followedTopics.push(record);
      this.save();
    }
    return record;
  }

  async deleteFollowedTopic(userId, topic, user = null) {
    if (!this.data.followedTopics) return false;
    const initialLen = this.data.followedTopics.length;
    this.data.followedTopics = this.data.followedTopics.filter(
      (t) => !(t.userId === userId && t.topic === topic)
    );
    const deleted = this.data.followedTopics.length < initialLen;
    if (deleted) this.save();
    return deleted;
  }

  async getFollowedDistricts(userId, user = null) {
    const list = this.data.followedDistricts || [];
    if (!userId) return list;
    return list.filter((d) => d.userId === userId);
  }

  async saveFollowedDistrict(record, user = null) {
    if (!this.data.followedDistricts) this.data.followedDistricts = [];
    const exists = this.data.followedDistricts.some((d) => d.userId === record.userId && d.district === record.district);
    if (!exists) {
      this.data.followedDistricts.push(record);
      this.save();
    }
    return record;
  }

  async deleteFollowedDistrict(userId, district, user = null) {
    if (!this.data.followedDistricts) return false;
    const initialLen = this.data.followedDistricts.length;
    this.data.followedDistricts = this.data.followedDistricts.filter(
      (d) => !(d.userId === userId && d.district === district)
    );
    const deleted = this.data.followedDistricts.length < initialLen;
    if (deleted) this.save();
    return deleted;
  }

  // -------------------------------------------------------------
  // AUDIENCE & ENGAGEMENT: Notifications
  // -------------------------------------------------------------
  async getNotifications(recipientId = null, options = {}, user = null) {
    const list = this.data.notifications || [];
    if (!recipientId || recipientId === 'ALL') return list;
    return list.filter((n) => n.recipientId === 'ALL' || n.recipientId === recipientId);
  }

  async createNotification(notification, user = null) {
    if (!this.data.notifications) this.data.notifications = [];
    const id = notification.id || `notif-${Date.now()}`;
    const record = {
      recipientId: 'ALL',
      isRead: false,
      ...notification,
      id,
      createdAt: notification.createdAt || new Date().toISOString(),
    };
    this.data.notifications.unshift(record);
    if (this.data.notifications.length > 2000) {
      this.data.notifications = this.data.notifications.slice(0, 2000);
    }
    this.save();
    return { ...record };
  }

  async markNotificationRead(id, recipientId = null, user = null) {
    if (!this.data.notifications) return null;
    const item = this.data.notifications.find((n) => n.id === id);
    if (item) {
      item.isRead = true;
      item.readAt = new Date().toISOString();
      this.save();
      return { ...item };
    }
    return null;
  }

  async markAllNotificationsRead(recipientId, user = null) {
    if (!this.data.notifications) return { updatedCount: 0 };
    let count = 0;
    for (const n of this.data.notifications) {
      if (recipientId === 'ALL' || n.recipientId === recipientId || n.recipientId === 'ALL') {
        if (!n.isRead) {
          n.isRead = true;
          n.readAt = new Date().toISOString();
          count++;
        }
      }
    }
    if (count > 0) this.save();
    return { updatedCount: count };
  }

  // -------------------------------------------------------------
  // AUDIENCE & ENGAGEMENT: Reader Feedback & Corrections
  // -------------------------------------------------------------
  async getReaderFeedback(filters = {}, user = null) {
    let list = [...(this.data.readerFeedback || [])];
    if (filters.status) list = list.filter((f) => f.status === filters.status);
    if (filters.category) list = list.filter((f) => f.category === filters.category);
    if (filters.userId) list = list.filter((f) => f.userId === filters.userId);
    return list;
  }

  async getReaderFeedbackById(id, user = null) {
    const list = this.data.readerFeedback || [];
    return list.find((f) => f.id === id) || null;
  }

  async saveReaderFeedback(feedback, user = null) {
    if (!this.data.readerFeedback) this.data.readerFeedback = [];
    const id = feedback.id || `fb-${Date.now()}`;
    const idx = this.data.readerFeedback.findIndex((f) => f.id === id);
    const now = new Date().toISOString();
    const record = {
      ...(idx >= 0 ? this.data.readerFeedback[idx] : {}),
      ...feedback,
      id,
      updatedAt: now,
      createdAt: idx >= 0 ? this.data.readerFeedback[idx].createdAt : now,
    };
    if (idx >= 0) {
      this.data.readerFeedback[idx] = record;
    } else {
      this.data.readerFeedback.unshift(record);
    }
    this.save();
    return record;
  }

  // -------------------------------------------------------------
  // AUDIENCE & ENGAGEMENT: Community Comments
  // -------------------------------------------------------------
  async getComments(filters = {}, user = null) {
    let list = [...(this.data.comments || [])];
    if (filters.articleId) list = list.filter((c) => c.articleId === filters.articleId);
    if (filters.status) list = list.filter((c) => c.status === filters.status);
    return list;
  }

  async getCommentById(id, user = null) {
    const list = this.data.comments || [];
    return list.find((c) => c.id === id) || null;
  }

  async saveComment(comment, user = null) {
    if (!this.data.comments) this.data.comments = [];
    const id = comment.id || `cmt-${Date.now()}`;
    const idx = this.data.comments.findIndex((c) => c.id === id);
    const now = new Date().toISOString();
    const record = {
      ...(idx >= 0 ? this.data.comments[idx] : {}),
      ...comment,
      id,
      updatedAt: now,
      createdAt: idx >= 0 ? this.data.comments[idx].createdAt : now,
    };
    if (idx >= 0) {
      this.data.comments[idx] = record;
    } else {
      this.data.comments.unshift(record);
    }
    this.save();
    return record;
  }

  async deleteComment(id, user = null) {
    if (!this.data.comments) return false;
    const initialLen = this.data.comments.length;
    this.data.comments = this.data.comments.filter((c) => c.id !== id);
    const deleted = this.data.comments.length < initialLen;
    if (deleted) this.save();
    return deleted;
  }

  // -------------------------------------------------------------
  // AUDIENCE & ENGAGEMENT: Audience Segments
  // -------------------------------------------------------------
  async getAudienceSegments(user = null) {
    return this.data.audienceSegments || [];
  }

  async getAudienceSegmentById(id, user = null) {
    const list = this.data.audienceSegments || [];
    return list.find((s) => s.id === id || s.code === id) || null;
  }

  async saveAudienceSegment(segment, user = null) {
    if (!this.data.audienceSegments) this.data.audienceSegments = [];
    const id = segment.id || `seg-${Date.now()}`;
    const idx = this.data.audienceSegments.findIndex((s) => s.id === id || s.code === segment.code);
    const now = new Date().toISOString();
    const record = {
      ...(idx >= 0 ? this.data.audienceSegments[idx] : {}),
      ...segment,
      id,
      updatedAt: now,
      createdAt: idx >= 0 ? this.data.audienceSegments[idx].createdAt : now,
    };
    if (idx >= 0) {
      this.data.audienceSegments[idx] = record;
    } else {
      this.data.audienceSegments.push(record);
    }
    this.save();
    return record;
  }

  // -------------------------------------------------------------
  // AUDIENCE & ENGAGEMENT: DPDPA Deletion Requests & Telemetry
  // -------------------------------------------------------------
  async saveDeletionRequest(record, user = null) {
    if (!this.data.deletionRequests) this.data.deletionRequests = [];
    this.data.deletionRequests.unshift(record);
    this.save();
    return record;
  }

  async recordEngagementEvent(event, user = null) {
    if (!this.data.engagementEvents) this.data.engagementEvents = [];
    const id = event.id || `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const record = { ...event, id, timestamp: event.timestamp || new Date().toISOString() };
    this.data.engagementEvents.unshift(record);
    if (this.data.engagementEvents.length > 5000) {
      this.data.engagementEvents = this.data.engagementEvents.slice(0, 5000);
    }
    this.save();
    return record;
  }

  async getEngagementEvents(filters = {}, user = null) {
    let list = [...(this.data.engagementEvents || [])];
    if (filters.eventName) list = list.filter((e) => e.eventName === filters.eventName);
    if (filters.userId) list = list.filter((e) => e.userId === filters.userId);
    return list.slice(0, filters.limit || 500);
  }

  // =============================================================
  // E-PAPER MANAGEMENT SYSTEM PERSISTENCE METHODS (Step 2 - 12)
  // =============================================================

  async getEpaperEditions(params = {}) {
    let list = [...(this.data.epaperEditions || [])];

    if (params.status && params.status !== 'all') {
      const norm = String(params.status).toUpperCase();
      if (norm === 'PUBLISHED') {
        const publishedEditionIdsWithSnapshots = new Set(
          (this.data.epaperEditionVersions || []).map((v) => v.editionId)
        );
        list = list.filter(
          (e) => String(e.status).toUpperCase() === 'PUBLISHED' || publishedEditionIdsWithSnapshots.has(e.id)
        );
      } else {
        list = list.filter((e) => String(e.status).toUpperCase() === norm);
      }
    }
    if (params.year && params.year !== 'all') {
      const y = String(params.year).trim();
      list = list.filter((e) => {
        const d = String(e.publicationDate || e.createdAt || '');
        return d.startsWith(y) || d.includes(`-${y}-`) || d.includes(y);
      });
    }
    if (params.month && params.month !== 'all') {
      const m = String(params.month).padStart(2, '0');
      list = list.filter((e) => {
        const d = String(e.publicationDate || '');
        const parts = d.split('-');
        return parts.length >= 2 && parts[1] === m;
      });
    }
    if (params.date || params.publicationDate) {
      const d = params.date || params.publicationDate;
      list = list.filter((e) => e.publicationDate === d);
    }
    if (params.editionType && params.editionType !== 'all') {
      const t = String(params.editionType).toUpperCase();
      list = list.filter((e) => String(e.editionType || 'DAILY').toUpperCase() === t);
    }
    if (params.divisionId && params.divisionId !== 'all') {
      list = list.filter((e) => e.divisionId === params.divisionId);
    }
    if (params.districtId && params.districtId !== 'all') {
      list = list.filter((e) => e.districtId === params.districtId);
    }
    if (params.search) {
      const q = String(params.search).toLowerCase().trim();
      list = list.filter((e) =>
        (e.title && e.title.toLowerCase().includes(q)) ||
        (e.editionCode && e.editionCode.toLowerCase().includes(q)) ||
        (e.districtName && e.districtName.toLowerCase().includes(q))
      );
    }

    list.sort((a, b) => {
      const dateA = new Date(a.publicationDate || a.createdAt || 0).getTime();
      const dateB = new Date(b.publicationDate || b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    const page = Math.max(1, parseInt(params.page || '1', 10));
    const limit = Math.max(1, parseInt(params.limit || '20', 10));
    const total = list.length;
    const startIndex = (page - 1) * limit;
    const paged = list.slice(startIndex, startIndex + limit);

    return {
      editions: paged,
      items: paged,
      total,
      count: paged.length,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getEpaperEditionById(id) {
    const list = this.data.epaperEditions || [];
    return list.find((e) => e.id === id) || null;
  }

  async getEpaperEditionByCode(editionCode) {
    const list = this.data.epaperEditions || [];
    return list.find((e) => e.editionCode === editionCode) || null;
  }

  async getLatestEpaperEdition(districtId = null) {
    let list = (this.data.epaperEditions || []).filter((e) => e.status === 'PUBLISHED');
    if (districtId) {
      const districtSpecific = list.filter((e) => e.districtId === districtId);
      if (districtSpecific.length > 0) list = districtSpecific;
    }
    list.sort((a, b) => new Date(b.publicationDate || b.createdAt || 0).getTime() - new Date(a.publicationDate || a.createdAt || 0).getTime());
    return list[0] || null;
  }

  async createEpaperEditionWithPages(editionData, user = null) {
    this.data.epaperEditions = this.data.epaperEditions || [];
    this.data.epaperPages = this.data.epaperPages || [];

    const publicationDate = editionData.publicationDate || new Date().toISOString().split('T')[0];
    const editionType = editionData.editionType || 'DAILY';
    const totalPages = editionType === 'DAILY' ? 12 : Math.min(48, Math.max(1, parseInt(editionData.totalPages || '4', 10)));
    const districtId = editionData.districtId || 'dist-bhopal';
    const distSlug = districtId.replace(/^dist-/, '').toUpperCase();
    const cleanDate = publicationDate.replace(/-/g, '');
    const seq = String(this.data.epaperEditions.filter((e) => e.publicationDate === publicationDate && e.districtId === districtId).length + 1).padStart(2, '0');
    const editionCode = editionData.editionCode || `EP-${cleanDate}-${distSlug}-${seq}`;
    const id = editionData.id || `ep-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const pageCanonicalSections = [
      { pageNumber: 1, sectionType: 'FRONT_PAGE', pageTitle: 'प्रथम पृष्ठ (मुख्य समाचार)', gridColumns: 8, templateId: 'tpl-epaper-01-front' },
      { pageNumber: 2, sectionType: 'STATE', pageTitle: 'मध्य प्रदेश प्रादेशिक (भाग 1)', gridColumns: 8, templateId: 'tpl-epaper-02-state' },
      { pageNumber: 3, sectionType: 'STATE', pageTitle: 'मध्य प्रदेश प्रादेशिक (भाग 2)', gridColumns: 8, templateId: 'tpl-epaper-03-bhopal' },
      { pageNumber: 4, sectionType: 'EDITORIAL', pageTitle: 'संपादकीय एवं विचार (Op-Ed)', gridColumns: 6, templateId: 'tpl-epaper-04-editorial' },
      { pageNumber: 5, sectionType: 'DISTRICT_FOCUS', pageTitle: 'जिला समाचार - फोकस', gridColumns: 8, templateId: 'tpl-epaper-05-district' },
      { pageNumber: 6, sectionType: 'NATIONAL', pageTitle: 'राष्ट्रीय एवं अंतरराष्ट्रीय समाचार', gridColumns: 8, templateId: 'tpl-epaper-06-national' },
      { pageNumber: 7, sectionType: 'BUSINESS', pageTitle: 'व्यापार, अर्थव्यवस्था एवं मंडी भाव', gridColumns: 8, templateId: 'tpl-epaper-08-business' },
      { pageNumber: 8, sectionType: 'DISTRICT_FOCUS', pageTitle: 'किसान एवं ग्रामीण विकास', gridColumns: 8, templateId: 'tpl-epaper-07-agri' },
      { pageNumber: 9, sectionType: 'STATE', pageTitle: 'शिक्षा, रोजगार एवं करियर', gridColumns: 8, templateId: 'tpl-epaper-10-education' },
      { pageNumber: 10, sectionType: 'SPORTS', pageTitle: 'खेल जगत (Sports)', gridColumns: 8, templateId: 'tpl-epaper-09-sports' },
      { pageNumber: 11, sectionType: 'ENTERTAINMENT', pageTitle: 'मनोरंजन, कला एवं संस्कृति', gridColumns: 8, templateId: 'tpl-epaper-11-features' },
      { pageNumber: 12, sectionType: 'FRONT_PAGE', pageTitle: 'अंतिम पृष्ठ / विशेष परिशिष्ट', gridColumns: 8, templateId: 'tpl-epaper-12-back' },
    ];

    const createdPages = [];
    for (let i = 1; i <= totalPages; i++) {
      const preset = pageCanonicalSections[i - 1] || {
        pageNumber: i,
        sectionType: 'SPECIAL',
        pageTitle: `पृष्ठ ${i} (विशेष)`,
        gridColumns: 8,
        templateId: undefined,
      };
      const pageId = `page-${id}-${i}`;
      const pageRecord = {
        id: pageId,
        editionId: id,
        pageNumber: i,
        pageTitle: preset.pageTitle,
        sectionType: preset.sectionType,
        templateId: preset.templateId,
        gridColumns: preset.gridColumns,
        elements: [],
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      createdPages.push(pageRecord);
      this.data.epaperPages.push(pageRecord);
    }

    const editionRecord = {
      id,
      editionCode,
      title: editionData.title || `${distSlug} दैनिक ई-पेपर`,
      publicationDate,
      editionType,
      status: 'DRAFT',
      totalPages,
      pages: createdPages.map((p) => p.id),
      divisionId: editionData.divisionId,
      divisionName: editionData.divisionName,
      districtId,
      districtName: editionData.districtName,
      thumbnailUrl: editionData.thumbnailUrl,
      pdfUrl: editionData.pdfUrl,
      createdBy: user?.id || 'usr-desk',
      createdByName: user?.fullName || 'संपादकीय डेस्क',
      createdByRole: user?.roles?.[0] || 'EDITOR',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.data.epaperEditions.unshift(editionRecord);
    this.save();
    return { edition: editionRecord, pages: createdPages };
  }

  async saveEpaperEdition(editionData, user = null, options = {}) {
    this.data.epaperEditions = this.data.epaperEditions || [];
    const id = editionData.id || `ep-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const existingIndex = this.data.epaperEditions.findIndex((e) => e.id === id);

    // OCC Check
    const expected = editionData.expectedVersion !== undefined 
      ? editionData.expectedVersion 
      : (options?.expectedVersion !== undefined ? options.expectedVersion : (editionData.version !== undefined ? editionData.version : undefined));

    if (existingIndex >= 0 && expected !== undefined) {
      const curVersion = this.data.epaperEditions[existingIndex].version || 1;
      if (curVersion !== Number(expected)) {
        const conflictRes = {
          error: true,
          statusCode: 409,
          code: 'ERR_VERSION_CONFLICT',
          message: `संस्करण विरोध (OCC Conflict): वर्तमान संस्करण ${curVersion} है, प्राप्त संस्करण ${expected} है।`,
          currentVersion: curVersion,
          expectedVersion: expected,
        };
        if (options?.throwOnError) {
          const err = new Error(conflictRes.message);
          err.statusCode = 409;
          err.code = 'ERR_VERSION_CONFLICT';
          throw err;
        }
        return conflictRes;
      }
    }

    const existing = existingIndex >= 0 ? this.data.epaperEditions[existingIndex] : null;
    const record = {
      ...(existing || {}),
      ...editionData,
      id,
      version: existing ? (existing.version || 1) + 1 : 1,
      updatedAt: new Date().toISOString(),
      createdAt: existing ? existing.createdAt : new Date().toISOString(),
      createdBy: existing ? existing.createdBy : (user?.id || 'usr-desk'),
      createdByName: existing ? existing.createdByName : (user?.fullName || 'संपादकीय डेस्क'),
      createdByRole: existing ? existing.createdByRole : (user?.roles?.[0] || 'EDITOR'),
    };

    // Backend Invariant: Enforce authoritative 12 pages for DAILY; preserve independent page counts for SPECIAL
    if (record.editionType === 'DAILY' || !record.editionType) {
      record.editionType = 'DAILY';
      record.totalPages = 12;
    } else if (record.editionType === 'SPECIAL') {
      const parsedPages = parseInt(record.totalPages, 10);
      record.totalPages = Number.isInteger(parsedPages) ? Math.min(48, Math.max(1, parsedPages)) : (existing?.totalPages || 4);
    }

    if (existingIndex >= 0) {
      this.data.epaperEditions[existingIndex] = record;
    } else {
      this.data.epaperEditions.unshift(record);
    }
    this.save();
    return record;
  }

  async updateEpaperEditionStatus(editionId, targetStatus, user = null, expectedVersion = undefined, remarks = '') {
    const existing = await this.getEpaperEditionById(editionId);
    if (!existing) {
      return {
        error: true,
        statusCode: 404,
        code: 'ERR_NOT_FOUND',
        message: 'ई-पेपर संस्करण नहीं मिला।',
      };
    }

    const updates = { status: targetStatus };
    if (remarks) updates.remarks = remarks;
    if (targetStatus === 'PUBLISHED') {
      updates.publishedAt = new Date().toISOString();
      updates.publishedBy = user?.fullName || 'संपादक';
    } else if (targetStatus === 'ARCHIVED') {
      updates.archivedAt = new Date().toISOString();
    }

    return this.saveEpaperEdition({ ...existing, ...updates, expectedVersion }, user);
  }

  async deleteEpaperEdition(id, user = null) {
    if (!this.data.epaperEditions) return false;
    const idx = this.data.epaperEditions.findIndex((e) => e.id === id);
    if (idx < 0) return false;

    this.data.epaperEditions.splice(idx, 1);
    if (this.data.epaperPages) {
      this.data.epaperPages = this.data.epaperPages.filter((p) => p.editionId !== id);
    }
    this.save();
    return true;
  }

  async getEpaperPagesByEditionId(editionId) {
    const list = (this.data.epaperPages || []).filter((p) => p.editionId === editionId);
    list.sort((a, b) => (a.pageNumber || 0) - (b.pageNumber || 0));
    return list;
  }

  async getEpaperPages(editionId) {
    return this.getEpaperPagesByEditionId(editionId);
  }

  async getEpaperPageById(id) {
    const list = this.data.epaperPages || [];
    return list.find((p) => p.id === id) || null;
  }

  async getEpaperPageByNumber(editionId, pageNumber) {
    const list = this.data.epaperPages || [];
    return list.find((p) => p.editionId === editionId && p.pageNumber === Number(pageNumber)) || null;
  }

  async getEpaperPage(editionId, pageNumber) {
    return this.getEpaperPageByNumber(editionId, pageNumber);
  }

  async saveEpaperPage(pageData, user = null, options = {}) {
    this.data.epaperPages = this.data.epaperPages || [];
    const id = pageData.id || `page-${pageData.editionId || 'ep'}-${pageData.pageNumber || Date.now()}`;
    const existingIndex = this.data.epaperPages.findIndex((p) => p.id === id);
    const existing = existingIndex >= 0 ? this.data.epaperPages[existingIndex] : null;

    // Published edition immutability check
    const editionId = pageData.editionId || existing?.editionId;
    if (editionId && this.data.epaperEditions) {
      const parentEdition = this.data.epaperEditions.find((e) => e.id === editionId);
      if (parentEdition && parentEdition.status === 'PUBLISHED') {
        const publishedRes = {
          error: true,
          statusCode: 400,
          code: 'ERR_EDITION_ALREADY_PUBLISHED',
          message: 'ERR_EDITION_ALREADY_PUBLISHED: प्रकाशित संस्करण का पृष्ठ संशोधित नहीं किया जा सकता।',
        };
        if (options?.throwOnError) {
          const err = new Error(publishedRes.message);
          err.statusCode = 400;
          err.code = 'ERR_EDITION_ALREADY_PUBLISHED';
          throw err;
        }
        return publishedRes;
      }
    }

    // Unapproved article validation: prevent unapproved news articles from entering page composition
    if (Array.isArray(pageData.elements) && this.data.articles) {
      for (const el of pageData.elements) {
        if (el.articleId) {
          const art = this.data.articles.find((a) => a.id === el.articleId);
          if (art) {
            const isApproved =
              ['APPROVED', 'PUBLISHED'].includes(String(art.status || '').toUpperCase()) ||
              ['APPROVED_FOR_EPAPER', 'ASSIGNED_TO_PAGE', 'PAGE_DESIGNED', 'QUALITY_CHECK', 'FINAL_APPROVED'].includes(
                String(art.epaperWorkflow?.status || '').toUpperCase()
              );
            if (!isApproved) {
              const unapprovedRes = {
                error: true,
                statusCode: 400,
                code: 'ERR_ARTICLE_NOT_APPROVED',
                message: `ERR_ARTICLE_NOT_APPROVED: अस्वीकृत समाचार "${art.title}" पृष्ठ पर सम्मिलित नहीं किया जा सकता।`,
              };
              if (options?.throwOnError) {
                const err = new Error(unapprovedRes.message);
                err.statusCode = 400;
                err.code = 'ERR_ARTICLE_NOT_APPROVED';
                throw err;
              }
              return unapprovedRes;
            }
          }
        }
      }
    }

    // OCC Check
    const expected = pageData.expectedVersion !== undefined 
      ? pageData.expectedVersion 
      : (options?.expectedVersion !== undefined ? options.expectedVersion : (pageData.version !== undefined ? pageData.version : undefined));

    if (existingIndex >= 0 && expected !== undefined) {
      const curVersion = this.data.epaperPages[existingIndex].version || 1;
      if (curVersion !== Number(expected)) {
        const conflictRes = {
          error: true,
          statusCode: 409,
          code: 'ERR_VERSION_CONFLICT',
          message: `संस्करण विरोध (OCC Conflict): पृष्ठ का वर्तमान संस्करण ${curVersion} है, प्राप्त संस्करण ${expected} है।`,
          currentVersion: curVersion,
          expectedVersion: expected,
        };
        if (options?.throwOnError) {
          const err = new Error(conflictRes.message);
          err.statusCode = 409;
          err.code = 'ERR_VERSION_CONFLICT';
          throw err;
        }
        return conflictRes;
      }
    }

    const record = {
      ...(existing || {}),
      ...pageData,
      id,
      elements: Array.isArray(pageData.elements) ? pageData.elements : (existing?.elements || []),
      version: existing ? (existing.version || 1) + 1 : 1,
      updatedAt: new Date().toISOString(),
      createdAt: existing ? existing.createdAt : new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      this.data.epaperPages[existingIndex] = record;
    } else {
      this.data.epaperPages.push(record);
      if (record.editionId && this.data.epaperEditions) {
        const parentEdition = this.data.epaperEditions.find((e) => e.id === record.editionId);
        if (parentEdition) {
          parentEdition.pages = parentEdition.pages || [];
          if (!parentEdition.pages.includes(id)) {
            parentEdition.pages.push(id);
            parentEdition.totalPages = parentEdition.pages.length;
          }
        }
      }
    }

    // Quality Staleness Invariant (Step 10): Modification of page layout or elements invalidates prior quality checks
    if (record.editionId && this.data.epaperEditions) {
      const parentEdition = this.data.epaperEditions.find((e) => e.id === record.editionId);
      if (parentEdition) {
        parentEdition.isQualityStale = true;
        if (parentEdition.qualityCheckResult) {
          parentEdition.qualityCheckResult.isStale = true;
          parentEdition.qualityCheckResult.canPublish = false;
        }
      }
    }
    this.save();
    return record;
  }

  async deleteEpaperPage(id, user = null) {
    if (!this.data.epaperPages) return false;
    const idx = this.data.epaperPages.findIndex((p) => p.id === id);
    if (idx < 0) return false;

    const removed = this.data.epaperPages.splice(idx, 1)[0];
    if (removed?.editionId && this.data.epaperEditions) {
      const parent = this.data.epaperEditions.find((e) => e.id === removed.editionId);
      if (parent && parent.pages) {
        parent.pages = parent.pages.filter((pid) => pid !== id);
        parent.totalPages = parent.pages.length;
      }
    }
    this.save();
    return true;
  }

  async checkArticleInEdition(editionId, articleId) {
    const pages = await this.getEpaperPagesByEditionId(editionId);
    for (const page of pages) {
      const elements = page.elements || [];
      const match = elements.find((el) => el.articleId === articleId);
      if (match) {
        return {
          placed: true,
          pageNumber: page.pageNumber,
          pageId: page.id,
          pageTitle: page.pageTitle,
          elementId: match.id,
          articleId,
        };
      }
    }
    return {
      placed: false,
      pageNumber: null,
      pageId: null,
      pageTitle: null,
      elementId: null,
      articleId,
    };
  }

  async checkArticlePlacement(editionId, articleId) {
    return this.checkArticleInEdition(editionId, articleId);
  }

  // =========================================================================
  // STEP 3: E-PAPER NEWS SELECTION DESK & EDITORIAL WORKFLOW METHODS
  // =========================================================================

  async getEligibleEpaperArticles(params = {}) {
    let list = [...(this.data.articles || [])];

    // Default: Only eligible approved articles can enter selection desk
    // Either article.status is APPROVED/PUBLISHED or epaperWorkflow.status is APPROVED_FOR_EPAPER+
    const validEpaperStatuses = [
      'APPROVED_FOR_EPAPER',
      'ASSIGNED_TO_PAGE',
      'PAGE_DESIGNED',
      'QUALITY_CHECK',
      'FINAL_APPROVED',
    ];

    if (params.approvalStatus && params.approvalStatus !== 'all') {
      const norm = String(params.approvalStatus).toUpperCase();
      list = list.filter((a) => {
        const artStatus = String(a.status || '').toUpperCase();
        const epStatus = String(a.epaperWorkflow?.status || '').toUpperCase();
        return artStatus === norm || epStatus === norm;
      });
    } else {
      list = list.filter((a) => {
        const artStatus = String(a.status || '').toUpperCase();
        const epStatus = String(a.epaperWorkflow?.status || '').toUpperCase();
        return artStatus === 'APPROVED' || artStatus === 'PUBLISHED' || validEpaperStatuses.includes(epStatus);
      });
    }

    // Filter: District
    if (params.districtId || params.district) {
      const dist = String(params.districtId || params.district).toLowerCase();
      list = list.filter((a) =>
        String(a.districtId || '').toLowerCase() === dist ||
        String(a.districtName || '').toLowerCase() === dist
      );
    }

    // Filter: Constituency / Beat
    if (params.constituency) {
      const c = String(params.constituency).toLowerCase();
      list = list.filter((a) =>
        String(a.constituencyName || a.constituencyId || a.beat || '').toLowerCase().includes(c)
      );
    }

    // Filter: Category
    if (params.categoryId || params.category) {
      const cat = String(params.categoryId || params.category).toLowerCase();
      list = list.filter((a) =>
        String(a.categoryId || '').toLowerCase() === cat ||
        String(a.categoryName || '').toLowerCase() === cat ||
        String(a.category || '').toLowerCase() === cat
      );
    }

    // Filter: Reporter / Author
    if (params.reporterId || params.reporter) {
      const rep = String(params.reporterId || params.reporter).toLowerCase();
      list = list.filter((a) =>
        String(a.authorId || '').toLowerCase() === rep ||
        String(a.authorName || '').toLowerCase().includes(rep) ||
        String(a.byline || '').toLowerCase().includes(rep)
      );
    }

    // Filter: Date / Date Range
    if (params.date) {
      const d = String(params.date).slice(0, 10);
      list = list.filter((a) => {
        const artDate = String(a.publicationDate || a.publishedAt || a.createdAt || '').slice(0, 10);
        return artDate === d;
      });
    }
    if (params.dateFrom) {
      const df = new Date(params.dateFrom).getTime();
      list = list.filter((a) => new Date(a.publishedAt || a.createdAt || 0).getTime() >= df);
    }
    if (params.dateTo) {
      const dt = new Date(params.dateTo).getTime();
      list = list.filter((a) => new Date(a.publishedAt || a.createdAt || 0).getTime() <= dt);
    }

    // Filter: Priority
    if (params.priority && params.priority !== 'all') {
      const p = String(params.priority).toUpperCase();
      list = list.filter((a) => String(a.priority || '').toUpperCase() === p);
    }

    // Filter: Featured Image
    if (params.hasImage !== undefined && params.hasImage !== null && params.hasImage !== 'all') {
      const reqImage = params.hasImage === true || params.hasImage === 'true';
      list = list.filter((a) => {
        const hasImg = Boolean((a.featuredImage && a.featuredImage.trim()) || (a.imageUrl && a.imageUrl.trim()));
        return reqImage ? hasImg : !hasImg;
      });
    }

    // Filter: Article Length (Short < 100, Medium 100-300, Long > 300 words)
    if (params.length && params.length !== 'all') {
      const lenType = String(params.length).toUpperCase();
      list = list.filter((a) => {
        const text = String(a.content || a.summary || '').trim();
        const wordCount = text ? text.split(/\s+/).filter(Boolean).length : 0;
        if (lenType === 'SHORT') return wordCount < 100;
        if (lenType === 'MEDIUM') return wordCount >= 100 && wordCount <= 300;
        if (lenType === 'LONG') return wordCount > 300;
        return true;
      });
    }

    // Search query: headline, article ID, keywords, body, author
    if (params.search && params.search.trim()) {
      const q = params.search.trim().toLowerCase();
      list = list.filter((a) =>
        String(a.id || '').toLowerCase().includes(q) ||
        String(a.title || '').toLowerCase().includes(q) ||
        String(a.summary || '').toLowerCase().includes(q) ||
        String(a.content || '').toLowerCase().includes(q) ||
        String(a.authorName || '').toLowerCase().includes(q) ||
        String(a.byline || '').toLowerCase().includes(q) ||
        String(a.districtName || '').toLowerCase().includes(q)
      );
    }

    // Sort: latest, priority, relevance
    const sortMode = String(params.sort || 'latest').toLowerCase();
    const priorityWeight = { URGENT: 4, BREAKING: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };

    list.sort((a, b) => {
      if (sortMode === 'priority') {
        const pwA = priorityWeight[String(a.priority || '').toUpperCase()] || 0;
        const pwB = priorityWeight[String(b.priority || '').toUpperCase()] || 0;
        if (pwB !== pwA) return pwB - pwA;
      } else if (sortMode === 'relevance') {
        // Editorial relevance: priority + hasImage + length suitability + recency
        const scoreA = ((priorityWeight[String(a.priority || '').toUpperCase()] || 0) * 10) +
          (a.featuredImage || a.imageUrl ? 5 : 0);
        const scoreB = ((priorityWeight[String(b.priority || '').toUpperCase()] || 0) * 10) +
          (b.featuredImage || b.imageUrl ? 5 : 0);
        if (scoreB !== scoreA) return scoreB - scoreA;
      }
      // Fallback: latest
      const timeA = new Date(a.publishedAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.publishedAt || b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    const total = list.length;
    const page = Math.max(1, parseInt(params.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(params.limit || '20', 10)));
    const startIndex = (page - 1) * limit;
    const paginated = list.slice(startIndex, startIndex + limit);

    return {
      items: paginated,
      articles: paginated,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async updateArticleWorkflowStatus(articleId, targetStatus, user = null, options = {}) {
    const article = await this.getArticleByIdOrSlug(articleId);
    if (!article) {
      const err = new Error('ERR_ARTICLE_NOT_FOUND: समाचार नहीं मिला।');
      err.statusCode = 404;
      err.code = 'ERR_ARTICLE_NOT_FOUND';
      throw err;
    }

    const WORKFLOW_STAGES = [
      'NEWS_RECEIVED',
      'EDITORIAL_REVIEW',
      'APPROVED_FOR_EPAPER',
      'ASSIGNED_TO_PAGE',
      'PAGE_DESIGNED',
      'QUALITY_CHECK',
      'FINAL_APPROVED',
      'PUBLISHED',
    ];

    // Normalize target status
    const normTarget = String(targetStatus || '').trim().toUpperCase().replace(/[\s\/-]+/g, '_');
    const matchedStage = WORKFLOW_STAGES.find((s) => s === normTarget) ||
      (normTarget.includes('REVIEW') ? 'EDITORIAL_REVIEW' :
       normTarget.includes('APPROVED_FOR') ? 'APPROVED_FOR_EPAPER' :
       normTarget.includes('ASSIGNED') ? 'ASSIGNED_TO_PAGE' :
       normTarget.includes('DESIGN') ? 'PAGE_DESIGNED' :
       normTarget.includes('QUALITY') || normTarget.includes('PROOF') ? 'QUALITY_CHECK' :
       normTarget.includes('FINAL') ? 'FINAL_APPROVED' :
       normTarget.includes('PUBLISH') ? 'PUBLISHED' : null);

    if (!matchedStage) {
      const err = new Error(`ERR_INVALID_WORKFLOW_STAGE: अमान्य संपादकीय कार्यप्रवाह स्थिति "${targetStatus}"। मान्य स्थितियां: ${WORKFLOW_STAGES.join(', ')}`);
      err.statusCode = 400;
      err.code = 'ERR_INVALID_WORKFLOW_STAGE';
      throw err;
    }

    // Role Enforcement
    const userRoles = Array.isArray(user?.roles) ? user.roles : (user?.role ? [user.role] : []);
    const normRoles = userRoles.map((r) => String(r).toUpperCase().replace(/^ROLE_/, ''));
    const isReaderOrReporterOnly = normRoles.length > 0 && normRoles.every((r) => ['READER', 'REPORTER'].includes(r));
    const isChiefEditorOrAdmin = normRoles.some((r) => ['MASTER_ADMIN', 'SUPER_ADMIN', 'ADMIN', 'CHIEF_EDITOR'].includes(r)) ||
      (user?.email && ['live.bnwtv@gmail.com', 'admin@breakingnewswala.com'].includes(user.email));

    if (isReaderOrReporterOnly && !isChiefEditorOrAdmin) {
      const err = new Error('ERR_FORBIDDEN: संपादकीय कार्यप्रवाह में स्थिति परिवर्तित करने हेतु संपादक अथवा एडमिन अधिकार आवश्यक हैं।');
      err.statusCode = 403;
      err.code = 'ERR_FORBIDDEN';
      throw err;
    }

    if (matchedStage === 'FINAL_APPROVED' && !isChiefEditorOrAdmin) {
      const err = new Error('ERR_FORBIDDEN: अंतिम अनुमोदन (FINAL APPROVED) केवल मुख्य संपादक अथवा मास्टर एडमिन द्वारा ही दिया जा सकता है।');
      err.statusCode = 403;
      err.code = 'ERR_FORBIDDEN';
      throw err;
    }

    // Determine current stage
    const currentStage = article.epaperWorkflow?.status ||
      (article.status === 'PUBLISHED' || article.status === 'APPROVED' ? 'APPROVED_FOR_EPAPER' : 'NEWS_RECEIVED');

    const currentIdx = WORKFLOW_STAGES.indexOf(currentStage);
    const targetIdx = WORKFLOW_STAGES.indexOf(matchedStage);

    // Prevent Stage Skipping forward (cannot jump more than 1 forward step without explicit exception)
    if (targetIdx > currentIdx + 1 && !(currentStage === 'APPROVED_FOR_EPAPER' && matchedStage === 'ASSIGNED_TO_PAGE')) {
      const err = new Error(`ERR_STAGE_SKIP_FORBIDDEN: कार्यप्रवाह चरण लंघन वर्जित है। वर्तमान: "${currentStage}", लक्षित: "${matchedStage}"।`);
      err.statusCode = 400;
      err.code = 'ERR_STAGE_SKIP_FORBIDDEN';
      throw err;
    }

    // SOURCE ARTICLE IMMUTABILITY:
    // Core news fields (title, content, summary, districtId, authorName, etc.) are NEVER mutated.
    // Only epaperWorkflow tracking metadata is updated.
    const currentHistory = Array.isArray(article.epaperWorkflow?.history) ? article.epaperWorkflow.history : [];
    const workflowRecord = {
      status: matchedStage,
      updatedAt: new Date().toISOString(),
      updatedBy: {
        id: user?.id || user?.uid || 'usr-editor',
        name: user?.fullName || user?.name || 'संपादक',
        role: normRoles[0] || 'EDITOR',
      },
      editionId: options.editionId || article.epaperWorkflow?.editionId || null,
      pageNumber: options.pageNumber !== undefined ? options.pageNumber : (article.epaperWorkflow?.pageNumber || null),
      remarks: options.remarks || '',
      history: [
        ...currentHistory,
        {
          from: currentStage,
          to: matchedStage,
          changedAt: new Date().toISOString(),
          changedBy: user?.fullName || user?.name || 'संपादक',
          remarks: options.remarks || '',
        },
      ],
    };

    article.epaperWorkflow = workflowRecord;
    this.save();

    return {
      success: true,
      articleId: article.id,
      workflow: workflowRecord,
      previousStatus: currentStage,
      currentStatus: matchedStage,
    };
  }

  async assignArticlesToEditionPage(editionId, pageNumber, articleIds, user = null, options = {}) {
    const edition = await this.getEpaperEditionById(editionId);
    if (!edition) {
      const err = new Error('ERR_NOT_FOUND: ई-पेपर संस्करण नहीं मिला।');
      err.statusCode = 404;
      err.code = 'ERR_NOT_FOUND';
      throw err;
    }

    // Published Edition Immutability
    if (edition.status === 'PUBLISHED') {
      const err = new Error('ERR_EDITION_ALREADY_PUBLISHED: प्रकाशित ई-पेपर संस्करण में कोई संशोधन नहीं किया जा सकता।');
      err.statusCode = 400;
      err.code = 'ERR_EDITION_ALREADY_PUBLISHED';
      throw err;
    }

    const pageNum = parseInt(pageNumber, 10);
    if (!Number.isInteger(pageNum) || pageNum < 1 || pageNum > edition.totalPages) {
      const err = new Error(`ERR_INVALID_PAGE_NUMBER: पृष्ठ संख्या 1 से ${edition.totalPages} के मध्य होनी चाहिए।`);
      err.statusCode = 400;
      err.code = 'ERR_INVALID_PAGE_NUMBER';
      throw err;
    }

    const targetPage = await this.getEpaperPageByNumber(editionId, pageNum);
    if (!targetPage) {
      const err = new Error(`ERR_PAGE_NOT_FOUND: पृष्ठ ${pageNum} नहीं मिला।`);
      err.statusCode = 404;
      err.code = 'ERR_PAGE_NOT_FOUND';
      throw err;
    }

    const normalizedIds = Array.isArray(articleIds) ? articleIds : [articleIds];
    if (normalizedIds.length === 0) {
      const err = new Error('ERR_VALIDATION: कम से कम एक समाचार ID आवश्यक है।');
      err.statusCode = 400;
      err.code = 'ERR_VALIDATION';
      throw err;
    }

    // Check Duplicate Placements in this edition
    const warnings = [];
    for (const artId of normalizedIds) {
      const check = await this.checkArticleInEdition(editionId, artId);
      if (check.placed) {
        if (!options.forceDuplicate) {
          const err = new Error(`ERR_DUPLICATE_ASSIGNMENT: समाचार [${artId}] पहले से पृष्ठ ${check.pageNumber} पर असाइन है।`);
          err.statusCode = 409;
          err.code = 'ERR_DUPLICATE_ASSIGNMENT';
          err.details = {
            articleId: artId,
            alreadyAssignedPage: check.pageNumber,
            pageTitle: check.pageTitle,
          };
          throw err;
        } else {
          warnings.push(`समाचार [${artId}] पृष्ठ ${check.pageNumber} पर भी स्थित है।`);
        }
      }
    }

    // Assign Articles as EpaperPageElements (Source Article Immutability Guaranteed)
    const newElements = [...(targetPage.elements || [])];
    const assignedElements = [];

    for (const artId of normalizedIds) {
      const article = await this.getArticleByIdOrSlug(artId);
      if (!article) continue;

      // Approval Gate: Only approved articles can enter page assignment
      const isApproved =
        String(article.status || '').toUpperCase() === 'APPROVED' ||
        String(article.status || '').toUpperCase() === 'PUBLISHED' ||
        ['APPROVED_FOR_EPAPER', 'ASSIGNED_TO_PAGE', 'PAGE_DESIGNED', 'QUALITY_CHECK', 'FINAL_APPROVED'].includes(String(article.epaperWorkflow?.status || '').toUpperCase());

      if (!isApproved) {
        const err = new Error(`ERR_ARTICLE_NOT_APPROVED: समाचार [${article.id}] अभी अनुमोदित नहीं है। केवल स्वीकृत समाचार ही ई-पेपर पृष्ठ पर असाइन किए जा सकते हैं।`);
        err.statusCode = 400;
        err.code = 'ERR_ARTICLE_NOT_APPROVED';
        throw err;
      }

      // Editorial Credits Handling
      const reporterCredit = article.byline || article.authorName || '';
      const photoCredit = article.photographer || article.imageAttribution || '';
      const editorCredit = options.editorCredit || user?.fullName || 'डेस्क संपादक';

      const hasMissingReporterCredit = !reporterCredit;
      const hasMissingEditorCredit = !editorCredit;
      const hasMissingImage = !(article.featuredImage || article.imageUrl);

      if (hasMissingImage) {
        warnings.push({
          type: 'MISSING_IMAGE',
          articleId: article.id,
          message: `समाचार [${article.title}] में कोई मुख्य फ़ोटो उपलब्ध नहीं है।`,
        });
      }
      if (hasMissingReporterCredit) {
        warnings.push({
          type: 'MISSING_REPORTER_CREDIT',
          articleId: article.id,
          message: `समाचार [${article.title}] में रिपोर्टर का नाम/साभार अनुपलब्ध है।`,
        });
      }
      if (hasMissingEditorCredit) {
        warnings.push({
          type: 'MISSING_EDITOR_CREDIT',
          articleId: article.id,
          message: `समाचार [${article.title}] में संपादक का नाम/साभार अनुपलब्ध है।`,
        });
      }

      const element = {
        id: `elem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        elementType: 'STORY',
        articleId: article.id,
        bounds: { x: 42.52, y: 141.73, width: 280, height: 180 },
        colSpan: options.colSpan || 4,
        role: options.role || (newElements.length === 0 ? 'LEAD' : 'SECOND_LEAD'),
        customHeadline: article.title,
        customBodyText: article.content || article.summary,
        byline: reporterCredit || 'संवाददाता',
        photoCredit: photoCredit || 'बीएनडब्ल्यू फोटो ब्यूरो',
        editorCredit: editorCredit,
        imageUrl: article.featuredImage || article.imageUrl || null,
        missingReporterCredit: hasMissingReporterCredit,
        missingEditorCredit: hasMissingEditorCredit,
        zIndex: newElements.length + 1,
        createdAt: new Date().toISOString(),
      };

      newElements.push(element);
      assignedElements.push(element);

      // Track Workflow state on article
      article.epaperWorkflow = {
        status: 'ASSIGNED_TO_PAGE',
        updatedAt: new Date().toISOString(),
        updatedBy: {
          id: user?.id || user?.uid || 'usr-editor',
          name: user?.fullName || user?.name || 'संपादक',
          role: user?.role || 'EDITOR',
        },
        editionId,
        pageNumber: pageNum,
        remarks: `असाइन पृष्ठ ${pageNum} (${edition.title})`,
        history: [
          ...(article.epaperWorkflow?.history || []),
          {
            from: article.epaperWorkflow?.status || 'APPROVED_FOR_EPAPER',
            to: 'ASSIGNED_TO_PAGE',
            changedAt: new Date().toISOString(),
            changedBy: user?.fullName || 'संपादक',
            remarks: `असाइन पृष्ठ ${pageNum} (${edition.title})`,
          },
        ],
      };
    }

    const updatedPage = await this.saveEpaperPage({
      ...targetPage,
      elements: newElements,
      expectedVersion: targetPage.version,
    }, user);

    this.save();

    return {
      success: true,
      page: updatedPage,
      assignedCount: assignedElements.length,
      assignedElements,
      warnings,
      edition: {
        id: edition.id,
        title: edition.title,
        editionType: edition.editionType,
        totalPages: edition.totalPages,
      },
    };
  }

  async removeArticleFromEditionPage(editionId, pageNumber, articleId, user = null) {
    const edition = await this.getEpaperEditionById(editionId);
    if (!edition) {
      const err = new Error('ERR_NOT_FOUND: ई-पेपर संस्करण नहीं मिला।');
      err.statusCode = 404;
      err.code = 'ERR_NOT_FOUND';
      throw err;
    }

    if (edition.status === 'PUBLISHED') {
      const err = new Error('ERR_EDITION_ALREADY_PUBLISHED: प्रकाशित ई-पेपर संस्करण से समाचार हटाया नहीं जा सकता।');
      err.statusCode = 400;
      err.code = 'ERR_EDITION_ALREADY_PUBLISHED';
      throw err;
    }

    const pageNum = parseInt(pageNumber, 10);
    const targetPage = await this.getEpaperPageByNumber(editionId, pageNum);
    if (!targetPage) {
      const err = new Error(`ERR_PAGE_NOT_FOUND: पृष्ठ ${pageNum} नहीं मिला।`);
      err.statusCode = 404;
      err.code = 'ERR_PAGE_NOT_FOUND';
      throw err;
    }

    // Filter element out of page
    const filteredElements = (targetPage.elements || []).filter((el) => el.articleId !== articleId);
    const updatedPage = await this.saveEpaperPage({
      ...targetPage,
      elements: filteredElements,
      expectedVersion: targetPage.version,
    }, user);

    // Source Article Immutability: original article in newsArticles is NEVER deleted!
    const article = await this.getArticleByIdOrSlug(articleId);
    if (article) {
      // Check if placed on any other page of this edition
      const stillPlaced = await this.checkArticleInEdition(editionId, articleId);
      if (!stillPlaced.placed && article.epaperWorkflow?.status === 'ASSIGNED_TO_PAGE') {
        article.epaperWorkflow = {
          ...article.epaperWorkflow,
          status: 'APPROVED_FOR_EPAPER',
          updatedAt: new Date().toISOString(),
          editionId: null,
          pageNumber: null,
          remarks: `हटाया गया पृष्ठ ${pageNum} से`,
          history: [
            ...(article.epaperWorkflow?.history || []),
            {
              from: 'ASSIGNED_TO_PAGE',
              to: 'APPROVED_FOR_EPAPER',
              changedAt: new Date().toISOString(),
              changedBy: user?.fullName || 'संपादक',
              remarks: `हटाया गया पृष्ठ ${pageNum} से`,
            },
          ],
        };
      }
    }

    this.save();

    return {
      success: true,
      page: updatedPage,
      removedArticleId: articleId,
      sourceArticlePreserved: true,
    };
  }

  async getEditorialStaffCredits(user = null) {
    const editorialUsers = (this.data.users || []).filter((u) => {
      const roles = Array.isArray(u.roles) ? u.roles : (u.role ? [u.role] : []);
      const normRoles = roles.map((r) => String(r).toUpperCase().replace(/^ROLE_/, ''));
      return normRoles.some((r) => ['MASTER_ADMIN', 'SUPER_ADMIN', 'ADMIN', 'CHIEF_EDITOR', 'MANAGING_EDITOR', 'EDITOR', 'DESK_EDITOR'].includes(r));
    }).map((u) => ({
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      role: Array.isArray(u.roles) ? u.roles[0] : (u.role || 'EDITOR'),
      badgeNumber: u.badgeNumber || null,
    }));

    return editorialUsers;
  }

  _enrichTemplate(tpl) {
    if (!tpl) return null;
    const pages = this.data.epaperPages || [];
    const editions = this.data.epaperEditions || [];

    const matchingPages = pages.filter((p) => p.templateId === tpl.id);
    const editionMap = new Map();
    for (const p of matchingPages) {
      if (!p.editionId) continue;
      const ed = editions.find((e) => e.id === p.editionId);
      if (ed) {
        if (!editionMap.has(ed.id)) {
          editionMap.set(ed.id, {
            editionId: ed.id,
            editionTitle: ed.title || ed.editionCode,
            editionCode: ed.editionCode,
            pageNumber: p.pageNumber,
            editionStatus: ed.status,
            publicationDate: ed.publicationDate,
          });
        }
      }
    }
    const usedByEditions = Array.from(editionMap.values());

    const baseDimensions = tpl.pageDimensions || {};
    const pageDimensions = {
      width: baseDimensions.width || baseDimensions.widthPt || TEMPLATE_CONSTANTS.PAGE_WIDTH_PT,
      height: baseDimensions.height || baseDimensions.heightPt || TEMPLATE_CONSTANTS.PAGE_HEIGHT_PT,
      widthPt: baseDimensions.widthPt || baseDimensions.width || TEMPLATE_CONSTANTS.PAGE_WIDTH_PT,
      heightPt: baseDimensions.heightPt || baseDimensions.height || TEMPLATE_CONSTANTS.PAGE_HEIGHT_PT,
      unit: 'pt',
    };

    const baseMargins = tpl.margins || {};
    const margins = {
      left: baseMargins.left !== undefined ? baseMargins.left : TEMPLATE_CONSTANTS.MARGIN_LEFT_PT,
      right: baseMargins.right !== undefined ? baseMargins.right : TEMPLATE_CONSTANTS.MARGIN_RIGHT_PT,
      top: baseMargins.top !== undefined ? baseMargins.top : TEMPLATE_CONSTANTS.MARGIN_TOP_PT,
      bottom: baseMargins.bottom !== undefined ? baseMargins.bottom : TEMPLATE_CONSTANTS.MARGIN_BOTTOM_PT,
    };

    return {
      status: tpl.status || 'ACTIVE',
      isPublished: tpl.isPublished !== undefined ? tpl.isPublished : (tpl.status === 'ARCHIVED' ? false : true),
      version: tpl.version || 1,
      gutter: tpl.gutter !== undefined ? tpl.gutter : TEMPLATE_CONSTANTS.GUTTER_PT,
      history: Array.isArray(tpl.history) ? tpl.history : [],
      ...tpl,
      pageDimensions,
      margins,
      usedByEditionsCount: usedByEditions.length,
      usedByEditions,
    };
  }

  async getEpaperTemplates(params = {}) {
    let list = [...(this.data.epaperTemplates || [])];
    if (params.category && params.category !== 'all') {
      const c = String(params.category).toUpperCase();
      list = list.filter((t) => String(t.category).toUpperCase() === c);
    }
    if (params.status && params.status !== 'all') {
      const st = String(params.status).toUpperCase();
      list = list.filter((t) => String(t.status || 'ACTIVE').toUpperCase() === st);
    }
    if (params.gridColumns) {
      list = list.filter((t) => t.gridColumns === Number(params.gridColumns));
    }
    if (params.isSystem !== undefined) {
      const sys = String(params.isSystem) === 'true';
      list = list.filter((t) => t.isSystem === sys);
    }
    if (params.search) {
      const q = String(params.search).toLowerCase();
      list = list.filter((t) =>
        (t.name && t.name.toLowerCase().includes(q)) ||
        (t.nameHi && t.nameHi.toLowerCase().includes(q)) ||
        (t.id && t.id.toLowerCase().includes(q)) ||
        (t.templateCode && t.templateCode.toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q))
      );
    }
    return list.map((t) => this._enrichTemplate(t));
  }

  async getEpaperTemplateById(id) {
    const list = this.data.epaperTemplates || [];
    const t = list.find((item) => item.id === id);
    return t ? this._enrichTemplate(t) : null;
  }

  async validateEpaperTemplate(templateData) {
    return validateTemplate(templateData, { existingTemplates: this.data.epaperTemplates || [] });
  }

  async saveEpaperTemplate(templateData, user = null, options = {}) {
    this.data.epaperTemplates = this.data.epaperTemplates || [];
    const id = templateData.id || `tpl-custom-${Date.now()}`;
    const existingIndex = this.data.epaperTemplates.findIndex((t) => t.id === id);
    const existing = existingIndex >= 0 ? this.data.epaperTemplates[existingIndex] : null;

    // Duplicate name collision check (T2.4.5)
    const duplicate = this.data.epaperTemplates.find(
      (t) => t.id !== id && ((templateData.name && t.name === templateData.name) || (templateData.nameHi && t.nameHi === templateData.nameHi))
    );
    if (duplicate) {
      const errRes = {
        error: true,
        statusCode: 409,
        code: 'ERR_TEMPLATE_NAME_COLLISION',
        message: `ERR_TEMPLATE_NAME_COLLISION: टेम्पलेट नाम "${templateData.name || templateData.nameHi}" पहले से मौजूद है।`,
      };
      if (options?.throwOnError) {
        const err = new Error(errRes.message);
        err.statusCode = 409;
        err.code = 'ERR_TEMPLATE_NAME_COLLISION';
        throw err;
      }
      return errRes;
    }

    // Optional pre-validation
    if (options?.validate) {
      const val = validateTemplate({ ...(existing || {}), ...templateData, id });
      if (!val.valid) {
        const errRes = {
          error: true,
          statusCode: 400,
          code: 'ERR_TEMPLATE_VALIDATION_FAILED',
          message: `ERR_TEMPLATE_VALIDATION_FAILED: ${val.errors.join('; ')}`,
          details: val,
        };
        if (options?.throwOnError) {
          const err = new Error(errRes.message);
          err.statusCode = 400;
          err.code = 'ERR_TEMPLATE_VALIDATION_FAILED';
          throw err;
        }
        return errRes;
      }
    }

    const expected = templateData.expectedVersion !== undefined 
      ? templateData.expectedVersion 
      : (options?.expectedVersion !== undefined ? options.expectedVersion : (templateData.version !== undefined ? templateData.version : undefined));

    if (existingIndex >= 0 && expected !== undefined) {
      const curVersion = this.data.epaperTemplates[existingIndex].version || 1;
      if (curVersion !== Number(expected)) {
        return {
          error: true,
          statusCode: 409,
          code: 'ERR_VERSION_CONFLICT',
          message: `संस्करण विरोध (OCC Conflict): टेम्पलेट का वर्तमान संस्करण ${curVersion} है, प्राप्त संस्करण ${expected} है।`,
        };
      }
    }

    // Immutability Preservation: If existing template is ACTIVE, editing without publishing records snapshot in history
    const history = Array.isArray(existing?.history) ? [...existing.history] : [];
    const isExplicitPublish = templateData.status === 'ACTIVE' || options?.isPublish === true;
    let targetStatus = templateData.status || (existing ? existing.status : 'DRAFT');

    if (existing && (existing.status === 'ACTIVE' || existing.isPublished)) {
      if (!isExplicitPublish) {
        targetStatus = 'DRAFT';
      }
      const snapshot = JSON.parse(JSON.stringify(existing));
      delete snapshot.history;
      history.push({
        version: existing.version || 1,
        status: existing.status || 'ACTIVE',
        changedAt: new Date().toISOString(),
        changedBy: {
          id: user?.id || user?.uid || 'usr-admin',
          name: user?.fullName || user?.name || 'संपादक',
          role: user?.role || 'ADMIN',
        },
        changeSummary: isExplicitPublish
          ? `संस्करण ${existing.version || 1} का अद्यतन प्रकाशित किया गया`
          : `संस्करण ${existing.version || 1} का संपादन प्रारूप (Draft) सहेजा गया`,
        snapshot,
      });
    }

    const record = {
      ...(existing || {}),
      ...templateData,
      id,
      status: targetStatus,
      isPublished: targetStatus === 'ACTIVE',
      version: existing ? (isExplicitPublish ? (existing.version || 1) + 1 : (existing.version || 1)) : 1,
      history,
      lastModifiedBy: {
        id: user?.id || user?.uid || 'usr-admin',
        name: user?.fullName || user?.name || 'संपादक',
        role: user?.role || 'ADMIN',
      },
      updatedAt: new Date().toISOString(),
      createdAt: existing ? existing.createdAt : new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      this.data.epaperTemplates[existingIndex] = record;
    } else {
      this.data.epaperTemplates.push(record);
    }
    this.save();
    this.addAuditLog(user?.fullName || 'संपादक', user?.role || 'ADMIN', 'EPAPER_TEMPLATE_SAVED', `टेम्पलेट सहेजा गया: "${record.nameHi || record.name}" (ID: ${id})`);
    return this._enrichTemplate(record);
  }

  async duplicateEpaperTemplate(id, newName = '', user = null) {
    const source = await this.getEpaperTemplateById(id);
    if (!source) {
      const err = new Error(`ERR_NOT_FOUND: टेम्पलेट [${id}] नहीं मिला।`);
      err.statusCode = 404;
      err.code = 'ERR_NOT_FOUND';
      throw err;
    }

    const clonedId = `tpl-custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const clonedCode = `TPL-CUSTOM-${Date.now().toString().slice(-6)}`;
    const defaultName = newName.trim() || `${source.name} (प्रतिलिपि)`;
    const defaultNameHi = newName.trim() ? `${newName.trim()} (हिंदी)` : `${source.nameHi || source.name} (प्रतिलिपि)`;

    const cloned = {
      ...JSON.parse(JSON.stringify(source)),
      id: clonedId,
      templateCode: clonedCode,
      name: defaultName,
      nameHi: defaultNameHi,
      isSystem: false,
      status: 'DRAFT',
      isPublished: false,
      version: 1,
      history: [],
      usedByEditionsCount: 0,
      usedByEditions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastModifiedBy: {
        id: user?.id || user?.uid || 'usr-admin',
        name: user?.fullName || user?.name || 'संपादक',
        role: user?.role || 'ADMIN',
      },
    };

    this.data.epaperTemplates.push(cloned);
    this.save();
    this.addAuditLog(user?.fullName || 'संपादक', user?.role || 'ADMIN', 'EPAPER_TEMPLATE_DUPLICATED', `टेम्पलेट क्लोन किया गया: "${cloned.name}" (नया ID: ${clonedId})`);
    return this._enrichTemplate(cloned);
  }

  async publishEpaperTemplate(id, user = null) {
    const existingIndex = this.data.epaperTemplates.findIndex((t) => t.id === id);
    if (existingIndex < 0) {
      const err = new Error(`ERR_NOT_FOUND: टेम्पलेट [${id}] नहीं मिला।`);
      err.statusCode = 404;
      err.code = 'ERR_NOT_FOUND';
      throw err;
    }

    const existing = this.data.epaperTemplates[existingIndex];

    // Pre-publication strict validation
    const val = validateTemplate(existing);
    if (!val.valid) {
      const err = new Error(`ERR_TEMPLATE_VALIDATION_FAILED: ${val.errors.join('; ')}`);
      err.statusCode = 400;
      err.code = 'ERR_TEMPLATE_VALIDATION_FAILED';
      err.details = val;
      throw err;
    }

    // Freeze historical version snapshot
    const snapshot = JSON.parse(JSON.stringify(existing));
    delete snapshot.history;
    const currentVersion = existing.version || 1;
    const hasPriorHistory = Array.isArray(existing.history) && existing.history.length > 0;
    const nextVersion = (existing.status === 'ACTIVE' || hasPriorHistory) ? currentVersion + 1 : currentVersion;

    const history = Array.isArray(existing.history) ? [...existing.history] : [];
    history.push({
      version: currentVersion,
      status: 'ACTIVE',
      changedAt: new Date().toISOString(),
      changedBy: {
        id: user?.id || user?.uid || 'usr-admin',
        name: user?.fullName || user?.name || 'संपादक',
        role: user?.role || 'ADMIN',
      },
      changeSummary: `संस्करण ${currentVersion} सफलतापूर्वक प्रकाशित एवं अनुमोदित`,
      snapshot,
    });

    existing.status = 'ACTIVE';
    existing.isPublished = true;
    existing.version = nextVersion;
    existing.publishedAt = new Date().toISOString();
    existing.publishedBy = {
      id: user?.id || user?.uid || 'usr-admin',
      name: user?.fullName || user?.name || 'संपादक',
      role: user?.role || 'ADMIN',
    };
    existing.updatedAt = new Date().toISOString();
    existing.history = history;

    this.save();
    this.addAuditLog(user?.fullName || 'संपादक', user?.role || 'ADMIN', 'EPAPER_TEMPLATE_PUBLISHED', `टेम्पलेट प्रकाशित किया गया: "${existing.nameHi || existing.name}" (v${nextVersion})`);
    return this._enrichTemplate(existing);
  }

  async archiveEpaperTemplate(id, user = null) {
    const existingIndex = this.data.epaperTemplates.findIndex((t) => t.id === id);
    if (existingIndex < 0) {
      const err = new Error(`ERR_NOT_FOUND: टेम्पलेट [${id}] नहीं मिला।`);
      err.statusCode = 404;
      err.code = 'ERR_NOT_FOUND';
      throw err;
    }

    const existing = this.data.epaperTemplates[existingIndex];

    const snapshot = JSON.parse(JSON.stringify(existing));
    delete snapshot.history;
    const history = Array.isArray(existing.history) ? [...existing.history] : [];
    history.push({
      version: existing.version || 1,
      status: 'ARCHIVED',
      changedAt: new Date().toISOString(),
      changedBy: {
        id: user?.id || user?.uid || 'usr-admin',
        name: user?.fullName || user?.name || 'संपादक',
        role: user?.role || 'ADMIN',
      },
      changeSummary: 'टेम्पलेट को अभिलेखागार (Archived) में स्थानांतरित किया गया',
      snapshot,
    });

    existing.status = 'ARCHIVED';
    existing.isPublished = false;
    existing.archivedAt = new Date().toISOString();
    existing.archivedBy = {
      id: user?.id || user?.uid || 'usr-admin',
      name: user?.fullName || user?.name || 'संपादक',
      role: user?.role || 'ADMIN',
    };
    existing.updatedAt = new Date().toISOString();
    existing.history = history;

    this.save();
    this.addAuditLog(user?.fullName || 'संपादक', user?.role || 'ADMIN', 'EPAPER_TEMPLATE_ARCHIVED', `टेम्पलेट अभिलेखागार में भेजा गया: "${existing.nameHi || existing.name}" (ID: ${id})`);
    return this._enrichTemplate(existing);
  }

  async restoreEpaperTemplate(id, user = null) {
    const existingIndex = this.data.epaperTemplates.findIndex((t) => t.id === id);
    if (existingIndex < 0) {
      const err = new Error(`ERR_NOT_FOUND: टेम्पलेट [${id}] नहीं मिला।`);
      err.statusCode = 404;
      err.code = 'ERR_NOT_FOUND';
      throw err;
    }

    const existing = this.data.epaperTemplates[existingIndex];

    const snapshot = JSON.parse(JSON.stringify(existing));
    delete snapshot.history;
    const history = Array.isArray(existing.history) ? [...existing.history] : [];
    history.push({
      version: existing.version || 1,
      status: 'ACTIVE',
      changedAt: new Date().toISOString(),
      changedBy: {
        id: user?.id || user?.uid || 'usr-admin',
        name: user?.fullName || user?.name || 'संपादक',
        role: user?.role || 'ADMIN',
      },
      changeSummary: 'टेम्पलेट को अभिलेखागार से पुनर्स्थापित (Restored) किया गया',
      snapshot,
    });

    existing.status = 'ACTIVE';
    existing.isPublished = true;
    existing.updatedAt = new Date().toISOString();
    existing.history = history;

    this.save();
    this.addAuditLog(user?.fullName || 'संपादक', user?.role || 'ADMIN', 'EPAPER_TEMPLATE_RESTORED', `टेम्पलेट पुनर्स्थापित किया गया: "${existing.nameHi || existing.name}" (ID: ${id})`);
    return this._enrichTemplate(existing);
  }

  async rollbackEpaperTemplate(id, targetVersion, user = null) {
    const existingIndex = this.data.epaperTemplates.findIndex((t) => t.id === id);
    if (existingIndex < 0) {
      const err = new Error(`ERR_NOT_FOUND: टेम्पलेट [${id}] नहीं मिला।`);
      err.statusCode = 404;
      err.code = 'ERR_NOT_FOUND';
      throw err;
    }

    const existing = this.data.epaperTemplates[existingIndex];
    const targetVerNum = parseInt(targetVersion, 10);
    const histEntry = (existing.history || []).find((h) => h.version === targetVerNum);

    if (!histEntry || !histEntry.snapshot) {
      const err = new Error(`ERR_VERSION_NOT_FOUND: संस्करण v${targetVerNum} का स्नैपशॉट नहीं मिला।`);
      err.statusCode = 404;
      err.code = 'ERR_VERSION_NOT_FOUND';
      throw err;
    }

    // Save current state into history before rollback
    const preRollbackSnapshot = JSON.parse(JSON.stringify(existing));
    delete preRollbackSnapshot.history;
    const history = Array.isArray(existing.history) ? [...existing.history] : [];
    const newVersion = (existing.version || 1) + 1;

    history.push({
      version: existing.version || 1,
      status: existing.status,
      changedAt: new Date().toISOString(),
      changedBy: {
        id: user?.id || user?.uid || 'usr-admin',
        name: user?.fullName || user?.name || 'संपादक',
        role: user?.role || 'ADMIN',
      },
      changeSummary: `संस्करण v${targetVerNum} पर रोलबैक करने से पूर्व स्नैपशॉट`,
      snapshot: preRollbackSnapshot,
    });

    // Restore settings from target snapshot
    const snap = histEntry.snapshot;
    existing.name = snap.name || existing.name;
    existing.nameHi = snap.nameHi || existing.nameHi;
    existing.description = snap.description || existing.description;
    existing.regions = snap.regions || existing.regions;
    existing.gridColumns = snap.gridColumns || existing.gridColumns;
    existing.margins = snap.margins || existing.margins;
    existing.gutter = snap.gutter !== undefined ? snap.gutter : existing.gutter;
    existing.pageDimensions = snap.pageDimensions || existing.pageDimensions;
    existing.typography = snap.typography || existing.typography;
    existing.headerArea = snap.headerArea || existing.headerArea;
    existing.footerArea = snap.footerArea || existing.footerArea;
    existing.version = newVersion;
    existing.status = 'ACTIVE';
    existing.isPublished = true;
    existing.updatedAt = new Date().toISOString();
    existing.history = history;

    this.save();
    this.addAuditLog(user?.fullName || 'संपादक', user?.role || 'ADMIN', 'EPAPER_TEMPLATE_ROLLBACK', `टेम्पलेट को v${targetVerNum} पर रोलबैक किया गया (नया संस्करण: v${newVersion})`);
    return this._enrichTemplate(existing);
  }

  async getTemplateVersionHistory(id) {
    const t = await this.getEpaperTemplateById(id);
    if (!t) return [];
    return t.history || [];
  }

  async getTemplateUsage(id) {
    const t = await this.getEpaperTemplateById(id);
    if (!t) return { templateId: id, totalEditions: 0, editions: [], pages: [] };
    const pages = (this.data.epaperPages || []).filter((p) => p.templateId === id);
    return {
      templateId: id,
      totalEditions: t.usedByEditionsCount || 0,
      usedByEditionsCount: t.usedByEditionsCount || 0,
      editions: t.usedByEditions || [],
      usedByEditions: t.usedByEditions || [],
      pages,
    };
  }

  async deleteEpaperTemplate(id, user = null) {
    if (!this.data.epaperTemplates) return false;
    const idx = this.data.epaperTemplates.findIndex((t) => t.id === id);
    if (idx < 0) return false;
    if (this.data.epaperTemplates[idx].isSystem) {
      return {
        error: true,
        statusCode: 400,
        code: 'ERR_CANNOT_DELETE_SYSTEM_TEMPLATE',
        message: 'सिस्टम टेम्पलेट हटाया नहीं जा सकता।',
      };
    }
    this.data.epaperTemplates.splice(idx, 1);
    this.save();
    return true;
  }

  async saveEpaperWhatsAppGeneration(data, user = null) {
    this.data.epaperWhatsAppGenerations = this.data.epaperWhatsAppGenerations || [];
    const id = data.id || `wa-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const record = {
      id,
      idempotencyKey: data.idempotencyKey || null,
      editionId: data.editionId,
      pageNumber: data.pageNumber,
      articleId: data.articleId,
      reporterId: data.reporterId || user?.id || 'usr-reporter',
      reporterName: data.reporterName || user?.fullName || 'संवाददाता',
      reporterBadge: data.reporterBadge || user?.badgeNumber || 'BNW-STRINGER',
      format: data.format || '4:5',
      headline: data.headline || '',
      body: data.body || '',
      imageUrl: data.imageUrl,
      storagePath: data.storagePath || `whatsapp/${data.reporterId || 'usr'}/${Date.now()}.png`,
      isPrivate: true,
      districtName: data.districtName,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.data.epaperWhatsAppGenerations.unshift(record);
    this.save();
    return record;
  }

  async _acquireReporterLock(reporterId) {
    if (!this._reporterLocks) {
      this._reporterLocks = new Map();
    }
    let releaseLock;
    const prevLock = this._reporterLocks.get(reporterId) || Promise.resolve();
    const nextLock = new Promise((resolve) => {
      releaseLock = resolve;
    });
    this._reporterLocks.set(reporterId, prevLock.then(() => nextLock));
    await prevLock;
    return () => releaseLock();
  }

  async atomicSaveEpaperWhatsAppGeneration(data, user = null) {
    const reporterId = user?.id || data.reporterId || 'usr-reporter';
    const idempotencyKey = data.idempotencyKey || data.id || null;
    const release = await this._acquireReporterLock(reporterId);
    try {
      this.data.epaperWhatsAppGenerations = this.data.epaperWhatsAppGenerations || [];
      if (idempotencyKey) {
        const existing = this.data.epaperWhatsAppGenerations.find(
          (g) => g.idempotencyKey === idempotencyKey && g.reporterId === reporterId
        );
        if (existing) {
          return existing; // Idempotent return without consuming quota
        }
      }

      const today = this._getIndiaDateString();
      const quota = await this.getReporterWhatsAppQuota(reporterId, today);
      if (quota.quotaExceeded || quota.remaining <= 0) {
        const err = new Error(`दैनिक व्हाट्सएप कार्ड निर्माण सीमा (${quota.maxDaily} कार्ड/दिन) समाप्त हो चुकी है।`);
        err.statusCode = 429;
        err.code = 'ERR_QUOTA_EXHAUSTED';
        err.details = quota;
        throw err;
      }
      return await this.saveEpaperWhatsAppGeneration({
        ...data,
        idempotencyKey,
        reporterId,
        reporterName: user?.fullName || data.reporterName || 'संवाददाता',
      }, user);
    } finally {
      release();
    }
  }

  async getEpaperWhatsAppGenerations(params = {}) {
    let list = [...(this.data.epaperWhatsAppGenerations || [])];
    if (params.reporterId) {
      list = list.filter((g) => g.reporterId === params.reporterId);
    }
    if (params.editionId) {
      list = list.filter((g) => g.editionId === params.editionId);
    }
    if (params.format) {
      list = list.filter((g) => g.format === params.format);
    }
    if (params.date) {
      list = list.filter((g) => g.createdAt.startsWith(params.date));
    }
    return list;
  }

  _getIndiaDateString(dateInput = new Date()) {
    try {
      const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(d);
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  }

  async getReporterWhatsAppQuota(reporterId, date = null) {
    const today = date || this._getIndiaDateString();
    const generations = (this.data.epaperWhatsAppGenerations || []).filter((g) => {
      if (g.reporterId !== reporterId) return false;
      const genDate = g.createdAt ? this._getIndiaDateString(g.createdAt) : '';
      return genDate === today || String(g.createdAt || '').startsWith(today);
    });
    const used = generations.length;

    let maxDaily = 20;
    if (this.data.reporterWhatsAppQuotas && this.data.reporterWhatsAppQuotas[reporterId] !== undefined) {
      maxDaily = Number(this.data.reporterWhatsAppQuotas[reporterId]);
    } else {
      const u = (this.data.users || []).find((x) => x.id === reporterId);
      if (u && u.customWhatsAppQuota !== undefined) {
        maxDaily = Number(u.customWhatsAppQuota);
      }
    }

    const remaining = Math.max(0, maxDaily - used);
    return {
      reporterId,
      date: today,
      used,
      maxDaily,
      remaining,
      quotaExceeded: remaining <= 0,
      timezone: 'Asia/Kolkata',
    };
  }

  async setReporterWhatsAppQuota(reporterId, quota) {
    if (!reporterId) throw new Error('ERR_INVALID_PARAM: reporterId is required');
    const numericQuota = Number(quota);
    if (isNaN(numericQuota) || numericQuota < 0) {
      throw new Error('ERR_INVALID_QUOTA: Quota must be a non-negative number');
    }
    this.data.reporterWhatsAppQuotas = this.data.reporterWhatsAppQuotas || {};
    this.data.reporterWhatsAppQuotas[reporterId] = numericQuota;

    const users = this.data.users || [];
    const idx = users.findIndex((u) => u.id === reporterId);
    if (idx !== -1) {
      users[idx] = {
        ...users[idx],
        customWhatsAppQuota: numericQuota,
        updatedAt: new Date().toISOString(),
      };
      this.data.users = users;
    }
    this.save();
    return {
      reporterId,
      maxDaily: numericQuota,
      timezone: 'Asia/Kolkata',
      updatedAt: new Date().toISOString(),
    };
  }

  // =========================================================================
  // WhatsApp Edition Generator & Multi-Story Package Management (STEP 8)
  // =========================================================================

  async getWhatsAppEligibleArticles(params = {}, user = null) {
    let list = [...(this.data.articles || [])];

    // Filter to eligible approved or published stories only
    const validEpaperStatuses = [
      'APPROVED_FOR_EPAPER',
      'ASSIGNED_TO_PAGE',
      'PAGE_DESIGNED',
      'QUALITY_CHECK',
      'FINAL_APPROVED',
    ];

    list = list.filter((a) => {
      const artStatus = String(a.status || '').toUpperCase();
      const epStatus = String(a.epaperWorkflow?.status || '').toUpperCase();
      // Strictly exclude REJECTED, DRAFT, PENDING
      if (['REJECTED', 'DRAFT', 'PENDING'].includes(artStatus)) return false;
      return artStatus === 'APPROVED' || artStatus === 'PUBLISHED' || validEpaperStatuses.includes(epStatus);
    });

    const userRole = String(user?.role || '').toUpperCase();
    const isStaff = ['ADMIN', 'MASTER_ADMIN', 'SUPER_ADMIN', 'EDITOR'].includes(userRole);

    // Strict Reporter Isolation: Reporters can ONLY select their own approved stories
    if (!isStaff) {
      const currentUserId = user?.id || '';
      const currentUserName = user?.fullName || user?.name || '';
      list = list.filter((a) => {
        return (
          a.authorId === currentUserId ||
          a.reporterId === currentUserId ||
          (currentUserName && (a.authorName === currentUserName || a.author === currentUserName))
        );
      });
    } else if (params.reporterId) {
      list = list.filter((a) => a.authorId === params.reporterId || a.reporterId === params.reporterId);
    }

    if (params.district) {
      const distLower = String(params.district).toLowerCase();
      list = list.filter((a) =>
        String(a.district || a.districtName || '').toLowerCase().includes(distLower)
      );
    }

    if (params.category) {
      const catLower = String(params.category).toLowerCase();
      list = list.filter((a) => String(a.category || '').toLowerCase().includes(catLower));
    }

    if (params.search) {
      const q = String(params.search).toLowerCase();
      list = list.filter((a) =>
        String(a.title || '').toLowerCase().includes(q) ||
        String(a.summary || '').toLowerCase().includes(q)
      );
    }

    return {
      items: list,
      total: list.length,
    };
  }

  async saveEpaperWhatsAppEditionPackage(data, user = null) {
    const reporterId = user?.id || data.reporterId || 'usr-reporter';
    const userRole = String(user?.role || '').toUpperCase();
    const isStaff = ['ADMIN', 'MASTER_ADMIN', 'SUPER_ADMIN'].includes(userRole);

    if (!data.format || !['1:1', '4:5'].includes(data.format)) {
      const err = new Error('ERR_VALIDATION: format (1:1 या 4:5) अनिवार्य है।');
      err.statusCode = 400;
      throw err;
    }

    if (!data.articleIds || !Array.isArray(data.articleIds) || data.articleIds.length === 0) {
      const err = new Error('ERR_VALIDATION: कम से कम एक समाचार (articleId) चुनना अनिवार्य है।');
      err.statusCode = 400;
      throw err;
    }

    const cardCount = data.articleIds.length;
    const release = await this._acquireReporterLock(reporterId);

    try {
      // 1. Quota Check: Needs cardCount remaining quota
      const today = this._getIndiaDateString();
      const quota = await this.getReporterWhatsAppQuota(reporterId, today);
      if (quota.quotaExceeded || quota.remaining < cardCount) {
        const err = new Error(`दैनिक व्हाट्सएप कार्ड निर्माण सीमा समाप्त हो चुकी है। आवश्यक: ${cardCount}, उपलब्ध: ${quota.remaining} (अधिकतम: ${quota.maxDaily})।`);
        err.statusCode = 429;
        err.code = 'ERR_QUOTA_EXHAUSTED';
        err.details = { ...quota, required: cardCount };
        throw err;
      }

      // 2. Validate all articles exist, are approved/published, and belong to reporter (if not staff)
      const articles = this.data.articles || [];
      const validArticles = [];

      for (const artId of data.articleIds) {
        const art = articles.find((a) => a.id === artId);
        if (!art) {
          const err = new Error(`ERR_ARTICLE_NOT_FOUND: चयनित समाचार ID ${artId} नहीं मिला।`);
          err.statusCode = 400;
          throw err;
        }

        const artStatus = String(art.status || '').toUpperCase();
        const epStatus = String(art.epaperWorkflow?.status || '').toUpperCase();
        const validEpaperStatuses = ['APPROVED_FOR_EPAPER', 'ASSIGNED_TO_PAGE', 'PAGE_DESIGNED', 'QUALITY_CHECK', 'FINAL_APPROVED'];
        const isEligible = artStatus === 'APPROVED' || artStatus === 'PUBLISHED' || validEpaperStatuses.includes(epStatus);

        if (!isEligible || ['REJECTED', 'DRAFT', 'PENDING'].includes(artStatus)) {
          const err = new Error(`ERR_ARTICLE_NOT_ELIGIBLE: समाचार '${art.title || artId}' स्वीकृत या प्रकाशित नहीं है।`);
          err.statusCode = 400;
          throw err;
        }

        if (!isStaff) {
          const currentUserId = user?.id || '';
          const currentUserName = user?.fullName || user?.name || '';
          const isOwner =
            art.authorId === currentUserId ||
            art.reporterId === currentUserId ||
            (currentUserName && (art.authorName === currentUserName || art.author === currentUserName));

          if (!isOwner) {
            const err = new Error(`ERR_FORBIDDEN: संवाददाता केवल अपनी स्वीकृत खबरों का चयन कर सकते हैं। '${art.title}' आपकी रिपोर्ट नहीं है।`);
            err.statusCode = 403;
            throw err;
          }
        }

        validArticles.push(art);
      }

      // 3. Atomically generate package and individual cards
      const packageId = `wa-pkg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const now = new Date().toISOString();
      const cards = [];

      this.data.epaperWhatsAppGenerations = this.data.epaperWhatsAppGenerations || [];

      for (let idx = 0; idx < validArticles.length; idx++) {
        const art = validArticles[idx];
        const cardId = `wa-card-${Date.now()}-${idx + 1}-${Math.random().toString(36).substring(2, 6)}`;
        const storagePath = `whatsapp/${reporterId}/${packageId}_card_${idx + 1}.png`;

        const cardItem = {
          id: cardId,
          packageId,
          cardIndex: idx + 1,
          articleId: art.id,
          reporterId,
          reporterName: user?.fullName || art.authorName || 'संवाददाता',
          reporterBadge: user?.badgeNumber || 'BNW-STRINGER',
          format: data.format,
          headline: art.title || '',
          body: art.summary || art.content || '',
          imageUrl: art.featuredImage || art.imageUrl || null,
          category: art.category || 'समाचार',
          districtName: art.districtName || art.district || 'मध्य प्रदेश',
          storagePath,
          isPrivate: true,
          createdAt: now,
          updatedAt: now,
          version: 1,
        };

        cards.push(cardItem);
        // Each card consumes 1 unit in epaperWhatsAppGenerations
        this.data.epaperWhatsAppGenerations.unshift(cardItem);
      }

      const pkgRecord = {
        id: packageId,
        editionTitle: data.editionTitle || 'दैनिक व्हाट्सएप बुलेटिन',
        format: data.format,
        reporterId,
        reporterName: user?.fullName || 'संवाददाता',
        reporterBadge: user?.badgeNumber || 'BNW-STRINGER',
        cardCount: cards.length,
        articleIds: data.articleIds,
        cards,
        quotaConsumed: cards.length,
        status: 'GENERATED',
        createdAt: now,
        updatedAt: now,
      };

      this.data.epaperWhatsAppEditionPackages = this.data.epaperWhatsAppEditionPackages || [];
      this.data.epaperWhatsAppEditionPackages.unshift(pkgRecord);
      this.save();

      return pkgRecord;
    } finally {
      release();
    }
  }

  async getEpaperWhatsAppEditionPackages(params = {}, user = null) {
    let list = [...(this.data.epaperWhatsAppEditionPackages || [])];
    const userRole = String(user?.role || '').toUpperCase();
    const isStaff = ['ADMIN', 'MASTER_ADMIN', 'SUPER_ADMIN'].includes(userRole);

    if (!isStaff && user?.id) {
      list = list.filter((p) => p.reporterId === user.id);
    } else if (params.reporterId) {
      list = list.filter((p) => p.reporterId === params.reporterId);
    }

    if (params.format) {
      list = list.filter((p) => p.format === params.format);
    }

    return list;
  }

  async getEpaperWhatsAppEditionPackageById(id, user = null) {
    const list = this.data.epaperWhatsAppEditionPackages || [];
    const pkg = list.find((p) => p.id === id);
    if (!pkg) return null;

    const userRole = String(user?.role || '').toUpperCase();
    const isStaff = ['ADMIN', 'MASTER_ADMIN', 'SUPER_ADMIN'].includes(userRole);

    if (!isStaff && user?.id && pkg.reporterId !== user.id) {
      const err = new Error('ERR_FORBIDDEN: आप किसी अन्य संवाददाता के पैकेज का विवरण नहीं देख सकते।');
      err.statusCode = 403;
      throw err;
    }

    return pkg;
  }

  async regenerateEpaperWhatsAppCard(packageId, cardId, updates = {}, user = null) {
    const reporterId = user?.id || updates.reporterId || 'usr-reporter';
    const userRole = String(user?.role || '').toUpperCase();
    const isStaff = ['ADMIN', 'MASTER_ADMIN', 'SUPER_ADMIN'].includes(userRole);

    const release = await this._acquireReporterLock(reporterId);
    try {
      // 1. Quota check: 1 unit required
      const today = this._getIndiaDateString();
      const quota = await this.getReporterWhatsAppQuota(reporterId, today);
      if (quota.quotaExceeded || quota.remaining < 1) {
        const err = new Error(`दैनिक व्हाट्सएप कार्ड निर्माण सीमा (${quota.maxDaily} कार्ड/दिन) समाप्त हो चुकी है। कार्ड पुनः निर्माण हेतु कम से कम 1 कोटा शेष होना चाहिए।`);
        err.statusCode = 429;
        err.code = 'ERR_QUOTA_EXHAUSTED';
        err.details = quota;
        throw err;
      }

      this.data.epaperWhatsAppEditionPackages = this.data.epaperWhatsAppEditionPackages || [];
      const pkg = this.data.epaperWhatsAppEditionPackages.find((p) => p.id === packageId);

      if (pkg && !isStaff && pkg.reporterId !== user?.id) {
        const err = new Error('ERR_FORBIDDEN: आप किसी अन्य संवाददाता के कार्ड को पुनः उत्पन्न नहीं कर सकते।');
        err.statusCode = 403;
        throw err;
      }

      const now = new Date().toISOString();
      let targetCard = null;

      if (pkg && Array.isArray(pkg.cards)) {
        const cIdx = pkg.cards.findIndex((c) => c.id === cardId || c.cardIndex === Number(cardId));
        if (cIdx !== -1) {
          targetCard = pkg.cards[cIdx];
          const newVersion = (targetCard.version || 1) + 1;
          const updatedCard = {
            ...targetCard,
            headline: updates.headline || targetCard.headline,
            body: updates.body || targetCard.body,
            imageUrl: updates.imageUrl !== undefined ? updates.imageUrl : targetCard.imageUrl,
            districtName: updates.districtName || targetCard.districtName,
            format: updates.format || targetCard.format,
            storagePath: `whatsapp/${reporterId}/${targetCard.id}_regen_${Date.now()}.png`,
            version: newVersion,
            updatedAt: now,
          };
          pkg.cards[cIdx] = updatedCard;
          pkg.quotaConsumed = (pkg.quotaConsumed || pkg.cards.length) + 1;
          pkg.updatedAt = now;
          targetCard = updatedCard;
        }
      }

      // Record regeneration consumption in generations history
      this.data.epaperWhatsAppGenerations = this.data.epaperWhatsAppGenerations || [];
      const regenRecord = {
        id: `wa-card-regen-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        packageId: packageId || null,
        originalCardId: cardId,
        reporterId,
        reporterName: user?.fullName || targetCard?.reporterName || 'संवाददाता',
        reporterBadge: user?.badgeNumber || targetCard?.reporterBadge || 'BNW-STRINGER',
        format: updates.format || targetCard?.format || '4:5',
        headline: updates.headline || targetCard?.headline || 'शीर्षक',
        body: updates.body || targetCard?.body || '',
        imageUrl: updates.imageUrl !== undefined ? updates.imageUrl : targetCard?.imageUrl,
        storagePath: `whatsapp/${reporterId}/${cardId}_regen_${Date.now()}.png`,
        isPrivate: true,
        isRegeneration: true,
        createdAt: now,
        updatedAt: now,
        version: targetCard ? targetCard.version : 2,
      };

      this.data.epaperWhatsAppGenerations.unshift(regenRecord);
      this.save();

      return {
        card: targetCard || regenRecord,
        package: pkg,
      };
    } finally {
      release();
    }
  }

  async saveEpaperAdSubmission(data, user = null) {
    this.data.epaperAdSubmissions = this.data.epaperAdSubmissions || [];

    const id = data?.id || `ad-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const existingIndex = this.data.epaperAdSubmissions.findIndex((a) => a.id === id);
    const existing = existingIndex >= 0 ? this.data.epaperAdSubmissions[existingIndex] : null;

    // Reporter Assignment & Permission Integrity
    const userRole = String(user?.role || '').toUpperCase();
    if (userRole === 'REPORTER' && existing) {
      if (existing.reporterId && existing.reporterId !== user.id && existing.assignedReporterId !== user.id) {
        const err = new Error('ERR_FORBIDDEN_REPORTER_ACCESS: आप किसी अन्य संवाददाता के विज्ञापन में संशोधन नहीं कर सकते।');
        err.statusCode = 403;
        err.code = 'ERR_FORBIDDEN_REPORTER_ACCESS';
        throw err;
      }
    }

    const advertiserName = data?.advertiserName || existing?.advertiserName;
    if (!advertiserName || !String(advertiserName).trim()) {
      const err = new Error('ERR_MISSING_AD_CONTACT_INFO: Required advertiser name is missing.');
      err.statusCode = 400;
      err.code = 'ERR_MISSING_AD_CONTACT_INFO';
      throw err;
    }

    const contactPhone = data?.contactPhone || existing?.contactPhone;
    if (!contactPhone || !String(contactPhone).trim()) {
      const err = new Error('ERR_MISSING_AD_CONTACT_INFO: Required contact/billing information is missing.');
      err.statusCode = 400;
      err.code = 'ERR_MISSING_AD_CONTACT_INFO';
      throw err;
    }

    // Image Format & Creative Validation
    if (data.imageUrl) {
      BroadsheetAdManager.validateImageCreative(data.imageUrl);
    }

    const submissionNumber = data.submissionNumber || (existing ? existing.submissionNumber : `ADV-MP-${new Date().toISOString().slice(0, 7).replace('-', '')}-${String(this.data.epaperAdSubmissions.length + 1).padStart(4, '0')}`);
    const timestamp = new Date().toISOString();

    const initialStatus = data.status || (existing ? existing.status : 'SUBMITTED');
    const history = Array.isArray(existing?.history) ? [...existing.history] : [];
    if (!existing) {
      history.push({
        status: initialStatus,
        changedAt: timestamp,
        changedBy: {
          id: user?.id || 'usr-system',
          name: user?.fullName || user?.name || 'संपादक',
          role: user?.role || 'ADMIN',
        },
        changeSummary: `विज्ञापन सृजित किया गया (${submissionNumber})`,
      });
    }

    const isSponsored = Boolean(data.isSponsored || data.isSponsoredContent || existing?.isSponsored || existing?.isSponsoredContent || data.category === 'SPONSORED_FEATURE');
    const badgeText = data.badgeText || (isSponsored ? 'प्रायोजित सामग्री' : 'विज्ञापन');

    const record = {
      ...(existing || {}),
      id,
      submissionNumber,
      title: data.title || data.headline || String(advertiserName).trim(),
      advertiserName: String(advertiserName).trim(),
      contactPhone: String(contactPhone).trim(),
      contactEmail: data.contactEmail || existing?.contactEmail || '',
      contactPerson: data.contactPerson || existing?.contactPerson || '',
      businessName: data.businessName || String(advertiserName).trim(),
      category: data.category || existing?.category || 'COMMERCIAL',
      slotType: data.slotType || existing?.slotType || 'CLASSIFIED',
      format: data.format || existing?.format || (BROADSHEET_RATE_CARDS[data.slotType]?.nameHi || 'मानक विज्ञापन'),
      dimensionsMm: data.dimensionsMm || existing?.dimensionsMm || (BROADSHEET_RATE_CARDS[data.slotType]?.dimensionsMm || '160 x 260 mm'),
      text: data.text || existing?.text || '',
      headline: data.headline || data.title || existing?.headline || String(advertiserName).trim(),
      bodyText: data.bodyText || data.text || existing?.bodyText || '',
      ctaText: data.ctaText || existing?.ctaText || 'अधिक जानकारी हेतु संपर्क करें',
      imageUrl: data.imageUrl !== undefined ? data.imageUrl : (existing?.imageUrl || ''),
      brandLogoUrl: data.brandLogoUrl || existing?.brandLogoUrl || '',
      productImageUrl: data.productImageUrl || existing?.productImageUrl || '',
      receiptNumber: data.receiptNumber || existing?.receiptNumber || '',
      amount: data.amount !== undefined ? Number(data.amount) : (existing?.amount !== undefined ? existing.amount : 250),
      billingStatus: data.billingStatus || existing?.billingStatus || 'PENDING',
      targetDistrict: data.targetDistrict || existing?.targetDistrict || 'dist-bhopal',
      targetDistrictName: data.targetDistrictName || existing?.targetDistrictName || 'भोपाल',
      targetEditionId: data.targetEditionId || existing?.targetEditionId || null,
      targetEditionTitle: data.targetEditionTitle || existing?.targetEditionTitle || null,
      targetPage: data.targetPage !== undefined ? Number(data.targetPage) : (existing?.targetPage || null),
      targetRegionId: data.targetRegionId || existing?.targetRegionId || null,
      startDate: data.startDate || existing?.startDate || timestamp.split('T')[0],
      endDate: data.endDate || existing?.endDate || null,
      publicationDate: data.publicationDate || existing?.publicationDate || null,
      publishedAt: data.publishedAt || existing?.publishedAt || null,
      placementPriority: data.placementPriority || existing?.placementPriority || 'NORMAL',
      isSponsored,
      isSponsoredContent: isSponsored,
      sponsoredLabel: badgeText,
      asciBadge: true,
      badgeText,
      status: initialStatus,
      statusHistory: history,
      reporterId: data.reporterId || (existing?.reporterId ? existing.reporterId : (user?.role === 'REPORTER' ? user.id : 'reporter-anonymous')),
      reporterName: data.reporterName || (existing?.reporterName ? existing.reporterName : (user?.role === 'REPORTER' ? (user.fullName || user.name) : 'संवाददाता')),
      reporterBadge: data.reporterBadge || existing?.reporterBadge || '',
      assignedReporterId: data.assignedReporterId !== undefined ? data.assignedReporterId : (existing?.assignedReporterId || null),
      assignedReporterName: data.assignedReporterName !== undefined ? data.assignedReporterName : (existing?.assignedReporterName || null),
      submittedBy: data.submittedBy || existing?.submittedBy || {
        id: user?.id || 'usr-system',
        name: user?.fullName || user?.name || 'उपयोगकर्ता',
        role: user?.role || 'ADMIN',
      },
      reviewedBy: data.reviewedBy || existing?.reviewedBy || null,
      reviewedAt: data.reviewedAt || existing?.reviewedAt || null,
      reviewNotes: data.reviewNotes || existing?.reviewNotes || null,
      aiGenerated: data.aiGenerated || existing?.aiGenerated || null,
      history,
      version: existing ? (existing.version || 1) + 1 : 1,
      createdAt: existing ? existing.createdAt : timestamp,
      updatedAt: timestamp,
    };

    if (existingIndex >= 0) {
      this.data.epaperAdSubmissions[existingIndex] = record;
    } else {
      this.data.epaperAdSubmissions.push(record);
    }

    this.save();
    this.addAuditLog(user?.fullName || 'संपादक', user?.role || 'ADMIN', 'EPAPER_AD_SAVE', `विज्ञापन सहेजा गया: "${record.title}" (${record.submissionNumber})`);
    return record;
  }

  async getEpaperAdSubmissions(params = {}) {
    let list = [...(this.data.epaperAdSubmissions || [])];

    if (params.status && params.status !== 'all') {
      const s = String(params.status).toUpperCase();
      list = list.filter((a) => {
        const cur = String(a.status || '').toUpperCase();
        if (s === 'PENDING') return cur === 'PENDING' || cur === 'PENDING_APPROVAL' || cur === 'SUBMITTED' || cur === 'UNDER_REVIEW';
        return cur === s;
      });
    }

    if (params.districtId && params.districtId !== 'all') {
      list = list.filter((a) => a.targetDistrict === params.districtId);
    }

    if (params.reporterId && params.reporterId !== 'all') {
      list = list.filter((a) => a.reporterId === params.reporterId);
    }

    if (params.assignedReporterId && params.assignedReporterId !== 'all') {
      list = list.filter((a) => a.assignedReporterId === params.assignedReporterId);
    }

    if (params.category && params.category !== 'all') {
      const cat = String(params.category).toUpperCase();
      list = list.filter((a) => String(a.category || '').toUpperCase() === cat);
    }

    if (params.slotType && params.slotType !== 'all') {
      const slot = String(params.slotType).toUpperCase();
      list = list.filter((a) => String(a.slotType || '').toUpperCase() === slot);
    }

    if (params.editionId && params.editionId !== 'all') {
      list = list.filter((a) => a.targetEditionId === params.editionId);
    }

    if (params.isSponsored !== undefined && params.isSponsored !== null) {
      const isSp = String(params.isSponsored) === 'true';
      list = list.filter((a) => Boolean(a.isSponsoredContent) === isSp);
    }

    if (params.search) {
      const q = String(params.search).toLowerCase().trim();
      list = list.filter((a) =>
        (a.advertiserName && a.advertiserName.toLowerCase().includes(q)) ||
        (a.title && a.title.toLowerCase().includes(q)) ||
        (a.submissionNumber && a.submissionNumber.toLowerCase().includes(q)) ||
        (a.contactPhone && a.contactPhone.toLowerCase().includes(q)) ||
        (a.text && a.text.toLowerCase().includes(q)) ||
        (a.reporterName && a.reporterName.toLowerCase().includes(q))
      );
    }

    list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return list;
  }

  async getEpaperAdSubmissionById(id) {
    const list = this.data.epaperAdSubmissions || [];
    return list.find((a) => a.id === id) || null;
  }

  async updateAdLifecycleStatus(id, targetStatus, user = null, notes = '') {
    this.data.epaperAdSubmissions = this.data.epaperAdSubmissions || [];
    const idx = this.data.epaperAdSubmissions.findIndex((a) => a.id === id);
    if (idx < 0) {
      const err = new Error(`ERR_AD_NOT_FOUND: विज्ञापन प्रविष्टि [${id}] नहीं मिली।`);
      err.statusCode = 404;
      err.code = 'ERR_AD_NOT_FOUND';
      throw err;
    }

    const current = this.data.epaperAdSubmissions[idx];
    const userRole = String(user?.role || '').toUpperCase();

    // Reporter ownership isolation
    if (userRole === 'REPORTER') {
      const isOwner = current.reporterId === user.id || current.assignedReporterId === user.id;
      if (!isOwner) {
        const err = new Error('ERR_FORBIDDEN: आप केवल अपने सौंपे गए विज्ञापनों की स्थिति ही बदल सकते हैं।');
        err.statusCode = 403;
        err.code = 'ERR_FORBIDDEN';
        throw err;
      }
    }

    // Validate Transition & RBAC
    BroadsheetAdManager.validateStatusTransition(current.status, targetStatus, user);

    const normTarget = String(targetStatus).toUpperCase();
    const timestamp = new Date().toISOString();
    const history = Array.isArray(current.history) ? [...current.history] : [];

    history.push({
      status: normTarget,
      changedAt: timestamp,
      changedBy: {
        id: user?.id || 'usr-system',
        name: user?.fullName || user?.name || 'संपादक',
        role: user?.role || 'ADMIN',
      },
      changeSummary: `विज्ञापन स्थिति अद्यतन: ${current.status || 'DRAFT'} → ${normTarget}`,
      notes: notes || '',
    });

    const updated = {
      ...current,
      status: normTarget,
      reviewedBy: ['APPROVED', 'REJECTED', 'UNDER_REVIEW'].includes(normTarget) ? (user?.fullName || user?.name || user?.id) : current.reviewedBy,
      reviewedAt: ['APPROVED', 'REJECTED', 'UNDER_REVIEW'].includes(normTarget) ? timestamp : current.reviewedAt,
      reviewNotes: notes || current.reviewNotes || '',
      updatedAt: timestamp,
      version: (current.version || 1) + 1,
      history,
      statusHistory: history,
    };

    if (normTarget === 'PUBLISHED') {
      updated.publishedAt = timestamp;
    }

    this.data.epaperAdSubmissions[idx] = updated;
    this.save();
    this.addAuditLog(user?.fullName || 'संपादक', user?.role || 'ADMIN', 'EPAPER_AD_STATUS_UPDATE', `विज्ञापन स्थिति बदली: "${updated.title}" -> ${normTarget}`);
    return updated;
  }

  async reviewEpaperAdSubmission(id, action, notes = '', user = null) {
    const normalized = String(action).toUpperCase();
    const targetStatus = normalized === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    return this.updateAdLifecycleStatus(id, targetStatus, user, notes);
  }

  async assignAdToEditionSlot(adId, editionId, pageNumber, slotDetails = {}, user = null) {
    const ad = await this.getEpaperAdSubmissionById(adId);
    if (!ad) {
      const err = new Error(`ERR_AD_NOT_FOUND: विज्ञापन [${adId}] नहीं मिला।`);
      err.statusCode = 404;
      err.code = 'ERR_AD_NOT_FOUND';
      throw err;
    }

    // Approval Gate check FIRST
    const adStatus = String(ad.status || '').toUpperCase();
    if (!['APPROVED', 'SCHEDULED', 'PUBLISHED'].includes(adStatus)) {
      const err = new Error(`ERR_AD_NOT_APPROVED: केवल अनुमोदित (APPROVED) विज्ञापन ही ई-पेपर पृष्ठ पर रखे जा सकते हैं। वर्तमान स्थिति: "${ad.status}"।`);
      err.statusCode = 400;
      err.code = 'ERR_AD_NOT_APPROVED';
      throw err;
    }

    const edition = await this.getEpaperEditionById(editionId);
    if (!edition) {
      const err = new Error(`ERR_EDITION_NOT_FOUND: ई-पेपर संस्करण [${editionId}] नहीं मिला।`);
      err.statusCode = 404;
      err.code = 'ERR_EDITION_NOT_FOUND';
      throw err;
    }

    // Published Edition Immutability Invariant
    if (edition.status === 'PUBLISHED') {
      const err = new Error('ERR_PUBLISHED_EDITION_IMMUTABLE: प्रकाशित संस्करण अपरिवर्तनीय है। नए विज्ञापन जोड़ने की अनुमति नहीं है।');
      err.statusCode = 400;
      err.code = 'ERR_PUBLISHED_EDITION_IMMUTABLE';
      throw err;
    }

    const pNum = Number(pageNumber);
    let page = await this.getEpaperPageByNumber(editionId, pNum);
    if (!page && Array.isArray(edition.pages)) {
      page = edition.pages.find((p) => p && typeof p === 'object' && p.pageNumber === pNum);
    }
    if (!page) {
      page = {
        id: `page-${editionId}-${pNum}`,
        editionId,
        pageNumber: pNum,
        gridColumns: 8,
        elements: [],
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await this.saveEpaperPage(page, user);
    }

    // Geometry Bounds Calculation
    const defaultDims = BroadsheetAdManager.getSlotDimensionsPt(ad.slotType);
    const bounds = slotDetails.bounds || {
      x: slotDetails.x !== undefined ? slotDetails.x : (page.gridColumns === 8 ? 42.52 : 42.52),
      y: slotDetails.y !== undefined ? slotDetails.y : 1200,
      width: slotDetails.width || defaultDims.width,
      height: slotDetails.height || defaultDims.height,
    };

    // Validation (Approval gate + bounds + 2D AABB collision)
    BroadsheetAdManager.validateAdPlacement(ad, bounds, 932.6, 1474.0, page.elements || []);

    // Create ad element
    const elementId = `el-ad-${ad.id}-${Date.now()}`;
    const adElement = {
      id: elementId,
      elementType: 'AD',
      adId: ad.id,
      adSlotType: ad.slotType,
      bounds,
      colSpan: slotDetails.colSpan || defaultDims.colSpan || 4,
      customHeadline: ad.headline || ad.title || ad.advertiserName,
      customBodyText: ad.bodyText || ad.text || (ad.contactPhone ? `संपर्क: ${ad.contactPhone}` : ''),
      imageUrl: ad.imageUrl || '',
      asciBadge: true,
      badgeText: ad.sponsoredLabel || 'विज्ञापन',
      isSponsoredContent: Boolean(ad.isSponsoredContent),
      zIndex: (page.elements || []).length + 1,
    };

    // Remove any previous placement of this ad on this page
    const filteredElements = (page.elements || []).filter((el) => el.adId !== ad.id && el.id !== ad.id);
    page.elements = [...filteredElements, adElement];

    // Persist page
    await this.saveEpaperPage(page, user);

    // Update Ad document
    ad.targetEditionId = editionId;
    ad.assignedEditionId = editionId;
    ad.targetEditionTitle = edition.title || edition.editionCode;
    ad.targetPage = pNum;
    ad.assignedPageNumber = pNum;
    ad.targetRegionId = slotDetails.regionId || null;
    ad.assignedSlotType = slotDetails.slotType || ad.slotType;
    ad.status = 'SCHEDULED';
    ad.updatedAt = new Date().toISOString();

    const history = Array.isArray(ad.history) ? [...ad.history] : [];
    history.push({
      status: 'SCHEDULED',
      changedAt: new Date().toISOString(),
      changedBy: {
        id: user?.id || 'usr-system',
        name: user?.fullName || user?.name || 'संपादक',
        role: user?.role || 'ADMIN',
      },
      changeSummary: `संस्करण "${edition.title || edition.editionCode}" पृष्ठ #${pNum} पर स्लॉट निर्धारित`,
    });
    ad.history = history;
    ad.statusHistory = history;

    this.save();
    this.addAuditLog(user?.fullName || 'संपादक', user?.role || 'ADMIN', 'EPAPER_AD_SCHEDULED', `विज्ञापन पृष्ठ पर निर्धारित: "${ad.title}" -> पृष्ठ ${pNum}`);
    return { ...ad, success: true, ad, element: adElement };
  }

  async removeAdFromEditionSlot(adId, editionId, pageNumber, user = null) {
    const edition = await this.getEpaperEditionById(editionId);
    if (!edition) {
      const err = new Error(`ERR_EDITION_NOT_FOUND: ई-पेपर संस्करण [${editionId}] नहीं मिला।`);
      err.statusCode = 404;
      err.code = 'ERR_EDITION_NOT_FOUND';
      throw err;
    }

    if (edition.status === 'PUBLISHED') {
      const err = new Error('ERR_PUBLISHED_EDITION_IMMUTABLE: प्रकाशित संस्करण से विज्ञापन हटाना वर्जित है।');
      err.statusCode = 400;
      err.code = 'ERR_PUBLISHED_EDITION_IMMUTABLE';
      throw err;
    }

    const pNum = Number(pageNumber);
    let page = await this.getEpaperPageByNumber(editionId, pNum);
    if (!page && Array.isArray(edition.pages)) {
      page = edition.pages.find((p) => p && typeof p === 'object' && p.pageNumber === pNum);
    }
    if (!page) {
      const err = new Error(`ERR_PAGE_NOT_FOUND: पृष्ठ #${pNum} नहीं मिला।`);
      err.statusCode = 404;
      err.code = 'ERR_PAGE_NOT_FOUND';
      throw err;
    }

    page.elements = (page.elements || []).filter((el) => el.adId !== adId && el.id !== adId);
    await this.saveEpaperPage(page, user);

    const ad = await this.getEpaperAdSubmissionById(adId);
    if (ad) {
      if (ad.status === 'SCHEDULED') {
        ad.status = 'APPROVED';
      }
      ad.targetEditionId = null;
      ad.assignedEditionId = null;
      ad.targetPage = null;
      ad.assignedPageNumber = null;
      ad.targetRegionId = null;
      ad.assignedSlotType = null;
      ad.updatedAt = new Date().toISOString();

      const history = Array.isArray(ad.history) ? [...ad.history] : [];
      history.push({
        status: ad.status,
        changedAt: new Date().toISOString(),
        changedBy: {
          id: user?.id || 'usr-system',
          name: user?.fullName || user?.name || 'संपादक',
          role: user?.role || 'ADMIN',
        },
        changeSummary: `संस्करण से विज्ञापन हटाया गया, स्थिति पुनः ${ad.status}`,
      });
      ad.history = history;
      ad.statusHistory = history;
      this.save();
    }

    return { ...(ad || {}), success: true, removedAdId: adId, ad };
  }

  async getAdReportingSummary(params = {}) {
    const list = this.data.epaperAdSubmissions || [];
    const statusCounts = {
      draft: 0,
      submitted: 0,
      underReview: 0,
      approved: 0,
      scheduled: 0,
      published: 0,
      completed: 0,
      rejected: 0,
      cancelled: 0,
      expired: 0,
      pending: 0,
    };

    const byCategory = {};
    const bySlotType = {};
    const byReporter = {};
    const byEdition = {};

    for (const ad of list) {
      const s = String(ad.status || 'DRAFT').toUpperCase();
      if (s === 'DRAFT') statusCounts.draft++;
      else if (s === 'SUBMITTED') statusCounts.submitted++;
      else if (s === 'UNDER_REVIEW') statusCounts.underReview++;
      else if (s === 'APPROVED') statusCounts.approved++;
      else if (s === 'SCHEDULED') statusCounts.scheduled++;
      else if (s === 'PUBLISHED') statusCounts.published++;
      else if (s === 'COMPLETED') statusCounts.completed++;
      else if (s === 'REJECTED') statusCounts.rejected++;
      else if (s === 'CANCELLED') statusCounts.cancelled++;
      else if (s === 'EXPIRED') statusCounts.expired++;
      else statusCounts.pending++;

      // Category
      const cat = ad.category || 'COMMERCIAL';
      byCategory[cat] = (byCategory[cat] || 0) + 1;

      // Slot
      const slot = ad.slotType || 'CLASSIFIED';
      bySlotType[slot] = (bySlotType[slot] || 0) + 1;

      // Reporter
      const repKey = ad.assignedReporterName || ad.reporterName || ad.reporterId || 'Unassigned';
      if (!byReporter[repKey]) {
        byReporter[repKey] = { total: 0, approved: 0, published: 0 };
      }
      byReporter[repKey].total++;
      if (s === 'APPROVED' || s === 'SCHEDULED' || s === 'PUBLISHED') byReporter[repKey].approved++;
      if (s === 'PUBLISHED' || s === 'COMPLETED') byReporter[repKey].published++;

      // Edition
      if (ad.targetEditionId) {
        byEdition[ad.targetEditionId] = (byEdition[ad.targetEditionId] || 0) + 1;
      }
    }

    // Slot Occupancy Metrics across editions
    const editions = this.data.epaperEditions || [];
    let totalConfiguredSlots = 0;
    let occupiedSlots = 0;

    for (const ed of editions) {
      for (const p of ed.pages || []) {
        for (const el of p.elements || []) {
          if (el.elementType === 'AD') {
            totalConfiguredSlots++;
            if (el.adId) occupiedSlots++;
          }
        }
      }
    }

    const availableSlots = Math.max(0, totalConfiguredSlots - occupiedSlots);
    const occupancyPercent = totalConfiguredSlots > 0 ? Number(((occupiedSlots / totalConfiguredSlots) * 100).toFixed(1)) : 0;

    let totalAmountPaise = 0;
    for (const ad of list) {
      const amt = Number(ad.amount || 0);
      totalAmountPaise += (amt > 1000 ? amt * 100 : amt * 100);
    }

    const statusBreakdown = {
      DRAFT: statusCounts.draft,
      SUBMITTED: statusCounts.submitted,
      UNDER_REVIEW: statusCounts.underReview,
      APPROVED: statusCounts.approved,
      SCHEDULED: statusCounts.scheduled,
      PUBLISHED: statusCounts.published,
      COMPLETED: statusCounts.completed,
      REJECTED: statusCounts.rejected,
      CANCELLED: statusCounts.cancelled,
      EXPIRED: statusCounts.expired,
    };

    return {
      totalAds: list.length,
      statusCounts,
      statusBreakdown,
      byCategory,
      categoryBreakdown: byCategory,
      bySlotType,
      slotBreakdown: bySlotType,
      byReporter,
      byEdition,
      totalAmountPaise,
      slotOccupancy: {
        totalConfiguredSlots,
        totalSlots: Math.max(totalConfiguredSlots, 13),
        occupiedSlots,
        availableSlots,
        occupancyPercent,
        occupancyRatePct: occupancyPercent,
      },
    };
  }

  async getAvailableAdSlots(editionId, pageNumber = null) {
    const edition = await this.getEpaperEditionById(editionId);
    if (!edition) return { totalSlots: 0, occupiedSlots: 0, availableSlots: 0, slots: [] };

    const pNum = pageNumber ? Number(pageNumber) : null;
    let pages = [];
    if (pNum) {
      const singlePage = await this.getEpaperPageByNumber(editionId, pNum);
      if (singlePage) pages.push(singlePage);
    } else {
      pages = await this.getEpaperPagesByEditionId(editionId);
    }
    if (pages.length === 0 && Array.isArray(edition.pages) && typeof edition.pages[0] === 'object') {
      pages = pNum ? edition.pages.filter((p) => p.pageNumber === pNum) : edition.pages;
    }
    const slots = [];

    for (const page of pages) {
      for (const el of page.elements || []) {
        if (el.elementType === 'AD') {
          slots.push({
            pageNumber: page.pageNumber,
            elementId: el.id,
            slotType: el.adSlotType || 'BOTTOM_STRIP',
            bounds: el.bounds,
            isOccupied: Boolean(el.adId),
            adId: el.adId || null,
            adTitle: el.customHeadline || '',
          });
        }
      }
    }

    const occupied = slots.filter((s) => s.isOccupied).length;
    return {
      totalSlots: slots.length,
      occupiedSlots: occupied,
      availableSlots: slots.length - occupied,
      slots,
    };
  }

  async saveEpaperVersionSnapshot(snapshot) {
    if (!snapshot) return null;
    const versionDoc = {
      id: snapshot.id || `${snapshot.editionId}-v${snapshot.versionNumber || 1}`,
      editionId: snapshot.editionId,
      versionNumber: snapshot.versionNumber || 1,
      versionTag: snapshot.versionTag || `${snapshot.versionNumber || 1}.0`,
      editionSnapshot: snapshot.editionSnapshot,
      pagesSnapshot: snapshot.pagesSnapshot || [],
      qualityReportSnapshot: snapshot.qualityReportSnapshot,
      snapshotData: snapshot.snapshotData || {
        edition: snapshot.editionSnapshot,
        pages: snapshot.pagesSnapshot || [],
        qualityReport: snapshot.qualityReportSnapshot,
      },
      publishedBy: snapshot.publishedBy,
      publishedAt: snapshot.publishedAt || new Date().toISOString(),
      immutable: true,
    };
    return this.saveEpaperEditionVersion(versionDoc);
  }

  async saveEpaperEditionVersion(versionDoc) {
    this.data.epaperEditionVersions = this.data.epaperEditionVersions || [];
    if (!versionDoc || !versionDoc.id) {
      throw new Error('ERR_INVALID_VERSION_DOC: Version document must have an id.');
    }
    const existing = this.data.epaperEditionVersions.find((v) => v.id === versionDoc.id);
    if (existing) {
      // Version snapshots are immutable
      return existing;
    }
    const record = {
      ...versionDoc,
      immutable: true,
      savedAt: new Date().toISOString(),
    };
    this.data.epaperEditionVersions.unshift(record);
    this.save();
    return record;
  }

  async getEpaperEditionVersions(editionId) {
    const list = (this.data.epaperEditionVersions || []).filter((v) => v.editionId === editionId);
    list.sort((a, b) => {
      const vA = a.versionNumber || (a.snapshotData?.edition?.version) || 0;
      const vB = b.versionNumber || (b.snapshotData?.edition?.version) || 0;
      return vB - vA;
    });
    return list;
  }

  async getEpaperEditionVersionById(id) {
    const list = this.data.epaperEditionVersions || [];
    return list.find((v) => v.id === id) || null;
  }

  async getPublishedEpaperSnapshot(editionId, versionNumber = null) {
    const versions = await this.getEpaperEditionVersions(editionId);
    if (!versions || versions.length === 0) {
      const active = await this.getEpaperEditionById(editionId);
      if (active && String(active.status).toUpperCase() === 'PUBLISHED') {
        const pages = await this.getEpaperPagesByEditionId(editionId);
        return {
          id: `${editionId}-v${active.version || 1}.0.0`,
          editionId,
          versionNumber: active.version || 1,
          versionTag: `v${active.version || 1}.0.0`,
          editionSnapshot: active,
          pagesSnapshot: pages,
          publishedAt: active.publishedAt || active.updatedAt,
          publishedBy: active.publishedBy || 'संपादक',
        };
      }
      return null;
    }

    if (versionNumber !== null && versionNumber !== undefined) {
      const vNum = Number(versionNumber);
      const matched = versions.find(
        (v) =>
          (v.versionNumber || v.snapshotData?.edition?.version) === vNum ||
          v.id === String(versionNumber) ||
          v.versionTag === String(versionNumber)
      );
      if (matched) {
        return {
          id: matched.id,
          editionId,
          versionNumber: matched.versionNumber || matched.snapshotData?.edition?.version || 1,
          versionTag: matched.versionTag || `v${matched.versionNumber || 1}.0.0`,
          editionSnapshot: matched.editionSnapshot || matched.snapshotData?.edition,
          pagesSnapshot: matched.pagesSnapshot || matched.snapshotData?.pages || [],
          publishedAt: matched.publishedAt || matched.snapshotData?.publishedAt,
          publishedBy: matched.publishedBy || matched.snapshotData?.publishedBy,
        };
      }
      return null;
    }

    // Default: latest published version snapshot
    const latest = versions[0];
    return {
      id: latest.id,
      editionId,
      versionNumber: latest.versionNumber || latest.snapshotData?.edition?.version || 1,
      versionTag: latest.versionTag || `v${latest.versionNumber || 1}.0.0`,
      editionSnapshot: latest.editionSnapshot || latest.snapshotData?.edition,
      pagesSnapshot: latest.pagesSnapshot || latest.snapshotData?.pages || [],
      publishedAt: latest.publishedAt || latest.snapshotData?.publishedAt,
      publishedBy: latest.publishedBy || latest.snapshotData?.publishedBy,
    };
  }

  async runEpaperQualityCheck(editionId, user = null, skipExportCheck = false) {
    const existing = await this.getEpaperEditionById(editionId);
    if (!existing) {
      const err = new Error('ERR_NOT_FOUND: ई-पेपर संस्करण नहीं मिला।');
      err.statusCode = 404;
      err.code = 'ERR_NOT_FOUND';
      throw err;
    }

    const pages = await this.getEpaperPagesByEditionId(editionId);
    const report = await QualityCheckerEngine.evaluateEdition({
      edition: existing,
      pages,
      adapter: this,
      user,
      skipExportCheck,
    });

    existing.qualityCheckResult = report;
    existing.isQualityStale = false;
    existing.updatedAt = new Date().toISOString();

    const idx = this.data.epaperEditions.findIndex((e) => e.id === editionId);
    if (idx >= 0) {
      this.data.epaperEditions[idx] = existing;
    }
    this.save();

    return report;
  }

  async grantEpaperQualityException(editionId, issueId, reason, user = null) {
    const existing = await this.getEpaperEditionById(editionId);
    if (!existing) {
      const err = new Error('ERR_NOT_FOUND: ई-पेपर संस्करण नहीं मिला।');
      err.statusCode = 404;
      err.code = 'ERR_NOT_FOUND';
      throw err;
    }

    let report = existing.qualityCheckResult;
    if (!report || existing.isQualityStale || report.isStale) {
      const pages = await this.getEpaperPagesByEditionId(editionId);
      report = await QualityCheckerEngine.evaluateEdition({
        edition: existing,
        pages,
        adapter: this,
        user,
        skipExportCheck: true,
      });
    }

    const result = QualityCheckerEngine.grantException({
      report,
      issueId,
      reason,
      user,
    });

    existing.qualityCheckResult = result.updatedReport;
    existing.updatedAt = new Date().toISOString();

    const idx = this.data.epaperEditions.findIndex((e) => e.id === editionId);
    if (idx >= 0) {
      this.data.epaperEditions[idx] = existing;
    }
    this.save();

    return result;
  }

  async approveEpaperEdition(editionId, expectedVersion = undefined, user = null, remarks = '') {
    const existing = await this.getEpaperEditionById(editionId);
    if (!existing) {
      const err = new Error('ERR_NOT_FOUND: ई-पेपर संस्करण नहीं मिला।');
      err.statusCode = 404;
      err.code = 'ERR_NOT_FOUND';
      throw err;
    }

    if (existing.status === 'PUBLISHED') {
      const err = new Error('ERR_EDITION_ALREADY_PUBLISHED: प्रकाशित ई-पेपर संस्करण का अनुमोदन स्तर परिवर्तित नहीं किया जा सकता।');
      err.statusCode = 400;
      err.code = 'ERR_EDITION_ALREADY_PUBLISHED';
      throw err;
    }

    // Invariant: AI agents CANNOT approve editions
    if (user?.isAi || user?.role === 'AI') {
      const err = new Error('ERR_AI_CANNOT_APPROVE: AI एजेंट को संस्करण अनुमोदित करने की अनुमति नहीं है। केवल अधिकृत मानव संपादक ही अंतिम अनुमोदन दे सकते हैं।');
      err.statusCode = 403;
      err.code = 'ERR_AI_CANNOT_APPROVE';
      throw err;
    }

    const userRoles = Array.isArray(user?.roles)
      ? user.roles.map((r) => String(r).toUpperCase())
      : [String(user?.role || user?.roles?.[0] || (user ? 'EDITOR' : '')).toUpperCase()];
    if (user?.role && !userRoles.includes(String(user.role).toUpperCase())) {
      userRoles.push(String(user.role).toUpperCase());
    }
    const allowedRoles = ['EDITOR', 'ADMIN', 'MASTER_ADMIN', 'SUPER_ADMIN', 'CHIEF_EDITOR'];
    if (!userRoles.some((r) => allowedRoles.includes(r))) {
      const err = new Error('ERR_FORBIDDEN: अंतिम संपादकीय अनुमोदन हेतु अधिकृत संपादक अथवा एडमिन पद आवश्यक है।');
      err.statusCode = 403;
      err.code = 'ERR_FORBIDDEN';
      throw err;
    }

    if (expectedVersion !== undefined && existing.version !== Number(expectedVersion)) {
      const err = new Error(`ERR_OCC_COLLISION: Version conflict. Current: ${existing.version}, Expected: ${expectedVersion}`);
      err.statusCode = 409;
      err.code = 'ERR_OCC_COLLISION';
      throw err;
    }

    const pages = await this.getEpaperPagesByEditionId(editionId);

    // Evaluate or verify quality
    let qualityReport = existing.qualityCheckResult;
    if (!qualityReport || existing.isQualityStale || qualityReport.isStale) {
      qualityReport = await QualityCheckerEngine.evaluateEdition({
        edition: existing,
        pages,
        adapter: this,
        user,
        skipExportCheck: true,
      });
      existing.qualityCheckResult = qualityReport;
      existing.isQualityStale = false;
    }

    if (!qualityReport.canApprove) {
      const err = new Error('ERR_QUALITY_CHECK_FAILED: संस्करण में अनसुलझी गंभीर (Critical) या त्रुटि (Error) आपत्तियां हैं। अनुमोदन से पूर्व इनका निवारण आवश्यक है।');
      err.statusCode = 422;
      err.code = 'ERR_QUALITY_CHECK_FAILED';
      err.qualityReport = qualityReport;
      throw err;
    }

    const now = new Date().toISOString();
    const updatedEdition = {
      ...existing,
      status: 'FINAL_APPROVED',
      finalApprovedAt: now,
      finalApprovedBy: user?.fullName || user?.name || 'मुख्य संपादक',
      finalApprovedRemarks: remarks || '',
      qualityCheckResult: qualityReport,
      isQualityStale: false,
      version: existing.version + 1,
      updatedAt: now,
    };

    const idx = this.data.epaperEditions.findIndex((e) => e.id === editionId);
    if (idx >= 0) {
      this.data.epaperEditions[idx] = updatedEdition;
    }
    this.save();

    return { success: true, edition: updatedEdition, qualityReport };
  }

  async scheduleEpaperEdition(editionId, scheduledPublishAtIst, expectedVersion = undefined, user = null) {
    const existing = await this.getEpaperEditionById(editionId);
    if (!existing) {
      const err = new Error('ERR_NOT_FOUND: ई-पेपर संस्करण नहीं मिला।');
      err.statusCode = 404;
      err.code = 'ERR_NOT_FOUND';
      throw err;
    }

    if (existing.status === 'PUBLISHED') {
      const err = new Error('ERR_EDITION_ALREADY_PUBLISHED: प्रकाशित ई-पेपर संस्करण को पुनः शेड्यूल नहीं किया जा सकता।');
      err.statusCode = 400;
      err.code = 'ERR_EDITION_ALREADY_PUBLISHED';
      throw err;
    }

    // Invariant: AI agents CANNOT schedule editions
    if (user?.isAi || user?.role === 'AI') {
      const err = new Error('ERR_AI_CANNOT_SCHEDULE: AI एजेंट को संस्करण शेड्यूल करने की अनुमति नहीं है।');
      err.statusCode = 403;
      err.code = 'ERR_AI_CANNOT_SCHEDULE';
      throw err;
    }

    const userRoles = Array.isArray(user?.roles)
      ? user.roles.map((r) => String(r).toUpperCase())
      : [String(user?.role || user?.roles?.[0] || (user ? 'EDITOR' : '')).toUpperCase()];
    if (user?.role && !userRoles.includes(String(user.role).toUpperCase())) {
      userRoles.push(String(user.role).toUpperCase());
    }
    const allowedRoles = ['EDITOR', 'ADMIN', 'MASTER_ADMIN', 'SUPER_ADMIN', 'CHIEF_EDITOR'];
    if (!userRoles.some((r) => allowedRoles.includes(r))) {
      const err = new Error('ERR_FORBIDDEN: ई-पेपर शेड्यूलिंग हेतु संपादक अथवा एडमिन अधिकार आवश्यक हैं।');
      err.statusCode = 403;
      err.code = 'ERR_FORBIDDEN';
      throw err;
    }

    // Invariant: Must be in FINAL_APPROVED or APPROVED state before scheduling
    if (existing.status !== 'FINAL_APPROVED' && existing.status !== 'APPROVED') {
      const err = new Error('ERR_EDITION_NOT_APPROVED: केवल अंतिम रूप से स्वीकृत (FINAL_APPROVED) संस्करण ही शेड्यूलिंग हेतु पात्र हैं।');
      err.statusCode = 400;
      err.code = 'ERR_EDITION_NOT_APPROVED';
      throw err;
    }

    if (!scheduledPublishAtIst) {
      const err = new Error('ERR_INVALID_SCHEDULE_TIME: निर्धारित प्रकाशन समय (IST) अनिवार्य है।');
      err.statusCode = 400;
      err.code = 'ERR_INVALID_SCHEDULE_TIME';
      throw err;
    }

    if (expectedVersion !== undefined && existing.version !== Number(expectedVersion)) {
      const err = new Error(`ERR_OCC_COLLISION: Version conflict. Current: ${existing.version}, Expected: ${expectedVersion}`);
      err.statusCode = 409;
      err.code = 'ERR_OCC_COLLISION';
      throw err;
    }

    const now = new Date().toISOString();
    const updatedEdition = {
      ...existing,
      status: 'SCHEDULED',
      scheduledPublishAtIst,
      scheduledPublishAt: new Date(scheduledPublishAtIst).toISOString(),
      scheduledBy: user?.fullName || user?.name || 'संपादक',
      scheduledAt: now,
      version: existing.version + 1,
      updatedAt: now,
    };

    const idx = this.data.epaperEditions.findIndex((e) => e.id === editionId);
    if (idx >= 0) {
      this.data.epaperEditions[idx] = updatedEdition;
    }
    this.save();

    return { success: true, edition: updatedEdition };
  }

  async createEpaperPostPublicationCorrection(editionId, user = null, remarks = '') {
    const existing = await this.getEpaperEditionById(editionId);
    if (!existing) {
      const err = new Error('ERR_NOT_FOUND: ई-पेपर संस्करण नहीं मिला।');
      err.statusCode = 404;
      err.code = 'ERR_NOT_FOUND';
      throw err;
    }

    if (existing.status !== 'PUBLISHED') {
      const err = new Error('ERR_EDITION_NOT_PUBLISHED: सुधार (Post-Publication Correction) केवल पहले से प्रकाशित संस्करणों हेतु बनाया जा सकता है।');
      err.statusCode = 400;
      err.code = 'ERR_EDITION_NOT_PUBLISHED';
      throw err;
    }

    const userRoles = Array.isArray(user?.roles)
      ? user.roles.map((r) => String(r).toUpperCase())
      : [String(user?.role || user?.roles?.[0] || (user ? 'EDITOR' : '')).toUpperCase()];
    if (user?.role && !userRoles.includes(String(user.role).toUpperCase())) {
      userRoles.push(String(user.role).toUpperCase());
    }
    const allowedRoles = ['EDITOR', 'ADMIN', 'MASTER_ADMIN', 'SUPER_ADMIN', 'CHIEF_EDITOR'];
    if (!userRoles.some((r) => allowedRoles.includes(r))) {
      const err = new Error('ERR_FORBIDDEN: मरणोपरांत / प्रकाशन उपरांत संशोधन प्रारंभ करने हेतु संपादकीय अधिकार आवश्यक हैं।');
      err.statusCode = 403;
      err.code = 'ERR_FORBIDDEN';
      throw err;
    }

    // Published snapshot is already immutable in epaperEditionVersions!
    // We now transition the working copy to LAYOUT_IN_PROGRESS with revision details and bump version
    const now = new Date().toISOString();
    const publishedVersion = existing.version;
    const revisedVersion = publishedVersion + 1;

    const updatedEdition = {
      ...existing,
      status: 'LAYOUT_IN_PROGRESS',
      isQualityStale: true,
      qualityCheckResult: null,
      correctionRequestedAt: now,
      correctionRequestedBy: user?.fullName || user?.name || 'संपादक',
      correctionRemarks: remarks || 'प्रकाशन पश्चात संशोधन आरंभ',
      previousPublishedVersion: publishedVersion,
      version: revisedVersion,
      updatedAt: now,
    };

    const idx = this.data.epaperEditions.findIndex((e) => e.id === editionId);
    if (idx >= 0) {
      this.data.epaperEditions[idx] = updatedEdition;
    }
    this.save();

    return {
      success: true,
      edition: updatedEdition,
      previousPublishedVersion: publishedVersion,
      message: `प्रकाशन पश्चात सुधार ड्राफ्ट (v${revisedVersion}) सक्रिय किया गया। पूर्व प्रकाशित संस्करण v${publishedVersion} अपरिवर्तनीय सुरक्षित है।`,
    };
  }

  async publishEpaperEdition(editionId, expectedVersion = undefined, user = null) {
    const existing = await this.getEpaperEditionById(editionId);
    if (!existing) {
      const err = new Error('ERR_NOT_FOUND: ई-पेपर संस्करण नहीं मिला।');
      err.statusCode = 404;
      err.code = 'ERR_NOT_FOUND';
      throw err;
    }

    // Invariant: Already published editions CANNOT be republished directly
    if (existing.status === 'PUBLISHED') {
      const err = new Error('ERR_EDITION_ALREADY_PUBLISHED: संस्करण पहले से प्रकाशित है। प्रकाशित संस्करण को पुनः प्रकाशित नहीं किया जा सकता।');
      err.statusCode = 400;
      err.code = 'ERR_EDITION_ALREADY_PUBLISHED';
      throw err;
    }

    // Invariant: AI agents CANNOT publish editions under any circumstances
    if (user?.isAi || user?.role === 'AI') {
      const err = new Error('ERR_AI_CANNOT_PUBLISH: AI एजेंट को संस्करण प्रकाशित करने की अनुमति नहीं है। केवल अधिकृत मानव संपादक ही प्रकाशित कर सकते हैं।');
      err.statusCode = 403;
      err.code = 'ERR_AI_CANNOT_PUBLISH';
      throw err;
    }

    // Invariant: Role authorization check
    const userRoles = Array.isArray(user?.roles)
      ? user.roles.map((r) => String(r).toUpperCase())
      : [String(user?.role || user?.roles?.[0] || (user ? 'EDITOR' : '')).toUpperCase()];
    if (user?.role && !userRoles.includes(String(user.role).toUpperCase())) {
      userRoles.push(String(user.role).toUpperCase());
    }
    const allowedRoles = ['EDITOR', 'ADMIN', 'MASTER_ADMIN', 'SUPER_ADMIN', 'CHIEF_EDITOR'];
    if (!userRoles.some((r) => allowedRoles.includes(r))) {
      const err = new Error('ERR_FORBIDDEN: ई-पेपर प्रकाशन हेतु अधिकृत संपादक अथवा एडमिन पद आवश्यक है।');
      err.statusCode = 403;
      err.code = 'ERR_FORBIDDEN';
      throw err;
    }

    if (expectedVersion !== undefined && existing.version !== Number(expectedVersion)) {
      const err = new Error(`ERR_OCC_COLLISION: Version conflict. Current: ${existing.version}, Expected: ${expectedVersion}`);
      err.statusCode = 409;
      err.code = 'ERR_OCC_COLLISION';
      throw err;
    }

    const pages = await this.getEpaperPagesByEditionId(editionId);

    // Quality Gate Invariant (Step 10):
    // If quality check is absent, stale, or has unresolved CRITICAL/ERROR issues, publishing is strictly BLOCKED.
    let qualityReport = existing.qualityCheckResult;
    if (!qualityReport || existing.isQualityStale || qualityReport.isStale) {
      qualityReport = await QualityCheckerEngine.evaluateEdition({
        edition: existing,
        pages,
        adapter: this,
        user,
        skipExportCheck: true,
      });
      existing.qualityCheckResult = qualityReport;
      existing.isQualityStale = false;
    }

    if (!qualityReport.canPublish) {
      const err = new Error('ERR_QUALITY_CHECK_FAILED: संस्करण में गंभीर अथवा त्रुटि स्तर की गुणवत्ता आपत्तियां विद्यमान हैं। प्रकाशन पूर्व इनका निवारण आवश्यक है।');
      err.statusCode = 422;
      err.code = 'ERR_QUALITY_CHECK_FAILED';
      err.qualityReport = qualityReport;
      throw err;
    }

    const versionTag = `v${existing.version}.0.0`;
    const snapshotId = `${editionId}-${versionTag}`;
    const publishedAt = new Date().toISOString();
    const publishedBy = user?.fullName || user?.name || 'संपादक';

    const snapshot = {
      id: snapshotId,
      editionId,
      versionNumber: existing.version,
      versionTag,
      editionSnapshot: JSON.parse(JSON.stringify(existing)),
      pagesSnapshot: JSON.parse(JSON.stringify(pages)),
      qualityReportSnapshot: JSON.parse(JSON.stringify(qualityReport)),
      snapshotData: {
        edition: JSON.parse(JSON.stringify(existing)),
        pages: JSON.parse(JSON.stringify(pages)),
        qualityReport: JSON.parse(JSON.stringify(qualityReport)),
      },
      publishedBy,
      publishedAt,
      immutable: true,
    };

    await this.saveEpaperEditionVersion(snapshot);

    const updatedEdition = {
      ...existing,
      status: 'PUBLISHED',
      publishedAt,
      publishedBy,
      isQualityStale: false,
      qualityCheckResult: qualityReport,
      version: existing.version + 1,
      updatedAt: publishedAt,
    };

    const idx = this.data.epaperEditions.findIndex((e) => e.id === editionId);
    if (idx >= 0) {
      this.data.epaperEditions[idx] = updatedEdition;
    }
    this.save();

    return { edition: updatedEdition, snapshot };
  }

  // =========================================================================
  // STEP 7: E-PAPER REPORTER WORKSPACE & PROFILE INTEGRATION METHODS
  // =========================================================================

  async getReporterProfile(reporterId) {
    if (!reporterId) return null;
    const cleanId = String(reporterId).trim().toLowerCase();

    // 1. Check existing reporters collection
    const reps = this.data.reporters || [];
    let found = reps.find((r) =>
      String(r.id || '').toLowerCase() === cleanId ||
      String(r.badgeNumber || '').toLowerCase() === cleanId ||
      String(r.email || '').toLowerCase() === cleanId ||
      (cleanId === 'rep-001' && (r.id === 'rep-active' || r.badgeNumber === 'BNW-REP-0101'))
    );

    if (found) {
      return {
        ...found,
        verificationStatus: found.verificationStatus || (found.status === 'ACTIVE' ? 'VERIFIED' : 'PENDING'),
        bureau: found.bureau || (found.assignedDivision ? `${found.assignedDivision} ब्यूरो` : `${(found.assignedDistricts && found.assignedDistricts[0]) || 'भोपाल'} ब्यूरो`),
      };
    }

    // 2. Check users collection for matching user
    const users = this.data.users || [];
    const matchedUser = users.find((u) =>
      String(u.id || '').toLowerCase() === cleanId ||
      String(u.badgeNumber || '').toLowerCase() === cleanId ||
      String(u.email || '').toLowerCase() === cleanId
    );

    if (matchedUser) {
      // Check if user links to a reporter in reps
      if (matchedUser.badgeNumber || matchedUser.email) {
        const byBadge = reps.find((r) =>
          (matchedUser.badgeNumber && String(r.badgeNumber || '').toLowerCase() === String(matchedUser.badgeNumber).toLowerCase()) ||
          (matchedUser.email && String(r.email || '').toLowerCase() === String(matchedUser.email).toLowerCase())
        );
        if (byBadge) return { ...byBadge, userId: matchedUser.id, bureau: byBadge.bureau || `${(byBadge.assignedDistricts && byBadge.assignedDistricts[0]) || 'भोपाल'} ब्यूरो` };
      }

      // Synthesize reporter profile from user record
      const syntheticProfile = {
        id: matchedUser.id,
        name: matchedUser.fullName || matchedUser.name || 'संवाददाता',
        email: matchedUser.email || '',
        phone: matchedUser.phoneNumber || matchedUser.phone || '+91 98260 00000',
        role: matchedUser.roles?.includes('REPORTER') ? 'reporter' : 'reporter',
        assignedDistricts: matchedUser.assignedDistricts || [matchedUser.district || 'भोपाल'],
        assignedDivision: matchedUser.assignedDivision || 'भोपाल संभाग',
        beats: matchedUser.beats || ['सामान्य समाचार', 'शासन-प्रशासन'],
        totalStoriesFiled: 0,
        totalStoriesPublished: 0,
        badgeNumber: matchedUser.badgeNumber || `BNW-REP-${matchedUser.id.replace(/\D/g, '') || '0101'}`,
        joinedDate: matchedUser.createdAt ? new Date(matchedUser.createdAt).toLocaleDateString('hi-IN') : '15 जनवरी 2024',
        avatar: matchedUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
        status: matchedUser.status || 'ACTIVE',
        verificationStatus: matchedUser.verificationStatus || 'VERIFIED',
        bureau: matchedUser.bureau || `${matchedUser.district || 'भोपाल'} ब्यूरो`,
        bio: matchedUser.bio || 'क्षेत्रीय संवाददाता, ब्रेकिंग न्यूज़ वाला।',
      };
      return syntheticProfile;
    }

    return null;
  }

  async getReporterWorkspaceSummary(reporterId, user = null) {
    if (!reporterId) {
      const err = new Error('ERR_INVALID_PARAM: reporterId अनिवार्य है।');
      err.statusCode = 400;
      err.code = 'ERR_INVALID_PARAM';
      throw err;
    }

    // IDOR Protection: Non-staff reporters can only access their own workspace
    if (user) {
      const userRoles = [...(Array.isArray(user.roles) ? user.roles : []), user.role]
        .filter(Boolean)
        .map((r) => String(r).toUpperCase().replace(/^ROLE_/, ''));
      const isStaff = userRoles.some((r) =>
        ['MASTER_ADMIN', 'SUPER_ADMIN', 'ADMIN', 'CHIEF_EDITOR', 'MANAGING_EDITOR', 'EDITOR'].includes(r)
      );

      if (!isStaff) {
        const uId = String(user.id || user.uid || '').toLowerCase();
        const uBadge = String(user.badgeNumber || '').toLowerCase();
        const uEmail = String(user.email || '').toLowerCase();
        const target = String(reporterId).toLowerCase();

        const isSelf = target === uId || target === uBadge || target === uEmail;
        if (!isSelf) {
          const err = new Error('ERR_FORBIDDEN: संवाददाता केवल अपना स्वयं का कार्यक्षेत्र देख सकते हैं।');
          err.statusCode = 403;
          err.code = 'ERR_FORBIDDEN';
          throw err;
        }
      }
    }

    const profile = await this.getReporterProfile(reporterId);
    if (!profile) {
      const err = new Error(`ERR_REPORTER_NOT_FOUND: संवाददाता प्रोफाइल [${reporterId}] नहीं मिली।`);
      err.statusCode = 404;
      err.code = 'ERR_REPORTER_NOT_FOUND';
      throw err;
    }

    // Build identifier match set
    const idSet = new Set([
      String(profile.id || '').toLowerCase(),
      String(profile.badgeNumber || '').toLowerCase(),
      String(profile.email || '').toLowerCase(),
      String(reporterId).toLowerCase(),
    ].filter(Boolean));

    if (user && String(user.id || '').toLowerCase() === String(reporterId).toLowerCase()) {
      if (user.badgeNumber) idSet.add(String(user.badgeNumber).toLowerCase());
      if (user.email) idSet.add(String(user.email).toLowerCase());
    }

    if (profile.id === 'rep-active' || profile.badgeNumber === 'BNW-REP-0101' || String(reporterId).toLowerCase() === 'rep-001') {
      idSet.add('rep-001');
      idSet.add('rep-active');
    }

    const repNameLower = String(profile.name || '').trim().toLowerCase();
    const baseRepName = repNameLower.replace(/\s*\(.*?\)\s*/g, '').trim();

    // 1. Match Reporter's Articles
    const allArticles = this.data.articles || [];
    const reporterArticles = allArticles.filter((a) => {
      const aAuthId = String(a.authorId || '').toLowerCase();
      const aRepId = String(a.reporterId || '').toLowerCase();
      const aAuthName = String(a.authorName || '').trim().toLowerCase();
      const aByline = String(a.byline || '').trim().toLowerCase();
      const baseAuthName = aAuthName.replace(/\s*\(.*?\)\s*/g, '').trim();

      const isNameMatch = repNameLower && (
        aAuthName === repNameLower ||
        aByline === repNameLower ||
        (baseRepName && (baseAuthName === baseRepName || aByline === baseRepName))
      );

      return (
        idSet.has(aAuthId) ||
        idSet.has(aRepId) ||
        isNameMatch
      );
    });

    // 2. Cross-reference with E-Paper Editions & Pages
    const editions = this.data.epaperEditions || [];
    const pages = this.data.epaperPages || [];

    // Map: articleId -> placement details
    const placementMap = new Map();

    for (const page of pages) {
      for (const el of page.elements || []) {
        if (el.elementType === 'STORY' && el.articleId) {
          const artKey = String(el.articleId);
          const parentEdition = editions.find((e) => e.id === page.editionId);
          placementMap.set(artKey, {
            editionId: page.editionId,
            editionTitle: parentEdition ? parentEdition.title : 'दैनिक संस्करण',
            editionDate: parentEdition ? (parentEdition.publicationDate || parentEdition.createdAt) : '',
            editionStatus: parentEdition ? parentEdition.status : 'DRAFT',
            editionType: parentEdition ? (parentEdition.editionType || 'DAILY') : 'DAILY',
            pageNumber: page.pageNumber,
            pageId: page.id,
            slotId: el.slotId || el.id,
            bylineCredit: el.byline || profile.name || 'संवाददाता',
            readerUrl: `/epaper?edition=${page.editionId}&page=${page.pageNumber}`,
          });
        }
      }
    }

    // 3. Transform Contributions
    const contributions = reporterArticles.map((a) => {
      const artKey = String(a.id);
      const slugKey = String(a.slug || '');
      const placement = placementMap.get(artKey) || (slugKey ? placementMap.get(slugKey) : null);

      const hasImg = Boolean(a.featuredImage || a.imageUrl);
      const imgStatus = hasImg ? 'VALID' : 'MISSING';
      const text = `${a.title || ''} ${a.summary || ''} ${a.content || ''}`;
      const charCount = text.length;
      const wordCount = text.split(/\s+/).filter(Boolean).length;

      const assignment = placement || (a.epaperWorkflow?.assignedEditionId ? {
        editionId: a.epaperWorkflow.assignedEditionId,
        editionTitle: a.epaperWorkflow.editionTitle || 'दैनिक संस्करण',
        editionDate: a.epaperWorkflow.editionDate || '',
        editionStatus: a.epaperWorkflow.editionStatus || 'DRAFT',
        editionType: a.epaperWorkflow.editionType || 'DAILY',
        pageNumber: a.epaperWorkflow.assignedPageNumber || 1,
        pageId: a.epaperWorkflow.pageId || '',
        slotId: a.epaperWorkflow.slotId || '',
        bylineCredit: a.byline || profile.name,
        readerUrl: `/epaper?edition=${a.epaperWorkflow.assignedEditionId}&page=${a.epaperWorkflow.assignedPageNumber || 1}`,
      } : undefined);

      return {
        articleId: a.id,
        headline: a.title,
        summary: a.summary || '',
        category: a.categoryName || a.category || 'सामान्य',
        categoryId: a.categoryId,
        district: a.districtName || a.district || (profile.assignedDistricts && profile.assignedDistricts[0]) || 'भोपाल',
        districtId: a.districtId,
        submissionDate: parseNormalizedTimestamp(a.submittedAt || a.createdAt),
        status: a.status || 'SUBMITTED',
        workflowStatus: a.epaperWorkflow?.status || (placement ? 'ASSIGNED_TO_PAGE' : (a.status === 'PUBLISHED' ? 'PUBLISHED' : (a.status === 'APPROVED' ? 'APPROVED' : 'EDITORIAL_REVIEW'))),
        hasImage: hasImg,
        imageUrl: a.featuredImage || a.imageUrl || '',
        imageStatus: imgStatus,
        epaperAssignment: assignment,
        editorialRemarks: a.editorialRemarks || a.epaperWorkflow?.editorialRemarks || a.rejectionReason || a.editorialFeedback || '',
        rejectionReason: a.rejectionReason || '',
        characterCount: charCount,
        wordCount: wordCount,
        priority: a.priority || 'NORMAL',
        byline: a.byline || profile.name,
        publishedAt: a.publishedAt,
      };
    });

    // 4. Transform Published History (Only published editions)
    const publishedHistory = [];
    for (const c of contributions) {
      const isEditionPublished = c.epaperAssignment?.editionStatus === 'PUBLISHED';
      const isArticlePublished = c.status === 'PUBLISHED';

      if (isEditionPublished || (isArticlePublished && c.epaperAssignment)) {
        publishedHistory.push({
          articleId: c.articleId,
          headline: c.headline,
          bylineCredit: c.epaperAssignment?.bylineCredit || c.byline || profile.name,
          publicationDate: c.epaperAssignment?.editionDate || c.publishedAt || c.submissionDate,
          editionId: c.epaperAssignment?.editionId || '',
          editionTitle: c.epaperAssignment?.editionTitle || 'दैनिक संस्करण',
          editionType: c.epaperAssignment?.editionType || 'DAILY',
          pageNumber: c.epaperAssignment?.pageNumber || 1,
          pageId: c.epaperAssignment?.pageId,
          imageUrl: c.imageUrl,
          readerUrl: c.epaperAssignment?.readerUrl || `/epaper?edition=${c.epaperAssignment?.editionId}&page=${c.epaperAssignment?.pageNumber || 1}`,
          pageThumbnailUrl: c.imageUrl || '',
          isReadOnly: true,
          districtName: c.district,
          categoryName: c.category,
          publishedAt: c.publishedAt,
        });
      }
    }

    // 5. Match Reporter's Assigned Advertisements (Step 6)
    const allAds = this.data.epaperAdSubmissions || [];
    const assignedAds = allAds.filter((ad) => {
      const adRepId = String(ad.reporterId || '').toLowerCase();
      const adAssignedId = String(ad.assignedReporterId || '').toLowerCase();
      return idSet.has(adRepId) || idSet.has(adAssignedId);
    });

    // 6. Calculate Real Metrics (Persisted values only)
    const approvedStatuses = ['APPROVED', 'PUBLISHED', 'ASSIGNED_TO_PAGE', 'PAGE_DESIGNED', 'QUALITY_CHECK', 'FINAL_APPROVED'];
    const reviewStatuses = ['PENDING_REVIEW', 'UNDER_REVIEW', 'IN_REVIEW', 'EDITORIAL_REVIEW', 'SUBMITTED'];
    const returnedStatuses = ['REJECTED', 'CHANGES_REQUESTED', 'RETURNED'];

    const totalSubmittedNews = contributions.length;
    const approvedNews = contributions.filter((c) =>
      approvedStatuses.includes(String(c.status).toUpperCase()) ||
      approvedStatuses.includes(String(c.workflowStatus).toUpperCase())
    ).length;

    const epaperSelectedNews = contributions.filter((c) =>
      Boolean(c.epaperAssignment) ||
      ['APPROVED_FOR_EPAPER', 'ASSIGNED_TO_PAGE', 'PAGE_DESIGNED', 'QUALITY_CHECK', 'FINAL_APPROVED', 'PUBLISHED'].includes(String(c.workflowStatus).toUpperCase())
    ).length;

    const publishedEpaperStories = publishedHistory.length;
    const pendingReviewNews = contributions.filter((c) =>
      reviewStatuses.includes(String(c.status).toUpperCase()) ||
      reviewStatuses.includes(String(c.workflowStatus).toUpperCase())
    ).length;

    const returnedNews = contributions.filter((c) =>
      returnedStatuses.includes(String(c.status).toUpperCase()) ||
      returnedStatuses.includes(String(c.workflowStatus).toUpperCase()) ||
      Boolean(c.rejectionReason)
    ).length;

    const publishedAds = assignedAds.filter((ad) =>
      ad.status === 'PUBLISHED' || ad.status === 'COMPLETED'
    ).length;

    // 7. Load WhatsApp Status & Quota
    let whatsappQuota = null;
    let whatsappHistory = [];
    try {
      whatsappQuota = await this.getReporterWhatsAppQuota(profile.id || reporterId);
      whatsappHistory = await this.getEpaperWhatsAppGenerations({ reporterId: profile.id || reporterId });
    } catch {
      whatsappQuota = { reporterId: profile.id, date: new Date().toISOString().split('T')[0], used: 0, maxDaily: 20, remaining: 20, quotaExceeded: false, timezone: 'Asia/Kolkata' };
    }

    // 8. Generate Activity Feed
    const activities = [];

    for (const c of contributions) {
      if (c.submissionDate) {
        activities.push({
          id: `act-sub-${c.articleId}`,
          reporterId: profile.id,
          type: 'ARTICLE_SUBMITTED',
          title: 'समाचार प्रेषित किया गया',
          description: `"${c.headline.slice(0, 45)}..." संपादकीय समीक्षा हेतु प्रेषित।`,
          timestamp: c.submissionDate,
          metadata: { articleId: c.articleId, headline: c.headline },
        });
      }
      if (c.status === 'APPROVED' || c.workflowStatus === 'APPROVED') {
        activities.push({
          id: `act-app-${c.articleId}`,
          reporterId: profile.id,
          type: 'ARTICLE_APPROVED',
          title: 'समाचार स्वीकृत हुआ',
          description: `संपादक द्वारा "${c.headline.slice(0, 45)}..." स्वीकृत किया गया।`,
          timestamp: parseNormalizedTimestamp(c.publishedAt || c.submissionDate),
          metadata: { articleId: c.articleId, headline: c.headline },
        });
      }
      if (c.editorialRemarks || c.rejectionReason) {
        activities.push({
          id: `act-ret-${c.articleId}`,
          reporterId: profile.id,
          type: 'ARTICLE_RETURNED',
          title: 'संपादकीय टिप्पणी / सुधार निर्देश',
          description: `टिप्पणी: ${c.editorialRemarks || c.rejectionReason}`,
          timestamp: parseNormalizedTimestamp(c.submissionDate),
          metadata: { articleId: c.articleId, remarks: c.editorialRemarks || c.rejectionReason },
        });
      }
      if (c.epaperAssignment) {
        activities.push({
          id: `act-assign-${c.articleId}`,
          reporterId: profile.id,
          type: 'EPAPER_PAGE_ASSIGNED',
          title: 'ई-पेपर पृष्ठ पर आवंटित',
          description: `"${c.headline.slice(0, 40)}..." पृष्ठ ${c.epaperAssignment.pageNumber} (${c.epaperAssignment.editionTitle}) पर लगाया गया।`,
          timestamp: parseNormalizedTimestamp(c.epaperAssignment.editionDate || c.submissionDate),
          metadata: { articleId: c.articleId, pageNumber: c.epaperAssignment.pageNumber, editionId: c.epaperAssignment.editionId },
        });
      }
    }

    for (const ad of assignedAds) {
      activities.push({
        id: `act-ad-${ad.id}`,
        reporterId: profile.id,
        type: ad.status === 'APPROVED' ? 'AD_APPROVED' : (ad.status === 'REJECTED' ? 'AD_REJECTED' : 'AD_ASSIGNED'),
        title: `विज्ञापन स्थिति: ${ad.status}`,
        description: `विज्ञापन "${ad.title || ad.businessName}" (${ad.slotType}) की स्थिति ${ad.status} है।`,
        timestamp: parseNormalizedTimestamp(ad.updatedAt || ad.createdAt),
        metadata: { adId: ad.id, status: ad.status, title: ad.title },
      });
    }

    for (const wg of whatsappHistory) {
      activities.push({
        id: `act-wg-${wg.id}`,
        reporterId: profile.id,
        type: 'WHATSAPP_GENERATED',
        title: 'व्हाट्सएप कार्ड जनरेट किया गया',
        description: `प्रारूप ${wg.format} कार्ड: "${(wg.headline || '').slice(0, 40)}..."`,
        timestamp: parseNormalizedTimestamp(wg.createdAt),
        metadata: { id: wg.id, format: wg.format },
      });
    }

    activities.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());

    const metrics = {
      totalSubmittedNews,
      approvedNews,
      epaperSelectedNews,
      publishedEpaperStories,
      pendingReviewNews,
      returnedNews,
      assignedAds: assignedAds.length,
      publishedAds,
      recentActivityCount: activities.length,
    };

    return {
      profile,
      metrics,
      contributions,
      publishedHistory,
      assignedAds,
      activities: activities.slice(0, 50),
      whatsappStatus: {
        quota: whatsappQuota,
        recentGenerations: whatsappHistory.slice(0, 10).map((g) => ({
          id: g.id,
          format: g.format,
          headline: g.headline,
          imageUrl: g.imageUrl,
          timestamp: g.createdAt,
          previewUrl: g.imageUrl,
        })),
        canGenerate: !whatsappQuota?.quotaExceeded,
      },
      generatedAt: new Date().toISOString(),
    };
  }

  async getReporterContributions(reporterId, params = {}, user = null) {
    const summary = await this.getReporterWorkspaceSummary(reporterId, user);
    let list = [...summary.contributions];

    if (params.status && params.status !== 'all') {
      const s = String(params.status).toLowerCase();
      if (s === 'submitted') {
        list = list.filter((c) => ['SUBMITTED', 'PENDING_REVIEW'].includes(String(c.status).toUpperCase()));
      } else if (s === 'under_review') {
        list = list.filter((c) => ['UNDER_REVIEW', 'IN_REVIEW', 'EDITORIAL_REVIEW'].includes(String(c.status).toUpperCase()) || ['EDITORIAL_REVIEW'].includes(String(c.workflowStatus).toUpperCase()));
      } else if (s === 'approved') {
        list = list.filter((c) => ['APPROVED'].includes(String(c.status).toUpperCase()) || ['APPROVED', 'APPROVED_FOR_EPAPER'].includes(String(c.workflowStatus).toUpperCase()));
      } else if (s === 'epaper_assigned') {
        list = list.filter((c) => Boolean(c.epaperAssignment) || ['ASSIGNED_TO_PAGE', 'PAGE_DESIGNED', 'QUALITY_CHECK'].includes(String(c.workflowStatus).toUpperCase()));
      } else if (s === 'published') {
        list = list.filter((c) => ['PUBLISHED'].includes(String(c.status).toUpperCase()) || ['PUBLISHED'].includes(String(c.workflowStatus).toUpperCase()));
      } else if (s === 'returned' || s === 'rejected') {
        list = list.filter((c) => ['REJECTED', 'CHANGES_REQUESTED', 'RETURNED'].includes(String(c.status).toUpperCase()) || Boolean(c.rejectionReason) || Boolean(c.editorialRemarks));
      }
    }

    if (params.districtId || params.district) {
      const dist = String(params.districtId || params.district).toLowerCase();
      list = list.filter((c) => String(c.district || '').toLowerCase() === dist || String(c.districtId || '').toLowerCase() === dist);
    }

    if (params.categoryId || params.category) {
      const cat = String(params.categoryId || params.category).toLowerCase();
      list = list.filter((c) => String(c.category || '').toLowerCase() === cat || String(c.categoryId || '').toLowerCase() === cat);
    }

    if (params.search) {
      const q = String(params.search).toLowerCase().trim();
      list = list.filter((c) =>
        String(c.headline || '').toLowerCase().includes(q) ||
        String(c.summary || '').toLowerCase().includes(q) ||
        String(c.articleId || '').toLowerCase().includes(q)
      );
    }

    const total = list.length;
    const page = Math.max(1, parseInt(params.page || '1', 10));
    const limit = Math.max(1, parseInt(params.limit || '20', 10));
    const startIndex = (page - 1) * limit;
    const items = list.slice(startIndex, startIndex + limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async getReporterPublishedStories(reporterId, params = {}, user = null) {
    const summary = await this.getReporterWorkspaceSummary(reporterId, user);
    let list = [...summary.publishedHistory];

    if (params.editionId && params.editionId !== 'all') {
      list = list.filter((p) => p.editionId === params.editionId);
    }

    if (params.startDate) {
      list = list.filter((p) => p.publicationDate >= params.startDate);
    }

    if (params.endDate) {
      list = list.filter((p) => p.publicationDate <= params.endDate);
    }

    if (params.search) {
      const q = String(params.search).toLowerCase().trim();
      list = list.filter((p) =>
        String(p.headline || '').toLowerCase().includes(q) ||
        String(p.editionTitle || '').toLowerCase().includes(q)
      );
    }

    const total = list.length;
    return { items: list, total };
  }

  async updateReporterProfileRestricted(reporterId, updates = {}, user = null) {
    if (!reporterId) {
      const err = new Error('ERR_INVALID_PARAM: reporterId अनिवार्य है।');
      err.statusCode = 400;
      err.code = 'ERR_INVALID_PARAM';
      throw err;
    }

    // Role verification
    let isStaff = false;
    if (user) {
      const userRoles = [...(Array.isArray(user.roles) ? user.roles : []), user.role]
        .filter(Boolean)
        .map((r) => String(r).toUpperCase().replace(/^ROLE_/, ''));
      isStaff = userRoles.some((r) =>
        ['MASTER_ADMIN', 'SUPER_ADMIN', 'ADMIN', 'CHIEF_EDITOR', 'MANAGING_EDITOR', 'EDITOR'].includes(r)
      );
    }

    // Security & IDOR: Reporters can only update own profile and cannot self-escalate
    if (!isStaff) {
      if (user) {
        const uId = String(user.id || user.uid || '').toLowerCase();
        const uBadge = String(user.badgeNumber || '').toLowerCase();
        const target = String(reporterId).toLowerCase();

        if (target !== uId && target !== uBadge) {
          const err = new Error('ERR_FORBIDDEN: आप केवल अपनी स्वयं की प्रोफाइल संशोधित कर सकते हैं।');
          err.statusCode = 403;
          err.code = 'ERR_FORBIDDEN';
          throw err;
        }
      }

      // Check for forbidden privilege escalation fields
      const FORBIDDEN_FIELDS = [
        'verificationStatus',
        'role',
        'roles',
        'assignedDistricts',
        'assignedDivision',
        'badgeNumber',
        'status',
        'totalStoriesFiled',
        'totalStoriesPublished',
      ];

      for (const field of FORBIDDEN_FIELDS) {
        if (updates[field] !== undefined) {
          const err = new Error(`ERR_FORBIDDEN: संवाददाता को '${field}' संशोधित करने की अनुमति नहीं है। केवल संपर्क विवरण और फोटो बदले जा सकते हैं।`);
          err.statusCode = 403;
          err.code = 'ERR_FORBIDDEN';
          throw err;
        }
      }
    }

    // Find in reporters collection
    this.data.reporters = this.data.reporters || [];
    let rep = this.data.reporters.find((r) =>
      String(r.id || '').toLowerCase() === String(reporterId).toLowerCase() ||
      String(r.badgeNumber || '').toLowerCase() === String(reporterId).toLowerCase() ||
      (String(reporterId).toLowerCase() === 'rep-001' && (r.id === 'rep-active' || r.badgeNumber === 'BNW-REP-0101'))
    );

    if (!rep) {
      // Find in users and link to existing or create reporter record
      const u = (this.data.users || []).find((usr) =>
        String(usr.id || '').toLowerCase() === String(reporterId).toLowerCase() ||
        String(usr.badgeNumber || '').toLowerCase() === String(reporterId).toLowerCase()
      );
      if (!u) {
        const err = new Error(`ERR_REPORTER_NOT_FOUND: संवाददाता [${reporterId}] नहीं मिला।`);
        err.statusCode = 404;
        err.code = 'ERR_REPORTER_NOT_FOUND';
        throw err;
      }

      // Check if user has an existing reporter profile in reporters collection
      const linkedRep = this.data.reporters.find((r) =>
        (u.badgeNumber && String(r.badgeNumber || '').toLowerCase() === String(u.badgeNumber).toLowerCase()) ||
        (u.email && String(r.email || '').toLowerCase() === String(u.email).toLowerCase())
      );

      if (linkedRep) {
        rep = linkedRep;
      } else {
        rep = {
          id: u.id,
          name: u.fullName || u.name || 'संवाददाता',
          email: u.email || '',
          phone: u.phoneNumber || u.phone || '',
          role: 'reporter',
          assignedDistricts: u.assignedDistricts || [u.district || 'भोपाल'],
          assignedDivision: u.assignedDivision || 'भोपाल संभाग',
          beats: u.beats || ['सामान्य समाचार'],
          totalStoriesFiled: 0,
          totalStoriesPublished: 0,
          badgeNumber: u.badgeNumber || 'BNW-REP-0101',
          joinedDate: '15 जनवरी 2024',
          avatar: u.avatar || '',
          status: 'ACTIVE',
          verificationStatus: 'VERIFIED',
        };
        this.data.reporters.push(rep);
      }
    }

    // Apply allowed updates
    if (updates.phone !== undefined) rep.phone = String(updates.phone).trim();
    if (updates.avatar !== undefined) rep.avatar = String(updates.avatar).trim();
    if (updates.bio !== undefined) rep.bio = String(updates.bio).trim();
    if (updates.bureau !== undefined) rep.bureau = String(updates.bureau).trim();
    if (updates.email !== undefined && isStaff) rep.email = String(updates.email).trim();

    // Staff elevated updates
    if (isStaff) {
      if (updates.verificationStatus !== undefined) rep.verificationStatus = updates.verificationStatus;
      if (updates.status !== undefined) rep.status = updates.status;
      if (updates.role !== undefined) rep.role = updates.role;
      if (updates.assignedDistricts !== undefined) rep.assignedDistricts = updates.assignedDistricts;
      if (updates.assignedDivision !== undefined) rep.assignedDivision = updates.assignedDivision;
      if (updates.beats !== undefined) rep.beats = updates.beats;
      if (updates.badgeNumber !== undefined) rep.badgeNumber = updates.badgeNumber;
    }

    this.save();
    this.addAuditLog(
      user?.fullName || 'संवाददाता',
      user?.role || 'REPORTER',
      'REPORTER_PROFILE_UPDATED',
      `संवाददाता प्रोफाइल अपडेट (${rep.name} / ${rep.badgeNumber})`
    );

    return rep;
  }


  getHealth() {
    return {
      adapterType: 'local_json_atomic',
      status: 'active',
      storageMode: 'ephemeral_local',
      storagePath: this.storage.filePath,
      atomicWriteEnabled: true,
      backupRotationEnabled: true,
      multiInstanceSafe: false,
      articlesCount: this.data.articles.length,
    };
  }
}

// -------------------------------------------------------------
// 3. PRODUCTION STORAGE POLICY GUARD ADAPTER (Section 6)
// -------------------------------------------------------------

export class ProductionGuardAdapter {
  constructor(localFallbackInstance = null) {
    this.localFallback = localFallbackInstance || new LocalJsonAdapter();
  }

  failClosedError() {
    return {
      error: true,
      statusCode: 503,
      code: 'ERR_DATABASE_UNAVAILABLE',
      message: 'उत्पादन परिवेश में साझा डेटाबेस (PostgreSQL) अनुपलब्ध है। डेटा हानि से बचाव हेतु स्थानीय JSON में म्यूटेशन निषिद्ध है।',
    };
  }

  async getArticles(params = {}) {
    // In production without database, dynamic queries fail safely
    return {
      error: true,
      statusCode: 503,
      code: 'ERR_DATABASE_UNAVAILABLE',
      message: 'Production database is not provisioned. Dynamic queries are disabled.',
    };
  }

  async getArticleByIdOrSlug(idOrSlug) {
    return {
      error: true,
      statusCode: 503,
      code: 'ERR_DATABASE_UNAVAILABLE',
      message: 'Production database is not provisioned.',
    };
  }

  async createDraft() {
    return this.failClosedError();
  }

  async updateDraft() {
    return this.failClosedError();
  }

  async submitArticle() {
    return this.failClosedError();
  }

  async reviewArticle() {
    return this.failClosedError();
  }

  async getCategories() {
    // Read-only static dictionary allowed for baseline UI rendering
    return INITIAL_CATEGORIES;
  }

  async getDistricts() {
    // Read-only static dictionary allowed for baseline UI rendering
    return INITIAL_DISTRICTS;
  }

  async getReporters() {
    return this.failClosedError();
  }

  async updateReporterRole() {
    return this.failClosedError();
  }

  async getTickers() {
    return this.failClosedError();
  }

  async createTicker() {
    return this.failClosedError();
  }

  async toggleTicker() {
    return this.failClosedError();
  }

  async deleteTicker() {
    return this.failClosedError();
  }

  async getAds() {
    return this.failClosedError();
  }

  async createAd() {
    return this.failClosedError();
  }

  async toggleAd() {
    return this.failClosedError();
  }

  async deleteAd() {
    return this.failClosedError();
  }

  async recordAdBannerMetric() {
    return null;
  }

  async getMandiRates() {
    return this.failClosedError();
  }

  async createMandiRate() {
    return this.failClosedError();
  }

  async updateMandiRate() {
    return this.failClosedError();
  }

  async deleteMandiRate() {
    return this.failClosedError();
  }

  async getReporterByBadge() {
    return null;
  }

  async getAuditLogs() {
    return this.failClosedError();
  }

  addAuditLog() {
    return null;
  }

  async getActiveAlert() {
    return null;
  }

  async setActiveAlert() {
    return this.failClosedError();
  }

  async getEditorialStats() {
    return this.failClosedError();
  }

  // Identity & Auth fail-closed methods
  async getUsers() { return this.failClosedError(); }
  async findUserById() { return this.failClosedError(); }
  async findUserByIdentifier() { return this.failClosedError(); }
  async createUser() { return this.failClosedError(); }
  async updateUser() { return this.failClosedError(); }
  async createSession() { return this.failClosedError(); }
  async findSessionByTokenHash() { return this.failClosedError(); }
  async revokeSession() { return this.failClosedError(); }
  async revokeAllUserSessions() { return this.failClosedError(); }

  // Graphics Studio fail-closed methods
  async getGraphicTemplates() { return INITIAL_GRAPHIC_TEMPLATES; }
  async getGraphicTemplateById(id) {
    const t = INITIAL_GRAPHIC_TEMPLATES.find((x) => x.id === id);
    return t || null;
  }
  async saveGraphicTemplate() { return this.failClosedError(); }
  async duplicateGraphicTemplate() { return this.failClosedError(); }
  async deleteGraphicTemplate() { return this.failClosedError(); }
  async getGraphics() { return { items: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 1 } }; }
  async getGraphicById() { return null; }
  async saveGraphic() { return this.failClosedError(); }
  async updateGraphicStatus() { return this.failClosedError(); }
  async deleteGraphic() { return this.failClosedError(); }

  // Video Production Studio fail-closed methods
  async getVideoTemplates() { return INITIAL_VIDEO_TEMPLATES; }
  async getVideoTemplateById(id) {
    const t = INITIAL_VIDEO_TEMPLATES.find((x) => x.id === id);
    return t || null;
  }
  async saveVideoTemplate() { return this.failClosedError(); }
  async duplicateVideoTemplate() { return this.failClosedError(); }
  async deleteVideoTemplate() { return this.failClosedError(); }
  async getVideoProjects() { return { items: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 1 } }; }
  async getVideoProjectById() { return null; }
  async saveVideoProject() { return this.failClosedError(); }
  async deleteVideoProject() { return this.failClosedError(); }
  async getVideoRenderJobs() { return []; }
  async getVideoRenderJobById() { return null; }
  async createVideoRenderJob() { return this.failClosedError(); }
  async updateVideoRenderJob() { return this.failClosedError(); }

  // AI Newsroom fail-closed methods
  async getAiPrompts() { return INITIAL_AI_PROMPTS; }
  async getAiPromptById(id) {
    const p = INITIAL_AI_PROMPTS.find((x) => x.id === id);
    return p || null;
  }
  async saveAiPrompt() { return this.failClosedError(); }
  async deleteAiPrompt() { return this.failClosedError(); }
  async recordAiUsage() { return this.failClosedError(); }
  async getAiUsageStats() {
    return {
      totalCalls: 0,
      totalTokens: 0,
      totalCostInr: 0,
      callsByCategory: {},
      callsByProvider: {},
      recentRecords: [],
    };
  }
  async saveAiHistoryItem() { return this.failClosedError(); }
  async getAiHistory() { return { items: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 1 } }; }
  async getAiHistoryById() { return null; }
  async deleteAiHistoryItem() { return this.failClosedError(); }

  // Video Production Studio fail-closed methods
  async getVideoTemplates() { return INITIAL_VIDEO_TEMPLATES; }
  async getVideoTemplateById(id) {
    const t = INITIAL_VIDEO_TEMPLATES.find((x) => x.id === id);
    return t || null;
  }
  async saveVideoTemplate() { return this.failClosedError(); }
  async duplicateVideoTemplate() { return this.failClosedError(); }
  async deleteVideoTemplate() { return this.failClosedError(); }
  async getVideoProjects() { return { items: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 1 } }; }
  async getVideoProjectById() { return null; }
  async saveVideoProject() { return this.failClosedError(); }
  async deleteVideoProject() { return this.failClosedError(); }
  async getVideoRenderJobs() { return []; }
  async getVideoRenderJobById() { return null; }
  async createVideoRenderJob() { return this.failClosedError(); }
  async updateVideoRenderJob() { return this.failClosedError(); }

  // AI Newsroom fail-closed methods
  async getAiPrompts() { return INITIAL_AI_PROMPTS; }
  async getAiPromptById(id) {
    const p = INITIAL_AI_PROMPTS.find((x) => x.id === id);
    return p || null;
  }
  async saveAiPrompt() { return this.failClosedError(); }
  async deleteAiPrompt() { return this.failClosedError(); }
  async recordAiUsage() { return this.failClosedError(); }
  async getAiUsageStats() {
    return {
      totalCalls: 0,
      totalTokens: 0,
      totalCostInr: 0,
      callsByCategory: {},
      callsByProvider: {},
      recentRecords: [],
    };
  }
  async saveAiHistoryItem() { return this.failClosedError(); }
  async getAiHistory() { return { items: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 1 } }; }
  async getAiHistoryById() { return null; }
  async deleteAiHistoryItem() { return this.failClosedError(); }

  // Integrations fail-closed stubs
  async getApiProviders() { return CANONICAL_SEED_PROVIDERS; }
  async getApiProviderById(id) { return CANONICAL_SEED_PROVIDERS.find((p) => p.id === id || p.providerId === id) || null; }
  async saveApiProvider() { return this.failClosedError(); }
  async deleteApiProvider() { return this.failClosedError(); }
  async getRssSources() { return { items: INITIAL_NEWS_SOURCES, total: INITIAL_NEWS_SOURCES.length }; }
  async getRssSourceById(id) { return INITIAL_NEWS_SOURCES.find((s) => s.id === id) || null; }
  async saveRssSource() { return this.failClosedError(); }
  async deleteRssSource() { return this.failClosedError(); }
  async getRssItems() { return { items: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 1 } }; }
  async getRssItemById() { return null; }
  async hasRssItemHash() { return false; }
  async saveRssItem() { return this.failClosedError(); }
  async updateRssItemStatus() { return this.failClosedError(); }
  async getSocialAccounts() { return INITIAL_SOCIAL_ACCOUNTS; }
  async getSocialAccountById(id) { return INITIAL_SOCIAL_ACCOUNTS.find((a) => a.id === id) || null; }
  async saveSocialAccount() { return this.failClosedError(); }
  async deleteSocialAccount() { return this.failClosedError(); }
  async getSocialPublishingJobs() { return []; }
  async getSocialPublishingJobById() { return null; }
  async saveSocialPublishingJob() { return this.failClosedError(); }
  async getWhatsAppTemplates() { return INITIAL_WHATSAPP_TEMPLATES; }
  async getWhatsAppTemplateById(id) { return INITIAL_WHATSAPP_TEMPLATES.find((t) => t.id === id) || null; }
  async saveWhatsAppTemplate() { return this.failClosedError(); }
  async getWhatsAppSubscribers() { return INITIAL_WHATSAPP_SUBSCRIBERS; }
  async getWhatsAppSubscriberByPhone(phone) { return INITIAL_WHATSAPP_SUBSCRIBERS.find((s) => s.phoneNumber === phone) || null; }
  async saveWhatsAppSubscriber() { return this.failClosedError(); }
  async getWebhooks() { return []; }
  async getWebhookById() { return null; }
  async saveWebhook() { return this.failClosedError(); }
  async getWebhookLogs() { return []; }
  async saveWebhookLog() { return this.failClosedError(); }

  // Monetization fail-closed stubs
  async getSubscriptionPlans() { return CANONICAL_SUBSCRIPTION_PLANS; }
  async getSubscriptionPlanById(id) { return CANONICAL_SUBSCRIPTION_PLANS.find((p) => p.id === id || p.code === id) || null; }
  async saveSubscriptionPlan() { return this.failClosedError(); }
  async getCustomerSubscriptions() { return []; }
  async getCustomerSubscriptionById() { return null; }
  async getCustomerSubscriptionsByUserId() { return []; }
  async saveCustomerSubscription() { return this.failClosedError(); }
  async getPaymentOrders() { return []; }
  async getPaymentOrderById() { return null; }
  async savePaymentOrder() { return this.failClosedError(); }
  async getTransactions() { return []; }
  async getTransactionById() { return null; }
  async saveTransaction() { return this.failClosedError(); }
  async getRefunds() { return []; }
  async getRefundById() { return null; }
  async saveRefund() { return this.failClosedError(); }
  async getAdvertisers() { return CANONICAL_SEED_ADVERTISERS; }
  async getAdvertiserById(id) { return CANONICAL_SEED_ADVERTISERS.find((a) => a.id === id) || null; }
  async saveAdvertiser() { return this.failClosedError(); }
  async getCampaigns() { return CANONICAL_SEED_CAMPAIGNS; }
  async getCampaignById(id) { return CANONICAL_SEED_CAMPAIGNS.find((c) => c.id === id) || null; }
  async getCampaignsByAdvertiserId(advId) { return CANONICAL_SEED_CAMPAIGNS.filter((c) => c.advertiserId === advId); }
  async saveCampaign() { return this.failClosedError(); }
  async getSponsoredArticles() { return []; }
  async getSponsoredArticleById() { return null; }
  async saveSponsoredArticle() { return this.failClosedError(); }
  async getCrmNotes() { return []; }
  async getCrmNotesByAdvertiserId() { return []; }
  async saveCrmNote() { return this.failClosedError(); }
  async getCrmProposals() { return []; }
  async getCrmProposalById() { return null; }
  async saveCrmProposal() { return this.failClosedError(); }
  async getInvoices() { return []; }
  async getInvoiceById() { return null; }
  async saveInvoice() { return this.failClosedError(); }
  async getFinancialAuditLogs() { return []; }
  async saveFinancialAuditLog() { return this.failClosedError(); }
  async appendFinancialAuditLog() { return this.failClosedError(); }

  // Audience fail-closed stubs
  async getUserPreferences() { return null; }
  async saveUserPreferences() { return this.failClosedError(); }
  async getBookmarks() { return []; }
  async saveBookmark() { return this.failClosedError(); }
  async deleteBookmark() { return this.failClosedError(); }
  async getReadingHistory() { return []; }
  async saveReadingHistory() { return this.failClosedError(); }
  async clearReadingHistory() { return this.failClosedError(); }
  async getFollowedTopics() { return []; }
  async saveFollowedTopic() { return this.failClosedError(); }
  async deleteFollowedTopic() { return this.failClosedError(); }
  async getFollowedDistricts() { return []; }
  async saveFollowedDistrict() { return this.failClosedError(); }
  async deleteFollowedDistrict() { return this.failClosedError(); }
  async getNotifications() { return []; }
  async createNotification() { return this.failClosedError(); }
  async markNotificationRead() { return this.failClosedError(); }
  async markAllNotificationsRead() { return this.failClosedError(); }
  async getReaderFeedback() { return []; }
  async getReaderFeedbackById() { return null; }
  async saveReaderFeedback() { return this.failClosedError(); }
  async getComments() { return []; }
  async getCommentById() { return null; }
  async saveComment() { return this.failClosedError(); }
  async deleteComment() { return this.failClosedError(); }
  async getAudienceSegments() { return CANONICAL_AUDIENCE_SEGMENTS; }
  async getAudienceSegmentById(id) { return CANONICAL_AUDIENCE_SEGMENTS.find((s) => s.id === id || s.code === id) || null; }
  async saveAudienceSegment() { return this.failClosedError(); }
  async saveDeletionRequest() { return this.failClosedError(); }
  async recordEngagementEvent() { return this.failClosedError(); }
  async getEngagementEvents() { return []; }

  // E-Paper Studio fail-closed methods
  async getEpaperEditions() { return { editions: [], items: [], total: 0, count: 0, page: 1, limit: 20, totalPages: 1 }; }
  async getEpaperEditionById() { return null; }
  async getEpaperEditionByCode() { return null; }
  async getLatestEpaperEdition() { return null; }
  async createEpaperEditionWithPages() { return this.failClosedError(); }
  async saveEpaperEdition() { return this.failClosedError(); }
  async updateEpaperEditionStatus() { return this.failClosedError(); }
  async deleteEpaperEdition() { return this.failClosedError(); }
  async getEpaperPagesByEditionId() { return []; }
  async getEpaperPages() { return []; }
  async getEpaperPageById() { return null; }
  async getEpaperPageByNumber() { return null; }
  async saveEpaperPage() { return this.failClosedError(); }
  async deleteEpaperPage() { return this.failClosedError(); }
  async checkArticleInEdition() { return { placed: false, pageNumber: null, pageId: null, pageTitle: null, elementId: null }; }
  async checkArticlePlacement() { return { placed: false, pageNumber: null, pageId: null, pageTitle: null, elementId: null }; }
  async getEpaperTemplates() { return INITIAL_EPAPER_TEMPLATES; }
  async getEpaperTemplateById(id) { const t = INITIAL_EPAPER_TEMPLATES.find((x) => x.id === id); return t || null; }
  async saveEpaperTemplate() { return this.failClosedError(); }
  async deleteEpaperTemplate() { return this.failClosedError(); }
  async saveEpaperWhatsAppGeneration() { return this.failClosedError(); }
  async atomicSaveEpaperWhatsAppGeneration() { return this.failClosedError(); }
  async getEpaperWhatsAppGenerations() { return []; }
  async getReporterWhatsAppQuota(reporterId, date = null) { return { reporterId, date: date || new Date().toISOString().split('T')[0], used: 0, maxDaily: 20, remaining: 20, quotaExceeded: false, timezone: 'Asia/Kolkata' }; }
  async setReporterWhatsAppQuota(reporterId, quota) { return { reporterId, maxDaily: Number(quota), timezone: 'Asia/Kolkata', updatedAt: new Date().toISOString() }; }
  async saveEpaperAdSubmission() { return this.failClosedError(); }
  async getEpaperAdSubmissions() { return []; }
  async getEpaperAdSubmissionById() { return null; }
  async reviewEpaperAdSubmission() { return this.failClosedError(); }
  async updateAdLifecycleStatus() { return this.failClosedError(); }
  async assignAdToEditionSlot() { return this.failClosedError(); }
  async removeAdFromEditionSlot() { return this.failClosedError(); }
  async getAdReportingSummary() { return this.failClosedError(); }
  async getAvailableAdSlots() { return { totalSlots: 0, occupiedSlots: 0, availableSlots: 0, slots: [] }; }
  async saveEpaperEditionVersion() { return this.failClosedError(); }
  async saveEpaperVersionSnapshot() { return this.failClosedError(); }
  async getEpaperEditionVersions() { return []; }
  async getEpaperEditionVersionById() { return null; }
  async getPublishedEpaperSnapshot() { return null; }
  async publishEpaperEdition() { return this.failClosedError(); }
  async runEpaperQualityCheck() { return this.failClosedError(); }
  async grantEpaperQualityException() { return this.failClosedError(); }
  async approveEpaperEdition() { return this.failClosedError(); }
  async scheduleEpaperEdition() { return this.failClosedError(); }
  async createEpaperPostPublicationCorrection() { return this.failClosedError(); }
  async getEligibleEpaperArticles() { return { items: [], articles: [], total: 0, page: 1, limit: 20, totalPages: 1 }; }
  async updateArticleWorkflowStatus() { return this.failClosedError(); }
  async assignArticlesToEditionPage() { return this.failClosedError(); }
  async removeArticleFromEditionPage() { return this.failClosedError(); }
  async getEditorialStaffCredits() { return []; }
  async getReporterProfile() { return null; }
  async getReporterWorkspaceSummary() { return this.failClosedError(); }
  async getReporterContributions() { return { items: [], total: 0, page: 1, limit: 20, totalPages: 1 }; }
  async getReporterPublishedStories() { return { items: [], total: 0 }; }
  async updateReporterProfileRestricted() { return this.failClosedError(); }
  async getWhatsAppEligibleArticles() { return { items: [], total: 0 }; }
  async saveEpaperWhatsAppEditionPackage() { return this.failClosedError(); }
  async getEpaperWhatsAppEditionPackages() { return []; }
  async getEpaperWhatsAppEditionPackageById() { return null; }
  async regenerateEpaperWhatsAppCard() { return this.failClosedError(); }

  getHealth() {
    return {
      adapterType: 'production_guard',
      status: 'degraded',
      storageMode: 'production_hardened',
      databaseAvailable: false,
      multiInstanceSafe: false,
      error: 'ERR_DATABASE_UNAVAILABLE',
      message: 'Authoritative PostgreSQL database is not provisioned or unreachable. Local JSON persistence blocked in production to prevent data loss across container instances.',
    };
  }
}

// -------------------------------------------------------------
// 4. PRISMA POSTGRESQL ADAPTER (Section 3 & 5)
// -------------------------------------------------------------

export class PrismaPostgresAdapter {
  constructor(dbUrlOrOptions, client = null) {
    if (dbUrlOrOptions && typeof dbUrlOrOptions === 'object') {
      this.dbUrl = dbUrlOrOptions.connectionString || dbUrlOrOptions.dbUrl || process.env.DATABASE_URL;
      const explicitClient = dbUrlOrOptions.prismaClient || dbUrlOrOptions.client || null;
      this.prisma = explicitClient;
      this.connected = Boolean(explicitClient);
    } else {
      this.dbUrl = dbUrlOrOptions || process.env.DATABASE_URL;
      this.connected = Boolean(client);
      this.prisma = client || null;
    }
    if (!this.prisma) {
      this.initPrisma();
    }
  }

  async initPrisma(customClient = null) {
    if (customClient) {
      this.prisma = customClient;
      this.connected = true;
      return;
    }
    try {
      const { PrismaClient } = await import('@prisma/client');
      this.prisma = new PrismaClient({
        datasources: { db: { url: this.dbUrl } },
        log: ['error'],
      });
    } catch {
      this.prisma = null;
    }
  }

  async probeConnection(timeoutMs = 3000) {
    if (!this.prisma) {
      this.connected = false;
      return false;
    }
    try {
      const probePromise = this.prisma.$queryRaw`SELECT 1 as live_probe`;
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Probe timeout')), timeoutMs)
      );
      await Promise.race([probePromise, timeoutPromise]);
      this.connected = true;
      return true;
    } catch {
      this.connected = false;
      return false;
    }
  }

  failClosedError() {
    return {
      error: true,
      statusCode: 503,
      code: 'ERR_DATABASE_UNAVAILABLE',
      message: 'PostgreSQL database connection is unreachable or @prisma/client is not provisioned. Mutations blocked to prevent data loss.',
    };
  }

  async getArticles(params = {}) {
    if (!this.connected || !this.prisma) return this.failClosedError();
    try {
      const where = {};
      if (params.status && params.status !== 'all') {
        where.status = params.status.toLowerCase();
      } else if (!params.status) {
        where.status = 'published';
      }
      if (params.categoryId) {
        where.primaryCategoryId = params.categoryId;
      }
      if (params.districtId || params.locationId) {
        where.primaryLocationId = params.districtId || params.locationId;
      }
      if (params.isBreaking !== undefined && params.isBreaking !== null) {
        where.isBreaking = params.isBreaking === 'true' || params.isBreaking === true;
      }
      if (params.search) {
        where.title = { contains: params.search, mode: 'insensitive' };
      }

      const page = Math.max(1, parseInt(params.page || '1', 10));
      const limit = Math.max(1, parseInt(params.limit || '20', 10));
      const skip = (page - 1) * limit;

      const [total, items] = await Promise.all([
        this.prisma.newsArticle.count({ where }),
        this.prisma.newsArticle.findMany({
          where,
          skip,
          take: limit,
          orderBy: { publishedAt: 'desc' },
          include: {
            author: { select: { id: true, email: true, phoneNumber: true, profile: true } },
            primaryCategory: true,
            primaryLocation: true,
            featuredMedia: true,
          },
        }),
      ]);

      return {
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.max(1, Math.ceil(total / limit)),
        },
      };
    } catch (err) {
      console.error('[PrismaPostgresAdapter] getArticles error:', err.message);
      return this.failClosedError();
    }
  }

  async getArticleByIdOrSlug(idOrSlug) {
    if (!this.connected || !this.prisma) return this.failClosedError();
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
      const orConditions = [
        { slug: idOrSlug },
        { publicId: idOrSlug },
      ];
      if (isUuid) {
        orConditions.push({ id: idOrSlug });
      }
      return await this.prisma.newsArticle.findFirst({
        where: {
          OR: orConditions,
        },
        include: {
          author: { select: { id: true, email: true, phoneNumber: true, profile: true } },
          primaryCategory: true,
          primaryLocation: true,
          featuredMedia: true,
          revisions: { orderBy: { versionNumber: 'desc' }, take: 5 },
          editorialReviews: { orderBy: { createdAt: 'desc' }, take: 5 },
        },
      });
    } catch (err) {
      console.error('[PrismaPostgresAdapter] getArticleByIdOrSlug error:', err.message);
      return this.failClosedError();
    }
  }

  async createDraft(data) {
    if (!this.connected || !this.prisma) return this.failClosedError();
    try {
      return await this.prisma.newsArticle.create({
        data: {
          publicId: data.publicId || `art-${Date.now()}`,
          slug: data.slug || `draft-${Date.now()}`,
          title: data.title,
          subheadline: data.subheadline || null,
          bodyContent: data.bodyContent || data.content || '',
          excerpt: data.excerpt || data.summary || null,
          authorId: data.authorId,
          primaryCategoryId: data.primaryCategoryId || data.categoryId,
          primaryLocationId: data.primaryLocationId || data.districtId,
          featuredMediaId: data.featuredMediaId || null,
          status: 'draft',
          isBreaking: Boolean(data.isBreaking),
        },
      });
    } catch (err) {
      console.error('[PrismaPostgresAdapter] createDraft error:', err.message);
      return this.failClosedError();
    }
  }

  async updateDraft(id, data) {
    if (!this.connected || !this.prisma) return this.failClosedError();
    try {
      // Optimistic Concurrency Control (OCC) check if expectedUpdatedAt or expectedVersion supplied
      if (data.expectedUpdatedAt || data.expectedVersion !== undefined) {
        const existing = await this.prisma.newsArticle.findFirst({
          where: { id },
          select: { updatedAt: true, version: true },
        });
        if (existing) {
          if (data.expectedVersion !== undefined && existing.version !== undefined && existing.version !== data.expectedVersion) {
            return {
              error: true,
              statusCode: 409,
              code: 'ERR_VERSION_CONFLICT',
              message: 'लेख का संस्करण पुराना है। किसी अन्य उपयोगकर्ता ने इसे हाल ही में अपडेट किया है।',
            };
          }
          if (data.expectedUpdatedAt && new Date(existing.updatedAt).getTime() !== new Date(data.expectedUpdatedAt).getTime()) {
            return {
              error: true,
              statusCode: 409,
              code: 'ERR_STALE_OBJECT_VERSION',
              message: 'लेख का संस्करण पुराना है। किसी अन्य उपयोगकर्ता ने इसे हाल ही में अपडेट किया है।',
            };
          }
        }
      }

      const updateData = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.subheadline !== undefined) updateData.subheadline = data.subheadline;
      if (data.bodyContent !== undefined) updateData.bodyContent = data.bodyContent;
      if (data.content !== undefined) updateData.bodyContent = data.content;
      if (data.excerpt !== undefined) updateData.excerpt = data.excerpt;
      if (data.summary !== undefined) updateData.excerpt = data.summary;
      if (data.categoryId !== undefined) updateData.primaryCategoryId = data.categoryId;
      if (data.districtId !== undefined) updateData.primaryLocationId = data.districtId;
      if (data.featuredMediaId !== undefined) updateData.featuredMediaId = data.featuredMediaId;
      if (data.isBreaking !== undefined) updateData.isBreaking = Boolean(data.isBreaking);

      return await this.prisma.newsArticle.update({
        where: { id },
        data: updateData,
      });
    } catch (err) {
      console.error('[PrismaPostgresAdapter] updateDraft error:', err.message);
      return this.failClosedError();
    }
  }

  async submitArticle(id, reporterId) {
    if (!this.connected || !this.prisma) return this.failClosedError();
    try {
      const res = await this.prisma.newsArticle.updateMany({
        where: { id, status: 'draft' },
        data: {
          status: 'pending_review',
          submittedAt: new Date(),
          updatedAt: new Date(),
        },
      });
      if (res.count === 0) {
        return {
          error: true,
          statusCode: 400,
          code: 'ERR_INVALID_ARTICLE_STATE',
          message: 'लेख पहले से सबमिट हो चुका है अथवा ड्राफ्ट अवस्था में नहीं है।',
        };
      }
      return await this.getArticleByIdOrSlug(id);
    } catch (err) {
      console.error('[PrismaPostgresAdapter] submitArticle error:', err.message);
      return this.failClosedError();
    }
  }

  async reviewArticle(id, reviewerIdOrAction, actionOrData, reviewDataOrUser = {}) {
    if (!this.connected || !this.prisma) return this.failClosedError();

    let reviewerId;
    let action;
    let reviewData;

    if (
      typeof reviewerIdOrAction === 'string' &&
      ['claim', 'approve', 'reject', 'request_changes', 'request_revision'].includes(reviewerIdOrAction)
    ) {
      // Called as: reviewArticle(id, action, params, user)
      action = reviewerIdOrAction;
      reviewData = actionOrData || {};
      const user = reviewDataOrUser || {};
      reviewerId = typeof user === 'string' ? user : (user?.id || 'editor-1');
    } else {
      // Called as: reviewArticle(id, reviewerId, action, reviewData)
      reviewerId = reviewerIdOrAction || 'editor-1';
      action = actionOrData || 'approve';
      reviewData = reviewDataOrUser || {};
    }

    try {
      // 1. Atomic Double-Claim Concurrency Guard
      if (action === 'claim') {
        const updateResult = await this.prisma.newsArticle.updateMany({
          where: { id, status: 'pending_review' },
          data: {
            status: 'in_review',
            lastEditorId: reviewerId,
            updatedAt: new Date(),
          },
        });

        if (updateResult.count === 0) {
          return {
            error: true,
            conflict: true,
            statusCode: 409,
            code: 'ERR_RACE_CONDITION',
            message: 'कहानी पहले से किसी अन्य संपादक द्वारा समीक्षाधीन है अथवा समीक्षा हेतु लंबित नहीं है।',
          };
        }

        if (this.prisma.editorialReview?.create) {
          await this.prisma.editorialReview.create({
            data: {
              newsId: id,
              reviewerId,
              action: 'claim',
              feedbackComments: reviewData.comments || 'Claimed by desk editor',
            },
          });
        }

        return await this.getArticleByIdOrSlug(id);
      }

      // 2. Atomic Double-Publish Concurrency Guard
      if (action === 'approve') {
        const updateResult = await this.prisma.newsArticle.updateMany({
          where: { id, status: { in: ['in_review', 'pending_review'] } },
          data: {
            status: 'published',
            publishedAt: new Date(),
            updatedAt: new Date(),
          },
        });

        if (updateResult.count === 0) {
          return {
            error: true,
            conflict: true,
            statusCode: 409,
            code: 'ERR_ALREADY_PUBLISHED',
            message: 'कहानी पहले से स्वीकृत अथवा प्रकाशित हो चुकी है।',
          };
        }

        if (this.prisma.editorialReview?.create) {
          await this.prisma.editorialReview.create({
            data: {
              newsId: id,
              reviewerId,
              action: 'approved',
              feedbackComments: reviewData.comments || 'Approved for publication',
            },
          });
        }

        return await this.getArticleByIdOrSlug(id);
      }

      // 3. Request Changes Workflow
      if (action === 'request_changes') {
        await this.prisma.newsArticle.update({
          where: { id },
          data: { status: 'changes_requested', updatedAt: new Date() },
        });

        await this.prisma.editorialReview.create({
          data: {
            newsId: id,
            reviewerId,
            action: 'changes_requested',
            feedbackComments: reviewData.comments || 'Changes requested by editor',
          },
        });

        return await this.getArticleByIdOrSlug(id);
      }

      // 4. Reject Workflow
      if (action === 'reject') {
        if (!reviewData.reasonCode) {
          return {
            error: true,
            statusCode: 400,
            code: 'ERR_REJECTION_REASON_REQUIRED',
            message: 'अस्वीकृति हेतु कारण कोड अनिवार्य है।',
          };
        }

        await this.prisma.newsArticle.update({
          where: { id },
          data: { status: 'rejected', updatedAt: new Date() },
        });

        await this.prisma.editorialReview.create({
          data: {
            newsId: id,
            reviewerId,
            action: 'rejected',
            reasonCode: reviewData.reasonCode,
            feedbackComments: reviewData.comments || null,
          },
        });

        return await this.getArticleByIdOrSlug(id);
      }

      return { error: true, statusCode: 400, code: 'ERR_INVALID_ACTION', message: 'अमान्य समीक्षा कार्रवाई।' };
    } catch (err) {
      console.error('[PrismaPostgresAdapter] reviewArticle error:', err.message);
      return this.failClosedError();
    }
  }

  async getCategories() {
    if (!this.connected || !this.prisma) return INITIAL_CATEGORIES;
    try {
      const dbCategories = await this.prisma.category.findMany({ orderBy: { slug: 'asc' } });
      return dbCategories.length > 0 ? dbCategories : INITIAL_CATEGORIES;
    } catch {
      return INITIAL_CATEGORIES;
    }
  }

  async getDistricts() {
    if (!this.connected || !this.prisma) return INITIAL_DISTRICTS;
    try {
      const dbDistricts = await this.prisma.geoLocation.findMany({ where: { level: 'district' } });
      return dbDistricts.length > 0 ? dbDistricts : INITIAL_DISTRICTS;
    } catch {
      return INITIAL_DISTRICTS;
    }
  }

  async getReporters() {
    if (!this.connected || !this.prisma) return this.failClosedError();
    try {
      return await this.prisma.user.findMany({
        where: { userRoles: { some: { role: { name: { in: ['REPORTER', 'CHIEF_REPORTER'] } } } } },
        include: { profile: true, reporterProfile: true, userRoles: { include: { role: true } } },
      });
    } catch (err) {
      console.error('[PrismaPostgresAdapter] getReporters error:', err.message);
      return this.failClosedError();
    }
  }

  async updateReporterRole(reporterId, newRole) {
    if (!this.connected || !this.prisma) return this.failClosedError();
    try {
      const role = await this.prisma.role.findFirst({ where: { name: newRole.toUpperCase() } });
      if (!role) {
        return { error: true, statusCode: 400, code: 'ERR_ROLE_NOT_FOUND', message: 'Role does not exist.' };
      }
      return await this.prisma.userRole.upsert({
        where: { userId_roleId: { userId: reporterId, roleId: role.id } },
        update: {},
        create: { userId: reporterId, roleId: role.id },
      });
    } catch (err) {
      console.error('[PrismaPostgresAdapter] updateReporterRole error:', err.message);
      return this.failClosedError();
    }
  }

  async getTickers() {
    if (!this.connected || !this.prisma) return this.failClosedError();
    try {
      return await this.prisma.newsArticle.findMany({
        where: { isBreaking: true, status: 'published' },
        take: 10,
        orderBy: { publishedAt: 'desc' },
      });
    } catch (err) {
      console.error('[PrismaPostgresAdapter] getTickers error:', err.message);
      return this.failClosedError();
    }
  }

  async createTicker(data) {
    if (!this.connected || !this.prisma) return this.failClosedError();
    try {
      return await this.createDraft({ ...data, isBreaking: true });
    } catch {
      return this.failClosedError();
    }
  }

  async toggleTicker(id) {
    if (!this.connected || !this.prisma) return this.failClosedError();
    try {
      const art = await this.prisma.newsArticle.findUnique({ where: { id } });
      if (!art) return null;
      return await this.prisma.newsArticle.update({
        where: { id },
        data: { isBreaking: !art.isBreaking },
      });
    } catch {
      return this.failClosedError();
    }
  }

  async deleteTicker(id) {
    if (!this.connected || !this.prisma) return this.failClosedError();
    try {
      return await this.prisma.newsArticle.update({
        where: { id },
        data: { isBreaking: false },
      });
    } catch {
      return this.failClosedError();
    }
  }

  async getAds() {
    if (!this.connected || !this.prisma) return this.failClosedError();
    try {
      return await this.prisma.adCampaign.findMany({
        where: { status: 'ACTIVE' },
        include: { creatives: true },
      });
    } catch {
      return this.failClosedError();
    }
  }

  async toggleAd(id) {
    if (!this.connected || !this.prisma) return this.failClosedError();
    try {
      const camp = await this.prisma.adCampaign.findUnique({ where: { id } });
      if (!camp) return null;
      const nextStatus = camp.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
      return await this.prisma.adCampaign.update({
        where: { id },
        data: { status: nextStatus },
      });
    } catch {
      return this.failClosedError();
    }
  }

  async getAuditLogs() {
    if (!this.connected || !this.prisma) return this.failClosedError();
    try {
      return await this.prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: { actor: { select: { id: true, email: true, profile: true } } },
      });
    } catch {
      return this.failClosedError();
    }
  }

  async addAuditLog(actor, role, action, details, req) {
    if (!this.connected || !this.prisma) return null;
    try {
      return await this.prisma.auditLog.create({
        data: {
          action,
          targetEntityType: 'SYSTEM',
          targetEntityId: '00000000-0000-0000-0000-000000000000',
          ipAddress: req?.socket?.remoteAddress || '127.0.0.1',
          userAgent: req?.headers?.['user-agent'] || null,
          payloadAfter: { actor, role, details },
        },
      });
    } catch {
      return null;
    }
  }

  async getActiveAlert() {
    if (!this.connected || !this.prisma) return null;
    try {
      const setting = await this.prisma.systemSetting.findUnique({
        where: { key: 'active_emergency_alert' },
      });
      return setting ? JSON.parse(setting.value) : null;
    } catch {
      return null;
    }
  }

  async setActiveAlert(alert) {
    if (!this.connected || !this.prisma) return this.failClosedError();
    try {
      return await this.prisma.systemSetting.upsert({
        where: { key: 'active_emergency_alert' },
        update: { value: JSON.stringify(alert), updatedAt: new Date() },
        create: { key: 'active_emergency_alert', value: JSON.stringify(alert) },
      });
    } catch {
      return this.failClosedError();
    }
  }

  async getEditorialStats() {
    if (!this.connected || !this.prisma) return this.failClosedError();
    try {
      const counts = await this.prisma.newsArticle.groupBy({
        by: ['status'],
        _count: { id: true },
      });
      const stats = {
        totalIncoming: 0,
        pendingReview: 0,
        underReview: 0,
        revisionRequested: 0,
        publishedToday: 0,
        publishedTotal: 0,
        rejected: 0,
        breakingNews: 0,
      };
      for (const row of counts) {
        const c = row._count.id;
        if (row.status === 'pending_review') stats.pendingReview = c;
        if (row.status === 'in_review') stats.underReview = c;
        if (row.status === 'changes_requested') stats.revisionRequested = c;
        if (row.status === 'published') {
          stats.publishedTotal = c;
          stats.publishedToday = c;
        }
        if (row.status === 'rejected') stats.rejected = c;
      }
      stats.totalIncoming = stats.pendingReview + stats.underReview;
      return stats;
    } catch {
      return this.failClosedError();
    }
  }

  // --- Real Prisma User and Identity Methods ---
  async getUsers() {
    if (!this.connected || !this.prisma) return this.failClosedError();
    try {
      return await this.prisma.user.findMany({
        include: { profile: true, userRoles: { include: { role: true } } },
      });
    } catch {
      return this.failClosedError();
    }
  }

  async findUserById(id) {
    if (!this.connected || !this.prisma) return this.failClosedError();
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        include: { profile: true, userRoles: { include: { role: true } } },
      });
      if (!user) return null;
      return {
        id: user.id,
        identifier: user.email?.split('@')[0] || user.id,
        fullName: user.profile?.fullName || user.email,
        email: user.email,
        phoneNumber: user.phoneNumber,
        roles: user.userRoles?.map((ur) => ur.role.name) || ['REPORTER'],
        status: user.status,
        passwordHash: user.passwordHash,
      };
    } catch {
      return this.failClosedError();
    }
  }

  async findUserByIdentifier(identifier) {
    if (!this.connected || !this.prisma) return this.failClosedError();
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
      const orConditions = [
        { email: identifier },
        { phoneNumber: identifier },
      ];
      if (isUuid) {
        orConditions.push({ id: identifier });
      }
      const user = await this.prisma.user.findFirst({
        where: {
          OR: orConditions,
        },
        include: { profile: true, userRoles: { include: { role: true } } },
      });
      if (!user) return null;
      return {
        id: user.id,
        identifier: user.email?.split('@')[0] || user.id,
        fullName: user.profile?.fullName || user.email,
        email: user.email,
        phoneNumber: user.phoneNumber,
        roles: user.userRoles?.map((ur) => ur.role.name) || ['REPORTER'],
        status: user.status,
        passwordHash: user.passwordHash,
      };
    } catch {
      return this.failClosedError();
    }
  }

  async createUser(userData) {
    if (!this.connected || !this.prisma) return this.failClosedError();
    try {
      return await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: userData.email,
            phoneNumber: userData.phoneNumber,
            passwordHash: userData.passwordHash,
            status: userData.status || 'active',
            profile: {
              create: {
                fullName: userData.fullName || 'User',
              },
            },
          },
        });
        if (userData.roles && userData.roles.length > 0) {
          for (const roleName of userData.roles) {
            const r = await tx.role.findFirst({ where: { name: roleName } });
            if (r) {
              await tx.userRole.create({
                data: { userId: user.id, roleId: r.id },
              });
            }
          }
        }
        return user;
      });
    } catch (err) {
      console.error('[PrismaPostgresAdapter] createUser error:', err.message);
      return this.failClosedError();
    }
  }

  // --- Real Prisma Auth Session Methods ---
  async createSession(sessionData) {
    if (!this.connected || !this.prisma) return this.failClosedError();
    try {
      return await this.prisma.authSession.create({
        data: {
          userId: sessionData.userId,
          refreshTokenHash: sessionData.refreshTokenHash,
          expiresAt: sessionData.expiresAt instanceof Date ? sessionData.expiresAt : new Date(sessionData.expiresAt),
          ipAddress: sessionData.ipAddress || null,
          clientType: sessionData.clientType || null,
        },
      });
    } catch (err) {
      console.error('[PrismaPostgresAdapter] createSession error:', err.message);
      return this.failClosedError();
    }
  }

  async findSessionByTokenHash(refreshTokenHash) {
    if (!this.connected || !this.prisma) return this.failClosedError();
    try {
      const sess = await this.prisma.authSession.findFirst({
        where: { refreshTokenHash },
        include: {
          user: {
            include: { profile: true, userRoles: { include: { role: true } } },
          },
        },
      });
      if (!sess) return null;
      return {
        id: sess.id,
        userId: sess.userId,
        refreshTokenHash: sess.refreshTokenHash,
        expiresAt: sess.expiresAt,
        revokedAt: sess.revokedAt,
        user: {
          id: sess.user.id,
          identifier: sess.user.email?.split('@')[0] || sess.user.id,
          fullName: sess.user.profile?.fullName || sess.user.email,
          email: sess.user.email,
          roles: sess.user.userRoles?.map((ur) => ur.role.name) || ['REPORTER'],
          status: sess.user.status,
        },
      };
    } catch (err) {
      console.error('[PrismaPostgresAdapter] findSessionByTokenHash error:', err.message);
      return this.failClosedError();
    }
  }

  async revokeSession(sessionId) {
    if (!this.connected || !this.prisma) return this.failClosedError();
    try {
      await this.prisma.authSession.update({
        where: { id: sessionId },
        data: { revokedAt: new Date() },
      });
      return true;
    } catch {
      return false;
    }
  }

  async revokeAllUserSessions(userId) {
    if (!this.connected || !this.prisma) return this.failClosedError();
    try {
      const res = await this.prisma.authSession.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      return res.count;
    } catch {
      return 0;
    }
  }

  async disconnect() {
    if (this.prisma) {
      try {
        await this.prisma.$disconnect();
      } catch {
        // ignore
      }
    }
    this.connected = false;
  }

  getHealth() {
    return {
      adapterType: 'prisma_postgresql',
      status: this.connected ? 'connected' : 'unverified',
      storageMode: 'postgresql_authoritative',
      multiInstanceSafe: true,
      provider: 'postgresql',
      databaseAvailable: this.connected,
      error: this.connected ? null : 'ERR_DATABASE_UNAVAILABLE',
      message: this.connected
        ? 'Authoritative PostgreSQL database connected'
        : 'DATABASE_URL provisioned but database is unreachable or @prisma/client is ungenerated.',
    };
  }
}

// -------------------------------------------------------------
// 5. FACTORY FUNCTION
// -------------------------------------------------------------

import { FirestoreAdapter } from './firestoreAdapter.js';
export { FirestoreAdapter };

let globalAdapterInstance = null;

export function getPersistenceAdapter(options = {}) {
  if (options.forceFresh || !globalAdapterInstance) {
    const isProduction = process.env.NODE_ENV === 'production';
    const isTest = process.env.NODE_ENV === 'test';
    const dbUrl = process.env.DATABASE_URL;
    const persistenceMode = process.env.PERSISTENCE_MODE;
    const firestoreDbId = process.env.FIRESTORE_DATABASE_ID;
    const isEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST || options.isEmulator);
    const allowCloudInDev = process.env.ALLOW_CLOUD_FIRESTORE_IN_DEV === 'true' || options.allowCloudInDev === true;

    // PRODUCTION RUNTIME:
    if (isProduction) {
      if (options.adapterType === 'firestore' || persistenceMode === 'firestore' || (firestoreDbId && !dbUrl)) {
        globalAdapterInstance = new FirestoreAdapter(options);
      } else if (dbUrl) {
        globalAdapterInstance = new PrismaPostgresAdapter(dbUrl);
      } else if (!options.allowDevFallback) {
        globalAdapterInstance = new ProductionGuardAdapter();
      } else {
        globalAdapterInstance = new LocalJsonAdapter(options.filePath || DEFAULT_STORE_FILE);
      }
    }
    // TEST RUNTIME:
    else if (isTest) {
      if (options.adapterType === 'firestore' || isEmulator || (allowCloudInDev && persistenceMode === 'firestore')) {
        globalAdapterInstance = new FirestoreAdapter(options);
      } else if (dbUrl && options.adapterType === 'prisma') {
        globalAdapterInstance = new PrismaPostgresAdapter(dbUrl);
      } else {
        globalAdapterInstance = new LocalJsonAdapter(options.filePath || DEFAULT_STORE_FILE);
      }
    }
    // DEVELOPMENT RUNTIME:
    else {
      // In development, LocalJsonAdapter is the canonical default.
      // Connecting to Firestore in development requires EXPLICIT authorization:
      // 1. Explicit options.adapterType === 'firestore' (programmatic unit test/explicit call)
      // 2. Active Firestore Emulator (process.env.FIRESTORE_EMULATOR_HOST)
      // 3. Explicit opt-in flag (process.env.ALLOW_CLOUD_FIRESTORE_IN_DEV === 'true')
      // Ambient or inherited FIRESTORE_DATABASE_ID / PERSISTENCE_MODE alone cannot force cloud connection.
      if (options.adapterType === 'firestore' || isEmulator || (allowCloudInDev && (persistenceMode === 'firestore' || firestoreDbId))) {
        globalAdapterInstance = new FirestoreAdapter(options);
      } else if (dbUrl && options.adapterType === 'prisma') {
        globalAdapterInstance = new PrismaPostgresAdapter(dbUrl);
      } else {
        globalAdapterInstance = new LocalJsonAdapter(options.filePath || DEFAULT_STORE_FILE);
      }
    }
  }
  return globalAdapterInstance;
}

