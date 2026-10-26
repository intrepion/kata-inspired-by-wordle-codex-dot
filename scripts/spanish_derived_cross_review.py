"""Exact second-author approval of a frozen Spanish-model translation proposal.
Earlier alternative meanings are archival, not context for the active reading.
Modified Wiktionary evidence / CC-BY-SA-4.0; no source-provided English claim.
"""
import json,hashlib,re,unicodedata

def cross_reviewed_spanish_profiles(D,batch):
 def read(n):return json.loads((D/n).read_text())
 def sha(n):return hashlib.sha256((D/n).read_bytes()).hexdigest()
 base='spanish-derived'+(f'-{batch}'if batch!=1 else'');prefix=f'spanish-derived-cross-{batch}';inputs=read(prefix+'-candidates.json');review=read(prefix+'-review.json');assert review['inputSha256']==sha(prefix+'-candidates.json')
 candidate=read(base+'-candidates.json');assert inputs['candidateSha256']==sha(base+'-candidates.json');roots={(r['spanish'],r['partOfSpeech']):r for r in candidate['roots']};merged=read(base+'-dual-approval.json');already={(r['spanish'],r['partOfSpeech'])for r in merged['approved']};blocked={r['spanish']for r in merged.get('subjectAudit',{}).get('withdrawals',[])}
 proposed=read(base+'-review-standards.json');older=read(base+'-review-spec.json');assert proposed['inputSha256']==older['inputSha256']==sha(base+'-candidates.json');assert inputs['proposedReviewSha256']==sha(base+'-review-standards.json')and inputs['otherReviewSha256']==sha(base+'-review-spec.json');assert review['reviewer']==older['reviewer']and review['reviewer']!=proposed['reviewer'];pm={(r['spanish'],r['partOfSpeech']):r for r in proposed['approved']};om={(r['spanish'],r['partOfSpeech']):r for r in older['approved']}
 cases={(r['source']['spanish'],r['source']['partOfSpeech']):r for r in inputs['roots']};yes={(r['spanish'],r['partOfSpeech']):r for r in review['approved']};no={(r['spanish'],r['partOfSpeech'])for r in review['rejected']};assert len(cases)==len(inputs['roots'])and len(yes)==len(review['approved'])and len(no)==len(review['rejected'])and not set(yes)&no and set(yes)|no==set(cases)
 for key,x in cases.items():
  assert x['source']==roots[key]and x['proposed']==pm[key]and x['priorOtherReview']==om[key]
  assert key not in already and key[0]not in blocked and not key[0].endswith('se')
  assert any(pm[key][f]!=om[key][f]for f in ['recordSha256','senseIndex','frame','profile']),'Cannot reopen an exact-but-unsafe prior exclusion'
 profiles={}
 for key,approval in sorted(yes.items()):
  p=pm[key];assert p['profile']in {'ordinary','it-only'}and p['partOfSpeech']in {'verb','adj'};assert set(approval['aspectModes'])<=set(p['aspectModes'])and set(p['aspectModes'])<={'progressive','state-past'}
  assert isinstance(p['frame'],str)and p['frame'].strip()==p['frame']and p['frame']and unicodedata.normalize('NFC',p['frame'])==p['frame']and not re.fullmatch(r'(?i)(?:TODO|TBD|translation unavailable|untranslated|form of|inflection of|no definition)',p['frame'])
  assert p['partOfSpeech']!='verb'or(not p['frame'].startswith('to ')and re.fullmatch(r"[a-z]+(?:[-'][a-z]+)*",p['frame'].split(' ',1)[0]))
  row=next(r for r in roots[key]['spanishMeanings']if r['recordSha256']==p['recordSha256']);assert row['word']==key[0]and row['pos']==key[1];sense=row['senses'][p['senseIndex']];assert sense.get('glosses')
  profiles[key]={**p,'aspectModes':sorted(set(approval['aspectModes'])),'context':p['context'],'sourceRow':row,'sourceSense':sense,'reviewBatch':batch,'crossReviewSha256':sha(prefix+'-review.json'),'reviewEvidence':[{'reviewer':proposed['reviewer'],'context':p['context'],'notes':p['notes'],'aspectModes':p['aspectModes']},{'reviewer':review['reviewer'],'context':p['context'],'notes':approval['notes'],'aspectModes':approval['aspectModes']}]}
 hashes={n:sha(n)for n in [prefix+'-candidates.json',prefix+'-review.json',base+'-review-standards.json']}
 return profiles,{'batch':batch,'reviewHashes':hashes,'approvedExactSenseProfiles':len(profiles),'limitations':'Only unchanged proposed source/POS/sense/frame/profile/context after second-author review. Prior alternative notes and known safety exclusions are not reused; existing grammar/subject/English-inflection guards remain mandatory.'}
