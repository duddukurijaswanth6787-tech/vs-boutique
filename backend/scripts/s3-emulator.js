const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 9099;
const STORAGE_DIR = path.join(__dirname, '..', 'storage', 's3-emulator');

// Ensure storage dir exists
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

const server = http.createServer((req, res) => {
  // Allow all CORS requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Parse path (strip query params)
  const urlObj = new URL(req.url, `http://${req.headers.host}`);
  const pathname = decodeURIComponent(urlObj.pathname);

  // Path format: /bucket-name/key-name...
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length < 2) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('Bad Request: Missing bucket or key');
    return;
  }

  const bucket = parts[0];
  const key = parts.slice(1).join('/');
  const filePath = path.join(STORAGE_DIR, bucket, key);

  console.log(`[S3 Emulator] ${req.method} /${bucket}/${key}`);

  if (req.method === 'PUT') {
    // Ensure parent directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const fileStream = fs.createWriteStream(filePath);
    req.pipe(fileStream);

    req.on('end', () => {
      res.writeHead(200, { 'Content-Type': 'application/xml' });
      res.end('<PutObjectResult></PutObjectResult>');
    });

    req.on('error', (err) => {
      console.error('[S3 Emulator] PUT error:', err);
      res.writeHead(500);
      res.end();
    });
  } else if (req.method === 'HEAD') {
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      res.writeHead(200, {
        'Content-Length': stats.size,
        'Content-Type': 'application/octet-stream',
      });
      res.end();
    } else {
      res.writeHead(404);
      res.end();
    }
  } else if (req.method === 'GET') {
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      res.writeHead(200, {
        'Content-Length': stats.size,
        'Content-Type': 'application/octet-stream',
      });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  } else if (req.method === 'DELETE') {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.writeHead(204);
      res.end();
    } else {
      res.writeHead(204); // S3 returns success even if already deleted
      res.end();
    }
  } else {
    res.writeHead(405);
    res.end('Method Not Allowed');
  }
});

server.listen(PORT, () => {
  console.log(`[S3 Emulator] Mock AWS S3 service active on port ${PORT}`);
});
