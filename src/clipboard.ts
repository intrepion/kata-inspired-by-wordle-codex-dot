/** Attempt a user-requested copy; callers keep the text available for manual selection on failure. */
export async function copyShareText(text:string,write:((text:string)=>Promise<void>)|undefined,timeoutMs=1500):Promise<boolean> {
 if(!write)return false;
 let timer:ReturnType<typeof setTimeout>|undefined;
 try{return await Promise.race([Promise.resolve().then(()=>write(text)).then(()=>true),new Promise<false>(resolve=>{timer=setTimeout(()=>resolve(false),timeoutMs)})])}
 catch{return false}
 finally{if(timer!==undefined)clearTimeout(timer)}
}
