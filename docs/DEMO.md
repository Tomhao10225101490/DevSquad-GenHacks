# DevSquad — demo script

Target: approximately 2.5 minutes, under the GenHacks three-minute limit. Edited actual application captures with conversational synthetic narration, captions and deliberate pauses. No personal experience, impact or unaided-development claim is invented.

## 1. Green tests. A harder question.

Capture: `01-home.png`.

An AI hands you a patch. The tests are green. You want to trust it. But what actually happened between the prompt and the code? Dev Squad gives you a way to look closer.

## 2. Start with a real, small failure

Capture: `02-issue.png`.

Here, a tiny path helper accepts a sibling folder as if it were a safe child. That is a real boundary bug. Choose the issue, and follow four named roles working on the same evidence.

## 3. Four roles. Different permissions.

Capture: `03-live.png`.

Ada plans. Theo writes the source. Jules runs the actual tests. Maya reviews the actual diff. These are separate model sessions using the university's compatible API. The coder cannot approve its own work, and the reviewer cannot edit files.

## 4. The work has to survive outside the chat

Capture: `04-sandbox.png`.

Generated code runs inside a restricted Docker container. Network access is disabled. Credentials stay outside. The original tests are read only, and only the source file can change. Every tool request leaves a durable event.

## 5. Let the process answer

Capture: `05-tests.png`.

The baseline has three failures. After the generated change, all ten checks pass. Four of those checks are independent boundary regressions, including legitimate dot-prefixed folders. Passing the original examples alone was not enough.

## 6. A review you can inspect

Capture: `06-diff.png`.

Open the retained diff. You can see the exact source change, then read Maya's reasoning beside the real test output. A failed test or requested change routes back through repair, with a limit of three attempts.

## 7. Closing a tab should not erase the work

Capture: `07-timeline.png`.

Runs and events live in SQLite. Pause at a checkpoint, reconnect, or restart the worker and resume. The event stream continues from its cursor. Scrub backwards, and later edits and results disappear until their turn in the trace.

## 8. A patch, not just a promise

Capture: `08-result.png`.

The result includes role contributions, reported token usage, and a real patch download. We apply that patch to a fresh original workspace and rerun the tests in another container. The artifact has to work on its own.

## 9. Evidence without an API key

Capture: `09-samples.png`.

All three bundled issues have real recorded model runs, so judges can explore without a key. Live solving currently supports these bundled repositories; external GitHub links are reference only. Provider credits are not presented as a dollar bill.

## 10. Every fix leaves a paper trail

Capture: `10-close.png`.

The source, tests, decisions, and replay are available to inspect. Dev Squad does not ask you to trust a confident answer. It gives you the work behind it. Built with AI assistance; this demonstration uses synthetic narration.

The final artifact must be reviewed in full for timing, pronunciation and audiovisual alignment before publication. The agent can check frames, duration and subtitle timing but cannot claim to have heard the audio; request the user’s full audition when direct audio review is unavailable.
