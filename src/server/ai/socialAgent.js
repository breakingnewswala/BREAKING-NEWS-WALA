/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Master AI Social Media Caption Generator Agent (AGT-SOC-007)
 * Grounded in docs/17-Agents.md, docs/21-Prompts.md, and Master Execution 023
 * 
 * Invariants:
 * 1. Generates platform-tailored social copy for FB, IG, X, WhatsApp, YouTube.
 * 2. Strictly ZERO deceptive clickbait, exaggeration, or misleading headlines.
 * 3. Incorporates relevant hashtags (#MadhyaPradesh, #DistrictNews, etc.).
 * 4. Adheres strictly to platform constraints (X <= 280 chars, WhatsApp clean formatting).
 */

import { aiProviderPool } from './providerPool.js';

export const SOCIAL_PLATFORMS = ['FACEBOOK', 'INSTAGRAM', 'X_TWITTER', 'WHATSAPP', 'YOUTUBE'];

export async function generateSocialCaptions({
  headline = '',
  summary = '',
  district = 'मध्य प्रदेश',
  articleUrl = '',
  platforms = SOCIAL_PLATFORMS,
  userId = 'system',
  userRole = 'REPORTER',
  providerName = null
}) {
  if (!headline && !summary) {
    throw new Error('सोशल मीडिया पोस्ट तैयार करने के लिए शीर्षक या सार अनिवार्य है।');
  }

  const systemPrompt = `आप ब्रेकिंग न्यूज़ वाला के डिजिटल मीडिया एवं सोशल नेटवर्किंग AI विशेषज्ञ हैं।
नियम:
1. क्लिकबैट या भ्रामक सनसनीखेज भाषा का प्रयोग कदापि न करें।
2. समाचार के वास्तविक तथ्यों पर आधारित, आकर्षक और गरिमापूर्ण पोस्ट बनाएं।
3. प्रत्येक सोशल प्लेटफॉर्म के मानक नियमों का पालन करें।`;

  const taskPrompt = `निम्नलिखित समाचार हेतु सोशल मीडिया पोस्ट तैयार करें:
शीर्षक: ${headline}
सार: ${summary}
जिला/क्षेत्र: ${district}
वेबसाइट लिंक: ${articleUrl || 'https://breakingnewswala.in'}

कृपया निम्नलिखित JSON प्रारूप में उत्तर दें:
{
  "facebook": {
    "text": "विस्तृत फेसबुक पोस्ट (कहानी शैली + मुख्य बिंदु + चर्चा हेतु प्रश्न)",
    "callToAction": "पूरी खबर पढ़ने के लिए लिंक पर क्लिक करें",
    "hashtags": ["#MadhyaPradesh", "#BreakingNews"]
  },
  "instagram": {
    "caption": "आकर्षक दृश्य-अनुकूल कैप्शन (हुक + सार)",
    "hashtags": ["#BhopalNews", "#MPNews", "#BreakingNewsWala", "#GroundReport"],
    "carouselSlideSuggestions": ["स्लाइड 1 हुक", "स्लाइड 2 तथ्य", "स्लाइड 3 प्रशासन का पक्ष"]
  },
  "xTwitter": {
    "tweet": "सटीक 280 अक्षरों के भीतर प्रभावशाली ट्वीट (तथ्य + हैशटैग + लिंक)",
    "characterCount": 220,
    "threadStarter": true
  },
  "whatsapp": {
    "bulletin": "📢 *ब्रेकिंग न्यूज़ वाला* | *${district}*\n\n🔴 *${headline}*\n\n🔹 *मुख्य बिंदु:* ...\n\n📲 *पूरा विवरण:* ${articleUrl || 'https://breakingnewswala.in'}\n\n_अपडेट साझा करें_",
    "forwardableText": "संक्षिप्त फॉरवर्ड टेक्स्ट"
  },
  "youtube": {
    "communityPost": "यूट्यूब कम्युनिटी पोस्ट टेक्स्ट",
    "shortDescription": "यूट्यूब शॉर्ट्स/वीडियो विवरण व समय-चिह्न"
  }
}`;

  const response = await aiProviderPool.executePrompt({
    providerName,
    promptCategory: 'SOCIAL',
    systemPrompt,
    taskPrompt,
    temperature: 0.35,
    maxTokens: 1600,
    userId,
    userRole
  });

  let parsed = null;
  try {
    const raw = response.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    parsed = JSON.parse(raw);
  } catch (_e) {
    parsed = fallbackSocialParser(headline, summary, district, articleUrl);
  }

  // Ensure X/Twitter tweet does not exceed 280 chars
  let xTweet = parsed.xTwitter?.tweet || `🔴 ${headline} | ${district}\n\nताज़ा अपडेट के लिए पढ़ें: ${articleUrl || 'https://breakingnewswala.in'} #MPNews`;
  if (xTweet.length > 280) {
    xTweet = `${xTweet.slice(0, 276)}...`;
  }

  return {
    success: true,
    data: {
      headline,
      district,
      facebook: parsed.facebook || {
        text: `${headline}\n\n${summary}\n\nविस्तृत समाचार के लिए ब्रेकिंग न्यूज़ वाला से जुड़े रहें।`,
        callToAction: 'विस्तृत रिपोर्ट पढ़ें',
        hashtags: [`#${district.replace(/\s+/g, '')}`, '#MPNews', '#BreakingNewsWala']
      },
      instagram: parsed.instagram || {
        caption: `📢 ${headline}\n\n${summary}\n\nअधिक जानकारी के लिए लिंक बायो में देखें।`,
        hashtags: ['#BreakingNewsWala', '#MadhyaPradesh', '#DistrictNews'],
        carouselSlideSuggestions: ['मुख्य शीर्षक', 'घटना का विवरण', 'प्रशासन की कार्रवाई']
      },
      xTwitter: {
        tweet: xTweet,
        characterCount: xTweet.length,
        threadStarter: Boolean(parsed.xTwitter?.threadStarter)
      },
      whatsapp: parsed.whatsapp || {
        bulletin: `📢 *ब्रेकिंग न्यूज़ वाला* | *${district}*\n\n🔴 *${headline}*\n\n${summary}\n\n📲 पढ़ें: ${articleUrl || 'https://breakingnewswala.in'}`,
        forwardableText: `${headline} - विस्तृत अपडेट ब्रेकिंग न्यूज़ वाला पर।`
      },
      youtube: parsed.youtube || {
        communityPost: `${headline}\n\n${summary}\n\nअपनी राय कमेंट में बताएं।`,
        shortDescription: `${headline} | ग्राउंड रिपोर्ट | ब्रेकिंग न्यूज़ वाला`
      },
      provider: response.provider,
      model: response.model,
      executionTimeMs: response.executionTimeMs
    }
  };
}

function fallbackSocialParser(headline, summary, district, url) {
  const link = url || 'https://breakingnewswala.in';
  return {
    facebook: {
      text: `${headline}\n\n${district}: ${summary}\n\nसटीक व निष्पक्ष समाचार के लिए बने रहें ब्रेकिंग न्यूज़ वाला के साथ।`,
      callToAction: `पढ़ें: ${link}`,
      hashtags: [`#${district.replace(/\s+/g, '')}News`, '#MadhyaPradesh', '#BreakingNewsWala']
    },
    instagram: {
      caption: `🔴 ${headline}\n\n${summary}\n\nखबर पर अपनी प्रतिक्रिया नीचे दें।`,
      hashtags: ['#BreakingNewsWala', '#MPNews', '#GroundReport'],
      carouselSlideSuggestions: ['ताज़ा खबर', 'तथ्यों की पड़ताल', 'प्रशासन का रुख']
    },
    xTwitter: {
      tweet: `🔴 ${headline.slice(0, 180)}\n\nपूरा ब्यौरा पढ़ें: ${link} #${district.replace(/\s+/g, '')}`,
      characterCount: 200,
      threadStarter: true
    },
    whatsapp: {
      bulletin: `📢 *ब्रेकिंग न्यूज़ वाला* | *${district}*\n\n🔴 *${headline}*\n\n🔹 ${summary}\n\n📲 *पूरा विवरण:* ${link}\n\n_कृपया साझा करें_`,
      forwardableText: `${headline} - ताज़ा समाचार`
    },
    youtube: {
      communityPost: `${headline} पर विशेष कवरेज। क्या है पूरा मामला? जानिए ब्रेकिंग न्यूज़ वाला पर।`,
      shortDescription: `${headline} | ${district} ग्राउंड रिपोर्ट`
    }
  };
}

