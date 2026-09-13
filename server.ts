import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase payload limits for image uploads
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Check availability of AI Providers (Gemini & OpenAI)
app.get("/api/ai-providers-status", (req, res) => {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  const geminiAvailable = Boolean(geminiKey && geminiKey !== "MY_GEMINI_API_KEY" && geminiKey.trim().length > 5);
  const openaiAvailable = Boolean(openaiKey && openaiKey !== "MY_OPENAI_API_KEY" && openaiKey.trim().length > 5);

  return res.json({
    geminiAvailable,
    openaiAvailable,
  });
});

// Image proxy endpoint to bypass CORS when loading news site images onto HTML5 Canvas
app.get("/api/proxy-image", async (req, res) => {
  try {
    const imageUrl = req.query.url as string;
    if (!imageUrl) {
      return res.status(400).send("Missing url parameter");
    }

    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      return res.status(response.status).send(`Failed to fetch image: ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.send(buffer);
  } catch (err: any) {
    console.error("Error proxying image:", err);
    return res.status(500).send("Error proxying image");
  }
});

// Server-side Gemini initialization
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not set in environment variables.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Server-side OpenAI initialization (lazy loading)
let openaiClient: OpenAI | null = null;
function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.trim() === "" || apiKey === "MY_OPENAI_API_KEY") {
    throw new Error(
      "OPENAI_API_KEY सेट नहीं है। कृपया AI Studio Settings (या .env) में जाकर 'OPENAI_API_KEY' दर्ज करें, अथवा 'Gemini AI' विकल्प चुनें।"
    );
  }
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: apiKey.trim() });
  }
  return openaiClient;
}

// User-friendly error message cleaner for 503/429/transient errors
function cleanErrorMessage(err: any): string {
  const raw = String(err?.message || err || "");
  if (raw.includes("503") || raw.toLowerCase().includes("high demand") || raw.toLowerCase().includes("unavailable")) {
    return "AI मॉडल पर वर्तमान में अत्यधिक लोड है (503 High Demand)। कुछ सेकंड बाद पुनः प्रयास करें या इनपुट टेक्स्ट से तैयार ड्राफ्ट का उपयोग करें।";
  }
  if (raw.includes("429") || raw.toLowerCase().includes("resource_exhausted") || raw.toLowerCase().includes("quota")) {
    return "दैनिक या प्रति मिनट AI लिमिट पार हो गई है (429 Rate Limit)। कृपया कुछ समय बाद पुनः प्रयास करें।";
  }
  return raw || "AI अनुरोध निष्पादित करने में त्रुटि हुई";
}

// Resilient Gemini generator with automatic retry & fallback across alternate models
const DEFAULT_FALLBACK_MODELS = [
  "gemini-flash-latest",
  "gemini-3.8-flash",
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash",
];

async function generateWithFallbackAndRetry(
  ai: GoogleGenAI,
  models: string[],
  reqOptions: {
    contents: any;
    config?: any;
  },
  maxRetriesPerModel: number = 2
) {
  let lastError: any = null;

  for (const model of models) {
    for (let attempt = 0; attempt < maxRetriesPerModel; attempt++) {
      try {
        const res = await ai.models.generateContent({
          model,
          contents: reqOptions.contents,
          config: reqOptions.config,
        });
        return res;
      } catch (err: any) {
        lastError = err;
        const msg = String(err?.message || "").toLowerCase();
        const status = err?.status || err?.code || 0;
        const is503HighDemand =
          status === 503 ||
          msg.includes("503") ||
          msg.includes("high demand") ||
          msg.includes("unavailable");
        const isRateLimit =
          status === 429 ||
          msg.includes("429") ||
          msg.includes("resource_exhausted") ||
          msg.includes("quota");
        const isTransient =
          is503HighDemand ||
          isRateLimit ||
          msg.includes("temporarily") ||
          msg.includes("timeout") ||
          msg.includes("fetch failed");

        console.log(
          `[Gemini Call] Model "${model}" (attempt ${attempt + 1}/${maxRetriesPerModel}) info: ${status || (is503HighDemand ? "503 High Demand (switching model)" : msg.slice(0, 80))}`
        );

        // If the model is experiencing 503 high demand or rate limits, don't waste time hammering the same overloaded model!
        // Immediately break out to try the next alternate model in the fallback pool.
        if (is503HighDemand || isRateLimit) {
          break; // Try next fallback model immediately
        }

        if (isTransient && attempt < maxRetriesPerModel - 1) {
          await new Promise((resolve) => setTimeout(resolve, 800 * Math.pow(2, attempt)));
          continue;
        }
        break; // Try next fallback model
      }
    }
  }

  throw lastError;
}

// Local smart news parser when AI models are experiencing 503 spike
function createLocalNewsFallback(input: string, linkUrl?: string) {
  const clean = (input || "").trim();
  const firstLine = clean.split(/[\n\r]+/)[0]?.trim() || "ताज़ा समाचार अपडेट";

  // Identify known Madhya Pradesh / Indian locations in text
  const locationList = [
    "शहडोल", "रीवा", "सीधी", "सतना", "भोपाल", "इंदौर", "जबलपुर", "ग्वालियर", "उज्जैन",
    "सागर", "छतरपुर", "दमोह", "कटनी", "मंडला", "डिंडोरी", "अनूपपुर", "उमरिया", "सिंगरौली",
    "दिल्ली", "नई दिल्ली", "मध्य प्रदेश", "उत्तर प्रदेश"
  ];
  let detectedLocation = "मध्य प्रदेश";
  for (const loc of locationList) {
    if (clean.includes(loc)) {
      detectedLocation = loc;
      break;
    }
  }

  // Create headline (clean up command prefixes if any)
  let headline = firstLine
    .replace(/^(न्यूज बनाओ|हेडलाइन बनाओ|खबर बनाओ|ब्रेकिंग न्यूज|headline:|news:)\s*[:\-\s]*/i, "")
    .trim();
  if (headline.length > 95) {
    headline = headline.slice(0, 92) + "...";
  }

  // Pick highlight words: numbers, quoted words or location
  const words = headline.split(/\s+/);
  const highlightWords: string[] = [];
  if (detectedLocation && detectedLocation !== "मध्य प्रदेश") {
    highlightWords.push(detectedLocation);
  }
  for (const w of words) {
    const cleanW = w.replace(/[.,:;!?'"()]/g, "");
    if (/\d+/.test(cleanW) || cleanW.length >= 6) {
      if (!highlightWords.includes(cleanW) && highlightWords.length < 3) {
        highlightWords.push(cleanW);
      }
    }
  }

  let formattedHeadline = headline;
  if (highlightWords.length > 0) {
    for (const hw of highlightWords) {
      if (formattedHeadline.includes(hw)) {
        formattedHeadline = formattedHeadline.replace(
          new RegExp(`(${hw})`, "g"),
          "[yellow]$1[/yellow]"
        );
        break;
      }
    }
  }

  const cleanHeadlinePure = headline.replace(/[^a-zA-Z0-9\u0900-\u097F\s]/g, "");
  const locTag = detectedLocation.replace(/\s+/g, "");

  // Detect prominent speaker in headline / input
  let speakerName = "";
  let speakerTitle = "";
  if (/दिग्विजय/.test(clean)) {
    speakerName = "दिग्विजय सिंह";
    speakerTitle = "पूर्व मुख्यमंत्री";
  } else if (/मोहन यादव|सीएम मोहन|CM मोहन/.test(clean)) {
    speakerName = "डॉ. मोहन यादव";
    speakerTitle = "मुख्यमंत्री, मप्र";
  } else if (/शिवराज/.test(clean)) {
    speakerName = "शिवराज सिंह चौहान";
    speakerTitle = "केंद्रीय मंत्री";
  } else if (/कमलनाथ/.test(clean)) {
    speakerName = "कमलनाथ";
    speakerTitle = "पूर्व मुख्यमंत्री";
  } else if (/अनिरुद्धाचार्य/.test(clean)) {
    speakerName = "अनिरुद्धाचार्य महाराज";
    speakerTitle = "कथावाचक";
  } else if (/धीरेंद्र शास्त्री|बागेश्वर/.test(clean)) {
    speakerName = "पंडित धीरेंद्र शास्त्री";
    speakerTitle = "पीठाधीश्वर";
  }

  const summary = `${headline} को लेकर विस्तृत रिपोर्ट सामने आई है। इस मामले में संबंधित अधिकारियों एवं स्थानीय प्रशासन द्वारा आवश्यक संज्ञान लेकर अग्रिम कार्रवाई की जा रही है।\n\nघटनाक्रम से जुड़ी विस्तृत जानकारी और हर ताजा अपडेट के लिए जुड़े रहें ब्रेकिंग न्यूज़ वाला के साथ।\n\n#breakingnewswala #BreakingNews #HindiNews #${locTag}News #${cleanHeadlinePure.slice(0, 15).replace(/\s+/g, "")} #BNWTV`;

  return {
    headline,
    headlineOptions: [
      headline,
      `${detectedLocation}: ${headline}`,
      `बड़ी खबर: ${headline}`,
    ],
    highlightWords,
    formattedHeadline,
    location: detectedLocation,
    summary,
    category: "ताज़ा ख़बर",
    suggestedImagePrompt: `Journalistic news press photo depicting ${headline}, realistic news photography, India`,
    isAiGeneratedPhoto: false,
    speakerName,
    speakerTitle,
    isLocalFallback: true,
    warning: "AI मॉडल पर अस्थायी लोड के कारण आपकी इनपुट टेक्स्ट से त्वरित ड्राफ्ट तैयार किया गया है। आप इसे सीधे लागू या संपादित कर सकते हैं।",
  };
}

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Image Analysis with Gemini 3.1 Pro Preview (with fallback to 3.8-flash and flash-latest)
app.post("/api/analyze-image", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/jpeg", userContext } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "Missing imageBase64 data" });
    }

    const ai = getGeminiClient();
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is missing. Please set it in Settings > Secrets.",
      });
    }

    // Clean base64 string
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const promptText = `
आप भारत के प्रमुख डिजिटल न्यूज़ चैनल "ब्रेकिंग न्यूज़ वाला" के वरिष्ठ मुख्य संपादक हैं।
यूज़र ने यह फोटो अपलोड की है और न्यूज़ कार्ड (सोशल मीडिया ग्राफिक कार्ड) बनाना चाहता है।

यूज़र का अतिरिक्त निर्देश / संदर्भ: ${userContext || "फोटो को समझकर धमाकेदार ब्रेकिंग न्यूज़ हेडलाइन और डिटेल्स तैयार करें"}

फोटो का बारीकी से विश्लेषण करें और निम्नलिखित JSON फॉर्मेट में रिप्लाई दें:
1. "headline": एक बहुत ही आकर्षक, गंभीर, और धमाकेदार हिंदी ब्रेकिंग न्यूज़ हेडलाइन (लगभग 12-25 शब्द, जैसे "रीवा-सीधी हाईवे पर दर्दनाक सड़क हादसा: बस और बल्कर भिड़े; CM मोहन यादव ने जताया दुख, मुआवजे का ऐलान")।
2. "highlightWords": हेडलाइन के वे सबसे मुख्य 2 से 4 शब्द या वाक्यांश जिन्हें पीले (Yellow) रंग में हाइलाइट किया जाना चाहिए (जैसे बड़े नाम, जगह, संख्या, मुख्य घटना: "रीवा-सीधी हाईवे", "CM मोहन यादव", "मुआवजे")।
3. "formattedHeadline": हेडलाइन जिसमें हाइलाइट होने वाले शब्दों के आगे-पीछे [yellow] और [/yellow] टैग लगे हों।
4. "location": घटना से संबंधित जिला या राज्य का संक्षिप्त नाम (जैसे "मध्य प्रदेश", "रीवा, मप्र", "शहडोल", "भोपाल", "नई दिल्ली")।
5. "summary": सोशल मीडिया (Instagram व Facebook पोस्ट) के लिए कम से कम 2 और खबर में विवरण अधिक होने पर 3 विस्तृत पैराग्राफ में पूरी खबर विस्तार से लिखें ताकि पाठक को लगे कि "पूरी खबर डिस्क्रिप्शन में" मिल गई है। उसके ठीक बाद एक खाली लाइन छोड़कर अंत में हैशटैग लगाएं, जिसमें सबसे पहला हैशटैग अनिवार्य रूप से #breakingnewswala होगा, बीच में 4-6 प्रासंगिक हैशटैग (जैसे #BreakingNews #HindiNews आदि), और सबसे अंतिम हैशटैग अनिवार्य रूप से #BNWTV होगा। इसके अलावा कोई अन्य हेडिंग, फोन नंबर या सोशल लिंक नहीं होना चाहिए।
6. "category": एक शब्द की श्रेणी (जैसे "हादसा", "सरकार", "आंदोलन", "राजनीति", "अपराध", "प्रशासन")।
7. "hasPerson": क्या फोटो में कोई मुख्य नेता, अधिकारी या व्यक्ति का क्लोज़अप/पोर्ट्रेट है जिसे गोल कटआउट (Inset Circle) में दिखाया जा सकता है? (true या false).
8. "description": फोटो में क्या-क्या दिखाई दे रहा है इसका संक्षिप्त विश्लेषण।
9. "isAiGeneratedPhoto": क्या यह फोटो AI जनरेटेड या डिजिटल इलस्ट्रेशन/काल्पनिक प्रतीत होती है? (true या false).
10. "speakerName": यदि यह किसी नेता, मंत्री या व्यक्ति का बयान/कोटेशन है तो उनका नाम (उदा. "दिग्विजय सिंह", "डॉ. मोहन यादव"), अन्यथा खाली स्ट्रिंग ("")।
11. "speakerTitle": उनका पद या पदवी (उदा. "पूर्व मुख्यमंत्री", "मुख्यमंत्री, मप्र"), अन्यथा खाली स्ट्रिंग ("")।
`;

    const contents = {
      parts: [
        {
          inlineData: {
            mimeType: mimeType,
            data: cleanBase64,
          },
        },
        {
          text: promptText,
        },
      ],
    };

    const response = await generateWithFallbackAndRetry(
      ai,
      DEFAULT_FALLBACK_MODELS,
      {
        contents,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              headline: { type: Type.STRING },
              highlightWords: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              formattedHeadline: { type: Type.STRING },
              location: { type: Type.STRING },
              summary: { type: Type.STRING },
              category: { type: Type.STRING },
              hasPerson: { type: Type.BOOLEAN },
              description: { type: Type.STRING },
              isAiGeneratedPhoto: { type: Type.BOOLEAN },
              speakerName: { type: Type.STRING },
              speakerTitle: { type: Type.STRING },
            },
            required: [
              "headline",
              "highlightWords",
              "formattedHeadline",
              "location",
              "summary",
            ],
          },
        },
      }
    );

    const textOutput = response.text || "{}";
    const parsedData = JSON.parse(textOutput);
    return res.json({ success: true, data: parsedData });
  } catch (err: any) {
    console.error("Error in /api/analyze-image:", err);
    return res.status(500).json({
      error: cleanErrorMessage(err),
    });
  }
});

// Process News Link or Natural Language Command / Text into News Graphic structure
app.post("/api/process-news-command", async (req, res) => {
  const { input, linkUrl, customPrompt } = req.body;
  try {
    if (!input && !linkUrl && !customPrompt) {
      return res.status(400).json({ error: "Please provide a command, text, link or prompt" });
    }

    const ai = getGeminiClient();
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is missing. Please set it in Settings > Secrets.",
      });
    }

    let fetchedArticleSnippet = "";
    const pickedImages: { main?: string; second?: string } = {};

    let effectiveInput = (input || "").trim();
    const rawLink = (linkUrl || "").trim();

    if (rawLink) {
      if (rawLink.startsWith("http://") || rawLink.startsWith("https://")) {
        try {
          const fetchRes = await fetch(rawLink, {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            },
          });
          if (fetchRes.ok) {
            const html = await fetchRes.text();
            // Extract title and text snippets
            const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
            const metaDescMatch = html.match(
              /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i
            );
            fetchedArticleSnippet = `
URL: ${rawLink}
Title: ${titleMatch ? titleMatch[1] : ""}
Description: ${metaDescMatch ? metaDescMatch[1] : ""}
`;
            // Extract images from news website: og:image, twitter:image, article img
            const ogImageMatch =
              html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
              html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
            const twitterImageMatch =
              html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i) ||
              html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i);

            const foundImages: string[] = [];
            if (ogImageMatch && ogImageMatch[1]) {
              foundImages.push(ogImageMatch[1].trim());
            }
            if (
              twitterImageMatch &&
              twitterImageMatch[1] &&
              !foundImages.includes(twitterImageMatch[1].trim())
            ) {
              foundImages.push(twitterImageMatch[1].trim());
            }

            // Also look for prominent <img> in article body
            const imgMatches = html.matchAll(
              /<img[^>]+src=["'](https?:\/\/[^"'\s]+\.(?:jpg|jpeg|png|webp)[^"']*)["']/gi
            );
            for (const match of imgMatches) {
              const src = match[1];
              if (
                src &&
                !src.includes("logo") &&
                !src.includes("icon") &&
                !src.includes("avatar") &&
                !foundImages.includes(src)
              ) {
                foundImages.push(src);
                if (foundImages.length >= 4) break;
              }
            }

            if (foundImages.length > 0) {
              pickedImages.main = `/api/proxy-image?url=${encodeURIComponent(foundImages[0])}`;
            }
          }
        } catch (fetchErr) {
          console.warn("Could not fetch URL directly, will use URL string in prompt:", fetchErr);
          fetchedArticleSnippet = `URL to reference: ${rawLink}`;
        }
      } else {
        // Not a URL: treat as raw news text / script!
        effectiveInput = effectiveInput ? `${effectiveInput}\n\n${rawLink}` : rawLink;
      }
    }

    const prompt = `
आप भारत के न्यूज़ चैनल "ब्रेकिंग न्यूज़ वाला" के चीफ एडिटर हैं।
यूज़र ने यह कमांड / कच्ची स्क्रिप्ट / समाचार विवरण या प्रेस नोट दिया है:
${effectiveInput || ""}
${fetchedArticleSnippet ? `वेबसाइट सामग्री: ${fetchedArticleSnippet}` : ""}
${customPrompt ? `यूज़र का विशेष निर्देश / प्रॉम्प्ट या कच्ची स्क्रिप्ट (Prompt / Raw Script / Press Note): ${customPrompt}` : ""}

विशेष संपादकीय नियम (प्रेस नोट / स्क्रिप्ट रूपांतरण):
- यदि यूज़र ने बिना किसी लिंक के सीधे प्रॉम्प्ट बॉक्स या इनपुट बॉक्स में कोई कच्ची स्क्रिप्ट, प्रेस नोट, सरकारी विज्ञप्ति या नेताओं का बयान दिया है, तो उस पूरी सामग्री को निष्पक्ष, प्रामाणिक और प्रभावशाली न्यूज़ ग्राफिक में बदलें।
- आदरसूचक व चाटुकारिता शब्दों का पूर्ण निष्कासन (MANDATORY): हेडलाइन, हेडलाइन विकल्पों और पूरी स्क्रिप्ट (summary) में से 'श्री', 'श्रीमान', 'श्रीमती', 'सुश्री', 'माननीय', 'सम्माननीय', 'सम्मानीय', 'आदरणीय', 'महोदय', 'जी' जैसे सभी औपचारिक व सरकारी/पीआर शब्दों को पूरी तरह हटा दें। सीधे नेता या अधिकारी का पद और नाम लिखें (जैसे: 'माननीय मुख्यमंत्री श्री ... जी' के स्थान पर 'मुख्यमंत्री ...', 'श्रीमान कलेक्टर महोदय' के स्थान पर 'कलेक्टर')।

कृपया इस जानकारी और निर्देश से एक शक्तिशाली, वायरल और ऑथेंटिक हिंदी इमेज न्यूज़ (न्यूज़ ग्राफिक कार्ड) तैयार करें:
1. "headline": मुख्य, स्पष्ट और प्रभावकारी हिंदी हेडलाइन (लगभग 12-22 शब्द, देवनागरी लिपि में, बिना किसी आदरसूचक शब्द के)।
2. "headlineOptions": 3 अलग-अलग, शक्तिशाली हिंदी हेडलाइन विकल्प ताकि एडिटर सबसे सटीक हेडलाइन चुन सकें:
   - विकल्प 1: हाई-इम्पैक्ट / ब्रेकिंग न्यूज़ स्टाइल
   - विकल्प 2: तथ्यात्मक व विस्तृत जानकारी स्टाइल
   - विकल्प 3: आकर्षक व तात्कालिक एक्शन/सवाल स्टाइल
3. "highlightWords": हेडलाइन में से 2-4 मुख्य शब्द जिन्हें पीले रंग (Yellow) में हाइलाइट करना है।
4. "formattedHeadline": हेडलाइन में हाइलाइट होने वाले शब्दों के चारों ओर [yellow]शब्द[/yellow] लगाएं।
5. "location": संबंधित शहर, जिला या राज्य (जैसे "मध्य प्रदेश", "शहडोल, मप्र", "रीवा", "भोपाल", आदि)।
6. "summary": सोशल मीडिया (Instagram व Facebook पोस्ट) तथा अपलोडिंग हेतु कम से कम 2 और विवरण अधिक होने पर 3 विस्तृत पैराग्राफ में पूरी निष्पक्ष खबर विस्तार से लिखें (प्रेस नोट की चाटुकारिता व आदरसूचक शब्द हटाकर) ताकि पाठक को लगे कि "पूरी खबर डिस्क्रिप्शन में" मिल गई है। उसके ठीक बाद एक खाली लाइन छोड़कर अंत में हैशटैग लगाएं, जिसमें सबसे पहला हैशटैग अनिवार्य रूप से #breakingnewswala होगा, बीच में 4-6 प्रासंगिक हैशटैग (जैसे #BreakingNews #HindiNews आदि), और सबसे अंतिम हैशटैग अनिवार्य रूप से #BNWTV होगा। इसके अलावा कोई अन्य हेडिंग, फोन नंबर या सोशल लिंक नहीं होना चाहिए।
7. "category": न्यूज़ श्रेणी (हादसा / प्रशासन / राजनीति / विकास / अपराध / जनआंदोलन)।
8. "suggestedImagePrompt": यदि यूज़र के पास फोटो नहीं है तो AI इमेज जनरेट करने के लिए एक सटीक अंग्रेजी प्रॉम्प्ट।
9. "isAiGeneratedPhoto": क्या यूज़र के कमांड, टेक्स्ट या लिंक में यह लिखा है या संकेत है कि फोटो AI जनरेटेड है / काल्पनिक है / इलस्ट्रेशन है (जैसे 'AI generated', 'एआई फोटो', 'AI image', 'काल्पनिक चित्र', 'सिंथेटिक')? (true या false).
10. "speakerName": यदि यह किसी नेता, मंत्री या व्यक्ति का बयान/कोटेशन है तो उनका नाम (उदा. "दिग्विजय सिंह", "मोहन यादव"), अन्यथा खाली स्ट्रिंग ("")।
11. "speakerTitle": उनका पद या पदवी (उदा. "पूर्व मुख्यमंत्री", "मुख्यमंत्री, मप्र"), अन्यथा खाली स्ट्रिंग ("")।
`;

    let parsedData: any = null;
    const aiProvider = (req.body.aiProvider || "gemini").toLowerCase();

    if (aiProvider === "openai") {
      try {
        const openai = getOpenAIClient();
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: `You are the chief editor of "ब्रेकिंग न्यूज़ वाला" (Breaking News Wala), a premier Indian digital news channel. Always respond in strictly valid JSON format with keys: headline, headlineOptions (array of 3 strings), highlightWords (array of strings), formattedHeadline, location, summary, category, suggestedImagePrompt, isAiGeneratedPhoto (boolean), speakerName, speakerTitle. Stripping all honorifics ('श्री', 'श्रीमान', 'श्रीमती', 'माननीय', 'सम्मानीय', 'आदरणीय', 'महोदय', 'जी') is strictly mandatory.`,
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.6,
        });

        const raw = completion.choices[0]?.message?.content || "{}";
        parsedData = JSON.parse(raw);
        if (!parsedData.headlineOptions || !Array.isArray(parsedData.headlineOptions) || parsedData.headlineOptions.length === 0) {
          parsedData.headlineOptions = [parsedData.headline || "ताज़ा समाचार"];
        }
      } catch (openAiErr: any) {
        console.error("OpenAI news command error:", openAiErr);
        if (openAiErr?.message && openAiErr.message.includes("OPENAI_API_KEY सेट नहीं है")) {
          return res.status(400).json({ error: openAiErr.message });
        }
        console.log("OpenAI failed, falling back to local news draft:", openAiErr?.message?.slice(0, 80));
        const fallbackSource = input || fetchedArticleSnippet || "ताज़ा समाचार अपडेट";
        parsedData = createLocalNewsFallback(fallbackSource, linkUrl);
      }
    } else {
      try {
        const response = await generateWithFallbackAndRetry(
          ai,
          DEFAULT_FALLBACK_MODELS,
          {
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  headline: { type: Type.STRING },
                  headlineOptions: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  highlightWords: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  formattedHeadline: { type: Type.STRING },
                  location: { type: Type.STRING },
                  summary: { type: Type.STRING },
                  category: { type: Type.STRING },
                  suggestedImagePrompt: { type: Type.STRING },
                  isAiGeneratedPhoto: { type: Type.BOOLEAN },
                  speakerName: { type: Type.STRING },
                  speakerTitle: { type: Type.STRING },
                },
                required: [
                  "headline",
                  "highlightWords",
                  "formattedHeadline",
                  "location",
                  "summary",
                ],
              },
            },
          }
        );

        parsedData = JSON.parse(response.text || "{}");
      } catch (geminiError: any) {
        console.log("All Gemini models busy in process-news-command, generating instant fallback:", geminiError?.message?.slice(0, 80));

        // Always generate clean draft fallback so user work is NEVER blocked
        const fallbackSource = input || fetchedArticleSnippet || "ताज़ा समाचार अपडेट";
        parsedData = createLocalNewsFallback(fallbackSource, linkUrl);
      }
    }

    // Sanitize any honorifics or press note flattery from generated fields
    if (parsedData) {
      if (parsedData.headline) parsedData.headline = sanitizePressNoteFlattery(parsedData.headline);
      if (Array.isArray(parsedData.headlineOptions)) {
        parsedData.headlineOptions = parsedData.headlineOptions.map(sanitizePressNoteFlattery);
      }
      if (parsedData.formattedHeadline) {
        parsedData.formattedHeadline = sanitizePressNoteFlattery(parsedData.formattedHeadline);
      }
      if (parsedData.summary) parsedData.summary = sanitizePressNoteFlattery(parsedData.summary);
      if (parsedData.speakerName) parsedData.speakerName = sanitizePressNoteFlattery(parsedData.speakerName);
      if (parsedData.speakerTitle) parsedData.speakerTitle = sanitizePressNoteFlattery(parsedData.speakerTitle);
    }

    // Attach picked images from the URL if any
    parsedData.pickedImages = pickedImages;
    return res.json({ success: true, data: parsedData });
  } catch (err: any) {
    console.error("Error in /api/process-news-command:", err);
    return res.status(500).json({
      error: cleanErrorMessage(err),
    });
  }
});

// Helper: Clean flattering / formal prefixes from news text (Devanagari Unicode Safe)
function sanitizePressNoteFlattery(text: string): string {
  if (!text || typeof text !== "string") return text || "";
  let cleaned = text;
  // 1. Remove prefixes like 'माननीय', 'सम्माननीय', 'सम्मानीय', 'आदरणीय', 'श्रीमान', 'श्रीमती', 'सुश्री', 'पूज्य', 'परम पूज्य'
  cleaned = cleaned.replace(
    /(?:^|[^\p{L}\p{M}])(माननीय|सम्माननीय|सम्मानीय|आदरणीय|श्रीमान|श्रीमती|सुश्री|परम पूज्य|पूज्य)\s+/gu,
    " "
  );
  // 2. Remove standalone 'श्री' followed by word (avoid matching inside names like 'श्रीनगर' or 'श्रीवास्तव')
  cleaned = cleaned.replace(
    /(?:^|[^\p{L}\p{M}])श्री\s+(?=[\p{L}])/gu,
    " "
  );
  // 3. Remove postfix 'महोदय' and 'जी'
  cleaned = cleaned.replace(/\s+महोदय(?=[,\s.!?।\n]|$)/gu, "");
  cleaned = cleaned.replace(/\s+जी(?=[,\s.!?।\n]|$)/gu, "");

  return cleaned.replace(/[ \t]{2,}/g, " ").trim();
}

// Fallback generator for E-Paper Press Note
function createEpaperLocalFallback(rawInput: string, city: string = "", reporterName: string = ""): any {
  const sanitized = sanitizePressNoteFlattery(rawInput);
  const detectedCity = city.trim() || (rawInput.match(/(निवाड़ी|इंदौर|भोपाल|ग्वालियर|जबलपुर|उज्जैन|रीवा|सतना|सागर|टीकमगढ़|दमोह|छतरपुर)/i)?.[1] || "निवाड़ी");
  const firstSentence = sanitized.split(/[।\.\n]/)[0]?.trim() || "प्रशासनिक कार्रवाई से क्षेत्र में मचा हड़कंप";
  const headline = firstSentence.length > 15 && firstSentence.length < 90
    ? firstSentence
    : `${detectedCity}: मामले में प्रशासन का बड़ा एक्शन, जांच के आदेश`;

  return {
    epaperCity: detectedCity,
    epaperKicker: "विशेष रिपोर्ट / ग्राउंड ज़ीरो",
    epaperHeadline: headline,
    epaperSubHeadline: "अधिकारियों ने मौके पर पहुंचकर लिया जायजा, दोषियों पर कड़ी कार्रवाई की चेतावनी",
    epaperByline: reporterName ? `${reporterName} / विशेष संवाददाता, ${detectedCity}` : `ब्यूरो रिपोर्ट / ${detectedCity}`,
    epaperPromoTagline: "📢 अब आप भी भेजें अपनी खबर हम तक: 96698-02408",
    epaperArticleBody: `${sanitized.slice(0, 500) || "जिले में प्रशासन ने बड़ी कार्रवाई करते हुए स्थिति को नियंत्रित किया। ग्रामीणों की शिकायतों के आधार पर वरिष्ठ अधिकारियों ने संयुक्त दल गठित कर मौके पर पहुंचकर जांच की।"}\n\nमामले में संलिप्त पाए गए लोगों के विरुद्ध वैधानिक धाराओं में प्रकरण दर्ज कर अग्रिम कार्रवाई प्रारंभ कर दी गई है।`,
    epaperHighlightsTitle: "कार्रवाई के मुख्य बिंदु",
    epaperHighlights: [
      "प्रशासनिक दल ने मौके पर पहुंचकर की त्वरित कार्रवाई",
      "शिकायतों के आधार पर जांच दल गठित कर पंचनामा तैयार",
      "दोषियों के खिलाफ सख्त वैधानिक धाराओं में प्रकरण दर्ज",
    ],
    epaperQuoteText: "जनहित और निष्पक्ष कार्रवाई के लिए प्रशासन पूरी तरह मुस्तैद है। किसी भी स्तर पर लापरवाही बर्दाश्त नहीं होगी।",
    epaperQuoteSpeaker: `${detectedCity} प्रशासनिक अधिकारी`,
    epaperPhotoCaption: "घटनास्थल पर पहुंचकर जांच पड़ताल करती प्रशासनिक टीम।",
    epaperPhotoCaption2: "दस्तावेजों की जांच करते अधिकारी।",
    epaperPhotoCaption3: "मौके पर उपस्थित ग्रामीण व प्रत्यक्षदर्शी।",
    summary: `${detectedCity} में बड़ी कार्रवाई की खबर। पूरी रिपोर्ट ई-पेपर एडिशन में पढ़ें।\n\n#breakingnewswala #Epaper #${detectedCity}News #HindiNews #BNWTV`,
    category: "प्रशासन",
  };
}

// ==========================================
// E-PAPER JACKET: PRESS NOTE AI PROCESSOR
// ==========================================
app.post("/api/process-epaper-pressnote", async (req, res) => {
  try {
    const {
      pressNoteText = "",
      linkUrl = "",
      city = "",
      reporterName = "",
      aiProvider = "gemini",
    } = req.body;

    if (!pressNoteText && !linkUrl) {
      return res.status(400).json({ error: "कृपया प्रेस नोट का विवरण या लिंक प्रदान करें।" });
    }

    let fetchedSnippet = "";
    let pickedImages: { main?: string; second?: string; third?: string } = {};

    if (linkUrl) {
      try {
        const fetchRes = await fetch(linkUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
        });
        if (fetchRes.ok) {
          const html = await fetchRes.text();
          const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
          const metaDescMatch = html.match(
            /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i
          );
          let bodySnippet = "";
          const paragraphs = html.match(/<p[^>]*>([\s\S]*?)<\/p>/gi);
          if (paragraphs) {
            bodySnippet = paragraphs
              .slice(0, 10)
              .map((p) => p.replace(/<[^>]+>/g, "").trim())
              .filter((t) => t.length > 25)
              .join("\n\n");
          }
          fetchedSnippet = `
URL: ${linkUrl}
Title: ${titleMatch ? titleMatch[1] : ""}
Meta: ${metaDescMatch ? metaDescMatch[1] : ""}
Text: ${bodySnippet.slice(0, 3500)}
`;
          const ogImageMatch =
            html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
            html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
          if (ogImageMatch && ogImageMatch[1]) {
            pickedImages.main = ogImageMatch[1].trim();
          }
        }
      } catch (err: any) {
        console.warn("Failed fetching linkUrl for epaper:", err?.message);
      }
    }

    const rawInput = (pressNoteText + "\n\n" + fetchedSnippet).trim();

    const systemPrompt = `आप "ब्रेकिंग न्यूज़ वाला" (Breaking News Wala) के मुख्य संपादक और ई-पेपर डिज़ाइन हेड हैं।
आपको नीचे एक कच्चा पुलिस/प्रशासनिक प्रेस नोट अथवा समाचार रिपोर्ट दी जा रही है।
आपको इसे एक प्रतिष्ठित दैनिक समाचार पत्र (जैसे दैनिक भास्कर, पत्रिका) के ई-पेपर (E-Paper) एडिशन की प्रमुख खबर के रूप में ढालना है।

यूज़र का कच्चा इनपुट (प्रेस नोट / रिपोर्ट):
"${rawInput}"

${city ? `यूज़र द्वारा निर्दिष्ट शहर/जिला: "${city}"` : ""}
${reporterName ? `यूज़र द्वारा निर्दिष्ट रिपोर्टर का नाम: "${reporterName}"` : ""}

★ अति-महत्वपूर्ण संपादकीय नियम (STRICT EDITORIAL RULES):
1. **चाटुकारिता व औपचारिक शब्द हटाना (अनिवार्य नियम)**: प्रेस नोट में अधिकारियों या व्यक्तियों के नाम के आगे 'श्री', 'श्रीमान', 'श्रीमती', 'माननीय', 'सम्मानीय', 'आदरणीय', 'महोदय', 'जी' जैसे औपचारिक या चाटुकारिता वाले शब्द होते हैं। इन सभी को हटाकर खबर को शुद्ध निष्पक्ष, तथ्यपरक और उच्च स्तरीय खोजी पत्रकारिता की भाषा में बनाएं। (जैसे: "श्रीमान पुलिस अधीक्षक महोदय के कुशल निर्देशन में..." के स्थान पर "पुलिस अधीक्षक के निर्देश पर...")
2. **शहर/जिला (epaperCity)**: खबर जिस शहर/जिले की है (जैसे: निवाड़ी, इंदौर, भोपाल, टीकमगढ़) उसका नाम। यदि यूज़र ने निर्दिष्ट किया है तो वही रखें, अन्यथा प्रेस नोट से पहचानें।
3. **किकर (epaperKicker)**: 3 से 6 शब्दों का आकर्षक संदर्भ टैग (उदा: "बड़ी कार्रवाई / खनिज माफिया पर शिकंजा", "सड़क हादसा", "कलेक्टर का कड़ा रुख", "विशेष पड़ताल")।
4. **मुख्य हेडलाइन (epaperHeadline)**: 8 से 14 शब्दों की सारगर्भित, सटीक व प्रभावशाली अखबार हेडलाइन (अधिक लंबी न हो, 1-2 लाइनों में आ जाए ताकि पूरी खबर के लिए पर्याप्त जगह मिले और कोई शब्द न कटे)।
5. **उप-शीर्षक (epaperSubHeadline)**: 6 से 12 शब्दों का संक्षिप्त उप-शीर्षक या मुख्य परिणाम सार।
6. **बायलाइन (epaperByline)**: यदि रिपोर्टर का नाम है तो "${reporterName || 'विशेष संवाददाता'}", अन्यथा "विशेष संवाददाता / ब्यूरो रिपोर्ट"।
7. **अखबार की स्टोरी बॉडी (epaperArticleBody)**: संक्षिप्त, सटीक और पूर्ण (90 से 130 शब्द)। कोई भी वाक्य अधूरा न छूटे। पूरी बात 2 संतुलित पैराग्राफ में समाप्त हो जाए ताकि अखबार के कॉलम में पूरी तरह फिट बैठ सके और कोई विवरण कटे नहीं। खबर की शुरुआत में अखबार शैली की डेटलाइन जैसे "${city ? city : 'निवाड़ी'} (विशेष संवाददाता): " से शुरू करें। प्रेस नोट के सभी अहम तथ्य (आरोप, कार्रवाई, बरामदगी) आ जाएं लेकिन गैर-जरूरी विस्तार न हो।
8. **हाइलाइट्स / इनसेट बॉक्स (epaperHighlightsTitle व epaperHighlights)**:
   - epaperHighlightsTitle: जैसे "कार्रवाई के 3 मुख्य बिंदु", "यह है पूरा मामला", "इन धाराओं में केस दर्ज" आदि।
   - epaperHighlights: 2 से 3 ठोस, सीधे और महत्वपूर्ण बुलेट पॉइंट्स (प्रत्येक बिंदु 8-14 शब्द)।
9. **फोटो कैप्शन्स**:
   - epaperPhotoCaption: पहली मुख्य फोटो का 1 लाइन संक्षिप्त विवरण।
   - epaperPhotoCaption2: दूसरी फोटो का 1 लाइन संक्षिप्त विवरण।
   - epaperPhotoCaption3: तीसरी फोटो का 1 लाइन संक्षिप्त विवरण।
10. **प्रोमोशनल संदेश (epaperPromoTagline)**: बायलाइन में दाईं ओर दिखने वाली पंक्ति (उदा: "📢 अब आप भी भेजें अपनी खबर हम तक: 96698-02408")।
11. **नेता / अधिकारी का बयान कॉल-आउट (epaperQuoteText व epaperQuoteSpeaker)**: यदि प्रेस नोट में किसी मंत्री, विधायक, कलेक्टर, एसपी, अधिकारी या नेता का कोई बयान, चेतावनी या प्रतिक्रिया हो, तो उसे यहाँ 1-2 वाक्यों में निकालें (उदा: "दोषियों को बख्शा नहीं जाएगा, हर बिंदु पर सख्त कार्रवाई होगी")। epaperQuoteSpeaker में उनका नाम व पद (उदा: "डॉ. महेंद्र सिंह, प्रभारी") लिखें।
12. **सोशल मीडिया समरी (summary)**: Instagram और Facebook के लिए 2 पैराग्राफ का विस्तृत विवरण, अंत में अनिवार्य हैशटैग्स: #breakingnewswala #Epaper #HindiNews #{city}News #BNWTV आदि।
13. **श्रेणी (category)**: (अपराध / प्रशासन / हादसा / राजनीति / विकास / जनसमस्या / शिक्षा)।

Strictly return a valid JSON object matching these exact keys:
epaperCity, epaperKicker, epaperHeadline, epaperSubHeadline, epaperByline, epaperPromoTagline, epaperArticleBody, epaperHighlightsTitle, epaperHighlights, epaperQuoteText, epaperQuoteSpeaker, epaperPhotoCaption, epaperPhotoCaption2, epaperPhotoCaption3, summary, category`;

    let parsedData: any = null;
    const provider = (aiProvider || "gemini").toLowerCase();

    if (provider === "openai") {
      try {
        const openai = getOpenAIClient();
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: "You are the chief editorial director for Breaking News Wala E-Paper graphics. Always respond in strictly valid JSON format.",
            },
            { role: "user", content: systemPrompt },
          ],
          temperature: 0.5,
        });
        const raw = completion.choices[0]?.message?.content || "{}";
        parsedData = JSON.parse(raw);
      } catch (openAiErr: any) {
        console.warn("OpenAI epaper parsing error, falling back to Gemini:", openAiErr?.message);
      }
    }

    if (!parsedData && process.env.GEMINI_API_KEY) {
      try {
        const ai = getGeminiClient();
        const response = await generateWithFallbackAndRetry(
          ai,
          DEFAULT_FALLBACK_MODELS,
          {
            contents: systemPrompt,
            config: {
              responseMimeType: "application/json",
              temperature: 0.5,
            },
          }
        );
        parsedData = JSON.parse(response.text || "{}");
      } catch (geminiError: any) {
        console.warn("Gemini epaper parsing error:", geminiError?.message?.slice(0, 100));
      }
    }

    // High quality fallback if AI APIs fail
    if (!parsedData || !parsedData.epaperHeadline) {
      parsedData = createEpaperLocalFallback(rawInput, city, reporterName);
    }

    if (pickedImages.main) {
      parsedData.pickedImages = pickedImages;
    }

    return res.json({ success: true, data: parsedData });
  } catch (err: any) {
    console.error("Error in /api/process-epaper-pressnote:", err);
    return res.status(500).json({ error: cleanErrorMessage(err) });
  }
});

// Curated high-resolution press & editorial news photography catalog for authentic journalism fallbacks
const CURATED_NEWS_PRESS_PHOTOS = {
  protest: [
    "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1577896851231-70ef18881754?w=1200&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1588681664899-f142ff2dc9b1?w=1200&auto=format&fit=crop&q=85",
  ],
  accident: [
    "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=1200&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1587560699334-cc4ff634909a?w=1200&auto=format&fit=crop&q=85",
  ],
  politics: [
    "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1200&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1575320181282-9afab399332c?w=1200&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=1200&auto=format&fit=crop&q=85",
  ],
  police_crime: [
    "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1200&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=1200&auto=format&fit=crop&q=85",
  ],
  hospital: [
    "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=1200&auto=format&fit=crop&q=85",
  ],
  weather: [
    "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=1200&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1547683905-f686c993aae5?w=1200&auto=format&fit=crop&q=85",
  ],
  students: [
    "https://images.unsplash.com/photo-1577896851231-70ef18881754?w=1200&auto=format&fit=crop&q=85",
  ],
  business: [
    "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1610375461246-83df859d849d?w=1200&auto=format&fit=crop&q=85",
  ],
  general: [
    "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200&auto=format&fit=crop&q=85",
  ],
};

function pickCuratedNewsPressPhoto(text: string, variation: number = 0): string {
  const lower = (text || "").toLowerCase();

  const pickFrom = (arr: string[]) => arr[Math.abs(variation) % arr.length];

  // Protest / Dharna / Teachers / Recruitment / Strike / Rally
  if (
    lower.includes("धरना") ||
    lower.includes("प्रदर्शन") ||
    lower.includes("आंदोलन") ||
    lower.includes("अभ्यर्थी") ||
    lower.includes("शिक्षक") ||
    lower.includes("भर्ती") ||
    lower.includes("मांग") ||
    lower.includes("हड़ताल") ||
    lower.includes("घेराव") ||
    lower.includes("ज्ञापन") ||
    lower.includes("protest") ||
    lower.includes("rally") ||
    lower.includes("strike") ||
    lower.includes("candidate")
  ) {
    return pickFrom(CURATED_NEWS_PRESS_PHOTOS.protest);
  }

  // Accident / Crash / Road / Highway
  if (
    lower.includes("हादसा") ||
    lower.includes("दुर्घटना") ||
    lower.includes("टक्कर") ||
    lower.includes("पलटी") ||
    lower.includes("बस") ||
    lower.includes("ट्रक") ||
    lower.includes("कार") ||
    lower.includes("हाईवे") ||
    lower.includes("सड़क") ||
    lower.includes("घायल") ||
    lower.includes("मौत") ||
    lower.includes("accident") ||
    lower.includes("crash") ||
    lower.includes("highway")
  ) {
    return pickFrom(CURATED_NEWS_PRESS_PHOTOS.accident);
  }

  // Politics / Leader / Government / Assembly / CM / Cabinet
  if (
    lower.includes("मुख्यमंत्री") ||
    lower.includes("शिवराज") ||
    lower.includes("दिग्विजय") ||
    lower.includes("मोहन यादव") ||
    lower.includes("कमलनाथ") ||
    lower.includes("मंत्री") ||
    lower.includes("नेता") ||
    lower.includes("विधानसभा") ||
    lower.includes("प्रेस") ||
    lower.includes("कांग्रेस") ||
    lower.includes("भाजपा") ||
    lower.includes("सरकार") ||
    lower.includes("संसद") ||
    lower.includes("minister") ||
    lower.includes("assembly") ||
    lower.includes("politics")
  ) {
    return pickFrom(CURATED_NEWS_PRESS_PHOTOS.politics);
  }

  // Police / Court / Crime / Arrest
  if (
    lower.includes("पुलिस") ||
    lower.includes("कोर्ट") ||
    lower.includes("अदालत") ||
    lower.includes("गिरफ्तार") ||
    lower.includes("क्राइम") ||
    lower.includes("अपराध") ||
    lower.includes("हत्या") ||
    lower.includes("चोरी") ||
    lower.includes("police") ||
    lower.includes("court") ||
    lower.includes("crime")
  ) {
    return pickFrom(CURATED_NEWS_PRESS_PHOTOS.police_crime);
  }

  // Hospital / Medical
  if (
    lower.includes("अस्पताल") ||
    lower.includes("डॉक्टर") ||
    lower.includes("मरीज") ||
    lower.includes("स्वास्थ्य") ||
    lower.includes("एम्बुलेंस") ||
    lower.includes("hospital") ||
    lower.includes("doctor")
  ) {
    return pickFrom(CURATED_NEWS_PRESS_PHOTOS.hospital);
  }

  // Weather / Monsoon / Rain
  if (
    lower.includes("मौसम") ||
    lower.includes("बारिश") ||
    lower.includes("बाढ़") ||
    lower.includes("तूफान") ||
    lower.includes("आंधी") ||
    lower.includes("rain") ||
    lower.includes("weather")
  ) {
    return pickFrom(CURATED_NEWS_PRESS_PHOTOS.weather);
  }

  // Students / Exam / Education
  if (
    lower.includes("छात्र") ||
    lower.includes("परीक्षा") ||
    lower.includes("स्कूल") ||
    lower.includes("कॉलेज") ||
    lower.includes("विद्यार्थी") ||
    lower.includes("student") ||
    lower.includes("exam")
  ) {
    return pickFrom(CURATED_NEWS_PRESS_PHOTOS.students);
  }

  // Business / Economy / Gold
  if (
    lower.includes("व्यापार") ||
    lower.includes("सोना") ||
    lower.includes("चांदी") ||
    lower.includes("शेयर") ||
    lower.includes("बाजार") ||
    lower.includes("gold") ||
    lower.includes("market")
  ) {
    return pickFrom(CURATED_NEWS_PRESS_PHOTOS.business);
  }

  return pickFrom(CURATED_NEWS_PRESS_PHOTOS.general);
}

// Generate AI News Photo from Headline
app.post("/api/generate-ai-image", async (req, res) => {
  try {
    const { headline, customPrompt, aspectRatio = "4:5", variation = 0, aiProvider = "gemini" } = req.body;

    if (!headline && !customPrompt) {
      return res.status(400).json({ error: "Headline or prompt is required" });
    }

    const ai = getGeminiClient();

    const perspectiveAngles = [
      "authentic journalistic press photography, standard documentary eye-level angle, realistic Indian press coverage, natural daylight",
      "wide-angle documentary press shot, complete environmental context, authentic news reportage, sharp journalistic realism",
      "candid press photo, alternative documentary perspective, on-the-scene realism, sharp news photography",
      "detailed investigative press photo, different camera angle, authentic atmosphere, high detail",
    ];
    const variationAngle = perspectiveAngles[Math.abs(Number(variation) || 0) % perspectiveAngles.length];

    // Step 1: Create an editorial, journalistic photography prompt in English
    let imagePrompt = customPrompt;
    if (!imagePrompt || imagePrompt.trim().length === 0) {
      if (process.env.GEMINI_API_KEY) {
        try {
          const promptGenResponse = await generateWithFallbackAndRetry(
            ai,
            DEFAULT_FALLBACK_MODELS,
            {
              contents: `You are an art director for a top Indian digital news channel.
Given this Hindi news headline: "${headline}",
write a descriptive, photorealistic, journalistic photography prompt in English for generating a background news photo.
Requirements:
- Style: ${variationAngle}.
- Realistic press photo style, natural ambient daylight, 35mm lens authentic documentary feel.
- High detail, realistic environment in India.
- Absolutely NO text, NO typography, NO watermark, NO logo, NO borders.
Return ONLY the English prompt string.`,
            }
          );
          imagePrompt =
            promptGenResponse.text?.trim() ||
            `Realistic journalistic press news photography depicting: ${headline}, ${variationAngle}, high detail, 4k`;
        } catch (pErr) {
          imagePrompt = `Realistic journalistic press news photography depicting: ${headline}, ${variationAngle}, high detail, 4k`;
        }
      } else {
        imagePrompt = `Realistic journalistic press news photography depicting: ${headline}, ${variationAngle}, high detail, 4k`;
      }
    }

    console.log("Generating AI image with provider:", aiProvider, "prompt:", imagePrompt, "variation:", variation);

    let imageBase64 = "";
    let isAiGenerated = false;

    // Branch 1: OpenAI DALL-E 3
    if (aiProvider === "openai") {
      try {
        const openai = getOpenAIClient();
        const dalleSize = aspectRatio === "1:1" ? "1024x1024" : "1024x1792";
        const dallePrompt = `${imagePrompt}. Journalistic documentary photography style, realistic Indian news press photography, natural ambient lighting, 35mm camera lens, authentic scene. No text, no words, no watermark, no logos, clean image.`;

        console.log("Calling OpenAI DALL-E 3 with prompt:", dallePrompt);
        const dalleRes = await openai.images.generate({
          model: "dall-e-3",
          prompt: dallePrompt,
          n: 1,
          size: dalleSize,
          response_format: "b64_json",
        });

        const b64 = dalleRes.data?.[0]?.b64_json;
        if (b64) {
          imageBase64 = `data:image/png;base64,${b64}`;
          isAiGenerated = true;
        } else if (dalleRes.data?.[0]?.url) {
          const proxied = `/api/proxy-image?url=${encodeURIComponent(dalleRes.data[0].url)}`;
          return res.json({
            success: true,
            imageUrl: proxied,
            promptUsed: imagePrompt,
            fallbackUsed: false,
            isAiGenerated: true,
            provider: "openai",
          });
        }
      } catch (openAiImgErr: any) {
        console.error("OpenAI DALL-E 3 error:", openAiImgErr);
        if (openAiImgErr?.message && openAiImgErr.message.includes("OPENAI_API_KEY सेट नहीं है")) {
          return res.status(400).json({ error: openAiImgErr.message });
        }
        // If OpenAI image generation fails due to policy or limits, fall through to authentic curated photo
        console.warn("OpenAI DALL-E 3 failed, will use authentic press photo fallback");
      }
    } else {
      // Branch 2: Gemini Imagen Models
      let mappedAspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9" = "3:4";
      if (aspectRatio === "1:1") mappedAspectRatio = "1:1";
      else if (aspectRatio === "9:16") mappedAspectRatio = "9:16";
      else if (aspectRatio === "16:9") mappedAspectRatio = "16:9";

      if (process.env.GEMINI_API_KEY) {
        try {
          const imgResponse = await ai.models.generateContent({
            model: "gemini-3.1-flash-image",
            contents: {
              parts: [
                {
                  text: `${imagePrompt}. Journalistic press photo, award-winning news photography, authentic documentary realism, clear focus, high quality.`,
                },
              ],
            },
            config: {
              imageConfig: {
                aspectRatio: mappedAspectRatio,
              },
            },
          });

          if (imgResponse.candidates && imgResponse.candidates[0]?.content?.parts) {
            for (const part of imgResponse.candidates[0].content.parts) {
              if (part.inlineData) {
                imageBase64 = `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
                isAiGenerated = true;
                break;
              }
            }
          }
        } catch (primaryErr: any) {
          console.warn("gemini-3.1-flash-image failed:", primaryErr?.message?.slice(0, 100));
          try {
            const imgFallback = await ai.models.generateContent({
              model: "gemini-3.1-flash-lite-image",
              contents: {
                parts: [
                  {
                    text: `${imagePrompt}. Journalistic press photo, realistic documentary photo.`,
                  },
                ],
              },
              config: {
                imageConfig: {
                  aspectRatio: mappedAspectRatio,
                },
              },
            });

            if (imgFallback.candidates && imgFallback.candidates[0]?.content?.parts) {
              for (const part of imgFallback.candidates[0].content.parts) {
                if (part.inlineData) {
                  imageBase64 = `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
                  isAiGenerated = true;
                  break;
                }
              }
            }
          } catch (secondaryErr: any) {
            console.warn("gemini-3.1-flash-lite-image also failed:", secondaryErr?.message?.slice(0, 100));
          }
        }
      }
    }

    // Graceful fallback if AI generation hit rate limit or quota exceeded
    if (!imageBase64) {
      console.log("Providing authentic journalistic fallback press photo for headline:", headline, "var:", variation);
      const fallbackRaw = pickCuratedNewsPressPhoto(`${headline} ${customPrompt || ""}`, Number(variation) || 0);
      const fallbackProxied = `/api/proxy-image?url=${encodeURIComponent(fallbackRaw)}`;
      return res.json({
        success: true,
        imageUrl: fallbackProxied,
        promptUsed: imagePrompt,
        fallbackUsed: true,
        isAiGenerated: false,
        notice: "AI इमेज कोटा पूरा होने के कारण समाचार विषय से संबंधित प्रामाणिक प्रेस फोटो तैयार की गई है।",
      });
    }

    return res.json({
      success: true,
      imageUrl: imageBase64,
      promptUsed: imagePrompt,
      fallbackUsed: false,
      isAiGenerated: true,
      provider: aiProvider,
    });
  } catch (err: any) {
    console.error("Error in /api/generate-ai-image, falling back safely:", err);
    const fallbackRaw = pickCuratedNewsPressPhoto(`${req.body?.headline || ""} ${req.body?.customPrompt || ""}`, Number(req.body?.variation) || 0);
    const fallbackProxied = `/api/proxy-image?url=${encodeURIComponent(fallbackRaw)}`;
    return res.json({
      success: true,
      imageUrl: fallbackProxied,
      promptUsed: req.body?.customPrompt || "Journalistic Press Photo",
      fallbackUsed: true,
      isAiGenerated: false,
      notice: "दैनिक AI इमेज कोटा सीमा के कारण संबंधित प्रामाणिक प्रेस फोटो चयनित की गई है।",
    });
  }
});

// Endpoint: Generate / Expand Instagram & Facebook Caption with strict 2-3 paragraphs and hashtags
app.post("/api/generate-caption", async (req, res) => {
  const { headline, location, existingSummary, category, style = 'detailed_3_para', customInstruction, aiProvider = 'gemini' } = req.body;
  try {
    if (!headline) {
      return res.status(400).json({ error: "Headline is required" });
    }

    let styleDirective = `1. समाचार को कम से कम 2 पैराग्राफ, और यदि घटना/मामले में बिंदु या विवरण अधिक हैं तो 3 पूर्ण पैराग्राफ में विस्तार से लिखें।`;
    if (style === 'detailed_3_para') {
      styleDirective = `1. समाचार को अनिवार्य रूप से ठीक 3 बड़े, समृद्ध और विस्तृत पैराग्राफ में लिखें (Full 3 Detailed Paragraphs):
   - पहला पैराग्राफ: घटना का मुख्य विवरण, समय, स्थान व प्रमुख घटनाक्रम।
   - दूसरा पैराग्राफ: पृष्ठभूमि, कारण, प्रत्यक्षदर्शियों का कहना व जांच की बातें।
   - तीसरा पैराग्राफ: पुलिस/प्रशासन की कार्रवाई, वर्तमान स्थिति और आगे की प्रक्रिया।`;
    } else if (style === 'bullet_points') {
      styleDirective = `1. समाचार का पहला पैराग्राफ संक्षिप्त विवरण दें, उसके बाद 3-4 मुख्य बिंदु (बुलेट पॉइंट्स) में विस्तृत तथ्य दें, और अंत में 1 पैराग्राफ वर्तमान स्थिति का दें।`;
    } else if (style === 'short') {
      styleDirective = `1. समाचार को 2 बहुत ही आकर्षक, संक्षिप्त व वायरल पैराग्राफ में लिखें।`;
    }

    const prompt = `आप भारत के अग्रणी हिंदी डिजिटल न्यूज़ चैनल "ब्रेकिंग न्यूज़ वाला" के वरिष्ठ संपादक हैं।
कृपया निम्नलिखित समाचार के लिए इंस्टाग्राम और फेसबुक पोस्ट का विस्तृत, प्रामाणिक और प्रभावशाली कैप्शन तैयार करें:

हेडलाइन: "${headline}"
स्थान: "${location || "मध्य प्रदेश"}"
श्रेणी: "${category || "न्यूज़"}"
${existingSummary ? `संदर्भ / मौजूदा विवरण: ${existingSummary}` : ""}
${customInstruction ? `यूज़र का विशेष बदलाव / निर्देश: ${customInstruction}` : ""}

नियम (कड़ाई से पालन करें):
${styleDirective}
2. पाठकों को यह स्पष्ट अहसास होना चाहिए कि "पूरी खबर विवरण/डिस्क्रिप्शन में" उपलब्ध है।
3. खबर में कोई फालतू हेडिंग, टाइटल, फोन नंबर, सोशल मीडिया लिंक्स या "पूरी खबर पढ़ें" जैसे निर्देश न जोड़ें।
4. ठीक एक खाली लाइन छोड़कर अंत में 6 से 8 प्रासंगिक हैशटैग लगाएं।
5. हैशटैग क्रम (MUST):
   - सबसे पहला हैशटैग अनिवार्य रूप से: #breakingnewswala
   - बीच में घटना/स्थान से संबंधित प्रासंगिक हैशटैग (उदा: #BreakingNews #HindiNews #LatestNews #${(location || "MP").replace(/[^a-zA-Z0-9\u0900-\u097F]/g, "")}News)
   - सबसे अंतिम हैशटैग अनिवार्य रूप से: #BNWTV

केवल तैयार कैप्शन का शुद्ध टेक्स्ट दें, कोई अतिरिक्त मार्कडाउन या कोटेशन नहीं।`;

    let caption = "";

    if (aiProvider === "openai") {
      try {
        const openai = getOpenAIClient();
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "आप भारत के अग्रणी हिंदी डिजिटल न्यूज़ चैनल 'ब्रेकिंग न्यूज़ वाला' के वरिष्ठ संपादक हैं। केवल तैयार कैप्शन का शुद्ध टेक्स्ट दें, कोई अतिरिक्त मार्कडाउन या कोटेशन नहीं।",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.7,
        });
        caption = (completion.choices[0]?.message?.content || "").trim();
      } catch (openAiCapErr: any) {
        console.error("OpenAI caption error:", openAiCapErr);
        if (openAiCapErr?.message && openAiCapErr.message.includes("OPENAI_API_KEY सेट नहीं है")) {
          return res.status(400).json({ error: openAiCapErr.message });
        }
        console.log("OpenAI caption busy, using fallback template");
        const locTag = (location || "MP").replace(/[^a-zA-Z0-9\u0900-\u097F]/g, "");
        caption = `${headline}\n\n${existingSummary || `${location || "मध्य प्रदेश"} से इस वक्त की बड़ी और महत्वपूर्ण खबर सामने आ रही है। मामले में संबंधित विभाग और प्रशासन की ओर से त्वरित संज्ञान लेकर जांच व उचित कार्रवाई की जा रही है।`}\n\nइस पूरे घटनाक्रम से जुड़ी विस्तृत जानकारी और हर ताजा अपडेट के लिए जुड़े रहें ब्रेकिंग न्यूज़ वाला के साथ।\n\n#breakingnewswala #BreakingNews #HindiNews #${locTag}News #LatestUpdate #BNWTV`;
      }
    } else {
      const ai = getGeminiClient();
      try {
        const response = await generateWithFallbackAndRetry(
          ai,
          DEFAULT_FALLBACK_MODELS,
          {
            contents: prompt,
          }
        );
        caption = (response.text || "").trim();
      } catch (capErr: any) {
        console.log("Caption generation AI busy, using fallback template:", capErr?.message?.slice(0, 80));
        // Construct high-quality fallback caption
        const locTag = (location || "MP").replace(/[^a-zA-Z0-9\u0900-\u097F]/g, "");
        caption = `${headline}\n\n${existingSummary || `${location || "मध्य प्रदेश"} से इस वक्त की बड़ी और महत्वपूर्ण खबर सामने आ रही है। मामले में संबंधित विभाग और प्रशासन की ओर से त्वरित संज्ञान लेकर जांच व उचित कार्रवाई की जा रही है।`}\n\nइस पूरे घटनाक्रम से जुड़ी विस्तृत जानकारी और हर ताजा अपडेट के लिए जुड़े रहें ब्रेकिंग न्यूज़ वाला के साथ।\n\n#breakingnewswala #BreakingNews #HindiNews #${locTag}News #LatestUpdate #BNWTV`;
      }
    }

    return res.json({ success: true, caption });
  } catch (err: any) {
    console.error("Error in /api/generate-caption:", err);
    return res.status(500).json({ error: cleanErrorMessage(err) });
  }
});

// Curated High-Resolution Soft & Light Morning Background Photos (Serene, bright, airy pastel aesthetic)
const CURATED_MORNING_PRESS_PHOTOS = [
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop", // Soft golden morning sunrise mist over serene hills
  "https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?q=80&w=1200&auto=format&fit=crop", // Gentle morning mist park path with soft light
  "https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?q=80&w=1200&auto=format&fit=crop", // Bright airy morning daylight through lush green canopy
  "https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?q=80&w=1200&auto=format&fit=crop", // Soft pastel sunrise sky with gentle warm golden clouds
  "https://images.unsplash.com/photo-1439853949127-fa647821eba0?q=80&w=1200&auto=format&fit=crop", // Serene tranquil light morning water reflection, zen mood
  "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?q=80&w=1200&auto=format&fit=crop", // Warm gentle morning daylight in peaceful nature
];

// Endpoint: Generate Full AI Morning Jacket (Content + AI Background Image driven by voice/text command)
app.post("/api/generate-morning-jacket", async (req, res) => {
  try {
    const {
      topicPrompt,
      command,
      action = "generate", // 'generate' | 'change_image' | 'refine'
      refinementCommand = "",
      currentCard = {},
      variation = 0,
      generateImage = true,
      aiProvider = "gemini",
    } = req.body;

    const defaultMorningTopics = [
      "सकारात्मक सोच, आत्मविश्वास और निरंतर प्रयास पर अत्यंत प्रेरक विचार",
      "सफलता का मूलमंत्र: कर्म, धैर्य और अनुशासन पर सुविचार",
      "आज का अनमोल विचार: समय का सदुपयोग और जीवन का लक्ष्य",
      "सुबह की सैर और स्वास्थ्य के 3 स्वर्णिम नियम",
      "मानसिक शांति, विनम्रता और सकारात्मक ऊर्जा पर प्रेरक विचार",
      "भागवत गीता का सार: कर्म करो, फल की चिंता मत करो",
      "जीवन में कभी हार न मानने का दृढ़ संकल्प और प्रेरणा",
    ];

    let activePrompt = (command || topicPrompt || refinementCommand || "").trim();
    if (!activePrompt && action !== "change_image") {
      const randIdx = Math.floor(Math.random() * defaultMorningTopics.length);
      activePrompt = defaultMorningTopics[randIdx];
    }

    const ai = getGeminiClient();

    // Check if user is asking to change or replace the image
    const isImageChangeRequest =
      action === "change_image" ||
      /इमेज\s*(बदलें|बदलो|change|हटाओ|गलत|दूसरी)/i.test(activePrompt) ||
      /फोटो\s*(बदलें|बदलो|change|हटाओ|गलत|दूसरी)/i.test(activePrompt) ||
      /बैकग्राउंड\s*(बदलें|बदलो|change|नया)/i.test(activePrompt);

    let contentData: any = null;

    // If it's purely an image change request and we already have existing headline/thought:
    if (isImageChangeRequest && currentCard?.headline) {
      contentData = {
        headline: currentCard.headline,
        formattedHeadline: currentCard.formattedHeadline || currentCard.headline,
        badgeText: currentCard.morningBadgeText || "🌅 आज का विचार",
        thoughtQuote: currentCard.morningThoughtQuote || currentCard.morningTakeaway || "",
        summary: currentCard.summary || "",
        imagePrompt: `Aesthetic cinematic morning background wallpaper depicting ${currentCard.headline}. Beautiful ambient morning sunrise sunlight, serene nature landscape or wellness atmosphere, soft warm colors, high realism. Absolutely NO text, NO typography, NO watermark, NO logo, clean image for poster background`,
      };
    } else {
      // Step 1: Prompt AI to generate structured Hindi Thought & Card details
      const systemInstruction = `आप "ब्रेकिंग न्यूज़ वाला" डिजिटल न्यूज़ नेटवर्क के मुख्य संपादक, दर्शनविद और कला निर्देशक (Art Director) हैं।
यूज़र ने बोलकर (माइक द्वारा) या लिखकर यह विषय/निर्देश दिया है:
"${activePrompt}"
${currentCard?.headline ? `पूर्व सामग्री / संदर्भ: "${currentCard.headline}"` : ""}
${refinementCommand ? `सुधार/बदलाव निर्देश: "${refinementCommand}"` : ""}

यूज़र का उद्देश्य: हेडर और फुटर के बीच के सुरक्षित क्षेत्र में सोशल मीडिया पर वायरल होने वाला एक अत्यंत ओजस्वी, सुंदर, समृद्ध और प्रेरणादायी 'सुविचार / जीवन दर्शन / स्वास्थ्य' कार्ड बनाना।

महत्वपूर्ण संपादकीय नियम (STRICT EDITORIAL DIRECTIVES):
1. यूज़र की आवाज़ (Voice / Spoken Input) का गहन विश्लेषण:
   - जब यूज़र माइक से अनौपचारिक या संक्षिप्त रूप में बोलता है (जैसे: "सफलता पर बनाओ", "सुबह जल्दी उठने के फायदे", "माता-पिता का महत्व", "धैर्य और शांति", "जीवन का सच", "कर्म का फल", "समय की कद्र"):
   - तो केवल साधारण या सतही वाक्य न लिखें!
   - उस विषय के गूढ़ आध्यात्मिक, मनोवैज्ञानिक और जीवन-दर्शन (जैसे भगवद्गीता, स्वामी विवेकानंद, चाणक्य नीति, ओशो, कबीर) के स्तर का उत्कृष्ट, प्रभावशाली और हृदयस्पर्शी विचार तैयार करें।
   - भाषा उच्च-कोटि की, गरिमामय और विशुद्ध हिंदी होनी चाहिए जो पाठक के मन में उतर जाए।

2. पूर्णता एवं संख्यात्मक संतुलन (Strict Numerical Consistency):
   - यदि विषय में किसी संख्या का उल्लेख है (उदा. "3 स्वर्णिम नियम", "5 आदतें", "4 उपाय", "3 बातें"), तो 'thoughtQuote' में अनिवार्य रूप से ठीक उतनी ही संख्या के स्पष्ट, ठोस और संतुलित बिंदु (1. ... • 2. ... • 3. ...) लिखें। कभी भी 3 कहकर 2 न दें!

3. कोई न्यूज़ डिस्क्लेमर नहीं (NO NEWS PHRASES):
   - यह विशुद्ध 'सुविचार / प्रेरक विचार' कार्ड है। इसमें किसी भी तरह की समाचार रिपोर्टिंग या 'पूरी खबर डिस्क्रिप्शन में' जैसी शब्दावली कतई नहीं होनी चाहिए।

4. कलर थीम - व्हाइट व येलो (White & Golden Yellow Harmony):
   - मुख्य विचार में 2-3 सबसे महत्वपूर्ण और प्रेरक शब्दों को [yellow]शब्द[/yellow] से चिह्नित करें, ताकि वे कार्ड पर चमकदार सुनहरे पीले रंग में हाइलाइट हों और बाकी टेक्स्ट श्वेत (White) रंग में चमके।

कृपया JSON में निम्नलिखित फ़ील्ड्स तैयार करें:
1. "headline": मुख्य विचार अथवा विषय का प्रेरक दोहा/पंक्ति (10-24 शब्द, बेहद प्रभावशाली, पठनीय और प्रवाहमयी हिंदी में)।
2. "formattedHeadline": मुख्य विचार में 2-3 सबसे प्रभावशाली शब्दों के आगे-पीछे [yellow]शब्द[/yellow] लगाएं (उदा. "[yellow]सफलता[/yellow] केवल सोचने से नहीं, अटूट [yellow]धैर्य और निरंतर प्रयास[/yellow] से मिलती है")।
3. "badgeText": विषय के अनुकूल गरिमामय बैज (उदा. "🌅 आज का विचार", "✨ अनमोल जीवन दर्शन", "🧘 स्वास्थ्य मंत्र", "💎 प्रेरक सूत्र", "🕉️ गीता संदेश", "🌱 सकारात्मक विचार", "💡 सफलता के रहस्य")।
4. "thoughtQuote": 1 से 3 पंक्तियों का सारगर्भित टेकअवे, व्यावहारिक उपाय अथवा संख्यात्मक बिंदु (उदा. यदि 3 आदतें हैं: "1. उषाकाल में जागरण  •  2. 20 मिनट का व्यायाम  •  3. शांत मन से ध्यान")।
5. "summary": इंस्टाग्राम/फेसबुक के लिए एक सुरुचिपूर्ण, प्रेरक 2 पैराग्राफ पोस्ट विवरण। अंत में 1 खाली पंक्ति छोड़कर लोकप्रिय हैशटैग्स: #breakingnewswala #AajKaVichar #ThoughtOfTheDay #HindiQuotes #Inspiration #Positivity #BNWMedia
6. "imagePrompt": एक उच्च कोटि का अंग्रेजी प्रॉम्प्ट (English Prompt) जो इस विचार के अनुकूल एक शांत, दिव्य, एस्थेटिक और प्राकृतिक बैकग्राउंड फोटो / आर्ट बनाएगा। 
   नियम:
   - Soft serene ambient background (e.g. golden misty sunrise, tranquil mountain lake reflection, sunlit dew on emerald leaf, spiritual temple dawn, peaceful morning atmosphere).
   - Middle area soft and clean for clear text readability.
   - Absolutely NO text, NO letters, NO words, NO watermark, photorealistic cinematic lighting, 4k.

Strictly return valid JSON object matching these keys.`;

      if (aiProvider === "openai") {
        try {
          const openai = getOpenAIClient();
          const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            response_format: { type: "json_object" },
            messages: [
              {
                role: "system",
                content: "You are the chief editorial director for Breaking News Wala Hindi morning graphics. Always respond in strictly valid JSON format.",
              },
              { role: "user", content: systemInstruction },
            ],
            temperature: 0.6,
          });
          const raw = completion.choices[0]?.message?.content || "{}";
          contentData = JSON.parse(raw);
        } catch (openAiErr: any) {
          console.warn("OpenAI morning generation error, falling back to Gemini:", openAiErr?.message);
        }
      }

      if (!contentData && process.env.GEMINI_API_KEY) {
        try {
          const geminiRes = await generateWithFallbackAndRetry(ai, DEFAULT_FALLBACK_MODELS, {
            contents: systemInstruction,
            config: {
              responseMimeType: "application/json",
              temperature: 0.6,
            },
          });
          const raw = geminiRes.text?.trim() || "{}";
          contentData = JSON.parse(raw);
        } catch (geminiErr: any) {
          console.error("Gemini morning content generation error:", geminiErr);
        }
      }

      // High quality fallback if AI APIs fail
      if (!contentData || !contentData.headline) {
        contentData = {
          headline: activePrompt.length > 8 ? activePrompt : "सकारात्मक सोच और निरंतर प्रयास ही हर सफलता की कुंजी है।",
          formattedHeadline: `[yellow]सकारात्मक सोच[/yellow] और [yellow]निरंतर प्रयास[/yellow] ही सफलता की कुंजी है।`,
          badgeText: "🌅 आज का विचार",
          thoughtQuote: "हर सुबह एक नया अवसर लेकर आती है, खुद पर विश्वास रखें और आगे बढ़ें।",
          summary: `${activePrompt || "आज का सुविचार"}\n\n#breakingnewswala #MorningVibes #PositiveThoughts #BNWTV`,
          imagePrompt: `Aesthetic golden morning sunrise landscape with peaceful mist and soft ambient sunlight, cinematic lighting, no text, no letters.`,
        };
      }
    }

    // Step 2: Generate AI Background Image (Soft, Light-Toned & Serene Morning Aesthetics)
    let generatedImageUrl = "";
    const variationAngles = [
      "soft golden sunrise sky, gentle morning mist, light pastel morning horizon, serene warm daylight",
      "bright airy morning nature, gentle sunlight bokeh, soft pastel greens and pale golden light, tranquil peaceful mood",
      "light-toned morning horizon, gentle warm pastel glow, soft peaceful dawn, high brightness and clean light aesthetics",
      "soft morning sunbeams filtering through light morning dew, bright cheerful airy ambience, pastel warm morning",
      "minimalist serene bright morning landscape, soft pastel clouds, gentle warm sunlight, clean airy light composition",
    ];
    const angleText = variationAngles[Math.abs(Number(variation) || 0) % variationAngles.length];

    const imagePrompt =
      contentData.imagePrompt ||
      `Aesthetic soft light-colored morning background wallpaper for: ${contentData.headline || activePrompt}. ${angleText}. Soft pastel morning lighting, gentle ambient glow, bright airy daylight, clean light background, no dark shadows, strictly NO text, NO words, NO letters, NO watermark, 4k`;

    if (generateImage) {
      console.log("Generating Morning Jacket AI image with prompt:", imagePrompt, "variation:", variation);
      if (process.env.GEMINI_API_KEY) {
        try {
          const imgRes = await ai.models.generateContent({
            model: "gemini-3.1-flash-image",
            contents: {
              parts: [
                {
                  text: `${imagePrompt}. ${angleText}. Soft light-colored photographic background wallpaper, aesthetic bright morning atmosphere, pale soft colors, bright clean lighting, strictly no text, no words, no letters, no logos.`,
                },
              ],
            },
            config: {
              imageConfig: {
                aspectRatio: "3:4",
              },
            },
          });

          if (imgRes.candidates && imgRes.candidates[0]?.content?.parts) {
            for (const part of imgRes.candidates[0].content.parts) {
              if (part.inlineData) {
                generatedImageUrl = `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
                break;
              }
            }
          }
        } catch (imgErr: any) {
          console.warn("Morning gemini-3.1-flash-image error:", imgErr?.message?.slice(0, 100));
          try {
            const imgFallback = await ai.models.generateContent({
              model: "gemini-3.1-flash-lite-image",
              contents: {
                parts: [
                  {
                    text: `${imagePrompt}. ${angleText}. Soft light-colored photographic background wallpaper, aesthetic bright morning atmosphere, strictly no text, no letters.`,
                  },
                ],
              },
              config: {
                imageConfig: {
                  aspectRatio: "3:4",
                },
              },
            });

            if (imgFallback.candidates && imgFallback.candidates[0]?.content?.parts) {
              for (const part of imgFallback.candidates[0].content.parts) {
                if (part.inlineData) {
                  generatedImageUrl = `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
                  break;
                }
              }
            }
          } catch (liteErr: any) {
            console.warn("gemini-3.1-flash-lite-image also busy:", liteErr?.message?.slice(0, 100));
          }
        }
      }

      // Fallback to OpenAI DALL-E 3 if Gemini failed and user chose OpenAI
      if (!generatedImageUrl && aiProvider === "openai") {
        try {
          const openai = getOpenAIClient();
          const dalleRes = await openai.images.generate({
            model: "dall-e-3",
            prompt: `${imagePrompt}. ${angleText}. Soft photographic background, bright clean daylight, no text, no words, no watermark.`,
            n: 1,
            size: "1024x1792",
            response_format: "b64_json",
          });
          const b64 = dalleRes.data?.[0]?.b64_json;
          if (b64) {
            generatedImageUrl = `data:image/png;base64,${b64}`;
          }
        } catch (dalleErr) {
          console.warn("Morning DALL-E generation failed:", dalleErr);
        }
      }

      // Graceful fallback to authentic serene curated photo if quota exceeded
      if (!generatedImageUrl) {
        const pickedIdx = Math.abs(Number(variation) || 0) % CURATED_MORNING_PRESS_PHOTOS.length;
        const fallbackRaw = CURATED_MORNING_PRESS_PHOTOS[pickedIdx];
        generatedImageUrl = `/api/proxy-image?url=${encodeURIComponent(fallbackRaw)}`;
      }
    }

    return res.json({
      success: true,
      data: contentData,
      imageUrl: generatedImageUrl,
      imagePrompt,
      variation: Number(variation) || 0,
    });
  } catch (err: any) {
    console.error("Error in /api/generate-morning-jacket:", err);
    return res.status(500).json({ error: cleanErrorMessage(err) });
  }
});

// App Version Configuration & In-App Update Management
let appVersionData = {
  version: "1.2.0",
  versionCode: 10200,
  releaseDate: "2026-09-08",
  downloadUrl: "/app-release.apk",
  apkAvailable: true,
  releaseTitle: "न्यू अपडेट v1.2.0: मॉर्निंग AI स्टूडियो व मोबाइल स्प्लिट व्यू",
  releaseNotes: [
    "🌅 मॉर्निंग जैकेट: 1-क्लिक AI सुविचार व एस्थेटिक फोटो जनरेटर (बिना टाइप किए तुरंत नया सुविचार बनाएं)",
    "📱 मोबाइल लाइव प्रीव्यू: स्क्रॉल करते ही कॉम्पैक्ट हाफ-स्क्रीन मोड — नीचे एडिट करते हुए ऊपर लाइव बदलाव देखें",
    "👤 रिपोर्टर रोल: रिपोर्टर को केवल 4 मुख्य जैकेट्स (ओरिजिनल, सुपर ब्रेकिंग, टेक्स्ट ब्रेकिंग, मॉर्निंग) दिखेंगी",
    "👑 मुख्य संपादक (Admin): सभी 7 जैकेट्स और एडवांस्ड फीचर्स उपलब्ध",
    "📲 इन-ऐप अपडेट सिस्टम: नया वर्जन आने पर नोटिफिकेशन पॉपअप व डायरेक्ट APK डाउनलोड की सुविधा"
  ],
  minRequiredVersion: "1.0.0",
  forceUpdate: false,
};

app.get("/api/app-version", (_req, res) => {
  res.json({
    success: true,
    versionInfo: appVersionData,
    currentServerTime: new Date().toISOString(),
  });
});

app.post("/api/admin/update-version-info", (req, res) => {
  try {
    const { version, versionCode, releaseTitle, releaseNotes, downloadUrl, forceUpdate } = req.body;
    if (version) appVersionData.version = String(version).trim();
    if (versionCode) appVersionData.versionCode = Number(versionCode);
    if (releaseTitle) appVersionData.releaseTitle = String(releaseTitle).trim();
    if (Array.isArray(releaseNotes) && releaseNotes.length > 0) {
      appVersionData.releaseNotes = releaseNotes;
    }
    if (downloadUrl) appVersionData.downloadUrl = String(downloadUrl).trim();
    if (typeof forceUpdate === "boolean") appVersionData.forceUpdate = forceUpdate;

    return res.json({
      success: true,
      message: "ऐप वर्जन जानकारी सफलतापूर्वक अपडेट हो गई!",
      versionInfo: appVersionData,
    });
  } catch (err: any) {
    return res.status(500).json({ error: cleanErrorMessage(err) });
  }
});

async function startServer() {
  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`News Graphic Studio server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
