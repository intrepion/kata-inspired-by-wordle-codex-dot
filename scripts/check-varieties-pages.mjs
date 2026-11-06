/** Serve the actual Pages build under its project prefix, then run current locale browser suites. */
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
const prefix='/kata-inspired-by-wordle-codex-dot/',root=resolve('dist-pages'),bad=[];
const server=createServer(async(req,res)=>{try{
 const url=new URL(req.url??'/','http://localhost');if(!url.pathname.startsWith(prefix))throw Error('Outside project');
 const path=resolve(root,decodeURIComponent(url.pathname.slice(prefix.length))||'index.html');if(!path.startsWith(root+sep))throw Error('Outside build');
 const data=await readFile(path);res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.txt':'text/plain'})[extname(path)]??'application/octet-stream');res.end(data);
}catch{bad.push(req.url);res.writeHead(404);res.end('Not found')}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}${prefix}`;
try{
 for(const notice of ['SCOWL-Copyright.txt','AGID-Copyright.txt','es-ES/NOTICE.txt','fr/NOTICE.txt']){const response=await fetch(base+'third-party/'+notice);assert.equal(response.status,200);assert.ok((await response.text()).length>100)}
 for(const script of ['check-english-varieties.mjs','check-regional-varieties.mjs','check-french-ligatures.mjs'])await new Promise((resolve,reject)=>{const child=spawn(process.execPath,['--import','tsx','scripts/'+script],{stdio:'inherit',env:{...process.env,BASE_URL:base}});child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(Error(`${script} exited ${code}`)))});
 assert.deepEqual(bad,[]);console.log(`PASS Pages prefix: ${base}; all current locale suites, source notices, no missing assets`);
}finally{await new Promise(resolve=>server.close(resolve))}
