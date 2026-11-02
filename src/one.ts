import {score} from './domain.ts';

/** Build a bounded, verified pool from the selected vocabulary. No answer outside this pool can be chosen. */
export function uniqueCluePairs(answers:readonly string[],allowed:readonly string[],limit=12):{answer:string;clue:string}[] {
 if(!answers.length||!allowed.length||limit<=0)return [];
 const size=answers[0].length,pairs:{answer:string;clue:string}[]=[];
 for(let i=0;i<Math.min(limit,allowed.length);i++){
  const clue=allowed[Math.floor(i*allowed.length/Math.min(limit,allowed.length))];
  if(clue.length!==size)continue;
  const groups=new Map<string,string[]>();
  for(const answer of answers){const key=score(answer,clue).join(',');const group=groups.get(key)??[];group.push(answer);groups.set(key,group)}
  for(const group of groups.values())if(group.length===1&&group[0]!==clue)pairs.push({answer:group[0],clue});
 }
 return pairs;
}
export function validUniqueClue(answer:string,clue:string,answers:readonly string[]):boolean {
 if(answer===clue||answer.length!==clue.length||!answers.includes(answer))return false;
 const pattern=score(answer,clue);
 return answers.filter(word=>score(word,clue).every((c,i)=>c===pattern[i])).length===1;
}
