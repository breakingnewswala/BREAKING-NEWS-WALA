import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
};

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = '0.0.0.0';

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Content-Type': 'text/plain; charset=UTF-8' });
    res.end('Method Not Allowed');
    return;
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  } catch {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=UTF-8' });
    res.end('Bad Request');
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

  let pathname = decodeURIComponent(parsedUrl.pathname);
  let filePath = path.normalize(path.join(DIST_DIR, pathname));

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
