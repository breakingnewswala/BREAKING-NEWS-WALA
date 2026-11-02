/**
 * BREAKING NEWS WALA — SEO Domain Types
 * Grounded in docs/SEO.md and docs/13-API.md.
 */

export type {
  ArticleSeoMetadataItem,
  UpdateArticleSeoDto,
  SeoValidationResult,
  SearchConsoleIntegrationStatus,
} from '@bnw/types';

export interface SeoPreviews {
  googleSearch: {
    title: string;
    url: string;
    description: string;
  };
  openGraph: {
    title: string;
    description: string;
    imageUrl: string;
    siteName: string;
    url: string;
  };
  twitterCard: {
    card: string;
    title: string;
    description: string;
    imageUrl: string;
  };
}

export interface SitemapStatusResult {
  totalPublishedArticles: number;
  sitemapIndexUrl: string;
  newsSitemapUrl: string;
  lastGeneratedAt: string;
  isCompliantWithGoogleNews: boolean;
}
