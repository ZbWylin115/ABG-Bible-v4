from typing import Dict, List
import math

def _jaccard(a: List[str], b: List[str]) -> float:
    A=set(a or []); B=set(b or [])
    return len(A&B)/len(A|B) if A|B else 0.0

def _score(move: Dict, ctx: Dict) -> float:
    # Simple tag scoring + gentle penalties
    tags = move.get("tags",[])
    core=[ "irl" if ctx.get("channel")=="IRL" else "virtual", ctx.get("time"), ctx.get("tone") ]
    scene=[ ctx.get("noise"), ctx.get("flow"), ctx.get("venue"), ctx.get("party") ]
    goal=[ ctx.get("goal"), ctx.get("mode") ]
    s = 0.45*_jaccard(tags, core) + 0.2*_jaccard(tags, scene) + 0.15*_jaccard(tags, goal)
    risk = move.get("risk","soft")
    interest=ctx.get("interest","medium")
    mode=ctx.get("mode","normal")
    if mode=="safe" and risk=="bold": s-=0.25
    if mode=="spicy" and risk=="soft": s-=0.05
    if interest=="low" and risk=="bold": s-=0.2
    if ctx.get("noise")=="loud" and "talky" in tags: s-=0.2
    if ctx.get("party")=="crew" and "intimate" in tags: s-=0.2
    return max(-1,min(1,s))

def rank_pool(pool: Dict[str, List[Dict]], ctx: Dict) -> Dict[str, List[Dict]]:
    out={}
    for key, arr in pool.items():
      scored = [ (m, _score(m,ctx)) for m in arr ]
      scored.sort(key=lambda x: x[1], reverse=True)
      # top ~60% plus a couple for diversity
      k = max(3, int(len(scored)*0.6))
      out[key] = [m for (m,_) in scored[:k]]
    return out
