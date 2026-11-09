# Milestone 1 verification — November 9, 2026

## Automated evidence

- 20 Vitest cases passed for URL parsing, recording validation, forward reconstruction, backwards scrubbing, and hidden future state across all three recordings.
- TypeScript checks passed for the web application and shared core.
- Next.js production static build passed.
- Three authored TypeScript fixtures were actually executed before and after their fixes: path-guard 2 failures → 6 passes; retry-queue 3 failures → 6 passes; ttl-cache 3 failures → 6 passes.
- `pnpm verify:patches` independently applied all three exported patches to fresh baseline workspaces and ran their unchanged Node test suites successfully.

## Actual Chrome checks

- All sample cards, the React Flow role graph and recorded-mode disclosure rendered successfully.
- The first replay advanced naturally from READY to DONE across 14 events. Real captured output and source changes became available at their event positions.
- The completed result showed one modified file, two original failures, six final passes and contribution event counts.
- Downloading path-guard.patch through the browser produced a file byte-for-byte identical to the independently verified patch; SHA-256 a825f72281903319a3af8c5bd5aa5ae0002340d9757090acbf710e71f8b7a05d.
- Scrubbing to event 0 hid the completed result and source diff. Changes showed “No changes at this point.”
- ⌘K opened the palette; filtering “retry” retained only the matching repository; choosing it reset the run to event 0.
- Second and third sample result pages showed their separate 3-fail → 6-pass evidence.
- A pasted GitHub URL was visibly labeled an unfetched reference. An observed issue with retaining the prior sample cursor was fixed: importing now clears the cursor, locks replay controls and keyboard replay, and never presents that reference as solved.

## Honest limits

This verifies M1, not the later autonomous loop. Separate role-model calls, real model usage costs, live SSE, SQLite persistence and a container sandbox are not claimed by this milestone. No external repository was executed. No mobile browser or full accessibility audit is claimed.
