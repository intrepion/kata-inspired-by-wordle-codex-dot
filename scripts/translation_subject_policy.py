"""Restrictive source-bound scope decisions. Own compiler code; data licenses
remain separate. No policy adds a lexical meaning, role or argument.
"""
from pathlib import Path
import json,hashlib

def load_subject_policy(data,provider):
 raw=(data/(provider+'-subject-policy.json')).read_bytes();policy=json.loads(raw);assert policy['provider']==provider
 path=data/('english-translation-evidence.json' if provider=='english' else 'morph-translation-source.json');field='englishEvidenceSha256' if provider=='english' else 'morphSourceManifestSha256';assert hashlib.sha256(path.read_bytes()).hexdigest()==policy[field]
 result={}
 for r in policy['entries']:
  assert r['action'] in {'it-only','withhold'}
  key=(r['spanish'],r['recordSha256'],r['senseKey'],r['frame']) if provider=='english' else (r['spanishPrefix'],r['englishLemma'])
  assert key not in result;result[key]=r
 return result,hashlib.sha256(raw).hexdigest()

def selected_grammar_tags(features,profile=None):
 tags=features['tags']
 if features['kind']!='finite':return tags
 persons={'first-person','second-person','third-person'};numbers={'singular','plural'}
 tags=[t for t in tags if (t not in persons or t==features['person']) and (t not in numbers or t==features['number'])]
 if profile=='it-only':tags=[t for t in tags if t not in {'usted-address','ustedes-address','voseo'}]
 return tags
