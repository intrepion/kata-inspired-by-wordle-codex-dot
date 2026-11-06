export interface EnglishReviewEntry {kind:'past'|'plural'|'reviewed';lemma?:string;reason:string;review:string;evidence:({file:string;line:string}|{file:string;word:string;entrySha256:string})[]}
export interface EnglishAnswerReview {schema:number;policy:string;inputs:Record<string,string>;exclude:Record<string,EnglishReviewEntry>;keep:Record<string,string>}
export function loadEnglishAnswerReview():EnglishAnswerReview;
export function reviewForLength(review:EnglishAnswerReview,length:number):Record<string,EnglishReviewEntry>;
export function validateEnglishAnswerReview(review:EnglishAnswerReview):EnglishAnswerReview;
