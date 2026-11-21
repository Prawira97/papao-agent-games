// PAPAO decision policy — Proof Gatekeeper. Approve only when every field agrees.
const seen = new Set();
const big = (v) => { try { return BigInt(String(v ?? '0')); } catch { return null; } };
const same = (a, b) => String(a ?? '').toLowerCase() === String(b ?? '').toLowerCase();
const ge = (a, b) => a !== null && b !== null && a >= b;
const gt = (a, b) => a !== null && b !== null && a > b;

export function decide(i = {}) {
  const tx = i.proof_tx ? String(i.proof_tx).toLowerCase() : '';
  if (tx && seen.has(tx)) return { decision: 'REJECT', reason_code: 'PROOF_REUSE' };
  if (!same(i.registered_vk, i.proof_vk)) return { decision: 'REJECT', reason_code: 'VK_SUBSTITUTION' };
  if (!ge(big(i.public_balance), big(i.minimum))) return { decision: 'REJECT', reason_code: 'THRESHOLD_MISMATCH' };
  if (!same(i.recipient, i.condition_recipient)) return { decision: 'REJECT', reason_code: 'RECIPIENT_MISMATCH' };
  if (gt(big(i.amount), big(i.max_transfer))) return { decision: 'REJECT', reason_code: 'AMOUNT_EXCEEDS_MAX' };
  if (ge(big(i.current_block), big(i.expiry_block))) return { decision: 'REJECT', reason_code: 'EXPIRED_CONDITION' };
  if (tx) seen.add(tx);
  return { decision: 'APPROVE', reason_code: 'VALID_CONDITION', proof_tx: i.proof_tx };
}
