const KEY = 'abg_v4_intro_seen';
function tpl(){
  return `
  <dialog id="introDialog">
    <h2>How to use this app (30s)</h2>
    <ul>
      <li><b>Outcome-first:</b> plan shows the finish first.</li>
      <li><b>Signals lead:</b> 🟢 escalate • 🟡 coast • 🔴 stop.</li>
      <li><b>App is blunt, you don’t have to be.</b></li>
      <li><b>Offline & private:</b> learning stays on your device.</li>
    </ul>
    <div class="dialog-actions">
      <button id="introSignals">View Signals</button>
      <button id="introClose">Got it</button>
    </div>
  </dialog>`;
}
function mount(){
  if(document.getElementById('introDialog')) return;
  document.body.insertAdjacentHTML('beforeend', tpl());
  const dlg = document.getElementById('introDialog');
  document.getElementById('introClose').onclick = ()=>{ dlg.close(); localStorage.setItem(KEY,'1'); };
  document.getElementById('introSignals').onclick = ()=>{
    dlg.close(); localStorage.setItem(KEY,'1');
    document.querySelector('.nav-btn[data-tab="bag"]')?.click();
  };
  document.getElementById('showIntro')?.addEventListener('click', ()=>dlg.showModal());
  if(!localStorage.getItem(KEY)) dlg.showModal();
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', mount); else mount();
