/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * AI Automated Permanent Columns Engine
 * Grounded in docs/06-Business-Rules.md, docs/17-Agents.md, and docs/12-Database.md
 */

export const PERMANENT_COLUMN_TYPES = {
  PANCHANG: 'PANCHANG',
  EDITORIAL_OPED: 'EDITORIAL_OPED',
  MARKET_TICKER: 'MARKET_TICKER',
  WEATHER: 'WEATHER',
  DISTRICT_ROUNDUP: 'DISTRICT_ROUNDUP',
};

export const PERMANENT_COLUMN_METADATA = [
  {
    type: PERMANENT_COLUMN_TYPES.PANCHANG,
    titleHi: 'दैनिक पंचांग एवं राशिफल',
    titleEn: 'Daily Panchang & Horoscope',
    defaultSection: 'FRONT_PAGE',
    attribution: 'पंचांग गणना डेस्क / उज्जैन पंचांग संदर्भ',
    description: 'तिथि, नक्षत्र, चौघड़िया, राहुकाल एवं 12 राशियों का दैनिक फलकथन',
  },
  {
    type: PERMANENT_COLUMN_TYPES.EDITORIAL_OPED,
    titleHi: 'संपादकीय दृष्टिकोण / ओप-एड',
    titleEn: 'Editorial Op-Ed Commentary',
    defaultSection: 'EDITORIAL',
    attribution: 'बीएनडब्ल्यू संपादकीय मंडल (AI Newsroom Desk)',
    description: 'मध्य प्रदेश के विकास, नीतिगत फैसलों व सामाजिक मुद्दों पर गहन वैचारिक विमर्श',
  },
  {
    type: PERMANENT_COLUMN_TYPES.MARKET_TICKER,
    titleHi: 'मंडी भाव एवं सर्राफा हलचल',
    titleEn: 'Mandi Rates & Bullion Ticker',
    defaultSection: 'BUSINESS',
    attribution: 'मध्य प्रदेश राज्य कृषि विपणन बोर्ड एवं बाजार डेस्क',
    description: 'कृषि उपज मंडी (गेहूं, सोयाबीन, चना, सरसों), सर्राफा व सेंसेक्स के नवीनतम भाव',
  },
  {
    type: PERMANENT_COLUMN_TYPES.WEATHER,
    titleHi: 'मौसम चक्र (10 संभाग पूर्वानुमान)',
    titleEn: 'Regional Weather Forecast (10 MP Divisions)',
    defaultSection: 'FRONT_PAGE',
    attribution: 'OpenWeather / IMD (भारतीय मौसम विज्ञान विभाग)',
    description: 'मध्य प्रदेश के सभी 10 संभागों का तापमान, आर्द्रता एवं मौसम की चेतावनी',
  },
  {
    type: PERMANENT_COLUMN_TYPES.DISTRICT_ROUNDUP,
    titleHi: 'जिला डायरी (55 जिलों की हलचल)',
    titleEn: 'District Ground Roundup (55 MP Districts)',
    defaultSection: 'DISTRICT_FOCUS',
    attribution: 'बीएनडब्ल्यू जिला संवाददाता नेटवर्क',
    description: 'मध्य प्रदेश के कस्बों और ग्राम्यांचलों से चयनित संक्षिप्त विकास समाचार',
  },
];

export class PermanentColumnsEngine {
  static getProviderInfo() {
    return {
      model: 'bnw-mock-v1',
      provider: 'bnw-local-permanent-columns',
      isFallback: true,
      offlineReady: true,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Returns list of supported recurring column types with metadata
   */
  static getAvailableTypes() {
    return PERMANENT_COLUMN_METADATA;
  }

  /**
   * Generates a permanent recurring broadsheet column with authentic Devanagari content
   * and strict explicit source attribution.
   *
   * @param {object} params
   * @param {string} params.type - One of PERMANENT_COLUMN_TYPES
   * @param {string} [params.date] - Publication date (YYYY-MM-DD)
   * @param {string} [params.district] - Associated district name
   * @param {string} [params.division] - Associated administrative division
   * @param {string} [params.author] - Author / editor credit override
   * @param {object} [params.bounds] - Element bounding box if intended for immediate placement
   * @returns {object} Column generation result
   */
  static generatePermanentColumn({
    type,
    date,
    district = 'भोपाल',
    division = 'भोपाल संभाग',
    author,
    bounds,
  } = {}) {
    const pubDate = date || new Date().toISOString().split('T')[0];
    const safeType = (type || '').toUpperCase();

    let columnTitle = '';
    let authorName = author || '';
    let byline = '';
    let bodyText = '';
    let sourceAttribution = '';
    let section = 'FRONT_PAGE';

    switch (safeType) {
      case PERMANENT_COLUMN_TYPES.PANCHANG: {
        columnTitle = 'दैनिक पंचांग एवं राशिफल: विक्रम संवत 2081';
        authorName = authorName || 'पं. वेदमूर्ति शास्त्री';
        byline = 'पंचांग गणना संदर्भ: महाकालेश्वर उज्जैन वेधशाला';
        sourceAttribution = 'पंचांग गणना डेस्क / उज्जैन पंचांग संदर्भ';
        section = 'FRONT_PAGE';

        bodyText =
          `तिथि: शुक्ल पक्ष एकादशी | नक्षत्र: रोहिणी | योग: वृद्धि | करण: बव | सूर्योदय: प्रातः 06:18 | सूर्यास्त: सायं 06:22 | ` +
          `अमृत चौघड़िया: प्रातः 07:45 से 09:12 तक। राहुकाल (अशुभ समय): प्रातः 10:30 से 12:00 बजे तक (इस दौरान शुभ कार्य वर्जित)।\n\n` +
          `दैनिक राशिफल संक्षिप्त फलकथन:\n` +
          `• मेष: कार्यक्षेत्र में नई जिम्मेदारियां मिलेंगी, आर्थिक स्थिति सुदृढ़ होगी।\n` +
          `• वृषभ: पारिवारिक सुख में वृद्धि, व्यापारिक यात्रा लाभदायक सिद्ध होगी।\n` +
          `• मिथुन: रचनात्मक कार्यों में सफलता, मित्रों से सहयोग प्राप्त होगा।\n` +
          `• कर्क: मानसिक शांति बनी रहेगी, नवीन योजनाओं पर विचार करें।\n` +
          `• सिंह: आत्मविश्वास में वृद्धि होगी, सामाजिक प्रतिष्ठा बढ़ेगी।\n` +
          `• कन्या: वाणी पर संयम रखें, आर्थिक लेनदेन में सावधानी बरतें।\n` +
          `• तुला: साझेदारी के व्यापार में लाभ, शुभ समाचार प्राप्त होंगे।\n` +
          `• वृश्चिक: पराक्रम में वृद्धि, लंबित सरकारी कार्य संपन्न होंगे।\n` +
          `• धनु: धार्मिक कार्यों में रुचि बढ़ेगी, विद्यार्थियों को सफलता मिलेगी।\n` +
          `• मकर: स्वास्थ्य का ध्यान रखें, पुराने निवेश से लाभ संभव।\n` +
          `• कुंभ: नए मित्रों से संपर्क बनेगा, करियर में सकारात्मक बदलाव।\n` +
          `• मीन: आध्यात्मिक उन्नति होगी, पारिवारिक वातावरण सौहार्दपूर्ण रहेगा।`;
        break;
      }

      case PERMANENT_COLUMN_TYPES.EDITORIAL_OPED: {
        columnTitle = 'संपादकीय विमर्श: मध्य प्रदेश में समावेशी विकास का नया क्षितिज';
        authorName = authorName || 'संपादकीय मंडल';
        byline = 'बीएनडब्ल्यू विशेष वैचारिक टिप्पणी';
        sourceAttribution = 'बीएनडब्ल्यू संपादकीय मंडल (AI Newsroom Desk)';
        section = 'EDITORIAL';

        bodyText =
          `मध्य प्रदेश का आर्थिक व सामाजिक परिदृश्य आज एक निर्णायक मोड़ पर खड़ा है। मालवा-निमाड़ के औद्योगिक गलियारों से लेकर ` +
          `बुंदेलखंड और महाकौशल के कृषि अंचलों तक विकास की नई लहर स्पष्ट रूप से परिलक्षित हो रही है। लाडली बहना जैसी महिला सशक्तिकरण ` +
          `योजनाओं ने ग्रामीण अर्थव्यवस्था में प्रत्यक्ष तरलता का संचार किया है, जिसका सीधा सकारात्मक प्रभाव स्थानीय बाजारों और लघु व्यापार पर पड़ा है।\n\n` +
          `किंतु अधोसंरचना के इस तीव्र विस्तार के साथ-साथ गुणवत्तापूर्ण शिक्षा और स्वास्थ्य सेवाओं का सुदूर वनवासी अंचलों तक पहुंचना ` +
          `समान रूप से अनिवार्य है। सुशासन की वास्तविक कसौटी यही है कि अंतिम पंक्ति में खड़े नागरिक को प्रशासनिक प्रक्रिया में न्याय और सुगमता मिले। ` +
          `प्रकृति, परंपरा और प्रगति के संतुलित समन्वय से ही मध्य प्रदेश देश के अग्रणी राज्यों में अपनी विशिष्ट पहचान निरंतर सुदृढ़ रख सकेगा।`;
        break;
      }

      case PERMANENT_COLUMN_TYPES.MARKET_TICKER: {
        columnTitle = 'मंडी भाव व सर्राफा हलचल: मालवा, निमाड़ और महाकौशल';
        authorName = authorName || 'बाजार विश्लेषण डेस्क';
        byline = 'मध्य प्रदेश राज्य कृषि विपणन बोर्ड एवं सर्राफा संदर्भ';
        sourceAttribution = 'मध्य प्रदेश राज्य कृषि विपणन बोर्ड एवं बाजार डेस्क';
        section = 'BUSINESS';

        bodyText =
          `कृषि उपज मंडी प्रमुख दरें (प्रति क्विंटल):\n` +
          `• शरबती गेहूं (सीहोर/विदिशा): ₹3,350 - ₹3,620\n` +
          `• मालवराज गेहूं (इंदौर/उज्जैन): ₹2,550 - ₹2,780\n` +
          `• पीला सोयाबीन (उज्जैन/देवास): ₹4,720 - ₹4,890\n` +
          `• देसी चना (नरसिंहपुर/जबलपुर): ₹6,100 - ₹6,350\n` +
          `• सरसों (मुरैना/भिंड): ₹5,450 - ₹5,700\n` +
          `• डॉलर चना (इंदौर): ₹9,800 - ₹11,200\n\n` +
          `सर्राफा बाजार अपडेट:\n` +
          `• शुद्ध सोना (24 कैरेट, प्रति 10 ग्राम): ₹78,650 (स्थिर)\n` +
          `• जेवराती सोना (22 कैरेट, प्रति 10 ग्राम): ₹72,150\n` +
          `• चांदी (प्रति किलोग्राम): ₹91,800 (+₹400)\n\n` +
          `शेयर बाजार सूचकांक:\n` +
          `• सेंसेक्स: 81,420 अंक (+280 अंक) | निफ्टी: 24,810 अंक (+75 अंक)। एफएमसीजी व ऑटो सेक्टर में लिवाली रही।`;
        break;
      }

      case PERMANENT_COLUMN_TYPES.WEATHER: {
        columnTitle = 'मौसम चक्र: मध्य प्रदेश के 10 संभागों का मौसम पूर्वानुमान';
        authorName = authorName || 'मौसम वैज्ञानिक सेल';
        byline = 'मौसम विज्ञान केंद्र भोपाल एवं IMD संदर्भ';
        sourceAttribution = 'OpenWeather / IMD (भारतीय मौसम विज्ञान विभाग)';
        section = 'FRONT_PAGE';

        bodyText =
          `राज्य के मौसम विज्ञान केंद्र भोपाल के अनुसार आगामी 24 घंटों में प्रदेश के अधिकांश हिस्सों में मौसम शुष्क रहेगा:\n\n` +
          `• भोपाल संभाग: अधिकतम 32°C, न्यूनतम 18°C। आसमान साफ, हवा की गति 10-12 किमी/घंटा।\n` +
          `• इंदौर संभाग: अधिकतम 33°C, न्यूनतम 19°C। दोपहर में धूप तेज, रात में सुहावना मौसम।\n` +
          `• उज्जैन संभाग: अधिकतम 34°C, न्यूनतम 19°C। शुष्क मौसम, किसानों को सिंचाई की सलाह।\n` +
          `• ग्वालियर-चंबल: अधिकतम 35°C, न्यूनतम 17°C। दिन में तीखी धूप, उत्तर-पश्चिमी हवाएं।\n` +
          `• जबलपुर संभाग: अधिकतम 31°C, न्यूनतम 17°C। हल्की ठंडक का अहसास, दृश्यता सामान्य।\n` +
          `• सागर-बुंदेलखंड: अधिकतम 32°C, न्यूनतम 18°C। मौसम साफ, वर्षा की कोई संभावना नहीं।\n` +
          `• रीवा-शहडोल: अधिकतम 30°C, न्यूनतम 16°C। वन अंचलों में सुबह के समय हल्की धुंध।\n` +
          `• नर्मदापुरम संभाग: अधिकतम 31°C, न्यूनतम 19°C। पचमढ़ी में न्यूनतम 12°C दर्ज।`;
        break;
      }

      case PERMANENT_COLUMN_TYPES.DISTRICT_ROUNDUP:
      default: {
        columnTitle = `जिला डायरी: मध्य प्रदेश के 55 जिलों से जमीनी हलचल`;
        authorName = authorName || 'जिला संवाददाता नेटवर्क';
        byline = `प्रस्तुति: बीएनडब्ल्यू आंचलिक डेस्क (${district} एवं समीपस्थ अंचल)`;
        sourceAttribution = 'बीएनडब्ल्यू जिला संवाददाता नेटवर्क';
        section = 'DISTRICT_FOCUS';

        bodyText =
          `• ${district} / संभाग: जिला प्रशासन द्वारा जनसुनवाई में 140 से अधिक शिकायतों का त्वरित निराकरण, ग्रामीण पेयजल योजनाओं की समीक्षा।\n` +
          `• सीहोर / विदिशा: कृषि विस्तार अधिकारियों द्वारा रबी फसलों के उन्नत बीजों का वितरण, खाद की पर्याप्त उपलब्धता सुनिश्चित।\n` +
          `• उज्जैन: श्री महाकाल महालोक में श्रद्धालुओं की सुविधा हेतु नए ई-कार्ट रूट का संचालन आरंभ, यातायात प्रबंधन सुदृढ़।\n` +
          `• जबलपुर / कटनी: नर्मदा नदी के तटों पर स्वच्छता अभियान संपन्न, नगर निगम ने सिंगल-यूज प्लास्टिक के विरुद्ध चालानी कार्रवाई की।\n` +
          `• ग्वालियर / मुरैना: चंबल अंचल में औद्योगिक निवेश को प्रोत्साहन देने हेतु नवीन एमएसएमई क्लस्टर की रूपरेखा तैयार।`;
        break;
      }
    }

    const result = {
      type: safeType || PERMANENT_COLUMN_TYPES.DISTRICT_ROUNDUP,
      columnTitle,
      author: authorName,
      byline,
      bodyText,
      sourceAttribution,
      section,
      date: pubDate,
      district,
      division,
      metadata: this.getProviderInfo(),
    };

    // Helper to generate a ready-to-render EpaperPageElement
    result.element = this.toPageElement(result, bounds);

    return result;
  }

  /**
   * Helper that converts column generation output into a valid EpaperPageElement of type 'COLUMN'.
   *
   * @param {object} columnData - Data returned by generatePermanentColumn
   * @param {object} [bounds] - Custom position and dimensions
   * @returns {object} EpaperPageElement
   */
  static toPageElement(columnData, bounds) {
    const colId = `col-${(columnData.type || 'feat').toLowerCase()}-${Date.now()}`;
    const defaultBounds = {
      x: 42.52,
      y: 113.38,
      width: 280,
      height: 380,
    };

    return {
      id: colId,
      elementType: 'COLUMN',
      columnType: columnData.type,
      colSpan: bounds?.colSpan || 3,
      bounds: bounds || defaultBounds,
      customHeadline: columnData.columnTitle,
      customBodyText: columnData.bodyText,
      byline: columnData.byline || columnData.author,
      photoCredit: columnData.sourceAttribution,
      sourceAttribution: columnData.sourceAttribution,
      zIndex: 10,
    };
  }
}
