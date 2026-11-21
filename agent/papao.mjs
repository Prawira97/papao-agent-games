#!/usr/bin/env node
// PAPAO — zkVerify Agent Games endpoint (Proof Gatekeeper). Contract: /build. Fails closed.
import http from 'node:http';
import crypto from 'node:crypto';
import { decide } from './policy.mjs';

const PORT = Number(process.env.PORT || 8787);
const SECRET = process.env.AGENT_GAMES_HMAC_SECRET || '';
const hmac = (s) => crypto.createHmac('sha256', SECRET).update(s, 'utf8').digest('hex');

function sigOk(raw, header) {
  if (!header) return false;
  const h = String(header).trim().replace(/^sha256=/, '');
  const v = hmac(raw);
  return v.length === h.length && crypto.timingSafeEqual(Buffer.from(v), Buffer.from(h));
}

function send(res, body) {
  const raw = JSON.stringify(body);
  console.log(new Date().toISOString(), raw);
  res.writeHead(200, { 'content-type': 'application/json', 'x-agent-games-signature': hmac(raw) });
  res.end(raw);
}

http.createServer((req, res) => {
  const chunks = [];
  req.on('data', (c) => chunks.push(c));
  req.on('end', () => {
    const raw = Buffer.concat(chunks).toString('utf8');
    if (!sigOk(raw, req.headers['x-agent-games-signature']))
      return send(res, { ok: false, error: 'bad_signature' });
    let body = {};
    try { body = JSON.parse(raw); } catch { return send(res, { decision: 'REJECT', reason_code: 'MALFORMED_TASK' }); }
    if (body.type === 'agent-games.preflight.v1') return send(res, { ok: true, protocolVersion: 'v1' });
    if (body.type === 'agent-games.proof-gatekeeper.v1') return send(res, decide(body.input));
    send(res, { decision: 'REJECT', reason_code: 'UNSUPPORTED_TASK' });
  });
}).listen(PORT, '127.0.0.1', () => console.log('listening', PORT));
