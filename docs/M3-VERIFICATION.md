# M3 verification — 2026-11-09

The completed ECNU ecnu-max run is `322d8ea8-2284-4262-8c36-e443323da69f`. Four role-specific model sessions planned, generated source, ran tests and reviewed the actual Git diff. No fixed.ts was copied into the workspace. Its 85 events retain a hard interruption during REVIEW and recovery from SQLite. Original baseline: 4 pass / 2 fail; generated source: 6 original tests pass.

The exported patch was applied to a fresh original workspace, verified byte-for-byte against the retained final source, and tested in a new restricted container: all six original tests plus four independent boundary checks passed (10 total). SHA-256: `c90613bdb39db5dacfbfc3c0bb94e0bb5fd6399aed839ff5d5dad9c93f0a05e8`. The additional checks cover dot-prefixed children, nested dot-prefixed children, a filesystem-root descendant and sibling boundaries. They are now part of actual agent test execution, with original tests unchanged.

Reported successful-completion usage: 21,068 input, 2,155 output, 23,223 total, 14,464 cached input tokens. Interrupted requests may not return usage; no complete billing or monetary-cost claim is made.

`DEVSQUAD_CONTAINER_TESTS=1 pnpm test` passed 55 tests. Actual Docker checks verify disabled network, no credentials/host directory, read-only tests/package files, writable source only, dropped capabilities, read-only root, 256 MiB RAM, one CPU and 64-process limit. Tool path and command guards, role approval separation, API authentication/redirect/retry/abort/usage behavior, orchestration and transport are also covered.

Private historical failures remain in .data/agents.sqlite: a denied .git/config read, an unauthorized Tester approval verdict, and an independently discovered conservative-path regression. They are not substituted into the shipped successful recording.

The M3 real-agent interface is `pnpm agent`; the browser Worker session still uses M2 fixture verification. Live browser role controls, final diff polish and competition media are incomplete. GenHacks has not been submitted.

Actual Chrome QA: the 85-event recording played naturally from READY to DONE. PR result displayed the reported 23,223 tokens and 4 role contributions. The UI-downloaded path-guard (1).patch matched the independently verified SHA-256 above. Screenshot: docs/screenshots/agent-result.png.
