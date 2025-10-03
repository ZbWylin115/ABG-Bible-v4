import { DATA } from '../data/archetypes.js';
import { VENUES } from '../data/venues.js';
import { PLATS } from '../data/platforms.js';
import { ETH } from '../data/ethnicity.js';

import { CITIES } from '../data/cities/la.js';
import { CITY_VEGAS } from '../data/cities/vegas.js';
import { CITY_HOUSTON } from '../data/cities/houston.js';
import { CITY_SLC } from '../data/cities/slc.js';
import { CITY_NYC } from '../data/cities/nyc.js';
import { CITY_BAY } from '../data/cities/bayarea.js';
import { CITY_SEA } from '../data/cities/seattle.js';

import { buildContext } from './engine/context.js';
import { buildCandidates } from './engine/candidates.js';
import { buildPlan, rerollBeat as reroll, undoBeat } from './engine/planner.js';
import { saveLastPlan } from './engine/state.js';

const CITY_MAP={la:CITIES, vegas:CITY_VEGAS, houston:CITY_HOUSTON, slc:CITY_SLC, nyc:CITY_NYC, bayarea:CITY_BAY, seattle:CITY_SEA};

export async function generatePlan(opts, pro){
  const arch = DATA.archetypes.find(a=>a.id===opts.archetype) || DATA.archetypes[0];
  const ven  = VENUES.venues.find(v=>v.id===opts.venue) || VENUES.venues[0];
  const plat = PLATS.platforms.find(p=>p.id===opts.platform) || PLATS.platforms[0];
  const eth  = ETH.list.find(e=>e.id===opts.ethnicity);
  const cityPack = CITY_MAP[opts.city];

  const ctx = buildContext(opts, arch, ven, plat, cityPack, eth);
  let pool;
  if(pro?.ready){
    try{
      const res=await fetch(pro.base+'/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
        context:{channel:opts.channel,venue:ven.id,noise:ctx.noise,flow:ctx.flow,time:opts.time,city:opts.city,party:opts.party,interest:opts.interest,mode:opts.mode,goal:opts.goal,tone:opts.tone,intent:pro.intent||'clear',sliders:{talky:opts.slTalky,playful:opts.slPlayful,direct:opts.slDirect}},
        variant_budget:{open:40,hook:40,move:30,pivot:30,close:40},
        diversity: Math.max(0.2, Math.min(0.8, opts.variant||0.4))
      })});
      if(res.ok){ const data=await res.json(); pool=data.beats; }
    }catch(e){ console.warn('Pro generate failed; fallback.', e); }
  }
  if(!pool) pool=buildCandidates({opts, arch, ven, plat, cityPack});

  const plan = buildPlan({pool, ctx});
  plan._pool = pool;
  saveLastPlan(plan);
  return plan;
}

export function rerollBeat(plan, tag, ctx){ const newPlan=reroll(plan, tag, ctx, 3); saveLastPlan(newPlan); return newPlan; }
export function undoBeatOne(plan, tag){ const p=undoBeat(plan, tag); saveLastPlan(p); return p; }
