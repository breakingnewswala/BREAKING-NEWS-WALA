'use client';

import React, { useEffect } from 'react';
import { dispatchTelemetryEvent } from '../lib/api';

interface AnalyticsBeaconProps {
  eventName?: string;
  articleId?: string;
  categoryId?: string;
  locationId?: string;
  slug?: string;
}

export const AnalyticsBeacon: React.FC<AnalyticsBeaconProps> = ({
  eventName = 'page_viewed',
  articleId,
  categoryId,
  locationId,
  slug,
}) => {
  useEffect(() => {
    // Dispatch initial view event
    dispatchTelemetryEvent({
      event_name: eventName,
      properties: {
        article_id: articleId,
        category_id: categoryId,
        location_id: locationId,
        slug,
        referrer: typeof document !== 'undefined' ? document.referrer : '',
        url: typeof window !== 'undefined' ? window.location.href : '',
      },
    });

    // Optional: track reading completion on 30s dwell
    const timer = setTimeout(() => {
      if (articleId) {
        dispatchTelemetryEvent({
          event_name: 'article_read_30s',
          properties: {
            article_id: articleId,
            slug,
          },
        });
      }
    }, 30000);

    return () => clearTimeout(timer);
  }, [eventName, articleId, categoryId, locationId, slug]);

  return null;
};

export default AnalyticsBeacon;

