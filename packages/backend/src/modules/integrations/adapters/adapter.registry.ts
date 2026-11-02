/**
 * BREAKING NEWS WALA — Social Platform Adapter Registry
 * Grounded in docs/20-Integrations.md, docs/19-API-Pool.md
 */

import { SocialPlatform } from '@bnw/types';
import { IPlatformAdapter } from './platform.adapter.interface';
import { FacebookAdapter } from './facebook.adapter';
import { InstagramAdapter } from './instagram.adapter';
import { YouTubeAdapter } from './youtube.adapter';
import { XAdapter } from './x.adapter';
import { LinkedInAdapter } from './linkedin.adapter';
import { TelegramAdapter } from './telegram.adapter';

export class AdapterRegistry {
  private static instance: AdapterRegistry;
  private adapters: Map<SocialPlatform, IPlatformAdapter> = new Map();

  private constructor() {
    this.register(new FacebookAdapter());
    this.register(new InstagramAdapter());
    this.register(new YouTubeAdapter());
    this.register(new XAdapter());
    this.register(new LinkedInAdapter());
    this.register(new TelegramAdapter());
  }

  public static getInstance(): AdapterRegistry {
    if (!AdapterRegistry.instance) {
      AdapterRegistry.instance = new AdapterRegistry();
    }
    return AdapterRegistry.instance;
  }

  public register(adapter: IPlatformAdapter): void {
    this.adapters.set(adapter.platform, adapter);
  }

  public get(platform: SocialPlatform): IPlatformAdapter | undefined {
    return this.adapters.get(platform);
  }

  public getAll(): IPlatformAdapter[] {
    return Array.from(this.adapters.values());
  }
}

