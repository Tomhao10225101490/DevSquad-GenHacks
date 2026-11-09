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
