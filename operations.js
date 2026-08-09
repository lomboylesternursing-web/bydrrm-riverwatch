(()=>{
  const OPS_VERSION='1.0';
  const FIELD_SOURCE='BYDRRM Verified Field Observation';
  const CLASS_OPTIONS=[
    ['READING_ONLY','READING ONLY — no official threshold applied'],
    ['NORMAL','NORMAL — only if supported by official classification'],
    ['WATCH','WATCH / ALERT — only if supported by official classification'],
    ['ALARM','ALARM — only if supported by official classification'],
    ['CRITICAL','CRITICAL — only if supported by official classification']
  ];
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const uid=()=>crypto.randomUUID?crypto.randomUUID():'rw-'+Date.now()+'-'+Math.random().toString(36).slice(2);
  const parseDate=v=>{const d=new Date(v);return Number.isNaN(d.getTime())?null:d;};
  const localInputValue=d=>{const x=new Date(d||Date.now());x.setMinutes(x.getMinutes()-x.getTimezoneOffset());return x.toISOString().slice(0,16);};
  const fmt=v=>{const d=parseDate(v);return d?d.toLocaleString([],{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'}):'Unknown time';};
  const classificationLabel=v=>CLASS_OPTIONS.find(x=>x[0]===v)?.[1]||String(v||'READING ONLY');

  const style=document.createElement('style');
  style.textContent=`
    .status.READING_ONLY{background:#26394b;color:#c6d9e8}.rw-ops{margin:20px 0;background:#0b1b2d;border:1px solid #28506e;border-radius:18px;padding:16px}.rw-ops-head{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:flex-start}.rw-ops-head h2{font-size:19px;margin:0}.rw-ops-sub{font-size:12px;color:#8ca7bf;max-width:850px;line-height:1.55;margin-top:4px}.rw-ops-grid{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(320px,.75fr);gap:14px;margin-top:14px}.rw-pane{background:#081827;border:1px solid #1f3a54;border-radius:15px;padding:14px}.rw-pane h3{margin:0 0 10px;font-size:15px}.rw-row{display:flex;gap:9px;flex-wrap:wrap;align-items:center}.rw-select,.rw-input,.rw-textarea{background:#071522;border:1px solid #1f3a54;color:#edf6ff;border-radius:10px;padding:10px;width:100%}.rw-chart-wrap{position:relative;height:270px;margin-top:12px;background:#06121e;border:1px solid #173149;border-radius:12px;padding:8px}.rw-chart{width:100%;height:100%;display:block}.rw-summary{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:10px}.rw-mini{border:1px solid #1f3a54;border-radius:11px;padding:10px;background:#0a1929}.rw-mini b{font-size:17px;display:block}.rw-mini span{font-size:10px;color:#8ca7bf}.rw-history{margin-top:10px;max-height:245px;overflow:auto}.rw-hrow{display:grid;grid-template-columns:1fr .55fr .85fr;gap:8px;padding:9px 0;border-top:1px solid #ffffff12;font-size:11px}.rw-hrow:first-child{border-top:0}.rw-hrow strong{font-size:12px}.rw-muted{color:#8ca7bf}.rw-audit{max-height:430px;overflow:auto}.rw-audit-item{border:1px solid #1f3a54;border-radius:12px;padding:11px;margin-bottom:8px;background:#091827}.rw-audit-top{display:flex;justify-content:space-between;gap:8px}.rw-audit-name{font-weight:800;font-size:12px}.rw-audit-meta{font-size:10px;color:#8ca7bf;line-height:1.5;margin-top:6px}.rw-proof{margin-top:8px;border-radius:9px;max-width:100%;max-height:130px;object-fit:cover;border:1px solid #274760}.rw-proof-tag{display:inline-block;margin-top:6px;font-size:9px;font-weight:800;padding:4px 6px;border-radius:999px;background:#16344b;color:#a9d8f7}.rw-empty{font-size:12px;color:#8ca7bf;padding:12px 0}.rw-stale{color:#ffd166}.rw-current{color:#76efd2}.rw-dialog{border:1px solid #2a5879;border-radius:18px;background:#0b1a2a;color:#edf6ff;padding:0;width:min(650px,94vw)}.rw-dialog::backdrop{background:#000a}.rw-modal{padding:20px}.rw-modal h2{margin:0 0 4px}.rw-form{display:grid;grid-template-columns:1fr 1fr;gap:11px;margin-top:15px}.rw-field{display:flex;flex-direction:column;gap:5px}.rw-field.full{grid-column:1/-1}.rw-field label{font-size:11px;color:#9db5c9}.rw-check{display:flex;gap:9px;align-items:flex-start;font-size:11px;color:#b8cfe1;line-height:1.5;border:1px solid #25435d;background:#0b2238;padding:10px;border-radius:10px}.rw-modal-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:15px}.rw-alert{font-size:11px;color:#ffe08b;background:#332b0e;border:1px solid #63541d;padding:9px;border-radius:9px;margin-top:10px;line-height:1.5}
    @media(max-width:900px){.rw-ops-grid{grid-template-columns:1fr}.rw-summary{grid-template-columns:repeat(2,1fr)}}@media(max-width:650px){.rw-form{grid-template-columns:1fr}.rw-field.full{grid-column:auto}.rw-hrow{grid-template-columns:1fr .65fr}.rw-hrow>div:last-child{grid-column:1/-1}}
  `;
  document.head.appendChild(style);

  const toolbar=document.querySelector('.toolbar');
  const verifiedBtn=document.createElement('button');verifiedBtn.className='btn primary';verifiedBtn.id='rwVerifiedBtn';verifiedBtn.textContent='✓ Verified Field Update';
  if(toolbar) toolbar.insertBefore(verifiedBtn,toolbar.children[1]||null);

  const dialog=document.createElement('dialog');dialog.className='rw-dialog';dialog.id='rwVerifiedDialog';
  dialog.innerHTML=`<form method="dialog" class="rw-modal" id="rwVerifiedForm"><h2>Verified Field Update</h2><div class="rw-ops-sub">Record a staff-gauge or field-observed water level. Default classification is READING ONLY so a manual reading is never interpreted as an official safety level.</div><div class="rw-alert">Use NORMAL / WATCH / ALARM / CRITICAL only when the classification is supported by an official government threshold/advisory for that station. Do not estimate a warning category from appearance alone.</div><div class="rw-form">
    <div class="rw-field full"><label>Monitoring station</label><select class="rw-select" id="rwVStation" required>${STATIONS.map(s=>`<option value="${s.id}">${esc(s.name)} — ${esc(s.municipality)}</option>`).join('')}</select></div>
    <div class="rw-field"><label>Observed water level (meters)</label><input class="rw-input" id="rwVLevel" type="number" min="-20" max="100" step="0.01" required placeholder="e.g. 2.35"></div>
    <div class="rw-field"><label>Observation date & time</label><input class="rw-input" id="rwVTime" type="datetime-local" required></div>
    <div class="rw-field"><label>Verifier / observer name</label><input class="rw-input" id="rwVVerifier" required placeholder="Full name"></div>
    <div class="rw-field"><label>Team / role</label><input class="rw-input" id="rwVRole" placeholder="e.g. BYDRRM volunteer"></div>
    <div class="rw-field full"><label>Classification</label><select class="rw-select" id="rwVClass">${CLASS_OPTIONS.map(([v,l])=>`<option value="${v}">${esc(l)}</option>`).join('')}</select></div>
    <div class="rw-field full"><label>Source / observation detail</label><input class="rw-input" id="rwVSource" value="On-site staff gauge observation" placeholder="How was the reading obtained?"></div>
    <div class="rw-field full"><label>Evidence / reference</label><input class="rw-input" id="rwVEvidence" placeholder="Photo filename, messenger report, link, incident log no., etc."></div>
    <div class="rw-field full"><label>Optional field photo</label><input class="rw-input" id="rwVPhoto" type="file" accept="image/*" capture="environment"><div class="rw-muted" style="font-size:10px">Photo is compressed and stored only in this browser. It is not uploaded to a central server yet.</div></div>
    <div class="rw-field full"><label>Notes</label><textarea class="rw-textarea" id="rwVNote" rows="3" placeholder="Landmark, access condition, visual observation, or verification notes"></textarea></div>
    <label class="rw-check full"><input id="rwVConfirm" type="checkbox" required><span>I confirm that the water-level value, observation time, and source above were checked before saving. I understand this entry does not establish bridge structural safety.</span></label>
  </div><div class="rw-modal-actions"><button class="btn" value="cancel">Cancel</button><button class="btn primary" id="rwVSave" value="default">Save verified reading</button></div></form>`;
  document.body.appendChild(dialog);

  const postingTitle=[...document.querySelectorAll('.section-title')].find(x=>x.textContent.includes('Posting Studio'));
  const ops=document.createElement('section');ops.className='rw-ops';ops.id='rwOperations';
  ops.innerHTML=`<div class="rw-ops-head"><div><h2>🧭 Field Operations & History</h2><div class="rw-ops-sub">Use a designated monitoring device for shared operations until a cloud backend is connected. All manual field records and photos in this version are stored locally on the device/browser that entered them.</div></div><div class="rw-row"><button class="btn primary" id="rwOpsAdd">+ Verified reading</button><button class="btn" id="rwExportAudit">Export audit JSON</button></div></div><div class="rw-ops-grid"><div class="rw-pane"><h3>Station history</h3><div class="rw-row"><select class="rw-select" id="rwHistoryStation" style="flex:1;min-width:220px">${STATIONS.map(s=>`<option value="${s.id}" ${s.id===13?'selected':''}>${esc(s.name)} — ${esc(s.municipality)}</option>`).join('')}</select><select class="rw-select" id="rwHistoryWindow" style="width:auto"><option value="3">3 hours</option><option value="6">6 hours</option><option value="12">12 hours</option><option value="24" selected>24 hours</option><option value="168">7 days</option><option value="0">All stored</option></select></div><div id="rwHistorySummary" class="rw-summary"></div><div class="rw-chart-wrap"><canvas id="rwHistoryChart" class="rw-chart"></canvas></div><div id="rwHistoryList" class="rw-history"></div></div><div class="rw-pane"><h3>Verification audit trail</h3><div class="rw-ops-sub" style="margin-bottom:10px">Newest verified field observations saved on this browser.</div><div id="rwAudit" class="rw-audit"></div></div></div>`;
  if(postingTitle) postingTitle.parentNode.insertBefore(ops,postingTitle); else document.querySelector('main')?.appendChild(ops);

  const $=id=>document.getElementById(id);
  function statusText(r){return (r?.status||'READING_ONLY').replace('_',' ');}
  function isVerified(r){return !!(r&&r.verification&&r.verification.verifier);}
  function fieldEntries(){const out=[];for(const s of STATIONS){for(const r of (readings[s.id]||[])){if(isVerified(r))out.push({station:s,reading:r});}}return out.sort((a,b)=>new Date(b.reading.time)-new Date(a.reading.time));}
  function historyFor(id,hours){const arr=(readings[id]||[]).filter(r=>Number.isFinite(Number(r.level))&&parseDate(r.time)).slice().sort((a,b)=>new Date(a.time)-new Date(b.time));if(!hours)return arr;const cutoff=Date.now()-hours*3600000;return arr.filter(r=>new Date(r.time).getTime()>=cutoff);}
  function compressImage(file){return new Promise((resolve,reject)=>{if(!file)return resolve(null);if(file.size>12*1024*1024)return reject(new Error('Photo is too large. Please use an image below 12 MB.'));const fr=new FileReader();fr.onerror=()=>reject(new Error('Could not read photo.'));fr.onload=()=>{const im=new Image();im.onerror=()=>reject(new Error('Could not decode photo.'));im.onload=()=>{const max=720,scale=Math.min(1,max/Math.max(im.width,im.height)),w=Math.max(1,Math.round(im.width*scale)),h=Math.max(1,Math.round(im.height*scale)),c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(im,0,0,w,h);resolve(c.toDataURL('image/jpeg',0.68));};im.src=fr.result;};fr.readAsDataURL(file);});}

  function openVerified(stationId){$('rwVStation').value=String(stationId||$('rwHistoryStation').value||13);$('rwVTime').value=localInputValue();$('rwVLevel').value='';$('rwVClass').value='READING_ONLY';$('rwVSource').value='On-site staff gauge observation';$('rwVEvidence').value='';$('rwVPhoto').value='';$('rwVNote').value='';$('rwVConfirm').checked=false;dialog.showModal();}
  verifiedBtn.onclick=()=>openVerified();$('rwOpsAdd').onclick=()=>openVerified();

  $('rwVSave').onclick=async e=>{
    e.preventDefault();
    if(!$('rwVerifiedForm').reportValidity())return;
    const id=Number($('rwVStation').value),level=Number($('rwVLevel').value),obs=parseDate($('rwVTime').value),verifier=$('rwVVerifier').value.trim();
    if(!Number.isFinite(level)||!obs||!verifier)return;
    const btn=$('rwVSave');btn.disabled=true;btn.textContent='Saving…';
    let photo=null,photoWarning='';
    try{photo=await compressImage($('rwVPhoto').files[0]);}catch(err){photoWarning=err.message;}
    const r={id:uid(),level,status:$('rwVClass').value,time:obs.toISOString(),source:FIELD_SOURCE,note:$('rwVNote').value.trim(),demo:false,verification:{verified:true,verifier,role:$('rwVRole').value.trim(),observedSource:$('rwVSource').value.trim(),evidence:$('rwVEvidence').value.trim(),photoName:$('rwVPhoto').files[0]?.name||'',photoDataUrl:photo,verifiedAt:new Date().toISOString(),operationsVersion:OPS_VERSION}};
    readings[id]=readings[id]||[];readings[id].push(r);readings[id].sort((a,b)=>new Date(a.time)-new Date(b.time));readings[id]=readings[id].slice(-96);
    demoMode=false;
    try{save();}catch(err){r.verification.photoDataUrl=null;try{save();photoWarning='Photo could not fit browser storage, but the verified reading was saved without the image.';}catch(e2){alert('Could not save this reading in browser storage. Export/clear older local readings and try again.');btn.disabled=false;btn.textContent='Save verified reading';return;}}
    dialog.close();refreshOps();btn.disabled=false;btn.textContent='Save verified reading';
    if(photoWarning)alert(photoWarning);else{const s=STATIONS.find(x=>x.id===id);alert(`Verified reading saved: ${s?.name||'Station'} — ${level.toFixed(2)} m`);}
  };

  function drawChart(){
    const id=Number($('rwHistoryStation').value),hours=Number($('rwHistoryWindow').value),arr=historyFor(id,hours),canvas=$('rwHistoryChart'),box=canvas.parentElement,ratio=Math.min(window.devicePixelRatio||1,2),w=Math.max(300,box.clientWidth-16),h=Math.max(220,box.clientHeight-16);canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);canvas.style.width=w+'px';canvas.style.height=h+'px';const x=canvas.getContext('2d');x.scale(ratio,ratio);x.clearRect(0,0,w,h);x.fillStyle='#8ca7bf';x.font='12px system-ui';
    if(!arr.length){x.textAlign='center';x.fillText('No readings stored in this time window.',w/2,h/2);return;}
    const vals=arr.map(r=>Number(r.level)),min0=Math.min(...vals),max0=Math.max(...vals),pad=Math.max(.1,(max0-min0)*.18),min=min0-pad,max=max0+pad,t0=new Date(arr[0].time).getTime(),t1=Math.max(t0+60000,new Date(arr[arr.length-1].time).getTime()),L=48,R=18,T=18,B=34,cw=w-L-R,ch=h-T-B;
    x.strokeStyle='#29435b';x.lineWidth=1;x.fillStyle='#8ca7bf';x.textAlign='right';for(let i=0;i<=4;i++){const yy=T+ch*i/4,val=max-(max-min)*i/4;x.beginPath();x.moveTo(L,yy);x.lineTo(w-R,yy);x.stroke();x.fillText(val.toFixed(2),L-7,yy+4);}
    const px=r=>L+((new Date(r.time).getTime()-t0)/(t1-t0))*cw,py=r=>T+(max-Number(r.level))/(max-min)*ch;
    x.strokeStyle='#39a9ff';x.lineWidth=2.5;x.beginPath();arr.forEach((r,i)=>{const xx=px(r),yy=py(r);i?x.lineTo(xx,yy):x.moveTo(xx,yy);});x.stroke();arr.forEach(r=>{x.fillStyle=isVerified(r)?'#76efd2':'#edf6ff';x.beginPath();x.arc(px(r),py(r),isVerified(r)?4:3,0,Math.PI*2);x.fill();});
    x.fillStyle='#8ca7bf';x.font='11px system-ui';x.textAlign='left';x.fillText(fmt(arr[0].time),L,h-10);x.textAlign='right';x.fillText(fmt(arr[arr.length-1].time),w-R,h-10);
  }

  function refreshHistory(){
    const id=Number($('rwHistoryStation').value),hours=Number($('rwHistoryWindow').value),arr=historyFor(id,hours),summary=$('rwHistorySummary'),list=$('rwHistoryList');
    const last=arr[arr.length-1],prev=arr[arr.length-2],delta=last&&prev?Number(last.level)-Number(prev.level):null,hoursDiff=last&&prev?(new Date(last.time)-new Date(prev.time))/3600000:null,ror=delta!==null&&hoursDiff>0?delta/hoursDiff:null,age=last?(Date.now()-new Date(last.time))/3600000:null;
    summary.innerHTML=`<div class="rw-mini"><b>${last?Number(last.level).toFixed(2)+' m':'—'}</b><span>LATEST LEVEL</span></div><div class="rw-mini"><b>${ror==null?'—':(ror>=0?'+':'')+(ror*100).toFixed(1)+' cm/h'}</b><span>RATE OF CHANGE</span></div><div class="rw-mini"><b>${arr.length}</b><span>READINGS IN WINDOW</span></div><div class="rw-mini"><b class="${age!=null&&age<=2?'rw-current':'rw-stale'}">${age==null?'—':age<1?Math.max(0,Math.round(age*60))+' min':age.toFixed(1)+' h'}</b><span>AGE OF LATEST</span></div>`;
    list.innerHTML=arr.length?arr.slice().reverse().map(r=>`<div class="rw-hrow"><div><strong>${Number(r.level).toFixed(2)} m</strong><div class="rw-muted">${fmt(r.time)}</div></div><div>${esc(statusText(r))}${isVerified(r)?'<div class="rw-proof-tag">FIELD VERIFIED</div>':''}</div><div class="rw-muted">${esc(r.source||'Source not specified')}${isVerified(r)?`<br>Verifier: ${esc(r.verification.verifier)}`:''}</div></div>`).join(''):'<div class="rw-empty">No readings stored for this station/time window.</div>';
    drawChart();
  }

  function refreshAudit(){
    const audit=$('rwAudit'),entries=fieldEntries().slice(0,40);audit.innerHTML=entries.length?entries.map(({station,reading:r})=>`<div class="rw-audit-item"><div class="rw-audit-top"><div><div class="rw-audit-name">${esc(station.name)} • ${Number(r.level).toFixed(2)} m</div><div class="rw-proof-tag">VERIFIED FIELD RECORD</div></div><div style="text-align:right;font-size:10px;color:#8ca7bf">${esc(statusText(r))}</div></div><div class="rw-audit-meta">Observed: ${esc(fmt(r.time))}<br>Verifier: ${esc(r.verification.verifier)}${r.verification.role?' • '+esc(r.verification.role):''}<br>Method: ${esc(r.verification.observedSource||'Not specified')}${r.verification.evidence?'<br>Evidence: '+esc(r.verification.evidence):''}${r.note?'<br>Note: '+esc(r.note):''}</div>${r.verification.photoDataUrl?`<img class="rw-proof" src="${r.verification.photoDataUrl}" alt="Field evidence for ${esc(station.name)}">`:''}</div>`).join(''):'<div class="rw-empty">No verified field observations saved on this browser yet.</div>';
  }
  function refreshOps(){refreshHistory();refreshAudit();}
  $('rwHistoryStation').onchange=refreshHistory;$('rwHistoryWindow').onchange=refreshHistory;window.addEventListener('resize',()=>{clearTimeout(window.__rwChartResize);window.__rwChartResize=setTimeout(drawChart,120);});
  $('rwExportAudit').onclick=()=>{const payload={exportedAt:new Date().toISOString(),system:'BYDRRM RiverWatch',operationsVersion:OPS_VERSION,verifiedFieldRecords:fieldEntries().map(({station,reading})=>({stationId:station.id,stationName:station.name,municipality:station.municipality,reading}))};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='riverwatch-verified-audit-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500);};

  const studioStatus=document.getElementById('studioStatus');if(studioStatus&&!studioStatus.querySelector('option[value="READING_ONLY"]')){const o=document.createElement('option');o.value='READING_ONLY';o.textContent='READING ONLY';studioStatus.appendChild(o);}
  const originalRender=window.render;if(typeof originalRender==='function'){window.render=function(){originalRender();setTimeout(refreshOps,0);};}
  refreshOps();
})();