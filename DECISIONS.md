# Engineering decisions

## 2026-11-09 — M1: inspectable evidence before autonomous execution

- Keep a pnpm monorepo with a Next.js App Router application, a shared typed event contract, and three independent TypeScript fixture repositories. The public M1 build is statically exportable so the bundled recording remains available without an API key or backend.
- Record actual baseline and fixed test processes, source snapshots and a Git-generated patch. The M1 capture is a Codex-authored engineering verification, not the future role-based LLM orchestrator. The interface labels it as recorded verification and does not invent LLM usage, tokens, prices or review messages. A later real orchestrator recording will replace it for the final submission.
- Run only our authored, trusted fixtures during capture. There is no Docker runtime on the development machine. Do not expose live command execution or run arbitrary imported repositories on the host. Live execution is gated on an isolated container worker in M3.
- A pasted GitHub issue in M1 is parsed and shown as an imported reference, with its execution status explicit. Public-repository import and live solving belong to later milestones; the UI must not quietly substitute a sample solution.
- Event sequence numbers, source snapshots and tool outputs are the basis for replay. Scrubbing must derive the complete visible state from the event prefix, rather than retaining future results.
- The M1 recording has no metered role-model calls. Display token and cost values as unavailable, with the reason; do not report zero dollars as a measured provider bill.

## Milestones

M1: scaffold, design system, three sample issues, genuine recorded verification and replay player.
M2: persisted state machine, SQLite and live SSE event transport.
M3: isolated workspace tools, restricted role prompts, OpenAI-compatible client and one real agent solve.
M4: bounded repair/review loop, before/after evidence and PR diff result.
M5: command palette, accessibility polish, usage accounting, patch verification and submission media.

Features exceeding a 30-minute investigation will be documented and moved to the stretch list rather than shipped in a broken main path.

## 2026-11-09 — M2: durable phase boundaries and loopback transport

- Commit phase state, sequenced events and artifacts in one SQLite transaction, and notify SSE observers only after commit. This avoids displaying an event whose checkpoint was rolled back. WAL supports retained reads during a run; the CLI lock permits one local worker writer.
- Pause at phase boundaries instead of interrupting a source write or test. Restart recovers RUNNING runs as PAUSED at their last committed phase; trusted phase operations can be retried idempotently. Account active time across resumes, cap repairs at three and make timeout/error escalation explicit.
- Keep the M2 executor restricted to our authored fixtures until M3 isolation is available. Real Node test processes, file edits and Git patches are recorded, but the fixes were authored in advance. Structural review is not presented as an LLM review. Model usage is not applicable.
- Use fetch-based SSE because native EventSource cannot attach the bearer Authorization header. Decode chunked frames, deduplicate sequence IDs, reconnect from Last-Event-ID and reject gaps. The local worker validates Host, Origin, token, body schema, output size and stream limits. A token never appears in a URL or browser storage.
- Preserve the inspectable M1 replay as the keyless main demonstration and add a separate clearly labelled Worker session. The static private preview cannot host a Node process or local SQLite; the worker runs locally with explicit connection.
- Verify the actual Node 22 TypeScript entrypoint as well as Vitest. Native strip-types cannot execute constructor parameter properties, so constructors use ordinary field assignments.
