const http = require('http');
const path = require('path');
const fs = require('fs');
const planner = require('../quickapp/hello_quickapp/src/pages/index/planner.js');
const { createMimoPlan } = require('./mimo-client');

const root = path.resolve(__dirname, '..');
const previewRoot = path.join(root, 'web-preview');
const port = Number(process.env.PORT || 5178);

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
};

function send(res, code, body, type) {
  res.writeHead(code, { 'Content-Type': type || 'text/plain; charset=utf-8' });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => resolve(data));
  });
}

function serveFile(res, urlPath) {
  const clean = urlPath === '/' ? '/index.html' : urlPath;
  const filePath = path.normalize(path.join(previewRoot, clean));
  if (!filePath.startsWith(previewRoot)) {
    send(res, 403, 'Forbidden');
    return;
  }
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    send(res, 404, 'Not found');
    return;
  }
  send(res, 200, fs.readFileSync(filePath), types[path.extname(filePath)] || 'text/plain');
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (url.pathname === '/api/plan' && req.method === 'POST') {
    const payload = JSON.parse((await readBody(req)) || '{}');
    let plan;
    if (process.env.MIMO_API_KEY) {
      try {
        plan = await createMimoPlan(payload, {
          apiKey: process.env.MIMO_API_KEY,
          apiUrl: process.env.MIMO_API_URL,
          model: process.env.MIMO_MODEL,
          timeoutMs: Number(process.env.MIMO_TIMEOUT_MS || 12000),
        });
      } catch (error) {
        console.warn(`MiMo unavailable, using local fallback: ${error.message}`);
        plan = planner.createPlan(payload);
        plan.source = 'local-fallback';
      }
    } else {
      plan = planner.createPlan(payload);
      plan.source = 'local';
    }
    send(res, 200, JSON.stringify(plan), 'application/json; charset=utf-8');
    return;
  }
  serveFile(res, url.pathname);
});

server.listen(port, () => {
  console.log(`VelaPlan preview: http://localhost:${port}`);
});
