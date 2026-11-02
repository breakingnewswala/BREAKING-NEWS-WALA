import React, { useState, useEffect } from 'react';
import {
  Inbox,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  Image,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { CategoryItem, DistrictItem, EditorialArticle } from '../types';
import { fetchArticlesQueue, fetchCategories, fetchDistricts } from '../lib/api';

interface QueueViewProps {
  initialStatus?: string;
  onOpenArticle: (articleId: string) => void;
}

export const QueueView: React.FC<QueueViewProps> = ({
  initialStatus = 'pending_review',
  onOpenArticle,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [breakingOnly, setBreakingOnly] = useState(false);

  const [articles, setArticles] = useState<EditorialArticle[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [districts, setDistricts] = useState<DistrictItem[]>([]);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);

  // 1. Load Taxonomy Metadata
  useEffect(() => {
    async function loadMeta() {
      try {
        const [cats, dists] = await Promise.all([fetchCategories(), fetchDistricts()]);
        setCategories(cats);
        setDistricts(dists);
      } catch {
        // Fallback
      }
    }
    loadMeta();
  }, []);

  // 2. Load Articles Queue from Backend
  const loadQueue = async () => {
    setLoading(true);
    try {
      const res = await fetchArticlesQueue({
        page,
        limit: 15,
        status: statusFilter,
        categoryId: selectedCategory || undefined,
        locationId: selectedLocation || undefined,
        isBreaking: breakingOnly ? true : undefined,
        search: searchTerm.trim() || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      setArticles(res.items);
      setTotalPages(res.totalPages);
      setTotalRecords(res.total);
    } catch {
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, [statusFilter, selectedCategory, selectedLocation, breakingOnly, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadQueue();
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending_review':
        return <span className="badge badge-pending"><Clock size={11} /> लंबित</span>;
      case 'under_review':
        return <span className="badge badge-under-review"><ShieldCheck size={11} /> जांची जा रही</span>;
      case 'revision_requested':
        return <span className="badge badge-revision"><RotateCcw size={11} /> सुधार अनुरोध</span>;
      case 'published':
        return <span className="badge badge-published"><CheckCircle2 size={11} /> प्रकाशित</span>;
      case 'rejected':
        return <span className="badge badge-rejected"><XCircle size={11} /> अस्वीकृत</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <div className="newsroom-content">
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Inbox size={22} color="#344FD6" />
            <span>केंद्रीय समाचार समीक्षा कतार (Incoming Queue)</span>
          </h1>
          <p style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
            कुल {totalRecords} आलेख सूचीबद्ध • सर्वर द्वारा अधिकृत क्षेत्राधिकार अनुसार प्रबंधित
          </p>
        </div>

        <button
          type="button"
          onClick={loadQueue}
          className="btn btn-secondary btn-sm"
          disabled={loading}
          title="कतार रीफ्रेश करें"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>रिफ्रेश</span>
        </button>
      </div>

      {/* Status Navigation Tabs */}
      <div className="tab-list">
        <button
          type="button"
          onClick={() => { setStatusFilter('all'); setPage(1); }}
          className={`tab-btn ${statusFilter === 'all' ? 'active' : ''}`}
        >
          सभी आलेख (All)
        </button>
        <button
          type="button"
          onClick={() => { setStatusFilter('pending_review'); setPage(1); }}
          className={`tab-btn ${statusFilter === 'pending_review' ? 'active' : ''}`}
        >
          नई समीक्षाधीन (Pending)
        </button>
        <button
          type="button"
          onClick={() => { setStatusFilter('under_review'); setPage(1); }}
          className={`tab-btn ${statusFilter === 'under_review' ? 'active' : ''}`}
        >
          जांची जा रही (Under Review)
        </button>
        <button
          type="button"
          onClick={() => { setStatusFilter('revision_requested'); setPage(1); }}
          className={`tab-btn ${statusFilter === 'revision_requested' ? 'active' : ''}`}
        >
          सुधार अनुरोध (Revisions)
        </button>
        <button
          type="button"
          onClick={() => { setStatusFilter('published'); setPage(1); }}
          className={`tab-btn ${statusFilter === 'published' ? 'active' : ''}`}
        >
          प्रकाशित (Published)
        </button>
        <button
          type="button"
          onClick={() => { setStatusFilter('rejected'); setPage(1); }}
          className={`tab-btn ${statusFilter === 'rejected' ? 'active' : ''}`}
        >
          अस्वीकृत (Rejected)
        </button>
      </div>

      {/* Filter and Search Bar */}
      <form onSubmit={handleSearchSubmit} className="filter-bar">
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <input
            type="text"
            placeholder="शीर्षक या मुख्य शब्द द्वारा खोजें..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="filter-input"
            style={{ width: '100%', paddingLeft: '32px' }}
          />
          <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
          className="filter-select"
        >
          <option value="">-- सभी श्रेणियां --</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nameHi}
            </option>
          ))}
        </select>

        <select
          value={selectedLocation}
          onChange={(e) => { setSelectedLocation(e.target.value); setPage(1); }}
          className="filter-select"
        >
          <option value="">-- सभी 55 जिले --</option>
          {districts.map((d) => (
            <option key={d.id} value={d.id}>
              📍 {d.nameHi}
            </option>
          ))}
        </select>

        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: '#1E293B', cursor: 'pointer', backgroundColor: '#FFFFFF', padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1' }}>
          <input
            type="checkbox"
            checked={breakingOnly}
            onChange={(e) => { setBreakingOnly(e.target.checked); setPage(1); }}
            style={{ accentColor: '#ED1727' }}
          />
          <Zap size={14} color="#ED1727" />
          <span>केवल ब्रेकिंग न्यूज़</span>
        </label>

        <button type="submit" className="btn btn-secondary btn-sm">
          <Filter size={14} />
          <span>लागू करें</span>
        </button>
      </form>

      {/* Queue Content Table */}
      <div className="newsroom-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748B', fontSize: '13px' }}>
            <p>आलेख लोड हो रहे हैं...</p>
          </div>
        ) : articles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 20px', color: '#64748B' }}>
            <Inbox size={36} color="#CBD5E1" style={{ margin: '0 auto 10px auto', display: 'block' }} />
            <p style={{ fontWeight: 700, fontSize: '14px', color: '#1E293B' }}>चयनित मानदंडों में कोई आलेख उपलब्ध नहीं है</p>
            <p style={{ fontSize: '12px', marginTop: '4px' }}>कृपया फ़िल्टर रीसेट करें अथवा नई सबमिशन की प्रतीक्षा करें।</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="queue-table">
              <thead>
                <tr>
                  <th style={{ width: '45%' }}>समाचार शीर्षक व संदर्भ</th>
                  <th>स्थिति</th>
                  <th>स्थान व श्रेणी</th>
                  <th>संवाददाता</th>
                  <th>समय</th>
                  <th style={{ textAlign: 'right' }}>कार्रवाई</th>
                </tr>
              </thead>
              <tbody>
                {articles.map((art) => {
                  const timeDisplay = art.submittedAt || art.createdAt
                    ? new Date(art.submittedAt || art.createdAt).toLocaleString('hi-IN', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '-';

                  return (
                    <tr key={art.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                          {art.featuredImageUrl ? (
                            <img
                              src={art.featuredImageUrl}
                              alt="थंबनेल"
                              style={{ width: '48px', height: '36px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #E2E8F0', flexShrink: 0 }}
                            />
                          ) : (
                            <div style={{ width: '48px', height: '36px', backgroundColor: '#F1F5F9', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', flexShrink: 0 }}>
                              <Image size={16} />
                            </div>
                          )}
                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                              {art.isBreaking && (
                                <span className="badge badge-breaking" style={{ fontSize: '10px', padding: '1px 5px' }}>
                                  <Zap size={10} />
                                  <span>ब्रेकिंग</span>
                                </span>
                              )}
                              <span style={{ fontSize: '11px', color: '#64748B' }}>
                                ID: {art.publicId || art.id.slice(0, 8)}
                              </span>
                            </div>
                            <div
                              style={{ fontWeight: 700, color: '#0F172A', cursor: 'pointer', lineHeight: '1.4' }}
                              onClick={() => onOpenArticle(art.id)}
                              title={art.title}
                            >
                              {art.title}
                            </div>
                            {art.subheadline && (
                              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {art.subheadline}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td>{getStatusBadge(art.status)}</td>

                      <td>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#1E293B' }}>
                          📍 {art.primaryLocationNameHi || art.primaryLocationId}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>
                          {art.primaryCategoryNameHi || art.primaryCategoryId}
                        </div>
                      </td>

                      <td>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#1E293B' }}>
                          {art.authorName || 'संवाद सूत्र'}
                        </div>
                      </td>

                      <td style={{ fontSize: '11px', color: '#64748B', whiteSpace: 'nowrap' }}>
                        {timeDisplay}
                      </td>

                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button
                          type="button"
                          onClick={() => onOpenArticle(art.id)}
                          className="btn btn-secondary btn-sm"
                        >
                          <span>डेस्क खोलें</span>
                          <ArrowRight size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Server-Side Pagination Bar */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', backgroundColor: '#F8FAFC', borderTop: '1px solid #E2E8F0', fontSize: '12px' }}>
            <span style={{ color: '#64748B' }}>
              पृष्ठ {page} / {totalPages} (कुल {totalRecords} आलेख)
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="btn btn-secondary btn-sm"
              >
                <ChevronLeft size={14} />
                <span>पिछला</span>
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
                className="btn btn-secondary btn-sm"
              >
                <span>अगला</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

