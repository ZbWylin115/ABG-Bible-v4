from typing import Dict, List
import random

# Lightweight paraphrase ops — keeps it tasteful and short
REPHRASE = [
  lambda s: s.replace("I’ll","I will"),
  lambda s: s.replace("In/Out?","Yes/No?"),
  lambda s: s.replace("—"," - "),
  lambda s: s.replace("then bounce","then we bounce"),
]

def paraphrase_variants(pool: Dict[str, List[Dict]], ctx: Dict, strength: float=0.35, shorter: bool=False) -> Dict[str, List[Dict]]:
  rnd = random.random
  out={}
  for k, arr in pool.items():
    bucket=[]
    for i,m in enumerate(arr):
      bucket.append(m)
      if rnd()<strength:
        text = m.get("text","")
        # shorten if needed
        if shorter and len(text)>80:
          text = text[:80].rstrip()+("…" if not text.endswith("…") else "")
        # apply a couple ops
        ops = random.sample(REPHRASE, k=min(2, len(REPHRASE)))
        for op in ops: text = op(text)
        bucket.append({**m, "key": f"{m.get('key','k')}::rw{i}", "text": text})
    out[k]=bucket
  return out
