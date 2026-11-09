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

## 2026-11-09 — M3 API integration in progress

- Use the user's ECNU OpenAI-compatible endpoint (`https://chat.ecnu.edu.cn/open/api/v1`) with `ecnu-max`. Official model and authorization documentation confirm function tools, JSON schemas and bearer authentication. Keep all credentials server-side in ignored `.env.local`; never forward them to a sandbox or static client.
- Request one non-streaming completion at a time and stream validated events through our own retained SSE transport. Disable parallel tool calls, validate returned tool names and arguments, limit input/output, abort with the run signal and retry only transient HTTP status failures (at most three attempts). Do not retry uncertain transport failures that could duplicate provider work.
- Preserve actual token counts and cache counts when supplied, otherwise unknown. ECNU uses credits with peak/off-peak and cache pricing; do not label those as USD or fabricate a cash bill.
- Actual connectivity check: ecnu-max returned a read_file tool call for src/index.ts, HTTP 200, 323 input and 46 output tokens. This proves API tool connectivity; it is not yet the complete agent solve.

- M3 now executes real model-generated code inside pinned Docker containers. The first two attempts were correctly escalated when the Tester requested `.git/config` or tried to approve; permissions now appear in both tool JSON schemas and runtime checks. Preserve those failures in the private database rather than relabel them as success.
- A complete run produced a conservative `..foo` false negative despite its six original tests passing. Add four immutable boundary regressions to real agent test execution and independently verify exported patches. The published successful run uses a path-component check that passes all ten checks. The earlier flawed run is not published as the working solution.
- Real run 322d8ea8… was interrupted during REVIEW and resumed from its durable checkpoint. The final recording retains all 85 sequenced events, including interruption/recovery, and reported usage of 21,068 input / 2,155 output tokens. Usage covers retained responses; an interrupted request may not report its consumption. ECNU credits are not represented as currency.
- M3 exposes real agents through a CLI while the browser still has M2 fixture controls. Publish the actual completed agent trace for the keyless replay now; wire live role execution into the browser in M4. No claim of a finished full product or competition submission is made at this milestone.

## 2026-11-09 — M4: browser execution and review

- Add explicit agent/fixture modes to the authenticated worker API; reject unconfigured agent requests and preserve the mode in SQLite. The browser starts a real role workflow, streams events, displays reported usage and role contributions, reconnects from retained events and downloads its actual patch. Model credentials stay in the worker.
- Highlight unified diffs with a small Shiki grammar/theme bundle and the JavaScript regex engine. Reconstruct intermediate diffs from the event-prefix source snapshot using diff, rather than showing the final patch before a repair happened.
- Verify all three samples through actual ECNU calls, immutable container tests and fresh-container patch application. Use those real recordings as the keyless sample picker defaults. Preserve historical authored traces and failed attempts.
- Fix the live dialog height after inspecting the retained diff: bound its height, scroll inside it and keep the title/close action visible. The live role graph uses React Flow, matching the replay canvas.
- Keep arbitrary GitHub repository execution off the host and out of this release. Import is labelled as a URL reference; no external issue is silently substituted with a sample. The supported complete path uses the three bundled original repositories. This is a deliberate scope cut under the brief's smaller-finished-product rule.
