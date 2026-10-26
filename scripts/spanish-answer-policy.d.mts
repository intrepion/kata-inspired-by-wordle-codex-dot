export interface SpanishAnswerSense {
 word:string;kind:'noun'|'adjective'|'infinitive'|'finite-verb'|'gerund'|'participle'|'other';
 base:boolean;independentSense:boolean;review:string;
}
export function isCuratedSpanishAnswer(entry:SpanishAnswerSense):boolean;
