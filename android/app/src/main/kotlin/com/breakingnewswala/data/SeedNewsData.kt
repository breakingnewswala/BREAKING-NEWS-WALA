package com.breakingnewswala.data

import com.breakingnewswala.data.model.ArticleStatus
import com.breakingnewswala.data.model.EpaperEdition
import com.breakingnewswala.data.model.NewsArticle
import com.breakingnewswala.data.model.UserRole
import com.google.firebase.Timestamp
import java.util.Date

object SeedNewsData {
    private val baseTime = Timestamp(Date(System.currentTimeMillis() - 1800_000L))

    val curatedArticles: List<NewsArticle> = listOf(
        NewsArticle(
            id = "seed_nat_01",
            title = "देशभर में डिजिटल लोकल न्यूज़ नेटवर्क का बड़ा विस्तार, हर जिले से लाइव रिपोर्टिंग शुरू",
            summary = "नई दिल्ली से लेकर देश के हर प्रमुख जिले तक तेज़, सत्यापित और जन-केंद्रित पत्रकारिता का नया अध्याय।",
            content = """
                नई दिल्ली। ब्रेकिंग न्यूज़ वाला नेटवर्क ने आज राष्ट्रीय स्तर पर अपने हाइपरलोकल डिजिटल न्यूज़ मिशन का विस्तार किया है। अब देश के प्रमुख महानगरों के साथ-साथ मध्य प्रदेश, उत्तर प्रदेश, राजस्थान, बिहार और महाराष्ट्र के जिला मुख्यालयों से भी खबरें सीधे 10-पॉइंट फैक्ट-चेक के बाद पाठकों तक पहुंचेंगी।

                मुख्य संपादकीय डेस्क के अनुसार, हर क्षेत्रीय संवाददाता की रिपोर्ट को पहले सत्यापन कतार में जांचा जाता है। इसके बाद ही खबर को 'ब्रेकिंग' या 'लाइव' टैग के साथ प्रकाशित किया जाता है, ताकि अफवाहों पर रोक लगे और विश्वसनीय पत्रकारिता को बढ़ावा मिले।

                पाठकों की सुविधा के लिए ऐप में AI आधारित 3-पॉइंट त्वरित सारांश, डिजिटल ई-पेपर और पसंदीदा खबरें सेव करने के लिए क्लाउड बुकमार्क जैसी आधुनिक सुविधाएं भी जोड़ी गई हैं।
            """.trimIndent(),
            category = "राष्ट्रीय",
            district = "नई दिल्ली",
            state = "दिल्ली (राष्ट्रीय)",
            authorId = "seed_desk",
            authorName = "केंद्रीय संपादकीय डेस्क",
            authorRole = UserRole.ADMIN.name,
            status = ArticleStatus.PUBLISHED.name,
            breaking = true,
            live = true,
            viewCount = 4820,
            aiScore = 96,
            createdAt = baseTime,
            updatedAt = baseTime
        ),
        NewsArticle(
            id = "seed_mp_02",
            title = "भोपाल और इंदौर में मेट्रो कॉरिडोर का तेज विस्तार, यात्रियों के लिए स्मार्ट कार्ड सुविधा",
            summary = "दोनों प्रमुख शहरों में यातायात को सुगम बनाने के लिए नए स्टेशनों और फीडर बस सेवा की घोषणा।",
            content = """
                भोपाल / इंदौर। मध्य प्रदेश की राजधानी भोपाल और आर्थिक राजधानी इंदौर में मेट्रो रेल परियोजना के अगले चरण का कार्य तेजी से आगे बढ़ रहा है। शहरी विकास विभाग के अधिकारियों ने बताया कि आगामी महीनों में कई नए एलिवेटेड स्टेशनों पर यात्री सुविधाएं शुरू कर दी जाएंगी।

                यात्रियों की सुविधा के लिए एकीकृत डिजिटल स्मार्ट कार्ड और यूपीआई आधारित QR टिकटिंग प्रणाली लागू की जा रही है, जिससे कॉलेज छात्रों, नौकरीपेशा नागरिकों और व्यापारियों को प्रतिदिन के सफर में बड़ी राहत मिलेगी।
            """.trimIndent(),
            category = "विकास",
            district = "भोपाल",
            state = "मध्य प्रदेश",
            authorId = "seed_desk",
            authorName = "बीएनडब्ल्यू राज्य ब्यूरो",
            authorRole = UserRole.ADMIN.name,
            status = ArticleStatus.PUBLISHED.name,
            breaking = true,
            live = false,
            viewCount = 3190,
            aiScore = 92,
            createdAt = baseTime,
            updatedAt = baseTime
        ),
        NewsArticle(
            id = "seed_up_03",
            title = "लखनऊ में युवाओं के लिए एआई और डिजिटल स्किल समिट, 15 हजार नई तकनीकी नौकरियों का रोडमैप",
            summary = "आईटी पार्क और स्टार्टअप नीति के तहत स्थानीय युवाओं को प्रशिक्षण एवं प्लेसमेंट के अवसर।",
            content = """
                लखनऊ। राजधानी में आयोजित दो दिवसीय डिजिटल स्किल एवं स्टार्टअप समिट में देश की प्रमुख तकनीकी कंपनियों ने भाग लिया। इस दौरान क्लाउड कंप्यूटिंग, साइबर सुरक्षा और हिंदी एआई टूल्स पर विशेष सत्र आयोजित हुए।

                आयोग के प्रतिनिधियों ने कहा कि क्षेत्रीय भाषाओं में डिजिटल कंटेंट और ई-गवर्नेंस सेवाओं के बढ़ने से छोटे शहरों के युवाओं के लिए रोजगार के नए रास्ते खुले हैं।
            """.trimIndent(),
            category = "रोजगार",
            district = "लखनऊ",
            state = "उत्तर प्रदेश",
            authorId = "seed_desk",
            authorName = "उत्तर भारत ब्यूरो",
            authorRole = UserRole.REPORTER.name,
            status = ArticleStatus.PUBLISHED.name,
            breaking = false,
            live = false,
            viewCount = 2410,
            aiScore = 89,
            createdAt = baseTime,
            updatedAt = baseTime
        ),
        NewsArticle(
            id = "seed_mp_04",
            title = "इंदौर ने फिर रचा स्वच्छता और ग्रीन एनर्जी मॉडल का नया कीर्तिमान, सौर ऊर्जा से चलेंगे वार्ड कार्यालय",
            summary = "नगर निगम की नई पहल के तहत कचरा प्रबंधन के साथ सोलर ग्रिड से बिजली उत्पादन शुरू।",
            content = """
                इंदौर। देश के सबसे स्वच्छ शहर इंदौर ने अब हरित ऊर्जा के क्षेत्र में भी नया उदाहरण पेश किया है। नगर निगम के अधिकांश जोनल और वार्ड कार्यालयों की छतों पर हाई-एफिशिएंसी सोलर पैनल स्थापित किए गए हैं।

                अधिकारियों के मुताबिक इस कदम से न केवल बिजली खर्च में करोड़ों रुपये की बचत होगी, बल्कि कार्बन उत्सर्जन में भी उल्लेखनीय कमी आएगी।
            """.trimIndent(),
            category = "स्थानीय",
            district = "इंदौर",
            state = "मध्य प्रदेश",
            authorId = "seed_desk",
            authorName = "मालवा संवाददाता",
            authorRole = UserRole.REPORTER.name,
            status = ArticleStatus.PUBLISHED.name,
            breaking = false,
            live = false,
            viewCount = 2890,
            aiScore = 91,
            createdAt = baseTime,
            updatedAt = baseTime
        ),
        NewsArticle(
            id = "seed_rj_05",
            title = "जयपुर और जबलपुर में स्मार्ट पुलिसिंग एवं साइबर हेल्पडेस्क अपग्रेड, ऑनलाइन ठगी पर त्वरित कार्रवाई",
            summary = "नागरिकों को UPI और डिजिटल फ्रॉड से बचाने के लिए 24x7 त्वरित रिस्पॉन्स सेल सक्रिय।",
            content = """
                जयपुर / जबलपुर। बढ़ते डिजिटल लेन-देन के बीच ऑनलाइन धोखाधड़ी की घटनाओं को रोकने के लिए दोनों शहरों की पुलिस ने अपने साइबर हेल्पडेस्क को आधुनिक बनाया है।

                वरिष्ठ अधिकारियों ने नागरिकों से अपील की है कि किसी भी संदिग्ध कॉल, फर्जी लिंक या अनजान ओटीपी साझा न करें और तुरंत राष्ट्रीय साइबर हेल्पलाइन 1930 पर सूचना दें।
            """.trimIndent(),
            category = "अपराध",
            district = "जयपुर",
            state = "राजस्थान",
            authorId = "seed_desk",
            authorName = "स्पेशल इन्वेस्टिगेशन डेस्क",
            authorRole = UserRole.ADMIN.name,
            status = ArticleStatus.PUBLISHED.name,
            breaking = false,
            live = false,
            viewCount = 1950,
            aiScore = 88,
            createdAt = baseTime,
            updatedAt = baseTime
        ),
        NewsArticle(
            id = "seed_sp_06",
            title = "राष्ट्रीय युवा एथलेटिक्स और क्रिकेट शिविर में छोटे जिलों की प्रतिभाओं का शानदार प्रदर्शन",
            summary = "ग्वालियर, पटना और उज्जैन के युवा खिलाड़ियों ने राष्ट्रीय चयन ट्रायल में हासिल किया शीर्ष स्थान।",
            content = """
                नई दिल्ली / ग्वालियर। भारतीय खेल प्राधिकरण के संयुक्त चयन ट्रायल में इस वर्ष ग्रामीण और जिला स्तर के खिलाड़ियों ने शानदार प्रदर्शन कर चयनकर्ताओं को प्रभावित किया है।

                कोचिंग पैनल ने बताया कि जिला खेल परिसरों में बेहतर टर्फ और फिटनेस सुविधाएं मिलने से प्रतिभाओं को राष्ट्रीय मंच पर पहुंचने में मदद मिली है।
            """.trimIndent(),
            category = "खेल",
            district = "ग्वालियर",
            state = "मध्य प्रदेश",
            authorId = "seed_desk",
            authorName = "खेल डेस्क",
            authorRole = UserRole.REPORTER.name,
            status = ArticleStatus.PUBLISHED.name,
            breaking = false,
            live = false,
            viewCount = 1640,
            aiScore = 90,
            createdAt = baseTime,
            updatedAt = baseTime
        )
    )

    val epaperEditions: List<EpaperEdition> = listOf(
        EpaperEdition(
            id = "ep_national",
            cityOrEdition = "राष्ट्रीय संस्करण",
            state = "नई दिल्ली",
            editionDate = "आज का अंक • प्रातः संस्करण",
            pagesCount = 16,
            leadHeadline = "देशभर में हाइपरलोकल डिजिटल पत्रकारिता और सत्यापित समाचारों का नया युग",
            leadSummary = "10-पॉइंट फैक्ट-चेक सिस्टम के साथ हर जिले की बड़ी खबरें अब रीयल-टाइम में उपलब्ध।",
            secondHeadline = "संसद और नीति आयोग की नई बुनियादी ढांचा परियोजनाओं को मंजूरी",
            thirdHeadline = "भारतीय युवाओं के लिए एआई व डीप-टेक क्षेत्र में नए अवसर"
        ),
        EpaperEdition(
            id = "ep_bhopal",
            cityOrEdition = "भोपाल एवं मध्य भारत",
            state = "मध्य प्रदेश",
            editionDate = "आज का अंक • प्रातः संस्करण",
            pagesCount = 12,
            leadHeadline = "भोपाल मेट्रो कॉरिडोर विस्तार और स्मार्ट ट्रैफिक नियंत्रण केंद्र शुरू",
            leadSummary = "शहर के प्रमुख चौराहों पर एआई आधारित सिग्नल और फीडर बस नेटवर्क।",
            secondHeadline = "उज्जैन व ग्वालियर में औद्योगिक निवेश सम्मेलन की तैयारियां तेज",
            thirdHeadline = "जबलपुर नर्मदा पथ विकास परियोजना का पहला चरण पूर्ण"
        ),
        EpaperEdition(
            id = "ep_indore",
            cityOrEdition = "इंदौर व मालवा-निमाड़",
            state = "मध्य प्रदेश",
            editionDate = "आज का अंक • प्रातः संस्करण",
            pagesCount = 12,
            leadHeadline = "इंदौर के सभी जोनल कार्यालय सोलर ऊर्जा से लैस, नया हरित रिकॉर्ड",
            leadSummary = "स्वच्छता के बाद अब नवीकरणीय ऊर्जा मॉडल में इंदौर बना देश का अग्रणी शहर।",
            secondHeadline = "आईटी पार्क फेज-3 में 12 नई कंपनियों का शुभारंभ",
            thirdHeadline = "कृषि उपज मंडियों में डिजिटल भुगतान से किसानों को त्वरित लाभ"
        ),
        EpaperEdition(
            id = "ep_north",
            cityOrEdition = "लखनऊ • जयपुर • पटना",
            state = "उत्तर भारत",
            editionDate = "आज का अंक • प्रातः संस्करण",
            pagesCount = 14,
            leadHeadline = "उत्तर भारत में युवा कौशल विकास और साइबर सुरक्षा केंद्रों का विस्तार",
            leadSummary = "प्रमुख शहरों में स्टार्टअप और डिजिटल रोजगार मिशन के तहत नए प्रशिक्षण केंद्र।",
            secondHeadline = "जयपुर पर्यटन सर्किट के लिए ई-बस सेवा की शुरुआत",
            thirdHeadline = "पटना में गंगा एक्सप्रेस-वे संपर्क मार्ग का कार्य तेज"
        )
    )
}
