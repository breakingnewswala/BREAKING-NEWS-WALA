/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Master News to Graphic Extraction & Assembly Engine
 * 
 * Strict Invariants:
 * 1. Factual extraction only: never invent names, locations, statistics, or news facts.
 * 2. Pure factual transformation without changing original editorial intent.
 * 3. Fallback to default template when category does not have a custom match.
 */

import { ArticleItem, GraphicItem, GraphicTemplate, NewsToGraphicRequest } from '../types';
import { DEFAULT_GRAPHIC_TEMPLATES } from '../data/defaultTemplates';

export class NewsToGraphicEngine {
  /**
   * Maps an article category or keyword to the best matching GraphicTemplate.
   */
  public static selectBestTemplate(
    article: Partial<ArticleItem>,
    templates: GraphicTemplate[] = DEFAULT_GRAPHIC_TEMPLATES
  ): GraphicTemplate {
    if (article.isBreaking) {
      const breakingTpl = templates.find((t) => t.category === 'BREAKING');
      if (breakingTpl) return breakingTpl;
    }

    const cat = (article.categoryName || article.categoryId || '').toLowerCase();

    if (cat.includes('राजनीति') || cat.includes('politics')) {
      const match = templates.find((t) => t.category === 'POLITICS');
      if (match) return match;
    }
    if (cat.includes('अपराध') || cat.includes('crime') || cat.includes('कानून')) {
      const match = templates.find((t) => t.category === 'CRIME');
      if (match) return match;
    }
    if (cat.includes('प्रशासन') || cat.includes('योजना') || cat.includes('सरकार') || cat.includes('government')) {
      const match = templates.find((t) => t.category === 'GOVERNMENT');
      if (match) return match;
    }
    if (cat.includes('शिक्षा') || cat.includes('रोजगार') || cat.includes('education') || cat.includes('job')) {
      const match = templates.find((t) => t.category === 'EDUCATION');
      if (match) return match;
    }
    if (cat.includes('खेल') || cat.includes('sports')) {
      const match = templates.find((t) => t.category === 'SPORTS');
      if (match) return match;
    }
    if (cat.includes('व्यापार') || cat.includes('मंडी') || cat.includes('business')) {
      const match = templates.find((t) => t.category === 'BUSINESS');
      if (match) return match;
    }
    if (cat.includes('मौसम') || cat.includes('weather') || cat.includes('बारिश')) {
      const match = templates.find((t) => t.category === 'WEATHER');
      if (match) return match;
    }
    if (cat.includes('त्यौहार') || cat.includes('पर्व') || cat.includes('festival')) {
      const match = templates.find((t) => t.category === 'FESTIVAL');
      if (match) return match;
    }
    if (article.districtName && article.districtName !== 'मध्य प्रदेश') {
      const match = templates.find((t) => t.category === 'DISTRICT');
      if (match) return match;
    }

    // Default to Breaking or primary card
    return templates[0] || DEFAULT_GRAPHIC_TEMPLATES[0];
  }

  /**
   * Extracts clean, punchy graphic text from an article without fact alterations.
   */
  public static extractGraphicContent(article: Partial<ArticleItem>): {
    headline: string;
    subtext: string;
    district: string;
    category: string;
  } {
    // Clean and normalize headline
    let headline = (article.title || '').trim();
    if (headline.length > 120) {
      // Find sentence boundary or last word before 120
      const truncated = headline.slice(0, 115);
      const lastSpace = truncated.lastIndexOf(' ');
      headline = (lastSpace > 60 ? truncated.slice(0, lastSpace) : truncated) + '...';
    }

    // Extract first punchy sentence or summary for subtext
    let subtext = '';
    if (article.subheadline && article.subheadline.trim()) {
      subtext = article.subheadline.trim();
    } else if (article.summary && article.summary.trim()) {
      subtext = article.summary.trim();
    } else if (article.content && article.content.trim()) {
      const firstSentence = article.content.split(/[।.\n]/)[0];
      subtext = (firstSentence || article.content.slice(0, 100)).trim() + '।';
    }

    if (subtext.length > 140) {
      subtext = subtext.slice(0, 135) + '...';
    }

    const district = article.districtName || 'मध्य प्रदेश';
    const category = article.categoryName || 'विशेष समाचार';

    return { headline, subtext, district, category };
  }

  /**
   * Generates a complete draft GraphicItem from an ArticleItem.
   */
  public static generateFromArticle(
    article: ArticleItem,
    request: Partial<NewsToGraphicRequest> = {},
    user?: { id?: string; name?: string; role?: string }
  ): GraphicItem {
    const template = this.selectBestTemplate(article);
    const content = this.extractGraphicContent(article);

    const now = new Date().toISOString();
    const graphicId = `gfx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const graphic: GraphicItem = {
      id: graphicId,
      title: `${article.districtName || 'मप्र'}: ${content.headline.slice(0, 40)}`,
      headline: request.customHeadline || content.headline,
      subtext: request.customSubtext || content.subtext,
      templateId: template.id,
      templateTitle: template.title,
      aspectRatio: request.aspectRatio || template.aspectRatio,
      articleId: article.id,
      articleTitle: article.title,
      districtName: request.customDistrict || content.district,
      categoryName: request.customCategory || content.category,
      authorName: request.includeReporter !== false ? article.authorName : undefined,
      authorId: article.authorId,
      isBreaking: Boolean(article.isBreaking),
      imageUrl: request.includeImage !== false ? article.featuredImage : undefined,
      themeColor: template.themeColor,
      backgroundStyle: template.backgroundStyle,
      status: 'DRAFT',
      version: 1,
      layers: template.layers ? JSON.parse(JSON.stringify(template.layers)) : [],
      createdBy: user?.id || 'usr-desk',
      createdByName: user?.name || 'संपादकीय डेस्क',
      createdByRole: user?.role || 'EDITOR',
      createdAt: now,
      updatedAt: now,
    };

    return graphic;
  }
}

