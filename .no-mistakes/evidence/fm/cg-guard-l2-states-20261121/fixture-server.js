// Disposable fixture server for this validation run: serves real model fixture
// photos to the browser so the file picker receives a genuine image File.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = process.argv[2];
const PORT = Number(process.argv[3] || 8311);

http
  .createServer((req, res) => {
    const name = path.basename(new URL(req.url, 'http://127.0.0.1').pathname);
    const file = path.join(ROOT, name);
    if (!file.startsWith(ROOT) || !fs.existsSync(file)) {
      res.writeHead(404, { 'Access-Control-Allow-Origin': '*' });
      res.end('not found');
      return;
    }
    const body = fs.readFileSync(file);
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': name.endsWith('.png') ? 'image/png' : 'image/jpeg',
      'Content-Length': body.length,
    });
    res.end(body);
  })
  .listen(PORT, '127.0.0.1', () => console.log(`fixture server on ${PORT} root ${ROOT}`));
