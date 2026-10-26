"""Scope a source meaning's construction inventory for selected verb readings.
No lexical/grammar eligibility or English meaning is changed by presentation.
"""
CONSTRUCTIONS={'transitive','intransitive','ambitransitive','ditransitive','reflexive','pronominal','impersonal','reciprocal'}
MODIFIERS={'sometimes','usually','often','also'}
def scoped_source_usage(tags,part_of_speech):
 if part_of_speech!='verb':return list(tags)
 inventory=set(tags)&CONSTRUCTIONS
 if not inventory:return list(tags)
 qualifiers=set(tags)&MODIFIERS
 remaining=[t for t in tags if t not in CONSTRUCTIONS|qualifiers]
 return remaining+['Spanish uses include: '+', '.join(sorted(inventory|qualifiers))+' (this English reading shows one use)']
