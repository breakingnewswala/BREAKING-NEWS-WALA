import React, { useState } from 'react';
import {
  Award,
  Sparkles,
  Plus,
  Coins,
  Search,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  Send,
  History,
  RotateCcw,
} from 'lucide-react';
import { ReporterProfile } from '../../types';

export interface ReporterCoinManagementDeskProps {
  reporters: ReporterProfile[];
  onUpdateReporterCoins?: (reporterId: string, amountDelta: number, reason: string) => void;
}

export const ReporterCoinManagementDesk: React.FC<ReporterCoinManagementDeskProps> = ({
  reporters,
  onUpdateReporterCoins,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReporter, setSelectedReporter] = useState<ReporterProfile | null>(null);
  const [customCoins, setCustomCoins] = useState<number>(100);
  const [coinReason, setCoinReason] = useState<string>('ब्रेकिंग न्यूज़ विशेष इनसेंटिव');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // In-memory reporter coin balances initialized from totalPoints or mock defaults
  const [reporterBalances, setReporterBalances] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    reporters.forEach((r, idx) => {
      initial[r.id] = (r.totalStoriesPublished || 10) * 15 + ((idx * 85) % 350);
    });
    return initial;
  });

  const [transactionLog, setTransactionLog] = useState<
    Array<{ id: string; reporterName: string; amount: number; reason: string; timestamp: string }>
  >([
    {
      id: 'tx-1',
      reporterName: 'राजेश पटेल',
      amount: 100,
      reason: 'ई-उपार्जन पोर्टल एक्सक्लूसिव ग्राउंड रिपोर्ट पुरस्कार',
      timestamp: 'आज, 10:45 AM',
    },
    {
      id: 'tx-2',
      reporterName: 'संजय वर्मा',
      amount: 50,
      reason: 'इंदौर मेट्रो स्पीड ट्रायल तत्काल ब्रेकिंग फाइलिंग',
      timestamp: 'आज, 09:12 AM',
    },
    {
      id: 'tx-3',
      reporterName: 'दीपक जोशी',
      amount: 150,
      reason: 'उज्जैन महाकाल महालोक एआई क्राउड कवरेज',
      timestamp: 'कल, 06:30 PM',
    },
  ]);

  const filteredReporters = reporters.filter((r) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      r.assignedDistricts.some((d) => d.toLowerCase().includes(q)) ||
      (r.badgeNumber && r.badgeNumber.toLowerCase().includes(q))
    );
  });

  const totalCoinsInCirculation = Object.values(reporterBalances).reduce((a, b) => a + b, 0);

  const handleAwardCoins = (reporterId: string, amount: number, reason: string) => {
    const rep = reporters.find((r) => r.id === reporterId);
    if (!rep) return;

    setReporterBalances((prev) => ({
      ...prev,
      [reporterId]: (prev[reporterId] || 0) + amount,
    }));

    const newTx = {
      id: `tx-${Date.now()}`,
      reporterName: rep.name,
      amount,
      reason,
      timestamp: 'अभी-अभी',
    };

    setTransactionLog((prev) => [newTx, ...prev]);
    onUpdateReporterCoins?.(reporterId, amount, reason);

    setToastMessage(`संवाददाता ${rep.name} के वॉलेट में +${amount} कॉइन्स सफलतापूर्वक जमा किए गए!`);
    setTimeout(() => setToastMessage(null), 4000);
    setSelectedReporter(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 text-white p-6 rounded-2xl shadow-md border border-amber-500">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 backdrop-blur-xs rounded-xl border border-white/30 text-white shrink-0">
              <Coins className="w-6 h-6 text-yellow-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black font-news-hero tracking-tight">
                  संवाददाता कॉइन व वॉलेट प्रबंधन (Reporter Coin Management Desk)
                </h2>
                <span className="px-2 py-0.5 bg-slate-950 text-amber-300 text-[10px] font-black rounded-full uppercase">
                  मास्टर एडमिनिस्ट्रेशन
                </span>
              </div>
              <p className="text-xs text-amber-100 mt-0.5">
                फील्ड स्ट्रिंगर्स व जिला संवाददाताओं के लिए पारिश्रमिक, स्टोरी इंसेंटिव व वॉलेट रिचार्ज नियंत्रण कक्ष
              </p>
            </div>
          </div>

          <div className="bg-slate-950/40 backdrop-blur-xs px-4 py-2.5 rounded-xl border border-white/20 text-right">
            <span className="text-[10px] uppercase font-bold text-amber-200 block">कुल वितरित संवाददाता कॉइन्स</span>
            <div className="text-2xl font-black text-amber-300">
              {totalCoinsInCirculation.toLocaleString('hi-IN')} <span className="text-xs font-semibold">सिक्के</span>
            </div>
          </div>
        </div>

        {/* Notice about Governance */}
        <div className="mt-4 bg-slate-950/50 border border-amber-300/30 rounded-lg p-2.5 flex items-center gap-2 text-xs text-amber-100">
          <ShieldCheck className="w-4 h-4 text-amber-300 shrink-0" />
          <span>
            <strong>गवर्नेंस नियम:</strong> मास्टर एडमिन या पाठकों के लिए व्यक्तिगत कॉइन वॉलेट नहीं है। कॉइन व्यवस्था पूर्णतः फील्ड संवाददाताओं के स्टोरी कंट्रीब्यूशन व परफॉर्मेंस इंसेंटिव हेतु समर्पित है।
          </span>
        </div>

        {/* Toast */}
        {toastMessage && (
          <div className="mt-3 p-3 bg-emerald-700/90 border border-emerald-400 rounded-xl text-xs font-bold text-white flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-white hover:text-emerald-200">
              ✕
            </button>
          </div>
        )}
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">पंजीकृत संवाददाता</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{reporters.length}</div>
          <span className="text-[11px] text-emerald-600 font-bold mt-1 block">55 जिलों में सक्रिय वॉलेट्स</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">औसत संवाददाता बैलेंस</span>
          <div className="text-2xl font-black text-indigo-700 mt-1">
            {Math.round(totalCoinsInCirculation / Math.max(1, reporters.length))}
          </div>
          <span className="text-[11px] text-slate-500 font-bold mt-1 block">सिक्के प्रति स्ट्रिंगर</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">रिडीम / पेआउट दर</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">₹1 = 2 सिक्के</div>
          <span className="text-[11px] text-slate-500 font-bold mt-1 block">मानक रिपोर्टर पेआउट एक्सचेंज</span>
        </div>
      </div>

      {/* Reporters Table with Coin Controls */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">संवाददाता वॉलेट्स व कॉइन बैलेंस सूची</h3>
            <p className="text-xs text-slate-500">संवाददाता को चुनें और सीधे इंसेंटिव कॉइन्स आवंटित करें</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="संवाददाता या जिला खोजें..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <th className="py-3 px-4">संवाददाता</th>
                <th className="py-3 px-3">आवंटित जिले</th>
                <th className="py-3 px-3">प्रकाशित खबरें</th>
                <th className="py-3 px-3">वर्तमान कॉइन बैलेंस</th>
                <th className="py-3 px-4 text-right">त्वरित कॉइन आवंटन</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReporters.map((rep) => {
                const balance = reporterBalances[rep.id] || 0;
                return (
                  <tr key={rep.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={rep.avatar}
                          alt={rep.name}
                          className="w-9 h-9 rounded-full object-cover border border-slate-300 shrink-0"
                        />
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{rep.name}</div>
                          <span className="text-[10px] text-slate-500">{rep.badgeNumber} • {rep.phone}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1">
                        {rep.assignedDistricts.slice(0, 3).map((d) => (
                          <span key={d} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 font-bold rounded text-[10px]">
                            {d}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3 px-3 font-semibold text-slate-700">
                      {rep.totalStoriesPublished} खबरें
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base font-black text-amber-600">
                          {balance.toLocaleString('hi-IN')}
                        </span>
                        <span className="text-[11px] font-bold text-slate-500">कॉइन्स</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleAwardCoins(rep.id, 50, 'ब्रेकिंग न्यूज़ तत्काल पुरस्कार')}
                          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-800 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          +50
                        </button>
                        <button
                          onClick={() => handleAwardCoins(rep.id, 100, 'एक्सक्लूसिव इन्वेस्टिगेशन पुरस्कार')}
                          className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 border border-amber-400 text-amber-900 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          +100
                        </button>
                        <button
                          onClick={() => setSelectedReporter(rep)}
                          className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          कस्टम रिचार्ज
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Coin Transaction Log */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-amber-600" />
            <h3 className="font-bold text-slate-900 text-sm">हालिया कॉइन आवंटन व इंसेंटिव इतिहास</h3>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">रीयल-टाइम ऑडिट लॉग</span>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {transactionLog.map((tx) => (
            <div key={tx.id} className="py-2.5 flex items-center justify-between gap-3">
              <div>
                <span className="font-bold text-slate-900">{tx.reporterName}</span>
                <p className="text-[11px] text-slate-500 mt-0.5">{tx.reason}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="font-black text-emerald-600 text-sm">+{tx.amount} सिक्के</span>
                <span className="block text-[10px] text-slate-400">{tx.timestamp}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Recharge Modal */}
      {selectedReporter && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  {selectedReporter.name} को कॉइन्स आवंटित करें
                </h3>
              </div>
              <button
                onClick={() => setSelectedReporter(null)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">सिक्कों की संख्या (Coins Amount)</label>
                <input
                  type="number"
                  min="10"
                  step="10"
                  value={customCoins}
                  onChange={(e) => setCustomCoins(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-bold text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">आवंटन का कारण / विवरण (Reason)</label>
                <input
                  type="text"
                  value={coinReason}
                  onChange={(e) => setCoinReason(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  placeholder="उदा. ग्राउंड रिपोर्टिंग इनसेंटिव, ब्रेकिंग कवरेज"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px]">
                यह कॉइन्स तुरंत संवाददाता के डिजिटल वॉलेट में प्रतिबिंबित होंगे तथा वे इसे मासिक भुगतान के समय नकद पारिश्रमिक में भुना सकेंगे।
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => setSelectedReporter(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer"
                >
                  रद्द करें
                </button>
                <button
                  onClick={() => handleAwardCoins(selectedReporter.id, customCoins, coinReason)}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-sm cursor-pointer"
                >
                  कॉइन्स आवंटित करें
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};