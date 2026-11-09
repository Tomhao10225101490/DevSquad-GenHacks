import test from 'node:test';
import assert from 'node:assert/strict';
import { isWithin } from './src/index.ts';

test('accepts a genuine descendant', () => assert.equal(isWithin('/workspace/repo', '/workspace/repo/src/index.ts'), true));
test('accepts the root itself', () => assert.equal(isWithin('/workspace/repo', '/workspace/repo'), true));
test('rejects a sibling sharing the prefix', () => assert.equal(isWithin('/workspace/repo', '/workspace/repo-evil/secrets'), false));
test('rejects normalized sibling traversal', () => assert.equal(isWithin('/workspace/repo', '/workspace/repo/../repo-evil/config'), false));
test('rejects parent traversal', () => assert.equal(isWithin('/workspace/repo', '/workspace/repo/../../etc/passwd'), false));
test('accepts dot normalization within the root', () => assert.equal(isWithin('/workspace/repo', '/workspace/repo/src/../safe.ts'), true));
