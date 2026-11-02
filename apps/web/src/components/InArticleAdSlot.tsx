'use client';

import React from 'react';
import { AdSlot } from './ads/AdSlot';

interface InArticleAdSlotProps {
  slotId?: string;
  className?: string;
}

export const InArticleAdSlot: React.FC<InArticleAdSlotProps> = ({
  className = '',
}) => {
  return (
    <div className={`my-6 ${className}`}>
      <AdSlot
        slotCode="article_body_mpu"
        reserveHeight={280}
        className="max-w-[340px]"
      />
    </div>
  );
};

export default InArticleAdSlot;
