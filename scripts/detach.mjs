import {spawn} from 'node:child_process';
import {mkdirSync,openSync,writeFileSync,existsSync} from 'node:fs';
import net from 'node:net';
const port=Number(process.env.PORT??5198);
if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('Use a port from 1024 to 65535.');
if(!existsSync('dist/index.html'))throw new Error('Build first: npm run build');
await new Promise((resolve,reject)=>{
 const probe=net.createServer();probe.once('error',reject);probe.listen(port,'127.0.0.1',()=>probe.close(resolve));
});
mkdirSync('.local',{recursive:true});
const log=openSync('.local/server.log','a');
const child=spawn(process.execPath,['scripts/serve.mjs'],{cwd:process.cwd(),env:{...process.env,PORT:String(port)},detached:true,stdio:['ignore',log,log]});
child.unref();writeFileSync('.local/server.pid',String(child.pid));
console.log(`Detached session-only server PID ${child.pid} · http://127.0.0.1:${port}`);
