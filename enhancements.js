(()=>{
  const GROUPS={
    ALL:{label:'All Bulacan',ids:STATIONS.map(s=>s.id)},
    SAN_MIGUEL:{label:'San Miguel waterways',ids:[12,13,14,15]},
    ANGAT:{label:'Angat River corridor',ids:[1,2,3,4,5,6,7,8,9]},
    CALUMPIT:{label:'Calumpit downstream',ids:[10,11]},
    EAST:{label:'Eastern Bulacan',ids:[16,17,18,19]}
  };
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
    @media(max-width:650px){.rw-focus{grid-template-columns:1fr}}
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

  function groupStations(){const ids=new Set(GROUPS[active].ids);return STATIONS.filter(s=>ids.has(s.id));}
  function waterway(s){return WATERWAY[s.id]||(active==='ANGAT'||s.id<=9?'Angat River corridor':s.municipality+' monitoring station');}
  function applyFilter(fit=true){
    const ids=new Set(GROUPS[active].ids);
    document.querySelectorAll('[data-rw-focus]').forEach(b=>b.classList.toggle('active',b.dataset.rwFocus===active));
    STATIONS.forEach(s=>{if(markers[s.id]){if(ids.has(s.id)){if(!map.hasLayer(markers[s.id]))markers[s.id].addTo(map);}else if(map.hasLayer(markers[s.id]))map.removeLayer(markers[s.id]);}});
    document.querySelectorAll('#stationList .station').forEach(el=>{const id=Number(el.dataset.id);el.style.display=ids.has(id)?'':'none';});
    groupStations().forEach(s=>{
      const el=document.querySelector(`#stationList .station[data-id="${s.id}"] .station-loc`);
      if(el&&!el.parentNode.querySelector('.rw-waterway')){const w=document.createElement('div');w.className='rw-waterway';w.textContent=waterway(s);el.after(w);}
    });
    if(fit){const pts=groupStations().map(s=>[s.lat,s.lng]);if(pts.length)map.fitBounds(pts,{padding:[30,30],maxZoom:12});}
  }
  document.querySelectorAll('[data-rw-focus]').forEach(b=>b.addEventListener('click',()=>{active=b.dataset.rwFocus;renderList();applyFilter(true);}));
  const oldSearch=search.oninput; search.oninput=()=>{if(oldSearch)oldSearch();applyFilter(false);};

  const brandP=document.querySelector('.brand p'); if(brandP)brandP.textContent='Bulacan River Systems & Bridge Water-Level Monitoring';
  const badge=document.querySelector('.badge'); if(badge)badge.textContent='15-min public-data sync • Human-verified advisories';

  function updateSourceCards(data){
    const p=(data.sources||[]).find(x=>x.name==='Bulacan PDRRMO');
    const a=(data.sources||[]).find(x=>x.name==='DOST-ASTI PhilSensors');
    if(p){const detail=p.ok?`Public snapshot • river records ${p.river_records||0} • mapped ${p.normalized_readings||0} • ${new Date(data.generatedAt||p.fetched_at||Date.now()).toLocaleString()}`:(p.error||'Feed unavailable');setFeedState('pdrrmo',p.ok?'CONNECTED':'ERROR',p.ok?'ok':'bad',detail);}
    if(a){setFeedState('philsensors',a.configured?'CONNECTED':'API PENDING',a.configured?'ok':'warn',a.message||'Direct API access pending');}
  }
  async function syncSnapshot(silent=false){
    if(!silent){syncBtn.disabled=true;syncBtn.textContent='Syncing…';}
    try{
      const res=await fetch('./official-data.json?ts='+Date.now(),{cache:'no-store'});if(!res.ok)throw new Error('HTTP '+res.status);
      const data=await res.json();let added=0;
      for(const o of data.readings||[]){
        if(!o.stationId||o.level==null||!o.time)continue;
        const id=Number(o.stationId),level=Number(o.level),stamp=new Date(o.time).toISOString();readings[id]=readings[id]||[];
        if(readings[id].some(x=>x.time===stamp&&x.source===(o.source||'Official feed')&&Number(x.level)===level))continue;
        readings[id].push({level,status:o.status||'NO_DATA',time:stamp,source:o.source||'Official feed',note:o.note||'',demo:false});
        readings[id].sort((a,b)=>new Date(a.time)-new Date(b.time));readings[id]=readings[id].slice(-96);added++;
      }
      demoMode=false;save();updateSourceCards(data);applyFilter(false);
      if(!silent){syncBtn.textContent=added?`✓ ${added} new reading(s)`:'✓ Official snapshot checked';setTimeout(()=>syncBtn.textContent='↻ Sync Official Feeds',2500);}
    }catch(e){setFeedState('pdrrmo','UNAVAILABLE','warn','Could not load the scheduled public snapshot. Manual verified observations remain available.');if(!silent)syncBtn.textContent='↻ Sync Official Feeds';}
    finally{if(!silent)syncBtn.disabled=false;}
  }
  syncBtn.onclick=()=>syncSnapshot(false);
  renderList();applyFilter(false);syncSnapshot(true);
})();