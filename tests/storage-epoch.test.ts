import {test} from 'node:test';import assert from 'node:assert/strict';
import {resetStorageForUpdate,storageEpochKey,STORAGE_EPOCH,saveKeyForPath,PROJECT_PATH} from '../src/site.ts';
class MemoryStorage {data=new Map<string,string>();get length(){return this.data.size}key(index:number){return [...this.data.keys()][index]??null}getItem(key:string){return this.data.get(key)??null}setItem(key:string,value:string){this.data.set(key,value)}removeItem(key:string){this.data.delete(key)}}
test('the authorized update resets every current-game language/length notebook and preference, never other origin data',()=>{
 for(const path of ['/',PROJECT_PATH]){const storage=new MemoryStorage(),root=saveKeyForPath(path),foreign=saveKeyForPath(path==='/'?PROJECT_PATH:'/');
 for(const language of ['en','es-MX']as const)for(const n of [4,5,6,7])storage.setItem(saveKeyForPath(path,n,language),'populated rounds,stats,assistance,settings');for(const suffix of ['.language','.word-length','.es-MX.word-length','.old-extra-state'])storage.setItem(root+suffix,'old');storage.setItem('other-game.v1','keep');storage.setItem(root+'0','similar prefix');storage.setItem(foreign,'foreign notebook');
 assert.equal(resetStorageForUpdate(storage,path),true);assert.deepEqual([...storage.data.keys()].sort(),['other-game.v1',root+'0',foreign,storageEpochKey(path)].sort());assert.equal(storage.getItem(storageEpochKey(path)),STORAGE_EPOCH);
 }
});
test('new progress and explicit preferences survive every reload after the one-time reset',()=>{
 const storage=new MemoryStorage();resetStorageForUpdate(storage,'/');const root=saveKeyForPath('/');storage.setItem(root,'new progress');storage.setItem(root+'.language','es-MX');storage.setItem(root+'.es-MX.word-length','7');
 for(let reload=0;reload<3;reload++){assert.equal(resetStorageForUpdate(storage,'/'),false);assert.equal(storage.getItem(root),'new progress');assert.equal(storage.getItem(root+'.language'),'es-MX');assert.equal(storage.getItem(root+'.es-MX.word-length'),'7')}
});
