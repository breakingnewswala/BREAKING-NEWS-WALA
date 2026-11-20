import React, { useState, useEffect } from 'react';
import { EpaperEditionDoc, EpaperEditionType, DivisionItem, DistrictItem } from '../../types';
import {
  X,
  Newspaper,
  Calendar,
  MapPin,
  Layers,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Sparkles,
  FileText,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { DIVISIONS, DISTRICTS } from '../../data/mockNewsData';
import { DEFAULT_EPAPER_TEMPLATES } from '../../data/defaultEpaperTemplates';

export interface EpaperCreationWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (newEdition: EpaperEditionDoc) => void;
  divisions?: DivisionItem[];
  districts?: DistrictItem[];
}

export const EpaperCreationWizardModal: React.FC<EpaperCreationWizardModalProps> = ({
  isOpen,
  onClose,
  onCreated,
  divisions = DIVISIONS,
  districts = DISTRICTS,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().split('T')[0];

  const [editionType, setEditionType] = useState<EpaperEditionType>('DAILY');
  const [publicationDate, setPublicationDate] = useState<string>(defaultDateStr);
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('dist-bhopal');
  const [editionTitle, setEditionTitle] = useState<string>('भोपाल मुख्य राज्य संस्करण - दैनिक ई-पेपर');
  const [editionLanguage, setEditionLanguage] = useState<string>('hi');
  const [editionCode, setEditionCode] = useState<string>('');
  const [editionDescription, setEditionDescription] = useState<string>('');
  const [totalPages, setTotalPages] = useState<number>(12);
  const [specialTheme, setSpecialTheme] = useState<string>('');

  // Filtered districts based on selected division
  const filteredDistricts = districts.filter((d) => {
    if (selectedDivision === 'all') return true;
    return d.divisionId === selectedDivision;
  });

  // Auto-generate safe edition code and title suggestion when district, date, or type changes
  useEffect(() => {
    const distObj = districts.find((d) => d.id === selectedDistrict);
    const distName = distObj?.nameHi || distObj?.nameEn || 'भोपाल';
    const distSlug = (distObj?.nameEn || 'bhopal').toLowerCase().replace(/[^a-z0-9]/g, '-');
    const dateSlug = publicationDate || 'date';
    const typeSlug = editionType === 'DAILY' ? 'daily' : 'special';

    if (editionType === 'DAILY') {
      setEditionTitle(`${distName} मुख्य संस्करण - दैनिक ई-पेपर`);
      setTotalPages(12);
    } else {
      const themeSuffix = specialTheme ? ` (${specialTheme})` : ' विशेषांक';
      setEditionTitle(`${distName} विशेष परिशिष्ट${themeSuffix}`);
      if (totalPages === 12 && !specialTheme) {
        setTotalPages(8);
      }
    }

    const autoCode = `epaper-${distSlug}-${dateSlug}-${typeSlug}`.toLowerCase();
    setEditionCode((prev) => (prev && prev !== autoCode && !prev.startsWith('epaper-') ? prev : autoCode));
  }, [selectedDistrict, editionType, specialTheme, publicationDate, districts]);

  // Ensure district validity when division changes
  useEffect(() => {
    if (selectedDivision !== 'all') {
      const validInDiv = districts.find((d) => d.divisionId === selectedDivision);
      if (validInDiv) {
        setSelectedDistrict(validInDiv.id);
      }
    }
  }, [selectedDivision, districts]);

  if (!isOpen) return null;

  const handleNextStep = () => {
    if (!publicationDate) {
      setErrorMessage('कृपया प्रकाशन तिथि का चयन करें।');
      return;
    }
    if (!editionTitle.trim()) {
      setErrorMessage('कृपया संस्करण शीर्षक दर्ज करें।');
      return;
    }
    if (editionType === 'DAILY' && totalPages !== 12) {
      setErrorMessage('दैनिक संस्करण में अनिवार्यतः ठीक 12 पृष्ठ होने चाहिए।');
      return;
    }
    if (editionType === 'SPECIAL' && (totalPages < 1 || totalPages > 48)) {
      setErrorMessage('विशेष संस्करण पृष्ठ संख्या 1 से 48 के मध्य होनी चाहिए।');
      return;
    }
    const safeCodeRegex = /^[a-z0-9-]+$/i;
    if (editionCode && !safeCodeRegex.test(editionCode)) {
      setErrorMessage('संस्करण पहचानकर्ता (Identifier) केवल अक्षरों, अंकों और हाइफन (-) से बना होना चाहिए।');
      return;
    }
    setErrorMessage(null);
    setStep(2);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    const distObj = districts.find((d) => d.id === selectedDistrict);
    const divObj = divisions.find((div) => div.id === (distObj?.divisionId || selectedDivision));

    const finalPages = editionType === 'DAILY' ? 12 : totalPages;
    const finalCode = editionCode.trim().toLowerCase() || `epaper-${(distObj?.nameEn || 'mp').toLowerCase().replace(/[^a-z0-9]/g, '-')}-${publicationDate}-${editionType.toLowerCase()}`;

    const payload = {
      title: editionTitle.trim(),
      publicationDate,
      editionType,
      districtId: selectedDistrict,
      districtName: distObj?.nameHi || distObj?.nameEn || 'भोपाल',
      divisionId: divObj?.id || selectedDivision,
      divisionName: divObj?.nameHi || divObj?.nameEn || 'भोपाल संभाग',
      editionCode: finalCode,
      language: editionLanguage,
      description: editionDescription.trim() || undefined,
      totalPages: finalPages,
      status: 'DRAFT' as const,
    };

    try {
      const { apiClient } = await import('../../services/apiClient');
      const result = await apiClient.epaper.createEdition(payload);
      onCreated(result.edition);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'संस्करण निर्माण में त्रुटि उत्पन्न हुई।');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Newspaper className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                नया ई-पेपर संस्करण निर्माण विज़ार्ड (Step {step} of 2)
              </h3>
              <p className="text-xs text-slate-500">
                {step === 1
                  ? 'बुनियादी विवरण व क्षेत्रीय लक्ष्योन्मुखीकरण'
                  : 'पृष्ठ संरचना व टेम्पलेट पूर्वावलोकन'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {step === 1 ? (
            /* STEP 1: Basic Info & Jurisdiction */
            <div className="space-y-5">
              {/* Edition Type Choice & Dimensions Notice */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700">
                    संस्करण का प्रकार चुनें (Edition Type) *
                  </label>
                  <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                    📐 मानक ब्रॉडशीट आयाम: 32.9 × 52.0 सेमी (Broadsheet)
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div
                    onClick={() => {
                      setEditionType('DAILY');
                      setTotalPages(12);
                    }}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      editionType === 'DAILY'
                        ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-100'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-slate-900">दैनिक ब्रॉडशीट (Daily Edition)</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                        ठीक 12 पृष्ठ अनिवार्य
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      मानक 12-पृष्ठीय ब्रॉडशीट समाचार पत्र (32.9 × 52.0 सेमी)। राज्य व जिला समाचारों हेतु स्थिर 12-पृष्ठ संरचना।
                    </p>
                  </div>

                  <div
                    onClick={() => {
                      setEditionType('SPECIAL');
                      if (totalPages === 12) setTotalPages(8);
                    }}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      editionType === 'SPECIAL'
                        ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-100'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-slate-900">विशेष संस्करण (Special Edition)</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        1 से 48 पृष्ठ समर्थित
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      बजट विशेषांक, स्थापना दिवस या चुनाव परिशिष्ट। 1 से 48 तक स्वतंत्र पृष्ठ संख्या विन्यास।
                    </p>
                  </div>
                </div>
              </div>

              {/* Special Theme input (if special edition) */}
              {editionType === 'SPECIAL' && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                  <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>विशेष परिशिष्ट विन्यास (1 से 48 पृष्ठ)</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        विशेषांक विषय / थीम
                      </label>
                      <input
                        type="text"
                        value={specialTheme}
                        onChange={(e) => setSpecialTheme(e.target.value)}
                        placeholder="उदा. बजट 2026, ओरछा उत्सव विशेषांक"
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        कुल पृष्ठ संख्या (1 से 48 पृष्ठ) *
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          max={48}
                          value={totalPages}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            setTotalPages(isNaN(val) ? 1 : Math.max(1, Math.min(48, val)));
                          }}
                          className="w-24 text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 bg-white font-bold"
                        />
                        <select
                          value={[4, 8, 12, 16, 24, 32, 48].includes(totalPages) ? totalPages : ''}
                          onChange={(e) => {
                            if (e.target.value) setTotalPages(Number(e.target.value));
                          }}
                          className="flex-1 text-xs px-2 py-2 border border-slate-300 rounded-lg bg-white"
                        >
                          <option value="">त्वरित प्रीसेट चुनें...</option>
                          <option value={4}>4 पृष्ठ (लघु परिशिष्ट)</option>
                          <option value={8}>8 पृष्ठ (मध्यम विशेषांक)</option>
                          <option value={12}>12 पृष्ठ (मानक विशेषांक)</option>
                          <option value={16}>16 पृष्ठ (विशाल परिशिष्ट)</option>
                          <option value={24}>24 पृष्ठ (महा-विशेषांक)</option>
                          <option value={32}>32 पृष्ठ (वृहद विशेषांक)</option>
                          <option value={48}>48 पृष्ठ (अधिकतम सीमा)</option>
                        </select>
                      </div>
                      <span className="text-[10px] text-amber-800 mt-1 block">
                        * विशेष संस्करण में 1 से 48 पृष्ठ अनुमत हैं।
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Publication Date & Language */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    प्रकाशन तिथि (Publication Date) *
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={publicationDate}
                      onChange={(e) => setPublicationDate(e.target.value)}
                      className="w-full text-xs px-3 py-2 pl-9 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                    />
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                {/* Edition Language */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    संस्करण की भाषा (Edition Language) *
                  </label>
                  <select
                    value={editionLanguage}
                    onChange={(e) => setEditionLanguage(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 bg-white font-medium"
                  >
                    <option value="hi">हिन्दी (Hindi - देवनागरी लिपि)</option>
                    <option value="en">English (English Edition)</option>
                  </select>
                </div>
              </div>

              {/* Division & District Targeting */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Division Targeting */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    संभाग लक्ष्योन्मुखीकरण (MP Division)
                  </label>
                  <select
                    value={selectedDivision}
                    onChange={(e) => setSelectedDivision(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 bg-white"
                  >
                    <option value="all">राज्यव्यापी / सभी 10 संभाग</option>
                    {divisions.map((div) => (
                      <option key={div.id} value={div.id}>
                        {div.nameHi || div.nameEn} ({div.headquarters || ''})
                      </option>
                    ))}
                  </select>
                </div>

                {/* District Targeting */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    जिला लक्ष्योन्मुखीकरण (Target District) *
                  </label>
                  <div className="relative">
                    <select
                      value={selectedDistrict}
                      onChange={(e) => setSelectedDistrict(e.target.value)}
                      className="w-full text-xs px-3 py-2 pl-9 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 bg-white"
                    >
                      {filteredDistricts.map((dist) => (
                        <option key={dist.id} value={dist.id}>
                          {dist.nameHi || dist.nameEn}
                        </option>
                      ))}
                    </select>
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    {filteredDistricts.length} जिले उपलब्ध (मध्य प्रदेश के 55 जिलों से)
                  </span>
                </div>
              </div>

              {/* Edition Title & Safe Identifier */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Edition Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    संस्करण का पूर्ण शीर्षक (Edition Name) *
                  </label>
                  <input
                    type="text"
                    value={editionTitle}
                    onChange={(e) => setEditionTitle(e.target.value)}
                    placeholder="उदा. भोपाल मुख्य राज्य संस्करण - दैनिक ई-पेपर"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Safe Edition Identifier */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    संस्करण पहचानकर्ता (Edition Identifier) *
                  </label>
                  <input
                    type="text"
                    value={editionCode}
                    onChange={(e) => setEditionCode(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="उदा. epaper-bhopal-2026-11-22-daily"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 font-mono text-slate-700"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    अद्वितीय URL एवं सिस्टम पहचानकर्ता (केवल a-z, 0-9, '-')
                  </span>
                </div>
              </div>

              {/* Optional Edition Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  संस्करण विवरण / संपादकीय टिप्पणी (Optional Description)
                </label>
                <textarea
                  rows={2}
                  value={editionDescription}
                  onChange={(e) => setEditionDescription(e.target.value)}
                  placeholder="वैकल्पिक संपादकीय टिप्पणी, विशेष कवरेज निर्देश अथवा संस्करण विवरण..."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>
          ) : (
            /* STEP 2: Page Structure & Template Presets */
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900">{editionTitle}</div>
                  <div className="text-[11px] text-slate-500">
                    पहचानकर्ता: <span className="font-mono font-bold text-blue-700">{editionCode}</span> • भाषा: <span className="font-semibold text-slate-700">{editionLanguage === 'hi' ? 'हिन्दी (Hindi)' : 'English'}</span> • तिथि: {publicationDate} • कुल पृष्ठ: <span className="font-bold text-slate-800">{totalPages}</span> ({editionType === 'DAILY' ? 'दैनिक ब्रॉडशीट - 12 पृष्ठ' : 'विशेष संस्करण'}) • मुद्रण आयाम: 32.9 × 52.0 सेमी
                  </div>
                </div>
                <button
                  type="button"
                  className="text-xs text-blue-600 font-bold flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{editionType === 'DAILY' ? '12-पृष्ठीय मानक ब्रॉडशीट' : `${totalPages}-पृष्ठीय विशेषांक`}</span>
                </button>
              </div>

              <div className="text-xs font-bold text-slate-700 mb-1">
                स्वचालित निर्मित पृष्ठ अनुभाग पूर्वावलोकन (Pre-allocated Page Sections):
              </div>

              {/* Page Rows List */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pageNum = idx + 1;
                  const tpl = DEFAULT_EPAPER_TEMPLATES[idx] || {
                    nameHi: `पृष्ठ ${pageNum} (विशेष परिशिष्ट)`,
                    gridColumns: 8,
                    category: 'SPECIAL',
                  };
                  return (
                    <div
                      key={pageNum}
                      className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between text-xs hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-md bg-slate-100 font-bold text-slate-700 flex items-center justify-center shrink-0">
                          {pageNum}
                        </span>
                        <div>
                          <div className="font-bold text-slate-800">{tpl.nameHi}</div>
                          <div className="text-[10px] text-slate-500">
                            {tpl.category} • {tpl.gridColumns}-कॉलम ग्रिड लेआउट
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {tpl.gridColumns} Columns
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  संस्करण निर्माण के पश्चात आप <strong>संपादकीय समाचार चयन डेस्क</strong> पर जाकर स्वीकृत समाचारों को
                  सीधे इन पृष्ठों पर व्यवस्थित कर सकेंगे। मूल वेब आलेख शत-प्रतिशत सुरक्षित रहेंगे।
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          {step === 1 ? (
            <div>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                रद्द करें
              </button>
            </div>
          ) : (
            <div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-200 flex items-center gap-1 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>वापस (Step 1)</span>
              </button>
            </div>
          )}

          <div>
            {step === 1 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <span>आगे बढ़ें: पृष्ठ संरचना (Next)</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 shadow-2xs transition-colors cursor-pointer"
              >
                {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>संस्करण बनाएं और समाचार चयन डेस्क पर जाएं (Proceed to News Selection) →</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
