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

// -------------------------------------------------------------
// CANONICAL SEED DATA DEFINITIONS
// -------------------------------------------------------------

export const INITIAL_CATEGORIES = [
  { id: 'cat-mp', slug: 'madhya-pradesh', nameHi: 'मध्य प्रदेश', nameEn: 'Madhya Pradesh', sortOrder: 1 },
  { id: 'cat-pol', slug: 'politics', nameHi: 'राजनीति', nameEn: 'Politics', sortOrder: 2 },
  { id: 'cat-crime', slug: 'crime', nameHi: 'अपराध', nameEn: 'Crime', sortOrder: 3 },
  { id: 'cat-gov', slug: 'governance', nameHi: 'शासन एवं नीतियां', nameEn: 'Governance', sortOrder: 4 },
  { id: 'cat-farm', slug: 'agriculture', nameHi: 'किसान व मंडी', nameEn: 'Agriculture & Mandi', sortOrder: 5 },
  { id: 'cat-dev', slug: 'development', nameHi: 'विकास व इंफ्रा', nameEn: 'Development', sortOrder: 6 },
  { id: 'cat-edu', slug: 'education-jobs', nameHi: 'शिक्षा व रोजगार', nameEn: 'Education & Jobs', sortOrder: 7 },
  { id: 'cat-health', slug: 'health', nameHi: 'स्वास्थ्य', nameEn: 'Health', sortOrder: 8 },
  { id: 'cat-civic', slug: 'civic-issues', nameHi: 'बिजली-पानी-सड़क', nameEn: 'Civic Issues', sortOrder: 9 },
  { id: 'cat-env', slug: 'environment', nameHi: 'पर्यावरण व मौसम', nameEn: 'Environment & Weather', sortOrder: 10 },
  { id: 'cat-rel', slug: 'culture-religion', nameHi: 'धर्म व संस्कृति', nameEn: 'Culture & Religion', sortOrder: 11 },
  { id: 'cat-biz', slug: 'business', nameHi: 'व्यापार व उद्योग', nameEn: 'Business & Economy', sortOrder: 12 },
  { id: 'cat-sports', slug: 'sports', nameHi: 'खेल जगत', nameEn: 'Sports', sortOrder: 13 },
  { id: 'cat-women', slug: 'women-youth', nameHi: 'महिला व युवा', nameEn: 'Women & Youth', sortOrder: 14 },
  { id: 'cat-panchayat', slug: 'panchayat-rural', nameHi: 'ग्राम पंचायत', nameEn: 'Rural & Panchayat', sortOrder: 15 },
  { id: 'cat-fact', slug: 'fact-check', nameHi: 'फैक्ट चेक', nameEn: 'Fact Check', sortOrder: 16 },
  { id: 'cat-nat', slug: 'national', nameHi: 'देश', nameEn: 'National', sortOrder: 17 },
  { id: 'cat-world', slug: 'international', nameHi: 'विदेश', nameEn: 'International', sortOrder: 18 },
  { id: 'cat-sci', slug: 'science-tech', nameHi: 'विज्ञान व तकनीक', nameEn: 'Science & Tech', sortOrder: 19 },
  { id: 'cat-auto', slug: 'auto', nameHi: 'ऑटोमोबाइल', nameEn: 'Auto', sortOrder: 20 },
  { id: 'cat-ent', slug: 'entertainment', nameHi: 'मनोरंजन', nameEn: 'Entertainment', sortOrder: 21 },
];

export const INITIAL_DISTRICTS = [
  { id: 'dist-bhopal', slug: 'bhopal', nameHi: 'भोपाल', nameEn: 'Bhopal', divisionId: 'div-bhopal', stateId: 'mp' },
  { id: 'dist-indore', slug: 'indore', nameHi: 'इंदौर', nameEn: 'Indore', divisionId: 'div-indore', stateId: 'mp' },
  { id: 'dist-gwalior', slug: 'gwalior', nameHi: 'ग्वालियर', nameEn: 'Gwalior', divisionId: 'div-gwalior', stateId: 'mp' },
  { id: 'dist-jabalpur', slug: 'jabalpur', nameHi: 'जबलपुर', nameEn: 'Jabalpur', divisionId: 'div-jabalpur', stateId: 'mp' },
  { id: 'dist-ujjain', slug: 'ujjain', nameHi: 'उज्जैन', nameEn: 'Ujjain', divisionId: 'div-ujjain', stateId: 'mp' },
  { id: 'dist-sagar', slug: 'sagar', nameHi: 'सागर', nameEn: 'Sagar', divisionId: 'div-sagar', stateId: 'mp' },
  { id: 'dist-rewa', slug: 'rewa', nameHi: 'रीवा', nameEn: 'Rewa', divisionId: 'div-rewa', stateId: 'mp' },
  { id: 'dist-satna', slug: 'satna', nameHi: 'सतना', nameEn: 'Satna', divisionId: 'div-rewa', stateId: 'mp' },
  { id: 'dist-ratlam', slug: 'ratlam', nameHi: 'रतलाम', nameEn: 'Ratlam', divisionId: 'div-ujjain', stateId: 'mp' },
  { id: 'dist-dewas', slug: 'dewas', nameHi: 'देवास', nameEn: 'Dewas', divisionId: 'div-ujjain', stateId: 'mp' },
  { id: 'dist-chhindwara', slug: 'chhindwara', nameHi: 'छिंदवाड़ा', nameEn: 'Chhindwara', divisionId: 'div-jabalpur', stateId: 'mp' },
  { id: 'dist-morena', slug: 'morena', nameHi: 'मुरैना', nameEn: 'Morena', divisionId: 'div-chambal', stateId: 'mp' },
  { id: 'dist-bhind', slug: 'bhind', nameHi: 'भिंड', nameEn: 'Bhind', divisionId: 'div-chambal', stateId: 'mp' },
  { id: 'dist-sehore', slug: 'sehore', nameHi: 'सीहोर', nameEn: 'Sehore', divisionId: 'div-bhopal', stateId: 'mp' },
  { id: 'dist-vidisha', slug: 'vidisha', nameHi: 'विदिशा', nameEn: 'Vidisha', divisionId: 'div-bhopal', stateId: 'mp' },
];

export const INITIAL_REPORTERS = [
  {
    id: 'rep-001',
    name: 'राजेश पटेल',
    email: 'rajesh.patel@breakingnewswala.com',
    phone: '+91 98260 11223',
    role: 'trusted_reporter',
    assignedDistricts: ['dist-bhopal', 'dist-sehore'],
    assignedDivision: 'div-bhopal',
    totalStoriesFiled: 142,
    totalStoriesPublished: 128,
    badgeNumber: 'BNW-REP-0101',
    joinedDate: '15 जनवरी 2024',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    status: 'ACTIVE',
  },
  {
    id: 'rep-002',
    name: 'सुनीता शर्मा',
    email: 'sunita.sharma@breakingnewswala.com',
    phone: '+91 94250 88771',
    role: 'trusted_reporter',
    assignedDistricts: ['dist-indore', 'dist-dewas'],
    assignedDivision: 'div-indore',
    totalStoriesFiled: 98,
    totalStoriesPublished: 91,
    badgeNumber: 'BNW-REP-0102',
    joinedDate: '01 मार्च 2024',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
    status: 'ACTIVE',
  },
  {
    id: 'rep-003',
    name: 'अमित वर्मा',
    email: 'amit.verma@breakingnewswala.com',
    phone: '+91 97555 44332',
    role: 'reporter',
    assignedDistricts: ['dist-gwalior', 'dist-bhind', 'dist-morena'],
    assignedDivision: 'div-gwalior',
    totalStoriesFiled: 64,
    totalStoriesPublished: 49,
    badgeNumber: 'BNW-REP-0103',
    joinedDate: '10 मई 2024',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    status: 'ACTIVE',
  },
  {
    id: 'rep-004',
    name: 'विक्रम सिंह',
    email: 'vikram.singh@breakingnewswala.com',
    phone: '+91 91110 33445',
    role: 'reporter',
    assignedDistricts: ['dist-rewa', 'dist-satna'],
    assignedDivision: 'div-rewa',
    totalStoriesFiled: 42,
    totalStoriesPublished: 35,
    badgeNumber: 'BNW-REP-0104',
    joinedDate: '22 जुलाई 2024',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    status: 'ACTIVE',
  },
];

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
  { id: 'ad-01', placement: 'top_leaderboard', title: 'मध्य प्रदेश पर्यटन — हिंदुस्तान का दिल देखो', imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80', targetUrl: 'https://www.mptourism.com', advertiserName: 'मप्र पर्यटन विकास निगम', isActive: true },
  { id: 'ad-02', placement: 'in_feed', title: 'कृषक उन्नति ट्रैक्टर व कृषि उपकरण विशेष छूट मेला', imageUrl: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?w=800&auto=format&fit=crop&q=80', targetUrl: 'https://example.com/tractor-mela', advertiserName: 'मध्य प्रदेश कृषि उद्योग विकास निगम', isActive: true },
  { id: 'ad-03', placement: 'sticky_bottom', title: 'भोपाल प्रॉपर्टी एक्सपो 2026 — अपने सपनों का घर पाएं', imageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&auto=format&fit=crop&q=80', targetUrl: 'https://example.com/bhopal-expo', advertiserName: 'क्रेडाई भोपाल', isActive: true },
];

export const INITIAL_USERS = [
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
    } else {
      this.data.articles = [...INITIAL_ARTICLES, ...INITIAL_PENDING_STORIES];
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

  async toggleAd(id) {
    const ad = this.data.ads.find((a) => a.id === id);
    if (!ad) return null;
    ad.isActive = !ad.isActive;
    this.save();
    return ad;
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

  async toggleAd() {
    return this.failClosedError();
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
    const dbUrl = process.env.DATABASE_URL;
    const persistenceMode = process.env.PERSISTENCE_MODE;
    const firestoreDbId = process.env.FIRESTORE_DATABASE_ID;

    if (options.adapterType === 'firestore' || persistenceMode === 'firestore' || (firestoreDbId && !dbUrl)) {
      globalAdapterInstance = new FirestoreAdapter(options);
    } else if (dbUrl) {
      globalAdapterInstance = new PrismaPostgresAdapter(dbUrl);
    } else if (isProduction && !options.allowDevFallback) {
      globalAdapterInstance = new ProductionGuardAdapter();
    } else {
      globalAdapterInstance = new LocalJsonAdapter(options.filePath || DEFAULT_STORE_FILE);
    }
  }
  return globalAdapterInstance;
}

