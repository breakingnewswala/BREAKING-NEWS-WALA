/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * SSRF Protection & URL Security Validator
 * Grounded in docs/15-Security.md and docs/20-Integrations.md
 * Prevents Server-Side Request Forgery against cloud metadata, loopback, and private internal networks.
 */

import { URL } from 'node:url';

function ipToLong(ip) {
  return ip
    .split('.')
    .reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

function isIpv4(host) {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(host);
}

function isIpv6(host) {
  return host.includes(':');
}

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

export class SsrfValidator {
  static ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);
  static BLOCKED_HOSTNAMES = new Set([
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    '::1',
    'metadata.google.internal',
    '169.254.169.254',
    'instance-data',
  ]);
  static ALLOWED_PORTS = new Set([80, 443, 8080, 8443]);

  /**
   * Validates a URL against SSRF vulnerabilities before fetching.
   * @param {string} rawUrl
   * @returns {{ isSafe: boolean, reason?: string, normalizedUrl?: string, hostname?: string }}
   */
  static validateUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') {
      return { isSafe: false, reason: 'URL string is empty or invalid' };
    }

    let parsed;
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

    // 2. Disallow credentials in URL
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

    // 4. Blocked hostname suffixes (e.g. .local, .internal, .lan)
    if (
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal') ||
      hostname.endsWith('.lan') ||
      hostname.endsWith('.corp')
    ) {
      return {
        isSafe: false,
        reason: `Internal network top-level domain for "${hostname}" is blocked.`,
      };
    }

    // 5. Port check
    if (parsed.port) {
      const portNum = parseInt(parsed.port, 10);
      if (!this.ALLOWED_PORTS.has(portNum)) {
        return {
          isSafe: false,
          reason: `Port ${portNum} is restricted. Only standard web ports (80, 443, 8080, 8443) are allowed.`,
        };
      }
    }

    // 6. IPv4 address range verification
    if (isIpv4(hostname)) {
      const longIp = ipToLong(hostname);
      for (const range of PRIVATE_IPV4_RANGES) {
        if (longIp >= range.start && longIp <= range.end) {
          return {
            isSafe: false,
            reason: `Target IP address ${hostname} belongs to restricted range: ${range.name}`,
          };
        }
      }
    }

    // 7. IPv6 loopback / link-local verification
    if (isIpv6(hostname)) {
      const cleanIpv6 = hostname.replace(/^\[|\]$/g, '').toLowerCase();
      if (
        cleanIpv6 === '::1' ||
        cleanIpv6 === '0:0:0:0:0:0:0:1' ||
        cleanIpv6.startsWith('fe80:') ||
        cleanIpv6.startsWith('fc00:') ||
        cleanIpv6.startsWith('fd00:')
      ) {
        return {
          isSafe: false,
          reason: `IPv6 loopback or private site-local address "${hostname}" is blocked.`,
        };
      }
    }

    return {
      isSafe: true,
      normalizedUrl: parsed.toString(),
      hostname,
      protocol: parsed.protocol,
    };
  }
}

