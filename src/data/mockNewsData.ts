import { ArticleDetail, CategoryItem, DistrictItem, DivisionItem, EpaperEdition } from '../types';

export const DIVISIONS: DivisionItem[] = [
  { id: 'div-bhopal', nameHi: 'भोपाल संभाग', nameEn: 'Bhopal Division', headquarters: 'भोपाल' },
  { id: 'div-indore', nameHi: 'इंदौर संभाग', nameEn: 'Indore Division', headquarters: 'इंदौर' },
  { id: 'div-gwalior', nameHi: 'ग्वालियर संभाग', nameEn: 'Gwalior Division', headquarters: 'ग्वालियर' },
  { id: 'div-jabalpur', nameHi: 'जबलपुर संभाग', nameEn: 'Jabalpur Division', headquarters: 'जबलपुर' },
  { id: 'div-ujjain', nameHi: 'उज्जैन संभाग', nameEn: 'Ujjain Division', headquarters: 'उज्जैन' },
  { id: 'div-sagar', nameHi: 'सागर संभाग', nameEn: 'Sagar Division', headquarters: 'सागर' },
  { id: 'div-rewa', nameHi: 'रीवा संभाग', nameEn: 'Rewa Division', headquarters: 'रीवा' },
  { id: 'div-shahdol', nameHi: 'शहडोल संभाग', nameEn: 'Shahdol Division', headquarters: 'शहडोल' },
  { id: 'div-chambal', nameHi: 'चंबल संभाग', nameEn: 'Chambal Division', headquarters: 'मुरैना' },
  { id: 'div-narmadapuram', nameHi: 'नर्मदापुरम संभाग', nameEn: 'Narmadapuram Division', headquarters: 'नर्मदापुरम' },
];

export const DISTRICTS: DistrictItem[] = [
  // Bhopal Division
  { id: 'dist-bhopal', slug: 'bhopal', nameEn: 'Bhopal', nameHi: 'भोपाल', divisionId: 'div-bhopal', stateId: 'state-mp' },
  { id: 'dist-sehore', slug: 'sehore', nameEn: 'Sehore', nameHi: 'सीहोर', divisionId: 'div-bhopal', stateId: 'state-mp' },
  { id: 'dist-raisen', slug: 'raisen', nameEn: 'Raisen', nameHi: 'रायसेन', divisionId: 'div-bhopal', stateId: 'state-mp' },
  { id: 'dist-rajgarh', slug: 'rajgarh', nameEn: 'Rajgarh', nameHi: 'राजगढ़', divisionId: 'div-bhopal', stateId: 'state-mp' },
  { id: 'dist-vidisha', slug: 'vidisha', nameEn: 'Vidisha', nameHi: 'विदिशा', divisionId: 'div-bhopal', stateId: 'state-mp' },

  // Indore Division
  { id: 'dist-indore', slug: 'indore', nameEn: 'Indore', nameHi: 'इंदौर', divisionId: 'div-indore', stateId: 'state-mp' },
  { id: 'dist-dhar', slug: 'dhar', nameEn: 'Dhar', nameHi: 'धार', divisionId: 'div-indore', stateId: 'state-mp' },
  { id: 'dist-jhabua', slug: 'jhabua', nameEn: 'Jhabua', nameHi: 'झाबुआ', divisionId: 'div-indore', stateId: 'state-mp' },
  { id: 'dist-alirajpur', slug: 'alirajpur', nameEn: 'Alirajpur', nameHi: 'अलीराजपुर', divisionId: 'div-indore', stateId: 'state-mp' },
  { id: 'dist-khargone', slug: 'khargone', nameEn: 'Khargone', nameHi: 'खरगोन (पश्चिम निमाड़)', divisionId: 'div-indore', stateId: 'state-mp' },
  { id: 'dist-badwani', slug: 'badwani', nameEn: 'Barwani', nameHi: 'बड़वानी', divisionId: 'div-indore', stateId: 'state-mp' },
  { id: 'dist-khandwa', slug: 'khandwa', nameEn: 'Khandwa', nameHi: 'खंडवा (पूर्वी निमाड़)', divisionId: 'div-indore', stateId: 'state-mp' },
  { id: 'dist-burhanpur', slug: 'burhanpur', nameEn: 'Burhanpur', nameHi: 'बुरहानपुर', divisionId: 'div-indore', stateId: 'state-mp' },

  // Gwalior Division
  { id: 'dist-gwalior', slug: 'gwalior', nameEn: 'Gwalior', nameHi: 'ग्वालियर', divisionId: 'div-gwalior', stateId: 'state-mp' },
  { id: 'dist-shivpuri', slug: 'shivpuri', nameEn: 'Shivpuri', nameHi: 'शिवपुरी', divisionId: 'div-gwalior', stateId: 'state-mp' },
  { id: 'dist-guna', slug: 'guna', nameEn: 'Guna', nameHi: 'गुना', divisionId: 'div-gwalior', stateId: 'state-mp' },
  { id: 'dist-ashoknagar', slug: 'ashoknagar', nameEn: 'Ashoknagar', nameHi: 'अशोकनगर', divisionId: 'div-gwalior', stateId: 'state-mp' },
  { id: 'dist-datia', slug: 'datia', nameEn: 'Datia', nameHi: 'दतिया', divisionId: 'div-gwalior', stateId: 'state-mp' },

  // Jabalpur Division
  { id: 'dist-jabalpur', slug: 'jabalpur', nameEn: 'Jabalpur', nameHi: 'जबलपुर', divisionId: 'div-jabalpur', stateId: 'state-mp' },
  { id: 'dist-katni', slug: 'katni', nameEn: 'Katni', nameHi: 'कटनी', divisionId: 'div-jabalpur', stateId: 'state-mp' },
  { id: 'dist-narsinghpur', slug: 'narsinghpur', nameEn: 'Narsinghpur', nameHi: 'नरसिंहपुर', divisionId: 'div-jabalpur', stateId: 'state-mp' },
  { id: 'dist-seoni', slug: 'seoni', nameEn: 'Seoni', nameHi: 'सिवनी', divisionId: 'div-jabalpur', stateId: 'state-mp' },
  { id: 'dist-chhindwara', slug: 'chhindwara', nameEn: 'Chhindwara', nameHi: 'छिंदवाड़ा', divisionId: 'div-jabalpur', stateId: 'state-mp' },
  { id: 'dist-pandhurna', slug: 'pandhurna', nameEn: 'Pandhurna', nameHi: 'पांढुर्णा', divisionId: 'div-jabalpur', stateId: 'state-mp' },
  { id: 'dist-mandla', slug: 'mandla', nameEn: 'Mandla', nameHi: 'मंडला', divisionId: 'div-jabalpur', stateId: 'state-mp' },
  { id: 'dist-dindori', slug: 'dindori', nameEn: 'Dindori', nameHi: 'डिंडोरी', divisionId: 'div-jabalpur', stateId: 'state-mp' },
  { id: 'dist-balaghat', slug: 'balaghat', nameEn: 'Balaghat', nameHi: 'बालाघाट', divisionId: 'div-jabalpur', stateId: 'state-mp' },

  // Ujjain Division
  { id: 'dist-ujjain', slug: 'ujjain', nameEn: 'Ujjain', nameHi: 'उज्जैन', divisionId: 'div-ujjain', stateId: 'state-mp' },
  { id: 'dist-dewas', slug: 'dewas', nameEn: 'Dewas', nameHi: 'देवास', divisionId: 'div-ujjain', stateId: 'state-mp' },
  { id: 'dist-ratlam', slug: 'ratlam', nameEn: 'Ratlam', nameHi: 'रतलाम', divisionId: 'div-ujjain', stateId: 'state-mp' },
  { id: 'dist-shajapur', slug: 'shajapur', nameEn: 'Shajapur', nameHi: 'शाजापुर', divisionId: 'div-ujjain', stateId: 'state-mp' },
  { id: 'dist-agar-malwa', slug: 'agar-malwa', nameEn: 'Agar Malwa', nameHi: 'आगर मालवा', divisionId: 'div-ujjain', stateId: 'state-mp' },
  { id: 'dist-mandsaur', slug: 'mandsaur', nameEn: 'Mandsaur', nameHi: 'मंदसौर', divisionId: 'div-ujjain', stateId: 'state-mp' },
  { id: 'dist-neemuch', slug: 'neemuch', nameEn: 'Neemuch', nameHi: 'नीमच', divisionId: 'div-ujjain', stateId: 'state-mp' },

  // Sagar Division
  { id: 'dist-sagar', slug: 'sagar', nameEn: 'Sagar', nameHi: 'सागर', divisionId: 'div-sagar', stateId: 'state-mp' },
  { id: 'dist-damoh', slug: 'damoh', nameEn: 'Damoh', nameHi: 'दमोह', divisionId: 'div-sagar', stateId: 'state-mp' },
  { id: 'dist-panna', slug: 'panna', nameEn: 'Panna', nameHi: 'पन्ना', divisionId: 'div-sagar', stateId: 'state-mp' },
  { id: 'dist-chhatarpur', slug: 'chhatarpur', nameEn: 'Chhatarpur', nameHi: 'छतरपुर', divisionId: 'div-sagar', stateId: 'state-mp' },
  { id: 'dist-tikamgarh', slug: 'tikamgarh', nameEn: 'Tikamgarh', nameHi: 'टीकमगढ़', divisionId: 'div-sagar', stateId: 'state-mp' },
  { id: 'dist-niwari', slug: 'niwari', nameEn: 'Niwari', nameHi: 'निवाड़ी', divisionId: 'div-sagar', stateId: 'state-mp' },

  // Rewa Division
  { id: 'dist-rewa', slug: 'rewa', nameEn: 'Rewa', nameHi: 'रीवा', divisionId: 'div-rewa', stateId: 'state-mp' },
  { id: 'dist-satna', slug: 'satna', nameEn: 'Satna', nameHi: 'सतना', divisionId: 'div-rewa', stateId: 'state-mp' },
  { id: 'dist-maihar', slug: 'maihar', nameEn: 'Maihar', nameHi: 'मैहर', divisionId: 'div-rewa', stateId: 'state-mp' },
  { id: 'dist-mauganj', slug: 'mauganj', nameEn: 'Mauganj', nameHi: 'मऊगंज', divisionId: 'div-rewa', stateId: 'state-mp' },
  { id: 'dist-sidhi', slug: 'sidhi', nameEn: 'Sidhi', nameHi: 'सीधी', divisionId: 'div-rewa', stateId: 'state-mp' },
  { id: 'dist-singrauli', slug: 'singrauli', nameEn: 'Singrauli', nameHi: 'सिंगरौली', divisionId: 'div-rewa', stateId: 'state-mp' },

  // Shahdol Division
  { id: 'dist-shahdol', slug: 'shahdol', nameEn: 'Shahdol', nameHi: 'शहडोल', divisionId: 'div-shahdol', stateId: 'state-mp' },
  { id: 'dist-umaria', slug: 'umaria', nameEn: 'Umaria', nameHi: 'उमरिया', divisionId: 'div-shahdol', stateId: 'state-mp' },
  { id: 'dist-anuppur', slug: 'anuppur', nameEn: 'Anuppur', nameHi: 'अनूपपुर', divisionId: 'div-shahdol', stateId: 'state-mp' },

  // Chambal Division
  { id: 'dist-morena', slug: 'morena', nameEn: 'Morena', nameHi: 'मुरैना', divisionId: 'div-chambal', stateId: 'state-mp' },
  { id: 'dist-bhind', slug: 'bhind', nameEn: 'Bhind', nameHi: 'भिंड', divisionId: 'div-chambal', stateId: 'state-mp' },
  { id: 'dist-sheopur', slug: 'sheopur', nameEn: 'Sheopur', nameHi: 'श्योपुर', divisionId: 'div-chambal', stateId: 'state-mp' },

  // Narmadapuram Division
  { id: 'dist-narmadapuram', slug: 'narmadapuram', nameEn: 'Narmadapuram', nameHi: 'नर्मदापुरम', divisionId: 'div-narmadapuram', stateId: 'state-mp' },
  { id: 'dist-harda', slug: 'harda', nameEn: 'Harda', nameHi: 'हरदा', divisionId: 'div-narmadapuram', stateId: 'state-mp' },
  { id: 'dist-betul', slug: 'betul', nameEn: 'Betul', nameHi: 'बैतूल', divisionId: 'div-narmadapuram', stateId: 'state-mp' }
];

export const CATEGORIES: CategoryItem[] = [
  { id: 'cat-top', slug: 'top-news', nameEn: 'Top News', nameHi: 'टॉप न्यूज़', sortOrder: 1 },
  { id: 'cat-mp', slug: 'madhya-pradesh', nameEn: 'Madhya Pradesh', nameHi: 'मध्य प्रदेश', sortOrder: 2 },
  { id: 'cat-politics', slug: 'politics', nameEn: 'Politics', nameHi: 'राजनीति', sortOrder: 3 },
  { id: 'cat-crime', slug: 'crime', nameEn: 'Crime & Law', nameHi: 'क्राइम एवं कानून', sortOrder: 4 },
  { id: 'cat-agri', slug: 'agriculture', nameEn: 'Agriculture & Mandi', nameHi: 'कृषि एवं मंडी भाव', sortOrder: 5 },
  { id: 'cat-weather', slug: 'weather', nameEn: 'Weather', nameHi: 'मौसम व पर्यावरण', sortOrder: 6 },
  { id: 'cat-business', slug: 'business', nameEn: 'Business & Jobs', nameHi: 'व्यापार एवं रोजगार', sortOrder: 7 },
  { id: 'cat-viral', slug: 'viral', nameEn: 'Viral & Social', nameHi: 'वायरल खबरें', sortOrder: 8 }
];

export const INITIAL_ARTICLES: ArticleDetail[] = [
  {
    id: 'art-1',
    slug: 'mp-rabi-procurement-e-uporjan-registration',
    title: 'मध्य प्रदेश में समर्थन मूल्य पर गेहूं और चना उपार्जन हेतु 55 जिलों में ई-उपार्जन पोर्टल पर किसान पंजीयन शुरू',
    summary: 'खाद्य एवं नागरिक आपूर्ति विभाग ने जारी किए दिशा-निर्देश। प्रदेश के 35 लाख से अधिक किसानों को मिलेगा सीधा लाभ।',
    content: `भोपाल। मध्य प्रदेश सरकार ने रबी विपणन वर्ष 2026-27 के लिए समर्थन मूल्य पर गेहूं, चना, मसूर और सरसों के उपार्जन हेतु राज्यव्यापी पंजीयन प्रक्रिया की आधिकारिक शुरुआत कर दी है। खाद्य, नागरिक आपूर्ति एवं उपभोक्ता संरक्षण विभाग द्वारा प्रदेश के सभी 55 जिलों के कलेक्टर्स को विस्तृत दिशा-निर्देश जारी कर दिए गए हैं।

पंजीयन की मुख्य विशेषताएं:
1. किसान ई-उपार्जन पोर्टल (e-Uparjan) एवं एमपी किसान ऐप (MP Kisan App) के माध्यम से घर बैठे निःशुल्क पंजीयन करा सकते हैं।
2. ग्राम पंचायत, जनपद पंचायत, तहसील कार्यालयों एवं सहकारी समितियों में स्थापित सुविधा केंद्रों पर भी बायोमेट्रिक प्रमाणीकरण के साथ पंजीयन सुविधा उपलब्ध है।
3. बटाईदार एवं सिकमी किसानों के लिए अनुबंध पत्र अनिवार्य किया गया है ताकि वास्तविक जोतदार को ही उपार्जन का लाभ प्राप्त हो।
4. आधार से लिंक बैंक खातों में ही सीधे डीबीटी (Direct Benefit Transfer) के जरिए 48 से 72 घंटों के भीतर भुगतान सुनिश्चित किया जाएगा।

मुख्यमंत्री ने किसानों से अपील की है कि वे निर्धारित समय सीमा के भीतर अपना पंजीयन अवश्य कराएं ताकि उपार्जन केंद्रों पर स्लॉट बुकिंग की सुविधा का निर्बाध लाभ लिया जा सके। कृषि विभाग ने जिलावार कंट्रोल रूम भी स्थापित कर दिए हैं।`,
    status: 'PUBLISHED',
    featuredImage: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=1200&auto=format&fit=crop&q=80',
    imageCaption: 'मध्य प्रदेश के सीहोर जिले की कृषि उपज मंडी में किसानों की उपज का वजन करते अधिकारी',
    imageAttribution: 'बीएनडब्ल्यू स्पेशल फोटो ब्यूरो / भोपाल',
    categoryId: 'cat-agri',
    categoryName: 'कृषि एवं मंडी भाव',
    districtId: 'dist-bhopal',
    districtName: 'भोपाल',
    divisionId: 'div-bhopal',
    authorId: 'rep-101',
    authorName: 'राजेश पटेल',
    authorRole: 'राज्य ब्यूरो प्रमुख (भोपाल)',
    isBreaking: true,
    viewCount: 18450,
    shareCount: 1240,
    publishedAt: 'आज, 09:30 AM',
    createdAt: '2026-11-03 09:00 IST',
    tags: ['ई-उपार्जन', 'गेहूं उपार्जन', 'कृषि', 'मध्य प्रदेश शासन', 'किसान कल्याण'],
    factChecked: true,
    factCheckScore: 98
  },
  {
    id: 'art-2',
    slug: 'rewa-ultra-mega-solar-plant-record-generation',
    title: 'विंध्य का गौरव: रीवा अल्ट्रा मेगा सोलर प्लांट ने छुआ ऐतिहासिक उत्पादन रिकॉर्ड, दिल्ली मेट्रो व एमपी को मिल रही हरित ऊर्जा',
    summary: '750 मेगावाट क्षमता वाले एशिया के सबसे बड़े एकल-साइट सोलर पार्क्स में से एक ने रचा इतिहास। कार्बन उत्सर्जन में रिकॉर्ड कमी।',
    content: `रीवा। मध्य प्रदेश के विंध्य क्षेत्र स्थित 750 मेगावाट क्षमता वाले रीवा अल्ट्रा मेगा सोलर पार्क (RUMSL) ने आज बिजली उत्पादन के नए कीर्तिमान को छुआ है। प्लांट के सभी तीनों सोलर प्लॉट्स पूरी क्षमता के साथ कार्य कर रहे हैं।

विशेष उपलब्धियां:
• इस सौर ऊर्जा संयंत्र से उत्पादित कुल बिजली का 24% हिस्सा दिल्ली मेट्रो रेल कॉर्पोरेशन (DMRC) को प्रदाय किया जाता है, जिससे दिल्ली मेट्रो का 70% संचालन हरित ऊर्जा से हो रहा है।
• शेष 76% विद्युत मध्य प्रदेश के राज्य डिस्कॉम्स (MPPMCL) को नाममात्र की न्यूनतम दरों पर दी जा रही है।
• कार्बन उत्सर्जन में प्रतिवर्ष 15.4 लाख टन की कमी आ रही है जो लगभग 2.6 करोड़ पेड़ लगाने के समतुल्य है।

नवीन एवं नवकरणीय ऊर्जा विभाग के मुख्य अभियंता ने बताया कि नीमच, आगर और शाजापुर में बन रहे नए सोलर पार्कों को भी शीघ्र ही पूरी क्षमता के साथ ग्रिड से सिंक्रोनाइज किया जाएगा।`,
    status: 'PUBLISHED',
    featuredImage: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=1200&auto=format&fit=crop&q=80',
    imageCaption: 'रीवा अल्ट्रा मेगा सोलर प्लांट की विस्तृत पैनल्स का विहंगम दृश्य',
    imageAttribution: 'बीएनडब्ल्यू विंध्य ब्यूरो',
    categoryId: 'cat-business',
    categoryName: 'व्यापार एवं रोजगार',
    districtId: 'dist-rewa',
    districtName: 'रीवा',
    divisionId: 'div-rewa',
    authorId: 'rep-105',
    authorName: 'विवेक त्रिपाठी',
    authorRole: 'संवाददाता (रीवा)',
    isBreaking: false,
    viewCount: 9420,
    shareCount: 680,
    publishedAt: 'आज, 11:15 AM',
    createdAt: '2026-11-03 11:00 IST',
    tags: ['रीवा', 'सोलर पार्क', 'ग्रीन एनर्जी', 'विंध्य', 'उद्योग'],
    factChecked: true,
    factCheckScore: 96
  },
  {
    id: 'art-3',
    slug: 'indore-metro-phase-two-trial-run-super-corridor',
    title: 'इंदौर मेट्रो: सुपर कॉरिडोर से गांधी नगर स्टेशन तक स्पीड ट्रायल सफल, 5.9 किमी येलो लाइन पर जल्द दौड़ेंगी कमर्शियल ट्रेनें',
    summary: 'एमपी मेट्रो रेल कॉर्पोरेशन ने सुरक्षा मानकों की ली समीक्षा। मेट्रो में लगाए गए आधुनिक सीबीटीसी सिग्नलिंग सिस्टम।',
    content: `इंदौर। देश के सबसे स्वच्छ शहर इंदौर में मेट्रो रेल परियोजना का एक और महत्वपूर्ण पड़ाव पार कर लिया गया है। सुपर कॉरिडोर से गांधी नगर डिपो के मध्य येलो लाइन पर आज 80 किमी प्रति घंटे की गति से सफल स्पीड ट्रायल पूरा हुआ।

परियोजना की मुख्य बातें:
1. मेट्रो रैक में ऑटोमैटिक ट्रेन प्रोटेक्शन (ATP) और ऑटोमैटिक ट्रेन ऑपरेशन (ATO) तकनीक लगाई गई है।
2. सभी स्टेशनों पर दिव्यांगजनों के लिए टैक्टाइल टाइल्स, ब्रेल साइनेज और लिफ्ट्स की व्यवस्था पूर्ण है।
3. अगले चरण में रीगल चौराहा, पलासिया और खजराना तक भूमिगत एवं एलिवेटेड नेटवर्क का निर्माण कार्य तेज गति से जारी है।

कलेक्टर एवं मेट्रो अधिकारियों ने बताया कि कमिश्नर ऑफ मेट्रो रेलवे सेफ्टी (CMRS) का अंतिम निरीक्षण इसी पखवाड़े प्रस्तावित है, जिसके बाद नागरिक सेवाओं का शुभारंभ होगा।`,
    status: 'PUBLISHED',
    featuredImage: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200&auto=format&fit=crop&q=80',
    imageCaption: 'इंदौर सुपर कॉरिडोर पर ट्रायल के दौरान चमचमाती येलो लाइन मेट्रो ट्रेन',
    imageAttribution: 'बीएनडब्ल्यू इंदौर ब्यूरो',
    categoryId: 'cat-mp',
    categoryName: 'मध्य प्रदेश',
    districtId: 'dist-indore',
    districtName: 'इंदौर',
    divisionId: 'div-indore',
    authorId: 'rep-102',
    authorName: 'संजय वर्मा',
    authorRole: 'वरिष्ठ संवाददाता (इंदौर)',
    isBreaking: true,
    viewCount: 14200,
    shareCount: 890,
    publishedAt: 'आज, 12:40 PM',
    createdAt: '2026-11-03 12:20 IST',
    tags: ['इंदौर', 'मेट्रो रेल', 'स्मार्ट सिटी', 'मालवा'],
    factChecked: true,
    factCheckScore: 99
  },
  {
    id: 'art-4',
    slug: 'ujjain-mahakal-lok-crowd-management-ai-system',
    title: 'उज्जैन श्री महाकाल महालोक में AI क्राउड मैनेजमेंट सिस्टम लागू, श्रद्धालुओं को सुगम दर्शन और 15 मिनट में प्रवेश',
    summary: 'फेस रिकग्निशन और ऑटोमैटिक हेडकाउंटिंग कैमरों से भीड़ पर 24 घंटे नज़र। सुरक्षा और स्वास्थ्य आपात सेवा केंद्रों का विस्तार।',
    content: `उज्जैन। विश्व प्रसिद्ध ज्योतिर्लिंग श्री महाकालेश्वर मंदिर एवं श्री महाकाल लोक में श्रद्धालुओं की निरंतर बढ़ती संख्या को देखते हुए मंदिर प्रबंध समिति ने अत्याधुनिक एआई-आधारित क्राउड मॉनिटरिंग सिस्टम को पूरी तरह सक्रिय कर दिया है।

प्रणाली के लाभ:
- मंदिर परिसर के 150 से अधिक एचडी सीसीटीवी कैमरे रीयल-टाइम भीड़ घनत्व (Crowd Density Heatmap) का विश्लेषण करते हैं।
- किसी भी क्षेत्र में क्षमता से अधिक दबाव होने पर ऑटोमैटिक अलर्ट जनरेट होकर क्विक रिस्पांस टीम (QRT) को सूचित करता है।
- नंदी हॉल और गर्भगृह दर्शन कतार में होल्डिंग एरिया का डायनामिक प्रबंधन होने से प्रतीक्षा समय में 40% की कमी दर्ज हुई है।

उज्जैन कलेक्टर एवं अध्यक्ष महाकाल मंदिर प्रबंध समिति ने बताया कि आगामी पर्वों को देखते हुए त्रिवेणी संग्रहालय से मानसरोवर भवन तक कवर्ड शेड और वाटर मिस्ट कूलिंग तकनीक भी बढ़ा दी गई है।`,
    status: 'PUBLISHED',
    featuredImage: 'https://images.unsplash.com/photo-1566438480900-0609be27a4be?w=1200&auto=format&fit=crop&q=80',
    imageCaption: 'उज्जैन श्री महाकाल लोक का संध्याकालीन भव्य नजारा',
    imageAttribution: 'बीएनडब्ल्यू उज्जैन संभाग ब्यूरो',
    categoryId: 'cat-top',
    categoryName: 'टॉप न्यूज़',
    districtId: 'dist-ujjain',
    districtName: 'उज्जैन',
    divisionId: 'div-ujjain',
    authorId: 'rep-104',
    authorName: 'दीपक जोशी',
    authorRole: 'संवाददाता (उज्जैन)',
    isBreaking: false,
    viewCount: 11200,
    shareCount: 950,
    publishedAt: 'आज, 02:10 PM',
    createdAt: '2026-11-03 13:50 IST',
    tags: ['उज्जैन', 'महाकाल लोक', 'धार्मिक पर्यटन', 'मालवा'],
    factChecked: true,
    factCheckScore: 97
  },
  {
    id: 'art-5',
    slug: 'gwalior-chambal-industrial-corridor-investment',
    title: 'ग्वालियर-चंबल अंचल में ₹12,000 करोड़ का औद्योगिक निवेश, सीतापुर व बानमोर में स्थापित होंगी 45 नई औद्योगिक इकाइयां',
    summary: 'एमएसएमई एवं भारी उद्योग विभाग का मास्टरप्लान। स्थानीय 25,000 युवाओं को मिलेगा प्रत्यक्ष व अप्रत्यक्ष रोजगार।',
    content: `ग्वालियर। मध्य प्रदेश के ग्वालियर-चंबल अंचल में औद्योगिक विकास को पंख लगने जा रहे हैं। औद्योगिक प्रोत्साहन नीति के तहत मुरैना के बानमोर और ग्वालियर के सीतापुर इंडस्ट्रियल एरिया में 45 से अधिक राष्ट्रीय स्तर की निर्माण इकाइयों को भूखंड आवंटित कर दिए गए हैं।

प्रमुख विशेषताएं:
- ऑटोमोबाइल कंपोनेंट्स, डिफेंस इक्विपमेंट्स, टेक्सटाइल और फूड प्रोसेसिंग सेक्टर में निवेश।
- अटल प्रगति पथ (चंबल एक्सप्रेसवे) से कनेक्टिविटी मिलने से लॉजिस्टिक्स लागत में 30% कमी आएगी।
- सिंगल विंडो सिस्टम के तहत 15 कार्यदिवसों में सभी आवश्यक एनओसी और बिजली कनेक्शन प्रदान किए जा रहे हैं।

उद्योग मंत्री ने बताया कि चंबल का यह औद्योगिक कायाकल्प क्षेत्र के युवाओं को उनके गृह जिले में ही उच्च वेतन वाले अवसर उपलब्ध कराएगा।`,
    status: 'PUBLISHED',
    featuredImage: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1200&auto=format&fit=crop&q=80',
    imageCaption: 'ग्वालियर के सीतापुर औद्योगिक क्षेत्र में आधुनिक मैन्युफैक्चरिंग प्लांट',
    imageAttribution: 'बीएनडब्ल्यू ग्वालियर ब्यूरो',
    categoryId: 'cat-business',
    categoryName: 'व्यापार एवं रोजगार',
    districtId: 'dist-gwalior',
    districtName: 'ग्वालियर',
    divisionId: 'div-gwalior',
    authorId: 'rep-106',
    authorName: 'अमित तोमर',
    authorRole: 'संवाददाता (ग्वालियर)',
    isBreaking: false,
    viewCount: 7800,
    shareCount: 410,
    publishedAt: 'आज, 03:30 PM',
    createdAt: '2026-11-03 15:00 IST',
    tags: ['ग्वालियर', 'चंबल', 'औद्योगिक विकास', 'रोजगार', 'निवेश'],
    factChecked: true,
    factCheckScore: 95
  },
  {
    id: 'art-6',
    slug: 'jabalpur-bhedaghat-marble-rocks-ropeway-expansion',
    title: 'जबलपुर: भेड़ाघाट संगमरमरी वादियों में नए आधुनिक रोपवे का परीक्षण पूरा, धुआंधार जलप्रपात पर पर्यटकों को मिलेगा नया रोमांच',
    summary: 'संस्कारधानी जबलपुर में पर्यटन को बढ़ावा देने के लिए जिला प्रशासन की पहल। पर्यावरण संरक्षण के साथ सुरक्षा के कड़े मानक।',
    content: `जबलपुर। नर्मदा नदी की संगमरमरी चट्टानों और प्रसिद्ध धुआंधार जलप्रपात के लिए विख्यात भेड़ाघाट में नए अंतरराष्ट्रीय मानकों वाले केबल कार रोपवे का सफल ट्रायल पूरा कर लिया गया है।

मुख्य आकर्षण:
- अत्याधुनिक 360-डिग्री पैनोरमिक ग्लास केबिन जो पर्यटकों को नर्मदा घाटी का अद्भुत विहंगम दर्शन कराएंगे।
- स्विस सुरक्षा तकनीकों से लैस ऑटो-ब्रेक और बैकअप पावर सिस्टम।
- लमहेटा घाट यूनेस्को जियो-हेरिटेज साइट के संरक्षण के लिए इको-फ्रेंडली इलेक्ट्रिक शटल सेवा भी प्रारंभ की जा रही है।

पर्यटन विकास निगम के प्रबंध संचालक ने बताया कि आने वाले सप्ताहांत से आम जनता के लिए बुकिंग खिड़की खोल दी जाएगी।`,
    status: 'PUBLISHED',
    featuredImage: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&auto=format&fit=crop&q=80',
    imageCaption: 'जबलपुर भेड़ाघाट में नर्मदा के धुआंधार प्रपात की प्राकृतिक छटा',
    imageAttribution: 'बीएनडब्ल्यू जबलपुर ब्यूरो',
    categoryId: 'cat-mp',
    categoryName: 'मध्य प्रदेश',
    districtId: 'dist-jabalpur',
    districtName: 'जबलपुर',
    divisionId: 'div-jabalpur',
    authorId: 'rep-108',
    authorName: 'नीरज पांडे',
    authorRole: 'संवाददाता (जबलपुर)',
    isBreaking: false,
    viewCount: 8900,
    shareCount: 520,
    publishedAt: 'आज, 04:15 PM',
    createdAt: '2026-11-03 16:00 IST',
    tags: ['जबलपुर', 'भेड़ाघाट', 'धुआंधार', 'नर्मदा', 'पर्यटन'],
    factChecked: true,
    factCheckScore: 97
  }
];

export const INITIAL_PENDING_STORIES: ArticleDetail[] = [
  {
    id: 'draft-101',
    slug: 'chhindwara-mandla-tribal-crafts-export-hub',
    title: 'छिंदवाड़ा व मंडला के जनजातीय कलाकारों द्वारा निर्मित गोंड पेंटिंग व कोदो-कुटकी उत्पादों का यूरोप को निर्यात शुरू',
    summary: 'ट्राइबल को-ऑपरेटिव मार्केटिंग फेडरेशन (TRIFED) और जिला प्रशासन का संयुक्त प्रयास। 500 से अधिक स्वयं सहायता समूहों को सीधे विदेशी बाजार से जुड़ाव।',
    content: `छिंदवाड़ा/मंडला। मध्य प्रदेश के जनजातीय अंचल छिंदवाड़ा और मंडला के पारंपरिक हस्तशिल्प और जैविक श्रीअन्न उत्पादों ने अंतरराष्ट्रीय बाजार में अपनी मजबूत उपस्थिति दर्ज कराई है। आज 15 टन जैविक कोदो-कुटकी एवं 200 से अधिक प्रमाणित गोंड कलाकृतियों की पहली खेप मुंबई बंदरगाह से जर्मनी और फ्रांस के लिए रवाना की गई।

फील्ड जांच रिपोर्ट:
- सभी उत्पाद जैविक प्रमाणीकरण लैब से विधिवत टेस्टेड हैं।
- महिला कारीगरों के बैंक खातों में उचित मूल्य का सीधा अंतरण सुनिश्चित किया गया है।
- स्थानीय स्तर पर पैकेजिंग यूनिट्स स्थापित होने से 300 अतिरिक्त महिलाओं को पैकेजिंग और ग्रेडिंग में रोजगार मिला है।`,
    status: 'PENDING_REVIEW',
    featuredImage: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=1200&auto=format&fit=crop&q=80',
    imageCaption: 'पारंपरिक गोंड कलाकृति तैयार करती जनजातीय कलाकार',
    imageAttribution: 'बीएनडब्ल्यू फील्ड डेस्क / छिंदवाड़ा',
    categoryId: 'cat-business',
    categoryName: 'व्यापार एवं रोजगार',
    districtId: 'dist-chhindwara',
    districtName: 'छिंदवाड़ा',
    divisionId: 'div-jabalpur',
    authorId: 'rep-chhindwara-01',
    authorName: 'सुरेश उइके',
    authorRole: 'फील्ड संवाददाता (छिंदवाड़ा)',
    isBreaking: false,
    viewCount: 0,
    shareCount: 0,
    createdAt: '15 मिनट पहले (16:30 IST)',
    tags: ['छिंदवाड़ा', 'गोंड पेंटिंग', 'श्रीअन्न', 'निर्यात', 'जनजातीय विकास']
  },
  {
    id: 'draft-102',
    slug: 'bundelkhand-ken-betwa-link-project-survey',
    title: 'केन-बेतवा लिंक परियोजना: छतरपुर व पन्ना के 12 तहसीलों में नहर संजाल का अंतिम सर्वेक्षण पूरा, जलसंकट से मिलेगी मुक्ति',
    summary: 'बुंदेलखंड के 10 लाख हेक्टेयर सिंचित क्षेत्र का मार्ग प्रशस्त। पेयजल की समस्या का स्थायी समाधान होने की उम्मीद।',
    content: `छतरपुर। बुंदेलखंड अंचल के सूखे खेतों को लहलहाने और भीषण गर्मी में पेयजल संकट से स्थायी मुक्ति दिलाने वाली महत्वाकांक्षी केन-बेतवा लिंक परियोजना के दौधन बांध एवं नहर प्रणाली का सर्वे कार्य जल संसाधन विभाग द्वारा संपन्न कर लिया गया है।

मुख्य विवरण:
1. परियोजना से छतरपुर, पन्ना, टीकमगढ़ और निवाड़ी जिलों के 21 लाख लोगों को शुद्ध पेयजल मिलेगा।
2. 103 मेगावाट जलविद्युत और 27 मेगावाट सौर ऊर्जा उत्पादन का भी प्रावधान है।
3. विस्थापित परिवारों के लिए आदर्श पुनर्वास कॉलोनियों का निर्माण कार्य युद्धस्तर पर जारी है।`,
    status: 'PENDING_REVIEW',
    featuredImage: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&auto=format&fit=crop&q=80',
    imageCaption: 'केन-बेतवा लिंक परियोजना क्षेत्र में चल रहा नहर निर्माण सर्वेक्षण',
    imageAttribution: 'बीएनडब्ल्यू बुंदेलखंड ब्यूरो',
    categoryId: 'cat-mp',
    categoryName: 'मध्य प्रदेश',
    districtId: 'dist-chhatarpur',
    districtName: 'छतरपुर',
    divisionId: 'div-sagar',
    authorId: 'rep-chhatarpur-02',
    authorName: 'रविंद्र बुंदेला',
    authorRole: 'फील्ड संवाददाता (छतरपुर)',
    isBreaking: true,
    viewCount: 0,
    shareCount: 0,
    createdAt: '42 मिनट पहले (16:05 IST)',
    tags: ['केन-बेतवा', 'छतरपुर', 'पन्ना', 'बुंदेलखंड', 'सिंचाई']
  }
];

export const EPAPER_EDITIONS: EpaperEdition[] = [
  {
    id: 'epaper-bhopal-today',
    title: 'भोपाल मुख्य राज्य संस्करण',
    editionDate: '03 नवम्बर 2026',
    districtId: 'dist-bhopal',
    districtName: 'भोपाल',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    totalPages: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&auto=format&fit=crop&q=80',
    pages: [
      {
        pageNumber: 1,
        title: 'मुख्य पृष्ठ: मप्र में ई-उपार्जन शुरुआत व राज्यस्तरीय फैसले',
        imageUrl: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=900&auto=format&fit=crop&q=80'
      },
      {
        pageNumber: 2,
        title: 'राजधानी डायरी: भोपाल नगर निगम व स्मार्ट सिटी प्रोजेक्ट्स',
        imageUrl: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=900&auto=format&fit=crop&q=80'
      },
      {
        pageNumber: 3,
        title: 'प्रदेश राउंडअप: 55 जिलों की प्रमुख गतिविधियां व प्रशासनिक समाचार',
        imageUrl: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=900&auto=format&fit=crop&q=80'
      },
      {
        pageNumber: 4,
        title: 'कृषि एवं ग्रामीण विकास: मंडियों के ताज़ा भाव व फसल सलाह',
        imageUrl: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=900&auto=format&fit=crop&q=80'
      },
      {
        pageNumber: 5,
        title: 'व्यापार एवं उद्योग: मप्र निवेश नीति व स्टार्टअप जगत',
        imageUrl: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=900&auto=format&fit=crop&q=80'
      },
      {
        pageNumber: 6,
        title: 'संपादकीय व विचार: निष्पक्ष विश्लेषण एवं जनसरोकार',
        imageUrl: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=900&auto=format&fit=crop&q=80'
      },
      {
        pageNumber: 7,
        title: 'खेल एवं युवा: खेलो एमपी यूथ गेम्स व स्थानीय प्रतिभाएं',
        imageUrl: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=900&auto=format&fit=crop&q=80'
      },
      {
        pageNumber: 8,
        title: 'मनोरंजन व विविध: सांस्कृतिक उत्सव व बुंदेलखंडी/मालवी रंग',
        imageUrl: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=900&auto=format&fit=crop&q=80'
      }
    ]
  },
  {
    id: 'epaper-indore-today',
    title: 'इंदौर महानगर व मालवा संस्करण',
    editionDate: '03 नवम्बर 2026',
    districtId: 'dist-indore',
    districtName: 'इंदौर',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    totalPages: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=600&auto=format&fit=crop&q=80',
    pages: [
      {
        pageNumber: 1,
        title: 'मुख्य पृष्ठ: इंदौर मेट्रो स्पीड ट्रायल व स्वच्छता नवाचार',
        imageUrl: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=900&auto=format&fit=crop&q=80'
      },
      {
        pageNumber: 2,
        title: 'शहर इंदौर: सुपर कॉरिडोर, बीआरटीएस व ट्रैफिक अपडेट',
        imageUrl: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=900&auto=format&fit=crop&q=80'
      },
      {
        pageNumber: 3,
        title: 'मालवा-निमाड़: उज्जैन, देवास, धार व खरगोन समाचार',
        imageUrl: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=900&auto=format&fit=crop&q=80'
      },
      {
        pageNumber: 4,
        title: 'मंडी हलचल: इंदौर व धार अनाज व सोयाबीन भाव',
        imageUrl: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=900&auto=format&fit=crop&q=80'
      }
    ]
  },
  {
    id: 'epaper-gwalior-today',
    title: 'ग्वालियर-चंबल अंचल संस्करण',
    editionDate: '03 नवम्बर 2026',
    districtId: 'dist-gwalior',
    districtName: 'ग्वालियर',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    totalPages: 6,
    thumbnailUrl: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&auto=format&fit=crop&q=80',
    pages: [
      {
        pageNumber: 1,
        title: 'मुख्य पृष्ठ: अंचल में औद्योगिक निवेश और चंबल एक्सप्रेसवे प्रगति',
        imageUrl: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=900&auto=format&fit=crop&q=80'
      },
      {
        pageNumber: 2,
        title: 'ग्वालियर शहर: किला हेरिटेज व व्यापार मेला तैयारियां',
        imageUrl: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=900&auto=format&fit=crop&q=80'
      }
    ]
  },
  {
    id: 'epaper-jabalpur-today',
    title: 'जबलपुर व महाकोशल संस्करण',
    editionDate: '03 नवम्बर 2026',
    districtId: 'dist-jabalpur',
    districtName: 'जबलपुर',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    totalPages: 6,
    thumbnailUrl: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=600&auto=format&fit=crop&q=80',
    pages: [
      {
        pageNumber: 1,
        title: 'मुख्य पृष्ठ: संस्कारधानी में पर्यटन क्रांति और डिफेंस निर्माण',
        imageUrl: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=900&auto=format&fit=crop&q=80'
      }
    ]
  },
  {
    id: 'epaper-niwari-today',
    title: 'निवाड़ी व बुंदेलखंड संस्करण',
    editionDate: '03 नवम्बर 2026',
    districtId: 'dist-niwari',
    districtName: 'निवाड़ी',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    totalPages: 6,
    thumbnailUrl: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&auto=format&fit=crop&q=80',
    pages: [
      {
        pageNumber: 1,
        title: 'मुख्य पृष्ठ: ओरछा रामराजा सरकार मंदिर व बुंदेलखंड विकास',
        imageUrl: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=900&auto=format&fit=crop&q=80'
      }
    ]
  }
];
