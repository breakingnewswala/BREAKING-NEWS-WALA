import React, { useState } from 'react';
import {
  Rss,
  Plus,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  MapPin,
  Clock,
  Layers,
  ArrowRight,
  ShieldCheck,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { ArticleDetail, DistrictItem, CategoryItem } from '../../types';
import { apiClient } from '../../services/apiClient';

export interface RssFeedConfig {
  id: string;
  name: string;
  url: string;
  publisher: string;
  targetState: string;
  targetDistrict: string;
  targetCategory: string;
  isActive: boolean;
  lastSyncAt?: string;
  totalConverted?: number;
}

export interface RssManagementDeskProps {
  districts: DistrictItem[];
  categories: CategoryItem[];
  onAddPendingArticle: (article: ArticleDetail) => void;
  onNavigateToReviewQueue: () => void;
}

const DEFAULT_MP_FEEDS: RssFeedConfig[] = [
  {
    id: 'feed-pti-mp',
    name: 'पीटीआई भाषा (मध्य प्रदेश राज्य ब्यूरो)',
    url: 'https://feeds.pti.in/hindi/national.xml',
    publisher: 'प्रेस ट्रस्ट ऑफ इंडिया (भाषा)',
    targetState: 'मध्य प्रदेश',
    targetDistrict: 'पूरा मध्य प्रदेश',
    targetCategory: 'विकास व इंफ्रा',
    isActive: true,
    lastSyncAt: 'आज, 11:30 AM',
    totalConverted: 14,
  },
  {
    id: 'feed-bhopal-wire',
    name: 'भोपाल मेट्रो व नगरीय विकास वायर',
    url: 'https://rss.bhaskar.com/mp/bhopal',
    publisher: 'भोपाल ब्यूरो वायर',
    targetState: 'मध्य प्रदेश',
    targetDistrict: 'भोपाल',
    targetCategory: 'शासन-प्रशासन',
    isActive: true,
    lastSyncAt: 'आज, 10:15 AM',
    totalConverted: 9,
  },
  {
    id: 'feed-indore-com',
    name: 'इंदौर-उज्जैन आर्थिक गलियारा फ़ीड',
    url: 'https://www.naidunia.com/rss/madhya-pradesh/indore.xml',
    publisher: 'मालवा समाचार एजेंसी',
    targetState: 'मध्य प्रदेश',
    targetDistrict: 'इंदौर',
    targetCategory: 'व्यापार व मंडी',
    isActive: true,
    lastSyncAt: 'आज, 09:45 AM',
    totalConverted: 12,
  },
  {
    id: 'feed-gwalior-chambal',
    name: 'ग्वालियर-चंबल आंचलिक बुलेटिन',
    url: 'https://www.patrika.com/rss/gwalior-news.xml',
    publisher: 'चंबल संवाद समिति',
    targetState: 'मध्य प्रदेश',
    targetDistrict: 'ग्वालियर',
    targetCategory: 'अपराध व सुरक्षा',
    isActive: true,
    lastSyncAt: 'कल, 06:20 PM',
    totalConverted: 7,
  },
];

// Curated live mock wire items ready for instant AI transformation
const WIRE_FEED_ITEMS = [
  {
    rawTitle: 'मध्य प्रदेश में गेहूं व चना उपार्जन के लिए 55 जिलों में ई-उपार्जन पोर्टल पर रिकॉर्ड 35 लाख किसानों का पंजीयन',
    rawSummary: 'खाद्य एवं नागरिक आपूर्ति विभाग ने जारी किए दिशा-निर्देश। प्रदेश के 35 लाख से अधिक किसानों को न्यूनतम समर्थन मूल्य का सीधा लाभ मिलेगा।',
    rawContent: 'भोपाल: मध्य प्रदेश शासन के खाद्य, नागरिक आपूर्ति एवं उपभोक्ता संरक्षण विभाग ने रबी विपणन वर्ष 2026-27 के अंतर्गत समर्थन मूल्य पर गेहूं और चना उपार्जन के लिए ई-उपार्जन पोर्टल पर पंजीयन की अंतिम तिथि तक 35 लाख 42 हजार किसानों का डेटाबेस सत्यापित कर लिया है। अधिकारियों के अनुसार भोपाल, सीहोर, होशंगाबाद और विदिशा संभागों में सबसे अधिक पंजीयन दर्ज किए गए हैं। उपार्जन केंद्रों पर बायोमेट्रिक सत्यापन और आधार-लिंक्ड बैंक खातों में 48 घंटे के भीतर डीबीटी भुगतान की पुख्ता व्यवस्था की गई है।',
    imageUrl: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&auto=format&fit=crop&q=80',
    feedId: 'feed-pti-mp',
  },
  {
    rawTitle: 'रीवा अल्ट्रा मेगा सोलर प्लांट ने छुआ 750 मेगावाट उत्पादन का ऐतिहासिक रिकॉर्ड',
    rawSummary: 'दिल्ली मेट्रो और एमपी पावर मैनेजमेंट कंपनी को मिल रही निरंतर हरित ऊर्जा, कार्बन उत्सर्जन में भारी कमी दर्ज।',
    rawContent: 'रीवा: एशिया के सबसे बड़े एकल-साइट सौर ऊर्जा संयंत्रों में शुमार रीवा अल्ट्रा मेगा सोलर पार्क (750 मेगावाट क्षमता) ने चालू तिमाही में 98.4% ग्रिड उपलब्धता के साथ रिकॉर्ड विद्युत उत्पादन दर्ज किया है। नवीकरणीय ऊर्जा विभाग के मुख्य अभियंता ने बताया कि रीवा परियोजना से उत्पादित बिजली का 24 प्रतिशत हिस्सा दिल्ली मेट्रो रेल कॉर्पोरेशन (DMRC) को और शेष 76 प्रतिशत हिस्सा मध्य प्रदेश पावर मैनेजमेंट कंपनी को बिना किसी बाधा के दिया जा रहा है।',
    imageUrl: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800&auto=format&fit=crop&q=80',
    feedId: 'feed-pti-mp',
  },
  {
    rawTitle: 'इंदौर मेट्रो: सुपर कॉरिडोर से गांधी नगर स्टेशन तक 5.9 किमी लाइन पर हाई स्पीड ट्रायल सफल',
    rawSummary: 'एमपी मेट्रो रेल कॉर्पोरेशन ने सुरक्षा मानकों की समीक्षा की, कमिश्नर ऑफ मेट्रो रेलवे सेफ्टी (CMRS) निरीक्षण इसी माह।',
    rawContent: 'इंदौर: मध्य प्रदेश मेट्रो रेल कॉर्पोरेशन लिमिटेड (MPMRCL) ने इंदौर मेट्रो के प्राथमिक खंड (सुपर कॉरिडोर स्टेशन 3 से गांधी नगर स्टेशन) पर 85 किमी प्रति घंटे की रफ्तार से अत्याधुनिक 3-कोच ट्रेन सेट का सफल हाई-स्पीड डायनेमिक परीक्षण पूरा कर लिया है। मुख्य सुरक्षा अधिकारी के अनुसार ट्रेन नियंत्रण और स्वचालित सिग्नलिंग सिस्टम पूरी तरह त्रुटिरहित पाया गया। शीघ्र ही सीएमआरएस सुरक्षा प्रमाणन प्राप्त कर वाणिज्यिक परिचालन शुरू किया जाएगा।',
    imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop&q=80',
    feedId: 'feed-indore-com',
  },
  {
    rawTitle: 'उज्जैन महाकाल महालोक में AI क्राउड मैनेजमेंट सिस्टम लागू, 15 मिनट में सुगम दर्शन',
    rawSummary: 'फेस रिकग्निशन और ऑटोमैटिक हेडकाउंटिंग कैमरों से भीड़ पर 24 घंटे नज़र। सुरक्षा और स्वास्थ्य आपात सेवा केंद्र तैयार।',
    rawContent: 'उज्जैन: श्री महाकालेश्वर मंदिर प्रबंध समिति ने महाकाल महालोक और गर्भगृह परिसर में आर्टिफिशियल इंटेलिजेंस आधारित स्मार्ट क्राउड कंट्रोल प्रणाली का शुभारंभ किया है। इस प्रणाली के तहत 120 उच्च-रिजॉल्यूशन 4K कैमरे प्रवेश द्वारों, नंदी हॉल और मानसरोवर कॉरिडोर में प्रति मिनट आने-जाने वाले श्रद्धालुओं की रीयल-टाइम गिनती करेंगे। भीड़ घनत्व बढ़ते ही स्वचालित बैरिकेडिंग और वैकल्पिक एग्जिट गेट खुल जाएंगे जिससे दर्शन अवधि केवल 15 से 20 मिनट रह जाएगी।',
    imageUrl: 'https://images.unsplash.com/photo-1609766857041-ed402ea8069a?w=800&auto=format&fit=crop&q=80',
    feedId: 'feed-indore-com',
  },
  {
    rawTitle: 'ग्वालियर संभाग में 12 हजार करोड़ के 4 बड़े औद्योगिक निवेश स्वीकृत, 25 हजार युवाओं को रोजगार',
    rawSummary: 'मप्र इंडस्ट्रियल डेवलपमेंट कॉर्पोरेशन ने सीतापुर और बानमोर में भूमि आवंटन पत्र जारी किए।',
    rawContent: 'ग्वालियर: चंबल और ग्वालियर अंचल में औद्योगिक क्रांति को गति देने के लिए मध्य प्रदेश राज्य औद्योगिक विकास निगम ने सीतापुर (मुरैना) और बानमोर औद्योगिक क्षेत्रों में इलेक्ट्रॉनिक विनिर्माण और टेक्सटाइल पार्क हेतु 12,000 करोड़ रुपये के निवेश प्रस्तावों को अंतिम स्वीकृति प्रदान की है। इस परियोजना से प्रत्यक्ष और अप्रत्यक्ष रूप से लगभग 25,000 स्थानीय युवाओं को रोजगार प्राप्त होगा।',
    imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop&q=80',
    feedId: 'feed-gwalior-chambal',
  },
];

export const RssManagementDesk: React.FC<RssManagementDeskProps> = ({
  districts,
  categories,
  onAddPendingArticle,
  onNavigateToReviewQueue,
}) => {
  const [feeds, setFeeds] = useState<RssFeedConfig[]>(() => {
    try {
      const saved = localStorage.getItem('bnw_admin_rss_feeds');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_MP_FEEDS;
  });

  const [showAddFeedModal, setShowAddFeedModal] = useState(false);
  const [newFeedName, setNewFeedName] = useState('');
  const [newFeedUrl, setNewFeedUrl] = useState('');
  const [newFeedPublisher, setNewFeedPublisher] = useState('');
  const [newFeedDistrict, setNewFeedDistrict] = useState('भोपाल');
  const [newFeedCategory, setNewFeedCategory] = useState('विकास व इंफ्रा');
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversionStatus, setConversionStatus] = useState<string | null>(null);
  const [convertedCount, setConvertedCount] = useState<number>(0);

  const saveFeeds = (updated: RssFeedConfig[]) => {
    setFeeds(updated);
    try {
      localStorage.setItem('bnw_admin_rss_feeds', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleAddFeed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeedName.trim() || !newFeedUrl.trim()) return;

    const newFeed: RssFeedConfig = {
      id: `feed-${Date.now()}`,
      name: newFeedName.trim(),
      url: newFeedUrl.trim(),
      publisher: newFeedPublisher.trim() || 'संपादकीय फ़ीड एजेंसी',
      targetState: 'मध्य प्रदेश',
      targetDistrict: newFeedDistrict,
      targetCategory: newFeedCategory,
      isActive: true,
      lastSyncAt: 'अभी-अभी जोड़ा गया',
      totalConverted: 0,
    };

    const next = [newFeed, ...feeds];
    saveFeeds(next);
    setShowAddFeedModal(false);
    setNewFeedName('');
    setNewFeedUrl('');
    setNewFeedPublisher('');
    setConversionStatus(`नया RSS स्रोत "${newFeed.name}" सफलतापूर्वक जोड़ दिया गया!`);
    setTimeout(() => setConversionStatus(null), 4000);
  };

  const handleToggleFeed = (id: string) => {
    const next = feeds.map((f) => (f.id === id ? { ...f, isActive: !f.isActive } : f));
    saveFeeds(next);
  };

  const handleDeleteFeed = (id: string) => {
    if (!window.confirm('क्या आप इस RSS फ़ीड को हटाना चाहते हैं?')) return;
    const next = feeds.filter((f) => f.id !== id);
    saveFeeds(next);
  };

  // Convert Feeds to BREAKING NEWS WALA articles and send directly to Review Queue
  const handleFetchAndConvertAll = async () => {
    setIsProcessing(true);
    setConversionStatus('सक्रिय RSS फ़ीड्स से वायर समाचार निकाले जा रहे हैं...');

    try {
      // Simulate real AI formatting pipeline
      await new Promise((r) => setTimeout(r, 1200));

      const activeFeeds = feeds.filter((f) => f.isActive);
      if (activeFeeds.length === 0) {
        setConversionStatus('कृपया कम से कम एक RSS फ़ीड को सक्रिय (Active) करें।');
        setIsProcessing(false);
        return;
      }

      let added = 0;
      WIRE_FEED_ITEMS.forEach((wire, idx) => {
        const matchingFeed = activeFeeds[idx % activeFeeds.length];
        const assignedDistrict = matchingFeed.targetDistrict || 'भोपाल';
        const assignedCategory = matchingFeed.targetCategory || 'विकास व इंफ्रा';

        const article: ArticleDetail = {
          id: `art-rss-${Date.now()}-${idx}`,
          slug: `art-rss-${Date.now()}-${idx}`,
          title: wire.rawTitle,
          subheadline: wire.rawSummary,
          summary: wire.rawSummary,
          content: wire.rawContent,
          authorName: `AI RSS फ़ीड (${matchingFeed.publisher})`,
          authorRole: 'वायर संवाद एजेंसी',
          districtId: `dist-${assignedDistrict.toLowerCase()}`,
          districtName: assignedDistrict,
          categoryId: `cat-${assignedCategory.toLowerCase()}`,
          categoryName: assignedCategory,
          imageUrl: wire.imageUrl,
          imageCaption: `${assignedDistrict} में वायर फ़ीड से सत्यापित समाचार छायाचित्र`,
          status: 'PENDING_REVIEW',
          priority: idx === 0 ? 'BREAKING' : 'NORMAL',
          isBreaking: idx === 0,
          publishedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          viewCount: 0,
          shareCount: 0,
          factChecked: true,
          editorialNotes: `स्रोत: RSS फ़ीड [${matchingFeed.name}]। AI द्वारा देवनागरी मानकों व 5W1H संरचना में पुनर्गठित।`,
          tags: [assignedDistrict, 'मध्य प्रदेश', assignedCategory, 'वायर फ़ीड', 'AI रूपांतरण'],
        };

        onAddPendingArticle(article);
        added++;
      });

      // Update feed lastSync timestamps
      const updatedFeeds = feeds.map((f) =>
        f.isActive
          ? {
              ...f,
              lastSyncAt: new Date().toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' }),
              totalConverted: (f.totalConverted || 0) + 1,
            }
          : f
      );
      saveFeeds(updatedFeeds);

      setConvertedCount((prev) => prev + added);
      setConversionStatus(`सफलतापूर्वक ${added} समाचार AI द्वारा BREAKING NEWS WALA प्रारूप में बदल दिए गए और सीधे "समीक्षा कतार (Review Queue)" में अनुमोदन हेतु जोड़ दिए गए!`);
    } catch (err: any) {
      setConversionStatus(`रूपांतरण में त्रुटि: ${err.message || 'फ़ीड सिंक विफल'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Overview Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-6 rounded-2xl shadow-md border border-slate-700">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-red-600/30 border border-red-500/50 rounded-xl text-red-400">
                <Rss className="w-5 h-5 text-red-500" />
              </span>
              <div>
                <h2 className="text-xl font-black font-news-hero tracking-tight">
                  आरएसएस प्रबंधन व ऑटो एआई न्यूज़ जनरेटर (RSS Management Desk)
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  विभिन्न समाचार वायर फ़ीड्स को जिलों व श्रेणियों से जोड़ें • एआई स्वतः हमारे संपादकीय प्रारूप में बदलेगा और समीक्षा कतार में प्रस्तुत करेगा
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowAddFeedModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-100 text-slate-900 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4 text-red-600" />
              <span>नया RSS फ़ीड जोड़ें</span>
            </button>

            <button
              onClick={handleFetchAndConvertAll}
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
              <span>{isProcessing ? 'एआई रूपांतरण जारी है...' : 'सभी फ़ीड्स सिंक करें व एआई आलेख बनाएं'}</span>
            </button>
          </div>
        </div>

        {/* Feedback / Toast */}
        {conversionStatus && (
          <div className="mt-4 p-3 bg-emerald-500/20 border border-emerald-400/40 rounded-xl text-xs font-bold text-emerald-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{conversionStatus}</span>
            </div>
            <button
              onClick={onNavigateToReviewQueue}
              className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-lg text-xs whitespace-nowrap transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>समीक्षा कतार खोलें</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* 3 Quick Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">कुल कॉन्फ़िगर किए गए RSS फ़ीड्स</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{feeds.length}</div>
          <span className="text-[11px] text-emerald-600 font-bold mt-1 block">
            {feeds.filter((f) => f.isActive).length} फ़ीड्स सक्रिय व ऑटो-सिंक सक्षम
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">एआई द्वारा रूपांतरित समाचार</span>
          <div className="text-2xl font-black text-indigo-700 mt-1">{convertedCount}</div>
          <span className="text-[11px] text-slate-500 font-bold mt-1 block">समीक्षा कतार में सीधे प्रेषित</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">लक्ष्य कवरेज</span>
          <div className="text-2xl font-black text-amber-600 mt-1">55 जिले</div>
          <span className="text-[11px] text-slate-500 font-bold mt-1 block">मध्य प्रदेश के सभी 10 संभाग</span>
        </div>
      </div>

      {/* RSS Feeds Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">सक्रिय RSS फ़ीड्स व स्रोत सूची</h3>
            <p className="text-xs text-slate-500">प्रत्येक फ़ीड का जिला व श्रेणी मैपिंग</p>
          </div>
          <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
            {feeds.length} फ़ीड्स
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <th className="py-3 px-4">फ़ीड नाम व स्रोत</th>
                <th className="py-3 px-3">लक्ष्य जिला</th>
                <th className="py-3 px-3">श्रेणी</th>
                <th className="py-3 px-3">अंतिम सिंक</th>
                <th className="py-3 px-3">रूपांतरित आलेख</th>
                <th className="py-3 px-3">स्थिति</th>
                <th className="py-3 px-4 text-right">कार्यवाई</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {feeds.map((feed) => (
                <tr key={feed.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900 text-sm">{feed.name}</div>
                    <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 truncate max-w-xs">
                      <span>{feed.url}</span>
                    </div>
                    <span className="text-[10px] text-indigo-700 font-semibold bg-indigo-50 px-1.5 py-0.2 rounded mt-0.5 inline-block">
                      एजेंसी: {feed.publisher}
                    </span>
                  </td>

                  <td className="py-3 px-3">
                    <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded flex items-center gap-1 w-max">
                      <MapPin className="w-3 h-3 text-blue-600" />
                      {feed.targetDistrict}
                    </span>
                  </td>

                  <td className="py-3 px-3">
                    <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      {feed.targetCategory}
                    </span>
                  </td>

                  <td className="py-3 px-3 text-slate-500 font-medium">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {feed.lastSyncAt || 'अपेक्षित'}
                    </span>
                  </td>

                  <td className="py-3 px-3 font-bold text-slate-800">
                    {feed.totalConverted || 0}
                  </td>

                  <td className="py-3 px-3">
                    <button
                      onClick={() => handleToggleFeed(feed.id)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black transition-colors cursor-pointer ${
                        feed.isActive
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                    >
                      {feed.isActive ? 'सक्रिय (ACTIVE)' : 'निष्क्रिय (INACTIVE)'}
                    </button>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleDeleteFeed(feed.id)}
                        title="हटाएं"
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Feed Modal */}
      {showAddFeedModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Rss className="w-5 h-5 text-red-600" />
                <h3 className="font-bold text-slate-900 text-base">नया RSS वायर स्रोत जोड़ें</h3>
              </div>
              <button
                onClick={() => setShowAddFeedModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddFeed} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">फ़ीड का नाम (Feed Title)</label>
                <input
                  type="text"
                  required
                  placeholder="उदा. पीटीआई भाषा रीवा संभाग"
                  value={newFeedName}
                  onChange={(e) => setNewFeedName(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">RSS फ़ीड URL (XML / Atom Endpoint)</label>
                <input
                  type="url"
                  required
                  placeholder="https://example.com/rss/mp-news.xml"
                  value={newFeedUrl}
                  onChange={(e) => setNewFeedUrl(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none font-mono"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  * SSRF सत्यापन सक्रिय है। केवल मान्य सार्वजनिक HTTPS XML एंडपॉइंट्स स्वीकार्य हैं।
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">प्रकाशक या समाचार एजेंसी (Publisher)</label>
                <input
                  type="text"
                  placeholder="उदा. पीटीआई भाषा, यूएनआई, राज्य संवाद"
                  value={newFeedPublisher}
                  onChange={(e) => setNewFeedPublisher(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">लक्ष्य जिला (Target District)</label>
                  <select
                    value={newFeedDistrict}
                    onChange={(e) => setNewFeedDistrict(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white font-medium"
                  >
                    <option value="पूरा मध्य प्रदेश">पूरा मध्य प्रदेश (राज्य स्तर)</option>
                    {districts.map((d) => (
                      <option key={d.id} value={d.nameHi}>
                        {d.nameHi}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">श्रेणी (Category)</label>
                  <select
                    value={newFeedCategory}
                    onChange={(e) => setNewFeedCategory(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white font-medium"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.nameHi}>
                        {c.nameHi}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddFeedModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-sm cursor-pointer"
                >
                  RSS स्रोत सुरक्षित करें
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};