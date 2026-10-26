export const SPANISH_MIN_ZIPF:number;
export interface LexicalSense {glosses?:string[];tags?:string[];raw_tags?:string[];categories?:string[];form_of?:{word:string}[];alt_of?:{word:string}[]}
export interface LexicalEntry {pos:string;pos_title?:string;tags?:string[];categories?:string[];senses:LexicalSense[];rawSha256?:string}
export interface SelectionReview {exclude?:string;preferredEvidence?:{source:string;entry:number;sense:number};validatedNounEvidence?:{entry:number;sense:number}}
export function selectSpanishAnswer(word:string,zipf:number|undefined,entries:LexicalEntry[]|undefined,review?:SelectionReview):{possible:boolean;reason?:string;detail?:string;evidence?:{source?:string;entry:number;sense:number}};
