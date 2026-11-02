/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Master Constants, Category Taxonomies & Geographic Registry
 * Grounded in docs/01-PRD.md Section 12.1, docs/07-Design.md, and docs/08-Sitemap.md
 */

export const SITE_CONFIG = {
  name: 'BREAKING NEWS WALA',
  nameHi: 'ब्रेकिंग न्यूज़ वाला',
  taglineHi: 'भारत के जिलों से, आपके दिलों तक',
  taglineSub: 'मध्य प्रदेश का सबसे तेज़ और विश्वसनीय हाइपरलोकल डिजिटल न्यूज़ नेटवर्क',
  baseUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://breakingnewswala.com',
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3000/api/v1',
  logoPath: '/brand/logo.png',
  locale: 'hi_IN',
  stateFocus: 'मध्य प्रदेश (Madhya Pradesh)',
  grievanceOfficer: {
    name: 'संजय कुमार पाठक (Grievance Redressal Officer)',
    designation: 'शिकायत निवारण अधिकारी (IT Rules 2021)',
    email: 'grievance@breakingnewswala.com',
    phone: '+91 755 2400100',
    address: 'प्रेस कॉम्प्लेक्स, एमपी नगर ज़ोन-1, भोपाल, मध्य प्रदेश - 462011',
  },
  statutoryGrievance: {
    officerName: 'संजय कुमार पाठक',
    designation: 'Grievance Redressal Officer (IT Rules 2021)',
    email: 'grievance@breakingnewswala.com',
    regulatoryJurisdiction: 'Madhya Pradesh, India',
    rulesCompliance: 'IT Rules 2021',
  },
  brandColors: {
    primaryRed: '#ED1727',
    accentYellow: '#FDE900',
    deepBlue: '#344FD6',
    midnight: '#111827',
    charcoal: '#1F2937',
  },
};

/**
 * The 21 Canonical Approved PRD Categories (docs/01-PRD.md & docs/08-Sitemap.md Section 5.1)
 */
export const CANONICAL_CATEGORIES = [
  { id: 'top-news', nameHi: 'टॉप न्यूज़', nameEn: 'Top News', slug: 'top-news', isPrimary: true },
  { id: 'latest-news', nameHi: 'ताज़ा खबरें', nameEn: 'Latest News', slug: 'latest-news', isPrimary: true },
  { id: 'madhya-pradesh', nameHi: 'मध्य प्रदेश', nameEn: 'Madhya Pradesh', slug: 'madhya-pradesh', isPrimary: true },
  { id: 'state-news', nameHi: 'राज्य समाचार', nameEn: 'State News', slug: 'state-news', isPrimary: true },
  { id: 'national', nameHi: 'देश', nameEn: 'National', slug: 'national', isPrimary: true },
  { id: 'international', nameHi: 'विदेश', nameEn: 'International', slug: 'international', isPrimary: true },
  { id: 'politics', nameHi: 'राजनीति', nameEn: 'Politics', slug: 'politics', isPrimary: true },
  { id: 'business', nameHi: 'बिजनेस', nameEn: 'Business', slug: 'business', isPrimary: true },
  { id: 'sports', nameHi: 'खेल', nameEn: 'Sports', slug: 'sports', isPrimary: true },
  { id: 'entertainment', nameHi: 'मनोरंजन', nameEn: 'Entertainment', slug: 'entertainment', isPrimary: true },
  { id: 'education', nameHi: 'शिक्षा', nameEn: 'Education', slug: 'education', isPrimary: true },
  { id: 'jobs-career', nameHi: 'करियर एवं रोजगार', nameEn: 'Jobs & Career', slug: 'jobs-career', isPrimary: true },
  { id: 'technology', nameHi: 'टेक्नोलॉजी', nameEn: 'Technology', slug: 'technology', isPrimary: true },
  { id: 'automobile', nameHi: 'ऑटोमोबाइल', nameEn: 'Automobile', slug: 'automobile', isPrimary: true },
  { id: 'religion-spirituality', nameHi: 'धर्म एवं अध्यात्म', nameEn: 'Religion & Spirituality', slug: 'religion-spirituality', isPrimary: true },
  { id: 'lifestyle', nameHi: 'लाइफस्टाइल', nameEn: 'Lifestyle', slug: 'lifestyle', isPrimary: true },
  { id: 'health', nameHi: 'स्वास्थ्य', nameEn: 'Health', slug: 'health', isPrimary: true },
  { id: 'horoscope', nameHi: 'राशिफल', nameEn: 'Horoscope', slug: 'horoscope', isPrimary: true },
  { id: 'opinion', nameHi: 'ओपिनियन', nameEn: 'Opinion', slug: 'opinion', isPrimary: true },
  { id: 'crime', nameHi: 'क्राइम', nameEn: 'Crime', slug: 'crime', isPrimary: true },
  { id: 'viral-news', nameHi: 'वायरल न्यूज़', nameEn: 'Viral News', slug: 'viral-news', isPrimary: true },
] as const;

/**
 * Madhya Pradesh 10 Administrative Divisions & 55 Districts Summary
 */
export const MP_DIVISIONS_AND_DISTRICTS = [
  {
    divisionSlug: 'bhopal',
    divisionNameHi: 'भोपाल संभाग',
    districts: [
      { slug: 'bhopal', nameHi: 'भोपाल', isPriorityHub: true },
      { slug: 'raisen', nameHi: 'रायसेन' },
      { slug: 'rajgarh', nameHi: 'राजगढ़' },
      { slug: 'sehore', nameHi: 'सीहोर' },
      { slug: 'vidisha', nameHi: 'विदिशा' },
    ],
  },
  {
    divisionSlug: 'indore',
    divisionNameHi: 'इंदौर संभाग',
    districts: [
      { slug: 'indore', nameHi: 'इंदौर', isPriorityHub: true },
      { slug: 'alirajpur', nameHi: 'आलीराजपुर' },
      { slug: 'barwani', nameHi: 'बड़वानी' },
      { slug: 'burhanpur', nameHi: 'बुरहानपुर' },
      { slug: 'dhar', nameHi: 'धार' },
      { slug: 'jhabua', nameHi: 'झाबुआ' },
      { slug: 'khandwa', nameHi: 'खंडवा' },
      { slug: 'khargone', nameHi: 'खरगोन' },
    ],
  },
  {
    divisionSlug: 'gwalior',
    divisionNameHi: 'ग्वालियर संभाग',
    districts: [
      { slug: 'gwalior', nameHi: 'ग्वालियर', isPriorityHub: true },
      { slug: 'ashoknagar', nameHi: 'अशोकनगर' },
      { slug: 'datia', nameHi: 'दतिया' },
      { slug: 'guna', nameHi: 'गुना' },
      { slug: 'shivpuri', nameHi: 'शिवपुरी' },
    ],
  },
  {
    divisionSlug: 'jabalpur',
    divisionNameHi: 'जबलपुर संभाग',
    districts: [
      { slug: 'jabalpur', nameHi: 'जबलपुर', isPriorityHub: true },
      { slug: 'balaghat', nameHi: 'बालाघाट' },
      { slug: 'chhindwara', nameHi: 'छिंदवाड़ा' },
      { slug: 'dindori', nameHi: 'डिंडौरी' },
      { slug: 'katni', nameHi: 'कटनी' },
      { slug: 'mandla', nameHi: 'मंडला' },
      { slug: 'narsinghpur', nameHi: 'नरसिंहपुर' },
      { slug: 'seoni', nameHi: 'सिवनी' },
      { slug: 'pandhurna', nameHi: 'पांढुर्णा', isNewlyFormed: true },
    ],
  },
  {
    divisionSlug: 'ujjain',
    divisionNameHi: 'उज्जैन संभाग',
    districts: [
      { slug: 'ujjain', nameHi: 'उज्जैन', isPriorityHub: true },
      { slug: 'agar-malwa', nameHi: 'आगर मालवा' },
      { slug: 'dewas', nameHi: 'देवास' },
      { slug: 'mandsaur', nameHi: 'मंदसौर' },
      { slug: 'neemuch', nameHi: 'नीमच' },
      { slug: 'ratlam', nameHi: 'रतलाम' },
      { slug: 'shajapur', nameHi: 'शाजापुर' },
    ],
  },
  {
    divisionSlug: 'sagar',
    divisionNameHi: 'सागर संभाग',
    districts: [
      { slug: 'sagar', nameHi: 'सागर' },
      { slug: 'chhatarpur', nameHi: 'छतरपुर' },
      { slug: 'damoh', nameHi: 'दमोह' },
      { slug: 'panna', nameHi: 'पन्ना' },
      { slug: 'tikamgarh', nameHi: 'टीकमगढ़' },
      { slug: 'niwari', nameHi: 'निवाड़ी', isPriorityHub: true, isNewlyFormed: true },
    ],
  },
  {
    divisionSlug: 'rewa',
    divisionNameHi: 'रीवा संभाग',
    districts: [
      { slug: 'rewa', nameHi: 'रीवा' },
      { slug: 'satna', nameHi: 'सतना' },
      { slug: 'sidhi', nameHi: 'सीधी' },
      { slug: 'singrauli', nameHi: 'सिंगरौली' },
      { slug: 'mauganj', nameHi: 'मऊगंज', isNewlyFormed: true },
      { slug: 'maihar', nameHi: 'मैहर', isNewlyFormed: true },
    ],
  },
  {
    divisionSlug: 'narmadapuram',
    divisionNameHi: 'नर्मदापुरम संभाग',
    districts: [
      { slug: 'narmadapuram', nameHi: 'नर्मदापुरम' },
      { slug: 'betul', nameHi: 'बैतूल' },
      { slug: 'harda', nameHi: 'हरदा' },
    ],
  },
  {
    divisionSlug: 'chambal',
    divisionNameHi: 'चंबल संभाग',
    districts: [
      { slug: 'morena', nameHi: 'मुरैना' },
      { slug: 'bhind', nameHi: 'भिंड' },
      { slug: 'sheopur', nameHi: 'श्योपुर' },
    ],
  },
  {
    divisionSlug: 'shahdol',
    divisionNameHi: 'शहडोल संभाग',
    districts: [
      { slug: 'shahdol', nameHi: 'शहडोल' },
      { slug: 'anuppur', nameHi: 'अनूपपुर' },
      { slug: 'umaria', nameHi: 'उमरिया' },
    ],
  },
];

/**
 * Priority Hub Districts for Quick Nav Pills
 */
export const PRIORITY_DISTRICT_HUBS = [
  { slug: 'niwari', nameHi: 'निवाड़ी' },
  { slug: 'bhopal', nameHi: 'भोपाल' },
  { slug: 'indore', nameHi: 'इंदौर' },
  { slug: 'jabalpur', nameHi: 'जबलपुर' },
  { slug: 'gwalior', nameHi: 'ग्वालियर' },
  { slug: 'ujjain', nameHi: 'उज्जैन' },
  { slug: 'rewa', nameHi: 'रीवा' },
  { slug: 'sagar', nameHi: 'सागर' },
];
