# DevSquad — GenHacks submission

Track: AI, Agentic Systems, Cybersecurity, and Dev Tools.

Tagline: Four AI roles. Real container tests. An inspectable, replayable trail from issue to verified patch.

Demo: https://tomhao10225101490.github.io/DevSquad-GenHacks/
Source: https://github.com/Tomhao10225101490/DevSquad-GenHacks

## Inspiration

A green test result can make an AI-generated patch feel finished. It still leaves an uncomfortable question: what actually happened between the prompt and the code? DevSquad makes that work inspectable. Instead of relying on the confidence of an answer, a developer can examine the plan, file edits, process output, review and final artifact.

## What it does

Choose one of three original TypeScript issues: a sibling-directory path escape, an off-by-one retry budget, or a cache that expires too late. Ada plans; Theo edits source; Jules runs the real tests; Maya reviews the actual diff. Their permissions differ: the coder cannot approve, and the reviewer cannot edit.

Live execution connects a browser workbench to a local worker. Generated code runs inside restricted Docker containers. The interface streams retained events, displays the role graph, supports pause/resume and reconnect, and presents source changes, before/after tests, reported usage and a downloadable patch.

All three samples also ship real completed model recordings, so judges can inspect the project without a key. Playback is explicitly labelled. GitHub issue URLs are reference-only in this release; the complete supported solving path uses the bundled projects.

## How we built it

The project is a TypeScript pnpm monorepo: Next.js App Router, Tailwind, React Flow, a Node worker, better-sqlite3, Zod and Vitest. Shiki highlights the unified patch. Separate role prompts use an OpenAI-compatible model client; the demonstrated runs use ECNU ecnu-max. Tool calls and verdicts are schema-validated before execution.

The explicit state machine persists phase checkpoints, sequenced events and artifacts in SQLite. SSE reconnects from the last retained event ID. Test failures or review requests route through a bounded repair loop, with at most three repairs and a global active-time budget.

The pinned containers have no network or model credentials, a read-only root/project and one writable source file. Original tests and package configuration remain read-only. Path, command, CPU, memory, process, file-size and output limits constrain the supported workspace.

## Challenges we ran into

An early generated fix passed all six original path tests but conservatively rejected a legitimate dot-prefixed child directory. That was a useful failure: we added four independent boundary regressions and required fresh-workspace patch verification. Other early attempts were correctly stopped when a role requested an unavailable file or tried to approve without reviewer authority. The final tool schemas express those boundaries as well as enforcing them at runtime.

## Accomplishments

All three issues completed actual four-role model runs and passed independent patch application/testing in fresh containers. The browser-started path run retained 88 events and moved from 7 passing / 3 failing checks to 10 passing / 0 failing. Retry-queue and ttl-cache each moved from three failures to six passing tests. The automated suite passed 64 checks with actual Docker isolation checks enabled.

A real interrupted review resumed from SQLite. Browser refresh/reconnect preserved a completed live run. Scrubbing before an edit removes its future source and scores rather than leaving the final answer visible.

## What we learned

Role separation becomes meaningful when it is enforced in schemas and dispatch code. Passing examples do not prove the absence of a regression. Durable events and independently applicable patches give reviewers a stronger basis for judgement than a polished conversation alone.

## What's next

Broader repository support with an explicit dependency/network policy, stronger holdout suites, more accessible diff navigation, and provider-specific credit accounting. Reported token usage is shown today; no currency cost or complete interrupted-request bill is invented.

## AI disclosure

OpenAI Codex assisted with design, implementation, fixtures, tests, documentation and integration. Product role sessions make separate actual calls to the configured model. The demonstration uses synthetic narration and edited actual application captures. Role names are fictional. No external dataset, invented user impact or unaided-development claim is used.
