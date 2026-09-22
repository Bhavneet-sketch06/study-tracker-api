// Local dev server: serves the api/ functions and the public/ folder the way
// Vercel would.
//
// Usage: npm run dev   ->   http://localhost:3000
//
// This file is for your laptop only. Vercel never runs it: on Vercel each
// file in api/ becomes its own serverless function, and public/ is served
// as static files automatically.
require('dotenv').config({ path: '.env.local' });

const http = require('http');
const fs = require('fs');
const path = require('path');

const routes = {
  '/api/hello': require('./api/hello.js'),
  '/api/today-study': require('./api/today-study.js'),
  '/api/tasks': require('./api/tasks.js'),
  '/api/add-task': require('./api/add-task.js'),
};

const PUBLIC_DIR = path.join(__dirname, 'public');
const PORT = process.env.PORT || 3000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

// Vercel hands the function an already-parsed req.body. Do the same here.
function readJsonBody(req) {
  return new Promise((resolve) => {
    if (req.method === 'GET' || req.method === 'HEAD') {
      resolve(undefined);
      return;
    }
    let raw = '';
    req.on('data', (chunk) => (raw += chunk));
    req.on('end', () => {
      if (!raw) {
        resolve(undefined);
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (e) {
        resolve(undefined); // endpoints validate and return 400 themselves
      }
    });
  });
}

function serveStatic(urlPath, res) {
  const relative = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
  const filePath = path.join(PUBLIC_DIR, relative);

  // Keep the request inside public/, so ../ cannot escape it.
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.statusCode = 403;
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Not Found', available: Object.keys(routes) }, null, 2));
      return;
    }
    res.statusCode = 200;
    res.setHeader('Content-Type', MIME[path.extname(filePath)] || 'application/octet-stream');
    res.end(data);
  });
}

http
  .createServer(async (req, res) => {
    // Minimal shims for the helpers Vercel adds to the response object.
    res.status = (code) => {
      res.statusCode = code;
      return res;
    };
    res.json = (body) => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(body, null, 2));
    };

    const urlPath = req.url.split('?')[0];
    const handler = routes[urlPath];

    if (handler) {
      try {
        req.body = await readJsonBody(req);
        await handler(req, res);
      } catch (err) {
        res.status(500).json({ error: 'Handler crashed', details: err.message });
      }
      return;
    }

    serveStatic(urlPath, res);
  })
  .listen(PORT, () => {
    console.log(`Study Tracker running on http://localhost:${PORT}`);
    Object.keys(routes).forEach((p) => console.log(`  http://localhost:${PORT}${p}`));
  });
