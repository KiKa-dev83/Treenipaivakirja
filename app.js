const KEY="treenipaivakirja-data-v1";
const $=s=>document.querySelector(s);
const today=()=>new Date().toISOString().slice(0,10);
const uid=()=>Math.random().toString(36).slice(2,10);
const seedExercises=[
 ["Penkkipunnerrus","Rinta"],["Vinopenkkipunnerrus käsipainoilla","Rinta"],["Ylätalja","Selkä"],
 ["Alatalja","Selkä"],["Kyykky","Jalat"],["Jalkaprässi","Jalat"],["Romanialainen maastaveto","Jalat"],
 ["Pystypunnerrus","Olkapäät"],["Sivuvipunostot","Olkapäät"],["Hauiskääntö","Kädet"],
 ["Ojentajapunnerrus taljassa","Kädet"],["Vatsarutistus","Vatsa"]
].map(([name,muscle])=>({id:uid(),name,muscle}));
let data=load();
function fresh(){return {exercises:seedExercises,templates:[],workouts:[],active:null}}
function load(){try{return JSON.parse(localStorage.getItem(KEY))||fresh()}catch{return fresh()}}
function save(){localStorage.setItem(KEY,JSON.stringify(data))}
function toast(s){const t=$("#toast");t.textContent=s;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2200)}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function fmtDate(s){return new Date(s+"T12:00:00").toLocaleDateString("fi-FI",{day:"numeric",month:"short",year:"numeric"})}
function volume(w){return w.exercises.reduce((n,e)=>n+e.sets.reduce((a,s)=>a+(+s.weight||0)*(+s.reps||0),0),0)}
function allSets(){return data.workouts.flatMap(w=>w.exercises.flatMap(e=>e.sets.map(s=>({...s,name:e.name,date:w.date}))))}
function setView(v){document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.view===v));({home:home,workout:workout,history:history,stats:stats,library:library}[v]||home)();window.scrollTo(0,0)}
document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>setView(b.dataset.view)));
$("#backupBtn").onclick=backup;
$("#restoreBtn").onclick=()=>$("#importFile").click();
function home(){
 const total=data.workouts.length,week=new Date();week.setDate(week.getDate()-6);const recent=data.workouts.filter(w=>new Date(w.date+"T12:00:00")>=week);
 const last=data.workouts.slice().sort((a,b)=>b.date.localeCompare(a.date))[0];
 $("#app").innerHTML=`<h2>Yhteenveto</h2><div class="grid">
 <div class="card"><div class="metric">${total}</div><div class="metric-label">Harjoitusta yhteensä</div></div>
 <div class="card"><div class="metric">${recent.length}</div><div class="metric-label">Harjoitusta viimeisen 7 päivän aikana</div></div>
 <div class="card"><div class="metric">${Math.round(data.workouts.reduce((a,w)=>a+volume(w),0)).toLocaleString("fi-FI")} kg</div><div class="metric-label">Nostettu kokonaismäärä</div></div>
 <div class="card"><div class="metric">${data.exercises.length}</div><div class="metric-label">Liikettä liikepankissa</div></div></div>
 <div class="section-head"><h3>Viimeisin harjoitus</h3></div>
 ${last?`<div class="card"><div class="row between"><b>${esc(last.name||"Harjoitus")}</b><span class="pill">${fmtDate(last.date)}</span></div><p class="muted">${last.exercises.length} liikettä · ${last.exercises.reduce((a,e)=>a+e.sets.length,0)} sarjaa · ${Math.round(volume(last)).toLocaleString("fi-FI")} kg</p><button class="secondary full" id="lastDetail">Näytä harjoitus</button></div>`:`<div class="card empty">Et ole vielä kirjannut harjoituksia.<br>Aloita ensimmäinen harjoitus Harjoitus-välilehdeltä.</div>`}
 <button class="primary full" id="startNow">＋ Aloita uusi harjoitus</button>
 <div class="section-head"><h3>Harjoittelun viimeaikainen kehitys</h3></div><div class="card"><canvas id="homeChart" width="600" height="220"></canvas><div class="hint">Harjoitusten nostettu kokonaismäärä päivittäin.</div></div>`;
 $("#startNow").onclick=()=>{if(!data.active)data.active={id:uid(),date:today(),name:"",exercises:[]};save();setView("workout")};
 if(last)$("#lastDetail").onclick=()=>showWorkout(last.id);
 drawVolumeChart($("#homeChart"),data.workouts.slice().sort((a,b)=>a.date.localeCompare(b.date)).slice(-10));
}
function workout(){
 if(!data.active)data.active={id:uid(),date:today(),name:"",exercises:[]};
 const a=data.active;
 $("#app").innerHTML=`<h2>Harjoitus</h2><div class="card"><div class="field"><label>Harjoituksen nimi</label><input id="wname" placeholder="Esim. Ylävartalo A" value="${esc(a.name)}"></div><div class="field"><label>Päivämäärä</label><input id="wdate" type="date" value="${a.date}"></div><div class="row between"><span class="hint">Kirjaukset tallentuvat automaattisesti tähän puhelimeen.</span><button class="small-btn" id="discard">Hylkää</button></div></div>
 <div class="section-head"><h3>Liikkeet</h3><button class="small-btn" id="addExercise">＋ Lisää liike</button></div>
 <div id="activeExercises"></div><button class="primary full" id="finish">Tallenna harjoitus</button>`;
 $("#wname").oninput=e=>{a.name=e.target.value;save()};$("#wdate").onchange=e=>{a.date=e.target.value;save()};
 $("#discard").onclick=()=>{if(confirm("Hylätäänkö keskeneräinen harjoitus?")){data.active=null;save();setView("home")}};
 $("#addExercise").onclick=addExercise;
 $("#finish").onclick=finishWorkout;
 renderActive();
}
function renderActive(){
 const host=$("#activeExercises");if(!host)return;const a=data.active;
 if(!a.exercises.length){host.innerHTML='<div class="card empty">Lisää ensimmäinen liike aloittaaksesi kirjaamisen.</div>';return}
 host.innerHTML=a.exercises.map((e,i)=>`<div class="exercise"><div class="row between"><div><b>${esc(e.name)}</b><div class="hint">${esc(e.muscle||"")}</div></div><button class="small-btn" data-remove="${i}">Poista</button></div>
 <div class="setrow"><span class="setnum">Sarja</span><span class="hint">Paino (kg)</span><span class="hint">Toistot</span><span></span></div>
 ${e.sets.map((s,j)=>`<div class="setrow"><span class="setnum">${j+1}</span><input inputmode="decimal" type="number" min="0" step="0.5" placeholder="kg" value="${s.weight}" data-e="${i}" data-s="${j}" data-k="weight"><input inputmode="numeric" type="number" min="0" step="1" placeholder="toistot" value="${s.reps}" data-e="${i}" data-s="${j}" data-k="reps"><button class="small-btn" data-delset="${i}:${j}">×</button></div>`).join("")}
 <button class="secondary full" data-addset="${i}">＋ Lisää sarja</button></div>`).join("");
 host.querySelectorAll("[data-e]").forEach(el=>el.onchange=()=>{a.exercises[+el.dataset.e].sets[+el.dataset.s][el.dataset.k]=el.value;save()});
 host.querySelectorAll("[data-addset]").forEach(b=>b.onclick=()=>{const e=a.exercises[+b.dataset.addset],last=e.sets[e.sets.length-1]||{weight:"",reps:""};e.sets.push({...last});save();renderActive()});
 host.querySelectorAll("[data-delset]").forEach(b=>b.onclick=()=>{const [i,j]=b.dataset.delset.split(":").map(Number);a.exercises[i].sets.splice(j,1);save();renderActive()});
 host.querySelectorAll("[data-remove]").forEach(b=>b.onclick=()=>{a.exercises.splice(+b.dataset.remove,1);save();renderActive()});
}
function addExercise(){
 const opts=data.exercises.map(e=>`<option value="${e.id}">${esc(e.name)} · ${esc(e.muscle)}</option>`).join("");
 const name=prompt("Lisää liike. Kirjoita uuden liikkeen nimi tai valitse olemassa oleva nimi seuraavasta valikosta.");
 if(name===null)return;
 let ex=data.exercises.find(e=>e.name.toLowerCase()===name.trim().toLowerCase());
 if(!ex){if(!name.trim())return;ex={id:uid(),name:name.trim(),muscle:"Muu"};data.exercises.push(ex)}
 data.active.exercises.push({exerciseId:ex.id,name:ex.name,muscle:ex.muscle,sets:[{weight:"",reps:""}]});save();renderActive();
}
function finishWorkout(){
 const a=data.active;a.name=$("#wname").value.trim();a.date=$("#wdate").value||today();
 if(!a.exercises.length){toast("Lisää harjoitukseen vähintään yksi liike.");return}
 if(!a.exercises.some(e=>e.sets.some(s=>+s.reps>0))){toast("Kirjaa vähintään yhden sarjan toistot.");return}
 data.workouts.push({...a,completedAt:new Date().toISOString()});data.active=null;save();toast("Harjoitus tallennettu!");setView("home");
}
function history(){
 const list=data.workouts.slice().sort((a,b)=>b.date.localeCompare(a.date));
 $("#app").innerHTML=`<h2>Harjoitushistoria</h2>${list.length?list.map(w=>`<div class="card"><div class="row between"><b>${esc(w.name||"Harjoitus")}</b><span class="pill">${fmtDate(w.date)}</span></div><p class="muted">${w.exercises.length} liikettä · ${w.exercises.reduce((a,e)=>a+e.sets.length,0)} sarjaa · ${Math.round(volume(w)).toLocaleString("fi-FI")} kg</p><div class="row"><button class="secondary" data-open="${w.id}">Avaa</button><button class="small-btn" data-delete="${w.id}">Poista</button></div></div>`).join(""):'<div class="card empty">Harjoitushistoria on vielä tyhjä.</div>'}`;
 $("#app").querySelectorAll("[data-open]").forEach(b=>b.onclick=()=>showWorkout(b.dataset.open));
 $("#app").querySelectorAll("[data-delete]").forEach(b=>b.onclick=()=>{if(confirm("Poistetaanko harjoitus historiasta?")){data.workouts=data.workouts.filter(w=>w.id!==b.dataset.delete);save();history()}});
}
function showWorkout(id){
 const w=data.workouts.find(x=>x.id===id);if(!w)return;
 $("#app").innerHTML=`<button class="small-btn" id="backHistory">← Historiaan</button><h2>${esc(w.name||"Harjoitus")}</h2><p class="muted">${fmtDate(w.date)} · ${Math.round(volume(w)).toLocaleString("fi-FI")} kg kokonaismäärä</p>${w.exercises.map(e=>`<div class="card"><b>${esc(e.name)}</b>${e.sets.map((s,i)=>`<div class="listitem row between"><span class="muted">Sarja ${i+1}</span><b>${esc(s.weight||"0")} kg × ${esc(s.reps||"0")}</b></div>`).join("")}</div>`).join("")}`;
 $("#backHistory").onclick=history;
}
function stats(){
 const sets=allSets(),names=[...new Set(sets.map(s=>s.name))];
 $("#app").innerHTML=`<h2>Tilastot ja kehitys</h2><div class="grid"><div class="card"><div class="metric">${data.workouts.length}</div><div class="metric-label">Harjoituksia</div></div><div class="card"><div class="metric">${sets.length}</div><div class="metric-label">Kirjattuja sarjoja</div></div><div class="card"><div class="metric">${Math.round(data.workouts.reduce((a,w)=>a+volume(w),0)).toLocaleString("fi-FI")} kg</div><div class="metric-label">Kokonaisvolyymi</div></div><div class="card"><div class="metric">${names.length}</div><div class="metric-label">Harjoitettuja liikkeitä</div></div></div>
 <div class="section-head"><h3>Volyymi harjoituksittain</h3></div><div class="card"><canvas id="statsChart" width="600" height="240"></canvas></div>
 <div class="section-head"><h3>Liikekohtainen kehitys</h3></div><div class="card"><div class="field"><label>Valitse liike</label><select id="exerciseSelect">${names.map(n=>`<option>${esc(n)}</option>`).join("")}</select></div><canvas id="exerciseChart" width="600" height="240"></canvas><div id="prInfo" class="hint"></div></div>
 <div class="section-head"><h3>Henkilökohtaiset ennätykset</h3></div><div id="prs"></div>`;
 const ordered=data.workouts.slice().sort((a,b)=>a.date.localeCompare(b.date));drawVolumeChart($("#statsChart"),ordered.slice(-12));
 const select=$("#exerciseSelect");if(names.length){const draw=()=>drawExercise(select.value);select.onchange=draw;draw()}else{$("#exerciseChart").style.display="none";$("#prInfo").textContent="Kirjaa harjoituksia nähdäksesi liikkeiden kehityksen."}
 const prs=names.map(n=>{const rows=sets.filter(s=>s.name===n);return {n,max:Math.max(...rows.map(s=>+s.weight||0)),best:Math.max(...rows.map(s=>(+s.weight||0)*(+s.reps||0)))}}).sort((a,b)=>b.max-a.max).slice(0,8);
 $("#prs").innerHTML=prs.length?`<div class="card">${prs.map(p=>`<div class="listitem row between"><span>${esc(p.n)}</span><b>${p.max} kg</b></div>`).join("")}</div>`:'<div class="card empty">Ennätyksiä muodostuu, kun kirjaat harjoituksia.</div>';
}
function drawExercise(name){
 const rows=allSets().filter(s=>s.name===name).sort((a,b)=>a.date.localeCompare(b.date));
 const byDate={};rows.forEach(s=>byDate[s.date]=Math.max(byDate[s.date]||0,+s.weight||0));
 const vals=Object.entries(byDate).map(([date,value])=>({label:date.slice(5),value}));
 drawLine($("#exerciseChart"),vals);
 const max=Math.max(0,...rows.map(s=>+s.weight||0));$("#prInfo").textContent=`Suurin kirjattu työsarjapaino: ${max} kg. (Ei arvioitu 1RM.)`;
}
function drawVolumeChart(canvas,workouts){
 const vals=workouts.map(w=>({label:w.date.slice(5),value:Math.round(volume(w))}));drawLine(canvas,vals);
}
function drawLine(canvas,items){
 if(!canvas)return;const ctx=canvas.getContext("2d"),w=canvas.width,h=canvas.height;ctx.clearRect(0,0,w,h);
 const pad={l:42,r:12,t:15,b:32},vals=items.map(x=>x.value),max=Math.max(1,...vals)*1.15;
 ctx.strokeStyle="#2b3c52";ctx.fillStyle="#9aabc1";ctx.font="12px sans-serif";
 for(let i=0;i<4;i++){let y=pad.t+(h-pad.t-pad.b)*i/3;ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(w-pad.r,y);ctx.stroke();ctx.fillText(Math.round(max*(1-i/3)),3,y+4)}
 if(!items.length){ctx.fillText("Ei vielä kirjattua dataa",pad.l,h/2);return}
 const x=i=>pad.l+(items.length===1?(w-pad.l-pad.r)/2:i*(w-pad.l-pad.r)/(items.length-1));
 const y=v=>h-pad.b-(v/max)*(h-pad.t-pad.b);
 ctx.strokeStyle="#9be15d";ctx.lineWidth=3;ctx.beginPath();items.forEach((it,i)=>i?ctx.lineTo(x(i),y(it.value)):ctx.moveTo(x(i),y(it.value)));ctx.stroke();
 items.forEach((it,i)=>{ctx.fillStyle="#9be15d";ctx.beginPath();ctx.arc(x(i),y(it.value),4,0,Math.PI*2);ctx.fill();if(items.length<=8||i===0||i===items.length-1){ctx.fillStyle="#9aabc1";ctx.fillText(it.label,x(i)-15,h-8)}})
}
function library(){
 $("#app").innerHTML=`<h2>Liikepankki</h2><div class="card"><div class="field"><label>Liikkeen nimi</label><input id="newEx" placeholder="Esim. Kulmasoutu"></div><div class="field"><label>Lihasryhmä</label><select id="newMuscle">${["Rinta","Selkä","Jalat","Olkapäät","Kädet","Vatsa","Muu"].map(x=>`<option>${x}</option>`).join("")}</select></div><button class="primary full" id="saveEx">Lisää liike</button></div>
 <div class="field"><input id="filterEx" placeholder="Hae liikettä..."></div><div id="exerciseList"></div>`;
 const render=()=>{const q=$("#filterEx").value.toLowerCase();$("#exerciseList").innerHTML=data.exercises.filter(e=>(e.name+" "+e.muscle).toLowerCase().includes(q)).sort((a,b)=>a.name.localeCompare(b.name,"fi")).map(e=>`<div class="listitem row between"><div><b>${esc(e.name)}</b><div class="hint">${esc(e.muscle)}</div></div><button class="small-btn" data-exdel="${e.id}">Poista</button></div>`).join("")||'<div class="empty">Ei hakutuloksia.</div>';$("#exerciseList").querySelectorAll("[data-exdel]").forEach(b=>b.onclick=()=>{if(confirm("Poistetaanko liike liikepankista? Aiemmat harjoitukset säilyvät.")){data.exercises=data.exercises.filter(e=>e.id!==b.dataset.exdel);save();render()}})};
 $("#saveEx").onclick=()=>{const n=$("#newEx").value.trim();if(!n)return toast("Kirjoita liikkeen nimi.");if(data.exercises.some(e=>e.name.toLowerCase()===n.toLowerCase()))return toast("Liike on jo liikepankissa.");data.exercises.push({id:uid(),name:n,muscle:$("#newMuscle").value});save();$("#newEx").value="";render();toast("Liike lisätty.")};
 $("#filterEx").oninput=render;render();
}
function backup(){
 const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download=`treenipaivakirja-${today()}.json`;a.click();URL.revokeObjectURL(url);toast("Varmuuskopio luotu.");
}
function importBackup(file){
 const r=new FileReader();r.onload=()=>{try{const d=JSON.parse(r.result);if(!d.exercises||!d.workouts)throw Error();if(confirm("Korvataanko tämän puhelimen tiedot varmuuskopion tiedoilla?")){data=d;save();setView("home");toast("Varmuuskopio palautettu.")}}catch{alert("Tiedostoa ei voitu lukea varmuuskopiona.")}};r.readAsText(file);
}
$("#importFile").onchange=e=>{if(e.target.files[0])importBackup(e.target.files[0]);e.target.value=""};
if("serviceWorker" in navigator && location.protocol!=="file:")navigator.serviceWorker.register("./sw.js").catch(()=>{});
setView("home");
