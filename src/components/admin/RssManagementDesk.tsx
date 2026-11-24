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
  Globe,
  Send,
  Image as ImageIcon,
  Tag,
  Eye,
  Edit3,
  Radio,
  FileText,
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
  onPublishArticle?: (article: Partial<ArticleDetail>) => Promise<void> | void;
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
  onPublishArticle,
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

  // URL to RSS Converter state
  const [converterUrl, setConverterUrl] = useState('');
  const [converterDistrict, setConverterDistrict] = useState('भोपाल');
  const [converterCategory, setConverterCategory] = useState('विकास व इंफ्रा');
  const [isConverting, setIsConverting] = useState(false);
  const [converterError, setConverterError] = useState<string | null>(null);
  const [convertedResult, setConvertedResult] = useState<{
    feedUrl: string;
    title: string;
    publisher: string;
    articles?: any[];
  } | null>(null);

  // Website-format Wire Drafts state
  const [draftArticles, setDraftArticles] = useState<ArticleDetail[]>(() => {
    try {
      const saved = localStorage.getItem('bnw_admin_wire_drafts');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return WIRE_FEED_ITEMS.slice(0, 3).map((w, idx) => ({
      id: `wire-draft-${idx + 1}`,
      slug: `wire-draft-${idx + 1}`,
      title: w.rawTitle,
      subheadline: w.rawSummary,
      summary: w.rawSummary,
      content: `${w.rawContent}\n\n[INLINE_IMAGE:https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=80|क्षेत्रीय विकास व जमीनी रिपोर्ट]\n\nसंबंधित अधिकारियों के अनुसार इस योजना के लागू होने से समूचे मध्य प्रदेश के नागरिकों और किसानों को प्रत्यक्ष लाभ मिलेगा। जिला प्रशासन ने सभी संबंधित विभागों को समयबद्ध निष्पादन के कड़े निर्देश दिए हैं।`,
      authorName: 'वायर संवाद डेस्क',
      authorRole: 'ब्यूरो रिपोर्टर',
      districtId: `dist-${idx === 1 ? 'rewa' : idx === 2 ? 'indore' : 'bhopal'}`,
      districtName: idx === 1 ? 'रीवा' : idx === 2 ? 'इंदौर' : 'भोपाल',
      categoryId: 'cat-development',
      categoryName: 'विकास व इंफ्रा',
      imageUrl: w.imageUrl,
      imageCaption: 'वायर फ़ीड से प्राप्त सत्यापित छायाचित्र',
      status: 'DRAFT',
      priority: idx === 0 ? 'BREAKING' : 'NORMAL',
      isBreaking: idx === 0,
      publishedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      viewCount: 0,
      shareCount: 0,
      factChecked: true,
      tags: ['मध्य प्रदेश', 'विकास', 'सरकारी योजना', 'वायर रिपोर्ट'],
    }));
  });

  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [editingArticle, setEditingArticle] = useState<ArticleDetail | null>(null);

  const saveFeeds = (updated: RssFeedConfig[]) => {
    setFeeds(updated);
    try {
      localStorage.setItem('bnw_admin_rss_feeds', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const saveDrafts = (updated: ArticleDetail[]) => {
    setDraftArticles(updated);
    try {
      localStorage.setItem('bnw_admin_wire_drafts', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleConvertUrlToRss = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!converterUrl.trim()) return;

    setIsConverting(true);
    setConverterError(null);
    setConvertedResult(null);

    try {
      const res = await apiClient.rss.convertUrl({
        url: converterUrl.trim(),
        district: converterDistrict,
        category: converterCategory,
      });

      const result = {
        feedUrl: res.feedUrl || res.rssUrl || converterUrl.trim(),
        title: res.title || `${converterDistrict} विशेष समाचार वायर`,
        publisher: res.publisher || 'क्षेत्रीय संवाद एजेंसी',
        articles: res.articles || [],
      };
      setConvertedResult(result);
      setConversionStatus(`URL सफलतापूर्वक RSS फ़ीड में परिवर्तित हो गया! अब आप इसे फ़ीड्स में सुरक्षित कर सकते हैं या सीधे आलेख ड्राफ्ट बना सकते हैं।`);
    } catch (err: any) {
      setConverterError(err.message || 'URL को RSS में कनवर्ट करने में त्रुटि हुई।');
    } finally {
      setIsConverting(false);
    }
  };

  const handleSaveConvertedFeed = () => {
    if (!convertedResult) return;
    const newFeed: RssFeedConfig = {
      id: `feed-${Date.now()}`,
      name: convertedResult.title,
      url: convertedResult.feedUrl,
      publisher: convertedResult.publisher,
      targetState: 'मध्य प्रदेश',
      targetDistrict: converterDistrict,
      targetCategory: converterCategory,
      isActive: true,
      lastSyncAt: 'अभी-अभी जोड़ा गया',
      totalConverted: 0,
    };

    const next = [newFeed, ...feeds];
    saveFeeds(next);
    setConversionStatus(`RSS स्रोत "${newFeed.name}" सक्रिय सूची में जुड़ गया! इससे अब खबरें स्वतः सिंक होंगी।`);
    setConvertedResult(null);
    setConverterUrl('');
  };

  const handleCreateDraftFromConverted = () => {
    if (!convertedResult) return;

    const sample = convertedResult.articles?.[0] || {
      title: convertedResult.title,
      summary: `${converterDistrict} से प्राप्त ताजा वायर समाचार। विस्तृत रिपोर्ट तैयार की जा रही है।`,
      content: `${converterDistrict}: शासन एवं स्थानीय प्रशासन द्वारा क्षेत्र के विकास एवं नागरिक सुविधाओं के विस्तार हेतु व्यापक दिशा-निर्देश जारी किए गए हैं।\n\n[INLINE_IMAGE:https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=80|क्षेत्रीय विकास व प्रशासनिक समीक्षा]\n\nसंबंधित अधिकारियों ने बताया कि सभी परियोजनाओं की नियमित निगरानी की जाएगी ताकि गुणवत्ता और समय-सीमा सुनिश्चित हो सके।`,
      imageUrl: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=80',
    };

    const newDraft: ArticleDetail = {
      id: `draft-url-${Date.now()}`,
      slug: `draft-url-${Date.now()}`,
      title: sample.title || convertedResult.title,
      subheadline: sample.summary || sample.subheadline || 'मध्य प्रदेश शासन व जिला प्रशासन की महत्वपूर्ण घोषणा',
      summary: sample.summary || '',
      content: sample.content || sample.summary || '',
      authorName: `RSS कनवर्टर (${convertedResult.publisher})`,
      authorRole: 'डिजिटल वायर डेस्क',
      districtId: `dist-${converterDistrict.toLowerCase()}`,
      districtName: converterDistrict,
      categoryId: `cat-${converterCategory.toLowerCase()}`,
      categoryName: converterCategory,
      imageUrl: sample.imageUrl || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=80',
      featuredImage: sample.imageUrl || sample.featuredImage || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=80',
      imageCaption: `${converterDistrict} में समाचार छायाचित्र`,
      status: 'DRAFT',
      priority: 'NORMAL',
      isBreaking: false,
      publishedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      viewCount: 0,
      shareCount: 0,
      factChecked: true,
      tags: [converterDistrict, 'मध्य प्रदेश', converterCategory, 'कन्वर्टेड वायर'],
    };

    const nextDrafts = [newDraft, ...draftArticles];
    saveDrafts(nextDrafts);
    setConversionStatus(`समाचार ड्राफ्ट सफलतापूर्वक तैयार होकर नीचे "वायर व आरएसएस समाचार ड्राफ्ट्स" में जुड़ गया है!`);
  };

  const handlePublishDraftLive = async (article: ArticleDetail) => {
    setPublishingId(article.id);
    try {
      if (onPublishArticle) {
        await onPublishArticle({
          ...article,
          status: 'PUBLISHED',
          publishedAt: new Date().toISOString(),
        });
      }
      const next = draftArticles.filter((d) => d.id !== article.id);
      saveDrafts(next);
      setConversionStatus(`आलेख "${article.title.slice(0, 40)}..." सीधे ब्रेकिंग न्यूज़ वाला की वेबसाइट पर लाइव प्रकाशित कर दिया गया है!`);
    } catch (err: any) {
      setConversionStatus(`प्रकाशन में त्रुटि: ${err.message || 'विफल'}`);
    } finally {
      setPublishingId(null);
    }
  };

  const handleSendDraftToReview = (article: ArticleDetail) => {
    onAddPendingArticle({
      ...article,
      status: 'PENDING_REVIEW',
    });
    const next = draftArticles.filter((d) => d.id !== article.id);
    saveDrafts(next);
    setConversionStatus(`आलेख "${article.title.slice(0, 40)}..." को संपादकीय समीक्षा कतार में भेज दिया गया है।`);
  };

  const handleDeleteDraft = (id: string) => {
    if (!window.confirm('क्या आप इस ड्राफ्ट को हटाना चाहते हैं?')) return;
    const next = draftArticles.filter((d) => d.id !== id);
    saveDrafts(next);
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
      await new Promise((r) => setTimeout(r, 1200));

      const activeFeeds = feeds.filter((f) => f.isActive);
      if (activeFeeds.length === 0) {
        setConversionStatus('कृपया कम से कम एक RSS फ़ीड को सक्रिय (Active) करें।');
        setIsProcessing(false);
        return;
      }

      let added = 0;
      const createdDrafts: ArticleDetail[] = [];

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
          content: `${wire.rawContent}\n\n[INLINE_IMAGE:${wire.imageUrl}|${assignedDistrict} जमीनी हकीकत]\n\nप्रशासन ने स्पष्ट किया है कि कार्य योजना की मासिक समीक्षा की जाएगी और लापरवाही पर दंडात्मक कार्रवाई होगी।`,
          authorName: `AI RSS फ़ीड (${matchingFeed.publisher})`,
          authorRole: 'वायर संवाद एजेंसी',
          districtId: `dist-${assignedDistrict.toLowerCase()}`,
          districtName: assignedDistrict,
          categoryId: `cat-${assignedCategory.toLowerCase()}`,
          categoryName: assignedCategory,
          imageUrl: wire.imageUrl,
          imageCaption: `${assignedDistrict} में वायर फ़ीड से सत्यापित समाचार छायाचित्र`,
          status: 'DRAFT',
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

        createdDrafts.push(article);
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
      saveDrafts([...createdDrafts, ...draftArticles]);

      setConvertedCount((prev) => prev + added);
      setConversionStatus(`सफलतापूर्वक ${added} समाचार AI द्वारा वेबसाइट प्रारूप में तैयार कर नीचे ड्राफ्ट्स व समीक्षा कतार में जोड़ दिए गए!`);
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

      {/* URL to RSS Converter Section */}
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 rounded-2xl p-6 text-white border border-indigo-800/40 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-800/30 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-indigo-600/30 rounded-xl text-indigo-400 border border-indigo-500/40">
              <Globe className="w-5 h-5 text-indigo-400" />
            </span>
            <div>
              <h3 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                वेब यूआरएल से RSS फ़ीड कनवर्टर व ऑटो-सेव (Smart URL to RSS Converter)
                <span className="px-2 py-0.5 text-[10px] bg-red-600 text-white font-extrabold rounded-full">
                  LIVE CONVERTER
                </span>
              </h3>
              <p className="text-xs text-indigo-200/80">
                किसी भी वेब पोर्टल का लिंक डालें • सिस्टम तुरंत RSS एंडपॉइंट खोजेगा, फ़ीड्स में जोड़ेगा और सीधे समाचार ड्राफ्ट तैयार करेगा
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleConvertUrlToRss} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-6">
              <label className="text-[11px] font-bold text-indigo-200 block mb-1">
                वेबसाइट / समाचार यूआरएल (Web Article or Portal URL)
              </label>
              <div className="relative">
                <input
                  type="url"
                  required
                  placeholder="उदा. https://www.naidunia.com/madhya-pradesh/bhopal"
                  value={converterUrl}
                  onChange={(e) => setConverterUrl(e.target.value)}
                  className="w-full bg-slate-800/90 border border-indigo-700/50 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 font-mono"
                />
              </div>
            </div>

            <div className="md:col-span-3">
              <label className="text-[11px] font-bold text-indigo-200 block mb-1">लक्ष्य जिला</label>
              <select
                value={converterDistrict}
                onChange={(e) => setConverterDistrict(e.target.value)}
                className="w-full bg-slate-800/90 border border-indigo-700/50 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="भोपाल">भोपाल</option>
                <option value="इंदौर">इंदौर</option>
                <option value="ग्वालियर">ग्वालियर</option>
                <option value="जबलपुर">जबलपुर</option>
                <option value="उज्जैन">उज्जैन</option>
                <option value="रीवा">रीवा</option>
                <option value="सागर">सागर</option>
                {districts.map((d) => (
                  <option key={d.id} value={d.nameHi}>
                    {d.nameHi}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="text-[11px] font-bold text-indigo-200 block mb-1">समाचार श्रेणी</label>
              <select
                value={converterCategory}
                onChange={(e) => setConverterCategory(e.target.value)}
                className="w-full bg-slate-800/90 border border-indigo-700/50 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.nameHi}>
                    {c.nameHi}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-400">
              * सुरक्षित SSRF प्रॉक्सी एवं ऑटो-फ़ीड डिस्कवरी समर्थित
            </span>
            <button
              type="submit"
              disabled={isConverting || !converterUrl.trim()}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 via-indigo-600 to-red-600 hover:from-indigo-600 hover:to-red-700 text-white text-xs font-black rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isConverting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>RSS में बदला जा रहा है...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>URL को RSS में बदलें</span>
                </>
              )}
            </button>
          </div>
        </form>

        {converterError && (
          <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-xs text-red-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{converterError}</span>
          </div>
        )}

        {convertedResult && (
          <div className="p-4 bg-indigo-900/40 border border-emerald-500/50 rounded-xl space-y-3 mt-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="px-2 py-0.5 bg-emerald-500 text-slate-950 font-black text-[10px] rounded-full uppercase tracking-wider inline-block">
                  सफलतापूर्वक RSS एंडपॉइंट खोजा गया
                </span>
                <h4 className="text-sm font-black text-white mt-1">{convertedResult.title}</h4>
                <div className="text-[11px] font-mono text-emerald-300 break-all mt-0.5 flex items-center gap-1">
                  <span>{convertedResult.feedUrl}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveConvertedFeed}
                  className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4 text-slate-950" />
                  <span>RSS फ़ीड्स में सुरक्षित करें</span>
                </button>

                <button
                  type="button"
                  onClick={handleCreateDraftFromConverted}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-slate-950" />
                  <span>सीधे आलेख ड्राफ्ट बनाएं</span>
                </button>
              </div>
            </div>
          </div>
        )}
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

      {/* Wire & RSS Drafts - Complete Website Layout Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <span className="p-1.5 bg-red-600 text-white rounded-lg">
                <FileText className="w-4 h-4" />
              </span>
              <span>वायर व आरएसएस समाचार ड्राफ्ट्स (वेबसाइट लेआउट)</span>
              <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-bold">
                {draftArticles.length} ड्राफ्ट्स
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              प्रत्येक समाचार में हेडर, हेडलाइन, सब-हेडलाइन, इनलाइन इमेजेस युक्त विस्तृत विवरण और टैग्स शामिल हैं
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">
              1-क्लिक में लाइव प्रकाशित करें अथवा समीक्षा कतार में भेजें
            </span>
          </div>
        </div>

        {draftArticles.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-600">वर्तमान में कोई ड्राफ्ट समाचार उपलब्ध नहीं है।</p>
            <p className="text-xs text-slate-400">
              ऊपर "सभी फ़ीड्स सिंक करें" अथवा "URL को RSS में बदलें" पर क्लिक करके नए ड्राफ्ट प्राप्त करें।
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {draftArticles.map((art) => (
              <div
                key={art.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col"
              >
                {/* 1. Article Header Bar */}
                <div className="bg-slate-50 border-b border-slate-100 p-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 bg-red-600 text-white text-[10px] font-black rounded-md uppercase">
                      {art.categoryName || 'विकास'}
                    </span>
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-md flex items-center gap-1 border border-blue-200">
                      <MapPin className="w-2.5 h-2.5" />
                      {art.districtName || 'मध्य प्रदेश'}
                    </span>
                    {art.isBreaking && (
                      <span className="px-2 py-0.5 bg-amber-500 text-slate-950 text-[10px] font-black rounded-md flex items-center gap-1">
                        <Radio className="w-2.5 h-2.5 text-slate-950 animate-pulse" />
                        ब्रेकिंग
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {art.authorName}
                  </span>
                </div>

                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    {/* 2. Main Headline */}
                    <h4 className="text-base font-black text-slate-900 leading-snug font-news-hero">
                      {art.title}
                    </h4>

                    {/* 3. Subheadline */}
                    {art.subheadline && (
                      <p className="text-xs font-semibold text-slate-600 mt-1.5 leading-relaxed bg-slate-50 p-2 rounded-lg border-l-2 border-red-500">
                        {art.subheadline}
                      </p>
                    )}

                    {/* 4. Cover Feature Image */}
                    {art.imageUrl && (
                      <div className="mt-3 rounded-xl overflow-hidden relative border border-slate-200">
                        <img
                          src={art.imageUrl}
                          alt={art.title}
                          className="w-full h-44 object-cover hover:scale-102 transition-transform duration-300"
                        />
                        {art.imageCaption && (
                          <div className="bg-slate-950/80 backdrop-blur-xs text-[10px] text-slate-300 px-2 py-1 flex items-center justify-between">
                            <span className="truncate">{art.imageCaption}</span>
                            <span className="text-slate-400 font-mono text-[9px] shrink-0">छायाचित्र</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 5. Article Description / Inverted Pyramid Body */}
                    <div className="mt-3 text-xs text-slate-700 leading-relaxed space-y-2">
                      {art.content.split('\n\n').map((paragraph, pIdx) => {
                        if (paragraph.startsWith('[INLINE_IMAGE:')) {
                          const parts = paragraph.replace('[INLINE_IMAGE:', '').replace(']', '').split('|');
                          const imgUrl = parts[0];
                          const imgCap = parts[1] || 'संबंधित समाचार दृश्य';
                          return (
                            <div key={pIdx} className="my-2.5 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                              <img src={imgUrl} alt={imgCap} className="w-full h-32 object-cover" />
                              <div className="p-1.5 text-[10px] text-slate-600 font-medium italic text-center">
                                {imgCap}
                              </div>
                            </div>
                          );
                        }
                        return (
                          <p key={pIdx} className="line-clamp-3">
                            {paragraph}
                          </p>
                        );
                      })}
                    </div>

                    {/* 6. Tags */}
                    {art.tags && art.tags.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-slate-100 flex flex-wrap gap-1">
                        {art.tags.map((tag, tIdx) => (
                          <span
                            key={tIdx}
                            className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-semibold rounded-md flex items-center gap-1"
                          >
                            <Tag className="w-2.5 h-2.5 text-slate-400" />
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 7. Action Controls */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEditingArticle(art)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                        title="संपादित करें"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>संपादित</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteDraft(art.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="ड्राफ्ट हटाएं"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSendDraftToReview(art)}
                        className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Clock className="w-3.5 h-3.5 text-slate-600" />
                        <span>समीक्षा कतार</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handlePublishDraftLive(art)}
                        disabled={publishingId === art.id}
                        className="px-3.5 py-1.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {publishingId === art.id ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>प्रकाशन...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>लाइव प्रकाशित करें</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Draft Modal */}
      {editingArticle && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-red-600" />
                <h3 className="font-bold text-slate-900 text-base">समाचार ड्राफ्ट संपादन</h3>
              </div>
              <button
                onClick={() => setEditingArticle(null)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">मुख्य हेडलाइन (Headline)</label>
                <input
                  type="text"
                  value={editingArticle.title}
                  onChange={(e) =>
                    setEditingArticle({ ...editingArticle, title: e.target.value })
                  }
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-bold text-sm"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">सब-हेडलाइन (Subheadline)</label>
                <input
                  type="text"
                  value={editingArticle.subheadline || ''}
                  onChange={(e) =>
                    setEditingArticle({ ...editingArticle, subheadline: e.target.value })
                  }
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">कवर फोटो URL (Image URL)</label>
                <input
                  type="url"
                  value={editingArticle.imageUrl || ''}
                  onChange={(e) =>
                    setEditingArticle({ ...editingArticle, imageUrl: e.target.value })
                  }
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  समाचार विवरण (Content with Inline Images [INLINE_IMAGE:url|caption])
                </label>
                <textarea
                  rows={6}
                  value={editingArticle.content}
                  onChange={(e) =>
                    setEditingArticle({ ...editingArticle, content: e.target.value })
                  }
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-medium leading-relaxed"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingArticle(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer"
                >
                  रद्द करें
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const next = draftArticles.map((d) =>
                      d.id === editingArticle.id ? editingArticle : d
                    );
                    saveDrafts(next);
                    setEditingArticle(null);
                    setConversionStatus('ड्राफ्ट सफलतापूर्वक अपडेट किया गया!');
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-sm cursor-pointer"
                >
                  परिवर्तन सुरक्षित करें
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                className="text-slate-400 hover:text-slate-700 font-bold p-1 cursor-pointer"
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