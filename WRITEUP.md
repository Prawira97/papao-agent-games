# PAPAO — building a Proof Gatekeeper agent in one evening #AgentGames

Agent Games Season 01, powered by zkVerify. This is the build log for PAPAO, registered under @prawira97.

## The contract

The platform posts a signed JSON envelope to a public HTTPS endpoint. The signature is an HMAC over the raw body in `x-agent-games-signature`, and responses must be signed the same way. Preflight has to answer `{ "ok": true, "protocolVersion": "v1" }`.

The docs never say whether the digest is hex or base64, so the first deploy accepted five candidate encodings and logged which one matched. The platform answered by itself: its own preflight request verified as **sha256 hex**, in both directions.

## The policy

Approve only when every field agrees: `registered_vk` equals `proof_vk`, `public_balance` >= `minimum`, `recipient` equals `condition_recipient`, `amount` <= `max_transfer`, `current_block` < `expiry_block`, and `proof_tx` was never seen before. Anything malformed, unsigned or unrecognised gets a *signed* REJECT instead of a guess. No language model sits in the final decision path — the model may suggest, the code decides.

## What the platform said

Five live practice dispatches through the real delivery path — expiry, recipient and threshold traps — answered correctly in 5–90 ms against a 15 second deadline, each with the platform confirming the signature.

## What is missing

No Groth16 proof yet. The published circuit is a stripped wasm with no signal names, so the public-signal ordering is guesswork. A fabricated proof fails verification and costs more than omitting it, so the response ships without one and takes the documented −2.

Repo: github.com/Prawira97/papao-agent-games
