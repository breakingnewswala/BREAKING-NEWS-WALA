import React, { useState } from 'react';
import { CheckSquare, AlertCircle, ShieldAlert } from 'lucide-react';
import { FactCheckItem } from '../types';

interface FactCheckWorkspaceProps {
  onVerificationChange?: (allChecked: boolean, checkedCount: number, notes: string) => void;
}

export const DEFAULT_FACT_CHECK_ITEMS: Omit<FactCheckItem, 'isChecked'>[] = [
  {
    id: 1,
    titleHi: '1. प्राथमिक स्रोत व प्रत्यक्षदर्शी पुष्टि (Source Verification)',
    descriptionHi: 'संवाददाता द्वारा मौके से प्रत्यक्षदर्शी अथवा घटना स्थल पर उपस्थित मूल स्रोत से सीधे पुष्टि की गई है।',
  },
  {
    id: 2,
    titleHi: '2. भौगोलिक लोकेशन व जिला क्षेत्राधिकार (Location Verification)',
    descriptionHi: 'घटना स्थल संबंधित जिले व संभाग के अधिकार क्षेत्र में है तथा रिपोर्टर का बीट असाइनमेंट वैध है।',
  },
  {
    id: 3,
    titleHi: '3. दिनांक व समय की प्रामाणिकता (Date & Time Validity)',
    descriptionHi: 'घटना का समय व तारीख हालिया है, पुरानी या पूर्व में घटित घटना को आज का बताकर प्रस्तुत नहीं किया गया है।',
  },
  {
    id: 4,
    titleHi: '4. आधिकारिक प्रशासनिक/पुलिस बयान (Official Statement)',
    descriptionHi: 'संबंधित थाना प्रभारी, जिला कलेक्टर, एसपी अथवा सक्षम प्राधिकारी का आधिकारिक पक्ष शामिल है।',
  },
  {
    id: 5,
    titleHi: '5. फोटो व वीडियो प्रामाणिकता (Media Authenticity & Anti-Deepfake)',
    descriptionHi: 'संलग्न मीडिया उसी घटना की वास्तविक फुटेज है; अन्य इंटरनेट स्रोतों, एआई डीपफेक या पुरानी तस्वीरों से मिलान नहीं है।',
  },
  {
    id: 6,
    titleHi: '6. आधिकारिक दस्तावेज अथवा एफआईआर प्रति (Supporting Documents)',
    descriptionHi: 'संवदेनशील या कानूनी मामलों में एफआईआर प्रति, सरकारी आदेश या ज्ञापन का आधिकारिक रिकॉर्ड संलग्न/सत्यापित है।',
  },
  {
    id: 7,
    titleHi: '7. निष्पक्षता व दूसरे पक्ष का पक्ष (Balance & Right of Reply)',
    descriptionHi: 'आरोप-प्रत्यारोप की स्थिति में आरोपी पक्ष का दृष्टिकोण अथवा उनसे संपर्क के प्रयास का स्पष्ट उल्लेख है।',
  },
  {
    id: 8,
    titleHi: '8. मानहानि व न्यायालय अवमानना जांच (Defamation & Legal Filter)',
    descriptionHi: 'खबर में किसी नागरिक, समुदाय या विचाराधीन न्यायिक मामले पर असत्यापित या अवमाननाकारी आरोप नहीं हैं।',
  },
  {
    id: 9,
    titleHi: '9. शीर्षक की गंभीरता व सटीकता (Headline Proportionality)',
    descriptionHi: 'शीर्षक भ्रामक या क्लिकबेट नहीं है और समाचार के वास्तविक तथ्यों का निष्पक्ष प्रतिनिधित्व करता है।',
  },
  {
    id: 10,
    titleHi: '10. भाषा शैली व प्रेस आचार संहिता (PCI Ethical Code Compliance)',
    descriptionHi: 'प्रेस काउंसिल ऑफ इंडिया के दिशा-निर्देशों एवं पोक्सो/पीड़ित पहचान सुरक्षा कानूनों का पूर्ण अनुपालन है।',
  },
];

export const FactCheckWorkspace: React.FC<FactCheckWorkspaceProps> = ({ onVerificationChange }) => {
  const [items, setItems] = useState<FactCheckItem[]>(
    DEFAULT_FACT_CHECK_ITEMS.map((item) => ({ ...item, isChecked: false }))
  );
  const [factCheckNotes, setFactCheckNotes] = useState('');

  const handleToggle = (id: number) => {
    const updated = items.map((it) => (it.id === id ? { ...it, isChecked: !it.isChecked } : it));
    setItems(updated);

    const checkedCount = updated.filter((it) => it.isChecked).length;
    const allChecked = checkedCount === updated.length;
    if (onVerificationChange) {
      onVerificationChange(allChecked, checkedCount, factCheckNotes);
    }
  };

  const handleNotesChange = (text: string) => {
    setFactCheckNotes(text);
    const checkedCount = items.filter((it) => it.isChecked).length;
    const allChecked = checkedCount === items.length;
    if (onVerificationChange) {
      onVerificationChange(allChecked, checkedCount, text);
    }
  };

  const checkedCount = items.filter((it) => it.isChecked).length;
  const isComplete = checkedCount === items.length;

  return (
    <div className="fact-check-box">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckSquare size={18} color="#059669" />
          <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
            10-सूत्रीय तथ्य-जांच सत्यापन डेस्क (10-Point Fact-Checking Protocol)
          </h3>
        </div>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            padding: '3px 10px',
            borderRadius: '20px',
            backgroundColor: isComplete ? '#D1FAE5' : '#FEF3C7',
            color: isComplete ? '#065F46' : '#92400E',
          }}
        >
          {checkedCount} / 10 बिंदु सत्यापित
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: '#FFFBEB',
          border: '1px solid #FCD34D',
          borderRadius: '6px',
          padding: '8px 12px',
          fontSize: '12px',
          color: '#92400E',
          marginBottom: '14px',
        }}
      >
        <AlertCircle size={15} />
        <span>
          <strong>संपादकीय प्रोटोकॉल:</strong> यह चेकलिस्ट संपादकीय निर्णय सहायता है। केवल अधिकृत डेस्क संपादक द्वारा सत्यापन के पश्चात ही आलेख अनुमोदन योग्य होगा।
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {items.map((item) => (
          <label key={item.id} className="fact-item" style={{ cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={item.isChecked}
              onChange={() => handleToggle(item.id)}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: item.isChecked ? 700 : 600, color: item.isChecked ? '#065F46' : '#1E293B' }}>
                {item.titleHi}
              </div>
              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                {item.descriptionHi}
              </div>
            </div>
          </label>
        ))}
      </div>

      <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #E2E8F0' }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1E293B', marginBottom: '6px' }}>
          संपादक तथ्य-जांच टिप्पणी व स्रोत प्रमाण (Fact-Check Verification Notes):
        </label>
        <textarea
          rows={3}
          placeholder="उदा. जिला कलेक्टर कार्यालय से 14:30 बजे फोन पर पुष्टि की गई; ओरछा पुलिस एफआईआर क्रमांक 124/26 सत्यापित..."
          value={factCheckNotes}
          onChange={(e) => handleNotesChange(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            fontSize: '12px',
            border: '1px solid #CBD5E1',
            borderRadius: '6px',
            fontFamily: 'inherit',
          }}
        />
      </div>

      {!isComplete && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', color: '#B45309', fontSize: '11px' }}>
          <ShieldAlert size={14} />
          <span>ध्यान दें: संपादकीय प्रकाशन से पूर्व सभी आवश्यक बिंदुओं का सत्यापन अनुशंसित है।</span>
        </div>
      )}
    </div>
  );
};
