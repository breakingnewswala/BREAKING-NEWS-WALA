import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleHealthCheck, handleApiRequest, adapter } from './src/server/apiEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, 'dist');
const INDEX_HTML = path.join(DIST_DIR, 'index.html');

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.mjs': 'application/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=UTF-8',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
};

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = '0.0.0.0';

const server = http.createServer((req, res) => {
  let parsedUrl;
  try {
    parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  } catch {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=UTF-8' });
    res.end('Bad Request');
    return;
  }

  const pathname = parsedUrl.pathname;

  // 1. Machine-readable health check endpoint (Section 13)
  if (
    pathname === '/healthz' || pathname === '/healthz/' ||
    pathname === '/health' || pathname === '/health/' ||
    pathname === '/api/health' || pathname === '/api/health/' ||
    pathname === '/api/healthz' || pathname === '/api/healthz/'
  ) {
    return handleHealthCheck(req, res);
  }

  // 2. Central REST API routing ingress (Section 4 & 5)
  // Ensure that no /api/* route ever silently falls through to the SPA HTML fallback
  if (pathname === '/api' || pathname.startsWith('/api/')) {
    if (pathname === '/api/v1' || pathname.startsWith('/api/v1/')) {
      return handleApiRequest(req, res);
    }
    res.writeHead(404, {
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
    });
    res.end(JSON.stringify({
      success: false,
      error: {
        code: 'ERR_API_NOT_FOUND',
        message: `API endpoint "${req.method} ${pathname}" not found. Central REST contracts are mounted at /api/v1/*`
      }
    }));
    return;
  }

  // 3. Static asset and SPA HTML serving
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Content-Type': 'text/plain; charset=UTF-8' });
    res.end('Method Not Allowed');
    return;
  }

  const rawUrl = req.url || '';
  let decodedRawUrl = '';
  try {
    decodedRawUrl = decodeURIComponent(rawUrl);
  } catch {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=UTF-8' });
    res.end('Bad Request');
    return;
  }

  let filePath = path.normalize(path.join(DIST_DIR, decodeURIComponent(pathname)));

  // Security: prevent directory traversal outside DIST_DIR
  if (rawUrl.includes('..') || decodedRawUrl.includes('..') || !filePath.startsWith(DIST_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=UTF-8' });
    res.end('403 Forbidden');
    return;
  }

  const requestedExt = path.extname(pathname).toLowerCase();

  fs.stat(filePath, (err, stats) => {
    let targetPath = filePath;
    let isFallback = false;

    if (err || !stats.isFile()) {
      if (stats && stats.isDirectory()) {
        const dirIndex = path.join(filePath, 'index.html');
        if (fs.existsSync(dirIndex)) {
          targetPath = dirIndex;
        } else {
          targetPath = INDEX_HTML;
          isFallback = true;
        }
      } else {
        // If a specific static asset with a file extension was requested but does not exist, return 404
        if (requestedExt && requestedExt !== '.html') {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
          res.end('404 Not Found');
          return;
        }

        // SPA Fallback for client-side routing (extensionless routes like /epaper, /article/...)
        targetPath = INDEX_HTML;
        isFallback = true;
      }
    }

    const ext = path.extname(targetPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    const headers = {
      'Content-Type': contentType,
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    };

    if (isFallback || ext === '.html') {
      headers['Cache-Control'] = 'no-cache';
    } else if (targetPath.includes(`${path.sep}assets${path.sep}`)) {
      headers['Cache-Control'] = 'public, max-age=31536000, immutable';
    }

    if (req.method === 'HEAD') {
      res.writeHead(200, headers);
      res.end();
      return;
    }

    const stream = fs.createReadStream(targetPath);
    stream.on('open', () => {
      res.writeHead(200, headers);
      stream.pipe(res);
    });
    stream.on('error', () => {
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=UTF-8' });
        res.end('Internal Server Error');
      }
    });
  });
});

// Production startup validation guards
const isProduction = process.env.NODE_ENV === 'production';
if (isProduction && !fs.existsSync(INDEX_HTML)) {
  console.error(`[FATAL] Production build directory or index.html missing at ${INDEX_HTML}. Run 'npm run build' before starting production server.`);
  process.exit(1);
}

// Initialize persistence adapter if asynchronous initialization is supported
if (typeof adapter?.init === 'function') {
  try {
    await adapter.init();
    console.log(`[production] Persistence adapter initialized: ${adapter.getHealth?.().adapterType} (${adapter.getHealth?.().status})`);
  } catch (err) {
    console.warn('[production] Persistence adapter initialization deferred:', err.message);
  }
}

server.listen(PORT, HOST, () => {
  console.log(`[production] Server (PID: ${process.pid}) listening on http://${HOST}:${PORT}`);
  console.log(`[production] Serving static directory: ${DIST_DIR}`);
});

process.on('SIGTERM', () => {
  console.log('[production] Received SIGTERM, shutting down gracefully');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('[production] Received SIGINT, shutting down gracefully');
  server.close(() => process.exit(0));
});
