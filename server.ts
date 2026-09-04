import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Increase payload limits for image uploads
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

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
5. "summary": सोशल मीडिया (Instagram व Facebook पोस्ट) के लिए 2 से 3 पैराग्राफ में पूरी विस्तृत खबर, और उसके ठीक बाद एक खाली लाइन छोड़कर अंत में 6-8 प्रासंगिक हैशटैग (जैसे #BreakingNews #MPNews आदि)। इसके अलावा कोई अन्य हेडिंग, फोन नंबर या सोशल लिंक नहीं होना चाहिए।
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
    if (linkUrl) {
      try {
        const fetchRes = await fetch(linkUrl, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
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
5. "summary": सोशल मीडिया (Instagram व Facebook पोस्ट) के लिए 2 से 3 पैराग्राफ में पूरी विस्तृत खबर, और उसके ठीक बाद एक खाली लाइन छोड़कर अंत में 6-8 प्रासंगिक हैशटैग (जैसे #BreakingNews #MPNews आदि)। इसके अलावा कोई अन्य हेडिंग, फोन नंबर या सोशल लिंक नहीं होना चाहिए।
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
    return res.json({ success: true, data: parsedData });
  } catch (err: any) {
    console.error("Error in /api/process-news-command:", err);
    return res.status(500).json({
      error: err.message || "Failed to process news command",
    });
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
