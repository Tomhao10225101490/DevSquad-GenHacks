# M4 verification — 2026-11-09

The actual Chrome Run live path created and started run 30927934-2241-4faa-af29-9a15359bcc69 through authenticated HTTP. All four ECNU role sessions executed within Docker, and 88 retained SSE events reached DONE. Baseline: 7 passing / 3 failing (six original assertions plus four boundary regressions); after: 10 passing / 0 failing. Reported model usage: 25,874 input + 2,849 output = 28,723 tokens (17,152 cached input).

A development refresh disconnected the modal while the backend continued. Reconnecting recovered the completed run and all events. The retained Shiki diff displayed the actual source change. The UI-downloaded patch matched SHA-256 fb4de00bc7e32503468c45ef4b836de051da33d8dd921e5ddaba98134b4e626e. Independent export applied it to a fresh original source and passed all ten container tests.

The remaining bundled issues also completed actual four-role runs and fresh-container patch verification:

- retry-queue: 46f53731-1f4f-440a-a606-a31ba82061a6, 71 events, 3 fail before / 6 pass after, 26,429 reported tokens.
- ttl-cache: 755f1c20-ae88-4143-b0ba-ae1acff04b95, 91 events, 3 fail before / 6 pass after, 31,638 reported tokens.

The default sample picker now points to these real agent recordings. Earlier engineering verifications remain as provenance artifacts. Actual repair/reviewer transition limits are covered by deterministic state-machine tests; these successful live runs needed no orchestrator repair iteration. No forced repair is represented as live model behavior.

The worker advertises agent capability only when server configuration exists, persists an explicit execution mode per run, and rejects agent creation otherwise. Earlier fixture-only clients remain supported. Syntax-highlighted replay diffs derive from the current source snapshot, so a repair cannot reveal its later result during backwards scrubbing.
