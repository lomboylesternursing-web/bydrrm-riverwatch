(()=>{
  const GROUPS={
    ALL:{label:'All Bulacan',ids:STATIONS.map(s=>s.id)},
    SAN_MIGUEL:{label:'San Miguel waterways',ids:[12,13,14,15]},
    ANGAT:{label:'Angat River corridor',ids:[1,2,3,4,5,6,7,8,9]},
    CALUMPIT:{label:'Calumpit downstream',ids:[10,11]},
    EAST:{label:'Eastern Bulacan',ids:[16,17,18,19]}
  };
  const SAN_MIGUEL_IDS=[12,13,14,15];
  const WATERWAY={10:'Caniogan / Bagbag Bridge station',12:'San Miguel River',13:'San Juan Bridge station',14:'Ilog Bulo',15:'Madlum River'};
  let active='ALL';

  const style=document.createElement('style');
  style.textContent=`
    .rw-focus{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(260px,.65fr);gap:12px;margin:14px 0}
    .rw-card{background:linear-gradient(145deg,#0b2035,#0a1929);border:1px solid #28506e;border-radius:16px;padding:15px}
    .rw-card h3{margin:0 0 6px;font-size:16px}.rw-card p{margin:0;color:#8ca7bf;font-size:12px;line-height:1.5}
    .rw-actions,.rw-chips{display:flex;gap:8px;flex-wrap:wrap;margin-top:11px}.rw-chips{margin:0 0 14px}
    .rw-chip{border:1px solid #1f3a54;background:#0a1929;color:#c9deee;padding:9px 12px;border-radius:999px;cursor:pointer;font-size:12px;font-weight:750}
    .rw-chip.active{background:#0d5f99;border-color:#3496d1;color:#fff}.rw-waterway{display:inline-block;margin-top:5px;font-size:11px;color:#8fd3ff}
    .rw-sm{margin:18px 0;background:linear-gradient(145deg,#0c1e31,#081724);border:1px solid #28506e;border-radius:18px;padding:16px}
    .rw-sm-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap}.rw-sm-head h2{font-size:19px;margin:0}.rw-sm-sub{color:#8ca7bf;font-size:12px;margin-top:4px;line-height:1.5}
    .rw-sm-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:14px}.rw-sm-station{background:#091827;border:1px solid #1f3a54;border-radius:14px;padding:13px;min-height:150px}
    .rw-sm-name{font-weight:800;font-size:14px}.rw-sm-waterway{color:#8fd3ff;font-size:11px;margin-top:3px}.rw-sm-level{font-size:27px;font-weight:900;margin-top:16px}.rw-sm-trend{font-size:12px;margin-top:3px;color:#c2d8e9}.rw-sm-meta{font-size:10px;color:#8ca7bf;line-height:1.45;margin-top:9px}
    .rw-sm-status{display:inline-block;margin-top:8px;padding:5px 7px;border-radius:999px;font-size:10px;font-weight:900}.rw-sm-note{margin-top:12px;padding:10px 11px;border:1px solid #1f3a54;border-radius:11px;color:#9eb7ca;font-size:11px;line-height:1.5}
    .rw-combined-preview{margin-top:14px;background:linear-gradient(155deg,#07111f,#0c2a43);border:1px solid #2a5879;border-radius:16px;padding:18px}.rw-combined-brand{font-size:11px;font-weight:900;letter-spacing:1.5px;color:#acd8f5}.rw-combined-title{font-size:24px;font-weight:900;margin:12px 0 4px}.rw-combined-time{font-size:11px;color:#a5bdd0}.rw-combined-rows{display:grid;gap:8px;margin-top:15px}.rw-combined-row{display:grid;grid-template-columns:minmax(0,1.4fr) .65fr .8fr;gap:10px;align-items:center;padding:9px 0;border-top:1px solid #ffffff16}.rw-combined-row:first-child{border-top:0}.rw-combined-row b{font-size:13px}.rw-combined-row small{display:block;color:#8fd3ff;margin-top:2px}.rw-combined-value{font-weight:900;text-align:right}.rw-combined-trend{font-size:11px;text-align:right;color:#c5d8e8}
    @media(max-width:900px){.rw-sm-grid{grid-template-columns:repeat(2,1fr)}}
    @media(max-width:650px){.rw-focus{grid-template-columns:1fr}.rw-sm-grid{grid-template-columns:1fr}.rw-combined-row{grid-template-columns:1.2fr .7fr}.rw-combined-trend{grid-column:1/-1;text-align:left}}
  `;
  document.head.appendChild(style);

  const layout=document.querySelector('.layout');
  if(layout){
    const wrap=document.createElement('div');
    wrap.innerHTML=`<section class="rw-focus">
      <div class="rw-card"><h3>🌧️ San Miguel Waterways Focus</h3><p>Official PDRRMO monitoring points: Oriente Bridge / San Miguel River, San Juan Bridge, Salacot Bridge / Ilog Bulo, and Madlum River. Each remains a separate observation point; RiverWatch does not assume one station predicts another.</p><div class="rw-actions"><button class="btn primary" data-rw-focus="SAN_MIGUEL">View San Miguel cluster</button><button class="btn" data-rw-focus="ALL">View all Bulacan</button></div></div>
      <div class="rw-card"><h3>River-system view</h3><p>Use the filters below to focus the map. Exact river names are displayed only where the government station description identifies them.</p></div>
    </section><div class="rw-chips">${Object.entries(GROUPS).map(([k,v])=>`<button class="rw-chip ${k==='ALL'?'active':''}" data-rw-focus="${k}">${v.label}</button>`).join('')}</div>`;
    layout.parentNode.insertBefore(wrap,layout);
  }

  const smSection=document.createElement('section');
  smSection.className='rw-sm';
  smSection.innerHTML=`
    <div class="rw-sm-head"><div><h2>📍 San Miguel Situation Panel</h2><div class="rw-sm-sub">Four official monitoring locations shown together for quick local situational awareness. Readings remain station-specific and source/timestamp must be verified before posting.</div></div><div class="rw-actions"><button class="btn" id="rwSmRefresh">↻ Check Official Snapshot</button><button class="btn primary" id="rwSmCreate">Create San Miguel Update</button><button class="btn" id="rwSmPng">Export 4:5 PNG</button><button class="btn" id="rwSmCopy">Copy Caption</button></div></div>
    <div id="rwSmGrid" class="rw-sm-grid"></div>
    <div class="rw-sm-note">NO DATA means RiverWatch has no current verified observation loaded for that station. It does not mean the water level is zero. RiverWatch does not declare bridge structural safety or infer downstream danger from another station without an official basis.</div>
    <div id="rwCombinedPreview" class="rw-combined-preview"></div>
    <textarea id="rwSmCaption" style="width:100%;min-height:165px;margin-top:12px;background:#071522;border:1px solid #1f3a54;color:#edf6ff;padding:12px;border-radius:12px"></textarea>`;
  if(layout) layout.parentNode.insertBefore(smSection,layout.nextSibling);

  function groupStations(){const ids=new Set(GROUPS[active].ids);return STATIONS.filter(s=>ids.has(s.id));}
  function waterway(s){return WATERWAY[s.id]||(active==='ANGAT'||s.id<=9?'Angat River corridor':s.municipality+' monitoring station');}
  function safeTime(t){if(!t)return 'No observation time';const d=new Date(t);return Number.isNaN(d.getTime())?String(t):d.toLocaleString([],{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});}
  function smStation(id){return STATIONS.find(s=>s.id===id);}
  function statusLabel(st){return (st||'NO_DATA').replace('_',' ');}
  function trendFor(id){const r=latest(id);if(!r)return 'Trend unavailable';return trendText(id);}
  function statusBadgeStyle(st){const c=statusColor(st||'NO_DATA');return `background:${c}22;color:${c};border:1px solid ${c}55`;}
  function latestSourceSummary(){const vals=SAN_MIGUEL_IDS.map(id=>latest(id)).filter(Boolean);if(!vals.length)return 'No verified observations loaded';const newest=vals.slice().sort((a,b)=>new Date(b.time)-new Date(a.time))[0];return `Latest loaded observation: ${safeTime(newest.time)} • ${newest.source||'Source not specified'}`;}

  function applyFilter(fit=true){
    const ids=new Set(GROUPS[active].ids);
    document.querySelectorAll('[data-rw-focus]').forEach(b=>b.classList.toggle('active',b.dataset.rwFocus===active));
    STATIONS.forEach(s=>{if(markers[s.id]){if(ids.has(s.id)){if(!map.hasLayer(markers[s.id]))markers[s.id].addTo(map);}else if(map.hasLayer(markers[s.id]))map.removeLayer(markers[s.id]);}});
    document.querySelectorAll('#stationList .station').forEach(el=>{const id=Number(el.dataset.id);el.style.display=ids.has(id)?'':'none';});
    groupStations().forEach(s=>{const el=document.querySelector(`#stationList .station[data-id="${s.id}"] .station-loc`);if(el&&!el.parentNode.querySelector('.rw-waterway')){const w=document.createElement('div');w.className='rw-waterway';w.textContent=waterway(s);el.after(w);}});
    if(fit){const pts=groupStations().map(s=>[s.lat,s.lng]);if(pts.length)map.fitBounds(pts,{padding:[30,30],maxZoom:12});}
  }

  function combinedRowsHtml(){return SAN_MIGUEL_IDS.map(id=>{const s=smStation(id),r=latest(id);return `<div class="rw-combined-row"><div><b>${s.name}</b><small>${WATERWAY[id]}</small></div><div class="rw-combined-value">${r?Number(r.level).toFixed(2)+' m':'NO DATA'}</div><div class="rw-combined-trend">${r?trendFor(id):'Awaiting verified reading'}</div></div>`;}).join('');}
  function combinedCaption(){
    const lines=['🌊 BYDRRM RIVERWATCH','','SAN MIGUEL WATER LEVEL MONITORING UPDATE',''];
    SAN_MIGUEL_IDS.forEach(id=>{const s=smStation(id),r=latest(id);lines.push(`${s.name} — ${WATERWAY[id]}`);if(r){lines.push(`${Number(r.level).toFixed(2)} m • ${trendFor(id)}`);lines.push(`As of ${safeTime(r.time)} • Source: ${r.source||'Not specified'}`);}else lines.push('NO DATA — no current verified observation loaded');lines.push('');});
    lines.push('For situational awareness only. Water-level observations do not establish structural bridge safety. Follow official government advisories and verified field information.');
    return lines.join('\n');
  }
  function refreshSanMiguelPanel(){
    const grid=document.getElementById('rwSmGrid');if(!grid)return;
    grid.innerHTML=SAN_MIGUEL_IDS.map(id=>{const s=smStation(id),r=latest(id),st=r?(r.status||'NO_DATA'):'NO_DATA';return `<div class="rw-sm-station"><div class="rw-sm-name">${s.name}</div><div class="rw-sm-waterway">${WATERWAY[id]}</div><span class="rw-sm-status" style="${statusBadgeStyle(st)}">${statusLabel(st)}</span><div class="rw-sm-level">${r?Number(r.level).toFixed(2)+' m':'NO DATA'}</div><div class="rw-sm-trend">${r?trendFor(id):'Awaiting verified reading'}</div><div class="rw-sm-meta">${r?`${safeTime(r.time)}<br>${r.source||'Source not specified'}`:'No observation timestamp or source loaded.'}</div></div>`;}).join('');
    const preview=document.getElementById('rwCombinedPreview');
    preview.innerHTML=`<div class="rw-combined-brand">BULACAN YOUTH DRRM • RIVERWATCH</div><div class="rw-combined-title">SAN MIGUEL WATER LEVEL UPDATE</div><div class="rw-combined-time">${latestSourceSummary()}</div><div class="rw-combined-rows">${combinedRowsHtml()}</div>`;
    document.getElementById('rwSmCaption').value=combinedCaption();
  }

  function exportSanMiguelPng(){
    const W=1080,H=1350,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
    const grad=x.createLinearGradient(0,0,W,H);grad.addColorStop(0,'#07111f');grad.addColorStop(1,'#0d3654');x.fillStyle=grad;x.fillRect(0,0,W,H);
    x.fillStyle='#acd8f5';x.font='800 25px Arial';x.fillText('BULACAN YOUTH DRRM • RIVERWATCH',70,82);
    x.fillStyle='#edf6ff';x.font='900 56px Arial';x.fillText('SAN MIGUEL',70,165);x.fillText('WATER LEVEL UPDATE',70,225);
    x.fillStyle='#9eb7ca';x.font='400 24px Arial';x.fillText(new Date().toLocaleString([], {month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'}),70,276);
    let y=360;
    SAN_MIGUEL_IDS.forEach((id,i)=>{const s=smStation(id),r=latest(id),st=r?(r.status||'NO_DATA'):'NO_DATA',color=statusColor(st);if(i){x.strokeStyle='#ffffff22';x.lineWidth=1;x.beginPath();x.moveTo(70,y-34);x.lineTo(1010,y-34);x.stroke();}
      x.fillStyle='#edf6ff';x.font='800 30px Arial';x.fillText(s.name,70,y);x.fillStyle='#8fd3ff';x.font='400 20px Arial';x.fillText(WATERWAY[id],70,y+32);
      x.textAlign='right';x.fillStyle=r?'#edf6ff':'#9eb0c0';x.font='900 42px Arial';x.fillText(r?Number(r.level).toFixed(2)+' m':'NO DATA',1010,y+4);
      x.fillStyle=color;x.font='800 20px Arial';x.fillText(statusLabel(st),1010,y+36);x.textAlign='left';
      x.fillStyle='#c2d8e9';x.font='600 21px Arial';x.fillText(r?trendFor(id):'Awaiting verified reading',70,y+76);
      x.fillStyle='#8ca7bf';x.font='400 17px Arial';const meta=r?`${safeTime(r.time)} • ${r.source||'Source not specified'}`:'No observation timestamp/source loaded';x.fillText(meta,70,y+105);y+=200;
    });
    x.strokeStyle='#ffffff28';x.beginPath();x.moveTo(70,1185);x.lineTo(1010,1185);x.stroke();x.fillStyle='#b9cddd';x.font='400 19px Arial';x.fillText('For situational awareness only. Follow official government advisories.',70,1230);x.fillText('Water-level readings do not establish structural bridge safety.',70,1263);x.fillStyle='#edf6ff';x.font='800 21px Arial';x.fillText('BYDRRM RIVERWATCH',70,1310);
    const a=document.createElement('a');a.download=`riverwatch-san-miguel-${Date.now()}.png`;a.href=c.toDataURL('image/png');a.click();
  }

  document.querySelectorAll('[data-rw-focus]').forEach(b=>b.addEventListener('click',()=>{active=b.dataset.rwFocus;renderList();applyFilter(true);}));
  const oldSearch=search.oninput;search.oninput=()=>{if(oldSearch)oldSearch();applyFilter(false);};
  const originalRender=window.render;if(typeof originalRender==='function'){window.render=function(){originalRender();refreshSanMiguelPanel();applyFilter(false);};}

  const brandP=document.querySelector('.brand p');if(brandP)brandP.textContent='Bulacan River Systems & Bridge Water-Level Monitoring';
  const badge=document.querySelector('.badge');if(badge)badge.textContent='15-min public-data sync • Human-verified advisories';

  function updateSourceCards(data){
    const p=(data.sources||[]).find(x=>x.name==='Bulacan PDRRMO');const a=(data.sources||[]).find(x=>x.name==='DOST-ASTI PhilSensors');
    if(p){const stamp=data.generatedAt||p.fetched_at;const when=stamp&&!Number.isNaN(new Date(stamp).getTime())?new Date(stamp).toLocaleString():'time unavailable';const detail=p.ok?`Public snapshot • river records ${p.river_records||0} • mapped ${p.normalized_readings||0} • ${when}`:(p.error||'Feed unavailable');setFeedState('pdrrmo',p.ok?'CONNECTED':'ERROR',p.ok?'ok':'bad',detail);}
    if(a)setFeedState('philsensors',a.configured?'CONNECTED':'API PENDING',a.configured?'ok':'warn',a.message||'Direct API access pending');
  }
  async function syncSnapshot(silent=false){
    if(!silent){syncBtn.disabled=true;syncBtn.textContent='Syncing…';}
    try{
      const res=await fetch('./official-data.json?ts='+Date.now(),{cache:'no-store'});if(!res.ok)throw new Error('HTTP '+res.status);const data=await res.json();let added=0;
      for(const o of data.readings||[]){if(!o.stationId||o.level==null||!o.time)continue;const id=Number(o.stationId),level=Number(o.level),raw=new Date(o.time);if(Number.isNaN(raw.getTime()))continue;const stamp=raw.toISOString();readings[id]=readings[id]||[];if(readings[id].some(v=>v.time===stamp&&v.source===(o.source||'Official feed')&&Number(v.level)===level))continue;readings[id].push({level,status:o.status||'NO_DATA',time:stamp,source:o.source||'Official feed',note:o.note||'',demo:false});readings[id].sort((a,b)=>new Date(a.time)-new Date(b.time));readings[id]=readings[id].slice(-96);added++;}
      demoMode=false;save();updateSourceCards(data);refreshSanMiguelPanel();applyFilter(false);if(!silent){syncBtn.textContent=added?`✓ ${added} new reading(s)`:'✓ Official snapshot checked';setTimeout(()=>syncBtn.textContent='↻ Sync Official Feeds',2500);}
    }catch(e){setFeedState('pdrrmo','UNAVAILABLE','warn','Could not load the scheduled public snapshot. Manual verified observations remain available.');if(!silent)syncBtn.textContent='↻ Sync Official Feeds';}
    finally{if(!silent)syncBtn.disabled=false;}
  }
  syncBtn.onclick=()=>syncSnapshot(false);
  document.getElementById('rwSmRefresh').onclick=()=>syncSnapshot(false);
  document.getElementById('rwSmCreate').onclick=()=>{refreshSanMiguelPanel();document.getElementById('rwCombinedPreview').scrollIntoView({behavior:'smooth',block:'center'});};
  document.getElementById('rwSmPng').onclick=exportSanMiguelPng;
  document.getElementById('rwSmCopy').onclick=async()=>{const btn=document.getElementById('rwSmCopy');try{await navigator.clipboard.writeText(document.getElementById('rwSmCaption').value);btn.textContent='Copied!';setTimeout(()=>btn.textContent='Copy Caption',1200);}catch(e){document.getElementById('rwSmCaption').select();}};

  renderList();applyFilter(false);refreshSanMiguelPanel();syncSnapshot(true);
})();