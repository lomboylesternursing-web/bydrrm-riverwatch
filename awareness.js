(()=>{
  const SEEN_KEY='bydrrm-riverwatch-awareness-seen-v1';
  const SOURCE_KEY='bydrrm-riverwatch-awareness-source-v1';
  const AUTO_REFRESH_MS=60000;
  let seen={};
  let sourceMeta=null;
  try{seen=JSON.parse(localStorage.getItem(SEEN_KEY)||'{}')||{};}catch{seen={};}
  try{sourceMeta=JSON.parse(localStorage.getItem(SOURCE_KEY)||'null');}catch{sourceMeta=null;}
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const $=id=>document.getElementById(id);
  const dt=v=>{const d=new Date(v);return Number.isNaN(d.getTime())?null:d;};
  const timeLabel=v=>{const d=dt(v);return d?d.toLocaleString([],{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):String(v||'Time unavailable');};
  const officialSource=r=>/PDRRMO|PhilSensors|PAGASA|PRFFWC|MDRRMO|PDRRMC/i.test(String(r?.source||''));
  const eligible=r=>!!r&&!r.demo&&(officialSource(r)||r?.verification?.verified||/BYDRRM Verified Field Observation/i.test(String(r?.source||'')));
  const keyFor=(id,r)=>`${id}|${r?.time||''}|${Number(r?.level)}|${r?.source||''}`;
  const statusRank=s=>({CRITICAL:5,ALARM:4,WATCH:3,NORMAL:2,READING_ONLY:1,NO_DATA:0})[s]||1;
  const statusLabel=s=>(s||'READING_ONLY').replaceAll('_',' ');
  const statusTone=s=>({CRITICAL:'critical',ALARM:'alarm',WATCH:'watch',NORMAL:'normal',READING_ONLY:'reading'})[s]||'reading';
  const sourceBadge=r=>officialSource(r)?'OFFICIAL SOURCE':'VERIFIED FIELD';
  const readingNow=id=>{const r=typeof latest==='function'?latest(id):null;return eligible(r)?r:null;};

  const style=document.createElement('style');
  style.textContent=`
    .rw-awareness{margin:14px 0 18px;background:linear-gradient(145deg,#0d2135,#081724);border:1px solid #2b5a7a;border-radius:18px;padding:16px}.rw-awareness-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap}.rw-awareness h2{margin:0;font-size:20px}.rw-awareness-sub{margin-top:4px;color:#8fa9be;font-size:12px;line-height:1.55;max-width:850px}.rw-awareness-stats{display:flex;gap:8px;flex-wrap:wrap}.rw-awareness-stat{border:1px solid #244660;background:#0a1929;border-radius:12px;padding:8px 11px;min-width:95px}.rw-awareness-stat b{font-size:18px;display:block}.rw-awareness-stat span{font-size:9px;color:#8fa9be;text-transform:uppercase;letter-spacing:.5px}.rw-awareness-source{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:11px;padding:9px 11px;border:1px solid #1e4059;background:#081a2a;border-radius:11px;font-size:11px;color:#a9c1d3}.rw-awareness-dot{width:8px;height:8px;border-radius:50%;background:#7f91a4}.rw-awareness-dot.on{background:#2dd4a8}.rw-awareness-dot.warn{background:#ffd166}.rw-awareness-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.rw-queue{display:grid;gap:9px;margin-top:13px}.rw-qcard{border:1px solid #1f3a54;background:#091827;border-radius:14px;padding:13px}.rw-qcard.critical{border-color:#7b3044}.rw-qcard.alarm{border-color:#7a4b27}.rw-qcard.watch{border-color:#756329}.rw-qtop{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.rw-qname{font-weight:850;font-size:14px}.rw-qplace{font-size:10px;color:#8fa9be;margin-top:2px}.rw-qbadges{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}.rw-qbadge{font-size:9px;font-weight:900;letter-spacing:.35px;padding:5px 7px;border-radius:999px;border:1px solid #34516a;color:#bdd5e7;background:#10263a}.rw-qbadge.CRITICAL{border-color:#8a344a;color:#ff9bad;background:#4d1b29}.rw-qbadge.ALARM{border-color:#86512b;color:#ffbd7a;background:#4d2e12}.rw-qbadge.WATCH{border-color:#796826;color:#ffe08b;background:#403512}.rw-qbadge.NEW{color:#91d7ff;border-color:#28668c;background:#0d314c}.rw-qbody{display:grid;grid-template-columns:.7fr .9fr 1.2fr;gap:12px;margin-top:11px;align-items:end}.rw-qmetric b{display:block;font-size:22px}.rw-qmetric span{font-size:10px;color:#8fa9be}.rw-qtrend{font-size:12px;font-weight:700;color:#c9deec}.rw-qmeta{font-size:10px;color:#8fa9be;line-height:1.5}.rw-qactions{display:flex;gap:7px;flex-wrap:wrap;margin-top:11px}.rw-qcaption{margin-top:8px;padding:9px 10px;border:1px solid #1f3a54;border-radius:10px;background:#061522;color:#a9c0d2;font-size:10px;white-space:pre-wrap;display:none}.rw-qcaption.show{display:block}.rw-qempty{border:1px dashed #31516b;border-radius:13px;padding:18px;text-align:center;color:#8fa9be;font-size:12px;line-height:1.55}@media(max-width:700px){.rw-qbody{grid-template-columns:1fr 1fr}.rw-qmeta{grid-column:1/-1}}
  `;
  document.head.appendChild(style);

  const sourceHealth=document.querySelector('.source-health');
  const section=document.createElement('section');section.className='rw-awareness';section.id='rwAwareness';
  section.innerHTML=`<div class="rw-awareness-head"><div><h2>⚡ Awareness Queue</h2><div class="rw-awareness-sub">RiverWatch checks the latest official snapshot automatically and turns new official or verified readings into ready-to-review posting drafts. Volunteers should mostly review → prepare graphic → post; manual entry is only a fallback.</div></div><div class="rw-awareness-stats"><div class="rw-awareness-stat"><b id="rwQueueCount">0</b><span>Needs review</span></div><div class="rw-awareness-stat"><b id="rwUrgentCount">0</b><span>Alert / higher</span></div><div class="rw-awareness-stat"><b id="rwReadyCount">0</b><span>Ready to draft</span></div></div></div><div id="rwAwarenessSource" class="rw-awareness-source"><span class="rw-awareness-dot"></span><span>Checking automatic source snapshot…</span></div><div class="rw-awareness-actions"><button class="btn primary" id="rwAwarenessRefresh">↻ Check now</button><button class="btn" id="rwShowReviewed">Show reviewed</button><button class="btn" id="rwOpenPosting">Open Posting Studio</button></div><div id="rwQueue" class="rw-queue"></div>`;
  if(sourceHealth) sourceHealth.parentNode.insertBefore(section,sourceHealth.nextSibling); else document.querySelector('main')?.prepend(section);

  let showReviewed=false;
  function saveSeen(){localStorage.setItem(SEEN_KEY,JSON.stringify(seen));}
  function markSeen(k){seen[k]={reviewedAt:new Date().toISOString()};saveSeen();refreshQueue();}
  function unmarkSeen(k){delete seen[k];saveSeen();refreshQueue();}

  function draftCaption(s,r){
    const st=r.status||'READING_ONLY',rr=typeof rateOfRise==='function'?rateOfRise(s.id):null;
    const trend=rr===null?'Trend unavailable':Math.abs(rr)<.005?'→ Stable':rr>0?`↑ Rising ${(Math.abs(rr)*100).toFixed(1)} cm/hr`:`↓ Falling ${(Math.abs(rr)*100).toFixed(1)} cm/hr`;
    const classification=st==='READING_ONLY'?'READING ONLY — no official warning threshold applied':statusLabel(st);
    return `🌊 BYDRRM RIVERWATCH\n\nWATER LEVEL MONITORING UPDATE\n${s.name} — ${s.municipality}, Bulacan\n\nWater level: ${Number(r.level).toFixed(2)} m\nTrend: ${trend}\nStatus: ${classification}\nAs of: ${timeLabel(r.time)}\nSource: ${r.source||'Source unavailable'}\n\nFor situational awareness only. Water-level observations do not establish structural bridge safety. Follow official government advisories.`;
  }

  function headlineFor(st){if(st==='CRITICAL')return'CRITICAL WATER LEVEL UPDATE';if(st==='ALARM')return'WATER LEVEL ALARM UPDATE';if(st==='WATCH')return'WATER LEVEL ALERT';return'WATER LEVEL MONITORING UPDATE';}
  function ensureStudioStatus(st){const sel=$('studioStatus');if(!sel)return;if(![...sel.options].some(o=>o.value===st)){const o=document.createElement('option');o.value=st;o.textContent=statusLabel(st);sel.appendChild(o);}}
  function prepareStudio(id){
    const s=STATIONS.find(x=>x.id===Number(id)),r=readingNow(Number(id));if(!s||!r)return;
    const st=r.status||'READING_ONLY';ensureStudioStatus(st);
    const values={studioStation:String(id),studioStatus:st,studioLevel:Number(r.level).toFixed(2),studioHeadline:headlineFor(st),studioTime:timeLabel(r.time),studioSource:r.source||'',studioNote:r.note||''};
    const rr=typeof rateOfRise==='function'?rateOfRise(Number(id)):null;values.studioRate=rr===null?'':(rr*100).toFixed(1);
    Object.entries(values).forEach(([eid,val])=>{const el=$(eid);if(el){el.value=val;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}});
    if(typeof renderStudio==='function')renderStudio();
    const studio=[...document.querySelectorAll('.section-title')].find(x=>x.textContent.includes('Posting Studio'))||document.querySelector('.studio');
    studio?.scrollIntoView({behavior:'smooth',block:'start'});
  }

  function queueItems(){
    const out=[];
    for(const s of STATIONS){const r=readingNow(s.id);if(!r||!Number.isFinite(Number(r.level)))continue;const k=keyFor(s.id,r),st=r.status||'READING_ONLY',rr=typeof rateOfRise==='function'?rateOfRise(s.id):null;const isNew=!seen[k];let priority=statusRank(st);if(rr!==null&&rr>.005)priority+=.5;out.push({s,r,k,st,rr,isNew,priority,reviewed:!!seen[k]});}
    return out.sort((a,b)=>b.priority-a.priority||new Date(b.r.time)-new Date(a.r.time));
  }

  function refreshQueue(){
    const items=queueItems();const visible=items.filter(x=>showReviewed||!x.reviewed);const urgent=items.filter(x=>!x.reviewed&&['WATCH','ALARM','CRITICAL'].includes(x.st)).length;const ready=items.filter(x=>!x.reviewed).length;
    $('rwQueueCount').textContent=items.filter(x=>!x.reviewed).length;$('rwUrgentCount').textContent=urgent;$('rwReadyCount').textContent=ready;
    if(!visible.length){$('rwQueue').innerHTML=`<div class="rw-qempty">${items.length&&!showReviewed?'All current items have been reviewed.':'No actionable official/verified river reading is loaded right now.'}<br>RiverWatch will keep checking the public official snapshot automatically. Manual field updates remain available only as backup.</div>`;return;}
    $('rwQueue').innerHTML=visible.map(({s,r,k,st,rr,isNew,reviewed})=>{const trend=rr===null?'Trend unavailable':typeof trendText==='function'?trendText(s.id):`${(rr*100).toFixed(1)} cm/hr`;const caption=draftCaption(s,r);return `<article class="rw-qcard ${statusTone(st)}" data-key="${esc(k)}"><div class="rw-qtop"><div><div class="rw-qname">${esc(s.name)}</div><div class="rw-qplace">${esc(s.municipality)} • ${esc(s.location)}</div></div><div class="rw-qbadges">${isNew?'<span class="rw-qbadge NEW">NEW</span>':''}<span class="rw-qbadge ${esc(st)}">${esc(statusLabel(st))}</span><span class="rw-qbadge">${esc(sourceBadge(r))}</span></div></div><div class="rw-qbody"><div class="rw-qmetric"><b>${Number(r.level).toFixed(2)} m</b><span>WATER LEVEL</span></div><div><div class="rw-qtrend">${esc(trend)}</div><div class="rw-qmeta">Trend is descriptive only; official warning categories come from official thresholds/advisories.</div></div><div class="rw-qmeta">${esc(timeLabel(r.time))}<br>${esc(r.source||'Source unavailable')}</div></div><div class="rw-qactions"><button class="btn primary" data-action="prepare" data-id="${s.id}">Prepare Graphic</button><button class="btn" data-action="copy" data-id="${s.id}">Copy Caption</button><button class="btn" data-action="preview">Preview Draft</button><button class="btn" data-action="review">${reviewed?'Mark unreviewed':'Mark reviewed'}</button></div><div class="rw-qcaption">${esc(caption)}</div></article>`;}).join('');
    $('rwQueue').querySelectorAll('[data-action]').forEach(btn=>btn.onclick=async()=>{const card=btn.closest('.rw-qcard'),k=card?.dataset.key,action=btn.dataset.action,id=Number(btn.dataset.id||0);if(action==='prepare'){prepareStudio(id);}else if(action==='copy'){const s=STATIONS.find(x=>x.id===id),r=readingNow(id);if(s&&r){try{await navigator.clipboard.writeText(draftCaption(s,r));btn.textContent='Copied!';setTimeout(()=>btn.textContent='Copy Caption',1100);}catch{}}}else if(action==='preview'){card.querySelector('.rw-qcaption')?.classList.toggle('show');}else if(action==='review'){if(seen[k])unmarkSeen(k);else markSeen(k);}});
  }

  function sourceState(meta){
    const box=$('rwAwarenessSource');if(!box)return;const p=(meta?.sources||[]).find(x=>x.name==='Bulacan PDRRMO');const generated=dt(meta?.generatedAt);const mins=generated?Math.max(0,(Date.now()-generated.getTime())/60000):null;let cls='on',msg='Automatic scanner connected';if(!p?.ok){cls='warn';msg='Official source snapshot unavailable';}else if(mins!==null&&mins>35){cls='warn';msg='Official snapshot is older than expected';}const records=p?.river_records??0;box.innerHTML=`<span class="rw-awareness-dot ${cls}"></span><span><b>${esc(msg)}</b> • public snapshot river records: ${records} • repository snapshot: ${generated?esc(generated.toLocaleString()):'time unavailable'} • browser checks every 60 seconds</span>`;
  }

  async function autoSync(silent=true){
    const btn=$('rwAwarenessRefresh');if(!silent){btn.disabled=true;btn.textContent='Checking…';}
    try{
      const res=await fetch('./official-data.json?aw='+Date.now(),{cache:'no-store'});if(!res.ok)throw new Error('HTTP '+res.status);const data=await res.json();sourceMeta=data;localStorage.setItem(SOURCE_KEY,JSON.stringify(data));let added=0;
      for(const o of data.readings||[]){if(!o.stationId||o.level==null||!o.time)continue;const id=Number(o.stationId),level=Number(o.level),when=dt(o.time);if(!when)continue;const stamp=when.toISOString();readings[id]=readings[id]||[];const src=o.source||'Official feed';if(readings[id].some(x=>x.time===stamp&&x.source===src&&Number(x.level)===level))continue;readings[id].push({level,status:o.status||'READING_ONLY',time:stamp,source:src,note:o.note||'',demo:false,officialThresholds:o.officialThresholds||null});readings[id].sort((a,b)=>new Date(a.time)-new Date(b.time));readings[id]=readings[id].slice(-96);added++;}
      if(added){demoMode=false;try{save();}catch{}}
      sourceState(data);refreshQueue();if(!silent){btn.textContent=added?`✓ ${added} new reading(s)`:'✓ Up to date';setTimeout(()=>btn.textContent='↻ Check now',1800);}
    }catch(e){const box=$('rwAwarenessSource');if(box)box.innerHTML=`<span class="rw-awareness-dot warn"></span><span><b>Automatic snapshot check failed.</b> Existing readings remain available; retry or use verified field fallback if needed.</span>`;if(!silent)btn.textContent='↻ Check now';}
    finally{if(!silent)btn.disabled=false;}
  }

  $('rwAwarenessRefresh').onclick=()=>autoSync(false);
  $('rwShowReviewed').onclick=()=>{showReviewed=!showReviewed;$('rwShowReviewed').textContent=showReviewed?'Hide reviewed':'Show reviewed';refreshQueue();};
  $('rwOpenPosting').onclick=()=>{const el=[...document.querySelectorAll('.section-title')].find(x=>x.textContent.includes('Posting Studio'))||document.querySelector('.studio');el?.scrollIntoView({behavior:'smooth',block:'start'});};
  window.addEventListener('riverwatch:cloud-merged',refreshQueue);
  window.addEventListener('focus',()=>autoSync(true));
  setInterval(refreshQueue,15000);
  setInterval(()=>autoSync(true),AUTO_REFRESH_MS);
  sourceState(sourceMeta);refreshQueue();autoSync(true);
})();