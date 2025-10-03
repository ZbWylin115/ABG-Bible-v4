import { scoreMove } from './scoring.js';
import { uniq, hash } from './util.js';

function topK(pool,ctx,k=3,excludeKey=null){
  const scored=pool.filter(x=>!excludeKey || x.key!==excludeKey).map(m=>({m,s:scoreMove(m,ctx)}));
  scored.sort((a,b)=>b.s-a.s);
  return scored.slice(0,k).map(x=>x.m);
}

export function buildPlan({ pool, ctx }){
  // pick top for initial render
  const open  = topK(pool.openers, ctx, 1)[0];
  const hook  = topK(pool.hooks,   ctx, 1)[0];
  const move  = topK(pool.moves,   ctx, 1)[0];
  const pivot = topK(pool.pivots,  ctx, 1)[0];
  const close = topK(pool.closers, ctx, 1)[0];

  const beats=[
    { tag:'Close',  options: close.text? [close.text] : (close.options||[]), key: close.key, chosen:'close', branches: close.branches||{} },
    { tag:'Pivot',  options:[pivot.text], key:pivot.key, chosen:'option', branches: pivot.branches||{} },
    { tag:'Move',   micro:[move.text], key:move.key, chosen:'micro', branches: move.branches||{} },
    { tag:'Hook',   advice:[hook.text], key:hook.key, chosen:'advice', branches: hook.branches||{} },
    { tag:'Open',   soft: open.soft||open.text, standard: open.standard||null, bold: open.bold||null, key: open.key, chosen: chooseLabel(open), branches: open.branches||{} }
  ];

  const plan = {
    id:'plan_'+hash(JSON.stringify({ctx,t:Date.now()})),
    scene: ctx.sceneLine,
    why: ctx.why,
    beats,
    moves: uniq(beats.flatMap(b=>b.key?[b.key]:[])),
    do: ctx.doList, dont: ctx.dontList, cityNote: ctx.cityNote, ethNote: ctx.ethNote,
    signalTag:'⚪ Baseline • Build comfort',
    ctx:{...ctx,opts:ctx.opts},
    _pool:pool,
    _history:{} // per-beat undo stack
  };
  return plan;
}

export function rerollBeat(plan, tag, ctx, count=3){
  const poolMap={'Open':'openers','Hook':'hooks','Move':'moves','Pivot':'pivots','Close':'closers'};
  const pool=plan._pool[poolMap[tag]]||[];
  const exclude=plan.beats.find(b=>b.tag===tag)?.key;
  const picks=topK(pool,ctx,count+1,exclude);
  const next=picks[0];
  // push current to history:
  plan._history[tag]=plan._history[tag]||[];
  plan._history[tag].push(plan.beats.find(b=>b.tag===tag));
  // replace
  if(tag==='Open')  plan.beats[4]={tag:'Open',soft:next.soft||next.text,standard:next.standard||null,bold:next.bold||null,key:next.key,chosen:chooseLabel(next),branches: next.branches||{}};
  if(tag==='Hook')  plan.beats[3]={tag:'Hook',advice:[next.text],key:next.key,chosen:'advice',branches: next.branches||{}};
  if(tag==='Move')  plan.beats[2]={tag:'Move',micro:[next.text],key:next.key,chosen:'micro',branches: next.branches||{}};
  if(tag==='Pivot') plan.beats[1]={tag:'Pivot',options:[next.text],key:next.key,chosen:'option',branches: next.branches||{}};
  if(tag==='Close') plan.beats[0]={tag:'Close',options: next.text?[next.text]:(next.options||[]),key:next.key,chosen:'close',branches: next.branches||{}};
  plan._lastAlternates = picks.slice(1); // for “More…”
  return plan;
}

export function undoBeat(plan, tag){
  const stack=plan._history?.[tag]||[];
  if(!stack.length) return plan;
  const prev=stack.pop();
  const idx={'Close':0,'Pivot':1,'Move':2,'Hook':3,'Open':4}[tag];
  plan.beats[idx]=prev;
  return plan;
}

function chooseLabel(m){ if(m.bold) return 'bold'; if(m.standard) return 'standard'; return 'soft'; }
