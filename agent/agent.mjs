
const server = http.createServer((req, res) => {
  const chunks = [];
  req.on('data', (c) => chunks.push(c));
  req.on('end', () => {
    const raw = Buffer.concat(chunks).toString('utf8');
    const header = req.headers['x-agent-games-signature'];
    const scheme = SECRET ? verifySignature(raw, header) : null;

    let body = null;
    try { body = JSON.parse(raw); } catch {}
    const type = body?.type || '';

    log({ ev: 'in', method: req.method, path: req.url, type,
          sigPresent: !!header, sigOk: !!scheme, scheme, bytes: raw.length });

    if (req.method !== 'POST') return respond(res, 405, { ok: false, error: 'method' }, scheme || 'sha256-hex');

    if (type === 'agent-games.preflight.v1') {
      const respScheme = scheme || 'sha256-hex';
      log({ ev: 'preflight', nonce: body?.nonce, agent_id: body?.agent_id, respScheme });
      return respond(res, 200, { ok: true, protocolVersion: 'v1' }, respScheme);
    }

    if (type === 'agent-games.proof-gatekeeper.v1') {
      let out;
      try { out = decide(body.input); }
      catch (e) { out = { decision: 'REJECT', reason_code: 'INTERNAL_ERROR' }; }
      log({ ev: 'decision', task_id: body?.task_id, ...out });
      return respond(res, 200, out, scheme || 'sha256-hex');
    }

    return respond(res, 200, { decision: 'REJECT', reason_code: 'UNSUPPORTED_TASK' }, scheme || 'sha256-hex');
  });
});

if (!SECRET) {
  console.error('AGENT_GAMES_HMAC_SECRET is required');
  process.exit(1);
}
server.listen(PORT, '127.0.0.1', () => log({ ev: 'listen', port: PORT }));
