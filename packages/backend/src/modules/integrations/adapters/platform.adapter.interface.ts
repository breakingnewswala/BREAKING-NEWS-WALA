/**
 * BREAKING NEWS WALA — Social Media Platform Adapter Interface
 * Grounded in docs/20-Integrations.md (Area J) and docs/13-API.md
 */

import {
  PlatformPublishingConstraints,
  SocialAccountItem,
  SocialPlatform,
} from '@bnw/types';
import {
  AccountHealthResult,
  PreparedSocialContent,
  PublishResult,
  ValidationResult,
} from '../types';

export interface IPlatformAdapter {
  readonly platform: SocialPlatform;
  readonly displayName: string;
  readonly docsUrl: string;
  readonly isOauthSupported: boolean;

  getValidationConstraints(): PlatformPublishingConstraints;
  validateContent(content: PreparedSocialContent): ValidationResult;
  publishPost(account: SocialAccountItem, content: PreparedSocialContent): Promise<PublishResult>;
  checkAccountHealth(account: SocialAccountItem): Promise<AccountHealthResult>;
}

