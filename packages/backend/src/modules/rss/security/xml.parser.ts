/**
 * BREAKING NEWS WALA — Safe XML Parser & Feed Sanitizer
 * Grounded in docs/15-Security.md and docs/20-Integrations.md
 * Protects against XML External Entity (XXE) injection, XML entity expansion bombs,
 * and malicious embedded scripts/HTML.
 */

export interface ParsedFeedItem {
  guid: string;
  title: string;
  link: string;
  description: string;
  content?: string;
  author?: string;
  publishedAt?: string;
  categories: string[];
  mediaUrls: string[];
}

export interface ParsedFeedResult {
  title: string;
  description: string;
  link: string;
  language?: string;
  items: ParsedFeedItem[];
}

export class SafeXmlParser {
  private static readonly MAX_FEED_BYTES = 5 * 1024 * 1024; // 5 MB ceiling

  /**
   * Sanitizes HTML strings by stripping scripts, event handlers, and dangerous tags.
   */
  public static sanitizeHtml(html: string): string {
    if (!html) return '';
    return html
      // Remove <script> tags and content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Remove <style> tags and content
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      // Remove <iframe>, <object>, <embed>, <applet>, <form>, <link>
      .replace(/<\/?(iframe|object|embed|applet|form|input|button|link|meta)[^>]*>/gi, '')
      // Remove inline event handlers (onload, onerror, onclick, etc.)
      .replace(/\s+on[a-z]+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '')
      // Remove javascript: and data: URIs in href or src
      .replace(/(href|src)\s*=\s*(?:'javascript:[^']*'|"javascript:[^"]*"|'data:[^']*'|"data:[^"]*")/gi, '$1="#"')
      .trim();
  }

  /**
   * Converts HTML text to clean plain text (useful for summaries and headlines).
   */
  public static htmlToPlainText(html: string): string {
    if (!html) return '';
    return html
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Parses raw XML/RSS/Atom content with strict XXE and bomb protections.
   */
  public static parseFeed(rawXml: string): ParsedFeedResult {
    if (!rawXml || typeof rawXml !== 'string') {
      throw new Error('Feed payload is empty or not a string');
    }

    // 1. Payload size check
    const byteLength = Buffer.byteLength(rawXml, 'utf8');
    if (byteLength > this.MAX_FEED_BYTES) {
      throw new Error(`Feed size (${byteLength} bytes) exceeds maximum allowable limit of 5MB`);
    }

    // 2. Strict XXE detection (Entity, System, Public, DTD expansion checks)
    if (
      /<!DOCTYPE\b[^>]*<!ENTITY/i.test(rawXml) ||
      /<!ENTITY\b[^>]*SYSTEM/i.test(rawXml) ||
      /<!ENTITY\b[^>]*PUBLIC/i.test(rawXml)
    ) {
      throw new Error('XXE Injection attempt blocked: External DTD/ENTITY declarations are forbidden');
    }

    // 3. Detect format: Atom vs RSS 2.0
    const isAtom = /<feed\b[^>]*>/i.test(rawXml);

    if (isAtom) {
      return this.parseAtomFeed(rawXml);
    } else {
      return this.parseRss2Feed(rawXml);
    }
  }

  private static parseRss2Feed(xml: string): ParsedFeedResult {
    const channelMatch = xml.match(/<channel\b[^>]*>([\s\S]*?)<\/channel>/i);
    const channelContent = (channelMatch && channelMatch[1]) ? channelMatch[1] : xml;

    const channelTitle = this.extractTag(channelContent, 'title') || 'Untitled RSS Feed';
    const channelDesc = this.extractTag(channelContent, 'description') || '';
    const channelLink = this.extractTag(channelContent, 'link') || '';
    const channelLang = this.extractTag(channelContent, 'language') || 'hi';

    const items: ParsedFeedItem[] = [];
    const itemRegex = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
    let itemMatch: RegExpExecArray | null;

    while ((itemMatch = itemRegex.exec(xml)) !== null) {
      const itemXml = itemMatch[1] || '';
      const title = this.htmlToPlainText(this.extractTag(itemXml, 'title') || 'Untitled');
      const link = this.extractTag(itemXml, 'link') || '';
      const guid = this.extractTag(itemXml, 'guid') || link || title;
      const rawDesc = this.extractTag(itemXml, 'description') || '';
      const rawContent = this.extractTag(itemXml, 'content:encoded') || rawDesc;
      const author = this.extractTag(itemXml, 'dc:creator') || this.extractTag(itemXml, 'author') || '';
      const pubDate = this.extractTag(itemXml, 'pubDate') || this.extractTag(itemXml, 'dc:date') || '';

      // Extract categories
      const categories: string[] = [];
      const catRegex = /<category\b[^>]*>([\s\S]*?)<\/category>/gi;
      let catMatch: RegExpExecArray | null;
      while ((catMatch = catRegex.exec(itemXml)) !== null) {
        const catName = this.htmlToPlainText(catMatch[1] || '');
        if (catName) categories.push(catName);
      }

      // Extract media/enclosure URLs
      const mediaUrls: string[] = [];
      const encRegex = /<enclosure\b[^>]*url=["']([^"']+)["']/gi;
      let encMatch: RegExpExecArray | null;
      while ((encMatch = encRegex.exec(itemXml)) !== null) {
        if (encMatch[1]) mediaUrls.push(encMatch[1]);
      }
      const mediaRegex = /<media:(content|thumbnail)\b[^>]*url=["']([^"']+)["']/gi;
      let mMatch: RegExpExecArray | null;
      while ((mMatch = mediaRegex.exec(itemXml)) !== null) {
        if (mMatch[2]) mediaUrls.push(mMatch[2]);
      }

      items.push({
        guid,
        title,
        link,
        description: this.sanitizeHtml(rawDesc),
        content: this.sanitizeHtml(rawContent),
        author,
        publishedAt: pubDate ? this.normalizeDate(pubDate) : new Date().toISOString(),
        categories,
        mediaUrls,
      });
    }

    return {
      title: this.htmlToPlainText(channelTitle),
      description: this.htmlToPlainText(channelDesc),
      link: channelLink,
      language: channelLang,
      items,
    };
  }

  private static parseAtomFeed(xml: string): ParsedFeedResult {
    const feedTitle = this.extractTag(xml, 'title') || 'Untitled Atom Feed';
    const feedSub = this.extractTag(xml, 'subtitle') || '';
    const feedLinkMatch = xml.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*rel=["']alternate["']|<link\b[^>]*href=["']([^"']+)["']/i);
    const feedLink = (feedLinkMatch ? feedLinkMatch[1] || feedLinkMatch[2] : '') || '';

    const items: ParsedFeedItem[] = [];
    const entryRegex = /<entry\b[^>]*>([\s\S]*?)<\/entry>/gi;
    let entryMatch: RegExpExecArray | null;

    while ((entryMatch = entryRegex.exec(xml)) !== null) {
      const entryXml = entryMatch[1] || '';
      const title = this.htmlToPlainText(this.extractTag(entryXml, 'title') || 'Untitled');
      const guid = this.extractTag(entryXml, 'id') || '';

      const linkMatch = entryXml.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*rel=["']alternate["']|<link\b[^>]*href=["']([^"']+)["']/i);
      const link = (linkMatch ? linkMatch[1] || linkMatch[2] : '') || '';

      const summary = this.extractTag(entryXml, 'summary') || '';
      const content = this.extractTag(entryXml, 'content') || summary;
      const author = this.extractTag(entryXml, 'name') || '';
      const pubDate = this.extractTag(entryXml, 'published') || this.extractTag(entryXml, 'updated') || '';

      const categories: string[] = [];
      const catRegex = /<category\b[^>]*term=["']([^"']+)["']/gi;
      let catMatch: RegExpExecArray | null;
      while ((catMatch = catRegex.exec(entryXml)) !== null) {
        if (catMatch[1]) categories.push(catMatch[1]);
      }

      items.push({
        guid: guid || link || title,
        title,
        link: link || guid,
        description: this.sanitizeHtml(summary),
        content: this.sanitizeHtml(content),
        author,
        publishedAt: pubDate ? this.normalizeDate(pubDate) : new Date().toISOString(),
        categories,
        mediaUrls: [],
      });
    }

    return {
      title: this.htmlToPlainText(feedTitle),
      description: this.htmlToPlainText(feedSub),
      link: feedLink,
      language: 'hi',
      items,
    };
  }

  private static extractTag(xml: string, tagName: string): string {
    // Matches <tag>content</tag> or <tag><![CDATA[content]]></tag>
    const regex = new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
    const match = xml.match(regex);
    if (!match || !match[1]) return '';

    let content = match[1].trim();
    // Strip CDATA wrapper if present
    const cdataMatch = content.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/i);
    if (cdataMatch && cdataMatch[1]) {
      return cdataMatch[1].trim();
    }
    return content;
  }

  private static normalizeDate(dateStr: string): string {
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return d.toISOString();
      }
    } catch {
      // Fallback to current UTC
    }
    return new Date().toISOString();
  }
}
