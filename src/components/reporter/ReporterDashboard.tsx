import React, { useState } from 'react';
import { 
  FileText, 
  Send, 
  Sparkles, 
  Image as ImageIcon, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Film, 
  BarChart3, 
  UserCheck, 
  ChevronRight, 
  Download, 
  RefreshCw,
  MapPin,
  Lock,
  MessageSquare
} from 'lucide-react';
import { 
  Article, 
  ReporterProfile, 
  GraphicTemplate, 
  Category 
} from '../../types/index.ts';
import { 
  postNewsArticle, 
  aiStructureNews, 
  aiHeadlineOptions 
} from '../../services/api.ts';

interface ReporterDashboardProps {
  reporters: ReporterProfile[];
  currentReporter: ReporterProfile;
  onChangeReporter: (rep: ReporterProfile) => void;
  articles: Article[];
  categories: Category[];
  templates: GraphicTemplate[];
  onArticleCreated: (newArticle: Article) => void;
}

export const ReporterDashboard: React.FC<ReporterDashboardProps> = ({
  reporters,
  currentReporter,
  onChangeReporter,
  articles,
  categories,
  templates,
  onArticleCreated
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'create' | 'my_stories' | 'graphics' | 'video' | 'assignments' | 'analytics' | 'profile'
  >('create');

  // Story Creation State
  const [creationMode, setCreationMode] = useState<'raw_script' | 'manual'>('raw_script');
  const [rawScript, setRawScript] = useState('');
  const [headline, setHeadline] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categories[2]?.nameHindi || 'मध्य प्रदेश');
  const [selectedDistrict, setSelectedDistrict] = useState(currentReporter.assignedDistricts[0] || 'निवाड़ी (Niwari)');
  const [thumbnailUrl, setThumbnailUrl] = useState('https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=900&auto=format&fit=crop&q=80');
  const [tagsInput, setTagsInput] = useState('निवाड़ी, ग्राउंड रिपोर्ट, ताज़ा खबर');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState('');

  // Graphics Studio State (Reporter)
  const [gfxScript, setGfxScript] = useState('ओरछा रामराजा मंदिर में महाआरती, हजारों की तादाद में पहुंचे श्रद्धालु');
  const [gfxHeadline, setGfxHeadline] = useState('निवाड़ी ओरछा में भव्य महाआरती, उमड़ा जनसैलाब');
  const [gfxDistrict, setGfxDistrict] = useState(currentReporter.assignedDistricts[0] || 'निवाड़ी (Niwari)');
  const [gfxImageUrl, setGfxImageUrl] = useState('https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=800&auto=format&fit=crop&q=80');
  
  // Filter only templates assigned to this reporter
  const assignedTemplates = templates.filter(t => 
    t.isAssignedToAll || currentReporter.assignedTemplateIds.includes(t.id)
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState(assignedTemplates[0]?.id || templates[0]?.id);

  // My Stories Filter
  const myStories = articles.filter(a => a.authorId === currentReporter.id);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const filteredStories = statusFilter === 'all' 
    ? myStories 
    : myStories.filter(a => a.status === statusFilter);

  // Handle AI Structuring
  const handleAiStructure = async () => {
    if (!rawScript.trim()) {
      alert('कृपया पहले कच्ची स्क्रिप्ट (नोट्स या ऑडियो ट्रांसक्रिप्ट) दर्ज करें।');
      return;
    }
    setIsAiLoading(true);
    try {
      const res = await aiStructureNews({
        rawScript,
        category: selectedCategory,
        district: selectedDistrict
      });

      if (res) {
        setHeadline(res.title || '');
        setSubtitle(res.subtitle || '');
        setContent(res.content || '');
        if (res.tags) setTagsInput(res.tags.join(', '));
        if (res.suggestedCategory) setSelectedCategory(res.suggestedCategory);
        setCreationMode('manual'); // Switch to manual editor to review/edit
      }
    } catch (err) {
      console.error(err);
      alert('एआई सेवा में अस्थाई विलंब है, कृपया दोबारा प्रयास करें।');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Submit Article (handles Standard review vs Trusted Direct Publish)
  const handleSaveArticle = async (isDirectPublish: boolean) => {
    if (!headline.trim() || !content.trim()) {
      alert('कृपया शीर्षक और खबर का मुख्य विवरण अवश्य भरें।');
      return;
    }

    setIsSubmitting(true);
    try {
      const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);

      const created = await postNewsArticle({
        title: headline,
        subtitle,
        content,
        rawScript,
        category: selectedCategory,
        district: selectedDistrict,
        thumbnail: thumbnailUrl,
        tags,
        authorId: currentReporter.id,
        authorName: currentReporter.name,
        authorRole: currentReporter.role,
        isTrustedPublish: isDirectPublish && currentReporter.role === 'trusted_reporter',
        readingTimeMinutes: Math.max(1, Math.round(content.split(' ').length / 120))
      });

      onArticleCreated(created);
      setSubmitSuccessMsg(
        isDirectPublish 
          ? 'सत्यापित प्रकाशन सफल! खबर तुरंत लाइव हो गई है।' 
          : 'खबर समीक्षा के लिए केंद्रीय न्यूज़रूम में प्रेषित कर दी गई है।'
      );

      // Reset form
      setRawScript('');
      setHeadline('');
      setSubtitle('');
      setContent('');

      setTimeout(() => {
        setSubmitSuccessMsg('');
        setActiveTab('my_stories');
      }, 2000);
    } catch (err) {
      console.error(err);
      alert('खबर सबमिट करने में समस्या आई।');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId) || templates[0];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Reporter Bar & Identity Switcher */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-4 sm:p-5 text-white shadow-md flex flex-wrap items-center justify-between gap-4 border border-gray-700">
        <div className="flex items-center gap-4">
          <img 
            src={currentReporter.avatar} 
            alt={currentReporter.name} 
            className="w-14 h-14 rounded-full border-2 border-amber-400 object-cover shadow-sm"
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black">{currentReporter.name}</h2>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded shadow-xs uppercase tracking-wider ${
                currentReporter.role === 'trusted_reporter' 
                  ? 'bg-amber-400 text-gray-950 font-black' 
                  : 'bg-blue-500 text-white font-bold'
              }`}>
                {currentReporter.role === 'trusted_reporter' ? '★ विश्वासी रिपोर्टर (सीधा प्रकाशन)' : 'सामान्य रिपोर्टर (समीक्षा अपेक्षित)'}
              </span>
            </div>

            <p className="text-xs text-gray-300 mt-1 flex items-center gap-2">
              <span>आईडी: <strong className="text-yellow-300">{currentReporter.badgeNumber}</strong></span>
              <span>•</span>
              <span className="flex items-center gap-1 text-emerald-400">
                <MapPin className="w-3.5 h-3.5" />
                आवंटित जिले: <strong>{currentReporter.assignedDistricts.join(', ')}</strong>
              </span>
            </p>
          </div>
        </div>

        {/* Demo Reporter Switcher dropdown */}
        <div className="flex items-center gap-2 bg-gray-800/80 p-2 rounded-xl border border-gray-700 text-xs">
          <span className="text-gray-400">स्विच रिपोर्टर (डेमो):</span>
          <select 
            value={currentReporter.id}
            onChange={e => {
              const rep = reporters.find(r => r.id === e.target.value);
              if (rep) onChangeReporter(rep);
            }}
            className="bg-gray-900 text-yellow-300 font-bold px-2 py-1 rounded border border-gray-600 focus:outline-hidden"
          >
            {reporters.map(r => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.role === 'trusted_reporter' ? 'Trusted' : 'Standard'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Navigation Sub-Bar */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-gray-200 pb-2">
        {[
          { id: 'create', label: 'नई खबर (File Story)', icon: FileText },
          { id: 'my_stories', label: `मेरी खबरें (${myStories.length})`, icon: CheckCircle2 },
          { id: 'graphics', label: 'ग्राफिक्स स्टूडियो (Graphics)', icon: Layers },
          { id: 'video', label: 'वीडियो स्टूडियो (Video)', icon: Film },
          { id: 'assignments', label: 'मेरे असाइनमेंट (2)', icon: AlertCircle },
          { id: 'analytics', label: 'प्रदर्शन व मेट्रिक्स', icon: BarChart3 },
          { id: 'profile', label: 'प्रेस आईडी कार्ड', icon: UserCheck }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
                isActive 
                  ? 'bg-red-600 text-white shadow-xs' 
                  : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: FILE STORY */}
      {activeTab === 'create' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 sm:p-7 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-200">
            <div>
              <h3 className="text-lg font-black text-gray-900">
                नई खबर तैयार करें (Digital Newsroom Dispatch)
              </h3>
              <p className="text-xs text-gray-500">
                रॉ स्क्रिप्ट पेस्ट करें और AI की मदद से सेकंडों में प्रकाशन-योग्य खबर बनाएं
              </p>
            </div>

            {/* Mode Switcher */}
            <div className="flex items-center bg-gray-100 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setCreationMode('raw_script')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                  creationMode === 'raw_script' ? 'bg-amber-400 text-gray-950 shadow-xs font-black' : 'text-gray-600'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-red-600" />
                त्वरित रॉ स्क्रिप्ट (AI Newsroom)
              </button>
              <button
                onClick={() => setCreationMode('manual')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                  creationMode === 'manual' ? 'bg-white text-red-600 shadow-xs' : 'text-gray-600'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                विस्तृत मैनुअल संपादक
              </button>
            </div>
          </div>

          {submitSuccessMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-sm font-bold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              {submitSuccessMsg}
            </div>
          )}

          {/* Form Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                श्रेणी चुनें (Category)
              </label>
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="w-full text-xs sm:text-sm p-2.5 rounded-lg border border-gray-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-red-500"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.nameHindi}>
                    {c.nameHindi} ({c.nameEnglish})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center justify-between">
                <span>जिला (District - केवल आपके अधिकृत क्षेत्र)</span>
                <span className="text-emerald-600 text-[10px] flex items-center gap-1 font-bold">
                  <Lock className="w-3 h-3" /> अधिकृत
                </span>
              </label>
              <select
                value={selectedDistrict}
                onChange={e => setSelectedDistrict(e.target.value)}
                className="w-full text-xs sm:text-sm p-2.5 rounded-lg border border-emerald-300 bg-emerald-50/50 font-bold text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-red-500"
              >
                {currentReporter.assignedDistricts.map(d => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* MODE A: Raw Script AI Assistant */}
          {creationMode === 'raw_script' && (
            <div className="bg-amber-50/60 p-4 sm:p-5 rounded-2xl border border-amber-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  कच्ची ग्राउंड रिपोर्ट / ऑडियो ट्रांसक्रिप्ट पेस्ट करें:
                </span>
                <span className="text-[11px] text-gray-500">
                  Devanagari या Hinglish समर्थित
                </span>
              </div>

              <textarea
                rows={5}
                value={rawScript}
                onChange={e => setRawScript(e.target.value)}
                placeholder="उदा. निवाड़ी में रामराजा मंदिर में आज शाम महाआरती हुई। हजारों श्रद्धालु आए। बेतवा नदी पर सुरक्षा व्यवस्था कड़ी रही। एसपी और कलेक्टर मौके पर मौजूद रहे..."
                className="w-full text-xs sm:text-sm p-3 rounded-xl border border-amber-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 leading-relaxed"
              />

              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={isAiLoading || !rawScript.trim()}
                  onClick={handleAiStructure}
                  className="bg-amber-500 hover:bg-amber-600 text-gray-950 text-xs sm:text-sm font-black px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-md transition disabled:opacity-50"
                >
                  <Sparkles className={`w-4 h-4 ${isAiLoading ? 'animate-spin' : ''}`} />
                  {isAiLoading ? 'AI खबर तैयार कर रहा है...' : 'AI से खबर बनाएं (Structure with Gemini)'}
                </button>
              </div>
            </div>
          )}

          {/* MODE B / REVIEW: Full Form Inputs */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                मुख्य हिंदी शीर्षक (Headline - कैची और सटीक)
              </label>
              <input
                type="text"
                value={headline}
                onChange={e => setHeadline(e.target.value)}
                placeholder="उदा. निवाड़ी में ऐतिहासिक रामराजा मंदिर में महाआरती, हजारों श्रद्धालु पहुंचे"
                className="w-full text-sm sm:text-base font-bold p-3 rounded-lg border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                उप-शीर्षक (Subheadline)
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={e => setSubtitle(e.target.value)}
                placeholder="उदा. ओरछा के पावन धाम में विशेष दर्शन के लिए उमड़ी भीड़, सुरक्षा के पुख्ता इंतजाम"
                className="w-full text-xs sm:text-sm p-2.5 rounded-lg border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                पूरी खबर का विवरण (Full Article Content)
              </label>
              <textarea
                rows={7}
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="खबर का विस्तृत विवरण यहाँ लिखें..."
                className="w-full text-xs sm:text-sm p-3 rounded-lg border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-red-500 leading-relaxed font-normal"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-gray-500" />
                  मुख्य फोटो यूआरएल (Thumbnail Image)
                </label>
                <input
                  type="text"
                  value={thumbnailUrl}
                  onChange={e => setThumbnailUrl(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-gray-300 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  टैग्स (Tags - अल्पविराम से अलग करें)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={e => setTagsInput(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-gray-300 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Submission Action Buttons */}
          <div className="pt-4 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-gray-500">
              {currentReporter.role === 'trusted_reporter' 
                ? '★ आपके पास विश्वसनीय रिपोर्टर के तहत सीधे प्रकाशित करने का अधिकार है।'
                : 'आपकी खबर सबमिशन के बाद केंद्रीय डेस्क पर समीक्षा हेतु पहुंचेगी।'}
            </span>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSaveArticle(false)}
                className="px-4 py-2.5 rounded-xl border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs sm:text-sm font-bold transition flex items-center gap-1.5"
              >
                <Send className="w-4 h-4 text-gray-500" />
                समीक्षा के लिए भेजें (Submit for Review)
              </button>

              {currentReporter.role === 'trusted_reporter' && (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSaveArticle(true)}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-black shadow-md transition flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-yellow-300" />
                  सीधे प्रकाशित करें (Direct Publish)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MY FILED STORIES */}
      {activeTab === 'my_stories' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-200">
            <div>
              <h3 className="text-lg font-black text-gray-900">मेरी फाइल की गई खबरें (My Stories)</h3>
              <p className="text-xs text-gray-500">आपके द्वारा भेजी गई खबरों की स्थिति और संपादकीय टिप्पणियां</p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
              {[
                { id: 'all', label: 'सभी' },
                { id: 'published', label: 'प्रकाशित' },
                { id: 'pending_review', label: 'समीक्षा में' },
                { id: 'revision_requested', label: 'संशोधन अपेक्षित' },
                { id: 'rejected', label: 'अस्वीकृत' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  className={`px-3 py-1 rounded-full font-bold transition whitespace-nowrap ${
                    statusFilter === f.id ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {filteredStories.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-sm">
              इस फ़िल्टर में कोई खबर उपलब्ध नहीं है।
            </div>
          ) : (
            <div className="space-y-3">
              {filteredStories.map(story => (
                <div
                  key={story.id}
                  className="p-4 rounded-xl border border-gray-200 hover:border-gray-300 bg-gray-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <img 
                      src={story.thumbnail} 
                      alt={story.title} 
                      className="w-20 h-16 rounded-lg object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-[11px] mb-1">
                        <span className="font-bold text-red-600">{story.category}</span>
                        <span>•</span>
                        <span className="text-gray-500">{story.district}</span>
                        <span>•</span>
                        <span className="text-gray-400">{new Date(story.createdAt).toLocaleDateString('hi-IN')}</span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                        {story.title}
                      </h4>
                      {story.editorialNotes && (
                        <div className="mt-1 text-xs bg-amber-50 text-amber-900 border border-amber-200 p-2 rounded flex items-center gap-2">
                          <MessageSquare className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>संपादक टिप्पणी: {story.editorialNotes}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      story.status === 'published' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : story.status === 'pending_review' 
                        ? 'bg-amber-100 text-amber-800' 
                        : story.status === 'revision_requested' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {story.status === 'published' ? 'स्वीकृत व प्रकाशित' :
                       story.status === 'pending_review' ? 'समीक्षाधीन' :
                       story.status === 'revision_requested' ? 'संशोधन अपेक्षित' : 'अस्वीकृत'}
                    </span>
                    <span className="text-xs text-gray-500">{story.views} व्यूज</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: REPORTER GRAPHICS STUDIO */}
      {activeTab === 'graphics' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 sm:p-7 space-y-6">
          <div className="pb-3 border-b border-gray-200">
            <span className="bg-amber-100 text-amber-900 text-xs font-bold px-2 py-0.5 rounded">
              रिपोर्टर स्टूडियो नियम: केवल असाइन किए गए टेम्पलेट्स उपलब्ध
            </span>
            <h3 className="text-lg font-black text-gray-900 mt-1">
              ग्राफिक्स स्टूडियो (Branded Social News Card)
            </h3>
            <p className="text-xs text-gray-500">
              रॉ स्क्रिप्ट दर्ज करें और एडमिन द्वारा आवंटित आधिकारिक फ़्रेम में सोशल मीडिया कार्ड बनाएं
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Controls */}
            <div className="lg:col-span-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  आवंटित फ़्रेम चुनें (Assigned Template)
                </label>
                <select
                  value={selectedTemplateId}
                  onChange={e => setSelectedTemplateId(e.target.value)}
                  className="w-full text-xs sm:text-sm p-2.5 rounded-lg border border-gray-300 bg-white focus:outline-hidden"
                >
                  {assignedTemplates.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.title} ({t.aspectRatio})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  कार्ड का मुख्य शीर्षक (Headline on Graphic)
                </label>
                <input
                  type="text"
                  value={gfxHeadline}
                  onChange={e => setGfxHeadline(e.target.value)}
                  className="w-full text-xs sm:text-sm font-bold p-2.5 rounded-lg border border-gray-300 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  जिला टैग (District Tag)
                </label>
                <input
                  type="text"
                  value={gfxDistrict}
                  onChange={e => setGfxDistrict(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-gray-300 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  फोटो यूआरएल (Image URL)
                </label>
                <input
                  type="text"
                  value={gfxImageUrl}
                  onChange={e => setGfxImageUrl(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-gray-300 focus:outline-hidden"
                />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    alert('ग्राफिक कार्ड इमेज सफलतापूर्वक तैयार! डाउनलोड प्रारंभ हो रहा है...');
                  }}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition"
                >
                  <Download className="w-4 h-4" />
                  ग्राफिक कार्ड डाउनलोड करें (PNG)
                </button>
              </div>
            </div>

            {/* Right Live Canvas Preview */}
            <div className="lg:col-span-7 flex flex-col items-center justify-center bg-gray-100 p-6 rounded-2xl border border-gray-200">
              <span className="text-xs font-bold text-gray-500 mb-3">लाइव फ़्रेम पूर्वावलोकन (Preview)</span>
              
              {/* Dynamic Simulated Canvas Card */}
              <div 
                className={`relative w-full max-w-[360px] aspect-square rounded-xl overflow-hidden shadow-2xl border-4 border-white flex flex-col justify-between`}
                style={{
                  background: selectedTemplate.backgroundStyle === 'gradient-red' 
                    ? 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)' 
                    : selectedTemplate.backgroundStyle === 'dark-charcoal'
                    ? '#1F2937'
                    : '#F59E0B'
                }}
              >
                {/* Header of Canvas: Official Watermark & District */}
                <div className="p-3 flex items-center justify-between text-white z-10">
                  <div className="flex items-center gap-2">
                    <img 
                      src="/public/assets/aistudio/LOGO_88407b32.png" 
                      alt="BNW" 
                      className="h-7 object-contain bg-white/90 p-0.5 rounded"
                    />
                  </div>
                  <span className="bg-black/70 backdrop-blur-xs text-yellow-300 text-[10px] font-bold px-2 py-0.5 rounded">
                    {gfxDistrict}
                  </span>
                </div>

                {/* Photo Area */}
                <div className="px-3 flex-1 flex items-center justify-center">
                  <div className="w-full h-44 rounded-lg overflow-hidden border border-white/20 shadow-md">
                    <img 
                      src={gfxImageUrl} 
                      alt="News Preview" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Bottom Headline Banner with Protected Branding */}
                <div className="p-3 bg-black/85 backdrop-blur-md text-white border-t border-yellow-400">
                  <span className="bg-yellow-400 text-red-950 text-[9px] font-black px-1.5 py-0.2 rounded uppercase">
                    ब्रेकिंग न्यूज़
                  </span>
                  <h3 className="text-xs sm:text-sm font-black leading-snug text-yellow-200 mt-1 line-clamp-2">
                    {gfxHeadline}
                  </h3>
                  <div className="flex items-center justify-between text-[9px] text-gray-400 mt-2 border-t border-gray-700 pt-1">
                    <span>BREAKING NEWS WALA • {currentReporter.name}</span>
                    <span>www.breakingnewswala.com</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: VIDEO STUDIO (REPORTER) */}
      {activeTab === 'video' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 sm:p-7 space-y-4">
          <div className="pb-3 border-b border-gray-200">
            <h3 className="text-lg font-black text-gray-900">वीडियो स्टूडियो (Video News Dispatch)</h3>
            <p className="text-xs text-gray-500">खबर की ऑडियो-वीडियो क्लिप्स एवं वॉइसओवर सीक्वेंस तैयार करें</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="block text-xs font-bold text-gray-700">स्क्रिप्ट से वॉइसओवर पूर्वावलोकन (Script to TTS)</label>
              <textarea
                rows={4}
                defaultValue="निवाड़ी जिले के ओरछा धाम में आज शाम रामराजा सरकार की महाआरती संपन्न हुई। दूर-दराज से आए श्रद्धालुओं ने बेतवा नदी के घाटों पर दीपदान किया।"
                className="w-full text-xs p-3 rounded-lg border border-gray-300 focus:outline-hidden"
              />
              <div className="flex gap-2">
                <button 
                  onClick={() => alert('वॉइसओवर ऑडियो जनरेट किया जा रहा है...')}
                  className="bg-gray-800 text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-black"
                >
                  वॉइसओवर जनरेट करें (Hindi TTS)
                </button>
              </div>
            </div>

            <div className="bg-gray-900 p-4 rounded-xl text-white flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>टाइमलाइन सीक्वेंस</span>
                <span className="text-amber-400">कुल अवधि: 00:45</span>
              </div>
              <div className="my-6 text-center text-xs text-gray-400">
                [आधिकारिक BNW इंट्रो स्टिंगर] → [स्लाइड 1: ओरछा मंदिर] → [स्लाइड 2: बेतवा घाट] → [आउट्रो]
              </div>
              <button 
                onClick={() => alert('वीडियो रेंडरिंग बैकग्राउंड में प्रारंभ हो गई है।')}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg text-xs"
              >
                वीडियो रेंडर एवं सबमिट करें
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ASSIGNMENTS */}
      {activeTab === 'assignments' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 space-y-4">
          <h3 className="text-lg font-black text-gray-900 pb-2 border-b">केंद्रीय डेस्क से असाइनमेंट</h3>
          <div className="space-y-3">
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">अति आवश्यक</span>
                <h4 className="text-sm font-bold text-gray-900 mt-1">ओरछा महोत्सव 2026: सांस्कृतिक कार्यक्रमों का लाइव कवरेज</h4>
                <p className="text-xs text-gray-600 mt-0.5">समय सीमा: आज शाम 6:00 बजे तक तस्वीरें एवं 300 शब्दों की खबर भेजें।</p>
              </div>
              <button 
                onClick={() => setActiveTab('create')}
                className="bg-amber-500 hover:bg-amber-600 text-gray-950 text-xs font-bold px-4 py-2 rounded-lg"
              >
                खबर दर्ज करें
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 space-y-6">
          <h3 className="text-lg font-black text-gray-900 pb-2 border-b">रिपोर्टिंग एवं व्यक्तिगत प्रदर्शन</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
              <span className="text-xs text-gray-500 font-bold">कुल फाइल खबरें</span>
              <div className="text-2xl font-black text-gray-900 mt-1">{currentReporter.totalStoriesFiled}</div>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-xs text-emerald-700 font-bold">प्रकाशित खबरें</span>
              <div className="text-2xl font-black text-emerald-950 mt-1">{currentReporter.totalStoriesPublished}</div>
            </div>
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
              <span className="text-xs text-amber-700 font-bold">स्वीकृति दर</span>
              <div className="text-2xl font-black text-amber-950 mt-1">
                {Math.round((currentReporter.totalStoriesPublished / currentReporter.totalStoriesFiled) * 100)}%
              </div>
            </div>
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
              <span className="text-xs text-blue-700 font-bold">कुल पाठक रीच</span>
              <div className="text-2xl font-black text-blue-950 mt-1">42,800+</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: PROFILE & PRESS ID */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 max-w-md mx-auto space-y-4">
          <div className="text-center pb-2 border-b">
            <h3 className="text-base font-black text-gray-900">डिजिटल प्रेस पहचान पत्र (Press ID)</h3>
            <p className="text-xs text-gray-500">BREAKING NEWS WALA मान्यता प्राप्त रिपोर्टर</p>
          </div>

          <div className="bg-gradient-to-br from-red-700 to-gray-900 text-white rounded-2xl p-5 shadow-xl border-2 border-yellow-400 space-y-4">
            <div className="flex items-center justify-between border-b border-white/20 pb-2">
              <img src="/public/assets/aistudio/LOGO_88407b32.png" alt="Logo" className="h-8 object-contain bg-white/90 p-0.5 rounded" />
              <span className="text-xs font-bold text-yellow-300">{currentReporter.badgeNumber}</span>
            </div>

            <div className="flex items-center gap-4">
              <img src={currentReporter.avatar} alt="Reporter" className="w-16 h-16 rounded-full border-2 border-white object-cover" />
              <div>
                <h4 className="text-base font-black">{currentReporter.name}</h4>
                <p className="text-xs text-yellow-300 font-semibold">{currentReporter.role === 'trusted_reporter' ? 'वरिष्ठ जिला संवाददाता' : 'जिला संवाददाता'}</p>
                <p className="text-[11px] text-gray-300">{currentReporter.assignedDistricts.join(', ')}</p>
              </div>
            </div>

            <div className="text-[10px] text-gray-300 border-t border-white/20 pt-2 flex justify-between">
              <span>जारी दिनांक: {currentReporter.joinedDate}</span>
              <span className="text-emerald-400 font-bold">वैधता: सक्रिय</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
