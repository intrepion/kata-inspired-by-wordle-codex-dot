import {STORAGE_EPOCH,PROJECT_PATH,PAGES_SAVE_KEY} from '../src/site.ts';
import {SAVE_KEY} from '../src/persistence.ts';
/** Fixtures model progress made after this update. The reset-specific suite uses a raw context. */
export async function currentTestContext(browser,options){
 const context=await browser.newContext(options);
 await context.addInitScript(({epoch,project,projectKey,rootKey})=>{if(!/^https?:$/.test(location.protocol))return;const root=location.pathname===project.slice(0,-1)||location.pathname.startsWith(project)?projectKey:rootKey;localStorage.setItem(root+'.reset-epoch',epoch)},{epoch:STORAGE_EPOCH,project:PROJECT_PATH,projectKey:PAGES_SAVE_KEY,rootKey:SAVE_KEY});
 return context;
}
