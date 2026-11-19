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

const portArgIdx = process.argv.indexOf('--port');
const cliPort = portArgIdx !== -1 ? parseInt(process.argv[portArgIdx + 1], 10) : NaN;
const envPort = (process.env.NGINX_PORT && process.env.PORT === process.env.NGINX_PORT)
  ? process.env.DEFAULT_APP_PORT
  : process.env.PORT;
const PORT = !Number.isNaN(cliPort)
  ? cliPort
  : parseInt(envPort || process.env.DEFAULT_APP_PORT || '3000', 10);
const HOST = '0.0.0.0';

console.log(`[server] BREAKING NEWS WALA initializing: PID=${process.pid}, NODE_ENV=${process.env.NODE_ENV || 'development'}, PORT=${PORT}, HOST=${HOST}`);

// FINDING 20-04: Block Firestore Emulator in Production
if (process.env.NODE_ENV === 'production' && process.env.FIRESTORE_EMULATOR_HOST) {
  console.error('[FATAL] FIRESTORE_EMULATOR_HOST is set while NODE_ENV === "production". Terminating startup to prevent accidental connection to a local emulator.');
  process.exit(1);
}

const isProduction = process.env.NODE_ENV === 'production';
const isDevMode = process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test';
let viteServer = null;

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

  // 2b. Serve uploaded media & rendered studio videos (/media/*) in both Dev & Production with Range support
  if (pathname.startsWith('/media/') && (req.method === 'GET' || req.method === 'HEAD')) {
    const mediaRoot = path.resolve(DIST_DIR, 'media');
    let decodedMediaPath = '';
    try {
      decodedMediaPath = decodeURIComponent(pathname.replace(/^\/media\//, ''));
    } catch {
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=UTF-8' });
      res.end('Bad Request');
      return;
    }

    if (decodedMediaPath.includes('..')) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=UTF-8' });
      res.end('403 Forbidden');
      return;
    }

    const mediaFilePath = path.resolve(mediaRoot, decodedMediaPath);
    if (!mediaFilePath.startsWith(mediaRoot + path.sep)) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=UTF-8' });
      res.end('403 Forbidden');
      return;
    }

    fs.stat(mediaFilePath, (err, stats) => {
      if (err || !stats.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
        res.end('404 Media Not Found');
        return;
      }

      const ext = path.extname(mediaFilePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      const totalSize = stats.size;
      const rangeHeader = req.headers.range;

      const baseHeaders = {
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'public, max-age=3600',
      };

      if (req.method === 'HEAD') {
        res.writeHead(200, { ...baseHeaders, 'Content-Length': totalSize });
        res.end();
        return;
      }

      if (rangeHeader && /^bytes=\d*-\d*$/.test(rangeHeader)) {
        const [startStr, endStr] = rangeHeader.replace(/^bytes=/, '').split('-');
        let start = startStr ? parseInt(startStr, 10) : 0;
        let end = endStr ? parseInt(endStr, 10) : totalSize - 1;
        if (Number.isNaN(start)) start = 0;
        if (Number.isNaN(end) || end >= totalSize) end = totalSize - 1;

        if (start > end || start >= totalSize) {
          res.writeHead(416, { 'Content-Range': `bytes */${totalSize}` });
          res.end();
          return;
        }

        const chunkSize = end - start + 1;
        res.writeHead(206, {
          ...baseHeaders,
          'Content-Range': `bytes ${start}-${end}/${totalSize}`,
          'Content-Length': chunkSize,
        });
        fs.createReadStream(mediaFilePath, { start, end }).pipe(res);
        return;
      }

      res.writeHead(200, { ...baseHeaders, 'Content-Length': totalSize });
      fs.createReadStream(mediaFilePath).pipe(res);
    });
    return;
  }

  // 3. Vite dev middleware in development mode (serves React SPA + TSX/Tailwind + /public)
  if (viteServer) {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    return viteServer.middlewares(req, res);
  }

  // 4. Static asset and SPA HTML serving (production / test)
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
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
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
if (isProduction && !fs.existsSync(INDEX_HTML)) {
  console.warn(`[server] WARNING: Production build directory or index.html missing at ${INDEX_HTML}. Ensure 'npm run build' has completed.`);
}

server.on('error', (err) => {
  console.error('[server] HTTP server error:', err?.message || err);
  if (err?.code === 'EADDRINUSE' || err?.code === 'EACCES') {
    process.exit(1);
  }
});

// Production / test startup: bind port immediately so Cloud Run container health checks pass instantly
if (!isDevMode) {
  server.listen(PORT, HOST, () => {
    console.log(`[server] Server (PID: ${process.pid}) listening on http://${HOST}:${PORT}`);
    console.log(`[server] Serving static directory: ${DIST_DIR}`);
  });
}

// Initialize persistence adapter if asynchronous initialization is supported
if (typeof adapter?.init === 'function') {
  try {
    await adapter.init();
    console.log(`[server] Persistence adapter initialized: ${adapter.getHealth?.().adapterType} (${adapter.getHealth?.().status})`);
  } catch (err) {
    console.warn('[server] Persistence adapter initialization deferred:', err.message);
  }
}

// Initialize Vite middleware in development mode before listening
if (isDevMode) {
  if (!fs.existsSync(path.join(__dirname, 'node_modules', 'vite'))) {
    console.log('[server] node_modules/vite missing; running npm install...');
    const { execSync } = await import('node:child_process');
    execSync('npm install --no-audit --no-fund', { cwd: __dirname, stdio: 'inherit' });
  }
  const { createServer: createViteServer } = await import('vite');
  viteServer = await createViteServer({
    server: {
      middlewareMode: true,
      allowedHosts: true,
      hmr: false,
      watch: {
        ignored: [
          '**/app/**',
          '**/.gradle/**',
          '**/.kotlin/**',
          '**/.build-outputs/**',
          '**/gradle/**',
          '**/.data/**',
          '**/docs/**',
          '**/dist/**',
          '**/tests/**',
          '**/.aistudio/**',
        ],
      },
    },
    optimizeDeps: {
      entries: ['index.html', 'src/main.tsx'],
    },
    appType: 'spa',
  });
  viteServer.watcher?.on?.('error', (err) => {
    console.warn('[server] Vite watcher warning (ignored):', err?.message || err);
  });
  console.log('[server] Vite development middleware initialized');

  server.listen(PORT, HOST, () => {
    console.log(`[server] Server (PID: ${process.pid}) listening on http://${HOST}:${PORT}`);
    console.log(`[server] Serving static directory: ${DIST_DIR}`);
  });
}

const shutdown = async (signal) => {
  console.log(`[server] Received ${signal}, shutting down gracefully`);
  if (viteServer) {
    try {
      await viteServer.close();
    } catch {
      // ignore
    }
  }
  server.close(() => process.exit(0));
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
