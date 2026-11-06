import {test} from 'node:test';import assert from 'node:assert/strict';
import {resetStorageForUpdate,saveKeyForPath,activeSaveKeyForPath,preserveEnglishStorageForUpdate,exportOriginalEnglishNotebooks,PROJECT_PATH} from '../src/site.ts';
class MemoryStorage {data=new Map<string,string>();get length(){return this.data.size}key(index:number){return [...this.data.keys()][index]??null}getItem(key:string){return this.data.get(key)??null}setItem(key:string,value:string){this.data.set(key,value)}removeItem(_key:string){throw Error('An update must never delete data')}}
test('the superseded epoch reset never deletes notebooks or preferences, including without a marker',()=>{
 const storage=new MemoryStorage();storage.setItem('morrowmark.v1','original');const before=[...storage.data];
 assert.equal(resetStorageForUpdate(storage,'/'),false);assert.deepEqual([...storage.data],before);
});
test('English updates copy every changed notebook and ruleset while preserving exact originals and all other scopes',()=>{
 for(const path of ['/',PROJECT_PATH]){
  const storage=new MemoryStorage(),root=saveKeyForPath(path),other=saveKeyForPath(path==='/'?PROJECT_PATH:'/');
  for(const length of [4,5,6,7,8,9,10,11])for(const suffix of ['', '.absurd-daily.v1.2026-11-06','.one-daily.v1.2026-11-06.1','.one-daily.v1.2026-11-06.selected','.smashare.v1.practice.game','.smashare-stats.v1.daily','.letroso.v1.practice.game','.letroso-hidden.v2.daily.2026-11-06.game','.letroso-stats.v1.practice'])storage.setItem(saveKeyForPath(path,length)+suffix,`original ${length} ${suffix}`);
  for(const key of [root+'.theme',root+'.difficulty',root+'.language',root+'.selection.v1',root+'.word-length',root+'.letters-3',root+'.es-MX',root+'.fil-PH',other,'unrelated'])storage.setItem(key,'unchanged');
  const before=new Map(storage.data);assert.equal(preserveEnglishStorageForUpdate(storage,path),72);
  for(const [key,value] of before)assert.equal(storage.getItem(key),value,'no original changes');
  const migrated=activeSaveKeyForPath(path);assert.equal(storage.getItem(migrated),before.get(root));storage.setItem(migrated,'new progress');
  assert.equal(preserveEnglishStorageForUpdate(storage,path),0);assert.equal(storage.getItem(migrated),'new progress');
  const exported=JSON.parse(exportOriginalEnglishNotebooks(storage,path));assert.equal(Object.keys(exported.notebooks).length,72);assert.equal(exported.notebooks[root],before.get(root));assert.equal(exported.notebooks[root+'.theme'],undefined);
  for(const language of ['es-MX','fil-PH'] as const)assert.equal(activeSaveKeyForPath(path,5,language),saveKeyForPath(path,5,language));assert.equal(activeSaveKeyForPath(path,3),saveKeyForPath(path,3));
 }
});
test('quota failures retain every original and a later retry does not overwrite already copied or new progress',()=>{
 const storage=new MemoryStorage(),root=saveKeyForPath('/');storage.setItem(root,'one');storage.setItem(root+'.letters-4','two');const write=storage.setItem.bind(storage);let writes=0;
 storage.setItem=(key,value)=>{if(++writes===2)throw Error('QuotaExceededError');write(key,value)};
 assert.throws(()=>preserveEnglishStorageForUpdate(storage,'/'),/Quota/);assert.equal(storage.getItem(root),'one');assert.equal(storage.getItem(root+'.letters-4'),'two');
 storage.setItem=write;write(activeSaveKeyForPath('/'),'new progress');assert.equal(preserveEnglishStorageForUpdate(storage,'/'),1);assert.equal(storage.getItem(activeSaveKeyForPath('/')),'new progress');
});

test('a completed import never resurrects deliberately removed active progress or imports later old-client writes',()=>{
 const storage=new MemoryStorage(),source=saveKeyForPath('/'),active=activeSaveKeyForPath('/');storage.setItem(source,'old');preserveEnglishStorageForUpdate(storage,'/');storage.data.delete(active);storage.setItem(source,'late old client');assert.equal(preserveEnglishStorageForUpdate(storage,'/'),0);assert.equal(storage.getItem(active),null);assert.equal(storage.getItem(source),'late old client');
});
