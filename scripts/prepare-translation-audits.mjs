import {existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const jobs=[['english-translation-audit.json','generate-english-spanish-translations.py'],['spanish-derived-translation-audit.json','generate-spanish-derived-translations.py'],['morph-translation-audit.json','generate-morph-translations.py'],['wordnet-translation-audit.json','generate-wordnet-translations.py'],['translation-coverage-audit.json','generate-translation-coverage.py']];
for(const [audit,generator]of jobs){
 if(existsSync(new URL(`../src/data/spanish/${audit}`,import.meta.url)))continue;
 const result=spawnSync('python3',['-B',`scripts/${generator}`,'--audit-only'],{cwd:root,stdio:'inherit'});
 if(result.error)throw result.error;
 if(result.status!==0)process.exit(result.status??1);
}
