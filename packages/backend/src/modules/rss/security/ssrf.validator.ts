/**
 * BREAKING NEWS WALA — SSRF Protection & Feed URL Security Validator
 * Grounded in docs/15-Security.md and docs/20-Integrations.md
 * Prevents Server-Side Request Forgery against cloud metadata, loopback, and internal networks.
 */

import { URL } from 'url';

export interface SsrfValidationResult {
  isSafe: boolean;
  reason?: string;
  normalizedUrl?: string;
  hostname?: string;
  protocol?: string;
  port?: number;
}

// Blocked private IPv4 ranges
const PRIVATE_IPV4_RANGES = [
  { start: ipToLong('127.0.0.0'), end: ipToLong('127.255.255.255'), name: 'Loopback (127.0.0.0/8)' },
  { start: ipToLong('10.0.0.0'), end: ipToLong('10.255.255.255'), name: 'Private Class A (10.0.0.0/8)' },
  { start: ipToLong('172.16.0.0'), end: ipToLong('172.31.255.255'), name: 'Private Class B (172.16.0.0/12)' },
  { start: ipToLong('192.168.0.0'), end: ipToLong('192.168.255.255'), name: 'Private Class C (192.168.0.0/16)' },
  { start: ipToLong('169.254.0.0'), end: ipToLong('169.254.255.255'), name: 'Link-Local / Cloud Metadata (169.254.0.0/16)' },
  { start: ipToLong('0.0.0.0'), end: ipToLong('0.255.255.255'), name: 'Current Network (0.0.0.0/8)' },
  { start: ipToLong('224.0.0.0'), end: ipToLong('239.255.255.255'), name: 'Multicast (224.0.0.0/4)' },
  { start: ipToLong('240.0.0.0'), end: ipToLong('255.255.255.255'), name: 'Reserved (240.0.0.0/4)' },
];

function ipToLong(ip: string): number {
  return ip
    .split('.')
    .reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

function isIpv4(host: string): boolean {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(host);
}

function isIpv6(host: string): boolean {
  return host.includes(':');
}

export class SsrfValidator {
  private static readonly ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);
  private static readonly BLOCKED_HOSTNAMES = new Set([
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    '::1',
    'metadata.google.internal',
    '169.254.169.254',
    'instance-data',
  ]);

  private static readonly ALLOWED_PORTS = new Set([80, 443, 8080, 8443]);

  /**
   * Validates a URL against SSRF vulnerabilities before fetching.
   */
  public static validateUrl(rawUrl: string): SsrfValidationResult {
    if (!rawUrl || typeof rawUrl !== 'string') {
      return { isSafe: false, reason: 'URL string is empty or invalid' };
    }

    let parsed: URL;
    try {
      parsed = new URL(rawUrl.trim());
    } catch {
      return { isSafe: false, reason: 'Malformed URL format' };
    }

    // 1. Protocol check
    if (!this.ALLOWED_PROTOCOLS.has(parsed.protocol)) {
      return {
        isSafe: false,
        reason: `Disallowed protocol "${parsed.protocol}". Only HTTP and HTTPS are permitted.`,
      };
    }

    // 2. Disallow credentials in URL (e.g. http://user:pass@example.com)
    if (parsed.username || parsed.password) {
      return {
        isSafe: false,
        reason: 'Embedded user credentials in feed URLs are forbidden.',
      };
    }

    const hostname = parsed.hostname.toLowerCase();

    // 3. Blocked static hostnames
    if (this.BLOCKED_HOSTNAMES.has(hostname)) {
      return {
        isSafe: false,
        reason: `Restricted hostname "${hostname}" is blocked (SSRF boundary).`,
      };
    }

    // 4. Blocked hostname suffixes
    if (
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal') ||
      hostname.endsWith('.corp') ||
      hostname.endsWith('.lan')
    ) {
      return {
        isSafe: false,
        reason: `Internal network domain "${hostname}" is blocked.`,
      };
    }

    // 5. Port check
    const port = parsed.port ? parseInt(parsed.port, 10) : parsed.protocol === 'https:' ? 443 : 80;
    if (!this.ALLOWED_PORTS.has(port)) {
      return {
        isSafe: false,
        reason: `Restricted port "${port}". Only ports 80, 443, 8080, 8443 are allowed.`,
      };
    }

    // 6. IPv4 address range validation
    if (isIpv4(hostname)) {
      const longIp = ipToLong(hostname);
      for (const range of PRIVATE_IPV4_RANGES) {
        if (longIp >= range.start && longIp <= range.end) {
          return {
            isSafe: false,
            reason: `Target IP ${hostname} belongs to private/restricted range: ${range.name}`,
          };
        }
      }
    }

    // 7. IPv6 address validation
    if (isIpv6(hostname)) {
      const cleanHost = hostname.replace(/[\[\]]/g, '');
      if (
        cleanHost === '::1' ||
        cleanHost === '::' ||
        cleanHost.startsWith('fe80:') ||
        cleanHost.startsWith('fc') ||
        cleanHost.startsWith('fd')
      ) {
        return {
          isSafe: false,
          reason: `Target IPv6 address ${cleanHost} is loopback or unique local address.`,
        };
      }
    }

    return {
      isSafe: true,
      normalizedUrl: parsed.toString(),
      hostname,
      protocol: parsed.protocol,
      port,
    };
  }
}

