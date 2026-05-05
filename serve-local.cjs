const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const root = __dirname;
const host = '0.0.0.0';
const port = 8000;

// In-memory cache for result images
const resultCache = new Map();

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

function safePath(urlPath) {
  const decoded = decodeURIComponent((urlPath || '/').split('?')[0]);
  const requested = decoded === '/' ? '/index.html' : decoded;
  const normalized = path.normalize(requested).replace(/^(\.\.[/\\])+/, '');
  return path.join(root, normalized);
}

function httpsPost(hostname, path, body, extraHeaders) {
  return new Promise((resolve, reject) => {
    const buf = Buffer.from(body);
    const options = {
      hostname,
      path,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': buf.length, ...extraHeaders }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(buf);
    req.end();
  });
}

function fetchImageAsBase64WithAuth(urlStr, authHeader) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(urlStr);
    const options = { hostname: urlObj.hostname, path: urlObj.pathname + urlObj.search, method: 'GET', headers: authHeader ? { 'Authorization': authHeader } : {} };
    const req = https.request(options, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchImageAsBase64WithAuth(res.headers.location, authHeader));
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        const ct = (res.headers['content-type'] || 'image/webp').split(';')[0];
        resolve('data:' + ct + ';base64,' + buf.toString('base64'));
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function fetchImageAsBase64(urlStr) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(urlStr);
    const mod = urlObj.protocol === 'https:' ? https : http;
    mod.get(urlObj.href, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchImageAsBase64(res.headers.location));
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        const ct = res.headers['content-type'] || 'image/jpeg';
        resolve('data:' + ct.split(';')[0] + ';base64,' + buf.toString('base64'));
      });
    }).on('error', reject);
  });
}

function uploadFileToSpace(hostname, base64DataUrl, filename, authHeader) {
  return new Promise((resolve, reject) => {
    const matches = base64DataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) return reject(new Error('Invalid base64 data URL'));
    const mimeType = matches[1];
    const fileData = Buffer.from(matches[2], 'base64');
    const boundary = '----FormBoundary' + Math.random().toString(36).slice(2);
    const header = Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="files"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`
    );
    const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
    const body = Buffer.concat([header, fileData, footer]);
    const options = {
      hostname, path: '/upload', method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length,
        ...(authHeader ? { 'Authorization': authHeader } : {})
      }
    };
    const req = https.request(options, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(d);
          const filePath = Array.isArray(parsed) ? parsed[0] : (parsed.files && parsed.files[0]);
          if (filePath) resolve(filePath);
          else reject(new Error('Upload response missing file path: ' + d.slice(0, 200)));
        } catch (e) { reject(new Error('Upload parse error: ' + d.slice(0, 200))); }
      });
    });
    req.on('error', reject);
    req.write(body); req.end();
  });
}

function readSSEQueue(hostname, sessionHash, authHeader) {
  return new Promise((resolve, reject) => {
    let settled = false;
    let req;
    const done = (fn) => { if (!settled) { settled = true; clearTimeout(timeout); if (req) { req.destroy(); } fn(); } };
    const timeout = setTimeout(() => done(() => reject(new Error('Try-on timed out after 3 minutes.'))), 180000);
    const options = {
      hostname,
      path: '/queue/data?session_hash=' + sessionHash,
      method: 'GET',
      headers: Object.assign({ 'Accept': 'text/event-stream' }, authHeader ? { 'Authorization': authHeader } : {})
    };
    req = https.request(options, (res) => {
      let buf = '';
      res.on('data', chunk => {
        if (settled) return;
        buf += chunk.toString();
        const parts = buf.split('\n\n');
        buf = parts.pop();
        for (const part of parts) {
          const dataLine = part.split('\n').find(l => l.startsWith('data: '));
          if (!dataLine) continue;
          try {
            const json = JSON.parse(dataLine.slice(6));
            console.log('SSE msg:', json.msg);
            if (json.msg === 'process_completed') {
              const outData = json.output && json.output.data;
              console.log('Output:', JSON.stringify(outData || null).slice(0, 400));
              const out = outData && (outData[0] || outData[1]);
              if (out) {
                let url = null;
                if (typeof out === 'string') url = out;
                else if (out.url) url = out.url;
                else if (out.path) url = out.path.startsWith('http') ? out.path : 'https://' + hostname + '/file=' + out.path;
                else if (out.data && out.data.startsWith('data:')) url = out.data;
                if (url) { done(() => resolve(url)); return; }
              }
              if (json.success === false) {
                const errMsg = (json.output && json.output.error) || 'Try-on processing failed. Use a clear full-body photo and garment image.';
                done(() => reject(new Error(String(errMsg)))); return;
              }
              done(() => reject(new Error('No image in result. Output: ' + JSON.stringify(outData || null).slice(0, 200))));
            } else if (json.msg === 'error') {
              done(() => reject(new Error(String(json.output || 'Space error'))));
            }
          } catch (e) {}
        }
      });
      res.on('error', err => done(() => reject(err)));
      res.on('end', () => {
        // Process any remaining buffered data before giving up
        if (buf.trim()) {
          const dataLine = buf.split('\n').find(l => l.startsWith('data: '));
          if (dataLine) {
            try {
              const json = JSON.parse(dataLine.slice(6));
              console.log('Final SSE msg:', json.msg, JSON.stringify(json.output).slice(0, 200));
              if (json.msg === 'process_completed') {
                const outData = json.output && json.output.data;
                const out = outData && (outData[0] || outData[1]);
                if (out) {
                  let url = typeof out === 'string' ? out : out.url || out.path || (out.data && out.data.startsWith('data:') ? out.data : null);
                  if (url) { done(() => resolve(url)); return; }
                }
              }
            } catch (e) {}
          }
        }
        done(() => reject(new Error('Stream ended without result')));
      });
    });
    req.on('error', err => done(() => reject(err)));
    req.end();
  });
}

async function callKolorsSpace(personBase64, garmentBase64, hfToken) {
  const SPACE = 'kwai-kolors-kolors-virtual-try-on.hf.space';
  const authVal = hfToken ? 'Bearer ' + hfToken : '';
  const auth = authVal ? { 'Authorization': authVal } : {};
  const sessionHash = Math.random().toString(36).slice(2, 12);

  // Step 1: Upload images to the space first
  console.log('Uploading images to space...');
  const [personPath, garmentPath] = await Promise.all([
    uploadFileToSpace(SPACE, personBase64, 'person.jpg', authVal),
    uploadFileToSpace(SPACE, garmentBase64, 'garment.jpg', authVal)
  ]);
  console.log('Uploaded:', personPath, garmentPath);

  const personInput = { path: personPath, url: 'https://' + SPACE + '/file=' + personPath, orig_name: 'person.jpg', size: null, mime_type: 'image/jpeg', is_stream: false, meta: { _type: 'gradio.FileData' } };
  const garmentInput = { path: garmentPath, url: 'https://' + SPACE + '/file=' + garmentPath, orig_name: 'garment.jpg', size: null, mime_type: 'image/jpeg', is_stream: false, meta: { _type: 'gradio.FileData' } };

  // Step 2: Join queue with correct fn_index (2) and all 4 required inputs
  const joinBody = JSON.stringify({
    data: [personInput, garmentInput, 0, true],
    fn_index: 2,
    session_hash: sessionHash,
    trigger_id: 0,
    event_data: null
  });

  console.log('Joining Kolors queue...');
  const joinRes = await httpsPost(SPACE, '/queue/join', joinBody, auth);
  console.log('Queue join:', joinRes.status, joinRes.body.slice(0, 120));

  if (joinRes.status !== 200) throw new Error('Queue join failed: ' + joinRes.body.slice(0, 200));

  // Step 2: Listen to SSE stream after join
  return readSSEQueue(SPACE, sessionHash, authVal);
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  if (req.method === 'GET' && req.url.startsWith('/api/result/')) {
    const id = req.url.split('/api/result/')[1];
    const cached = resultCache.get(id);
    if (!cached) { res.writeHead(404); res.end('Not found'); return; }
    const matches = cached.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) { res.writeHead(500); res.end('Bad cache'); return; }
    const buf = Buffer.from(matches[2], 'base64');
    res.writeHead(200, { 'Content-Type': matches[1], 'Content-Length': buf.length, 'Cache-Control': 'no-store' });
    res.end(buf);
    return;
  }

  if (req.method === 'POST' && req.url === '/api/tryon') {
    let body = '';
    req.on('data', chunk => { body += chunk; if (body.length > 60 * 1024 * 1024) req.destroy(); });
    req.on('end', async () => {
      try {
        const { personImage, garmentImage, hfToken } = JSON.parse(body);
        if (!personImage) throw new Error('No person photo provided.');
        if (!garmentImage) throw new Error('No garment image provided.');

        let garmentBase64 = garmentImage;
        if (garmentImage.startsWith('http')) {
          garmentBase64 = await fetchImageAsBase64(garmentImage);
        }

        console.log('Calling HuggingFace Kolors space...');
        const result = await callKolorsSpace(personImage, garmentBase64, hfToken);
        console.log('Try-on result URL:', result ? result.slice(0, 80) : 'null');

        // Download result image and return as base64 data URL for direct browser display
        let finalResult = result;
        if (result && result.startsWith('http')) {
          try {
            finalResult = await fetchImageAsBase64WithAuth(result, hfToken ? 'Bearer ' + hfToken : '');
            console.log('Result as base64, length:', finalResult.length);
          } catch (e) {
            console.log('Fetch error, using URL directly:', e.message);
          }
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, result: finalResult }));
      } catch (err) {
        console.error('Try-on error:', err.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  let filePath = safePath(req.url);
  fs.stat(filePath, (statError, stats) => {
    if (!statError && stats.isDirectory()) filePath = path.join(filePath, 'index.html');
    fs.readFile(filePath, (readError, data) => {
      if (readError) {
        const notFoundPath = path.join(root, '404.html');
        fs.readFile(notFoundPath, (fallbackError, fallbackData) => {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.end(fallbackError ? '404 Not Found' : fallbackData);
        });
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.statusCode = 200;
      res.setHeader('Content-Type', contentTypes[ext] || 'application/octet-stream');
      res.end(data);
    });
  });
});

server.listen(port, host, () => {
  console.log(`Local site running at http://127.0.0.1:${port}`);
  console.log(`Virtual try-on API ready at http://127.0.0.1:${port}/api/tryon`);
});
