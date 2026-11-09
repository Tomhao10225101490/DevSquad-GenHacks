import {describe,it,expect} from 'vitest';import {readFileSync} from 'node:fs';import {resolve} from 'node:path';
import {parseIssueUrl,replayState,validateRecording} from './index.ts';
describe('GitHub issue references',()=>{
 it('parses and normalizes a public issue URL',()=>expect(parseIssueUrl(' https://github.com/owner/repo/issues/42/ ')?.url).toBe('https://github.com/owner/repo/issues/42'));
 for(const value of ['http://github.com/a/b/issues/1','https://github.com.evil.test/a/b/issues/1','https://a:b@github.com/a/b/issues/1','https://github.com/a/b/pull/1','https://github.com/a/b/issues/0','https://github.com/a/b/issues/1?token=secret','https://github.com/a/b/issues/9007199254740992'])it('rejects unsafe or unsupported URL '+value,()=>expect(parseIssueUrl(value)).toBeNull());
});
for(const slug of ['path-guard','retry-queue','ttl-cache','path-guard-agent'])describe('real recorded '+slug,()=>{
 const recording=validateRecording(JSON.parse(readFileSync(resolve('apps/web/public/recordings',slug+'.json'),'utf8')));
 it('does not leak future changes or test scores before the edit',()=>{const result=replayState(recording,1);expect(result.files).toEqual(recording.baselineFiles);expect(result.after).toBeNull();expect(result.done).toBe(false);});
 it('reconstructs the final state from events',()=>{const result=replayState(recording,recording.events.length);expect(result.files).toEqual(recording.finalFiles);expect(result.baseline?.failed).toBeGreaterThan(0);expect(result.after?.failed).toBe(0);expect(result.done).toBe(true);});
 it('scrubs backwards without retaining future evidence',()=>{replayState(recording,recording.events.length);const result=replayState(recording,0);expect(result.phase).toBe('READY');expect(result.files).toEqual(recording.baselineFiles);expect(result.visible).toHaveLength(0);});
 it('rejects broken event ordering',()=>{const data=structuredClone(recording);data.events[0].seq=100;expect(()=>validateRecording(data)).toThrow(/sequence/);});
});
