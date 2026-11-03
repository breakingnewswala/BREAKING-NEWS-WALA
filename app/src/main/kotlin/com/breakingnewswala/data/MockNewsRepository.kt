package com.breakingnewswala.data

import com.breakingnewswala.core.model.*

object MockNewsRepository {

    val divisions = listOf(
        DivisionItem("div-bhopal", "bhopal-division", "Bhopal Division", "भोपाल संभाग", "state-mp"),
        DivisionItem("div-indore", "indore-division", "Indore Division", "इंदौर संभाग", "state-mp"),
        DivisionItem("div-gwalior", "gwalior-division", "Gwalior Division", "ग्वालियर संभाग", "state-mp"),
        DivisionItem("div-jabalpur", "jabalpur-division", "Jabalpur Division", "जबलपुर संभाग", "state-mp"),
        DivisionItem("div-ujjain", "ujjain-division", "Ujjain Division", "उज्जैन संभाग", "state-mp"),
        DivisionItem("div-sagar", "sagar-division", "Sagar Division", "सागर संभाग", "state-mp"),
        DivisionItem("div-rewa", "rewa-division", "Rewa Division", "रीवा संभाग", "state-mp"),
        DivisionItem("div-shahdol", "shahdol-division", "Shahdol Division", "शहडोल संभाग", "state-mp"),
        DivisionItem("div-chambal", "chambal-division", "Chambal Division", "चंबल संभाग", "state-mp"),
        DivisionItem("div-narmadapuram", "narmadapuram-division", "Narmadapuram Division", "नर्मदापुरम संभाग", "state-mp")
    )

    val districts = listOf(
        // Bhopal Division
        DistrictItem("dist-bhopal", "bhopal", "Bhopal", "भोपाल", "div-bhopal", "state-mp"),
        DistrictItem("dist-sehore", "sehore", "Sehore", "सीहोर", "div-bhopal", "state-mp"),
        DistrictItem("dist-raisen", "raisen", "Raisen", "रायसेन", "div-bhopal", "state-mp"),
        DistrictItem("dist-rajgarh", "rajgarh", "Rajgarh", "राजगढ़", "div-bhopal", "state-mp"),
        DistrictItem("dist-vidisha", "vidisha", "Vidisha", "विदिशा", "div-bhopal", "state-mp"),

        // Indore Division
        DistrictItem("dist-indore", "indore", "Indore", "इंदौर", "div-indore", "state-mp"),
        DistrictItem("dist-dhar", "dhar", "Dhar", "धार", "div-indore", "state-mp"),
        DistrictItem("dist-barwani", "barwani", "Barwani", "बड़वानी", "div-indore", "state-mp"),
        DistrictItem("dist-alirajpur", "alirajpur", "Alirajpur", "अलीराजपुर", "div-indore", "state-mp"),
        DistrictItem("dist-jhabua", "jhabua", "Jhabua", "झाबुआ", "div-indore", "state-mp"),
        DistrictItem("dist-khargone", "khargone", "Khargone", "खरगोन", "div-indore", "state-mp"),
        DistrictItem("dist-khandwa", "khandwa", "Khandwa", "खंडवा", "div-indore", "state-mp"),
        DistrictItem("dist-burhanpur", "burhanpur", "Burhanpur", "बुरहानपुर", "div-indore", "state-mp"),

        // Gwalior Division
        DistrictItem("dist-gwalior", "gwalior", "Gwalior", "ग्वालियर", "div-gwalior", "state-mp"),
        DistrictItem("dist-shivpuri", "shivpuri", "Shivpuri", "शिवपुरी", "div-gwalior", "state-mp"),
        DistrictItem("dist-guna", "guna", "Guna", "गुना", "div-gwalior", "state-mp"),
        DistrictItem("dist-ashoknagar", "ashoknagar", "Ashoknagar", "अशोकनगर", "div-gwalior", "state-mp"),
        DistrictItem("dist-datia", "datia", "Datia", "दतिया", "div-gwalior", "state-mp"),

        // Jabalpur Division
        DistrictItem("dist-jabalpur", "jabalpur", "Jabalpur", "जबलपुर", "div-jabalpur", "state-mp"),
        DistrictItem("dist-katni", "katni", "Katni", "कटनी", "div-jabalpur", "state-mp"),
        DistrictItem("dist-narsinghpur", "narsinghpur", "Narsinghpur", "नरसिंहपुर", "div-jabalpur", "state-mp"),
        DistrictItem("dist-seoni", "seoni", "Seoni", "सिवनी", "div-jabalpur", "state-mp"),
        DistrictItem("dist-chhindwara", "chhindwara", "Chhindwara", "छिंदवाड़ा", "div-jabalpur", "state-mp"),
        DistrictItem("dist-pandhurna", "pandhurna", "Pandhurna", "पांढुर्णा", "div-jabalpur", "state-mp"),
        DistrictItem("dist-mandla", "mandla", "Mandla", "मंडला", "div-jabalpur", "state-mp"),
        DistrictItem("dist-dindori", "dindori", "Dindori", "डिंडोरी", "div-jabalpur", "state-mp"),
        DistrictItem("dist-balaghat", "balaghat", "Balaghat", "बालाघाट", "div-jabalpur", "state-mp"),

        // Ujjain Division
        DistrictItem("dist-ujjain", "ujjain", "Ujjain", "उज्जैन", "div-ujjain", "state-mp"),
        DistrictItem("dist-dewas", "dewas", "Dewas", "देवास", "div-ujjain", "state-mp"),
        DistrictItem("dist-ratlam", "ratlam", "Ratlam", "रतलाम", "div-ujjain", "state-mp"),
        DistrictItem("dist-shajapur", "shajapur", "Shajapur", "शाजापुर", "div-ujjain", "state-mp"),
        DistrictItem("dist-agar-malwa", "agar-malwa", "Agar Malwa", "आगर मालवा", "div-ujjain", "state-mp"),
        DistrictItem("dist-mandsaur", "mandsaur", "Mandsaur", "मंदसौर", "div-ujjain", "state-mp"),
        DistrictItem("dist-neemuch", "neemuch", "Neemuch", "नीमच", "div-ujjain", "state-mp"),

        // Sagar Division
        DistrictItem("dist-sagar", "sagar", "Sagar", "सागर", "div-sagar", "state-mp"),
        DistrictItem("dist-damoh", "damoh", "Damoh", "दमोह", "div-sagar", "state-mp"),
        DistrictItem("dist-panna", "panna", "Panna", "पन्ना", "div-sagar", "state-mp"),
        DistrictItem("dist-chhatarpur", "chhatarpur", "Chhatarpur", "छतरपुर", "div-sagar", "state-mp"),
        DistrictItem("dist-tikamgarh", "tikamgarh", "Tikamgarh", "टीकमगढ़", "div-sagar", "state-mp"),
        DistrictItem("dist-niwari", "niwari", "Niwari", "निवाड़ी", "div-sagar", "state-mp"),

        // Rewa Division
        DistrictItem("dist-rewa", "rewa", "Rewa", "रीवा", "div-rewa", "state-mp"),
        DistrictItem("dist-satna", "satna", "Satna", "सतना", "div-rewa", "state-mp"),
        DistrictItem("dist-maihar", "maihar", "Maihar", "मैहर", "div-rewa", "state-mp"),
        DistrictItem("dist-mauganj", "mauganj", "Mauganj", "मऊगंज", "div-rewa", "state-mp"),
        DistrictItem("dist-sidhi", "sidhi", "Sidhi", "सीधी", "div-rewa", "state-mp"),
        DistrictItem("dist-singrauli", "singrauli", "Singrauli", "सिंगरौली", "div-rewa", "state-mp"),

        // Shahdol Division
        DistrictItem("dist-shahdol", "shahdol", "Shahdol", "शहडोल", "div-shahdol", "state-mp"),
        DistrictItem("dist-umaria", "umaria", "Umaria", "उमरिया", "div-shahdol", "state-mp"),
        DistrictItem("dist-anuppur", "anuppur", "Anuppur", "अनूपपुर", "div-shahdol", "state-mp"),

        // Chambal Division
        DistrictItem("dist-morena", "morena", "Morena", "मुरैना", "div-chambal", "state-mp"),
        DistrictItem("dist-bhind", "bhind", "Bhind", "भिंड", "div-chambal", "state-mp"),
        DistrictItem("dist-sheopur", "sheopur", "Sheopur", "श्योपुर", "div-chambal", "state-mp"),

        // Narmadapuram Division
        DistrictItem("dist-narmadapuram", "narmadapuram", "Narmadapuram", "नर्मदापुरम", "div-narmadapuram", "state-mp"),
        DistrictItem("dist-harda", "harda", "Harda", "हरदा", "div-narmadapuram", "state-mp"),
        DistrictItem("dist-betul", "betul", "Betul", "बैतूल", "div-narmadapuram", "state-mp")
    )

    val categories = listOf(
        CategoryItem("cat-top", "top-news", "Top News", "टॉप न्यूज़", sortOrder = 1),
        CategoryItem("cat-mp", "madhya-pradesh", "Madhya Pradesh", "मध्य प्रदेश", sortOrder = 2),
        CategoryItem("cat-politics", "politics", "Politics", "राजनीति", sortOrder = 3),
        CategoryItem("cat-crime", "crime", "Crime & Law", "क्राइम एवं कानून", sortOrder = 4),
        CategoryItem("cat-agri", "agriculture", "Agriculture & Mandi", "कृषि एवं मंडी भाव", sortOrder = 5),
        CategoryItem("cat-weather", "weather", "Weather", "मौसम व पर्यावरण", sortOrder = 6),
        CategoryItem("cat-business", "business", "Business & Jobs", "व्यापार एवं रोजगार", sortOrder = 7),
        CategoryItem("cat-viral", "viral", "Viral & Social", "वायरल खबरें", sortOrder = 8)
    )

    val initialArticles: MutableList<ArticleDetail> = mutableListOf(
        ArticleDetail(
            id = "art-1",
            slug = "mp-rabi-procurement-e-uporjan-registration",
            title = "मध्य प्रदेश में समर्थन मूल्य पर गेहूं और चना उपार्जन हेतु 55 जिलों में ई-उपार्जन पोर्टल पर किसान पंजीयन शुरू",
            summary = "खाद्य एवं नागरिक आपूर्ति विभाग ने जारी किए दिशा-निर्देश। प्रदेश के 35 लाख से अधिक किसानों को मिलेगा सीधा लाभ।",
            content = """
भोपाल। मध्य प्रदेश सरकार ने रबी विपणन वर्ष 2026-27 के लिए समर्थन मूल्य पर गेहूं, चना, मसूर और सरसों के उपार्जन हेतु राज्यव्यापी पंजीयन प्रक्रिया की आधिकारिक शुरुआत कर दी है। खाद्य, नागरिक आपूर्ति एवं उपभोक्ता संरक्षण विभाग द्वारा प्रदेश के सभी 55 जिलों के कलेक्टर्स को विस्तृत दिशा-निर्देश जारी कर दिए गए हैं।

पंजीयन की मुख्य विशेषताएं:
1. किसान ई-उपार्जन पोर्टल (e-Uparjan) एवं एमपी किसान ऐप (MP Kisan App) के माध्यम से घर बैठे निःशुल्क पंजीयन करा सकते हैं।
2. ग्राम पंचायत, जनपद पंचायत, तहसील कार्यालयों एवं सहकारी समितियों में स्थापित सुविधा केंद्रों पर भी बायोमेट्रिक प्रमाणीकरण के साथ पंजीयन सुविधा उपलब्ध है।
3. बटाईदार एवं सिकमी किसानों के लिए अनुबंध पत्र अनिवार्य किया गया है ताकि वास्तविक जोतदार को ही उपार्जन का लाभ प्राप्त हो।

कृषि विशेषज्ञों का मानना है कि इस वर्ष अनुकूल मौसमी दशाओं और पर्याप्त जल उपलब्धता के चलते मालवा-निमाड़ और महाकोशल अंचल में बंपर पैदावार होने की प्रबल संभावना है। शासन ने उपार्जन केंद्रों पर किसानों के बैठने, पेयजल और छाया की समुचित व्यवस्था सुनिश्चित करने के कड़े निर्देश दिए हैं।
            """.trimIndent(),
            status = ArticleStatus.PUBLISHED,
            featuredImage = "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop&q=80",
            imageCaption = "मध्य प्रदेश के खेतों में लहलहाती फसल एवं उपार्जन केंद्र की तैयारी",
            imageAttribution = "बीएनडब्ल्यू संवाददाता नेटवर्क",
            categoryId = "cat-agri",
            categoryName = "कृषि एवं मंडी भाव",
            districtId = "dist-bhopal",
            districtName = "भोपाल",
            authorId = "rep-101",
            authorName = "दिनेश शर्मा (राज्य ब्यूरो)",
            authorRole = "विशेष संवाददाता",
            isBreaking = true,
            viewCount = 14250,
            shareCount = 1840,
            publishedAt = "2026-11-03 08:30 IST",
            createdAt = "2026-11-03 07:15 IST",
            tags = listOf("ई-उपार्जन", "गेहूं पंजीयन", "मध्य प्रदेश किसान", "समर्थन मूल्य")
        ),
        ArticleDetail(
            id = "art-2",
            slug = "indore-bio-cng-green-fuel-fleet-expansion",
            title = "इंदौर: एशिया के सबसे बड़े बायो-सीएनजी संयंत्र का विस्तार, शहर में 400 अतिरिक्त सिटी बसें चलेंगी ग्रीन फ्यूल से",
            summary = "स्वच्छता सर्वेक्षण में लगातार सिरमौर रहे इंदौर ने पर्यावरण संरक्षण में रचा नया कीर्तिमान। प्रतिदिन 550 टन गीले कचरे का निस्तारण।",
            content = """
इंदौर। देश के सबसे स्वच्छ शहर इंदौर ने हरित ऊर्जा और सतत शहरी विकास के क्षेत्र में एक और ऐतिहासिक छलांग लगाई है। देवगुराड़िया स्थित एशिया के सबसे बड़े बायो-सीएनजी (गोबर-धन) संयंत्र के द्वितीय चरण के विस्तार को नगर निगम और राज्य पर्यावरण बोर्ड से औपचारिक स्वीकृति मिल गई है।

संयंत्र विस्तार के प्रमुख बिंदु:
• वर्तमान क्षमता 17,000 किलोग्राम प्रतिदिन से बढ़कर 25,000 किलोग्राम बायो-सीएनजी प्रतिदिन हो जाएगी।
• शहर की लोक परिवहन कंपनी (AICTSL) के बेड़े में 400 नई इलेक्ट्रिक एवं बायो-सीएनजी बसें शामिल की जाएंगी।
• इससे नगर निगम को प्रतिवर्ष लगभग 18 करोड़ रुपये की ईंधन बचत होगी तथा वायु प्रदूषण के स्तर में 22% की उल्लेखनीय गिरावट आएगी।

महापौर ने बताया कि इंदौर के इस मॉडल का अध्ययन करने के लिए नीति आयोग और केंद्र सरकार के प्रतिनिधिमंडल के साथ-साथ कई विदेशी शहरी निकायों के विशेषज्ञ भी लगातार इंदौर का दौरा कर रहे हैं।
            """.trimIndent(),
            status = ArticleStatus.PUBLISHED,
            featuredImage = "https://images.unsplash.com/photo-1570126618953-d437176e8c79?w=800&auto=format&fit=crop&q=80",
            imageCaption = "इंदौर का बायो-सीएनजी संयंत्र और ग्रीन पब्लिक ट्रांसपोर्ट बेड़ा",
            imageAttribution = "बीएनडब्ल्यू मालवा डेस्क",
            categoryId = "cat-mp",
            categoryName = "मध्य प्रदेश",
            districtId = "dist-indore",
            districtName = "इंदौर",
            authorId = "rep-102",
            authorName = "राजेश पाटीदार",
            authorRole = "जिला प्रमुख (इंदौर)",
            isBreaking = false,
            viewCount = 9820,
            shareCount = 940,
            publishedAt = "2026-11-03 09:15 IST",
            createdAt = "2026-11-03 08:00 IST",
            tags = listOf("इंदौर", "बायो-सीएनजी", "स्वच्छता", "हरित ऊर्जा")
        ),
        ArticleDetail(
            id = "art-3",
            slug = "niwari-orchha-ram-raja-mandir-tourism-development",
            title = "निवाड़ी: ओरछा रामराजा मंदिर में उमड़ा आस्था का जनसैलाब, पर्यटन कॉरिडोर हेतु 50 करोड़ का मास्टर प्लान स्वीकृत",
            summary = "बुंदेलखंड की ऐतिहासिक धरोहर ओरछा को मिलेगा नया स्वरूप। बेतवा नदी के कंचना घाट और महलों का होगा कायाकल्प।",
            content = """
निवाड़ी। मध्य प्रदेश के नवगठित जिले निवाड़ी के अंतर्गत आने वाले विश्वप्रसिद्ध धार्मिक एवं ऐतिहासिक नगर ओरछा में आज विशेष पर्व के अवसर पर श्रद्धालुओं की भारी भीड़ उमड़ी। देश के एकमात्र ऐसे देवालय जहां भगवान श्रीराम को 'राजा' के रूप में सशस्त्र सलामी दी जाती है, वहां सुबह से ही जय श्रीराम के जयघोष गूंजते रहे।

ओरछा कॉरिडोर विकास योजना:
1. बेतवा नदी के तट पर स्थित कंचना घाट और चतुर्भुज मंदिर के आसपास भव्य हेरिटेज पाथवे का निर्माण होगा।
2. 50 करोड़ रुपये की प्रारंभिक लागत से श्रद्धालुओं के लिए मल्टीलेवल पार्किंग, सुगम दर्शन लेन और डिजिटल गाइड केंद्र बनाए जाएंगे।
3. स्थानीय होमस्टे और बुंदेली हस्तशिल्प को बढ़ावा देने के लिए शिल्प ग्राम की स्थापना की जाएगी जिससे स्थानीय युवाओं को रोजगार प्राप्त होगा।

कलेक्टर निवाड़ी ने बताया कि संपूर्ण मंदिर परिक्षेत्र में सुरक्षा व्यवस्था के पुख्ता इंतजाम किए गए हैं तथा ड्रोन कैमरों से निरंतर निगरानी रखी जा रही है।
            """.trimIndent(),
            status = ArticleStatus.PUBLISHED,
            featuredImage = "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=800&auto=format&fit=crop&q=80",
            imageCaption = "ओरछा का भव्य रामराजा मंदिर एवं बेतवा नदी का तट",
            imageAttribution = "बीएनडब्ल्यू बुंदेलखंड डेस्क",
            categoryId = "cat-mp",
            categoryName = "मध्य प्रदेश",
            districtId = "dist-niwari",
            districtName = "निवाड़ी",
            authorId = "rep-103",
            authorName = "अमित बुंदेला",
            authorRole = "संवाददाता (निवाड़ी/ओरछा)",
            isBreaking = false,
            viewCount = 11500,
            shareCount = 1420,
            publishedAt = "2026-11-03 10:00 IST",
            createdAt = "2026-11-03 09:20 IST",
            tags = listOf("निवाड़ी", "ओरछा", "रामराजा सरकार", "बुंदेलखंड पर्यटन")
        ),
        ArticleDetail(
            id = "art-4",
            slug = "ujjain-mandi-bhav-soyabean-wheat-record-arrivals",
            title = "उज्जैन मंडी: सोयाबीन और गेहूं के दामों में उछाल, आवक तेज होने से किसानों के चेहरों पर लौटी रौनक",
            summary = "मालवा अंचल की प्रमुख कृषि उपज मंडी उज्जैन में दर्ज की गई रिकॉर्ड 45,000 क्विंटल आवक। व्यापारियों में प्रतिस्पर्धा से भाव मजबूत।",
            content = """
उज्जैन। मालवा क्षेत्र की सबसे बड़ी कृषि उपज मंडियों में शुमार उज्जैन मंडी में आज फसलों की भारी आवक देखी गई। मंडी सचिव के अनुसार आज सुबह से ही उज्जैन और आसपास के 50 से अधिक गांवों से किसान अपनी उपज लेकर पहुंचे।

आज के प्रमुख मंडी भाव (प्रति क्विंटल):
• सोयाबीन: ₹4,800 से ₹5,450 (औसत ₹5,200)
• गेहूं (लोकवन): ₹2,600 से ₹3,150 (औसत ₹2,850)
• चना (देसी व काबुली): ₹5,800 से ₹7,200 (औसत ₹6,400)
• लहसुन: ₹8,000 से ₹14,500 प्रति क्विंटल

मंडी प्रशासन ने किसानों की सुविधा हेतु टोकन प्रणाली और ऑनलाइन तौल कांटे की व्यवस्था की है। भुगतान 24 घंटे के भीतर सीधे किसानों के बैंक खातों में आरटीजीएस (RTGS) के जरिए अंतरित किया जा रहा है।
            """.trimIndent(),
            status = ArticleStatus.PUBLISHED,
            featuredImage = "https://images.unsplash.com/photo-1586771107445-d3ca888129ff?w=800&auto=format&fit=crop&q=80",
            imageCaption = "उज्जैन कृषि उपज मंडी में फसलों की नीलामी और आवक",
            imageAttribution = "बीएनडब्ल्यू मंडी डेस्क",
            categoryId = "cat-agri",
            categoryName = "कृषि एवं मंडी भाव",
            districtId = "dist-ujjain",
            districtName = "उज्जैन",
            authorId = "rep-104",
            authorName = "गोपाल वैष्णव",
            authorRole = "मंडी संवाददाता (उज्जैन)",
            isBreaking = false,
            viewCount = 7400,
            shareCount = 580,
            publishedAt = "2026-11-03 10:45 IST",
            createdAt = "2026-11-03 10:10 IST",
            tags = listOf("उज्जैन मंडी", "मंडी भाव", "सोयाबीन", "गेहूं")
        ),
        ArticleDetail(
            id = "art-5",
            slug = "bhopal-assembly-budget-session-welfare-schemes",
            title = "भोपाल: विधानसभा के आगामी सत्र की अधिसूचना जारी, लाड़ली बहना व सिंचाई परियोजनाओं के वित्तीय प्रावधान पर चर्चा",
            summary = "विधानसभा सचिवालय ने जारी किया अनंतिम कार्यक्रम। 55 जिलों के विधायकों द्वारा लगाए गए 3,200 से अधिक तारांकित प्रश्न।",
            content = """
भोपाल। मध्य प्रदेश विधानसभा के आगामी बजट सत्र की आधिकारिक अधिसूचना राज्यपाल के आदेशानुसार जारी कर दी गई है। सत्र में राज्य सरकार वित्तीय वर्ष का संपूर्ण बजट सदन के पटल पर रखेगी।

सत्र की मुख्य कार्यसूची:
1. मुख्यमंत्री लाड़ली बहना योजना, किसान कल्याण योजना एवं छात्रवृत्ति योजनाओं के बजट आवंटन पर विस्तृत चर्चा।
2. चंबल एवं केन-बेतवा लिंक राष्ट्रीय नदी जोड़ो परियोजना के अंतर्गत भूमि अधिग्रहण और पुनर्वास पैकेज पर श्वेत पत्र।
3. ग्रामीण सड़कों एवं नल-जल योजनाओं की गुणवत्ता निगरानी हेतु नया विनियामक ढांचा।

संसदीय कार्य मंत्री ने कहा कि सरकार विपक्ष के प्रत्येक सकारात्मक प्रश्न का तथ्यात्मक उत्तर देने के लिए पूरी तरह तत्पर है।
            """.trimIndent(),
            status = ArticleStatus.PUBLISHED,
            featuredImage = "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&auto=format&fit=crop&q=80",
            imageCaption = "मध्य प्रदेश विधानसभा भवन, भोपाल",
            imageAttribution = "बीएनडब्ल्यू स्टेट ब्यूरो",
            categoryId = "cat-politics",
            categoryName = "राजनीति",
            districtId = "dist-bhopal",
            districtName = "भोपाल",
            authorId = "rep-101",
            authorName = "दिनेश शर्मा (राज्य ब्यूरो)",
            authorRole = "विशेष संवाददाता",
            isBreaking = true,
            viewCount = 12900,
            shareCount = 1100,
            publishedAt = "2026-11-03 11:15 IST",
            createdAt = "2026-11-03 10:30 IST",
            tags = listOf("भोपाल", "विधानसभा", "बजट सत्र", "मध्य प्रदेश राजनीति")
        ),
        ArticleDetail(
            id = "art-6",
            slug = "rewa-ultra-mega-solar-plant-record-power-generation",
            title = "रीवा: 750 मेगावाट अल्ट्रा मेगा सोलर पार्क ने स्थापित किया नया कीर्तिमान, ग्रीन एनर्जी उत्पादन में देश में अव्वल",
            summary = "विंध्य अंचल के रीवा सोलर प्लांट से प्रतिदिन 38 लाख यूनिट हरित बिजली ग्रिड को भेजी जा रही है।",
            content = """
रीवा। मध्य प्रदेश के विंध्य क्षेत्र स्थित 750 मेगावाट क्षमता वाले रीवा अल्ट्रा मेगा सोलर पार्क (RUMSL) ने आज बिजली उत्पादन के नए कीर्तिमान को छुआ है। प्लांट के सभी तीनों सोलर प्लॉट्स पूरी क्षमता के साथ कार्य कर रहे हैं।

विशेष उपलब्धियां:
• इस सौर ऊर्जा संयंत्र से उत्पादित कुल बिजली का 24% हिस्सा दिल्ली मेट्रो रेल कॉर्पोरेशन (DMRC) को प्रदाय किया जाता है।
• शेष 76% विद्युत मध्य प्रदेश के राज्य डिस्कॉम्स (MPPMCL) को नाममात्र की न्यूनतम दरों पर दी जा रही है।
• कार्बन उत्सर्जन में प्रतिवर्ष 15.4 लाख टन की कमी आ रही है जो लगभग 2.6 करोड़ पेड़ लगाने के समतुल्य है।

नवीन एवं नवकरणीय ऊर्जा विभाग के मुख्य अभियंता ने बताया कि नीमच, आगर और शाजापुर में बन रहे नए सोलर पार्कों को भी शीघ्र ही पूरी क्षमता के साथ सिंक्रोनाइज किया जाएगा।
            """.trimIndent(),
            status = ArticleStatus.PUBLISHED,
            featuredImage = "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800&auto=format&fit=crop&q=80",
            imageCaption = "रीवा अल्ट्रा मेगा सोलर प्लांट की विस्तृत पैनल्स",
            imageAttribution = "बीएनडब्ल्यू विंध्य ब्यूरो",
            categoryId = "cat-business",
            categoryName = "व्यापार एवं रोजगार",
            districtId = "dist-rewa",
            districtName = "रीवा",
            authorId = "rep-105",
            authorName = "विवेक त्रिपाठी",
            authorRole = "संवाददाता (रीवा)",
            isBreaking = false,
            viewCount = 6800,
            shareCount = 420,
            publishedAt = "2026-11-03 11:45 IST",
            createdAt = "2026-11-03 11:00 IST",
            tags = listOf("रीवा", "सोलर पार्क", "ग्रीन एनर्जी", "विंध्य")
        )
    )

    val epaperEditions = listOf(
        EpaperEdition(
            id = "epaper-bhopal-today",
            title = "भोपाल मुख्य संस्करण",
            editionDate = "2026-11-03",
            districtId = "dist-bhopal",
            districtName = "भोपाल",
            pdfUrl = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
            totalPages = 8,
            thumbnailUrl = "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&auto=format&fit=crop&q=80"
        ),
        EpaperEdition(
            id = "epaper-indore-today",
            title = "इंदौर महानगर संस्करण",
            editionDate = "2026-11-03",
            districtId = "dist-indore",
            districtName = "इंदौर",
            pdfUrl = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
            totalPages = 10,
            thumbnailUrl = "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=600&auto=format&fit=crop&q=80"
        ),
        EpaperEdition(
            id = "epaper-gwalior-today",
            title = "ग्वालियर-चंबल अंचल संस्करण",
            editionDate = "2026-11-03",
            districtId = "dist-gwalior",
            districtName = "ग्वालियर",
            pdfUrl = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
            totalPages = 8,
            thumbnailUrl = "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&auto=format&fit=crop&q=80"
        ),
        EpaperEdition(
            id = "epaper-jabalpur-today",
            title = "महाकोशल संस्कारधानी संस्करण",
            editionDate = "2026-11-03",
            districtId = "dist-jabalpur",
            districtName = "जबलपुर",
            pdfUrl = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
            totalPages = 8,
            thumbnailUrl = "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=600&auto=format&fit=crop&q=80"
        ),
        EpaperEdition(
            id = "epaper-niwari-today",
            title = "निवाड़ी व बुंदेलखंड संस्करण",
            editionDate = "2026-11-03",
            districtId = "dist-niwari",
            districtName = "निवाड़ी",
            pdfUrl = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
            totalPages = 6,
            thumbnailUrl = "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&auto=format&fit=crop&q=80"
        )
    )

    fun toArticleItem(article: ArticleDetail): ArticleItem {
        return ArticleItem(
            id = article.id,
            slug = article.slug,
            title = article.title,
            summary = article.summary,
            content = article.content,
            status = article.status,
            featuredImage = article.featuredImage,
            categoryId = article.categoryId,
            categoryName = article.categoryName,
            districtId = article.districtId,
            districtName = article.districtName,
            authorId = article.authorId,
            authorName = article.authorName,
            isBreaking = article.isBreaking,
            viewCount = article.viewCount,
            publishedAt = article.publishedAt,
            createdAt = article.createdAt
        )
    }

    fun getAllArticleItems(): List<ArticleItem> {
        return initialArticles.filter { it.status == ArticleStatus.PUBLISHED }.map { toArticleItem(it) }
    }

    fun getArticleById(id: String): ArticleDetail? {
        return initialArticles.find { it.id == id || it.slug == id }
    }

    fun addReporterDraft(draft: CreateDraftRequest, authorId: String = "rep-101", authorName: String = "संवाददाता (भोपाल)"): ArticleDetail {
        val newId = "art-local-${System.currentTimeMillis()}"
        val cat = categories.find { it.id == draft.categoryId }
        val dist = districts.find { it.id == draft.districtId }
        val article = ArticleDetail(
            id = newId,
            slug = "draft-$newId",
            title = draft.title,
            summary = draft.summary,
            content = draft.content,
            status = ArticleStatus.PENDING_REVIEW,
            featuredImage = "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=80",
            imageCaption = draft.imageCaption,
            categoryId = draft.categoryId,
            categoryName = cat?.nameHi ?: "मध्य प्रदेश",
            districtId = draft.districtId,
            districtName = dist?.nameHi ?: "भोपाल",
            authorId = authorId,
            authorName = authorName,
            authorRole = "फील्ड संवाददाता",
            isBreaking = draft.isBreaking,
            publishedAt = null,
            createdAt = "अभी-अभी दर्ज किया गया"
        )
        initialArticles.add(0, article)
        return article
    }
}
