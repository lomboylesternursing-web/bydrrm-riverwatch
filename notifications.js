(()=>{
  const PREF_KEY='bydrrm-riverwatch-notification-pref-v1';
  const SEEN_KEY='bydrrm-riverwatch-notification-seen-v1';
  const SCAN_MS=10000;
  let pref={enabled:false,mode:'urgent'};
  let notified={};
  try{pref={...pref,...JSON.parse(localStorage.getItem(PREF_KEY)||'{}')};}catch{}
  try{notified=JSON.parse(localStorage.getItem(SEEN_KEY)||'{}')||{};}catch{}
  const $=id=>document.getElementById(id);
  const officialSource=r=>/PDRRMO|PhilSensors|PAGASA|PRFFWC|MDRRMO|PDRRMC/i.test(String(r?.source||''));
  const eligible=r=>!!r&&!r.demo&&(officialSource(r)||r?.verification?.verified||/BYDRRM Verified Field Observation/i.test(String(r?.source||'')));
  const urgent=s=>['WATCH','ALARM','CRITICAL'].includes(String(s||''));
  const keyFor=(id,r)=>`${id}|${r?.time||''}|${Number(r?.level)}|${r?.source||''}`;
  const statusLabel=s=>(s||'READING_ONLY').replaceAll('_',' ');
  const fmtTime=v=>{const d=new Date(v);return Number.isNaN(d.getTime())?String(v||'time unavailable'):d.toLocaleString([],{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});};

  const style=document.createElement('style');
  style.textContent=`
    .rw-notify-pill{display:inline-flex;align-items:center;gap:7px;border:1px solid #1f3a54;background:#0a1929;color:#c8dceb;padding:8px 11px;border-radius:999px;font-size:11px;font-weight:800;cursor:pointer}.rw-notify-pill.on{border-color:#27745f;color:#a8f3dd}.rw-notify-pill.warn{border-color:#796826;color:#ffe08b}.rw-notify-dialog{border:1px solid #2a5879;border-radius:18px;background:#0b1a2a;color:#edf6ff;padding:0;width:min(580px,94vw)}.rw-notify-dialog::backdrop{background:#000a}.rw-notify-modal{padding:20px}.rw-notify-modal h2{margin:0}.rw-notify-sub{font-size:12px;color:#8ca7bf;line-height:1.55;margin-top:5px}.rw-notify-status{margin:13px 0;padding:11px;border:1px solid #234b6a;border-radius:11px;background:#0b2238;font-size:11px;line-height:1.55}.rw-notify-actions{display:flex;gap:8px;flex-wrap:wrap}.rw-notify-note{margin-top:12px;font-size:10px;color:#8ca7bf;line-height:1.5}.rw-notify-modes{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin:12px 0}.rw-notify-mode{border:1px solid #1f3a54;background:#081827;border-radius:12px;padding:11px;cursor:pointer}.rw-notify-mode.active{border-color:#3496d1;background:#0d2d46}.rw-notify-mode b{display:block;font-size:12px}.rw-notify-mode span{display:block;font-size:10px;color:#8ca7bf;margin-top:3px;line-height:1.45}@media(max-width:560px){.rw-notify-modes{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  const toolbar=document.querySelector('.toolbar');
  const btn=document.createElement('button');btn.className='rw-notify-pill';btn.id='rwNotifyBtn';
  if(toolbar)toolbar.appendChild(btn);
  const dlg=document.createElement('dialog');dlg.className='rw-notify-dialog';dlg.id='rwNotifyDialog';
  dlg.innerHTML=`<div class="rw-notify-modal"><h2>🔔 RiverWatch Notifications</h2><div class="rw-notify-sub">Get notified when a new official or verified water-level reading becomes actionable in RiverWatch. Demo and unverified readings never trigger alerts.</div><div id="rwNotifyStatus" class="rw-notify-status"></div><div class="rw-notify-modes"><button class="rw-notify-mode" id="rwNotifyUrgent"><b>Urgent only</b><span>Notify only for WATCH / ALARM / CRITICAL readings.</span></button><button class="rw-notify-mode" id="rwNotifyAll"><b>All actionable updates</b><span>Notify for every new official or verified reading.</span></button></div><div class="rw-notify-actions"><button class="btn primary" id="rwNotifyEnable">Enable notifications</button><button class="btn" id="rwNotifyTest">Send test</button><button class="btn danger" id="rwNotifyDisable">Turn off</button><button class="btn" id="rwNotifyClose">Close</button></div><div class="rw-notify-note">Current browser-alert mode works while RiverWatch is open or running in the background. A future push-service upgrade is required for guaranteed alerts after the site/PWA is fully closed.</div></div>`;
  document.body.appendChild(dlg);

  function savePref(){localStorage.setItem(PREF_KEY,JSON.stringify(pref));}
  function saveSeen(){const entries=Object.entries(notified).sort((a,b)=>String(b[1]).localeCompare(String(a[1]))).slice(0,500);notified=Object.fromEntries(entries);localStorage.setItem(SEEN_KEY,JSON.stringify(notified));}
  function currentPermission(){return 'Notification' in window?Notification.permission:'unsupported';}
  function render(){
    const perm=currentPermission();
    btn.className='rw-notify-pill'+(pref.enabled&&perm==='granted'?' on':perm==='denied'?' warn':'');
    btn.textContent=pref.enabled&&perm==='granted'?`🔔 Alerts: ${pref.mode==='urgent'?'Urgent':'All'}`:perm==='denied'?'🔕 Alerts blocked':'🔔 Alerts off';
    $('rwNotifyUrgent').classList.toggle('active',pref.mode==='urgent');$('rwNotifyAll').classList.toggle('active',pref.mode==='all');
    let text='Notifications are off.';
    if(perm==='unsupported')text='This browser does not expose the Notification API. RiverWatch queue and cloud monitoring still work.';
    else if(perm==='denied')text='Notifications are blocked in this browser/site settings. Change the site notification permission to enable alerts.';
    else if(pref.enabled&&perm==='granted')text=`Notifications are ON — ${pref.mode==='urgent'?'WATCH / ALARM / CRITICAL only':'all new official/verified readings'}.`;
    else if(perm==='granted')text='Permission is granted, but RiverWatch alerts are currently turned off.';
    $('rwNotifyStatus').textContent=text;
  }
  function baseline(){for(const s of STATIONS){const r=typeof latest==='function'?latest(s.id):null;if(eligible(r))notified[keyFor(s.id,r)]=new Date().toISOString();}saveSeen();}
  function trend(id){if(typeof rateOfRise!=='function')return'Trend unavailable';const rr=rateOfRise(id);if(rr===null)return'Trend unavailable';if(Math.abs(rr)<.005)return'→ Stable';return rr>0?`↑ Rising ${(Math.abs(rr)*100).toFixed(1)} cm/hr`:`↓ Falling ${(Math.abs(rr)*100).toFixed(1)} cm/hr`;}
  function titleFor(s,r){const st=r.status||'READING_ONLY';if(st==='CRITICAL')return`🚨 CRITICAL • ${s.name}`;if(st==='ALARM')return`⚠️ ALARM • ${s.name}`;if(st==='WATCH')return`⚠️ WATCH • ${s.name}`;return`🌊 New RiverWatch Reading • ${s.name}`;}
  function bodyFor(s,r){return`${Number(r.level).toFixed(2)} m • ${trend(s.id)} • ${statusLabel(r.status)}\n${fmtTime(r.time)} • ${r.source||'Source unavailable'}`;}
  async function show(title,options){
    if(currentPermission()!=='granted')return false;
    try{if('serviceWorker'in navigator){const reg=await navigator.serviceWorker.ready;await reg.showNotification(title,{icon:'./icon.svg',badge:'./icon.svg',...options});return true;}}catch{}
    try{new Notification(title,options);return true;}catch{return false;}
  }
  async function scan(){
    if(!pref.enabled||currentPermission()!=='granted')return;
    let changed=false;
    for(const s of STATIONS){
      const r=typeof latest==='function'?latest(s.id):null;if(!eligible(r))continue;
      const k=keyFor(s.id,r);if(notified[k])continue;
      notified[k]=new Date().toISOString();changed=true;
      if(pref.mode==='urgent'&&!urgent(r.status))continue;
      await show(titleFor(s,r),{body:bodyFor(s,r),tag:`riverwatch-${s.id}`,renotify:urgent(r.status),data:{url:location.href,stationId:s.id,status:r.status||'READING_ONLY'}});
    }
    if(changed)saveSeen();
  }
  async function enable(){
    if(!('Notification'in window)){render();return;}
    let permission=Notification.permission;
    if(permission==='default')permission=await Notification.requestPermission();
    if(permission==='granted'){const wasEnabled=pref.enabled;pref.enabled=true;savePref();if(!wasEnabled)baseline();render();await show('🌊 RiverWatch alerts enabled',{body:`Mode: ${pref.mode==='urgent'?'WATCH / ALARM / CRITICAL only':'all new official/verified updates'}`,tag:'riverwatch-test-enabled',data:{url:location.href}});}else render();
  }
  btn.onclick=()=>{render();dlg.showModal();};
  $('rwNotifyClose').onclick=()=>dlg.close();
  $('rwNotifyEnable').onclick=enable;
  $('rwNotifyDisable').onclick=()=>{pref.enabled=false;savePref();render();};
  $('rwNotifyUrgent').onclick=()=>{pref.mode='urgent';savePref();render();};
  $('rwNotifyAll').onclick=()=>{pref.mode='all';savePref();render();};
  $('rwNotifyTest').onclick=async()=>{if(currentPermission()!=='granted'){await enable();return;}await show('🌊 RiverWatch test notification',{body:'Notifications are working on this device.',tag:'riverwatch-manual-test',data:{url:location.href}});};
  window.addEventListener('riverwatch:cloud-merged',scan);
  window.addEventListener('riverwatch:verified-reading',()=>setTimeout(scan,250));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)scan();});
  setInterval(scan,SCAN_MS);
  render();
})();