/** Expand only the already pinned RLA-es es-MX dictionary for new lengths. */
import {readFileSync,writeFileSync} from 'node:fs';import {createHash} from 'node:crypto';import nspell from 'nspell';
const root=new URL('../',import.meta.url),data=new URL('src/data/spanish/',root),sources=new URL('public/third-party/es-MX/',root),manifest=JSON.parse(readFileSync(new URL('source.json',data),'utf8'));
for(const [name,digest] of Object.entries(manifest.files))if(createHash('sha256').update(readFileSync(new URL(name,sources))).digest('hex')!==digest)throw Error('Spanish source changed: '+name);
const spell=nspell(readFileSync(new URL('es-MX.aff',sources)),readFileSync(new URL('es-MX.dic',sources)));
const words=Object.keys(spell.data).filter(w=>w===w.normalize('NFC')&&/^[a-záéíóúüñ]{3,11}$/.test(w)&&[3,8,9,10,11].includes(w.length)&&spell.correct(w)).map(w=>w.toLocaleUpperCase('es-MX')).sort();
const output=Object.fromEntries([3,8,9,10,11].map(n=>[n,words.filter(w=>w.length===n)])),content=JSON.stringify(output)+'\n',path=new URL('extended-guesses.json',data);
if(process.argv.includes('--check')){if(readFileSync(path,'utf8')!==content)throw Error('Regenerate extended Spanish guesses')}else writeFileSync(path,content);
console.log(Object.fromEntries(Object.entries(output).map(([n,w])=>[n,w.length])));
