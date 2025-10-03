import { loadStore, saveStore } from './state.js';
function ensure(store,key){ if(!store.bandit) store.bandit={}; if(!store.bandit[key]) store.bandit[key]={s:0,n:0}; return store.bandit[key]; }
export function updateFeedback({moveKeys=[],outcome='meh',signal=null}){
  const store=loadStore(); const delta= outcome==='great'?1: outcome==='good'?0.5:0; const sig= signal==='green'?0.25: signal==='yellow'?-0.1: signal==='red'?-0.3:0;
  moveKeys.forEach(k=>{const arm=ensure(store,k); arm.n+=1; arm.s+=delta+sig;});
  saveStore(store);
}
export function banditBoost(key){const store=loadStore(); const arm=store.bandit?.[key]; if(!arm||arm.n===0) return 0; const rate=arm.s/arm.n; return Math.max(-0.2,Math.min(0.4,(rate-0.3)*0.5));}
