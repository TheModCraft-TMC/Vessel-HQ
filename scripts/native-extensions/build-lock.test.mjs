import { test } from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { withBuildLock } from './build-lock.mjs';

test('serializes concurrent builds and releases successful owners',async(t)=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'vessel-build-lock-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));
 let release;const gate=new Promise(resolve=>{release=resolve});let started;const ready=new Promise(resolve=>{started=resolve});
 const first=withBuildLock(root,async()=>{started();await gate;return 'finished';});await ready;
 await assert.rejects(withBuildLock(root,async()=>assert.fail('must not run')),/lock already exists/);
 release();assert.equal(await first,'finished');assert.equal(await withBuildLock(root,async()=>42),42);
});
test('releases failed owners but never steals pre-existing locks',async(t)=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'vessel-build-lock-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));
 await assert.rejects(withBuildLock(root,async()=>{throw new Error('failed');}),/failed/);
 await fs.mkdir(path.join(root,'.vessel-build.lock'));await assert.rejects(withBuildLock(root,async()=>{}),/lock already exists/);
});
