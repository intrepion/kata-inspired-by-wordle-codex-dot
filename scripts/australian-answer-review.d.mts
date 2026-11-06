export interface AustralianAnswerReview {
 schema:number;
 inputs:Record<string,string>;
 allow:Record<string,{reason:string;evidence:Record<string,string>[]}>;
 deferred:string[];
 counts:{newCommon35:number;allowed:number;deferred:number};
}
export function loadAustralianAnswerReview():AustralianAnswerReview;
export function validateAustralianAnswerReview(review:unknown):AustralianAnswerReview;
