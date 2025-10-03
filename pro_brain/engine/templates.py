from typing import Dict, List
from .util import widen

def build_candidates(ctx: Dict, budget: Dict, diversity: float) -> Dict[str, List[Dict]]:
    ch = ctx.get("channel","IRL")
    time = ctx.get("time","evening")
    vt = ctx.get("venue","rooftop_bar")
    tone = ctx.get("tone","flirty")
    # Minimal, but larger than web, and widened with tiny variants
    if ch == "Virtual":
        return {
            "openers": widen([
                {"key":f"vopen:0", "text":"That fit is doing the most — in a good way.", "tags":["virtual","talky"], "risk":"soft"},
                {"key":f"vopen:1", "text":"Your caption was half-dressed on purpose.", "tags":["virtual","talky"], "risk":"soft"},
                {"key":f"vopen:2", "text":"This made me laugh — how many takes?", "tags":["virtual","talky"], "risk":"soft"},
            ], budget.get("open",40), diversity, prefix="vopen"),
            "hooks": widen([
                {"key":f"vhook:0","text":"Top 3 ____ — go.","tags":["virtual","talky"],"risk":"soft"},
                {"key":f"vhook:1","text":"Voice note your hot take; I’ll match.","tags":["virtual","voice"],"risk":"standard"},
            ], budget.get("hook",40), diversity, prefix="vhook"),
            "moves": widen([
                {"key":f"vmove:0","text":"Offer 2 windows: Thu 8 or Sun 3 — I’ll adapt.","tags":["virtual","plan"],"risk":"soft"},
                {"key":f"vmove:1","text":"Swap one photo each tied to today.","tags":["virtual","plan"],"risk":"soft"},
            ], budget.get("move",30), diversity, prefix="vmove"),
            "pivots": widen([
                {"key":f"vpivot:0","text":"Quick call to vibe-check (8–12).","tags":["virtual","pivot"],"risk":"standard"},
            ], budget.get("pivot",30), diversity, prefix="vpivot"),
            "closers": widen([
                {"key":f"vclose:0","text":"Thursday 8 @ [spot]. I’ll text details. Yes/No?","tags":["virtual","close"],"risk":"standard"},
                {"key":f"vclose:1","text":"Dessert detour this week — 10–15. In/Out?","tags":["virtual","close"],"risk":"soft"},
                {"key":f"vclose:2","text":"Swap IG; I’ll send two windows.","tags":["virtual","close"],"risk":"soft"},
            ], budget.get("close",40), diversity, prefix="vclose"),
        }
    else:
        return {
            "openers": widen([
                {"key":f"open:0","text":"Two options: quiet edge or short walk — pick one.","tags":["irl","talky",vt,time],"risk":"soft"},
                {"key":f"open:1","text":"We can talk here or grab a better angle — your call.","tags":["irl","talky",vt,time],"risk":"soft"},
                {"key":f"open:2","text":"Good fit on the vibe. Start with a mini-mission?","tags":["irl","talky",vt,time],"risk":"soft"},
            ], budget.get("open",40), diversity, prefix="open"),
            "hooks": widen([
                {"key":f"hook:0","text":"One photo each — you pick mine, I pick yours.","tags":["irl","talky",vt,time],"risk":"soft"},
                {"key":f"hook:1","text":"Rate this 1–10; what makes it a 10?","tags":["irl","talky",vt,time],"risk":"soft"},
                {"key":f"hook:2","text":"Pick A or B; don’t explain yet.","tags":["irl","talky",vt,time],"risk":"soft"},
            ], budget.get("hook",40), diversity, prefix="hook"),
            "moves": widen([
                {"key":f"move:0","text":"Two-secret trade — harmless only.","tags":["irl","game",vt,time],"risk":"standard"},
                {"key":f"move:1","text":"Scent test: describe mine in 3 words; I’ll do yours.","tags":["irl","game",vt,time],"risk":"standard"},
                {"key":f"move:2","text":"Pose swap: one shot each; no do-overs.","tags":["irl","game",vt,time],"risk":"standard"},
            ], budget.get("move",30), diversity, prefix="move"),
            "pivots": widen([
                {"key":f"pivot:0","text":"Quieter edge in 2 minutes; decide after.","tags":["irl","pivot",vt,time],"risk":"soft"},
                {"key":f"pivot:1","text":"Short walk for better light, then choose.","tags":["irl","pivot",vt,time],"risk":"soft"},
                {"key":f"pivot:2","text":"Dessert detour nearby (10–15).","tags":["irl","pivot",vt,time],"risk":"soft"},
            ], budget.get("pivot",30), diversity, prefix="pivot"),
            "closers": widen([
                {"key":f"close:0","text":"Thursday 9 @ [spot]. I’ll text details. Yes/No?","tags":["irl","close",vt,time],"risk":"standard"},
                {"key":f"close:1","text":"Dessert 10–15 now; then bounce. In/Out?","tags":["irl","close",vt,time],"risk":"soft"},
                {"key":f"close:2","text":"Swap IG; I’ll send two windows.","tags":["irl","close",vt,time],"risk":"soft"},
            ], budget.get("close",40), diversity, prefix="close"),
        }
