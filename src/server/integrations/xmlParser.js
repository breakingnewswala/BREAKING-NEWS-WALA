/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Safe XML Parser & Feed Sanitizer
 * Grounded in docs/15-Security.md and docs/20-Integrations.md
 * Protects against XML External Entity (XXE) injection, entity expansion bombs,
 * and malicious embedded scripts/HTML.
 */

export class SafeXmlParser {
  static MAX_FEED_BYTES = 5 * 1024 * 1024; // 5 MB ceiling

  /**
   * Sanitizes HTML strings by stripping scripts, event handlers, and dangerous tags.
   */
  static sanitizeHtml(html) {
    if (!html) return '';
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<\/?(iframe|object|embed|applet|form|input|button|link|meta)[^>]*>/gi, '')
      .replace(/\s+on[a-z]+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '')
      .replace(/(href|src)\s*=\s*(?:'javascript:[^']*'|"javascript:[^"]*"|'data:[^']*'|"data:[^"]*")/gi, '$1="#"')
      .trim();
  }

  /**
   * Converts HTML text to clean plain text.
   */
  static htmlToPlainText(html) {
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
   * @param {string} rawXml
   * @returns {{ title: string, description: string, link: string, items: Array }}
   */
  static parseFeed(rawXml) {
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

  static parseRss2Feed(xml) {
    const channelMatch = xml.match(/<channel[\s\S]*?<\/channel>/i);
    const channelXml = channelMatch ? channelMatch[0] : xml;

    const channelTitle = this.extractTagContent(channelXml, 'title') || 'RSS Wire Feed';
    const channelDesc = this.extractTagContent(channelXml, 'description') || '';
    const channelLink = this.extractTagContent(channelXml, 'link') || '';

    const items = [];
    const itemRegex = /<item[\s\S]*?<\/item>/gi;
    let match;

    while ((match = itemRegex.exec(xml)) !== null) {
      const itemXml = match[0];
      const title = this.htmlToPlainText(this.extractTagContent(itemXml, 'title') || 'Untitled');
      const rawLink = this.extractTagContent(itemXml, 'link') || '';
      const link = this.cleanUrl(rawLink);
      const guid = this.extractTagContent(itemXml, 'guid') || link || title;
      const rawDescription = this.extractTagContent(itemXml, 'description') || '';
      const description = this.htmlToPlainText(rawDescription);
      const author = this.extractTagContent(itemXml, 'author') || this.extractTagContent(itemXml, 'dc:creator') || '';
      const pubDate = this.extractTagContent(itemXml, 'pubDate') || this.extractTagContent(itemXml, 'dc:date');
      const categories = this.extractAllTagContents(itemXml, 'category');

      // Media enclosures
      const mediaUrls = [];
      const enclosureRegex = /<enclosure[^>]+url=["']([^"']+)["']/gi;
      let encMatch;
      while ((encMatch = enclosureRegex.exec(itemXml)) !== null) {
        mediaUrls.push(encMatch[1]);
      }

      items.push({
        guid,
        title,
        link,
        description,
        content: this.sanitizeHtml(rawDescription),
        author,
        publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        categories,
        mediaUrls,
      });
    }

    return {
      title: channelTitle,
      description: channelDesc,
      link: channelLink,
      items,
    };
  }

  static parseAtomFeed(xml) {
    const feedTitle = this.extractTagContent(xml, 'title') || 'Atom Wire Feed';
    const feedSubtitle = this.extractTagContent(xml, 'subtitle') || '';
    const feedLinkMatch = xml.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*rel=["']alternate["']/i) ||
      xml.match(/<link\b[^>]*href=["']([^"']+)["']/i);
    const feedLink = feedLinkMatch ? feedLinkMatch[1] : '';

    const items = [];
    const entryRegex = /<entry[\s\S]*?<\/entry>/gi;
    let match;

    while ((match = entryRegex.exec(xml)) !== null) {
      const entryXml = match[0];
      const title = this.htmlToPlainText(this.extractTagContent(entryXml, 'title') || 'Untitled');
      const linkMatch = entryXml.match(/<link\b[^>]*href=["']([^"']+)["']/i);
      const link = linkMatch ? this.cleanUrl(linkMatch[1]) : '';
      const id = this.extractTagContent(entryXml, 'id') || link || title;
      const rawSummary = this.extractTagContent(entryXml, 'summary') || this.extractTagContent(entryXml, 'content') || '';
      const summary = this.htmlToPlainText(rawSummary);
      const authorMatch = entryXml.match(/<author[\s\S]*?<name>([\s\S]*?)<\/name>/i);
      const author = authorMatch ? authorMatch[1].trim() : '';
      const published = this.extractTagContent(entryXml, 'published') || this.extractTagContent(entryXml, 'updated');

      items.push({
        guid: id,
        title,
        link,
        description: summary,
        content: this.sanitizeHtml(rawSummary),
        author,
        publishedAt: published ? new Date(published).toISOString() : new Date().toISOString(),
        categories: [],
        mediaUrls: [],
      });
    }

    return {
      title: feedTitle,
      description: feedSubtitle,
      link: feedLink,
      items,
    };
  }

  static extractTagContent(xml, tagName) {
    const cdataRegex = new RegExp(`<${tagName}\\b[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tagName}>`, 'i');
    const cdataMatch = xml.match(cdataRegex);
    if (cdataMatch) return cdataMatch[1].trim();

    const normalRegex = new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
    const normalMatch = xml.match(normalRegex);
    return normalMatch ? normalMatch[1].trim() : null;
  }

  static extractAllTagContents(xml, tagName) {
    const results = [];
    const regex = new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'gi');
    let match;
    while ((match = regex.exec(xml)) !== null) {
      const val = match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1').trim();
      if (val) results.push(val);
    }
    return results;
  }

  static cleanUrl(url) {
    if (!url) return '';
    return url.replace(/&amp;/g, '&').trim();
  }
}

