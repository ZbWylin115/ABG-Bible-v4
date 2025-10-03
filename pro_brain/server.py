from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, List, Optional
from engine.templates import build_candidates
from engine.rank import rank_pool
from engine.rewrite import paraphrase_variants

app = FastAPI(title="ABG Pro Brain", version="0.1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

class Sliders(BaseModel):
    talky: float = 0.5
    playful: float = 0.6
    direct: float = 0.5

class Context(BaseModel):
    channel: str
    venue: Optional[str] = None
    noise: str
    flow: str
    time: str
    city: Optional[str] = None
    party: str = "solo"
    interest: str = "medium"
    mode: str = "normal"
    goal: str = "set_date"
    tone: str = "flirty"
    intent: str = "clear"
    sliders: Sliders = Sliders()

class VariantBudget(BaseModel):
    open: int = 40
    hook: int = 40
    move: int = 30
    pivot: int = 30
    close: int = 40

class GenRequest(BaseModel):
    context: Context
    variant_budget: VariantBudget = VariantBudget()
    diversity: float = Field(0.35, ge=0.0, le=1.0)

@app.get("/health")
def health(): return {"status":"ok"}

@app.post("/generate")
def generate(req: GenRequest):
    pool = build_candidates(req.context.model_dump(), req.variant_budget.model_dump(), req.diversity)
    pool = paraphrase_variants(pool, req.context.model_dump(), strength=req.diversity)
    ranked = rank_pool(pool, req.context.model_dump())
    return {"beats": ranked, "explanations": {"why":"Engine fit by tags; synergy + novelty considered."}}

class RerankRequest(BaseModel):
    context: Context
    beats: Dict[str, List[Dict]] # existing candidates for next beats

@app.post("/rerank")
def rerank(req: RerankRequest):
    ranked = rank_pool(req.beats, req.context.model_dump())
    return {"beats": ranked}

class RewriteRequest(BaseModel):
    line: str
    tone: str = "flirty"
    shorter: bool = False

@app.post("/rewrite")
def rewrite(req: RewriteRequest):
    outs = paraphrase_variants({"tmp":[{"text":req.line,"tags":[],"risk":"soft"}]}, {"tone":req.tone}, strength=0.3, shorter=req.shorter)
    return {"candidates": outs.get("tmp", [])}

class LearnRequest(BaseModel):
    move_keys: List[str] = []
    outcome: str = "good"
    signal: Optional[str] = None

@app.post("/learn")
def learn(_: LearnRequest):
    # Placeholder: could persist to a local file later
    return {"ok": True}
