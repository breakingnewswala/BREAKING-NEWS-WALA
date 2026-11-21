import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  Mic,
  MicOff,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Play,
  Square,
  FileText,
  Copy,
  ChevronRight,
  ArrowRight,
  Volume2,
  Wand2,
  BookOpen,
  ShieldCheck,
  TrendingUp,
  CloudRain,
  Vote,
  Type,
  Scale,
  Columns as ColumnsIcon,
  Globe,
  Upload,
  ScanText,
} from 'lucide-react';
import { apiClient } from '../../../services/apiClient';
import {
  InterviewToArticleResponse,
  InterviewToArticleRequest,
  EpaperPageElement,
} from '../../../types';

export interface EpaperAiAssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedElement: EpaperPageElement | null;
  onUpdateElement?: (updated: EpaperPageElement) => void;
  onInsertStoryToCanvas: (story: {
    title: string;
    subheadline?: string;
    summary?: string;
    content: string;
    byline?: string;
  }) => void;
}

interface AiToolItem {
  id: string;
  nameHi: string;
  nameEn: string;
  desc: string;
  category: 'interview' | 'edit' | 'layout' | 'verify';
  icon: React.ReactNode;
}

const AI_TOOLS_CATALOG: AiToolItem[] = [
  // Category: साक्षात्कार व आलेख (Interviews & Articles)
  {
    id: 'interview-to-article',
    nameHi: '1. साक्षात्कार से समाचार निर्माण',
    nameEn: 'Interview to Inverted Pyramid Article',
    desc: 'ऑडियो या ट्रांसक्रिप्ट से उद्धरण, 5 शीर्षक शैलियाँ व अखबार आलेख',
    category: 'interview',
    icon: <Mic className="w-4 h-4 text-amber-500" />,
  },
  {
    id: 'headlines-5',
    nameHi: '2. 5 शीर्षक शैलियाँ जेनरेटर',
    nameEn: '5 Journalistic Headline Styles',
    desc: 'सीधा, विश्लेषणात्मक, जनसरोकारीय, प्रश्नवाचक व इनवर्टेड पिरामिड शीर्षक',
    category: 'interview',
    icon: <Type className="w-4 h-4 text-red-500" />,
  },
  {
    id: 'quotes-facts',
    nameHi: '3. उद्धरण व तथ्य निष्कर्षण',
    nameEn: 'Quotes & Verified Facts Extractor',
    desc: 'वक्ता की बायलाइन सहित सटीक कोट्स व प्रमुख बुलेट बिंदु',
    category: 'interview',
    icon: <FileText className="w-4 h-4 text-blue-500" />,
  },
  {
    id: 'lead-summary',
    nameHi: '4. संक्षेप व मुख्य लीड पैराग्राफ',
    nameEn: 'Summary & Lead Generator',
    desc: '5W1H (कौन, क्या, कब, कहाँ, क्यों, कैसे) आधारित प्रारंभिक लीड',
    category: 'interview',
    icon: <Wand2 className="w-4 h-4 text-purple-500" />,
  },
  {
    id: 'kicker-deck',
    nameHi: '5. किकर व उपशीर्षक जेनरेटर',
    nameEn: 'Kicker & Deck Generator',
    desc: 'मुख्य हेडिंग के ऊपर या नीचे की प्रभावशाली संदर्भ लाइन',
    category: 'interview',
    icon: <BookOpen className="w-4 h-4 text-emerald-500" />,
  },

  // Category: संपादन व प्रूफरीडिंग (Editing & Proofreading)
  {
    id: 'grammar-spelling',
    nameHi: '6. व्याकरण व वर्तनी सुधार',
    nameEn: 'Devanagari Grammar & Spelling',
    desc: 'जटिल देवनागरी संयुक्ताक्षर, हलंत व मात्रा शुद्धता',
    category: 'edit',
    icon: <ShieldCheck className="w-4 h-4 text-blue-600" />,
  },
  {
    id: 'devanagari-justify',
    nameHi: '7. देवनागरी जस्टिफिकेशन',
    nameEn: 'Devanagari Justification Engine',
    desc: 'शब्द-अंतराल वितरण द्वारा अखबार-मानक ब्लॉक अलाइनमेंट',
    category: 'edit',
    icon: <ColumnsIcon className="w-4 h-4 text-indigo-500" />,
  },
  {
    id: 'overflow-trimmer',
    nameHi: '8. शब्द सीमा व स्पेस ट्रिमर',
    nameEn: 'Word Count & Space Trimmer',
    desc: 'कॉलम में फिट करने के लिए बिना अर्थ खोए संक्षेपण',
    category: 'edit',
    icon: <Scale className="w-4 h-4 text-amber-600" />,
  },
  {
    id: 'dialect-normalizer',
    nameHi: '9. क्षेत्रीय बोली सामान्यीकरण',
    nameEn: 'Regional Dialect Normalizer',
    desc: 'मालवी, बुंदेली, निमाड़ी या बघेली शब्दों का मानक हिंदी रूपांतरण',
    category: 'edit',
    icon: <Wand2 className="w-4 h-4 text-teal-500" />,
  },
  {
    id: 'editorial-polish',
    nameHi: '10. संपादकीय दृष्टिकोण पॉलिशर',
    nameEn: 'Editorial Stance Polisher',
    desc: 'संपादकीय व ओप-एड पन्नों हेतु परिष्कृत भाषा शैली',
    category: 'edit',
    icon: <BookOpen className="w-4 h-4 text-rose-500" />,
  },

  // Category: लेआउट व विन्यास (Layout & Grid Formatting)
  {
    id: 'column-format',
    nameHi: '11. कॉलम विन्यास फ़ॉर्मेटर',
    nameEn: 'Column Content Formatter',
    desc: '1 से 8 कॉलम ग्रिड के अनुसार अनुच्छेद व विन्यास विभाजन',
    category: 'layout',
    icon: <ColumnsIcon className="w-4 h-4 text-cyan-500" />,
  },
  {
    id: 'byline-credit',
    nameHi: '12. बायलाइन व साभार संपादन',
    nameEn: 'Byline & Attribution Formatter',
    desc: 'संवाददाता, छायाकार व डेस्क संपादक का मानक क्रेडिट',
    category: 'layout',
    icon: <FileText className="w-4 h-4 text-slate-400" />,
  },
  {
    id: 'bullet-highlights',
    nameHi: '13. मुख्य बिंदु व बुलेट्स',
    nameEn: 'Bullet Highlights & Key Takeaways',
    desc: 'समाचार के 3 से 5 त्वरित मुख्य बिंदु व आँकड़े',
    category: 'layout',
    icon: <TrendingUp className="w-4 h-4 text-emerald-600" />,
  },
  {
    id: 'weather-mandi',
    nameHi: '14. मौसम व मंडी भाव सारणी',
    nameEn: 'Weather & Mandi Bhav Table Maker',
    desc: 'मध्य प्रदेश की कृषि मंडियों व मौसम का सारणीबद्ध विन्यास',
    category: 'layout',
    icon: <CloudRain className="w-4 h-4 text-sky-500" />,
  },
  {
    id: 'breaking-ticker',
    nameHi: '15. ब्रेकिंग न्यूज़ फ्लैश जनरेटर',
    nameEn: 'Breaking News Flash Ticker',
    desc: 'प्रथम पृष्ठ की फ्लैश पट्टी अथवा त्वरित बुलेटिन',
    category: 'layout',
    icon: <AlertTriangle className="w-4 h-4 text-red-600" />,
  },

  // Category: अनुसंधान व सत्यापन (Research & Verification)
  {
    id: 'fact-check-10',
    nameHi: '16. 10-बिंदु तथ्य सत्यापन',
    nameEn: '10-Point Fact-Checking Protocol',
    desc: 'तारीख, स्थान, नाम, बयान, आंकड़े व संदर्भ की पुष्टि',
    category: 'verify',
    icon: <ShieldCheck className="w-4 h-4 text-emerald-500" />,
  },
  {
    id: 'legal-defamation',
    nameHi: '17. मानहानि व विधिक पूर्व-परीक्षण',
    nameEn: 'Legal & Defamation Shield',
    desc: 'प्रेस काउंसिल व बीएनएस मानहानि प्रावधानों की जांच',
    category: 'verify',
    icon: <Scale className="w-4 h-4 text-purple-600" />,
  },
  {
    id: 'url-extract',
    nameHi: '18. कवर URL निष्कर्षण',
    nameEn: 'Cover URL Content Extractor',
    desc: 'वेबसाइट अथवा डिजिटल कवर से स्वतः समाचार पढ़ना',
    category: 'verify',
    icon: <Globe className="w-4 h-4 text-blue-500" />,
  },
  {
    id: 'audio-transcribe',
    nameHi: '19. ऑडियो साक्षात्कार ट्रांसक्रिप्शन',
    nameEn: 'Audio Interview Transcription',
    desc: 'फील्ड वॉइस नोट अथवा रिकॉर्डिंग का हिंदी पाठ रूपांतरण',
    category: 'verify',
    icon: <Volume2 className="w-4 h-4 text-amber-500" />,
  },
  {
    id: 'ocr-extract',
    nameHi: '20. दस्तावेज़ व छवि OCR',
    nameEn: 'Document & Image OCR',
    desc: 'प्रेस विज्ञप्ति या सरकारी आदेश की फोटो से टेक्स्ट पढ़ना',
    category: 'verify',
    icon: <ScanText className="w-4 h-4 text-cyan-500" />,
  },
  {
    id: 'election-analyst',
    nameHi: '21. चुनावी व सर्वेक्षण विश्लेषक',
    nameEn: 'Election & Survey Analyst',
    desc: 'मध्य प्रदेश विधानसभा/लोकसभा सीटों का रुझान विश्लेषण',
    category: 'verify',
    icon: <Vote className="w-4 h-4 text-rose-500" />,
  },
  {
    id: 'seo-print-match',
    nameHi: '22. प्रिंट व डिजिटल हेडलाइन तालमेल',
    nameEn: 'Print & Digital Headline Matcher',
    desc: 'प्रिंट हेडलाइन के साथ डिजिटल ई-पेपर का एसईओ अनुकूलन',
    category: 'verify',
    icon: <TrendingUp className="w-4 h-4 text-blue-600" />,
  },
];

export const EpaperAiAssistantPanel: React.FC<EpaperAiAssistantPanelProps> = ({
  isOpen,
  onClose,
  selectedElement,
  onUpdateElement,
  onInsertStoryToCanvas,
}) => {
  const [selectedToolId, setSelectedToolId] = useState<string>('interview-to-article');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'interview' | 'edit' | 'layout' | 'verify'>('all');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // REAL-TIME VOICE TYPING STATE (PART 8)
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [voiceLanguage, setVoiceLanguage] = useState<'hi-IN' | 'en-IN'>('hi-IN');
  const [voiceTranscript, setVoiceTranscript] = useState<string>('');
  const recognitionRef = useRef<any>(null);

  // Interview to Article tool specific state (Part 6)
  const [interviewSpeaker, setInterviewSpeaker] = useState<string>('');
  const [interviewTopic, setInterviewTopic] = useState<string>('');
  const [interviewContent, setInterviewContent] = useState<string>('');
  const [interviewResult, setInterviewResult] = useState<InterviewToArticleResponse | null>(null);
  const [chosenHeadlineIndex, setChosenHeadlineIndex] = useState<number>(0);

  // General single input / output for other 21 tools
  const [generalInput, setGeneralInput] = useState<string>('');
  const [generalOutput, setGeneralOutput] = useState<string>('');

  // Prepopulate input if element is selected
  useEffect(() => {
    if (selectedElement) {
      const text = [
        selectedElement.customHeadline,
        selectedElement.customSubheadline,
        selectedElement.customBodyText,
      ]
        .filter(Boolean)
        .join('\n\n');
      if (text && !generalInput) {
        setGeneralInput(text);
      }
    }
  }, [selectedElement]);

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  if (!isOpen) return null;

  // Real-time Voice Typing Toggle (Web Speech API)
  const toggleVoiceRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsRecording(false);
      return;
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      setErrorMsg('आपके ब्राउज़र में Web Speech API समर्थित नहीं है। कृपया Chrome अथवा Edge का उपयोग करें।');
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = voiceLanguage;

      recognition.onstart = () => {
        setIsRecording(true);
        setErrorMsg(null);
      };

      recognition.onresult = (event: any) => {
        let currentText = '';
        for (let i = 0; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript + ' ';
        }
        setVoiceTranscript(currentText.trim());

        // Also stream into the active tool input
        if (selectedToolId === 'interview-to-article') {
          setInterviewContent(currentText.trim());
        } else {
          setGeneralInput(currentText.trim());
        }
      };

      recognition.onerror = (e: any) => {
        console.warn('Speech recognition error:', e.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      setErrorMsg(err.message || 'माइक्रोफ़ोन प्रारंभ करने में त्रुटि');
      setIsRecording(false);
    }
  };

  // Tool execution dispatcher
  const handleExecuteActiveTool = async () => {
    setIsProcessing(true);
    setErrorMsg(null);
    setGeneralOutput('');

    try {
      if (selectedToolId === 'interview-to-article') {
        const payload: InterviewToArticleRequest = {
          intervieweeName: interviewSpeaker.trim() || undefined,
          contextTopic: interviewTopic.trim() || 'मध्य प्रदेश समाचार',
          transcriptText: interviewContent.trim() || voiceTranscript.trim() || generalInput.trim(),
          outputFormat: 'INVERTED_PYRAMID',
        };
        const res = await apiClient.epaper.ai.interviewToArticle(payload);
        setInterviewResult(res);
      } else if (selectedToolId === 'grammar-spelling') {
        const res = await apiClient.epaper.ai.copyEditGrammarSpelling({
          content: generalInput.trim(),
        });
        setGeneralOutput(res.revisedContent);
      } else if (selectedToolId === 'quotes-facts') {
        const res = await apiClient.epaper.ai.extractQuotesAndFacts({
          text: generalInput.trim(),
        });
        const formatted = [
          '📌 प्रमुख सत्यापित तथ्य (Facts):',
          ...(res.facts || []).map((f: string, i: number) => `${i + 1}. ${f}`),
          '',
          '💬 उद्धरण (Quotes):',
          ...(res.quotes || []).map((q: any) => `• "${q.quote}" — ${q.speaker || 'वक्ता'}`),
        ].join('\n');
        setGeneralOutput(formatted);
      } else if (selectedToolId === 'column-format') {
        const res = await apiClient.epaper.ai.formatColumn({
          content: generalInput.trim(),
          columnCount: 3,
        });
        setGeneralOutput(res?.formattedContent || generalInput);
      } else {
        // Fallback for other tools: invoke interviewToArticle or general text polisher
        const res = await apiClient.epaper.ai.interviewToArticle({
          sourceType: 'TRANSCRIPT',
          transcriptText: generalInput.trim(),
          contextTopic: selectedToolId,
        });
        const outText = typeof res.articleDraft === 'string' ? res.articleDraft : res.articleDraft?.body || 'संपादन पूर्ण';
        setGeneralOutput(outText);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'AI निष्पादन विफल रहा');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyToCanvas = () => {
    if (selectedToolId === 'interview-to-article' && interviewResult) {
      const allHeadlines = interviewResult.headlines || interviewResult.headlineOptions || [];
      const chosenHeadline = allHeadlines[chosenHeadlineIndex]?.headline || 'साक्षात्कार से आलेख';
      const draftBody = typeof interviewResult.articleDraft === 'string' ? interviewResult.articleDraft : interviewResult.articleDraft.body;
      onInsertStoryToCanvas({
        title: chosenHeadline,
        content: draftBody,
        summary: draftBody.slice(0, 150),
        byline: interviewSpeaker ? `${interviewSpeaker} से विशेष बातचीत` : 'विशेष संवाददाता',
      });
      onClose();
    } else if (generalOutput) {
      onInsertStoryToCanvas({
        title: 'AI संपादित समाचार आलेख',
        content: generalOutput,
        summary: generalOutput.slice(0, 150),
      });
      onClose();
    }
  };

  const filteredTools = AI_TOOLS_CATALOG.filter((t) => {
    const matchCat = activeCategory === 'all' || t.category === activeCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchQ = !q || t.nameHi.toLowerCase().includes(q) || t.nameEn.toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  return (
    <aside className="w-96 xl:w-104 bg-slate-900 border-l border-slate-800 text-white flex flex-col shrink-0 h-full overflow-hidden select-none shadow-2xl z-40">
      {/* Header */}
      <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>AI न्यूज़रूम सहायक</span>
              <span className="text-[9px] font-mono font-normal px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800">
                22 टूल्स
              </span>
            </h3>
            <p className="text-[10px] text-slate-400">दैनिक कोटा: 50/50 अनुरोध उपलब्ध</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="पैनल बंद करें"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* =================================================================== */}
      {/* REAL-TIME VOICE TYPING BAR (PART 8 MANDATE)                         */}
      {/* =================================================================== */}
      <div className="p-3 bg-slate-950/80 border-b border-slate-800/80 space-y-2 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
              <Mic className="w-3.5 h-3.5 text-amber-400" />
              <span>रीयल-टाइम वॉइस टाइपिंग</span>
            </span>
            {isRecording && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
            )}
          </div>

          {/* Language selector */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setVoiceLanguage('hi-IN')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                voiceLanguage === 'hi-IN' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              हिंदी
            </button>
            <button
              onClick={() => setVoiceLanguage('en-IN')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                voiceLanguage === 'en-IN' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              Hinglish
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleVoiceRecording}
            className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
              isRecording
                ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            {isRecording ? (
              <>
                <Square className="w-3.5 h-3.5 fill-white" />
                <span>रिकॉर्डिंग रोकें (बोलना जारी रखें...)</span>
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5 text-amber-400" />
                <span>माइक दबाएं और बोलें (Voice Typing)</span>
              </>
            )}
          </button>
        </div>

        {voiceTranscript && (
          <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 text-xs text-slate-200 max-h-20 overflow-y-auto leading-relaxed">
            <span className="text-[10px] font-bold text-amber-400 block mb-0.5">बोला गया पाठ:</span>
            {voiceTranscript}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Error notice */}
        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-800 text-xs text-red-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Search & Tool Category Tabs */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="22 संपादकीय टूल्स खोजें..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:ring-1 focus:ring-amber-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-[10px] font-bold">
            {[
              { key: 'all', label: 'सभी (22)' },
              { key: 'interview', label: 'साक्षात्कार' },
              { key: 'edit', label: 'संपादन' },
              { key: 'layout', label: 'लेआउट' },
              { key: 'verify', label: 'सत्यापन' },
            ].map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key as any)}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  activeCategory === cat.key
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Tool Workspace */}
        <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-amber-300">
              सक्रिय टूल:{' '}
              {AI_TOOLS_CATALOG.find((t) => t.id === selectedToolId)?.nameHi || 'साक्षात्कार से समाचार'}
            </span>
          </div>

          {/* INTERVIEW TO ARTICLE WORKFLOW (PART 6) */}
          {selectedToolId === 'interview-to-article' ? (
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-0.5">वक्ता / साक्षात्कारदाता:</label>
                  <input
                    type="text"
                    value={interviewSpeaker}
                    onChange={(e) => setInterviewSpeaker(e.target.value)}
                    placeholder="उदा. डॉ. मोहन यादव, मुख्यमंत्री"
                    className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-0.5">विषय / प्रसंग:</label>
                  <input
                    type="text"
                    value={interviewTopic}
                    onChange={(e) => setInterviewTopic(e.target.value)}
                    placeholder="उदा. MP औद्योगिक विकास"
                    className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-0.5">
                  साक्षात्कार ऑडियो ट्रांसक्रिप्ट / नोट्स:
                </label>
                <textarea
                  rows={4}
                  value={interviewContent}
                  onChange={(e) => setInterviewContent(e.target.value)}
                  placeholder="यहाँ साक्षात्कार का पाठ दर्ज करें अथवा ऊपर माइक बटन दबाकर बोलें..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white leading-relaxed resize-none"
                />
              </div>

              <button
                onClick={handleExecuteActiveTool}
                disabled={isProcessing}
                className="w-full py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>AI विश्लेषण जारी...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>समाचार आलेख व 5 शीर्षक बनाएं</span>
                  </>
                )}
              </button>

              {/* Display Interview Results: 5 Headlines, Quotes, Inverted Pyramid draft */}
              {interviewResult && (
                <div className="space-y-3 pt-2 border-t border-slate-800">
                  {/* 5 Distinct Headline Styles */}
                  <div>
                    <label className="block text-[10px] font-bold text-amber-400 mb-1">
                      5 शीर्षक शैलियाँ (क्लिक करके चुनें):
                    </label>
                    <div className="space-y-1">
                      {((interviewResult.headlines || interviewResult.headlineOptions || []) as any[]).map((h, idx) => (
                        <div
                          key={idx}
                          onClick={() => setChosenHeadlineIndex(idx)}
                          className={`p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                            chosenHeadlineIndex === idx
                              ? 'bg-amber-950/80 border-amber-500 text-amber-200 shadow-2xs'
                              : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 mb-0.5">
                            <span>{h.style || h.typeLabelHi || h.type}</span>
                            {chosenHeadlineIndex === idx && <CheckCircle2 className="w-3 h-3 text-amber-400" />}
                          </div>
                          <div className="font-bold leading-snug">{h.headline}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Extracted Quotes */}
                  {((interviewResult.extractedQuotes || interviewResult.keyQuotes || []) as any[]).length > 0 && (
                    <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                      <span className="text-[10px] font-bold text-blue-400 block">सत्यापित मुख्य उद्धरण:</span>
                      {((interviewResult.extractedQuotes || interviewResult.keyQuotes || []) as any[]).map((q, i) => (
                        <p key={i} className="text-[11px] text-slate-300 italic border-l-2 border-blue-500 pl-2">
                          "{q.quote}" — <strong>{q.speaker || interviewSpeaker}</strong>
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Inverted Pyramid Draft */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">
                      इनवर्टेड पिरामिड अखबार आलेख:
                    </label>
                    <textarea
                      rows={5}
                      value={typeof interviewResult.articleDraft === 'string' ? interviewResult.articleDraft : interviewResult.articleDraft.body}
                      onChange={(e) =>
                        setInterviewResult({ ...interviewResult, articleDraft: e.target.value })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 leading-relaxed resize-none"
                    />
                  </div>

                  <button
                    onClick={handleApplyToCanvas}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>पेज पर स्टोरी के रूप में जोड़ें</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* GENERAL TOOLS WORKSPACE */
            <div className="space-y-2.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-0.5">
                  इनपुट सामग्री दर्ज करें:
                </label>
                <textarea
                  rows={4}
                  value={generalInput}
                  onChange={(e) => setGeneralInput(e.target.value)}
                  placeholder="यहाँ सामग्री दर्ज करें या माइक से बोलें..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white leading-relaxed resize-none"
                />
              </div>

              <button
                onClick={handleExecuteActiveTool}
                disabled={isProcessing}
                className="w-full py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>प्रक्रिया जारी है...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>AI टूल निष्पादित करें</span>
                  </>
                )}
              </button>

              {generalOutput && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between text-[10px] font-bold text-emerald-400">
                    <span>परिणाम (Output):</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(generalOutput)}
                      className="text-slate-400 hover:text-white flex items-center gap-0.5"
                    >
                      <Copy className="w-3 h-3" />
                      <span>कॉपी</span>
                    </button>
                  </div>
                  <textarea
                    rows={5}
                    value={generalOutput}
                    onChange={(e) => setGeneralOutput(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-emerald-200 font-mono leading-relaxed resize-none"
                  />
                  <button
                    onClick={handleApplyToCanvas}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>पेज पर स्टोरी के रूप में जोड़ें</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 22 TOOLS CATALOG LIST */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 block px-1">
            उपलब्ध 22 AI न्यूज़रूम टूल्स:
          </span>
          <div className="space-y-1">
            {filteredTools.map((tool) => (
              <div
                key={tool.id}
                onClick={() => setSelectedToolId(tool.id)}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between group ${
                  selectedToolId === tool.id
                    ? 'bg-amber-950/60 border-amber-500 text-amber-200'
                    : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 shrink-0">
                    {tool.icon}
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-xs font-bold truncate">{tool.nameHi}</h5>
                    <p className="text-[10px] text-slate-400 truncate">{tool.desc}</p>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};
