import test from 'node:test';
import assert from 'node:assert/strict';
import { TTLCache } from './src/index.ts';

test('returns a value before expiry', () => { let now = 10; const c = new TTLCache(() => now); c.set('key', 'fresh', 5); now = 14; assert.equal(c.get('key'), 'fresh'); });
test('expires at the exact deadline', () => { let now = 10; const c = new TTLCache(() => now); c.set('key', 'stale', 5); now = 15; assert.equal(c.get('key'), undefined); });
test('zero TTL is immediately expired', () => { const c = new TTLCache(() => 1); c.set('key', 'stale', 0); assert.equal(c.get('key'), undefined); });
test('preserves falsy values', () => { const c = new TTLCache(() => 1); c.set('zero', 0, 10); assert.equal(c.get('zero'), 0); });
test('overwriting refreshes the deadline', () => { let now = 1; const c = new TTLCache(() => now); c.set('key', 'old', 2); now = 2; c.set('key', 'new', 10); now = 5; assert.equal(c.get('key'), 'new'); });
test('rejects negative TTL', () => { const c = new TTLCache(); assert.throws(() => c.set('key', 1, -1), RangeError); });
