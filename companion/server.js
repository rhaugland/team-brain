const http = require('http');
const fs = require('fs');
const path = require('path');
const { readJSON, writeJSON, runExtraction, BUFFER_PATH } = require('./extract');

const PORT = 3847;
const TEAM_BRAIN_DIR = path.join(__dirname, '..');

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png'
};

let lastExtraction = null;
let lastCounts = { skills: 0, learnings: 0 };

function appendToBuffer(signals) {
  const buffer = readJSON(BUFFER_PATH);
  buffer.push(...signals);
  writeJSON(BUFFER_PATH, buffer);
  return buffer.length;
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
  });
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
}

const server = http.createServer(async (req, res) => {
  const headers = corsHeaders();

  if (req.method === 'OPTIONS') {
    res.writeHead(204, headers);
    res.end();
    return;
  }

  try {
    if (req.method === 'POST' && req.url === '/signals') {
      const { signals } = await parseBody(req);
      const total = appendToBuffer(signals);
      res.writeHead(200, headers);
      res.end(JSON.stringify({ buffered: total }));

    } else if (req.method === 'POST' && req.url === '/extract') {
      const result = await runExtraction();
      lastExtraction = new Date().toISOString();
      lastCounts = { skills: result.skills, learnings: result.learnings };
      res.writeHead(200, headers);
      res.end(JSON.stringify({ ...result, timestamp: lastExtraction }));

    } else if (req.method === 'GET' && req.url === '/status') {
      const buffer = readJSON(BUFFER_PATH);
      res.writeHead(200, headers);
      res.end(JSON.stringify({
        tracking: true,
        bufferedSignals: buffer.length,
        lastExtraction,
        lastCounts
      }));

    } else if (req.method === 'GET') {
      // Serve static files (viewer + data)
      let filePath;
      if (req.url === '/' || req.url === '') {
        filePath = path.join(TEAM_BRAIN_DIR, 'viewer', 'index.html');
      } else {
        const safePath = path.normalize(req.url).replace(/^(\.\.[\/\\])+/, '');
        filePath = path.join(TEAM_BRAIN_DIR, safePath);
      }

      const ext = path.extname(filePath);
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      try {
        const content = fs.readFileSync(filePath);
        res.writeHead(200, { ...headers, 'Content-Type': contentType });
        res.end(content);
      } catch {
        res.writeHead(404, headers);
        res.end(JSON.stringify({ error: 'Not found' }));
      }
    } else {
      res.writeHead(404, headers);
      res.end(JSON.stringify({ error: 'Not found' }));
    }
  } catch (err) {
    res.writeHead(500, headers);
    res.end(JSON.stringify({ error: err.message }));
  }
});

// Daily extraction check — runs every minute, triggers at 23:59
setInterval(() => {
  const now = new Date();
  if (now.getHours() === 23 && now.getMinutes() === 59) {
    runExtraction().then(result => {
      lastExtraction = new Date().toISOString();
      lastCounts = { skills: result.skills, learnings: result.learnings };
      console.log(`Daily extraction: ${result.skills} skills, ${result.learnings} learnings`);
    }).catch(err => {
      console.error('Daily extraction failed:', err.message);
    });
  }
}, 60000);

server.listen(PORT, () => {
  console.log(`Team Brain companion listening on http://localhost:${PORT}`);
});
