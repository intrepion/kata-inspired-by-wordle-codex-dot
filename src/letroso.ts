import {validDate,type Difficulty} from './domain.ts';
import {normalizeGuess,savedDutchRules,validLetters,languageLabel,type DutchRules,type Language} from './language.ts';
import {answerDataset,vocabulary,supportedLengths,isSupportedLength} from './words.ts';

/** One tile's ordered-subsequence clue. Joining is true only when both letters are neighbors in answer and guess. */
export type OrderTile={letter:string;kind:'absent'|'present'|'ordered';joinPrevious:boolean;start:boolean;end:boolean};
export function orderFeedback(answer:string,guess:string,language:Language='en',dutchRules:DutchRules=2):OrderTile[] {
 if(language==='nl-NL'&&dutchRules===2){answer=normalizeGuess(answer,language,dutchRules);guess=normalizeGuess(guess,language,dutchRules);}
 const a=[...answer],g=[...guess],n=a.length,m=g.length;
 if(!n||!m)return g.map(letter=>({letter,kind:'absent',joinPrevious:false,start:false,end:false}));
 // An LCS fixes the largest possible set of letters in order. Among ties, favor
 // consecutive runs and confirmed word boundaries; finally prefer earlier guess tiles.
 const dp=Array.from({length:n+1},()=>Array<number>(m+1).fill(0));
 for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--)dp[i][j]=Math.max(dp[i+1][j],dp[i][j+1],a[i]===g[j]?1+dp[i+1][j+1]:0);
 let bestScore=-1,bestPattern='',best:OrderTile[]|undefined;
 const consider=(pairs:[number,number][])=>{
  const remaining=new Map<string,number>();for(const letter of a)remaining.set(letter,(remaining.get(letter)??0)+1);
  const pattern=Array<number>(m).fill(0);let score=0,run=0;
  for(let k=0;k<pairs.length;k++){const [i,j]=pairs[k],prev=pairs[k-1],joined=!!prev&&i===prev[0]+1&&j===prev[1]+1;run=joined?run+1:1;score+=3*run;pattern[j]=joined?3:2;remaining.set(g[j],remaining.get(g[j])!-1)}
  const starts=pairs.length>0&&pairs[0][0]===0&&pairs[0][1]===0,ends=pairs.length>0&&pairs.at(-1)![0]===n-1&&pairs.at(-1)![1]===m-1;
  score+=Number(starts)+Number(ends);
  for(let j=0;j<m;j++)if(pattern[j]===0&&(remaining.get(g[j])??0)>0){pattern[j]=1;remaining.set(g[j],remaining.get(g[j])!-1)}
  if(pairs.length===1&&!starts&&!ends)pattern[pairs[0][1]]=1;
  const key=pattern.join('');if(score<bestScore||score===bestScore&&key<=bestPattern)return;
  const singleton=pattern.filter(x=>x===1).length===1&&pattern.every(x=>x===0||x===1);
  bestScore=score;bestPattern=key;best=g.map((letter,j)=>({letter,kind:pattern[j]>=2||singleton&&pattern[j]===1?'ordered':pattern[j]===1?'present':'absent',joinPrevious:pattern[j]===3,start:starts&&j===0,end:ends&&j===m-1}));
 };
 const walk=(i:number,j:number,pairs:[number,number][])=>{const needed=dp[i][j];if(!needed){consider(pairs);return}for(let x=i;x<n;x++)for(let y=j;y<m;y++)if(a[x]===g[y]&&dp[x][y]===needed&&dp[x+1][y+1]===needed-1)walk(x+1,y+1,[...pairs,[x,y]])};
 walk(0,0,[]);return best!;
}
function hash(s:string){let h=2166136261;for(const c of s)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0}
export function dailyLetroso(date:string,length:number,language:Language):string {if(!validDate(date))throw Error('Invalid date');const words=vocabulary(length,language).answers;if(!words.length)throw Error('No answers');return words[hash(`letroso-v1|${date}|${length}|${language}|${answerDataset(length,language)}`)%words.length]}
export function practiceLetroso(length:number,language:Language,previous='',random=Math.random):string {const words=vocabulary(length,language).answers.filter(w=>w!==previous);if(!words.length)throw Error('No answers');return words[Math.min(words.length-1,Math.max(0,Math.floor(random()*words.length)))]}
/** Length is chosen independently of the player's other mode preferences. */
export function dailyHiddenLetroso(date:string,language:Language):string {if(!validDate(date))throw Error('Invalid date');const lengths=supportedLengths(language),length=lengths[hash(`letroso-hidden-v2|${date}|${language}`)%lengths.length];return dailyLetroso(date,length,language)}
export function practiceHiddenLetroso(language:Language,previous='',random=Math.random):string {const lengths=supportedLengths(language),length=lengths[Math.min(lengths.length-1,Math.max(0,Math.floor(random()*lengths.length)))];return practiceLetroso(length,language,previous,random)}
export interface LetrosoRun {dutchRules?:DutchRules;started?:boolean;answer:string;language:Language;length:number;guesses:string[];draft:string;difficulty:Difficulty;easiest:Difficulty;assisted:boolean;gaveUp?:boolean;roundId?:string}
export function newLetroso(answer:string,language:Language,difficulty:Difficulty,dutchRules:DutchRules=2):LetrosoRun {if(!vocabulary(answer.length,language).answers.includes(answer))throw Error('Invalid answer');return {...(language==='nl-NL'?{dutchRules}:{}),answer,language,length:answer.length,guesses:[],draft:'',difficulty,easiest:difficulty,assisted:difficulty==='easy'}}
export function letrosoStatus(run:LetrosoRun):'playing'|'won'|'lost' {return run.guesses.some(guess=>normalizeGuess(guess,run.language,run.dutchRules)===normalizeGuess(run.answer,run.language,run.dutchRules))?'won':run.gaveUp?'lost':'playing'}
const signature=(tiles:OrderTile[])=>JSON.stringify(tiles.map(({kind,joinPrevious,start,end})=>[kind,joinPrevious,start,end]));
/** Strict guesses must reproduce all prior feedback; Hard retains ordered blocks and word-end anchors. */
export function letrosoConstraint(run:LetrosoRun,guess:string,level:Difficulty):string|undefined {
 if(level!=='hard'&&level!=='strict')return;
 for(const [row,previous] of run.guesses.entries()){
  const actual=orderFeedback(run.answer,previous,run.language,run.dutchRules),hypothetical=orderFeedback(guess,previous,run.language,run.dutchRules);
  if(level==='strict'){if(signature(actual)!==signature(hypothetical))return `Strict: guess must reproduce fieldnote ${row+1}.`;continue}
  for(let i=0;i<actual.length;i++)if(actual[i].kind==='ordered'&&(hypothetical[i].kind!=='ordered'||actual[i].joinPrevious&&!hypothetical[i].joinPrevious||actual[i].start&&!hypothetical[i].start||actual[i].end&&!hypothetical[i].end))return `Hard: preserve ordered blocks and word ends from fieldnote ${row+1}.`;
 }
}
export function submitLetroso(run:LetrosoRun,raw:string):{run:LetrosoRun;error?:string}{
 if(letrosoStatus(run)!=='playing')return {run,error:'This round is complete.'};const guess=normalizeGuess(raw,run.language,run.dutchRules);
 if(!isSupportedLength(guess.length,run.language)||!validLetters(guess,run.language)||!vocabulary(guess.length,run.language,run.dutchRules).allowed.has(guess))return {run,error:run.language==='fil-PH'?'Use an accepted five-letter Filipino word.':'Use an accepted dictionary word of 3–11 letters.'};
 if(run.guesses.some(previous=>normalizeGuess(previous,run.language,run.dutchRules)===guess))return {run,error:'Already noted. Try a different word.'};const error=letrosoConstraint(run,guess,run.difficulty);if(error)return {run,error};return {run:{...run,guesses:[...run.guesses,guess],draft:''}};
}
export function changeLetrosoDifficulty(run:LetrosoRun,level:Difficulty):{run:LetrosoRun;error?:string}{
 if(letrosoStatus(run)!=='playing')return {run,error:'This round is complete.'};
 if(level==='hard'||level==='strict')for(let i=0;i<run.guesses.length;i++){const partial={...run,guesses:run.guesses.slice(0,i)};const error=letrosoConstraint(partial,run.guesses[i],level);if(error)return {run,error:`Earlier guess ${i+1} conflicts with ${level}. ${error}`}}
 const rank={easy:0,normal:1,hard:2,strict:3};return {run:{...run,difficulty:level,easiest:rank[level]<rank[run.easiest]?level:run.easiest,assisted:run.assisted||level==='easy'}};
}
export function restoreLetroso(raw:unknown,language:Language,length:number,expected?:string):LetrosoRun|undefined {try{
 if(!raw||typeof raw!=='object')return;const v=raw as Partial<LetrosoRun>;
 if(v.dutchRules!==undefined&&v.dutchRules!==1&&v.dutchRules!==2)return;
 if(v.language!==language||v.length!==length||typeof v.answer!=='string'||expected&&v.answer!==expected||!['easy','normal','hard','strict'].includes(String(v.difficulty))||!Array.isArray(v.guesses)||typeof v.draft!=='string')return;
 let run=newLetroso(v.answer,language,v.difficulty!,savedDutchRules(v));for(const guess of v.guesses){if(typeof guess!=='string')return;const result=submitLetroso(run,guess);if(result.error)return;run=result.run}
 if(v.gaveUp===true){if(letrosoStatus(run)!=='playing')return;run.gaveUp=true}const draft=normalizeGuess(v.draft,language,run.dutchRules);if(draft!==v.draft||draft.length>Math.max(...supportedLengths(language))||draft&&!validLetters(draft,language)||letrosoStatus(run)!=='playing'&&draft)return;
 if(v.started!==undefined&&typeof v.started!=='boolean'||v.started===false&&(v.guesses.length>0||!!draft||v.gaveUp===true))return;
 if(v.easiest!==undefined&&!['easy','normal','hard','strict'].includes(v.easiest))return;if(v.assisted!==undefined&&typeof v.assisted!=='boolean')return;if(v.roundId!==undefined&&(typeof v.roundId!=='string'||v.roundId.length>100))return;
 return {...run,draft,...(v.started===false?{started:false}:{}),easiest:v.easiest??v.difficulty!,assisted:v.assisted??false,...(v.roundId?{roundId:v.roundId}:{})};
 }catch{return}}
export function letrosoShare(run:LetrosoRun,date:string):string {const glyph={ordered:'🟩',present:'🟨',absent:'⬛'};return `Lexi Conquest${run.language==='en'?'':` · ${languageLabel(run.language)}`} · Letroso · ${date} UTC · ${run.length} letters\n${letrosoStatus(run)==='won'?run.guesses.length:'X'} guesses\n${run.guesses.map(g=>orderFeedback(run.answer,g,run.language,run.dutchRules).map(t=>`${t.joinPrevious?'─':''}${t.start?'(' : ''}${glyph[t.kind]}${t.end?')':''}`).join('')).join('\n')}`}
/** Unranked candidates inferred solely from public clue rows; the search is bounded. */
export function suggestLetroso(run:LetrosoRun,limit=5,budget=500):{words:string[];scanned:number;truncated:boolean}{
 const observations=run.guesses.map(guess=>signature(orderFeedback(run.answer,guess,run.language,run.dutchRules))),pool=supportedLengths(run.language).flatMap(length=>vocabulary(length,run.language).answers),words:string[]=[],seen=new Set<string>();let scanned=0;
 for(const word of pool){if(scanned>=budget)return {words,scanned,truncated:true};scanned++;if(run.guesses.some(guess=>normalizeGuess(guess,run.language,run.dutchRules)===normalizeGuess(word,run.language,run.dutchRules)))continue;
  const key=normalizeGuess(word,run.language,run.dutchRules);
  if(!seen.has(key)&&run.guesses.every((guess,i)=>signature(orderFeedback(word,guess,run.language,run.dutchRules))===observations[i])){words.push(word);seen.add(key)}
  if(words.length>=limit)return {words,scanned,truncated:scanned<pool.length};
 }
 return {words,scanned,truncated:false};
}
