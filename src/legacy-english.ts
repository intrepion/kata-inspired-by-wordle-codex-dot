import answers from './data/legacy-english-answers.json';
/** Frozen published answer order, used only to validate saved rounds, never new candidates. */
export function previousEnglishDataset(length:number):string|undefined {
 return length in answers ? length===5?'scowl-2020.12.07-answers-v2':`scowl-2020.12.07-${length}-answers-v1` : undefined;
}
export function previousEnglishAnswers(length:number):readonly string[]|undefined {return (answers as Record<number,string[]>)[length]}
