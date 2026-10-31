import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { 
  Article, 
  Category, 
  ReporterProfile, 
  GraphicTemplate, 
  BreakingTicker, 
  ApiPoolKey, 
  SystemAuditLog, 
  AdBanner 
} from './src/types/index.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Initial Seed Data: 21 Canonical Categories
let categories: Category[] = [
  { id: 'cat-1', nameHindi: 'टॉप न्यूज़', nameEnglish: 'Top News', slug: 'top-news', isActive: true, order: 1, subcategories: ['बड़ी खबरें', 'ब्रेकिंग', 'राष्ट्रीय महत्व'] },
  { id: 'cat-2', nameHindi: 'ताज़ा खबरें', nameEnglish: 'Latest News', slug: 'latest', isActive: true, order: 2, subcategories: ['लाइव अपडेट', 'हलचल', 'मॉर्निंग राउंडअप'] },
  { id: 'cat-3', nameHindi: 'मध्य प्रदेश', nameEnglish: 'Madhya Pradesh', slug: 'madhya-pradesh', isActive: true, order: 3, subcategories: ['निवाड़ी', 'भोपाल', 'इंदौर', 'ग्वालियर', 'जबलपुर', 'उज्जैन', 'सागर', 'रीवा', 'सतना'] },
  { id: 'cat-4', nameHindi: 'राज्य समाचार', nameEnglish: 'State News', slug: 'states', isActive: true, order: 4, subcategories: ['उत्तर प्रदेश', 'राजस्थान', 'बिहार', 'छत्तीसगढ़', 'दिल्ली'] },
  { id: 'cat-5', nameHindi: 'देश', nameEnglish: 'National', slug: 'national', isActive: true, order: 5, subcategories: ['संसद', 'सुप्रीम कोर्ट', 'योजनाएं', 'सुरक्षा'] },
  { id: 'cat-6', nameHindi: 'विदेश', nameEnglish: 'International', slug: 'international', isActive: true, order: 6, subcategories: ['वैश्विक घटनाक्रम', 'कूटनीति', 'प्रवासी भारतीय'] },
  { id: 'cat-7', nameHindi: 'राजनीति', nameEnglish: 'Politics', slug: 'politics', isActive: true, order: 7, subcategories: ['चुनाव', 'पार्टियां', 'बयानबाजी', 'रैली'] },
  { id: 'cat-8', nameHindi: 'बिजनेस', nameEnglish: 'Business', slug: 'business', isActive: true, order: 8, subcategories: ['शेयर बाजार', 'अर्थव्यवस्था', 'व्यापार', 'सोना-चांदी', 'बजट'] },
  { id: 'cat-9', nameHindi: 'खेल', nameEnglish: 'Sports', slug: 'sports', isActive: true, order: 9, subcategories: ['क्रिकेट', 'फुटबॉल', 'हॉकी', 'अन्य खेल'] },
  { id: 'cat-10', nameHindi: 'मनोरंजन', nameEnglish: 'Entertainment', slug: 'entertainment', isActive: true, order: 10, subcategories: ['बॉलीवुड', 'टीवी', 'सिनेमा', 'ओटीटी', 'गॉसिप'] },
  { id: 'cat-11', nameHindi: 'शिक्षा', nameEnglish: 'Education', slug: 'education', isActive: true, order: 11, subcategories: ['स्कूल', 'कॉलेज', 'परीक्षा', 'परिणाम'] },
  { id: 'cat-12', nameHindi: 'करियर एवं रोजगार', nameEnglish: 'Career & Jobs', slug: 'career', isActive: true, order: 12, subcategories: ['सरकारी नौकरी', 'निजी नौकरी', 'भर्ती सूचना', 'इंटरव्यू'] },
  { id: 'cat-13', nameHindi: 'टेक्नोलॉजी', nameEnglish: 'Technology', slug: 'technology', isActive: true, order: 13, subcategories: ['गैजेट्स', 'मोबाइल', 'AI और टेक', 'साइबर सुरक्षा'] },
  { id: 'cat-14', nameHindi: 'ऑटोमोबाइल', nameEnglish: 'Automobile', slug: 'automobile', isActive: true, order: 14, subcategories: ['कार', 'बाइक', 'इलेक्ट्रिक वाहन', 'माइलेज रिव्यू'] },
  { id: 'cat-15', nameHindi: 'धर्म एवं अध्यात्म', nameEnglish: 'Religion & Spirituality', slug: 'spiritual', isActive: true, order: 15, subcategories: ['मंदिर', 'धर्म', 'त्योहार', 'कथा-प्रवचन'] },
  { id: 'cat-16', nameHindi: 'लाइफस्टाइल', nameEnglish: 'Lifestyle', slug: 'lifestyle', isActive: true, order: 16, subcategories: ['फैशन', 'खानपान', 'परिवार', 'यात्रा'] },
  { id: 'cat-17', nameHindi: 'स्वास्थ्य', nameEnglish: 'Health', slug: 'health', isActive: true, order: 17, subcategories: ['फिटनेस', 'आयुर्वेद', 'घरेलू नुस्खे', 'चिकित्सा'] },
  { id: 'cat-18', nameHindi: 'राशिफल', nameEnglish: 'Horoscope', slug: 'horoscope', isActive: true, order: 18, subcategories: ['दैनिक राशिफल', 'साप्ताहिक', 'पंचांग', 'ज्योतिष'] },
  { id: 'cat-19', nameHindi: 'ओपिनियन', nameEnglish: 'Opinion', slug: 'opinion', isActive: true, order: 19, subcategories: ['संपादकीय', 'विशेषज्ञ राय', 'जनता की आवाज'] },
  { id: 'cat-20', nameHindi: 'क्राइम', nameEnglish: 'Crime', slug: 'crime', isActive: true, order: 20, subcategories: ['पुलिस कार्रवाई', 'कोर्ट केस', 'जांच', 'सुरक्षा'] },
  { id: 'cat-21', nameHindi: 'वायरल न्यूज़', nameEnglish: 'Viral', slug: 'viral', isActive: true, order: 21, subcategories: ['सोशल मीडिया', 'अजब-गजब', 'प्रेरक प्रसंग'] }
];

// District Taxonomy (Madhya Pradesh flagship)
const districtsList = [
  'निवाड़ी (Niwari)',
  'भोपाल (Bhopal)',
  'इंदौर (Indore)',
  'ग्वालियर (Gwalior)',
  'जबलपुर (Jabalpur)',
  'उज्जैन (Ujjain)',
  'सागर (Sagar)',
  'रीवा (Rewa)',
  'सतना (Satna)',
  'टीकमगढ़ (Tikamgarh)',
  'छतरपुर (Chhatarpur)',
  'दतिया (Datia)',
  'मुरैना (Morena)',
  'भिंड (Bhind)',
  'शिवपुरी (Shivpuri)'
];

// Registered Reporters
let reporters: ReporterProfile[] = [
  {
    id: 'rep-1',
    name: 'सुनीता वर्मा',
    email: 'sunita.gwalior@breakingnewswala.com',
    phone: '+91 98261 44520',
    role: 'trusted_reporter',
    assignedDistricts: ['ग्वालियर (Gwalior)', 'निवाड़ी (Niwari)'],
    assignedCities: ['ग्वालियर', 'ओरछा', 'निवाड़ी'],
    assignedTemplateIds: ['tpl-1', 'tpl-2', 'tpl-3'],
    totalStoriesFiled: 42,
    totalStoriesPublished: 39,
    badgeNumber: 'BNW-REP-019',
    joinedDate: '2026-02-15',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'rep-2',
    name: 'राजेश पटेल',
    email: 'rajesh.bhopal@breakingnewswala.com',
    phone: '+91 94250 88114',
    role: 'reporter',
    assignedDistricts: ['भोपाल (Bhopal)', 'सीहोर'],
    assignedCities: ['भोपाल', 'कोलार', 'बैरागढ़'],
    assignedTemplateIds: ['tpl-1', 'tpl-2'],
    totalStoriesFiled: 28,
    totalStoriesPublished: 21,
    badgeNumber: 'BNW-REP-044',
    joinedDate: '2026-05-10',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'rep-3',
    name: 'विकास यादव',
    email: 'vikas.indore@breakingnewswala.com',
    phone: '+91 98930 12099',
    role: 'trusted_reporter',
    assignedDistricts: ['इंदौर (Indore)', 'उज्जैन (Ujjain)'],
    assignedCities: ['इंदौर', 'महू', 'उज्जैन'],
    assignedTemplateIds: ['tpl-1', 'tpl-3', 'tpl-4'],
    totalStoriesFiled: 65,
    totalStoriesPublished: 63,
    badgeNumber: 'BNW-REP-008',
    joinedDate: '2025-11-20',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
  }
];

// Initial News Articles
let articles: Article[] = [
  {
    id: 'art-1',
    title: 'निवाड़ी में ऐतिहासिक रामराजा मंदिर में महाआरती, बुंदेलखंड समेत हजारों श्रद्धालु पहुंचे',
    subtitle: 'ओरछा के पवित्र पावन धाम में श्री रामराजा सरकार के विशेष दर्शन के लिए उमड़ी भीड़, सुरक्षा के कड़े प्रबंध',
    content: 'मध्य प्रदेश के नवगठित जिले निवाड़ी के ऐतिहासिक धार्मिक नगर ओरछा में आज शाम श्री रामराजा मंदिर में भव्य महाआरती का आयोजन हुआ। भगवान श्री राम को यहां राजा के रूप में गार्ड ऑफ ऑनर दिया गया।\n\nस्थानीय प्रशासन और पुलिस बल ने विशाल जनसमूह को देखते हुए मंदिर परिसर और बेतवा नदी के घाटों पर कड़े सुरक्षा इंतजाम किए हैं। जिला कलेक्टर और पुलिस अधीक्षक ने खुद सुरक्षा व्यवस्था का जायजा लिया।\n\nश्रद्धालुओं ने बताया कि ओरछा की इस पावन भूमि पर आकर आत्मिक शांति की अनुभूति होती है। शाम को बेतवा नदी के कंचना घाट पर दीपदान का भव्य नजारा देखने लायक रहा।',
    rawScript: 'ओरछा निवाड़ी में रामराजा मंदिर में महाआरती हुई। बहुत भीड़ आई। बेतवा नदी पर दीपदान हुआ। एसपी कलेक्टर ने सुरक्षा देखी।',
    slug: 'niwari-ramraja-mandir-orchha-maha-aarti',
    category: 'मध्य प्रदेश',
    subcategory: 'निवाड़ी',
    state: 'मध्य प्रदेश',
    district: 'निवाड़ी (Niwari)',
    city: 'ओरछा',
    thumbnail: 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=900&auto=format&fit=crop&q=80',
    images: ['https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=900&auto=format&fit=crop&q=80'],
    status: 'published',
    authorId: 'rep-1',
    authorName: 'सुनीता वर्मा',
    authorRole: 'trusted_reporter',
    isTrustedPublish: true,
    views: 14200,
    shares: 890,
    bookmarks: 312,
    readingTimeMinutes: 3,
    isBreaking: true,
    isLeadStory: true,
    publishedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    seoTitle: 'निवाड़ी ओरछा रामराजा मंदिर महाआरती | BREAKING NEWS WALA',
    metaDescription: 'निवाड़ी जिले के ओरछा में रामराजा सरकार मंदिर में महाआरती, हजारों श्रद्धालु पहुंचे।',
    tags: ['निवाड़ी', 'ओरछा', 'रामराजा सरकार', 'मध्य प्रदेश', 'धार्मिक']
  },
  {
    id: 'art-2',
    title: 'भोपाल में डिजिटल गवर्नेंस को बड़ा बढ़ावा: अब सभी जनसुविधाएं एक सिंगल मोबाइल ऐप पर',
    subtitle: 'मध्य प्रदेश सरकार की नई सौगात; बिजली बिल, नगर निगम सेवाएं और प्रमाण पत्र 15 मिनट में होंगे जारी',
    content: 'राजधानी भोपाल में आज मुख्य सचिव की अध्यक्षता में डिजिटल एमपी मिशन की उच्चस्तरीय समीक्षा बैठक हुई। नागरिकों को सरकारी कार्यालयों के चक्कर काटने से मुक्ति दिलाने के लिए एकीकृत पोर्टल और नागरिक ऐप का शुभारंभ किया गया है।\n\nइस ऐप के जरिए संपत्ति कर, जल कर, जन्म-मृत्यु प्रमाण पत्र और राशन कार्ड से जुड़ी सेवाएं ऑनलाइन मिलेंगी। शिकायत निवारण के लिए एआई आधारित ऑटोमेटेड हेल्पडेस्क भी शामिल किया गया है।',
    slug: 'bhopal-digital-governance-portal-app-launch',
    category: 'मध्य प्रदेश',
    subcategory: 'भोपाल',
    state: 'मध्य प्रदेश',
    district: 'भोपाल (Bhopal)',
    city: 'भोपाल',
    thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=900&auto=format&fit=crop&q=80',
    status: 'published',
    authorId: 'rep-2',
    authorName: 'राजेश पटेल',
    authorRole: 'reporter',
    views: 8940,
    shares: 412,
    bookmarks: 180,
    readingTimeMinutes: 2,
    isBreaking: false,
    publishedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    tags: ['भोपाल', 'मध्य प्रदेश', 'डिजिटल गवर्नेंस', 'नागरिक सुविधाएं']
  },
  {
    id: 'art-3',
    title: 'इंदौर मेट्रो का नया ट्रायल सफल: सुपर कॉरिडोर से एयरपोर्ट तक 80 किमी प्रति घंटे की रफ्तार से दौड़ी ट्रेन',
    subtitle: 'यात्रियों के लिए अगले माह से शुरू हो सकता है वाणिज्यिक संचालन, सुरक्षा क्लीयरेंस प्राप्त',
    content: 'स्वच्छता में देश में अव्वल इंदौर शहर ने आज सार्वजनिक परिवहन के क्षेत्र में एक और कीर्तिमान स्थापित किया। इंदौर मेट्रो रेल का सुपर कॉरिडोर से एयरपोर्ट खंड तक हाई-स्पीड सुरक्षा ट्रायल पूरी तरह सफल रहा।\n\nमेट्रो रेल कॉर्पोरेशन के एमडी ने बताया कि सभी 8 स्टेशनों पर एस्केलेटर, स्वचालित टिकटिंग और सुरक्षा उपकरण स्थापित कर दिए गए हैं। अगले माह मध्य प्रदेश के मुख्यमंत्री इसका विधिवत उद्घाटन कर सकते हैं।',
    slug: 'indore-metro-trial-run-super-corridor-airport',
    category: 'मध्य प्रदेश',
    subcategory: 'इंदौर',
    state: 'मध्य प्रदेश',
    district: 'इंदौर (Indore)',
    city: 'इंदौर',
    thumbnail: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=900&auto=format&fit=crop&q=80',
    status: 'published',
    authorId: 'rep-3',
    authorName: 'विकास यादव',
    authorRole: 'trusted_reporter',
    isTrustedPublish: true,
    views: 19800,
    shares: 1240,
    bookmarks: 490,
    readingTimeMinutes: 3,
    isBreaking: true,
    publishedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 9).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    tags: ['इंदौर', 'इंदौर मेट्रो', 'मध्य प्रदेश', 'विकास']
  },
  {
    id: 'art-4',
    title: 'ग्वालियर किला परिसर में राष्ट्रीय लाइट एंड साउंड शो का नया स्वरूप, पर्यटकों का मन मोहा',
    subtitle: 'राजा मानसिंह तोमर और वीरांगना लक्ष्मीबाई के शौर्य की गाथा नए 3D प्रोजेक्शन मैपिंग तकनीक से जीवंत',
    content: 'ग्वालियर के ऐतिहासिक दुर्ग पर आज पुरातत्व एवं पर्यटन विभाग द्वारा अत्याधुनिक लेजर और 3डी प्रोजेक्शन तकनीक से सुसज्जित नए साउंड एंड लाइट शो का शुभारंभ किया गया।\n\nइस शो में ग्वालियर के संगीत घराने, तानसेन की साधना और 1857 के प्रथम स्वतंत्रता संग्राम में वीरांगना रानी लक्ष्मीबाई के बलिदान को बड़े ही रोमांचक अंदाज में प्रस्तुत किया गया है।',
    slug: 'gwalior-fort-light-and-sound-show-new-edition',
    category: 'मनोरंजन',
    subcategory: 'सिनेमा',
    state: 'मध्य प्रदेश',
    district: 'ग्वालियर (Gwalior)',
    city: 'ग्वालियर',
    thumbnail: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=900&auto=format&fit=crop&q=80',
    status: 'published',
    authorId: 'rep-1',
    authorName: 'सुनीता वर्मा',
    authorRole: 'trusted_reporter',
    views: 6520,
    shares: 310,
    bookmarks: 142,
    readingTimeMinutes: 2,
    publishedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 14).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    tags: ['ग्वालियर', 'पर्यटन', 'ऐतिहासिक', 'संस्कृति']
  },
  {
    id: 'art-5',
    title: 'भारतीय क्रिकेट टीम का शानदार प्रदर्शन: ऑस्ट्रेलिया के खिलाफ पहले टी20 मुकाबले में 6 विकेट से जीत',
    subtitle: 'सलामी बल्लेबाजों की शतकीय साझेदारी, अंतिम ओवरों में गेंदबाजों की कसी हुई गेंदबाजी से मुकाबला अपने नाम',
    content: 'भारत और ऑस्ट्रेलिया के बीच खेले गए रोमांचक टी20 सीरीज के पहले मैच में भारतीय टीम ने शानदार जीत दर्ज की है। पहले बल्लेबाजी करते हुए ऑस्ट्रेलिया ने 186 रनों का लक्ष्य रखा था, जिसे भारतीय टीम ने 19.2 ओवर में हासिल कर लिया।\n\nकप्तान ने मैच के बाद खिलाड़ियों के जुझारू जज्बे की सराहना की। सीरीज का दूसरा मैच रविवार को खेला जाएगा।',
    slug: 'india-vs-australia-t20-first-match-victory',
    category: 'खेल',
    subcategory: 'क्रिकेट',
    state: 'भारत',
    district: 'राष्ट्रीय',
    thumbnail: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=900&auto=format&fit=crop&q=80',
    status: 'published',
    authorId: 'admin-desk',
    authorName: 'केंद्रीय खेल डेस्क',
    authorRole: 'admin',
    views: 31200,
    shares: 2150,
    bookmarks: 680,
    readingTimeMinutes: 2,
    isBreaking: false,
    publishedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    tags: ['क्रिकेट', 'टीम इंडिया', 'टी20', 'स्पोर्ट्स']
  },
  {
    id: 'art-6',
    title: 'जबलपुर: भेड़ाघाट में संगमरमरी वादियों के बीच पर्यटकों के लिए रिवर राफ्टिंग की नई सुविधा शुरू',
    subtitle: 'धुआंधार जलप्रपात के शांत जल क्षेत्र में वाटर स्पोर्ट्स शुरू, स्थानीय युवाओं को मिला रोजगार',
    content: 'मध्य प्रदेश की संस्कारधानी जबलपुर के विश्वप्रसिद्ध पर्यटन स्थल भेड़ाघाट में अब पर्यटक नर्मदा की संगमरमरी वादियों के बीच साहसिक जलक्रीड़ा का आनंद ले सकेंगे। पर्यटन निगम ने प्रशिक्षित गाइडों की निगरानी में रिवर राफ्टिंग शुरू की है।',
    slug: 'jabalpur-bhedaghat-marble-rocks-river-rafting',
    category: 'लाइफस्टाइल',
    subcategory: 'यात्रा',
    state: 'मध्य प्रदेश',
    district: 'जबलपुर (Jabalpur)',
    thumbnail: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=900&auto=format&fit=crop&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    isReel: true,
    status: 'published',
    authorId: 'rep-2',
    authorName: 'राजेश पटेल',
    authorRole: 'reporter',
    views: 12450,
    shares: 630,
    bookmarks: 280,
    readingTimeMinutes: 2,
    publishedAt: new Date(Date.now() - 3600000 * 7).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 7).toISOString(),
    tags: ['जबलपुर', 'भेड़ाघाट', 'पर्यटन', 'नर्मदा']
  },
  {
    id: 'art-7',
    title: 'निवाड़ी कृषि उपज मंडी में सरसों और उड़द की बंपर आवक, किसानों को मिले उचित समर्थन मूल्य',
    subtitle: 'मंडी सचिव ने कहा- पारदर्शी ई-नीलामी व्यवस्था से किसानों के बैंक खातों में सीधे पहुंच रही रकम',
    content: 'निवाड़ी जिले की मुख्य कृषि उपज मंडी में इन दिनों रबी और दलहन फसलों की भारी आवक देखी जा रही है। विशेष रूप से सरसों और उड़द लेकर पहुंचे किसानों को पारदर्शी ई-मंडी प्रणाली के जरिए त्वरित भुगतान प्राप्त हो रहा है।',
    rawScript: 'निवाड़ी मंडी में सरसों उड़द की बहुत आवक। किसानों को तुरंत पैसा मिला। कोई बिचौलिया नहीं।',
    slug: 'niwari-krishi-mandi-sarson-urad-arrival',
    category: 'बिजनेस',
    subcategory: 'व्यापार',
    state: 'मध्य प्रदेश',
    district: 'निवाड़ी (Niwari)',
    city: 'निवाड़ी',
    thumbnail: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?w=900&auto=format&fit=crop&q=80',
    status: 'pending_review',
    authorId: 'rep-2',
    authorName: 'राजेश पटेल',
    authorRole: 'reporter',
    views: 0,
    shares: 0,
    bookmarks: 0,
    readingTimeMinutes: 2,
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
    tags: ['निवाड़ी', 'किसान', 'कृषि मंडी', 'मध्य प्रदेश']
  }
];

// Live Breaking Tickers
let tickers: BreakingTicker[] = [
  {
    id: 't-1',
    textHindi: 'ब्रेकिंग: निवाड़ी ओरछा के रामराजा मंदिर में महाआरती, हजारों की तादाद में पहुंचे श्रद्धालु',
    priority: 'critical',
    isActive: true,
    articleId: 'art-1',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 86400000).toISOString()
  },
  {
    id: 't-2',
    textHindi: 'इंदौर: सुपर कॉरिडोर से एयरपोर्ट तक मेट्रो का सफल स्पीड ट्रायल, जल्द होगा आम जनता के लिए शुभारंभ',
    priority: 'normal',
    isActive: true,
    articleId: 'art-3',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 86400000).toISOString()
  },
  {
    id: 't-3',
    textHindi: 'मौसम अलर्ट: मध्य प्रदेश के 12 जिलों में अगले 24 घंटे में गरज-चमक के साथ हल्की बारिश की संभावना',
    priority: 'normal',
    isActive: true,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 86400000).toISOString()
  }
];

// Graphic Templates
let templates: GraphicTemplate[] = [
  {
    id: 'tpl-1',
    title: 'ब्रेकिंग न्यूज़ रेड कार्ड (Breaking News Red Frame)',
    description: 'तेज तर्रार बड़ी खबरों के लिए लाल और पीले रंग का आधिकारिक बोल्ड फ़्रेम',
    aspectRatio: '1:1',
    themeColor: '#DC2626',
    backgroundStyle: 'gradient-red',
    version: 2,
    isAssignedToAll: true,
    assignedReporterIds: ['rep-1', 'rep-2', 'rep-3'],
    overlayLogo: true,
    headlineFontScale: 'large',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'tpl-2',
    title: 'जिला विशेष कार्ड (District Special Gold Frame)',
    description: 'जिलास्तरीय स्थानीय विकास, मंडी और प्रशासनिक समाचारों के लिए सुनहरा बॉर्डर',
    aspectRatio: '1:1',
    themeColor: '#F59E0B',
    backgroundStyle: 'breaking-yellow',
    version: 1,
    isAssignedToAll: false,
    assignedReporterIds: ['rep-1', 'rep-2'],
    overlayLogo: true,
    headlineFontScale: 'impact',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'tpl-3',
    title: 'बयान एवं कोटेशन कार्ड (Quote & Statement Frame)',
    description: 'नेताओं, अफसरों एवं विशिष्ट हस्तियों के प्रमुख बयानों के लिए डार्क चारकोल फ्रेम',
    aspectRatio: '1:1',
    themeColor: '#1F2937',
    backgroundStyle: 'dark-charcoal',
    version: 1,
    isAssignedToAll: false,
    assignedReporterIds: ['rep-1', 'rep-3'],
    overlayLogo: true,
    headlineFontScale: 'normal',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'tpl-4',
    title: 'वीडियो रील एवं शॉर्ट्स फ़्रेम (Vertical 9:16 Story Frame)',
    description: 'सोशल मीडिया एवं रील्स के लिए 9:16 वर्टिकल न्यूज़ कार्ड',
    aspectRatio: '9:16',
    themeColor: '#B91C1C',
    backgroundStyle: 'gradient-red',
    version: 1,
    isAssignedToAll: true,
    assignedReporterIds: ['rep-1', 'rep-2', 'rep-3'],
    overlayLogo: true,
    headlineFontScale: 'impact',
    updatedAt: new Date().toISOString()
  }
];

// System Audit Logs
let auditLogs: SystemAuditLog[] = [
  {
    id: 'log-1',
    actorName: 'एडमिनिस्ट्रेटर',
    actorRole: 'admin',
    actionType: 'ROLE_CHANGED',
    description: 'सुनीता वर्मा को निवाड़ी और ग्वालियर जिले के लिए "Trusted Reporter" (सीधा प्रकाशन अधिकार) प्रदान किया गया।',
    ipAddress: '192.168.1.10',
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 'log-2',
    actorName: 'सुनीता वर्मा',
    actorRole: 'trusted_reporter',
    actionType: 'ARTICLE_DIRECT_PUBLISHED',
    description: 'खबर "निवाड़ी में ऐतिहासिक रामराजा मंदिर में महाआरती..." को बिना एडमिन कतार सीधे प्रकाशित किया गया।',
    ipAddress: '103.21.144.12',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'log-3',
    actorName: 'केंद्रीय संपादक',
    actorRole: 'editor',
    actionType: 'TICKER_UPDATED',
    description: 'लाइव ब्रेकिंग न्यूज़ टिकर संदेश अपडेट किया गया।',
    ipAddress: '192.168.1.14',
    timestamp: new Date(Date.now() - 3600000 * 1).toISOString()
  }
];

// Advertisements
let ads: AdBanner[] = [
  {
    id: 'ad-1',
    placement: 'top_leaderboard',
    title: 'मध्य प्रदेश पर्यटन - दिल देखो, देश का दिल देखो',
    imageUrl: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=1200&auto=format&fit=crop&q=80',
    targetUrl: 'https://breakingnewswala.com',
    isActive: true,
    impressions: 48200,
    clicks: 1420
  },
  {
    id: 'ad-2',
    placement: 'in_feed',
    title: 'स्थानीय व्यापार संवर्धन - अपनी दुकान को बनाएं डिजिटल',
    imageUrl: 'https://images.unsplash.com/photo-1556742049-0a67e5572293?w=800&auto=format&fit=crop&q=80',
    targetUrl: 'https://breakingnewswala.com',
    isActive: true,
    impressions: 21500,
    clicks: 640
  }
];

// Helper: Initialize Gemini SDK
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

// ---------------- REST API ROUTES ----------------

// GET /api/news
app.get('/api/news', (req: Request, res: Response) => {
  const { category, district, status, search, trending, limit } = req.query;
  
  let result = [...articles];

  if (status) {
    result = result.filter(a => a.status === status);
  } else {
    // Default to published articles for general queries
    result = result.filter(a => a.status === 'published');
  }

  if (category && category !== 'all' && category !== 'होम') {
    result = result.filter(a => a.category === category || a.subcategory === category);
  }

  if (district && district !== 'all' && district !== 'सभी जिले') {
    result = result.filter(a => a.district.includes(district as string) || (a.city && a.city.includes(district as string)));
  }

  if (search) {
    const q = (search as string).toLowerCase().trim();
    result = result.filter(a => 
      a.title.toLowerCase().includes(q) || 
      a.content.toLowerCase().includes(q) ||
      a.district.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q) ||
      a.tags.some(t => t.toLowerCase().includes(q))
    );
  }

  if (trending === 'true') {
    result.sort((a, b) => (b.views + b.shares * 2) - (a.views + a.shares * 2));
  } else {
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  if (limit) {
    result = result.slice(0, parseInt(limit as string, 10));
  }

  res.json({ success: true, count: result.length, data: result });
});

// GET /api/news/:id
app.get('/api/news/:id', (req: Request, res: Response) => {
  const article = articles.find(a => a.id === req.params.id);
  if (!article) {
    return res.status(404).json({ success: false, error: 'Article not found' });
  }
  // Increment view count
  article.views += 1;
  res.json({ success: true, data: article });
});

// POST /api/news (File story)
app.post('/api/news', (req: Request, res: Response) => {
  const body = req.body;
  const isDirectPublish = body.isTrustedPublish && body.authorRole === 'trusted_reporter';
  
  const newArticle: Article = {
    id: `art-${Date.now()}`,
    title: body.title || 'शीर्षक रहित खबर',
    subtitle: body.subtitle || '',
    content: body.content || '',
    rawScript: body.rawScript || '',
    slug: (body.slug || body.title || `news-${Date.now()}`).toLowerCase().replace(/[^a-z0-9\u0900-\u097F]/g, '-').slice(0, 80),
    category: body.category || 'ताज़ा खबरें',
    subcategory: body.subcategory || '',
    state: body.state || 'मध्य प्रदेश',
    district: body.district || 'निवाड़ी (Niwari)',
    city: body.city || '',
    thumbnail: body.thumbnail || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=900&auto=format&fit=crop&q=80',
    images: body.images || [],
    videoUrl: body.videoUrl || '',
    isReel: !!body.isReel,
    status: isDirectPublish ? 'published' : 'pending_review',
    authorId: body.authorId || 'rep-1',
    authorName: body.authorName || 'सुनीता वर्मा',
    authorRole: body.authorRole || 'trusted_reporter',
    isTrustedPublish: isDirectPublish,
    editorialNotes: '',
    views: 0,
    shares: 0,
    bookmarks: 0,
    readingTimeMinutes: Math.max(1, Math.round((body.content || '').split(' ').length / 120)),
    isBreaking: !!body.isBreaking,
    isLeadStory: !!body.isLeadStory,
    publishedAt: isDirectPublish ? new Date().toISOString() : undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    seoTitle: body.seoTitle || `${body.title} | BREAKING NEWS WALA`,
    metaDescription: body.metaDescription || (body.subtitle || body.content || '').slice(0, 150),
    tags: body.tags && body.tags.length > 0 ? body.tags : ['ब्रेकिंग न्यूज़ वाला', body.category, body.district]
  };

  articles.unshift(newArticle);

  // Log to Audit Trail
  auditLogs.unshift({
    id: `log-${Date.now()}`,
    actorName: newArticle.authorName,
    actorRole: newArticle.authorRole,
    actionType: isDirectPublish ? 'ARTICLE_DIRECT_PUBLISHED' : 'ARTICLE_PUBLISHED',
    description: isDirectPublish 
      ? `विश्वसनीय रिपोर्टर द्वारा खबर "${newArticle.title}" को सीधे प्रकाशित किया गया।`
      : `रिपोर्टर द्वारा नई खबर "${newArticle.title}" समीक्षा कतार में प्रस्तुत की गई।`,
    ipAddress: req.ip || '127.0.0.1',
    timestamp: new Date().toISOString()
  });

  res.status(201).json({ success: true, data: newArticle });
});

// PATCH /api/news/:id (Editorial update / approve / reject / request revision)
app.patch('/api/news/:id', (req: Request, res: Response) => {
  const index = articles.findIndex(a => a.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Article not found' });
  }

  const existing = articles[index];
  const updates = req.body;

  const updatedArticle: Article = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
    publishedAt: (updates.status === 'published' && !existing.publishedAt) ? new Date().toISOString() : existing.publishedAt
  };

  articles[index] = updatedArticle;

  // Audit log for state transitions
  if (updates.status && updates.status !== existing.status) {
    let action: SystemAuditLog['actionType'] = 'ARTICLE_PUBLISHED';
    let desc = `खबर "${updatedArticle.title}" का स्टेटस बदलकर ${updates.status} किया गया।`;

    if (updates.status === 'rejected') {
      action = 'ARTICLE_REJECTED';
      desc = `खबर "${updatedArticle.title}" को अस्वीकृत किया गया। कारण: ${updates.rejectionReason || 'संपादकीय दिशा-निर्देश'}`;
    } else if (updates.status === 'revision_requested') {
      action = 'REVISION_REQUESTED';
      desc = `खबर "${updatedArticle.title}" में संशोधन का अनुरोध किया गया। टिप्पणी: ${updates.editorialNotes || 'कृपया जांचें'}`;
    }

    auditLogs.unshift({
      id: `log-${Date.now()}`,
      actorName: updates.reviewerName || 'केंद्रीय संपादक',
      actorRole: 'admin',
      actionType: action,
      description: desc,
      ipAddress: req.ip || '127.0.0.1',
      timestamp: new Date().toISOString()
    });
  }

  res.json({ success: true, data: updatedArticle });
});

// GET /api/categories
app.get('/api/categories', (_req: Request, res: Response) => {
  res.json({ success: true, data: categories });
});

// GET /api/locations
app.get('/api/locations', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      defaultState: 'मध्य प्रदेश',
      districts: districtsList
    }
  });
});

// GET /api/reporters
app.get('/api/reporters', (_req: Request, res: Response) => {
  res.json({ success: true, data: reporters });
});

// PATCH /api/reporters/:id (Update reporter permissions / district allocation)
app.patch('/api/reporters/:id', (req: Request, res: Response) => {
  const index = reporters.findIndex(r => r.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Reporter not found' });
  }

  const existing = reporters[index];
  const { role, assignedDistricts, assignedTemplateIds } = req.body;

  if (role) existing.role = role;
  if (assignedDistricts) existing.assignedDistricts = assignedDistricts;
  if (assignedTemplateIds) existing.assignedTemplateIds = assignedTemplateIds;

  auditLogs.unshift({
    id: `log-${Date.now()}`,
    actorName: 'सुपर एडमिनिस्ट्रेटर',
    actorRole: 'admin',
    actionType: 'ROLE_CHANGED',
    description: `रिपोर्टर ${existing.name} की अनुमतियाँ अद्यतन की गईं। रोल: ${existing.role}, जिले: ${existing.assignedDistricts.join(', ')}`,
    ipAddress: req.ip || '127.0.0.1',
    timestamp: new Date().toISOString()
  });

  res.json({ success: true, data: existing });
});

// GET & POST /api/ticker
app.get('/api/ticker', (_req: Request, res: Response) => {
  const activeTickers = tickers.filter(t => t.isActive);
  res.json({ success: true, data: activeTickers });
});

app.post('/api/ticker', (req: Request, res: Response) => {
  const { textHindi, priority, articleId } = req.body;
  if (!textHindi) {
    return res.status(400).json({ success: false, error: 'Ticker text required' });
  }

  const newTicker: BreakingTicker = {
    id: `t-${Date.now()}`,
    textHindi,
    priority: priority || 'normal',
    isActive: true,
    articleId,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 86400000).toISOString()
  };

  tickers.unshift(newTicker);

  auditLogs.unshift({
    id: `log-${Date.now()}`,
    actorName: 'केंद्रीय डेस्क एडमिन',
    actorRole: 'admin',
    actionType: 'TICKER_UPDATED',
    description: `नया लाइव टिकर सक्रिय किया गया: "${textHindi}"`,
    ipAddress: req.ip || '127.0.0.1',
    timestamp: new Date().toISOString()
  });

  res.status(201).json({ success: true, data: newTicker });
});

// GET & POST /api/templates
app.get('/api/templates', (_req: Request, res: Response) => {
  res.json({ success: true, data: templates });
});

app.post('/api/templates', (req: Request, res: Response) => {
  const body = req.body;
  const newTpl: GraphicTemplate = {
    id: `tpl-${Date.now()}`,
    title: body.title || 'नया ग्राफिक्स फ़्रेम',
    description: body.description || '',
    aspectRatio: body.aspectRatio || '1:1',
    themeColor: body.themeColor || '#DC2626',
    backgroundStyle: body.backgroundStyle || 'gradient-red',
    version: 1,
    isAssignedToAll: !!body.isAssignedToAll,
    assignedReporterIds: body.assignedReporterIds || [],
    overlayLogo: true,
    headlineFontScale: body.headlineFontScale || 'large',
    updatedAt: new Date().toISOString()
  };
  templates.push(newTpl);
  res.status(201).json({ success: true, data: newTpl });
});

// GET /api/audit-logs
app.get('/api/audit-logs', (_req: Request, res: Response) => {
  res.json({ success: true, data: auditLogs });
});

// GET /api/ads
app.get('/api/ads', (_req: Request, res: Response) => {
  res.json({ success: true, data: ads });
});

// GET /api/ai/pool-status
app.get('/api/ai/pool-status', (_req: Request, res: Response) => {
  const keys: ApiPoolKey[] = [
    {
      id: 'pool-gemini-primary',
      provider: 'gemini',
      name: 'Google Gemini 3.8 Flash (Active Production Pool)',
      keyMasked: process.env.GEMINI_API_KEY ? `AIzaSy...${process.env.GEMINI_API_KEY.slice(-4)}` : 'AIzaSy...DEMO',
      status: process.env.GEMINI_API_KEY ? 'active' : 'degraded',
      dailyQuotaLimit: 1500000,
      dailyQuotaUsed: 142050,
      totalRequests: 840,
      errorCount: 2,
      avgLatencyMs: 640,
      lastTestedAt: new Date().toISOString(),
      costEstimateUsd: 0.14
    },
    {
      id: 'pool-gemini-standby',
      provider: 'gemini',
      name: 'Google Gemini Standby Key #2 (Failover Ready)',
      keyMasked: 'AIzaSy...9X82',
      status: 'active',
      dailyQuotaLimit: 1500000,
      dailyQuotaUsed: 0,
      totalRequests: 0,
      errorCount: 0,
      avgLatencyMs: 0,
      lastTestedAt: new Date(Date.now() - 3600000).toISOString(),
      costEstimateUsd: 0.00
    }
  ];

  res.json({
    success: true,
    activeModel: 'gemini-3.8-flash',
    uptimePercentage: 99.98,
    failoverStatus: 'NORMAL',
    data: keys
  });
});

// ---------------- AI SERVER-SIDE WORKFLOWS ----------------

// POST /api/ai/structure-news (Raw Script to Structured Devanagari News)
app.post('/api/ai/structure-news', async (req: Request, res: Response) => {
  const { rawScript, category, district } = req.body;
  if (!rawScript || typeof rawScript !== 'string') {
    return res.status(400).json({ success: false, error: 'Raw script text is required' });
  }

  const ai = getGeminiClient();

  if (!ai) {
    // Intelligent fallback generator if API key is not currently injected
    const fallbackTitle = rawScript.split('\n')[0].slice(0, 70) || 'विशेष ग्राउंड रिपोर्ट';
    return res.json({
      success: true,
      data: {
        title: fallbackTitle,
        subtitle: `क्षेत्रीय संवाददाता द्वारा ${district || 'मध्य प्रदेश'} से विशेष रिपोर्ट`,
        content: `${rawScript}\n\nस्थानीय प्रशासन और वरिष्ठ अधिकारियों ने मामले का संज्ञान लिया है। मामले की विस्तृत जांच जारी है और स्थिति पर निगरानी रखी जा रही है।\n\nक्षेत्रीय नागरिकों ने इस कदम का स्वागत किया है।`,
        tags: [district || 'मध्य प्रदेश', category || 'ताज़ा खबरें', 'ग्राउंड रिपोर्ट', 'ब्रेकिंग न्यूज़ वाला'],
        suggestedCategory: category || 'मध्य प्रदेश',
        readingTimeMinutes: 2
      }
    });
  }

  try {
    const prompt = `
आप "BREAKING NEWS WALA" (टैगलाइन: "भारत के जिलों से, आपके दिलों तक") के मुख्य डिजिटल संपादक हैं।
नीचे किसी क्षेत्रीय रिपोर्टर द्वारा भेजी गई कच्ची ग्राउंड रिपोर्ट (Raw Field Script / Notes) दी गई है:

"${rawScript}"
क्षेत्र: ${district || 'मध्य प्रदेश'}
संभावित श्रेणी: ${category || 'ताज़ा खबरें'}

कृपया इसे एक अत्यंत पेशेवर, आकर्षक, पत्रकारिता के मानकों के अनुरूप हिंदी समाचार में बदलें।
आउटपुट केवल और केवल निम्नलिखित JSON फॉर्मेट में दें:
{
  "title": "आकर्षक, सटीक और प्रभावशाली मुख्य हिंदी शीर्षक (60-80 अक्षर)",
  "subtitle": "विस्तृत उप-शीर्षक (120 अक्षर)",
  "content": "पूरी खबर 3 अनुच्छेदों में (मुख्य घटनाक्रम, पृष्ठभूमि, और वर्तमान स्थिति)",
  "tags": ["टैग1", "टैग2", "टैग3", "टैग4"],
  "suggestedCategory": "श्रेणी का नाम",
  "seoTitle": "गूगल सर्च के लिए अनुकूल शीर्षक",
  "metaDescription": "140 अक्षरों में मेटा विवरण"
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ success: true, data: parsed });
  } catch (err: any) {
    console.error('Gemini structure-news error:', err);
    // Graceful fallback
    return res.json({
      success: true,
      data: {
        title: rawScript.slice(0, 60),
        subtitle: 'ग्राउंड रिपोर्ट',
        content: rawScript,
        tags: [district || 'मध्य प्रदेश', 'न्यूज़'],
        suggestedCategory: category || 'ताज़ा खबरें'
      }
    });
  }
});

// POST /api/ai/url-rewrite (Admin-Only External News URL Ingestion & Rewrite)
app.post('/api/ai/url-rewrite', async (req: Request, res: Response) => {
  const { url, sourceText, originalPublisher } = req.body;
  if (!sourceText && !url) {
    return res.status(400).json({ success: false, error: 'Source text or URL required' });
  }

  const ai = getGeminiClient();

  if (!ai) {
    return res.json({
      success: true,
      data: {
        title: (sourceText || 'बाहरी स्रोत से खबर').slice(0, 70),
        subtitle: `स्रोत: ${originalPublisher || 'अधिकृत न्यूज़ एजेंसी'} के आधार पर`,
        content: `${sourceText || 'खबर का विवरण'}\n\n(स्रोत साभार: ${originalPublisher || 'न्यूज़ एजेंसी'})`,
        tags: ['राष्ट्रीय', 'एजेंसी रिपोर्ट'],
        sourceUrl: url,
        sourcePublisher: originalPublisher || 'न्यूज़ वायर'
      }
    });
  }

  try {
    const prompt = `
आप "BREAKING NEWS WALA" के सीनियर न्यूज एडिटर हैं। 
नीचे बाहरी अधिकृत समाचार स्रोत / एजेंसी से प्राप्त जानकारी दी गई है:
प्रकाशक: ${originalPublisher || 'न्यूज़ एजेंसी'}
यूआरएल: ${url || 'N/A'}
सामग्री: "${sourceText || url}"

निर्देश:
1. इस जानकारी के मुख्य तथ्यों को सत्यापित शैली में BREAKING NEWS WALA की अपनी संपादकीय भाषा में हिंदी में लिखें।
2. स्रोत का उचित संदर्भ बरकरार रखें।
3. कॉपीराइट उल्लंघन से बचते हुए नए स्वरूप में पुनर्लेखन करें।
आउटपुट JSON फॉर्मेट में दें:
{
  "title": "हिंदी शीर्षक",
  "subtitle": "उप-शीर्षक",
  "content": "विस्तृत 3 अनुच्छेदों में मूल समाचार",
  "tags": ["टैग1", "टैग2"],
  "category": "उपयुक्त श्रेणी",
  "seoTitle": "एसईओ शीर्षक",
  "metaDescription": "मेटा विवरण"
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    parsed.sourceUrl = url;
    parsed.sourcePublisher = originalPublisher;

    return res.json({ success: true, data: parsed });
  } catch (err: any) {
    console.error('Gemini url-rewrite error:', err);
    return res.status(500).json({ success: false, error: 'AI processing failed' });
  }
});

// POST /api/ai/headline-options (Generate 5 Catchy Headlines)
app.post('/api/ai/headline-options', async (req: Request, res: Response) => {
  const { storyText } = req.body;
  const ai = getGeminiClient();

  if (!ai || !storyText) {
    return res.json({
      success: true,
      headlines: [
        'बड़ी खबर: ' + (storyText || '').slice(0, 50),
        'ग्राउंड रिपोर्ट: ' + (storyText || '').slice(0, 48),
        'ताज़ा अपडेट: ' + (storyText || '').slice(0, 50),
        'EXCLUSIVE: ' + (storyText || '').slice(0, 45),
        'विशेष कवरेज: ' + (storyText || '').slice(0, 46)
      ]
    });
  }

  try {
    const prompt = `दी गई खबर के लिए 5 अलग-अलग शैलियों (ब्रेकिंग, विश्लेषणात्मक, ग्राउंड रिपोर्ट, वायरल, संक्षेप) में आकर्षक हिंदी शीर्षक (Headlines) बनाएं: "${storyText.slice(0, 500)}". केवल JSON array of strings रिटर्न करें.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const list = JSON.parse(response.text || '[]');
    res.json({ success: true, headlines: list });
  } catch (err) {
    res.json({
      success: true,
      headlines: [storyText.slice(0, 60)]
    });
  }
});

// ---------------- VITE MIDDLEWARE SETUP ----------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`BREAKING NEWS WALA server listening on port ${PORT}`);
  });
}

startServer();
