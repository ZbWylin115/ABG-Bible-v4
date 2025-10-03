from typing import List, Dict
import random

def widen(seed: List[Dict], target: int, diversity: float, prefix: str) -> List[Dict]:
    """Duplicate with tiny mutations to reach ~target size; diversity ~ 0..1 controls expansion."""
    out = seed[:]
    i=0
    while len(out) < target:
        base = random.choice(seed)
        text = base["text"]
        # tiny stochastic replacements to keep it tasteful
        swaps = [
            ("—"," - "), ("Yes/No?","In/Out?"), ("I’ll","I will"),
            ("decide","choose"), ("short","quick"), ("two","2")
        ]
        for old,new in random.sample(swaps, k=2):
            text = text.replace(old,new)
        o = dict(base); o["text"]=text; o["key"]=f"{prefix}:{i}"; out.append(o); i+=1
        if random.random() > (0.5 + 0.5*diversity): break
    return out
