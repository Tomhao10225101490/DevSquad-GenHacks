# M2 verification — 2026-11-09

## Scope

Real SQLite persistence, deterministic orchestration, trusted fixture execution and authenticated SSE. This milestone does not claim autonomous model calls or container isolation.

## Automated evidence

42 Vitest checks cover the replay contracts (20), persistent store (6), orchestrator (8), HTTP/SSE interface and real fixture (4), and browser transport decoder/endpoint boundaries (4). Cases include transactional rollback, interruption recovery, paused execution, bounded repair and requested-change routing, timeout escalation, authenticated requests, Origin/Host restrictions, Last-Event-ID replay and a real fixture test/patch artifact.

`pnpm typecheck` checks the web, worker and shared core. The worker was also started through `pnpm worker` using the actual Node 22 strip-types runtime and better-sqlite3 native binding.

## Actual Chrome check

1. Connected the local web client to the authenticated loopback worker. Declined Chrome password saving; token remains in application memory.
2. Created path-guard run `bc8fc04a…`, started it and requested a pause. Baseline: 4 passing / 2 failing. Candidate tests: 6 passing / 0 failing.
3. Observed PAUSED at REVIEW with 24 retained events. Terminated the worker gracefully and restarted a new process against the same database.
4. The browser reconnected automatically and retained the same run, checkpoint and event cursor. Resume completed REVIEW with 35 ordered retained events and DONE, without repeating completed PLAN, IMPLEMENT or TEST phases.
5. Downloaded `path-guard-worker.patch` through the UI. The downloaded bytes match the retained artifact; applying them to a fresh bundled baseline passes all six original Node tests.

Screenshots are stored outside the source checkout under `../outputs/m2-paused-worker.png` and `../outputs/m2-completed-worker.png`.
