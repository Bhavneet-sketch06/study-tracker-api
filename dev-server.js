// Local dev server: serves the files in api/ the way Vercel would.
// Usage: npm run dev
//   http://localhost:3000/api/hello
//   http://localhost:3000/api/today-study
//
// This file is for your laptop only -- Vercel never runs it.
require('dotenv').config({ path: '.env.local' });

const http = require('http');

const routes = {
  '/api/hello': require('./api/hello.js'),
  '/api/today-study': require('./api/today-study.js'),
};

const PORT = process.env.PORT || 3000;

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

    const path = req.url.split('?')[0];
    const handler = routes[path];

    if (handler) {
      try {
        await handler(req, res);
      } catch (err) {
        res.status(500).json({ error: 'Handler crashed', details: err.message });
      }
      return;
    }

    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Not Found', available: Object.keys(routes) }));
  })
  .listen(PORT, () => {
    console.log(`Listening on http://localhost:${PORT}`);
    Object.keys(routes).forEach((path) => console.log(`  http://localhost:${PORT}${path}`));
  });
