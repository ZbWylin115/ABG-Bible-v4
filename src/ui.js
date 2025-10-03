import { DATA } from '../data/archetypes.js';
import { VENUES } from '../data/venues.js';
import { PLATS } from '../data/platforms.js';
import { ETH } from '../data/ethnicity.js';
import { SIG } from '../data/signals.js';
import { EDGY } from '../data/edgy.js';
import { DISCOVERY } from '../data/discovery.js';

import { CITIES } from '../data/cities/la.js';
import { CITY_VEGAS } from '../data/cities/vegas.js';
import { CITY_HOUSTON } from '../data/cities/houston.js';
import { CITY_SLC } from '../data/cities/slc.js';
import { CITY_NYC } from '../data/cities/nyc.js';
import { CITY_BAY } from '../data/cities/bayarea.js';
import { CITY_SEA } from '../data/cities/seattle.js';

import { generatePlan, rerollBeat, undoBeatOne } from './generator.js';
import { updateFeedback } from './engine/learn.js';
import { saveLastPlan, loadLastPlan } from './engine/state.js';

const cityMap={la:CITIES, vegas:CITY_VEGAS, houston:CITY_HOUSTON, slc:CITY_SLC, nyc:CITY_NYC, bayarea:CITY_BAY, seattle:CITY_SEA};

function $(id){ return document.getElementById(id); }
function populateSelect(el, arr, includeNone=false){
  el.innerHTML=''; if(includeNone){const o=document.createElement('option'); o.value=''; o.textContent='(none)'; el.appendChild(o);}
  arr.forEach(it=>{ const opt=document.createElement('option'); opt.value=it.id||it.name; opt.textContent=it.label||it.name; el.appendChild(opt); });
}
function switchTab(tab){
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById(tab).classList.add('active');
  document.querySelector(`.nav-btn[data-tab="${tab}"]`).classList.add('active');
}
function partyVal(){ const on=document.querySelector('#partySize .chip-active'); return on?.dataset?.val||'solo'; }
function setThermo(mode, signal){
  const fill=$('thermoFill'), lab=$('thermoLabel');
  let pct= mode==='spicy'?78: mode==='safe'?24:50; if(signal==='green') pct+=10; if(signal==='yellow') pct-=8; if(signal==='red') pct-=18;
  fill.style.width=Math.max(12,Math.min(92,pct))+'%';
  lab.textContent= pct>70?'Risk: bold': pct<35?'Risk: chill':'Risk: vibing';
}
function toast(msg){ let t=document.querySelector('.toast'); if(!t){ t=document.createElement('div'); t.className='toast'; t.style.cssText='position:fixed;left:50%;bottom:18px;transform:translateX(-50%);background:#1f1016;color:#f7f2f4;border:1px solid #3a1b26;border-radius:12px;padding:10px 14px;font-weight:600;opacity:0;pointer-events:none;transition:.25s;z-index:99'; document.body.appendChild(t); }
  t.textContent=msg; t.style.opacity='1'; t.style.transform='translateX(-50%) translateY(-6px)'; setTimeout(()=>{t.style.opacity='0'; t.style.transform='translateX(-50%)'},1400);}

let pro={ready:false, base:'http://127.0.0.1:8765', intent:'clear'};

async function detectPro(){
  try{ const r=await fetch(pro.base+'/health'); const j= await r.json(); if(j?.status==='ok'){ pro.ready=true; $('proBadge').hidden=false; } }
  catch{ pro.ready=false; $('proBadge').hidden=true; }
}

export function initUI(){
  // Tabs
  document.querySelectorAll('.nav-btn').forEach(btn=>btn.addEventListener('click',()=>switchTab(btn.dataset.tab)));

  // Selects
  populateSelect($('archetype'), DATA.archetypes);
  populateSelect($('venue'), VENUES.venues);
  populateSelect($('platform'), PLATS.platforms);
  populateSelect($('city'), [
    {id:'la',label:'Los Angeles'},{id:'vegas',label:'Las Vegas'},{id:'houston',label:'Houston'},
    {id:'slc',label:'Salt Lake City'},{id:'nyc',label:'New York City'},{id:'bayarea',label:'Bay Area'},{id:'seattle',label:'Seattle'}
  ]);
  populateSelect($('ethnicity'), ETH.list, true);

  // Find tab
  const dl=$('discover-list');
  dl.innerHTML = DISCOVERY.items.map(x=>`
    <div class="card">
      <h3>${x.label}</h3>
      <p><b>Why:</b> ${x.why}</p>
      <p><b>Best:</b> ${x.best}</p>
      <p><b>Approach:</b> ${x.energy}</p>
      <p><b>Pivot:</b> ${x.pivot}</p>
      <p><b>Avoid:</b> ${x.avoid}</p>
    </div>`).join('');

  // Dirty Dozen (fixed id)
  try{
    const list=(EDGY&&EDGY.moves)?EDGY.moves:[];
    const target=$('dirty-list');
    target.innerHTML = list.length
      ? list.map(m=>`<div class="card">
          <h3>${m.label} <span class="badge">EDGY</span></h3>
          <p>${m.summary}</p>
          <p><strong>Why it works:</strong> ${m.why}</p>
          <p><strong>Risk:</strong> ${m.risk}</p>
          <p><strong>Edge:</strong> ${m.edge}</p>
          <p><strong>Safe:</strong> ${m.safe}</p>
        </div>`).join('')
      : '<p class="small dim">Edgy pack not found. Check <code>data/edgy.js</code>.</p>';
  }catch(e){
    console.error('Dirty Dozen render error:',e);
    $('dirty-list').innerHTML='<p class="small dim">Couldn’t load Dirty Dozen. Verify file paths and bump cache.</p>';
  }

  // Bag tab playbooks
  $('playbooks').innerHTML = `
    <div class="card"><h3>Club → Quiet edge → Late food → Date set</h3>
    <ol><li>Open: *cheers + smile*</li><li>Hook: “Two songs on the edge, then decide?”</li><li>Move: song bet</li><li>Pivot: quiet edge</li><li>Close: “Fries 10–15, then bounce?”</li><li>Alt: “Lock Thu 9.”</li></ol></div>
    <div class="card"><h3>Rooftop → Photo co-direct → Walk → Schedule</h3>
    <ol><li>Open: “Solid call on this spot.”</li><li>Hook: 1–10 + what makes it 10</li><li>Move: pose swap</li><li>Pivot: other side view</li><li>Close: “Thu 9 @ Break Room 86? I’ll text.”</li></ol></div>
    <div class="card"><h3>Café → 1–10 → Bookstore pivot → Early evening</h3>
    <ol><li>Open: coffee/go-to</li><li>Hook: 1–10 game</li><li>Move: two-secret trade</li><li>Pivot: bookstore walk</li><li>Close: “Sun 3? I’ll book.”</li></ol></div>
  `;

  // Signals lists
  const fill=(ul,arr)=>ul&&(ul.innerHTML=arr.map(x=>`<li>${x}</li>`).join(''));
  fill($('signals-irl-baseline'), SIG.irl.baseline);
  fill($('signals-irl-green'), SIG.irl.green);
  fill($('signals-irl-yellow'), SIG.irl.yellow);
  fill($('signals-irl-red'), SIG.irl.red);
  fill($('signals-vir-baseline'), SIG.virtual.baseline);
  fill($('signals-vir-green'), SIG.virtual.green);
  fill($('signals-vir-yellow'), SIG.virtual.yellow);
  fill($('signals-vir-red'), SIG.virtual.red);

  // Channel toggle
  $('channel').addEventListener('change', ()=>{
    const v = $('channel').value==='Virtual';
    $('platform-field').hidden=!v; $('venue-field').hidden=v;
  });
  $('channel').dispatchEvent(new Event('change'));

  // Party size chips
  $('partySize').addEventListener('click',(e)=>{
    const b=e.target.closest('.chip'); if(!b) return;
    document.querySelectorAll('#partySize .chip').forEach(c=>c.classList.remove('chip-active'));
    b.classList.add('chip-active'); b.blur();
  });

  // Outcomes chips
  document.querySelectorAll('.outcome-chips .chip').forEach(c=>c.addEventListener('click',()=>{
    document.querySelectorAll('.outcome-chips .chip').forEach(x=>x.classList.remove('chip-active'));
    c.classList.add('chip-active');
    // only pivot/close will re-score on next generate
    $('goal').value = c.dataset.outcome;
    toast('Outcome updated.');
  }));

  // Buttons
  $('generate').addEventListener('click',()=>onGenerate());
  $('shuffle').addEventListener('click',()=>onGenerate());
  $('copy').addEventListener('click', onCopy);
  $('save').addEventListener('click', onSave);
  $('viewSaved').addEventListener('click', onViewSaved);
  $('closeSaved').addEventListener('click', ()=>$('savedDialog').close());
  $('clearSaved').addEventListener('click', onClearSaved);
  $('nbaCopy').addEventListener('click', ()=>copyText($('nbaText').innerText));

  // Feedback + signals
  document.querySelectorAll('#feedbackBox .chip[data-fb]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const outcome=btn.dataset.fb; const last=loadLastPlan();
      if(!last){ alert('Generate a plan first.'); return; }
      updateFeedback({moveKeys:last.moves||[],outcome});
      toast('Logged. We’ll bias what actually closes.');
    });
  });
  document.querySelectorAll('#feedbackBox .chip[data-sig]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const signal=btn.dataset.sig; const last=loadLastPlan();
      if(!last){ alert('Generate a plan first.'); return; }
      updateFeedback({moveKeys:last.moves||[],outcome:'good',signal});
      setThermo($('mode').value,signal);
      toast(signal==='green'?'Escalate a bit.':'Adjusting.');
      onGenerate(signal);
    });
  });

  // Reroll / Copy / Undo / More
  document.addEventListener('click',(e)=>{
    const rr=e.target.closest('[data-reroll]'); if(rr){ onReroll(rr.dataset.reroll); return; }
    const cp=e.target.closest('[data-copy]'); if(cp){ copyText(cp.dataset.copy); return; }
    const ud=e.target.closest('[data-undo]'); if(ud){ onUndo(ud.dataset.undo); return; }
    const mr=e.target.closest('[data-more]'); if(mr){ onMore(mr.dataset.more); return; }
  });
  $('closeReroll').addEventListener('click',()=>$('rerollDialog').close());

  // Field Kit
  $('fieldKitBtn').addEventListener('click',()=>{ renderKit('momentum'); $('fieldKit').showModal(); });
  $('closeKit').addEventListener('click',()=>$('fieldKit').close());
  document.querySelectorAll('#fieldKit .mini').forEach(b=>b.addEventListener('click',()=>{
    document.querySelectorAll('#fieldKit .mini').forEach(x=>x.classList.remove('active'));
    b.classList.add('active'); renderKit(b.dataset.kit);
  }));

  // Settings
  $('openSettings').addEventListener('click', ()=>{
    alert('Settings are minimal in V4 preview: Persona microcopy later; data export coming soon.');
  });

  // intent defaults & thermo
  setThermo($('mode').value,null);

  // Detect desktop Pro Brain
  detectPro();
}

function getOpts(){
  return {
    channel: $('channel').value,
    archetype: $('archetype').value,
    venue: $('venue').value,
    platform: $('platform').value,
    city: $('city').value,
    time: $('timeOfDay').value,
    interest: $('interest').value,
    edgy: $('edgy').checked,
    includeEth: $('includeEth').checked,
    ethnicity: $('ethnicity').value,
    mode: $('mode').value,
    goal: $('goal').value,
    party: partyVal(),
    tone: $('tone').value,
    slTalky: +$('slTalky').value,
    slPlayful: +$('slPlayful').value,
    slDirect: +$('slDirect').value,
    variant: +$('variantRange').value
  };
}

async function onGenerate(liveSignal=null){
  const opts=getOpts();
  const plan=await generatePlan(opts, pro);
  if(liveSignal) plan.ctx.liveSignal=liveSignal;
  renderOutput(plan);
  setNBA(plan);
  $('feedbackBox').hidden=false;
}
function onReroll(tag){
  const out=$('output'); if(!out.dataset.plan){ alert('Generate first.'); return; }
  const plan=JSON.parse(out.dataset.plan);
  const ctx=plan.ctx;
  const newPlan = rerollBeat(plan, tag, ctx);
  renderOutput(newPlan);
  setNBA(newPlan);
  // show "More" drawer using stored alternates
  if(newPlan._lastAlternates && newPlan._lastAlternates.length){
    $('rerollList').innerHTML = newPlan._lastAlternates.map(m=>`<div class="card"><div>${m.text||m.soft||m.bold}</div><button class="chip" data-more="${tag}::${m.key}">Use this</button></div>`).join('');
    $('rerollDialog').showModal();
  }
}
function onMore(keystr){
  const [tag,key]=keystr.split('::');
  const out=$('output'); const plan=JSON.parse(out.dataset.plan);
  const poolMap={'Open':'openers','Hook':'hooks','Move':'moves','Pivot':'pivots','Close':'closers'};
  const pool=plan._pool[poolMap[tag]]||[];
  const cand=pool.find(x=>x.key===key); if(!cand) return $('rerollDialog').close();
  // replace directly
  const idx={'Close':0,'Pivot':1,'Move':2,'Hook':3,'Open':4}[tag];
  if(tag==='Open') plan.beats[idx]={tag:'Open',soft:cand.soft||cand.text,standard:cand.standard||null,bold:cand.bold||null,key:cand.key,chosen:'soft',branches:cand.branches||{}};
  if(tag==='Hook') plan.beats[idx]={tag:'Hook',advice:[cand.text],key:cand.key,chosen:'advice',branches:cand.branches||{}};
  if(tag==='Move') plan.beats[idx]={tag:'Move',micro:[cand.text],key:cand.key,chosen:'micro',branches:cand.branches||{}};
  if(tag==='Pivot') plan.beats[idx]={tag:'Pivot',options:[cand.text],key:cand.key,chosen:'option',branches:cand.branches||{}};
  if(tag==='Close') plan.beats[idx]={tag:'Close',options:cand.text?[cand.text]:(cand.options||[]),key:cand.key,chosen:'close',branches:cand.branches||{}};
  renderOutput(plan); setNBA(plan); $('rerollDialog').close();
}
function onUndo(tag){
  const out=$('output'); if(!out.dataset.plan){ alert('Generate first.'); return; }
  const plan=JSON.parse(out.dataset.plan);
  const newPlan=undoBeatOne(plan, tag);
  renderOutput(newPlan); setNBA(newPlan);
}
async function onCopy(){ copyText($('output').innerText); }
async function copyText(txt){ try{ await navigator.clipboard.writeText(txt); toast('Copied.'); }catch{ alert('Copy failed.'); } }
function onSave(){
  const out=$('output'); if(!out.dataset.plan){ alert('Generate first.'); return; }
  const plan=JSON.parse(out.dataset.plan);
  const list=JSON.parse(localStorage.getItem('abg_saved')||'[]'); plan.savedAt=new Date().toISOString(); list.push(plan);
  localStorage.setItem('abg_saved', JSON.stringify(list)); toast('Saved.');
}
function onViewSaved(){
  const list=JSON.parse(localStorage.getItem('abg_saved')||'[]');
  $('savedList').innerHTML = !list.length ? '<p class="small dim">No saved plans yet.</p>' :
    list.map(p=>`<div class="card"><div class="small dim">${new Date(p.savedAt).toLocaleString()}</div><div>${p.scene}</div></div>`).join('');
  $('savedDialog').showModal();
}
function onClearSaved(){ if(confirm('Clear all saved plans?')){ localStorage.removeItem('abg_saved'); $('savedList').innerHTML='<p class="small dim">Cleared.</p>'; } }

function renderBeats(plan){
  const beats=plan.beats||[]; return beats.map(b=>{
    const lines=[];
    lines.push(`<h4>${b.tag}</h4>`);
    lines.push(`<div class="small dim">Picked because: ${plan.why}</div>`);
    lines.push(`<div class="beat-actions">
      <button class="chip" data-reroll="${b.tag}">🎲 Swap</button>
      <button class="chip" data-undo="${b.tag}">↩ Undo</button>
      <button class="chip" data-copy="${textForCopy(b)}">Copy</button>
    </div>`);
    if(b.soft||b.standard||b.bold){
      lines.push('<ul>'); if(b.soft) lines.push(`<li><strong>Soft:</strong> ${b.soft}</li>`); if(b.standard) lines.push(`<li><strong>Standard:</strong> ${b.standard}</li>`); if(b.bold) lines.push(`<li><span class="badge">Bold</span> ${b.bold}</li>`); lines.push('</ul>');
    }
    if(b.advice)  lines.push('<ul>'+b.advice.map(a=>`<li>${a}</li>`).join('')+'</ul>');
    if(b.micro)   lines.push('<ul>'+b.micro.map(m=>`<li>${m}</li>`).join('')+'</ul>');
    if(b.options) lines.push('<ul>'+b.options.map(o=>`<li>${o}</li>`).join('')+'</ul>');
    if(b.branches){
      lines.push('<div class="branch">');
      lines.push(`<button class="mini">🟢 ${b.branches.green||'Escalate'}</button>`);
      lines.push(`<button class="mini">🟡 ${b.branches.yellow||'Coast'}</button>`);
      lines.push(`<button class="mini">🔴 ${b.branches.red||'Exit'}</button>`);
      lines.push('</div>');
    }
    return `<div class="beat">${lines.join('')}</div>`;
  }).join('');
}
function textForCopy(b){
  if(b.soft||b.standard||b.bold) return (b.bold||b.standard||b.soft)||'';
  if(b.advice) return b.advice.join(' • ');
  if(b.micro) return b.micro.join(' • ');
  if(b.options) return b.options.join(' • ');
  return '';
}
function renderOutput(plan){
  const out=$('output');
  out.innerHTML = `
    <div class="small dim">Outcome-first: Close → Pivot → Move → Hook → Open</div>
    <h3>Close</h3>${renderBeats({beats:[plan.beats[0]]})}
    <h3>Pivot</h3>${renderBeats({beats:[plan.beats[1]]})}
    <h3>Move</h3>${renderBeats({beats:[plan.beats[2]]})}
    <h3>Hook</h3>${renderBeats({beats:[plan.beats[3]]})}
    <h3>Open</h3>${renderBeats({beats:[plan.beats[4]]})}
    ${plan.cityNote?`<h3>Local Note</h3><p>${plan.cityNote}</p>`:''}
    ${plan.ethNote?`<h3>Context</h3><p>${plan.ethNote}</p>`:''}
    <h3>Do</h3><ul>${plan.do.map(x=>`<li>${x}</li>`).join('')}</ul>
    <h3>Don’t</h3><ul>${plan.dont.map(x=>`<li>${x}</li>`).join('')}</ul>`;
  out.dataset.plan=JSON.stringify(plan);
  saveLastPlan(plan);
}
function setNBA(plan){
  const next = plan.beats?.[3]?.advice?.[0] || 'Say the Hook now.';
  $('nbaText').textContent = next;
}

function renderKit(which){
  const kits = {
    momentum: [
      'Rate-it-quick (1–10) + “what makes it 10?”',
      'Two-secret trade — harmless only.',
      'Pose swap — one shot each.'
    ],
    pivots: ['Quiet edge in 2 minutes.', 'Short walk for better light.', 'Dessert detour (10–15).'],
    closers: ['Lock Thu 9 @ [spot].', 'Dessert 10–15 now.', 'Swap IG; I’ll send two windows.']
  };
  $('kitContent').innerHTML = (kits[which]||[]).map(t=>`<div class="card"><div>${t}</div></div>`).join('');
}
