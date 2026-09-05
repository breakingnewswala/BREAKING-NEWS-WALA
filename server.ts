import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase payload limits for image uploads
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

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

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Image Analysis with Gemini 3.1 Pro Preview (as requested by user feature)
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
आप भारत के प्रमुख डिजिटल न्यूज़ चैनल "ब्रेकिंग न्यूज़वाला" के वरिष्ठ मुख्य संपादक हैं।
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

    let response;
    // Primary model: gemini-3.1-pro-preview as explicitly requested
    try {
      response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
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
      });
    } catch (proError: any) {
      console.warn("gemini-3.1-pro-preview fallback attempt:", proError.message);
      // Fallback to gemini-3.8-flash if pro preview encounters rate limit or permission
      response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
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
      });
    }

    const textOutput = response.text || "{}";
    const parsedData = JSON.parse(textOutput);
    return res.json({ success: true, data: parsedData });
  } catch (err: any) {
    console.error("Error in /api/analyze-image:", err);
    return res.status(500).json({
      error: err.message || "Failed to analyze image with Gemini",
    });
  }
});

// Process News Link or Natural Language Command / Text into News Graphic structure
app.post("/api/process-news-command", async (req, res) => {
  try {
    const { input, linkUrl } = req.body;

    if (!input && !linkUrl) {
      return res.status(400).json({ error: "Please provide a command, text or link" });
    }

    const ai = getGeminiClient();
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is missing. Please set it in Settings > Secrets.",
      });
    }

    let fetchedArticleSnippet = "";
    const pickedImages: { main?: string; second?: string } = {};

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
          // Extract title and text snippets
          const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
          const metaDescMatch = html.match(
            /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i
          );
          fetchedArticleSnippet = `
URL: ${linkUrl}
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
            // Wrap in /api/proxy-image so it has CORS enabled for HTML5 Canvas export
            pickedImages.main = `/api/proxy-image?url=${encodeURIComponent(foundImages[0])}`;
            if (foundImages.length > 1) {
              pickedImages.second = `/api/proxy-image?url=${encodeURIComponent(foundImages[1])}`;
            }
          }
        }
      } catch (fetchErr) {
        console.warn("Could not fetch URL directly, will use URL string in prompt:", fetchErr);
        fetchedArticleSnippet = `URL to reference: ${linkUrl}`;
      }
    }

    const prompt = `
आप भारत के न्यूज़ चैनल "ब्रेकिंग न्यूज़वाला" के चीफ एडिटर हैं।
यूज़र ने यह कमांड / लिंक / समाचार दिया है:
${input || ""}
${fetchedArticleSnippet ? `वेबसाइट सामग्री: ${fetchedArticleSnippet}` : ""}

कृपया इस जानकारी से एक शक्तिशाली, वायरल और ऑथेंटिक हिंदी इमेज न्यूज़ (न्यूज़ ग्राफिक कार्ड) तैयार करें:
1. "headline": बोल्ड, स्पष्ट हिंदी हेडलाइन (लगभग 12-25 शब्द, देवनागरी लिपि में)।
2. "highlightWords": हेडलाइन में से 2-4 मुख्य शब्द जिन्हें पीले रंग (Yellow) में हाइलाइट करना है।
3. "formattedHeadline": हेडलाइन में हाइलाइट होने वाले शब्दों के चारों ओर [yellow]शब्द[/yellow] लगाएं।
4. "location": संबंधित शहर, जिला या राज्य (जैसे "मध्य प्रदेश", "शहडोल, मप्र", "रीवा", "भोपाल", आदि)।
5. "summary": सोशल मीडिया (Instagram व Facebook पोस्ट) के लिए कम से कम 2 और खबर में विवरण अधिक होने पर 3 विस्तृत पैराग्राफ में पूरी खबर विस्तार से लिखें ताकि पाठक को लगे कि "पूरी खबर डिस्क्रिप्शन में" मिल गई है। उसके ठीक बाद एक खाली लाइन छोड़कर अंत में हैशटैग लगाएं, जिसमें सबसे पहला हैशटैग अनिवार्य रूप से #breakingnewswala होगा, बीच में 4-6 प्रासंगिक हैशटैग (जैसे #BreakingNews #HindiNews आदि), और सबसे अंतिम हैशटैग अनिवार्य रूप से #BNWTV होगा। इसके अलावा कोई अन्य हेडिंग, फोन नंबर या सोशल लिंक नहीं होना चाहिए।
6. "category": न्यूज़ श्रेणी (हादसा / प्रशासन / राजनीति / विकास / अपराध / जनआंदोलन)।
7. "suggestedImagePrompt": यदि यूज़र के पास फोटो नहीं है तो AI इमेज जनरेट करने के लिए एक सटीक अंग्रेजी प्रॉम्प्ट।
8. "isAiGeneratedPhoto": क्या यूज़र के कमांड, टेक्स्ट या लिंक में यह लिखा है या संकेत है कि फोटो AI जनरेटेड है / काल्पनिक है / इलस्ट्रेशन है (जैसे 'AI generated', 'एआई फोटो', 'AI image', 'काल्पनिक चित्र', 'सिंथेटिक')? (true या false).
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
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
            suggestedImagePrompt: { type: Type.STRING },
            isAiGeneratedPhoto: { type: Type.BOOLEAN },
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
    });

    const parsedData = JSON.parse(response.text || "{}");
    // Attach picked images from the URL if any
    parsedData.pickedImages = pickedImages;
    return res.json({ success: true, data: parsedData });
  } catch (err: any) {
    console.error("Error in /api/process-news-command:", err);
    return res.status(500).json({
      error: err.message || "Failed to process news command",
    });
  }
});

// Generate AI News Photo from Headline
app.post("/api/generate-ai-image", async (req, res) => {
  try {
    const { headline, customPrompt, aspectRatio = "4:5" } = req.body;

    if (!headline && !customPrompt) {
      return res.status(400).json({ error: "Headline or prompt is required" });
    }

    const ai = getGeminiClient();
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is missing. Please set it in Settings > Secrets.",
      });
    }

    // Step 1: Create an editorial, journalistic photography prompt in English
    let imagePrompt = customPrompt;
    if (!imagePrompt || imagePrompt.trim().length === 0) {
      try {
        const promptGenResponse = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: `You are an art director for a top Indian digital news channel.
Given this Hindi news headline: "${headline}",
write a descriptive, photorealistic, journalistic photography prompt in English for generating a background news photo.
Requirements:
- Realistic press photo style, natural ambient daylight, 35mm lens authentic documentary feel.
- High detail, realistic environment in India.
- Absolutely NO text, NO typography, NO watermark, NO logo, NO borders.
Return ONLY the English prompt string.`,
        });
        imagePrompt =
          promptGenResponse.text?.trim() ||
          `Realistic journalistic press news photography depicting: ${headline}, authentic Indian news setting, documentary photo, high detail, 4k`;
      } catch (pErr) {
        imagePrompt = `Realistic journalistic press news photography depicting: ${headline}, authentic Indian news setting, documentary photo, high detail, 4k`;
      }
    }

    console.log("Generating AI image with prompt:", imagePrompt);

    // Supported aspect ratios in Gemini imageConfig: "1:1", "3:4", "4:3", "9:16", "16:9"
    let mappedAspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9" = "3:4";
    if (aspectRatio === "1:1") mappedAspectRatio = "1:1";
    else if (aspectRatio === "9:16") mappedAspectRatio = "9:16";
    else if (aspectRatio === "16:9") mappedAspectRatio = "16:9";

    let imageBase64 = "";
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
            break;
          }
        }
      }
    } catch (primaryErr: any) {
      console.warn("gemini-3.1-flash-image failed, attempting fallback:", primaryErr.message);
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
            break;
          }
        }
      }
    }

    if (!imageBase64) {
      return res.status(500).json({
        error: "AI model could not generate image. Please try again with a different headline.",
      });
    }

    return res.json({
      success: true,
      imageUrl: imageBase64,
      promptUsed: imagePrompt,
    });
  } catch (err: any) {
    console.error("Error in /api/generate-ai-image:", err);
    return res.status(500).json({
      error: err.message || "Failed to generate AI image",
    });
  }
});

// Endpoint: Generate / Expand Instagram & Facebook Caption with strict 2-3 paragraphs and hashtags
app.post("/api/generate-caption", async (req, res) => {
  try {
    const { headline, location, existingSummary, category } = req.body;
    if (!headline) {
      return res.status(400).json({ error: "Headline is required" });
    }

    const ai = getGeminiClient();
    const prompt = `आप भारत के अग्रणी हिंदी डिजिटल न्यूज़ चैनल "ब्रेकिंग न्यूज़वाला" के वरिष्ठ संपादक हैं।
कृपया निम्नलिखित समाचार के लिए इंस्टाग्राम और फेसबुक पोस्ट का विस्तृत, प्रामाणिक और प्रभावशाली कैप्शन तैयार करें:

हेडलाइन: "${headline}"
स्थान: "${location || "मध्य प्रदेश"}"
श्रेणी: "${category || "न्यूज़"}"
${existingSummary ? `संदर्भ / मौजूदा विवरण: ${existingSummary}` : ""}

नियम (कड़ाई से पालन करें):
1. समाचार को कम से कम 2 पैराग्राफ, और यदि घटना/मामले में बिंदु या विवरण अधिक हैं तो 3 पूर्ण पैराग्राफ में विस्तार से लिखें।
2. पाठकों को यह स्पष्ट अहसास होना चाहिए कि "पूरी खबर विवरण/डिस्क्रिप्शन में" उपलब्ध है।
3. खबर में कोई फालतू हेडिंग, टाइटल, फोन नंबर, सोशल मीडिया लिंक्स या "पूरी खबर पढ़ें" जैसे निर्देश न जोड़ें।
4. ठीक एक खाली लाइन छोड़कर अंत में 6 से 8 प्रासंगिक हैशटैग लगाएं।
5. हैशटैग क्रम (MUST):
   - सबसे पहला हैशटैग अनिवार्य रूप से: #breakingnewswala
   - बीच में घटना/स्थान से संबंधित प्रासंगिक हैशटैग (उदा: #BreakingNews #HindiNews #LatestNews #${(location || "MP").replace(/[^a-zA-Z0-9\u0900-\u097F]/g, "")}News)
   - सबसे अंतिम हैशटैग अनिवार्य रूप से: #BNWTV

केवल तैयार कैप्शन का शुद्ध टेक्स्ट दें, कोई अतिरिक्त मार्कडाउन या कोटेशन नहीं।`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
    });

    const caption = (response.text || "").trim();
    return res.json({ success: true, caption });
  } catch (err: any) {
    console.error("Error in /api/generate-caption:", err);
    return res.status(500).json({ error: err.message || "Failed to generate caption" });
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
