/**
 * BREAKING NEWS WALA — Monetization & Revenue Management View
 * Grounded in docs/Monetization.md, docs/06-Business-Rules.md, and docs/DECISIONS.md
 * (DEC-007, DEC-048, DEC-060, DEC-068, DEC-069, DEC-070, RULE-AD-001 to RULE-AD-005, RULE-REWARD-002)
 */

import React, { useState, useEffect } from 'react';
import {
  BadgeIndianRupee,
  Megaphone,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  FileText,
  Users,
  Coins,
  TrendingUp,
  Play,
  Pause,
  ExternalLink,
  RefreshCw,
  Eye,
  MousePointer,
} from 'lucide-react';
import {
  MonetizationDashboardStats,
  AdPlacementSlotConfig,
  AdvertiserItem,
  AdCampaignItem,
  AdCreativeItem,
  InvoiceItem,
  SubscriptionPlanItem,
  ReferralAttributionItem,
} from '../types';
import {
  fetchMonetizationStats,
  fetchAdminPlacementSlots,
  fetchAdminAdvertisers,
  fetchAdminCampaigns,
  fetchAdminCreatives,
  fetchAdminInvoices,
  fetchAdminSubscriptionPlans,
  fetchAdminReferralAttributions,
  approveAdminCampaign,
  rejectAdminCampaign,
  pauseAdminCampaign,
  resumeAdminCampaign,
  approveAdminCreative,
  rejectAdminCreative,
  verifyAdminAdvertiser,
  suspendAdminAdvertiser,
} from '../lib/api';

type MonetizationTab = 'campaigns' | 'creatives' | 'subscriptions' | 'coins_referrals' | 'invoices' | 'analytics';

export const MonetizationView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<MonetizationTab>('campaigns');
  const [stats, setStats] = useState<MonetizationDashboardStats | null>(null);
  const [placementSlots, setPlacementSlots] = useState<AdPlacementSlotConfig[]>([]);
  const [advertisers, setAdvertisers] = useState<AdvertiserItem[]>([]);
  const [campaigns, setCampaigns] = useState<AdCampaignItem[]>([]);
  const [creatives, setCreatives] = useState<AdCreativeItem[]>([]);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlanItem[]>([]);
  const [referrals, setReferrals] = useState<ReferralAttributionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, slots, advs, camps, crs, invs, plns, refs] = await Promise.all([
        fetchMonetizationStats(),
        fetchAdminPlacementSlots(),
        fetchAdminAdvertisers(),
        fetchAdminCampaigns(),
        fetchAdminCreatives(),
        fetchAdminInvoices(),
        fetchAdminSubscriptionPlans(),
        fetchAdminReferralAttributions(),
      ]);
      setStats(s);
      setPlacementSlots(slots);
      setAdvertisers(advs);
      setCampaigns(camps);
      setCreatives(crs);
      setInvoices(invs);
      setPlans(plns);
      setReferrals(refs);
    } catch (err: any) {
      console.error('Error loading monetization data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setActionMessage({ text, type });
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleApproveCampaign = async (id: string) => {
    try {
      await approveAdminCampaign(id, 'प्रशासनिक स्वीकृति प्रदान की गई');
      showNotification('अभियान सफलतापूर्वक स्वीकृत किया गया।');
      loadData();
    } catch (err: any) {
      showNotification(err.message, 'error');
    }
  };

  const handleRejectCampaign = async (id: string) => {
    const reason = prompt('अस्वीकृति का औपचारिक कारण दर्ज करें:');
    if (!reason) return;
    try {
      await rejectAdminCampaign(id, reason);
      showNotification('अभियान अस्वीकृत किया गया।', 'success');
      loadData();
    } catch (err: any) {
      showNotification(err.message, 'error');
    }
  };

  const handleToggleCampaignPause = async (campaign: AdCampaignItem) => {
    try {
      if (campaign.status === 'ACTIVE') {
        await pauseAdminCampaign(campaign.id);
        showNotification('अभियान रोक दिया गया (PAUSED)।');
      } else {
        await resumeAdminCampaign(campaign.id);
        showNotification('अभियान सक्रिय किया गया (ACTIVE)।');
      }
      loadData();
    } catch (err: any) {
      showNotification(err.message, 'error');
    }
  };

  const handleApproveCreative = async (id: string) => {
    try {
      await approveAdminCreative(id);
      showNotification('विज्ञापन क्रिएटिव स्वीकृत किया गया। ASCI मानक मान्य।');
      loadData();
    } catch (err: any) {
      showNotification(err.message, 'error');
    }
  };

  const handleRejectCreative = async (id: string) => {
    const reason = prompt('क्रिएटिव अस्वीकृति का कारण दर्ज करें:');
    if (!reason) return;
    try {
      await rejectAdminCreative(id, reason);
      showNotification('क्रिएटिव अस्वीकृत किया गया।');
      loadData();
    } catch (err: any) {
      showNotification(err.message, 'error');
    }
  };

  const handleVerifyAdvertiser = async (id: string) => {
    try {
      await verifyAdminAdvertiser(id);
      showNotification('विज्ञापनदाता सत्यापित किया गया।');
      loadData();
    } catch (err: any) {
      showNotification(err.message, 'error');
    }
  };

  const handleSuspendAdvertiser = async (id: string) => {
    const reason = prompt('निलंबन का कारण दर्ज करें:');
    if (!reason) return;
    try {
      await suspendAdminAdvertiser(id, reason);
      showNotification('विज्ञापनदाता निलंबित किया गया एवं संबंधित अभियान रोके गए।');
      loadData();
    } catch (err: any) {
      showNotification(err.message, 'error');
    }
  };

  const formatRupees = (paise: number) => {
    return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-6">
      {/* Header & Metrics Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-600/20 text-rose-500 flex items-center justify-center font-bold">
              <BadgeIndianRupee className="w-6 h-6 text-rose-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white font-rozha">व्यावसायिक व मुद्रीकरण प्रबंधन</h1>
              <p className="text-slate-400 text-sm">
                विज्ञापन अभियान, बिलिंग, 18% GST (SAC 998363), गैर-मौद्रिक कॉइन्स एवं विनियामक अनुपालन
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            रीफ्रेश करें
          </button>
        </div>
      </div>

      {actionMessage && (
        <div
          className={`p-4 rounded-lg flex items-center gap-3 text-sm font-medium ${
            actionMessage.type === 'success'
              ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-300'
              : 'bg-rose-950/80 border border-rose-800 text-rose-300'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* High-Level Financial & Inventory Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-medium">सत्यापित विज्ञापन राजस्व</span>
            <BadgeIndianRupee className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-400">
            {formatRupees(stats?.verifiedAdRevenuePaise || 0)}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">18% GST सहित (SAC 998363)</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-medium">सक्रिय अभियान</span>
            <Megaphone className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">
            {stats?.activeCampaignsCount || 0}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">{advertisers.length} पंजीकृत विज्ञापनदाता</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-medium">दृश्य इंप्रेशन (Viewable)</span>
            <Eye className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-blue-400">
            {(stats?.totalImpressionsServed || 0).toLocaleString('en-IN')}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">MRC मानक: ≥50% व्यू, ≥1.0s</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-medium">सत्यापित क्लिक (Anti-Fraud)</span>
            <MousePointer className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-400">
            {(stats?.totalValidClicks || 0).toLocaleString('en-IN')}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">वेग सीमा: अधिकतम 5 क्लिक/मिनट</p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
            activeTab === 'campaigns'
              ? 'bg-rose-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          विज्ञापन प्रबंधन
        </button>

        <button
          onClick={() => setActiveTab('creatives')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
            activeTab === 'creatives'
              ? 'bg-rose-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          स्वीकृति डेस्क (ASCI & नीति)
          {stats?.pendingCreativesCount ? (
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-slate-900 font-bold">
              {stats.pendingCreativesCount}
            </span>
          ) : null}
        </button>

        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
            activeTab === 'subscriptions'
              ? 'bg-rose-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          सदस्यता (DEC-070 स्थगित)
        </button>

        <button
          onClick={() => setActiveTab('coins_referrals')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
            activeTab === 'coins_referrals'
              ? 'bg-rose-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Coins className="w-4 h-4" />
          कॉइन्स व रेफ़रल (DEC-007)
        </button>

        <button
          onClick={() => setActiveTab('invoices')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
            activeTab === 'invoices'
              ? 'bg-rose-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          जीएसटी चालान (SAC 998363)
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
            activeTab === 'analytics'
              ? 'bg-rose-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          राजस्व व प्रदर्शन विश्लेषण
        </button>
      </div>

      {/* Subtab 1: Campaigns & Advertisers */}
      {activeTab === 'campaigns' && (
        <div className="space-y-6">
          {/* Advertisers Registry */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-white">पंजीकृत विज्ञापनदाता व एजेंसियां</h2>
                <p className="text-xs text-slate-400">मध्य प्रदेश के अधिकृत प्रचारक, संस्थाएं एवं उपक्रम</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-800/60 text-xs uppercase text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="py-3 px-4">संस्था / विज्ञापनदाता</th>
                    <th className="py-3 px-4">संपर्क सूत्र</th>
                    <th className="py-3 px-4">GSTIN</th>
                    <th className="py-3 px-4">श्रेणी</th>
                    <th className="py-3 px-4">स्थिति</th>
                    <th className="py-3 px-4 text-right">कार्रवाई</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {advertisers.map((adv) => (
                    <tr key={adv.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-medium text-white">{adv.organizationName}</td>
                      <td className="py-3 px-4">
                        <div>{adv.contactPerson}</div>
                        <div className="text-xs text-slate-500">{adv.phone}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-400">{adv.gstin || 'N/A'}</td>
                      <td className="py-3 px-4 text-xs">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {adv.category}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                            adv.accountStatus === 'active' || adv.accountStatus === 'ACTIVE'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : 'bg-rose-950 text-rose-400 border border-rose-800'
                          }`}
                        >
                          {adv.accountStatus === 'active' || adv.accountStatus === 'ACTIVE' ? 'सक्रिय' : 'निलंबित'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        {adv.verificationStatus !== 'verified' && (
                          <button
                            onClick={() => handleVerifyAdvertiser(adv.id)}
                            className="px-2.5 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white text-xs transition"
                          >
                            सत्यापित करें
                          </button>
                        )}
                        {adv.accountStatus === 'active' || adv.accountStatus === 'ACTIVE' ? (
                          <button
                            onClick={() => handleSuspendAdvertiser(adv.id)}
                            className="px-2.5 py-1 rounded bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white text-xs transition"
                          >
                            निलंबित करें
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Ad Campaigns Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-white">विज्ञापन अभियान सूची</h2>
                <p className="text-xs text-slate-400">सक्रिय एवं निर्धारित प्रचार अभियान</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-800/60 text-xs uppercase text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="py-3 px-4">अभियान नाम</th>
                    <th className="py-3 px-4">विज्ञापनदाता</th>
                    <th className="py-3 px-4">अवधि</th>
                    <th className="py-3 px-4">बजट (खर्च / कुल)</th>
                    <th className="py-3 px-4">स्लॉट्स</th>
                    <th className="py-3 px-4">स्थिति</th>
                    <th className="py-3 px-4 text-right">कार्रवाई</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {campaigns.map((camp) => (
                    <tr key={camp.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{camp.campaignName}</div>
                        <div className="text-xs text-slate-500 truncate max-w-xs">{camp.description}</div>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-300">{camp.advertiserName}</td>
                      <td className="py-3 px-4 text-xs text-slate-400">
                        {new Date(camp.startDate).toLocaleDateString('hi-IN')} से{' '}
                        {new Date(camp.endDate).toLocaleDateString('hi-IN')}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-mono text-xs text-emerald-400">
                          {formatRupees(camp.spentBudgetMinorUnits)} / {formatRupees(camp.totalBudgetMinorUnits)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {camp.selectedPlacements.map((p) => (
                            <span key={p} className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
                              {p}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                            camp.status === 'ACTIVE'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : camp.status === 'PAUSED'
                              ? 'bg-amber-950 text-amber-400 border border-amber-800'
                              : camp.status === 'PENDING_APPROVAL'
                              ? 'bg-blue-950 text-blue-400 border border-blue-800'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {camp.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5">
                        {camp.status === 'PENDING_APPROVAL' && (
                          <>
                            <button
                              onClick={() => handleApproveCampaign(camp.id)}
                              className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition"
                            >
                              स्वीकृत करें
                            </button>
                            <button
                              onClick={() => handleRejectCampaign(camp.id)}
                              className="px-2 py-1 rounded bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white text-xs transition"
                            >
                              अस्वीकृत
                            </button>
                          </>
                        )}
                        {(camp.status === 'ACTIVE' || camp.status === 'PAUSED') && (
                          <button
                            onClick={() => handleToggleCampaignPause(camp)}
                            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                            title={camp.status === 'ACTIVE' ? 'रोकें (Pause)' : 'सक्रिय करें (Resume)'}
                          >
                            {camp.status === 'ACTIVE' ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Subtab 2: Creative Approval Desk */}
      {activeTab === 'creatives' && (
        <div className="space-y-6">
          {/* Policy Compliance Warning Box (RULE-AD-003) */}
          <div className="bg-rose-950/40 border border-rose-800 p-5 rounded-xl text-rose-200">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-6 h-6 text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-base text-rose-300">
                  विज्ञापन संपादकीय नीति एवं ASCI प्रकटीकरण नियम (RULE-AD-001 से RULE-AD-003)
                </h3>
                <p className="text-xs text-rose-300/80 mt-1 leading-relaxed">
                  प्रत्येक क्रिएटिव पर <span className="font-bold text-white">"विज्ञापन"</span> अथवा प्रायोजित पोस्ट पर{' '}
                  <span className="font-bold text-white">"प्रायोजित"</span> का स्थायी प्रकटीकरण अनिवार्य है। निम्न
                  प्रतिबंधित श्रेणियों के विज्ञापन तत्काल अस्वीकृत किए जाएं:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3 text-xs">
                  <div className="bg-rose-900/40 p-2 rounded border border-rose-800/60">❌ सट्टा, ऑनलाइन जुआ व रियल-मनी कैसीनो</div>
                  <div className="bg-rose-900/40 p-2 rounded border border-rose-800/60">❌ 5-मिनट अवैध लोन ऐप्स व अनुचित ब्याज</div>
                  <div className="bg-rose-900/40 p-2 rounded border border-rose-800/60">❌ जादुई उपचार, चमत्कारिक व अप्रमाणित दावे</div>
                  <div className="bg-rose-900/40 p-2 rounded border border-rose-800/60">❌ हथियार, पिस्तौल व घातक उपकरण</div>
                  <div className="bg-rose-900/40 p-2 rounded border border-rose-800/60">❌ तंबाकू, गुटखा एवं शराब (प्रत्यक्ष/सरोगेट)</div>
                  <div className="bg-rose-900/40 p-2 rounded border border-rose-800/60">❌ सामाजिक सौहार्द बिगाड़ने वाली सामग्री</div>
                </div>
              </div>
            </div>
          </div>

          {/* Creatives Desk Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {creatives.map((cr) => (
              <div
                key={cr.id}
                className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between"
              >
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2 py-0.5 rounded text-xs bg-slate-800 text-rose-400 border border-slate-700 font-mono">
                      {cr.adSlotCode}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        cr.isApproved
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}
                    >
                      {cr.isApproved ? 'स्वीकृत (Approved)' : 'समीक्षाधीन (Pending Review)'}
                    </span>
                  </div>

                  {/* ASCI Badge Simulator */}
                  <div className="relative border border-dashed border-slate-700 bg-slate-950 p-4 rounded-lg my-3">
                    <div className="absolute top-2 left-2 bg-slate-800/90 text-rose-400 text-[10px] px-2 py-0.5 rounded border border-rose-500/30 font-bold uppercase tracking-wider">
                      विज्ञापन
                    </div>
                    <div className="pt-5">
                      <div className="font-bold text-white text-base leading-snug">{cr.headlineHi || cr.altText || 'विज्ञापन रचनात्मक'}</div>
                      {cr.bodyTextHi && <p className="text-xs text-slate-400 mt-2 leading-relaxed">{cr.bodyTextHi}</p>}
                      {(cr.creativeMediaUrl || cr.mediaAssetUrl) && (
                        <div className="mt-3 text-xs text-slate-500 font-mono truncate">
                          मीडिया: {cr.creativeMediaUrl || cr.mediaAssetUrl}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 mt-3 pt-3 border-t border-slate-800">
                    <div>
                      आयाम: {cr.width}x{cr.height} px | प्रारूप: {cr.creativeType}
                    </div>
                    <a
                      href={cr.destinationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-rose-400 hover:underline"
                    >
                      गंतव्य URL <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {cr.rejectionReason && (
                    <div className="mt-3 p-2 bg-rose-950/60 border border-rose-800 rounded text-xs text-rose-300">
                      अस्वीकृति टिप्पणी: {cr.rejectionReason}
                    </div>
                  )}
                </div>

                <div className="bg-slate-800/40 p-4 border-t border-slate-800 flex items-center justify-end gap-3">
                  {!cr.isApproved ? (
                    <>
                      <button
                        onClick={() => handleRejectCreative(cr.id)}
                        className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white text-xs font-medium transition"
                      >
                        अस्वीकृत करें
                      </button>
                      <button
                        onClick={() => handleApproveCreative(cr.id)}
                        className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        नीति मान्य — स्वीकृत करें
                      </button>
                    </>
                  ) : (
                    <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                      <CheckCircle2 className="w-4 h-4" /> विज्ञापन सक्रियण हेतु अधिकृत
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subtab 3: Subscription & Entitlements (DEC-070 DEFERRED) */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-6">
          {/* DEC-070 Deferral Advisory Banner */}
          <div className="bg-amber-950/40 border border-amber-800 p-5 rounded-xl text-amber-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-base text-amber-300">
                  स्थापत्य निर्णय DEC-070: सशुल्क पाठक सदस्यता आस्थगित (Deferred — Phase 1/2)
                </h3>
                <p className="text-xs text-amber-300/80 mt-1 leading-relaxed">
                  वर्तमान चरण में जन-पहुंच, नागरिक जुड़ाव एवं विज्ञापन राजस्व मुख्य प्राथमिक लक्ष्य हैं। पाठक सदस्यता
                  मॉडल पूर्णतः परिकल्पित एवं कोडिफाइड है, किंतु वाणिज्यिक चेकआउट (Commercial Payment Ingress) को सक्रिय नहीं
                  किया गया है। पाठक निःशुल्क टियर पर पूर्ण समाचार पढ़ सकते हैं अथवा कॉइन्स के माध्यम से विज्ञापन-मुक्त पास
                  रिडीम कर सकते हैं।
                </p>
              </div>
            </div>
          </div>

          {/* Subscription Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`bg-slate-900 border rounded-xl p-5 flex flex-col justify-between shadow-sm relative ${
                  plan.isCommercialActive
                    ? 'border-emerald-700/60 shadow-emerald-950/20'
                    : 'border-slate-800 opacity-90'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-slate-400 uppercase">{plan.code}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        plan.isCommercialActive
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}
                    >
                      {plan.isCommercialActive ? 'सक्रिय' : 'स्थगित (DEC-070)'}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white font-rozha">{plan.nameHi}</h3>
                  <p className="text-xs text-slate-400 mt-1">{plan.nameEn}</p>

                  <div className="my-4">
                    <div className="text-2xl font-bold text-white">
                      {plan.priceMinorUnits === 0 ? 'निःशुल्क (FREE)' : formatRupees(plan.priceMinorUnits)}
                    </div>
                    <span className="text-xs text-slate-500">/ {plan.billingInterval}</span>
                  </div>

                  <p className="text-xs text-slate-300 mb-4">{plan.descriptionHi}</p>

                  <div className="space-y-1.5 pt-3 border-t border-slate-800">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">शामिल सुविधाएं:</span>
                    {plan.includedFeatures.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800">
                  {plan.isCommercialActive ? (
                    <button className="w-full py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold">
                      डिफ़ॉल्ट सक्रिय टियर
                    </button>
                  ) : (
                    <div className="text-center py-2 px-3 rounded-lg bg-slate-800/80 border border-slate-700 text-[11px] text-amber-300">
                      चेकआउट आस्थगित (DEC-070)
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subtab 4: Coins, Rewards & Referrals (DEC-007, RULE-REWARD-002) */}
      {activeTab === 'coins_referrals' && (
        <div className="space-y-6">
          {/* DEC-007 Non-Monetary Invariant Notice */}
          <div className="bg-indigo-950/40 border border-indigo-800 p-5 rounded-xl text-indigo-200">
            <div className="flex items-start gap-3">
              <Coins className="w-6 h-6 text-indigo-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-base text-indigo-300">
                  सिक्का बहीखाता एवं गैर-मौद्रिक विशेषाधिकार सिद्धांत (DEC-007)
                </h3>
                <p className="text-xs text-indigo-300/80 mt-1 leading-relaxed">
                  BREAKING NEWS WALA कॉइन्स केवल पाठक सहभागिता एवं डिजिटल विशेषाधिकार हेतु हैं।{' '}
                  <span className="font-bold text-white underline">
                    सिक्कों का कोई नकद मूल्य नहीं है, इन्हें बैंक या यूपीआई में निकाला नहीं जा सकता।
                  </span>{' '}
                  सिक्कों का उपयोग 24-घंटे विज्ञापन-मुक्त पास, प्रमाणित पाठक बैज अथवा ई-पेपर अभिलेखागार देखने हेतु किया
                  जा सकता है।
                </p>
              </div>
            </div>
          </div>

          {/* Referral Attributions & Governance Gate */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white">रेफ़रल ट्रैकिंग एवं विनियामक अनुमोदन गेट</h2>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold">
                    RULE-REWARD-002: PENDING APPROVAL
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  रेफ़रल पंजीकरण सक्रिय है, किंतु स्वचालित सिक्का पुरस्कार वितरण कार्यकारी अनुमोदन तक स्थगित है।
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-800/60 text-xs uppercase text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="py-3 px-4">रेफ़रल कोड</th>
                    <th className="py-3 px-4">रेफ़रकर्ता उपयोगकर्ता ID</th>
                    <th className="py-3 px-4">आमंत्रित उपयोगकर्ता ID</th>
                    <th className="py-3 px-4">ट्रैकिंग स्थिति</th>
                    <th className="py-3 px-4">पुरस्कार स्थिति (Governance Gate)</th>
                    <th className="py-3 px-4">समय</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {referrals.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-500 text-xs">
                        वर्तमान में कोई सक्रिय रेफ़रल ट्रैकिंग रिकॉर्ड उपलब्ध नहीं है।
                      </td>
                    </tr>
                  ) : (
                    referrals.map((ref) => (
                      <tr key={ref.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 font-mono font-bold text-rose-400">{ref.referrerCode}</td>
                        <td className="py-3 px-4 font-mono text-xs text-slate-400">{ref.referrerUserId}</td>
                        <td className="py-3 px-4 font-mono text-xs text-slate-400">{ref.referredUserId}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-300 border border-slate-700">
                            {ref.attributionStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-950 text-amber-400 border border-amber-800">
                            pending_governance_approval
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-500">
                          {new Date(ref.referredAt).toLocaleString('hi-IN')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Subtab 5: Billing & GST Invoices */}
      {activeTab === 'invoices' && (
        <div className="space-y-6">
          {/* SAC Code & GST Calculation Rules Banner */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-white text-base">
                  डिजिटल विज्ञापन सेवा चालान मानक (SAC 998363 & 18% GST)
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  मध्य प्रदेश में आंतरिक आपूर्ति (Intrastate MP) पर{' '}
                  <span className="text-emerald-400 font-bold">9% CGST + 9% SGST = 18%</span> तथा अंतरराज्यीय आपूर्ति
                  पर <span className="text-emerald-400 font-bold">18% IGST</span> लागू होता है। सभी गणनाएं पूर्णांक
                  पैसे (minor units) में की जाती हैं।
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 font-mono text-xs text-rose-400 font-bold">
                  SAC CODE: 998363
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 font-mono text-xs text-emerald-400 font-bold">
                  GST: 18.00%
                </span>
              </div>
            </div>
          </div>

          {/* Invoices List */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-800/60 text-xs uppercase text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="py-3 px-4">चालान संख्या (Invoice #)</th>
                    <th className="py-3 px-4">विज्ञापनदाता</th>
                    <th className="py-3 px-4">जारी तिथि / देय तिथि</th>
                    <th className="py-3 px-4">मूल राशि (Subtotal)</th>
                    <th className="py-3 px-4">CGST + SGST (18%)</th>
                    <th className="py-3 px-4">कुल राशि (Total)</th>
                    <th className="py-3 px-4">भुगतान स्थिति</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-mono font-bold text-white">{inv.invoiceNumber}</td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-200">{inv.advertiserName}</div>
                        <div className="text-xs text-slate-500 font-mono">GSTIN: {inv.gstin || 'N/A'}</div>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-400">
                        <div>जारी: {new Date(inv.issueDate).toLocaleDateString('hi-IN')}</div>
                        <div>देय: {new Date(inv.dueDate).toLocaleDateString('hi-IN')}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-300">
                        {formatRupees(inv.subtotalMinorUnits)}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-400">
                        {formatRupees(inv.cgstMinorUnits + inv.sgstMinorUnits + inv.igstMinorUnits)}
                      </td>
                      <td className="py-3 px-4 font-mono text-sm font-bold text-emerald-400">
                        {formatRupees(inv.totalAmountMinorUnits)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                            inv.status === 'PAID'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : 'bg-amber-950 text-amber-400 border border-amber-800'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Subtab 6: Revenue & Performance Analytics */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="font-bold text-white text-base mb-2">सत्यापित राजस्व बनाम प्रक्षेपण</h3>
              <p className="text-xs text-slate-400 mb-4">
                केवल बैंक/गेटवे द्वारा पुष्टि की गई निवल राशि (Excludes mock and non-cash balances)
              </p>
              <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                <div className="text-3xl font-bold text-emerald-400">
                  {formatRupees(stats?.verifiedAdRevenuePaise || 0)}
                </div>
                <div className="mt-2 text-xs text-slate-400">चालू वित्त वर्ष 2026-27 (Q1)</div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="font-bold text-white text-base mb-2">विज्ञापन दृश्यता (Viewability Rate)</h3>
              <p className="text-xs text-slate-400 mb-4">
                MRC वैश्विक मानक: कम से कम 50% पिक्सेल न्यूनतम 1 सेकंड के लिए स्क्रीन पर
              </p>
              <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                <div className="text-3xl font-bold text-blue-400">78.4%</div>
                <div className="mt-2 text-xs text-slate-400">औसत दृश्य अवधि: 2.8 सेकंड</div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="font-bold text-white text-base mb-2">क्लिक थ्रू दर (CTR) एवं बॉट सुरक्षा</h3>
              <p className="text-xs text-slate-400 mb-4">
                फ़्रॉड रोकथाम: प्रति मिनट अधिकतम 5 क्लिक प्रति IP एवं बॉट फ़िल्टर
              </p>
              <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                <div className="text-3xl font-bold text-amber-400">3.00%</div>
                <div className="mt-2 text-xs text-slate-400">अवरुद्ध बॉट अनुरोध: 12,410+</div>
              </div>
            </div>
          </div>

          {/* Ad Placement Inventory Efficiency Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <h3 className="font-bold text-white text-base mb-3">विज्ञापन स्लॉट सूची एवं दर निर्धारण (Rate Card)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-800/60 text-xs uppercase text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="py-3 px-4">स्लॉट कोड</th>
                    <th className="py-3 px-4">विवरण</th>
                    <th className="py-3 px-4">आयाम</th>
                    <th className="py-3 px-4">प्रारूप</th>
                    <th className="py-3 px-4">मूल दर (Base Rate)</th>
                    <th className="py-3 px-4">ज़िला लक्ष्यीकरण</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {placementSlots.map((slot) => {
                    const width = slot.dimensions?.width ?? slot.desktopWidth ?? 728;
                    const height = slot.dimensions?.height ?? slot.desktopHeight ?? 90;
                    const baseRate = slot.baseRatePaise ?? 3500;
                    const pricing = slot.pricingModel ?? 'CPM';

                    return (
                      <tr key={slot.code} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 font-mono font-bold text-rose-400 text-xs">{slot.code}</td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-white">{slot.nameHi}</div>
                          <div className="text-xs text-slate-400">{slot.descriptionHi || slot.location || ''}</div>
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-slate-300">
                          {width}x{height}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-1">
                            {slot.supportedCreativeTypes.map((t) => (
                              <span key={t} className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
                                {t}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-emerald-400">
                          {formatRupees(baseRate)} ({pricing})
                        </td>
                        <td className="py-3 px-4 text-xs">
                          {slot.requiresDistrictTargeting ? (
                            <span className="text-amber-400 font-semibold">अनिवार्य (55 ज़िले)</span>
                          ) : (
                            <span className="text-slate-500">वैकल्पिक / राज्यव्यापी</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
