const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const root = __dirname;
const host = '0.0.0.0';
const port = process.env.PORT || 8000;

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

function httpsPost(hostname, path, body, extraHeaders, method) {
  return new Promise((resolve, reject) => {
    const m = method || (body ? 'POST' : 'GET');
    const buf = body ? Buffer.from(body) : null;
    const options = {
      hostname, path, method: m,
      headers: { 'Content-Type': 'application/json', ...(buf ? { 'Content-Length': buf.length } : {}), ...extraHeaders }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    if (buf) req.write(buf);
    req.end();
  });
}

function fetchUrlToBuffer(urlStr, extraHeaders, timeoutMs) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(urlStr);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'image/webp,image/avif,image/png,image/jpeg,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': `https://${urlObj.hostname}/`,
        'Cache-Control': 'no-cache',
        ...extraHeaders
      }
    };
    const req = https.request(options, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const loc = res.headers.location.startsWith('http') ? res.headers.location : `https://${urlObj.hostname}${res.headers.location}`;
        return resolve(fetchUrlToBuffer(loc, extraHeaders, timeoutMs));
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ buf: Buffer.concat(chunks), status: res.statusCode, ct: (res.headers['content-type'] || '').split(';')[0].trim() }));
    });
    req.on('error', reject);
    if (timeoutMs) req.setTimeout(timeoutMs, () => { req.destroy(new Error('fetch timeout')); });
    req.end();
  });
}

async function fetchHFResultImage(resultUrl, hfToken) {
  const strategies = [
    {},
    hfToken ? { 'Authorization': 'Bearer ' + hfToken } : null,
  ].filter(Boolean);

  for (const extra of strategies) {
    try {
      const { buf, status, ct } = await fetchUrlToBuffer(resultUrl, extra, 20000);
      console.log(`HF fetch status=${status} ct="${ct}" bytes=${buf.length}`);
      if (buf.length > 500 && ct.startsWith('image/')) {
        console.log('✓ Valid image received, returning as base64');
        return 'data:' + ct + ';base64,' + buf.toString('base64');
      }
      console.log('Response not a valid image (ct=' + ct + ' len=' + buf.length + '), trying next strategy...');
    } catch (e) {
      console.log('Fetch attempt failed:', e.message);
    }
  }
  return null;
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

function fetchRemoteImage(urlStr) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(urlStr);
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      reject(new Error('Unsupported image URL'));
      return;
    }

    const mod = urlObj.protocol === 'https:' ? https : http;
    const request = mod.get(urlObj.href, {
      headers: {
        'User-Agent': 'Mozilla/5.0 StichTryOn/1.0',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
      }
    }, (remoteRes) => {
      if (remoteRes.statusCode >= 300 && remoteRes.statusCode < 400 && remoteRes.headers.location) {
        resolve(fetchRemoteImage(new URL(remoteRes.headers.location, urlObj).href));
        return;
      }

      if (remoteRes.statusCode < 200 || remoteRes.statusCode >= 300) {
        reject(new Error(`Image fetch failed with status ${remoteRes.statusCode}`));
        return;
      }

      const chunks = [];
      remoteRes.on('data', chunk => chunks.push(chunk));
      remoteRes.on('end', () => {
        resolve({
          buffer: Buffer.concat(chunks),
          contentType: (remoteRes.headers['content-type'] || 'image/jpeg').split(';')[0]
        });
      });
    });

    request.on('error', reject);
    request.setTimeout(15000, () => {
      request.destroy(new Error('Image fetch timed out'));
    });
  });
}

function uploadFileToSpace(hostname, base64DataUrl, filename, authHeader, uploadPath) {
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
      hostname, path: uploadPath || '/upload', method: 'POST',
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

async function callIDMVTON(personBase64, garmentBase64, hfToken) {
  const SPACE = 'yisol-IDM-VTON.hf.space';
  const authVal = hfToken ? 'Bearer ' + hfToken : '';
  const auth = authVal ? { 'Authorization': authVal } : {};
  const sessionHash = Math.random().toString(36).slice(2, 12);

  console.log('Uploading to IDM-VTON...');
  const [personPath, garmentPath] = await Promise.all([
    uploadFileToSpace(SPACE, personBase64, 'person.jpg', authVal),
    uploadFileToSpace(SPACE, garmentBase64, 'garment.jpg', authVal)
  ]);
  console.log('IDM-VTON uploaded:', personPath, garmentPath);

  const personInput  = { path: personPath,  url: 'https://' + SPACE + '/file=' + personPath,  orig_name: 'person.jpg',  size: null, mime_type: 'image/jpeg', is_stream: false, meta: { _type: 'gradio.FileData' } };
  const garmentInput = { path: garmentPath, url: 'https://' + SPACE + '/file=' + garmentPath, orig_name: 'garment.jpg', size: null, mime_type: 'image/jpeg', is_stream: false, meta: { _type: 'gradio.FileData' } };

  const joinBody = JSON.stringify({
    data: [personInput, garmentInput, true, false, 30, 42],
    fn_index: 0,
    session_hash: sessionHash,
    trigger_id: 6,
    event_data: null
  });

  console.log('Joining IDM-VTON queue...');
  const joinRes = await httpsPost(SPACE, '/queue/join', joinBody, auth);
  console.log('IDM-VTON queue join:', joinRes.status, joinRes.body.slice(0, 120));
  if (joinRes.status !== 200) throw new Error('IDM-VTON queue join failed: ' + joinRes.body.slice(0, 200));

  return readSSEQueue(SPACE, sessionHash, authVal);
}

async function callNymboSpace(personBase64, garmentBase64, hfToken) {
  const SPACE = 'nymbo-virtual-try-on.hf.space';
  const authVal = hfToken ? 'Bearer ' + hfToken : '';
  const auth = authVal ? { 'Authorization': authVal } : {};
  const sessionHash = Math.random().toString(36).slice(2, 12);

  console.log('Uploading images to Nymbo space...');
  const [personPath, garmentPath] = await Promise.all([
    uploadFileToSpace(SPACE, personBase64, 'person.jpg', authVal),
    uploadFileToSpace(SPACE, garmentBase64, 'garment.jpg', authVal)
  ]);
  console.log('Nymbo uploaded:', personPath, garmentPath);

  const personInput  = { path: personPath,  url: 'https://' + SPACE + '/file=' + personPath,  orig_name: 'person.jpg',  size: null, mime_type: 'image/jpeg', is_stream: false, meta: { _type: 'gradio.FileData' } };
  const garmentInput = { path: garmentPath, url: 'https://' + SPACE + '/file=' + garmentPath, orig_name: 'garment.jpg', size: null, mime_type: 'image/jpeg', is_stream: false, meta: { _type: 'gradio.FileData' } };

  const joinBody = JSON.stringify({
    data: [personInput, garmentInput, 'upper_body', true, 42, 30, 1, 'bilinear', 'pad'],
    fn_index: 0,
    session_hash: sessionHash,
    trigger_id: 6,
    event_data: null
  });

  console.log('Joining Nymbo queue...');
  const joinRes = await httpsPost(SPACE, '/queue/join', joinBody, auth);
  console.log('Queue join:', joinRes.status, joinRes.body.slice(0, 120));
  if (joinRes.status !== 200) throw new Error('Queue join failed: ' + joinRes.body.slice(0, 200));

  return readSSEQueue(SPACE, sessionHash, authVal);
}

async function callKolorsSpace(personBase64, garmentBase64, hfToken) {
  const SPACE = 'kwai-kolors-kolors-virtual-try-on.hf.space';
  const authVal = hfToken ? 'Bearer ' + hfToken : '';
  const auth = authVal ? { 'Authorization': authVal } : {};
  const sessionHash = Math.random().toString(36).slice(2, 12);

  console.log('Uploading images to Kolors space...');
  const [personPath, garmentPath] = await Promise.all([
    uploadFileToSpace(SPACE, personBase64, 'person.jpg', authVal),
    uploadFileToSpace(SPACE, garmentBase64, 'garment.jpg', authVal)
  ]);
  console.log('Uploaded:', personPath, garmentPath);

  const personInput  = { path: personPath,  url: 'https://' + SPACE + '/file=' + personPath,  orig_name: 'person.jpg',  size: null, mime_type: 'image/jpeg', is_stream: false, meta: { _type: 'gradio.FileData' } };
  const garmentInput = { path: garmentPath, url: 'https://' + SPACE + '/file=' + garmentPath, orig_name: 'garment.jpg', size: null, mime_type: 'image/jpeg', is_stream: false, meta: { _type: 'gradio.FileData' } };

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

  return readSSEQueue(SPACE, sessionHash, authVal);
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // Redirect browser directly to the HF result URL (bypasses server-to-HF fetch restrictions)
  if (req.method === 'GET' && req.url.startsWith('/api/result-redirect/')) {
    const id = req.url.split('/api/result-redirect/')[1];
    const hfUrl = resultCache.get(id);
    if (!hfUrl) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(302, { 'Location': hfUrl });
    res.end();
    return;
  }

  // ── Leffa Virtual Try-On (free, Gradio v4 API) ────────────────────────────
  if (req.method === 'POST' && req.url === '/api/leffa-tryon') {
    let body = '';
    req.on('data', c => { body += c; if (body.length > 60 * 1024 * 1024) req.destroy(); });
    req.on('end', async () => {
      try {
        const { personImage, garmentImage, garmentType } = JSON.parse(body);
        if (!personImage || !garmentImage) throw new Error('Both images required.');

        const SPACE = 'franciszzj-leffa.hf.space';
        const gType = garmentType || 'upper_body';

        // Gradio v4: upload via /gradio_api/upload, then pass path
        console.log('Uploading images to Leffa (Gradio v4)...');
        const [personPath, garmentPath] = await Promise.all([
          uploadFileToSpace(SPACE, personImage, 'person.jpg', '', '/gradio_api/upload'),
          uploadFileToSpace(SPACE, garmentImage, 'garment.jpg', '', '/gradio_api/upload')
        ]);
        console.log('Leffa uploaded:', personPath.slice(0, 60), garmentPath.slice(0, 60));

        const personInput  = { path: personPath,  url: null, mime_type: 'image/jpeg', orig_name: 'person.jpg',  is_stream: false, meta: { _type: 'gradio.FileData' } };
        const garmentInput = { path: garmentPath, url: null, mime_type: 'image/jpeg', orig_name: 'garment.jpg', is_stream: false, meta: { _type: 'gradio.FileData' } };

        // Gradio v4: POST to /gradio_api/call/<endpoint>
        const callBody = JSON.stringify({
          data: [personInput, garmentInput, false, 30, 2.5, 42, 'viton_hd', gType, false]
        });

        console.log('Calling Leffa Gradio v4 API...');
        const callRes = await httpsPost(SPACE, '/gradio_api/call/leffa_predict_vt', callBody, {
          'Content-Type': 'application/json'
        });
        console.log('Leffa call status:', callRes.status, callRes.body.slice(0, 200));
        if (callRes.status !== 200) throw new Error('Leffa API call failed: ' + callRes.body.slice(0, 300));

        const callJson = JSON.parse(callRes.body);
        const eventId = callJson.event_id;
        if (!eventId) throw new Error('Leffa returned no event_id: ' + callRes.body.slice(0, 200));
        console.log('Leffa event_id:', eventId);

        // Gradio v4: stream results from /gradio_api/call/<endpoint>/<event_id>
        const resultUrl = await new Promise((resolve, reject) => {
          let settled = false;
          const done = (fn) => { if (!settled) { settled = true; clearTimeout(timeout); if (sseReq) sseReq.destroy(); fn(); } };
          const timeout = setTimeout(() => done(() => reject(new Error('Leffa timed out after 3 minutes'))), 180000);

          let sseReq;
          const options = {
            hostname: SPACE,
            path: '/gradio_api/call/leffa_predict_vt/' + eventId,
            method: 'GET',
            headers: { 'Accept': 'text/event-stream' }
          };
          sseReq = https.request(options, (sseRes) => {
            let buf = '';
            sseRes.on('data', chunk => {
              if (settled) return;
              buf += chunk.toString();
              const parts = buf.split('\n\n');
              buf = parts.pop();
              for (const part of parts) {
                const lines = part.split('\n');
                const eventLine = lines.find(l => l.startsWith('event: '));
                const dataLine  = lines.find(l => l.startsWith('data: '));
                if (!dataLine) continue;
                const eventType = eventLine ? eventLine.slice(7).trim() : '';
                console.log('Leffa SSE event:', eventType, dataLine.slice(0, 100));
                try {
                  const json = JSON.parse(dataLine.slice(6));
                  if (eventType === 'complete' || (Array.isArray(json) && json.length > 0)) {
                    // json is array of outputs: [generated_image, mask, densepose]
                    const out = Array.isArray(json) ? json[0] : json;
                    let url = null;
                    if (typeof out === 'string') url = out;
                    else if (out && out.url) url = out.url;
                    else if (out && out.path) url = out.path.startsWith('http') ? out.path : 'https://' + SPACE + '/gradio_api/file=' + out.path;
                    if (url) { done(() => resolve(url)); return; }
                  } else if (eventType === 'error') {
                    done(() => reject(new Error('Leffa error: ' + JSON.stringify(json).slice(0, 200))));
                  }
                } catch (e) {}
              }
            });
            sseRes.on('error', err => done(() => reject(err)));
            sseRes.on('end', () => done(() => reject(new Error('Leffa stream ended without result'))));
          });
          sseReq.on('error', err => done(() => reject(err)));
          sseReq.end();
        });

        console.log('Leffa result URL:', resultUrl ? resultUrl.slice(0, 120) : 'null');

        // If result is already base64 data URL, return directly
        if (resultUrl && resultUrl.startsWith('data:')) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true, result: resultUrl }));
          return;
        }

        // Fetch image and return as base64
        const fullUrl = resultUrl.startsWith('http') ? resultUrl : 'https://' + SPACE + resultUrl;
        const imgData = await fetchHFResultImage(fullUrl, '');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, result: imgData || resultUrl }));
      } catch (err) {
        console.error('Leffa error:', err.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // ── Fashn.ai Virtual Try-On (100 free/month, no credit card) ─────────────
  if (req.method === 'POST' && req.url === '/api/fashn-tryon') {
    let body = '';
    req.on('data', c => { body += c; if (body.length > 60 * 1024 * 1024) req.destroy(); });
    req.on('end', async () => {
      try {
        const { personImage, garmentImage, token, category } = JSON.parse(body);
        if (!token) throw new Error('Fashn.ai API key required.');
        if (!personImage || !garmentImage) throw new Error('Both images required.');

        console.log('Starting Fashn.ai prediction...');
        const startRes = await httpsPost('api.fashn.ai', '/v1/run', JSON.stringify({
          model_name: 'tryon-v1.6',
          inputs: {
            model_image: personImage,
            garment_image: garmentImage,
            category: category || 'tops'
          }
        }), { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' });

        console.log('Fashn.ai start status:', startRes.status, startRes.body.slice(0, 200));
        if (startRes.status !== 200 && startRes.status !== 201) {
          throw new Error('Fashn.ai error: ' + startRes.body.slice(0, 300));
        }
        const startJson = JSON.parse(startRes.body);
        const predId = startJson.id;
        if (!predId) throw new Error('Fashn.ai returned no prediction id: ' + startRes.body.slice(0, 200));
        console.log('Fashn.ai prediction id:', predId);

        // Poll until done (max 120s)
        let resultUrl = null;
        for (let i = 0; i < 40; i++) {
          await new Promise(r => setTimeout(r, 3000));
          const pollRes = await httpsPost('api.fashn.ai', '/v1/status/' + predId, null, {
            'Authorization': 'Bearer ' + token
          }, 'GET');
          const poll = JSON.parse(pollRes.body);
          console.log('Fashn.ai poll status:', poll.status);
          if (poll.status === 'completed') {
            resultUrl = Array.isArray(poll.output) ? poll.output[0] : poll.output;
            break;
          }
          if (poll.status === 'failed') throw new Error('Fashn.ai failed: ' + (poll.error || JSON.stringify(poll)));
        }
        if (!resultUrl) throw new Error('Fashn.ai timed out after 2 minutes.');

        console.log('Fashn.ai result:', resultUrl.slice(0, 80));
        const imgData = await fetchHFResultImage(resultUrl, '');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, result: imgData || resultUrl }));
      } catch (err) {
        console.error('Fashn.ai error:', err.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // ── Replicate IDM-VTON real AI try-on ─────────────────────────────────────
  if (req.method === 'POST' && req.url === '/api/replicate-tryon') {
    let body = '';
    req.on('data', c => { body += c; if (body.length > 60 * 1024 * 1024) req.destroy(); });
    req.on('end', async () => {
      try {
        const { personImage, garmentImage, token } = JSON.parse(body);
        if (!token) throw new Error('Replicate API token required.');
        if (!personImage || !garmentImage) throw new Error('Both images required.');

        console.log('Creating Replicate prediction...');

        // Step 1: Create prediction
        const predBody = JSON.stringify({
          version: '906425dbca90663ff5427624839572cc56ea7d380343d13e2a4c4b09d3f0c30f',
          input: {
            human_img: personImage,
            garm_img: garmentImage,
            garment_des: 'a clothing item',
            is_checked: true,
            is_checked_crop: false,
            denoise_steps: 30,
            seed: 42
          }
        });
        const createRes = await httpsPost('api.replicate.com', '/v1/predictions', predBody, {
          'Authorization': 'Token ' + token,
          'Content-Type': 'application/json'
        });
        console.log('Create status:', createRes.status);
        const pred = JSON.parse(createRes.body);
        if (!pred.id) throw new Error('Replicate error: ' + createRes.body.slice(0, 200));

        // Step 2: Poll until done (max 120s)
        let result = null;
        for (let i = 0; i < 40; i++) {
          await new Promise(r => setTimeout(r, 3000));
          const pollRes = await httpsPost('api.replicate.com', '/v1/predictions/' + pred.id, null, {
            'Authorization': 'Token ' + token
          }, 'GET');
          const poll = JSON.parse(pollRes.body);
          console.log('Poll status:', poll.status);
          if (poll.status === 'succeeded') {
            result = Array.isArray(poll.output) ? poll.output[0] : poll.output;
            break;
          }
          if (poll.status === 'failed') throw new Error('Replicate failed: ' + (poll.error || 'unknown'));
        }
        if (!result) throw new Error('Replicate timed out after 2 minutes.');

        // Step 3: Fetch result image and return as base64
        console.log('Fetching result image:', result.slice(0, 80));
        const imgData = await fetchHFResultImage(result, '');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, result: imgData || result }));
      } catch (err) {
        console.error('Replicate error:', err.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

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

  if (req.method === 'GET' && req.url.startsWith('/api/image')) {
    (async () => {
      try {
        const requestUrl = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`);
        const imageUrl = requestUrl.searchParams.get('url') || '';
        const image = await fetchRemoteImage(imageUrl);
        res.writeHead(200, {
          'Content-Type': image.contentType,
          'Cache-Control': 'public, max-age=86400',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(image.buffer);
      } catch (err) {
        res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(err.message || 'Could not fetch image');
      }
    })();
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

        let result;
        try {
          console.log('Calling IDM-VTON space...');
          result = await callIDMVTON(personImage, garmentBase64, hfToken);
          console.log('IDM-VTON result:', result ? result.slice(0, 80) : 'null');
        } catch (e1) {
          console.log('IDM-VTON failed:', e1.message, '— trying Nymbo...');
          try {
            result = await callNymboSpace(personImage, garmentBase64, hfToken);
          } catch (e2) {
            console.log('Nymbo failed:', e2.message, '— trying Kolors...');
            result = await callKolorsSpace(personImage, garmentBase64, hfToken);
          }
        }

        if (!result) throw new Error('No result URL returned from HuggingFace.');

        // Try to download the result image with browser-like headers (two strategies).
        let finalResult = await fetchHFResultImage(result, hfToken);

        if (finalResult) {
          console.log('✓ HF result fetched as base64, length:', finalResult.length);
          // Save result to disk so we can inspect it
          try {
            const m = finalResult.match(/^data:([^;]+);base64,(.+)$/);
            if (m) {
              const ext = m[1].includes('webp') ? 'webp' : m[1].includes('png') ? 'png' : 'jpg';
              fs.writeFileSync(path.join(__dirname, 'last-tryon-result.' + ext), Buffer.from(m[2], 'base64'));
              console.log('Saved result to last-tryon-result.' + ext);
            }
          } catch(e) { console.log('Could not save debug image:', e.message); }
        } else {
          // Both fetch strategies failed — cache the URL and serve via /api/result/:id
          // which the browser will request, bypassing server-to-HF restrictions.
          const cacheId = Math.random().toString(36).slice(2, 10);
          resultCache.set(cacheId, result); // store the HF URL for redirect
          finalResult = '/api/result-redirect/' + cacheId;
          console.log('✗ Direct fetch failed — returning redirect cache id:', cacheId);
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
      res.setHeader('ngrok-skip-browser-warning', 'true');
      if (['.html', '.js', '.css'].includes(ext)) {
        res.setHeader('Cache-Control', 'no-store, max-age=0');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
      res.end(data);
    });
  });
});

server.listen(port, host, () => {
  console.log(`Local site running at http://127.0.0.1:${port}`);
  console.log(`Virtual try-on API ready at http://127.0.0.1:${port}/api/tryon`);
});
