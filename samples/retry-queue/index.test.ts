import test from 'node:test';
import assert from 'node:assert/strict';
import { retry } from './src/index.ts';

test('returns immediate success', async () => assert.equal(await retry(async () => 42), 42));
test('recovers within the budget', async () => { let calls = 0; assert.equal(await retry(async () => { if (++calls < 3) throw Error('transient'); return 'ok'; }), 'ok'); assert.equal(calls, 3); });
test('never exceeds total attempts', async () => { let calls = 0; await assert.rejects(retry(async () => { calls++; throw Error('offline'); }, 3), /offline/); assert.equal(calls, 3); });
test('preserves the last failure', async () => { const error = Error('last failure'); await assert.rejects(retry(async () => { throw error; }, 1), e => e === error); });
test('rejects zero before invoking the task', async () => { let calls = 0; await assert.rejects(retry(async () => { calls++; return 1; }, 0), RangeError); assert.equal(calls, 0); });
test('rejects fractional budgets', async () => { await assert.rejects(retry(async () => 1, 1.5), RangeError); });
