/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Master Madhya Pradesh Geographic Baseline Data
 * Grounded in docs/06-Business-Rules.md (RULE-LOC-002: MP 55-District Baseline Master Registry)
 * and docs/12-Database.md (DOM-C: Geographical Data & Territories)
 *
 * Divisions: Exactly 10 Administrative Divisions (संभाग)
 * Districts: Exactly 55 Administrative Districts (जिले)
 */

export interface DistrictSeedData {
  nameHi: string;
  nameEn: string;
  slug: string;
  displayOrder: number;
}

export interface DivisionSeedData {
  nameHi: string;
  nameEn: string;
  slug: string;
  displayOrder: number;
  districts: DistrictSeedData[];
}

export const MP_DIVISIONS_AND_DISTRICTS: DivisionSeedData[] = [
  {
    nameHi: 'भोपाल संभाग',
    nameEn: 'Bhopal Division',
    slug: 'bhopal-division',
    displayOrder: 1,
    districts: [
      { nameHi: 'भोपाल', nameEn: 'Bhopal', slug: 'bhopal', displayOrder: 1 },
      { nameHi: 'सीहोर', nameEn: 'Sehore', slug: 'sehore', displayOrder: 2 },
      { nameHi: 'रायसेन', nameEn: 'Raisen', slug: 'raisen', displayOrder: 3 },
      { nameHi: 'राजगढ़', nameEn: 'Rajgarh', slug: 'rajgarh', displayOrder: 4 },
      { nameHi: 'विदिशा', nameEn: 'Vidisha', slug: 'vidisha', displayOrder: 5 },
    ],
  },
  {
    nameHi: 'इंदौर संभाग',
    nameEn: 'Indore Division',
    slug: 'indore-division',
    displayOrder: 2,
    districts: [
      { nameHi: 'इंदौर', nameEn: 'Indore', slug: 'indore', displayOrder: 6 },
      { nameHi: 'धार', nameEn: 'Dhar', slug: 'dhar', displayOrder: 7 },
      { nameHi: 'बड़वानी', nameEn: 'Barwani', slug: 'barwani', displayOrder: 8 },
      { nameHi: 'अलीराजपुर', nameEn: 'Alirajpur', slug: 'alirajpur', displayOrder: 9 },
      { nameHi: 'झाबुआ', nameEn: 'Jhabua', slug: 'jhabua', displayOrder: 10 },
      { nameHi: 'खरगोन (पश्चिम निमाड़)', nameEn: 'Khargone (West Nimar)', slug: 'khargone', displayOrder: 11 },
      { nameHi: 'खंडवा (पूर्वी निमाड़)', nameEn: 'Khandwa (East Nimar)', slug: 'khandwa', displayOrder: 12 },
      { nameHi: 'बुरहानपुर', nameEn: 'Burhanpur', slug: 'burhanpur', displayOrder: 13 },
    ],
  },
  {
    nameHi: 'ग्वालियर संभाग',
    nameEn: 'Gwalior Division',
    slug: 'gwalior-division',
    displayOrder: 3,
    districts: [
      { nameHi: 'ग्वालियर', nameEn: 'Gwalior', slug: 'gwalior', displayOrder: 14 },
      { nameHi: 'शिवपुरी', nameEn: 'Shivpuri', slug: 'shivpuri', displayOrder: 15 },
      { nameHi: 'गुना', nameEn: 'Guna', slug: 'guna', displayOrder: 16 },
      { nameHi: 'अशोकनगर', nameEn: 'Ashoknagar', slug: 'ashoknagar', displayOrder: 17 },
      { nameHi: 'दतिया', nameEn: 'Datia', slug: 'datia', displayOrder: 18 },
    ],
  },
  {
    nameHi: 'जबलपुर संभाग',
    nameEn: 'Jabalpur Division',
    slug: 'jabalpur-division',
    displayOrder: 4,
    districts: [
      { nameHi: 'जबलपुर', nameEn: 'Jabalpur', slug: 'jabalpur', displayOrder: 19 },
      { nameHi: 'कटनी', nameEn: 'Katni', slug: 'katni', displayOrder: 20 },
      { nameHi: 'नरसिंहपुर', nameEn: 'Narsinghpur', slug: 'narsinghpur', displayOrder: 21 },
      { nameHi: 'सिवनी', nameEn: 'Seoni', slug: 'seoni', displayOrder: 22 },
      { nameHi: 'छिंदवाड़ा', nameEn: 'Chhindwara', slug: 'chhindwara', displayOrder: 23 },
      { nameHi: 'मंडला', nameEn: 'Mandla', slug: 'mandla', displayOrder: 24 },
      { nameHi: 'डिंडोरी', nameEn: 'Dindori', slug: 'dindori', displayOrder: 25 },
      { nameHi: 'बालाघाट', nameEn: 'Balaghat', slug: 'balaghat', displayOrder: 26 },
      { nameHi: 'पांढुर्णा', nameEn: 'Pandhurna', slug: 'pandhurna', displayOrder: 27 }, // Formed 2023
    ],
  },
  {
    nameHi: 'उज्जैन संभाग',
    nameEn: 'Ujjain Division',
    slug: 'ujjain-division',
    displayOrder: 5,
    districts: [
      { nameHi: 'उज्जैन', nameEn: 'Ujjain', slug: 'ujjain', displayOrder: 28 },
      { nameHi: 'देवास', nameEn: 'Dewas', slug: 'dewas', displayOrder: 29 },
      { nameHi: 'रतलाम', nameEn: 'Ratlam', slug: 'ratlam', displayOrder: 30 },
      { nameHi: 'शाजापुर', nameEn: 'Shajapur', slug: 'shajapur', displayOrder: 31 },
      { nameHi: 'आगर मालवा', nameEn: 'Agar Malwa', slug: 'agar-malwa', displayOrder: 32 },
      { nameHi: 'मंदसौर', nameEn: 'Mandsaur', slug: 'mandsaur', displayOrder: 33 },
      { nameHi: 'नीमच', nameEn: 'Neemuch', slug: 'neemuch', displayOrder: 34 },
    ],
  },
  {
    nameHi: 'सागर संभाग',
    nameEn: 'Sagar Division',
    slug: 'sagar-division',
    displayOrder: 6,
    districts: [
      { nameHi: 'सागर', nameEn: 'Sagar', slug: 'sagar', displayOrder: 35 },
      { nameHi: 'छतरपुर', nameEn: 'Chhatarpur', slug: 'chhatarpur', displayOrder: 36 },
      { nameHi: 'दमोह', nameEn: 'Damoh', slug: 'damoh', displayOrder: 37 },
      { nameHi: 'पन्ना', nameEn: 'Panna', slug: 'panna', displayOrder: 38 },
      { nameHi: 'टीकमगढ़', nameEn: 'Tikamgarh', slug: 'tikamgarh', displayOrder: 39 },
      { nameHi: 'निवाड़ी', nameEn: 'Niwari', slug: 'niwari', displayOrder: 40 }, // Formed 2018 (Priority Hub)
    ],
  },
  {
    nameHi: 'रीवा संभाग',
    nameEn: 'Rewa Division',
    slug: 'rewa-division',
    displayOrder: 7,
    districts: [
      { nameHi: 'रीवा', nameEn: 'Rewa', slug: 'rewa', displayOrder: 41 },
      { nameHi: 'सतना', nameEn: 'Satna', slug: 'satna', displayOrder: 42 },
      { nameHi: 'सीधी', nameEn: 'Sidhi', slug: 'sidhi', displayOrder: 43 },
      { nameHi: 'सिंगरौली', nameEn: 'Singrauli', slug: 'singrauli', displayOrder: 44 },
      { nameHi: 'मऊगंज', nameEn: 'Mauganj', slug: 'mauganj', displayOrder: 45 }, // Formed 2023
      { nameHi: 'मैहर', nameEn: 'Maihar', slug: 'maihar', displayOrder: 46 }, // Formed 2023
    ],
  },
  {
    nameHi: 'चंबल संभाग',
    nameEn: 'Chambal Division',
    slug: 'chambal-division',
    displayOrder: 8,
    districts: [
      { nameHi: 'मुरैना', nameEn: 'Morena', slug: 'morena', displayOrder: 47 },
      { nameHi: 'भिंड', nameEn: 'Bhind', slug: 'bhind', displayOrder: 48 },
      { nameHi: 'श्योपुर', nameEn: 'Sheopur', slug: 'sheopur', displayOrder: 49 },
    ],
  },
  {
    nameHi: 'नर्मदापुरम संभाग',
    nameEn: 'Narmadapuram Division',
    slug: 'narmadapuram-division',
    displayOrder: 9,
    districts: [
      { nameHi: 'नर्मदापुरम', nameEn: 'Narmadapuram', slug: 'narmadapuram', displayOrder: 50 },
      { nameHi: 'हरदा', nameEn: 'Harda', slug: 'harda', displayOrder: 51 },
      { nameHi: 'बैतूल', nameEn: 'Betul', slug: 'betul', displayOrder: 52 },
    ],
  },
  {
    nameHi: 'शहडोल संभाग',
    nameEn: 'Shahdol Division',
    slug: 'shahdol-division',
    displayOrder: 10,
    districts: [
      { nameHi: 'शहडोल', nameEn: 'Shahdol', slug: 'shahdol', displayOrder: 53 },
      { nameHi: 'अनूपपुर', nameEn: 'Anuppur', slug: 'anuppur', displayOrder: 54 },
      { nameHi: 'उमरिया', nameEn: 'Umaria', slug: 'umaria', displayOrder: 55 },
    ],
  },
];

