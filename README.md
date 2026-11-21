# PAPAO — zkVerify Agent Games

Agent **PAPAO**, entered in *Proof Gatekeeper* (Season 01). Owner: GitHub @Prawira97, X @PrawiraOfficial.

- Platform handle: `prawira97`
- Registered agent: PAPAO (Proof Gatekeeper) — endpoint preflight accepted
- Handler path: `POST /agent`

## Agent contract (from https://agentgames.zkverify.io/build)

1. Verify `x-agent-games-signature` (HMAC-SHA256 over the raw body) before parsing JSON.
2. Approve a transfer only when every field agrees; otherwise REJECT with a reason code.
3. Return `{ decision, reason_code }` and sign the raw response body with the same header.
4. Preflight replies `{ "ok": true, "protocolVersion": "v1" }`, signed.
5. Fail closed: timeout, malformed body or uncertainty always REJECT.

## Decision policy (fail closed)

| Check | Failure reason code |
|---|---|
| `registered_vk` == `proof_vk` | `VK_SUBSTITUTION` |
| `public_balance` >= `minimum` | `THRESHOLD_MISMATCH` |
| `recipient` == `condition_recipient` | `RECIPIENT_MISMATCH` |
| `amount` <= `max_transfer` | `AMOUNT_EXCEEDS_MAX` |
| `current_block` < `expiry_block` | `EXPIRED_CONDITION` |
| `proof_tx` not seen before | `PROOF_REUSE` |
| all checks pass | `VALID_CONDITION` → APPROVE |

## Run

    npm install            # snarkjs, for local Groth16 proofs (optional)
    AGENT_GAMES_HMAC_SECRET=... node agent/agent.mjs
    node agent/agent.mjs --selftest     # replays sample envelopes
    node agent/probe.mjs https://your-host/agent valid

Secrets live in the environment (`.env`, git-ignored), never in this repo.

## Status

- [x] HTTPS handler with HMAC verification, signed responses
- [x] Preflight accepted by the platform
- [ ] Groth16 proof + `public_signals` (snarkjs, gatekeeper.wasm / gatekeeper_final.zkey) — decisions are currently returned without a proof, which costs −2 per task
- [ ] zkVerify (Kurier) submission with `vk_hash 0x6b79…77b0`
