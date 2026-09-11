"use client";

import { useEffect, useMemo, useState } from "react";

type Excavator = {
  id: number;
  name: string;
  trucks: number;
  truckType: "Benne" | "Damper";
  bcmPerTruck: number;
  loadingMin: number;
  cycleMin: number;
  availability: number;
  enabled: boolean;
};

type CycleRecord = {
  id: string;
  date: string;
  excavator: string;
  trucks: number;
  bcmPerTruck: number;
  loadingMin: number;
  cycleMin: number;
  actualBcm: number;
  forecastBcm: number;
};

const defaults: Excavator[] = [
  {id:1,name:"Pelle 108",trucks:8,truckType:"Benne",bcmPerTruck:12,loadingMin:2.5,cycleMin:25,availability:90,enabled:true},
  {id:2,name:"Pelle 403",trucks:10,truckType:"Damper",bcmPerTruck:22,loadingMin:3.2,cycleMin:32,availability:90,enabled:true},
  {id:3,name:"Pelle 3",trucks:6,truckType:"Benne",bcmPerTruck:12,loadingMin:2.8,cycleMin:28,availability:90,enabled:true},
  {id:4,name:"Pelle 4",trucks:6,truckType:"Benne",bcmPerTruck:12,loadingMin:2.8,cycleMin:28,availability:90,enabled:true},
  {id:5,name:"Pelle 5",trucks:5,truckType:"Damper",bcmPerTruck:22,loadingMin:3.5,cycleMin:35,availability:90,enabled:true},
  {id:6,name:"Pelle 6",trucks:5,truckType:"Benne",bcmPerTruck:12,loadingMin:3,cycleMin:30,availability:90,enabled:true},
  {id:7,name:"Pelle 7",trucks:6,truckType:"Benne",bcmPerTruck:12,loadingMin:3,cycleMin:30,availability:90,enabled:true},
  {id:8,name:"Pelle 8",trucks:6,truckType:"Damper",bcmPerTruck:22,loadingMin:3.5,cycleMin:35,availability:90,enabled:true}
];

const calc = (e: Excavator) => {
  const cyclesPerHour = e.cycleMin > 0 ? 60 / e.cycleMin : 0;
  const gross = e.trucks * e.bcmPerTruck * cyclesPerHour;
  const net = gross * (Math.max(0, Math.min(100, e.availability)) / 100);
  return { cyclesPerHour, gross, net };
};

export default function Home() {
  const [tab, setTab] = useState<"dashboard"|"saisie"|"simulation"|"historique"|"parametres">("dashboard");
  const [excavators, setExcavators] = useState<Excavator[]>(defaults);
  const [history, setHistory] = useState<CycleRecord[]>([]);
  const [shiftHours, setShiftHours] = useState(12);
  const [totalFleet, setTotalFleet] = useState(52);
  const [maxFleet, setMaxFleet] = useState(60);
  const [defaultBenne, setDefaultBenne] = useState(12);
  const [defaultDamper, setDefaultDamper] = useState(22);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedE = localStorage.getItem("pit-excavators");
    const savedH = localStorage.getItem("pit-history");
    const savedP = localStorage.getItem("pit-params");
    if (savedE) setExcavators(JSON.parse(savedE));
    if (savedH) setHistory(JSON.parse(savedH));
    if (savedP) {
      const p = JSON.parse(savedP);
      setShiftHours(p.shiftHours ?? 12);
      setTotalFleet(p.totalFleet ?? 52);
      setMaxFleet(p.maxFleet ?? 60);
      setDefaultBenne(p.defaultBenne ?? 12);
      setDefaultDamper(p.defaultDamper ?? 22);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("pit-excavators", JSON.stringify(excavators));
    localStorage.setItem("pit-history", JSON.stringify(history));
    localStorage.setItem("pit-params", JSON.stringify({shiftHours,totalFleet,maxFleet,defaultBenne,defaultDamper}));
  }, [excavators, history, shiftHours, totalFleet, maxFleet, defaultBenne, defaultDamper, mounted]);

  const active = useMemo(() => excavators.filter(e => e.enabled), [excavators]);
  const totalTrucks = active.reduce((s,e)=>s+e.trucks,0);
  const totalHourly = active.reduce((s,e)=>s+calc(e).net,0);
  const totalDaily = totalHourly * shiftHours;

  function update(id:number, patch:Partial<Excavator>) {
    setExcavators(prev => prev.map(e => e.id===id ? {...e,...patch} : e));
  }

  function addExcavator() {
    if (excavators.length >= 8) return;
    const id = Math.max(0, ...excavators.map(e=>e.id))+1;
    setExcavators([...excavators,{id,name:`Pelle ${id}`,trucks:0,truckType:"Benne",bcmPerTruck:defaultBenne,loadingMin:3,cycleMin:30,availability:90,enabled:true}]);
  }

  function removeExcavator(id:number) {
    setExcavators(prev => prev.map(e=>e.id===id ? {...e,enabled:false,trucks:0} : e));
  }

  function restoreExcavator(id:number) {
    setExcavators(prev => prev.map(e=>e.id===id ? {...e,enabled:true} : e));
  }

  function reset() {
    if (!confirm("Réinitialiser les données de démonstration ?")) return;
    setExcavators(defaults);
    setHistory([]);
    setShiftHours(12); setTotalFleet(52); setMaxFleet(60); setDefaultBenne(12); setDefaultDamper(22);
  }

  function addHistory(e: Excavator) {
    const c = calc(e);
    const actual = Number(prompt(`BCM réellement produit pour ${e.name} pendant cette période ?`, c.net.toFixed(1)));
    if (!Number.isFinite(actual)) return;
    const record: CycleRecord = {
      id: crypto.randomUUID(), date: new Date().toISOString(), excavator:e.name,
      trucks:e.trucks,bcmPerTruck:e.bcmPerTruck,loadingMin:e.loadingMin,cycleMin:e.cycleMin,
      actualBcm:actual, forecastBcm:c.net
    };
    setHistory(h=>[record,...h]);
  }

  if (!mounted) return <main className="app"><div className="container"><div className="card">Chargement de Pit Control…</div></div></main>;

  return (
    <main className="app">
      <header className="header">
        <div className="header-inner">
          <div className="brand">PIT CONTROL <small>Forecast • Dispatch • Production en BCM/h</small></div>
          <div className="status">Mode terrain • Données sauvegardées sur l’appareil</div>
        </div>
      </header>

      <div className="container">
        <nav className="tabs">
          {([
            ["dashboard","Dashboard"],["saisie","Saisie terrain"],["simulation","Simulation"],
            ["historique","Historique réel"],["parametres","Paramètres"]
          ] as const).map(([id,label]) =>
            <button key={id} className={`tab ${tab===id?"active":""}`} onClick={()=>setTab(id)}>{label}</button>
          )}
        </nav>

        {tab==="dashboard" && <Dashboard active={active} totalHourly={totalHourly} totalDaily={totalDaily} totalTrucks={totalTrucks} shiftHours={shiftHours} history={history} onHistory={addHistory} />}
        {tab==="saisie" && <Saisie active={active} excavators={excavators} totalFleet={totalFleet} maxFleet={maxFleet} update={update} onHistory={addHistory} />}
        {tab==="simulation" && <Simulation active={active} />}
        {tab==="historique" && <Historique history={history} />}
        {tab==="parametres" && <Parametres shiftHours={shiftHours} setShiftHours={setShiftHours} totalFleet={totalFleet} setTotalFleet={setTotalFleet} maxFleet={maxFleet} setMaxFleet={setMaxFleet} defaultBenne={defaultBenne} setDefaultBenne={setDefaultBenne} defaultDamper={defaultDamper} setDefaultDamper={setDefaultDamper} reset={reset} />}
      </div>
    </main>
  );
}

function Dashboard({active,totalHourly,totalDaily,totalTrucks,shiftHours,history,onHistory}:{active:Excavator[],totalHourly:number,totalDaily:number,totalTrucks:number,shiftHours:number,history:CycleRecord[],onHistory:(e:Excavator)=>void}) {
  const accuracy = history.length ? history.reduce((s,r)=>s + (1-Math.abs(r.actualBcm-r.forecastBcm)/Math.max(r.actualBcm,1)),0)/history.length*100 : null;
  return <div className="grid">
    <div className="grid kpis">
      <div className="card"><div className="kpi-label">Forecast total</div><div className="kpi-value">{totalHourly.toFixed(1)} BCM/h</div></div>
      <div className="card"><div className="kpi-label">Forecast poste</div><div className="kpi-value">{totalDaily.toFixed(0)} BCM</div><div className="muted">{shiftHours} h</div></div>
      <div className="card"><div className="kpi-label">Camions affectés</div><div className="kpi-value">{totalTrucks}</div><div className="muted">{active.length} pelles actives</div></div>
      <div className="card"><div className="kpi-label">Fiabilité historique</div><div className="kpi-value">{accuracy===null?"—":accuracy.toFixed(1)+"%"}</div><div className="muted">{history.length} mesures réelles</div></div>
    </div>
    <div className="card">
      <h2>Vue production par pelle</h2>
      <div className="table-wrap"><table><thead><tr><th>Pelle</th><th>Camions</th><th>Type</th><th>BCM/camion</th><th>Cycle</th><th>Disponibilité</th><th>BCM/h brut</th><th>BCM/h net</th><th></th></tr></thead>
      <tbody>{active.map(e=>{const c=calc(e);return <tr key={e.id}><td className="metric">{e.name}</td><td>{e.trucks}</td><td>{e.truckType}</td><td>{e.bcmPerTruck}</td><td>{e.cycleMin} min</td><td>{e.availability}%</td><td>{c.gross.toFixed(1)}</td><td className="metric">{c.net.toFixed(1)}</td><td><button className="btn secondary" onClick={()=>onHistory(e)}>+ Réel</button></td></tr>})}</tbody></table></div>
    </div>
  </div>
}

function Saisie({active,excavators,totalFleet,maxFleet,update,onHistory}:{active:Excavator[],excavators:Excavator[],totalFleet:number,maxFleet:number,update:(id:number,p:Partial<Excavator>)=>void,onHistory:(e:Excavator)=>void}) {
  const assigned = active.reduce((s,e)=>s+e.trucks,0);
  return <div className="grid">
    <div className="card">
      <h2>Saisie terrain</h2>
      <div className="alert">Remplir uniquement les paramètres opérationnels. Les calculs BCM/h sont automatiques.</div>
      <div className="muted">Flotte affectée : <b>{assigned}</b> / {maxFleet} • Flotte disponible : <b>{Math.max(0,totalFleet-assigned)}</b></div>
    </div>
    <div className="card"><div className="table-wrap"><table><thead><tr><th>Pelle</th><th>Camions</th><th>Type</th><th>BCM/camion</th><th>Chargement (min)</th><th>Cycle total (min)</th><th>Disponibilité %</th><th>BCM/h</th><th></th></tr></thead><tbody>
      {excavators.map(e=>{const c=calc(e); return <tr key={e.id} style={{opacity:e.enabled?1:.5}}>
        <td><input value={e.name} disabled={!e.enabled} onChange={x=>update(e.id,{name:x.target.value})}/></td>
        <td><input type="number" min="0" max={maxFleet} value={e.trucks} disabled={!e.enabled} onChange={x=>update(e.id,{trucks:Math.max(0,Number(x.target.value)||0)})}/></td>
        <td><select value={e.truckType} disabled={!e.enabled} onChange={x=>{const t=x.target.value as "Benne"|"Damper";update(e.id,{truckType:t,bcmPerTruck:t==="Benne"?12:22})}}><option>Benne</option><option>Damper</option></select></td>
        <td><input type="number" min="0" step=".1" value={e.bcmPerTruck} disabled={!e.enabled} onChange={x=>update(e.id,{bcmPerTruck:Number(x.target.value)||0})}/></td>
        <td><input type="number" min="0.1" step=".1" value={e.loadingMin} disabled={!e.enabled} onChange={x=>update(e.id,{loadingMin:Number(x.target.value)||0})}/></td>
        <td><input type="number" min="0.1" step=".1" value={e.cycleMin} disabled={!e.enabled} onChange={x=>update(e.id,{cycleMin:Number(x.target.value)||0})}/></td>
        <td><input type="number" min="0" max="100" step="1" value={e.availability} disabled={!e.enabled} onChange={x=>update(e.id,{availability:Number(x.target.value)||0})}/></td>
        <td className="metric">{c.net.toFixed(1)}</td>
        <td className="actions">{e.enabled ? <><button className="btn secondary" onClick={()=>onHistory(e)}>+ Réel</button><button className="btn danger" onClick={()=>update(e.id,{enabled:false,trucks:0})}>Retirer</button></> : <button className="btn success" onClick={()=>update(e.id,{enabled:true})}>Ajouter</button>}</td>
      </tr>})}</tbody></table></div></div>
  </div>
}

function Simulation({active}:{active:Excavator[]}) {
  const [values,setValues]=useState<Record<number,number>>({});
  const rows=active.map(e=>({...e,simTrucks:values[e.id] ?? e.trucks}));
  const real=active.reduce((s,e)=>s+calc(e).net,0);
  const simulated=rows.reduce((s,e)=>s+(e.simTrucks*e.bcmPerTruck*(60/Math.max(e.cycleMin,.1))*(e.availability/100)),0);
  return <div className="grid two">
    <div className="card"><h2>Simulation de flotte</h2><p className="muted">Modifie seulement le nombre de camions. L’impact est recalculé immédiatement.</p>
      {rows.map(e=><div key={e.id} className="field" style={{marginBottom:12}}><label>{e.name} — camions simulés</label><input type="number" min="0" value={e.simTrucks} onChange={x=>setValues(v=>({...v,[e.id]:Math.max(0,Number(x.target.value)||0)}))}/></div>)}
    </div>
    <div className="card"><h2>Résultat</h2>
      <div className="kpi-label">Forecast actuel</div><div className="kpi-value">{real.toFixed(1)} BCM/h</div>
      <div className="kpi-label" style={{marginTop:18}}>Forecast simulé</div><div className="kpi-value">{simulated.toFixed(1)} BCM/h</div>
      <div style={{marginTop:18}}><span className={`badge ${simulated>=real?"good":"warn"}`}>{simulated>=real?"+":"−"}{Math.abs(simulated-real).toFixed(1)} BCM/h</span></div>
    </div>
  </div>
}

function Historique({history}:{history:CycleRecord[]}) {
  return <div className="card"><h2>Historique des cycles réels</h2><p className="muted">Ces données serviront à améliorer statistiquement le forecast.</p>
    {history.length===0 ? <div className="empty">Aucune mesure réelle enregistrée.</div> : <div className="table-wrap"><table><thead><tr><th>Date</th><th>Pelle</th><th>Camions</th><th>BCM/camion</th><th>Chargement</th><th>Cycle</th><th>Forecast BCM</th><th>Réel BCM</th><th>Écart</th></tr></thead><tbody>
      {history.map(r=>{const err=r.actualBcm-r.forecastBcm;return <tr key={r.id}><td>{new Date(r.date).toLocaleString("fr-FR")}</td><td>{r.excavator}</td><td>{r.trucks}</td><td>{r.bcmPerTruck}</td><td>{r.loadingMin} min</td><td>{r.cycleMin} min</td><td>{r.forecastBcm.toFixed(1)}</td><td className="metric">{r.actualBcm.toFixed(1)}</td><td><span className={`badge ${Math.abs(err)/Math.max(r.actualBcm,1)<=.1?"good":"warn"}`}>{err>=0?"+":""}{err.toFixed(1)}</span></td></tr>})}</tbody></table></div>}
  </div>
}

function Parametres(p:{shiftHours:number,setShiftHours:(n:number)=>void,totalFleet:number,setTotalFleet:(n:number)=>void,maxFleet:number,setMaxFleet:(n:number)=>void,defaultBenne:number,setDefaultBenne:(n:number)=>void,defaultDamper:number,setDefaultDamper:(n:number)=>void,reset:()=>void}) {
  return <div className="grid two">
    <div className="card"><h2>Paramètres opérationnels</h2><div className="form-grid">
      <div className="field"><label>Flotte actuelle</label><input type="number" value={p.totalFleet} onChange={e=>p.setTotalFleet(Number(e.target.value)||0)}/></div>
      <div className="field"><label>Flotte maximale</label><input type="number" value={p.maxFleet} onChange={e=>p.setMaxFleet(Number(e.target.value)||0)}/></div>
      <div className="field"><label>BCM/camion — Benne</label><input type="number" step=".1" value={p.defaultBenne} onChange={e=>p.setDefaultBenne(Number(e.target.value)||0)}/></div>
      <div className="field"><label>BCM/camion — Damper</label><input type="number" step=".1" value={p.defaultDamper} onChange={e=>p.setDefaultDamper(Number(e.target.value)||0)}/></div>
      <div className="field"><label>Durée du poste (h)</label><input type="number" step=".5" value={p.shiftHours} onChange={e=>p.setShiftHours(Number(e.target.value)||0)}/></div>
    </div></div>
    <div className="card"><h2>Formule utilisée</h2><p><b>BCM/h brut = camions × BCM/camion × 60 ÷ cycle total</b></p><p><b>BCM/h net = BCM/h brut × disponibilité</b></p><p className="muted">La capacité en tonnes reste informative. Le forecast principal est exprimé en BCM/h.</p><button className="btn danger" onClick={p.reset}>Réinitialiser la démonstration</button></div>
  </div>
}