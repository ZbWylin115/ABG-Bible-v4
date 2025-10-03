import { EDGY } from '../../data/edgy.js';

export function buildCandidates({opts, arch, ven, plat, cityPack}){
  return opts.channel==='Virtual'
    ? buildVirtualPool({plat, time:opts.time, edgy:opts.edgy, goal:opts.goal, tone:opts.tone, width:opts.variant})
    : buildIRLPool({arch, ven, time:opts.time, edgy:opts.edgy, goal:opts.goal, tone:opts.tone, width:opts.variant});
}

/* ---------- IRL ---------- */
function buildIRLPool({arch, ven, time, edgy, goal, tone, width=0.4}){
  const vt=ven.id, timeTag=time;

  // Expand: take archetype + venue + templated variants
  const openers = [
    ...(arch.openers||[]).map(t=>vOpen(t, ['irl','talky',timeTag,arch.tone.energy,vt,'nonedgy'], 'soft', `arch_open:${arch.id}:${t}`)),
    ...(ven.openers||[]).map(t=>vOpen(t, ['irl','talky',timeTag,vt,'nonedgy'], 'soft', `ven_open:${vt}:${t}`)),
    ...templatedOpeners(vt,timeTag,tone,width)
  ];
  if(edgy){ openers.push(...EDGY.moves.slice(0,3).map(m=>({key:`edgy_open:${m.label}`, text:m.edge, bold:m.edge, tags:['irl','edgy',timeTag,vt], risk:'bold'}))); }

  const hooks = [
    {key:`hook:topic:${arch.id}`, text:`Ask about: ${(arch.safe_topics||['current obsession'])[0]}.`, tags:['irl','talky',vt,timeTag], risk:'soft', branches: branchesTalky() },
    {key:`hook:venue:${vt}`, text:`Venue observation → tie to her (short).`, tags:['irl','talky',vt,timeTag], risk:'soft', branches: branchesTalky() },
    ...templatedHooks(vt,timeTag,tone,width)
  ];

  const moves = [
    {key:`move:2fork`, text:'2-option fork: “A or B — choose wisely.”', tags:['irl','game',vt,timeTag], risk:'soft', branches: branchesGame() },
    {key:`move:rate10`, text:'Rate-it-quick (1–10) + “what makes it a 10?”', tags:['irl','game',vt,timeTag], risk:'soft', branches: branchesGame() },
    ...(vt==='karaoke'?[{key:`move:duet`, text:'Duet draft: you pick mine, I pick yours.', tags:['irl','game','karaoke',timeTag,'intimate'], risk:'standard', branches: branchesGame() }]:[]),
    ...(vt==='rooftop_bar'?[{key:`move:photo`, text:'Photo co-direct: swap one pose each.', tags:['irl','game','rooftop_bar',timeTag,'intimate','photo'], risk:'standard', branches: branchesGame() }]:[]),
    ...(vt==='club'?[{key:`move:songbet`, text:'Song bet: “If the drop hits, you owe a cheers.”', tags:['irl','game','club','loud','dance',timeTag], risk:'standard', branches: branchesGame() }]:[]),
    ...templatedMoves(vt,timeTag,tone,width)
  ];

  const pivots = [
    ...(ven.pivots||[]).map(t=>({key:`pivot:${vt}:${t}`, text:t, tags:['irl','pivot',vt,timeTag], risk:'soft', branches: branchesPivot() })),
    ...(time==='late_night' ? [{key:'pivot:latefood', text:'Late-food reset nearby (10–15).', tags:['irl','pivot','late_night'], risk:'soft', branches: branchesPivot() }]:[]),
    ...templatedPivots(vt,timeTag,tone,width)
  ];

  const closers = closerOptions(goal,time,cityPack,tone,width).map((t,i)=>({key:`close:${goal}:${i}:${vt}`, text:t, tags:['irl','close',goal,timeTag], risk: i===0?'standard':'soft', branches: branchesClose() }));

  return { openers, hooks, moves, pivots, closers };
}

/* --------- Virtual ---------- */
function buildVirtualPool({plat, time, edgy, goal, tone, width=0.4}){
  const openers = [
    ...(plat.sample?.safe||[]).map(t=>({key:`vopen:safe:${plat.id}:${t}`, text:t, soft:t, tags:['virtual','talky',plat.id,time], risk:'soft', branches: branchesTalky() })),
    ...templatedVOpeners(plat.id,time,tone,width)
  ];
  if(edgy){ openers.push(...(plat.sample?.edge||[]).map(t=>({key:`vopen:edge:${plat.id}:${t}`, text:t, bold:t, tags:['virtual','edgy',plat.id,time], risk:'bold', branches: branchesTalky() }))); }
  const hooks = [
    {key:`vhook:prompt`, text:'Mini-prompt tied to her post (Top 3 ___?).', tags:['virtual','talky',plat.id,time], risk:'soft', branches: branchesTalky() },
    {key:`vhook:voice`, text:'Short voice note to escalate tone.', tags:['virtual','voice',plat.id,time], risk:'standard', branches: branchesTalky() },
    ...templatedVHooks(plat.id,time,tone,width)
  ];
  const moves = [
    {key:`vmove:twoOptions`, text:'Offer 2 windows (“Thu 7–9 or Sat afternoon?”).', tags:['virtual','plan',plat.id,time], risk:'soft', branches: branchesGame() },
    ...templatedVMoves(plat.id,time,tone,width)
  ];
  const pivots = [{key:`vpivot:call`, text:'Quick call to vibe-check (8–12).', tags:['virtual','pivot',plat.id,time], risk:'standard', branches: branchesPivot() }];
  const closers = closerOptions(goal,time,null,tone,width).map((t,i)=>({key:`vclose:${goal}:${i}`, text:t, tags:['virtual','close',goal,time], risk:i===0?'standard':'soft', branches: branchesClose() }));
  return { openers, hooks, moves, pivots, closers };
}

/* ---------- templating helpers (lightweight) ---------- */
function vOpen(text,tags,risk,key){ return {key,text,soft:text,tags,risk,branches:branchesTalky()}; }

function templatedOpeners(vt,time,tone,w){
  const pool=[
    `Two options: quiet edge or short walk — pick one.`,
    `We can talk here or grab a better angle — your call.`,
    `Fast take: this spot works. Don’t overthink it.`,
    `Good fit on the vibe. Start with a mini-mission?`,
  ];
  return widen(pool,w).map((t,i)=>({key:`topen:${vt}:${i}`,text:t,tags:['irl','talky',time,vt],risk:'soft',branches:branchesTalky()}));
}
function templatedHooks(vt,time,tone,w){
  const pool=[`One photo each — you pick mine, I pick yours.`,`Rate this room 1–10; what makes it a 10?`,`Pick A or B; don’t explain yet.`];
  return widen(pool,w).map((t,i)=>({key:`thook:${vt}:${i}`,text:t,tags:['irl','talky',vt,time],risk:'soft',branches:branchesTalky()}));
}
function templatedMoves(vt,time,tone,w){
  const pool=[`Two-secret trade — harmless only.`,`Scent test: describe mine in 3 words; I’ll do yours.`,`Pose swap: one shot each; no do-overs.`];
  return widen(pool,w).map((t,i)=>({key:`tmove:${vt}:${i}`,text:t,tags:['irl','game',vt,time],risk:'standard',branches:branchesGame()}));
}
function templatedPivots(vt,time,tone,w){
  const pool=[`Quieter edge in 2 minutes; decide after.`,`Short walk for better light, then choose.`,`Dessert detour nearby (10–15).`];
  return widen(pool,w).map((t,i)=>({key:`tpivot:${vt}:${i}`,text:t,tags:['irl','pivot',vt,time],risk:'soft',branches:branchesPivot()}));
}
function templatedVOpeners(pid,time,tone,w){
  const pool=[`That fit is doing the most — in a good way.`,`Your caption was half-dressed on purpose.`,`This made me laugh; how many takes?`];
  return widen(pool,w).map((t,i)=>({key:`tvopen:${pid}:${i}`,text:t,tags:['virtual','talky',pid,time],risk:'soft',branches:branchesTalky()}));
}
function templatedVHooks(pid,time,tone,w){
  const pool=[`Top 3 __ — go.`,`Voice note me your hot take; I’ll match.`,`Pick Thu 8 or Sun 3 — I’ll adapt.`];
  return widen(pool,w).map((t,i)=>({key:`tvhook:${pid}:${i}`,text:t,tags:['virtual','talky',pid,time],risk:'soft',branches:branchesTalky()}));
}
function templatedVMoves(pid,time,tone,w){
  const pool=[`Story reply → DM pivot; keep it short.`,`Swap one photo each tied to today.`];
  return widen(pool,w).map((t,i)=>({key:`tvmove:${pid}:${i}`,text:t,tags:['virtual','plan',pid,time],risk:'soft',branches:branchesGame()}));
}
function closerOptions(goal,time,cityPack,tone,w){
  const main = cityPack?.main?.[0]?.name || null;
  const now = `Dessert detour (10–15), then bounce. In/Out?`;
  const set = main ? `Thursday ${time==='day'?'3 PM':'9 PM'} @ ${main}. I’ll text details. Yes/No?` : `Lock next: I’ll text two windows.`;
  const vibe = `Swap IG; I’ll send two windows.`;
  const base = goal==='pull_now' ? [now,set,vibe] : goal==='vibe' ? [vibe,set] : [set,now,vibe];
  return widen(base,w);
}
function widen(arr,w){
  // simple expansion by adding minor phrasing variants
  const extras = [
    s=>s.replace('—',' - '),
    s=>s.replace('In/Out?','Yes/No?'),
    s=>s.replace('I’ll','I will'),
    s=>s.replace('then bounce','then we bounce')
  ];
  const out=[...arr];
  if(w>0.3) out.push(...arr.map((s,i)=>extras[i%extras.length](s)));
  if(w>0.6) out.push(...arr.map((s,i)=>s.endsWith('.')?s:s+''));
  return out;
}
function branchesTalky(){ return {green:'Ask one follow-up; escalate.',yellow:'Shorten; pivot to activity.',red:'Drop; reset topic or exit.'}; }
function branchesGame(){ return {green:'Lean in; increase stakes.',yellow:'Keep it quick; lighten.',red:'Skip; move to safer beat.'}; }
function branchesPivot(){ return {green:'Suggest timebox and go.',yellow:'Offer softer pivot.',red:'Abort; choose exit.'}; }
function branchesClose(){ return {green:'Confirm; lock details.',yellow:'Suggest Alt.',red:'Use clean exit.'}; }
