"use client";

import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GrowthState, Skill } from "@/lib/model";

type Section = "home" | "about" | "education" | "growth" | "wellness" | "skills" | "goals";
const sections: { id: Section; label: string; icon: string }[] = [
  { id: "home", label: "Home", icon: "⌂" }, { id: "about", label: "About", icon: "◉" },
  { id: "education", label: "Education", icon: "▤" }, { id: "growth", label: "Growth", icon: "↗" },
  { id: "wellness", label: "Wellness", icon: "⌁" }, { id: "skills", label: "Skills", icon: "✳" }, { id: "goals", label: "Goals", icon: "◎" },
];
const skillTabs = ["technical", "devops", "mental", "problemsolving", "business", "physical"] as const;
const skillLabels: Record<string, string> = { technical: "Technical", devops: "Cloud & DevOps", mental: "Mental", problemsolving: "Problem Solving", business: "Business", physical: "Physical" };
const quotes = [
  ["We are what we repeatedly do. Excellence, then, is not an act, but a habit.", "Aristotle"],
  ["Success is the sum of small efforts, repeated day in and day out.", "Robert Collier"],
  ["The secret of your future is hidden in your daily routine.", "Mike Murdock"],
  ["Motivation gets you started. Habit keeps you going.", "Jim Ryun"],
  ["You do not rise to the level of your goals. You fall to the level of your systems.", "James Clear"],
  ["Small daily improvements are the key to staggering long-term results.", "Robin Sharma"],
];
const affirmations = ["I am becoming the person I need to be to achieve the life I want to live.", "Every day I wake up is a chance to level up.", "Small habits, compounded daily, create extraordinary results.", "My discipline is stronger than my excuses.", "I am consistent, focused, and always improving.", "The infrastructure of my mind is being upgraded daily."];
const today = () => new Date().toLocaleDateString("en-CA");
const uid = () => crypto.randomUUID();

export default function Dashboard() {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState<GrowthState | null>(null);
  const [section, setSection] = useState<Section>("home");
  const [skillTab, setSkillTab] = useState<string>("technical");
  const [newHabit, setNewHabit] = useState("");
  const [wellnessDate, setWellnessDate] = useState(today());
  const [wellnessWeight, setWellnessWeight] = useState("");
  const [wellnessWaist, setWellnessWaist] = useState("");
  const [wellnessHips, setWellnessHips] = useState("");
  const [wellnessChest, setWellnessChest] = useState("");
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [affirmIndex, setAffirmIndex] = useState(0);
  const [photoUrl, setPhotoUrl] = useState("/profile.jpg");
  const [chartPeriod, setChartPeriod] = useState<"week" | "month">("week");
  const stateRef = useRef<GrowthState | null>(null);
  const saveQueue = useRef(Promise.resolve());
  const pendingSaves = useRef(0);

  const fetchState = useCallback(async () => {
    const response = await fetch("/api/data", { cache: "no-store" });
    if (!response.ok) throw new Error("Could not load your saved data.");
    const data = await response.json() as GrowthState;
    stateRef.current = data;
    setState(data);
    setPhotoUrl(data.photoKey ? `/api/photo?t=${Date.now()}` : "/profile.jpg");
  }, []);

  useEffect(() => {
    fetch("/api/auth/session", { cache: "no-store" }).then(async (response) => {
      const session = await response.json();
      if (session.authenticated) { setAuthenticated(true); await fetchState(); }
    }).catch((reason) => setError(reason instanceof Error ? reason.message : "Could not load your saved data.")).finally(() => setLoading(false));
  }, [fetchState]);

  useEffect(() => {
    if (!authenticated) return;
    const timer = window.setInterval(() => setQuoteIndex((index) => (index + 1) % quotes.length), 8000);
    return () => window.clearInterval(timer);
  }, [authenticated]);

  const save = async (next: GrowthState) => {
    stateRef.current = next;
    setState(next);
    setSaving(true);
    pendingSaves.current++;
    setError("");
    const write = saveQueue.current.then(async () => {
      const response = await fetch("/api/data", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(next) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save your changes.");
    });
    saveQueue.current = write.catch(() => undefined);
    try { await write; }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save your changes."); }
    finally { pendingSaves.current--; setSaving(pendingSaves.current > 0); }
  };

  const update = (fn: (draft: GrowthState) => void) => {
    const current = stateRef.current;
    if (!current) return;
    const next = structuredClone(current);
    fn(next);
    void save(next);
  };

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault(); setError("");
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not sign in.");
      setAuthenticated(true); setPassword(""); await fetchState();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not sign in."); }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setAuthenticated(false); setState(null); setPhotoUrl("/profile.jpg"); setSection("home");
  };

  const handlePhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const form = new FormData(); form.set("photo", file);
    const response = await fetch("/api/photo", { method: "POST", body: form });
    const result = await response.json();
    if (!response.ok) setError(result.error || "Image upload failed.");
    else { setPhotoUrl(result.url); if (stateRef.current) { const next = { ...stateRef.current, photoKey: result.photoKey }; void save(next); } }
    event.target.value = "";
  };

  const completedToday = state?.completions[today()] || [];
  const activeHabits = state?.habits.filter((habit) => habit.active) || [];
  const progress = activeHabits.length ? Math.round(completedToday.filter((id) => activeHabits.some((h) => h.id === id)).length / activeHabits.length * 100) : 0;
  const streak = useMemo(() => {
    if (!state) return 0;
    let count = 0; const date = new Date();
    while (count < 365) {
      const key = date.toLocaleDateString("en-CA");
      if (!(state.completions[key]?.length)) break;
      count++; date.setDate(date.getDate() - 1);
    }
    return count;
  }, [state]);
  const heatmapDays = useMemo(() => {
    if (!state) return [] as { key: string; label: string; count: number; percent: number }[];
    return Array.from({ length: 28 }, (_, index) => {
      const date = new Date(); date.setHours(12, 0, 0, 0); date.setDate(date.getDate() - (27 - index));
      const key = date.toLocaleDateString("en-CA");
      const count = (state.completions[key] || []).filter((id) => activeHabits.some((habit) => habit.id === id)).length;
      return { key, label: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }), count, percent: activeHabits.length ? Math.round(count / activeHabits.length * 100) : 0 };
    });
  }, [state, activeHabits]);
  const chartDays = useMemo(() => {
    const days = heatmapDays.slice(-7);
    if (chartPeriod === "week") return days.map((day) => ({ label: new Date(`${day.key}T12:00:00`).toLocaleDateString(undefined, { weekday: "short" }), count: day.count, percent: day.percent }));
    return Array.from({ length: 4 }, (_, index) => {
      const week = heatmapDays.slice(index * 7, index * 7 + 7);
      const percent = Math.round(week.reduce((total, day) => total + day.percent, 0) / Math.max(1, week.length));
      return { label: index === 3 ? "This wk" : `Week ${index + 1}`, count: week.reduce((total, day) => total + day.count, 0), percent };
    });
  }, [heatmapDays, chartPeriod]);
  const recentAverage = Math.round(heatmapDays.slice(-7).reduce((total, day) => total + day.percent, 0) / 7);
  const recentCheckIns = heatmapDays.slice(-7).reduce((total, day) => total + day.count, 0);
  const bestDay = heatmapDays.slice(-7).reduce((best, day) => day.percent > best.percent ? day : best, { key: "", label: "—", count: 0, percent: 0 });
  const wellnessEntries = [...(state?.wellness || [])].sort((a, b) => a.date.localeCompare(b.date));
  const weightEntries = wellnessEntries.filter((entry) => Number.isFinite(entry.weight)).slice(-12);
  const weightMin = Math.min(...weightEntries.map((entry) => entry.weight), weightEntries[0]?.weight || 0);
  const weightMax = Math.max(...weightEntries.map((entry) => entry.weight), weightEntries[0]?.weight || 0);
  const weightRange = Math.max(weightMax - weightMin, 1);
  const weightPoints = weightEntries.map((entry, index) => `${weightEntries.length > 1 ? 30 + index / (weightEntries.length - 1) * 540 : 300},${190 - ((entry.weight - weightMin) / weightRange) * 150}`).join(" ");

  if (loading) return <main className="loading"><span className="brand-mark">S</span><p>Opening your private dashboard…</p></main>;
  if (!authenticated || !state) return <main className="login-page"><div className="login-card">
    <div className="brand-mark">S</div><p className="eyebrow">YOUR PRIVATE SPACE</p><h1>Welcome back.</h1><p className="muted">Sign in to continue your growth journey.</p>
    <form onSubmit={handleLogin}><label>Email address<input autoComplete="username" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label><label>Password<input autoComplete="current-password" type="password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label><button className="primary full" type="submit">Sign in <span>→</span></button></form>
    {error && <p className="error" role="alert">{error}</p>}<p className="login-note">Your habits and goals are private to your account.</p>
  </div></main>;

  return <main className={state.theme === "light" ? "app light" : "app"}>
    <aside className="sidebar"><div className="brand"><span className="brand-mark">S</span><div><b>S-Growth</b><small>PERSONAL DASHBOARD</small></div></div>
      <nav aria-label="Main navigation">{sections.map((item) => <button key={item.id} className={section === item.id ? "nav-item active" : "nav-item"} onClick={() => setSection(item.id)}><span>{item.icon}</span>{item.label}{item.id === "growth" && <i />}</button>)}</nav>
      <div className="sidebar-bottom"><div className="privacy"><span>◉</span><div><b>Private by design</b><small>Your progress is yours.</small></div></div><button className="nav-item" onClick={() => void logout()}><span>↪</span>Sign out</button></div>
    </aside>
    <section className="main-column"><header className="topbar"><div className="crumb">Workspace <span>/</span> {sections.find((item) => item.id === section)?.label}</div><div className="top-actions"><span className="save-state"><i className={saving ? "saving" : "saved"}/>{saving ? "Saving…" : "All changes saved"}</span><button className="theme-toggle" onClick={() => update((draft) => { draft.theme = draft.theme === "dark" ? "light" : "dark"; })}>{state.theme === "dark" ? "☼" : "☾"}<span>Theme</span></button><label className="avatar" title="Upload a profile photo"><input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={handlePhoto}/>{photoUrl ? <img src={photoUrl} alt="Your profile"/> : "B"}<span>+</span></label></div></header>
      {error && <div className="toast" role="status">{error}<button onClick={() => setError("")}>×</button></div>}
      <div className="content">
        {section === "home" && <>
          <section className="welcome"><div><p className="eyebrow">{new Date().toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric",year:"numeric"}).toUpperCase()}</p><h1>{state.profile.name}<br/><em>Growing every day.</em></h1><p className="muted">{state.profile.headline}</p><button className="primary" onClick={() => setSection("growth")}>Open growth dashboard <span>↗</span></button></div><div className="welcome-art"><div className="art-orbit orbit-one"/><div className="art-orbit orbit-two"/><div className="art-core">S<span>+</span></div><div className="art-label label-top">SMALL STEPS</div><div className="art-label label-bottom">REAL PROGRESS</div></div></section>
          <div className="section-head"><div><p className="eyebrow">YOUR MOMENTUM</p><h2>A little progress adds up.</h2></div><button className="text-link" onClick={() => setSection("growth")}>View details ↗</button></div>
          <section className="stat-grid"><article className="stat-card"><span className="stat-icon purple">◷</span><span className="stat-label">TODAY'S PROGRESS</span><strong>{progress}%</strong><small>{completedToday.length} of {activeHabits.length} habits checked</small><div className="mini-progress"><i style={{ width: `${progress}%` }}/></div></article><article className="stat-card"><span className="stat-icon orange">♨</span><span className="stat-label">CURRENT STREAK</span><strong>{streak} <small>days</small></strong><small>Keep showing up for yourself.</small><div className="streak-dots">{Array.from({length:7},(_,i)=><i key={i} className={i < Math.min(streak,7) ? "on" : ""}/>)}</div></article><article className="stat-card"><span className="stat-icon green">◎</span><span className="stat-label">ACTIVE GOALS</span><strong>{state.goals.length}</strong><small>{state.goals.filter((goal) => goal.progress >= 100).length} completed so far</small><button className="small-link" onClick={() => setSection("goals")}>Review your goals →</button></article></section>
          <section className="quote-card"><div className="quote-mark">“</div><blockquote>{quotes[quoteIndex][0]}</blockquote><div className="quote-foot"><span>— {quotes[quoteIndex][1]}</span><div className="dots">{quotes.map((_, index)=><button aria-label={`Show quote ${index+1}`} key={index} className={index===quoteIndex?"active":""} onClick={()=>setQuoteIndex(index)}/>)}</div></div></section>
        </>}
        {section === "growth" && <><div className="page-intro"><p className="eyebrow">LIVE GROWTH TRACKING</p><h1>Your <em>Growth</em> Dashboard</h1><p className="muted">Every habit logged. Every day counts. This is your proof that you are becoming who you want to be.</p></div>
          <section className="growth-layout"><div className="panel habits-panel"><div className="panel-title"><div><p className="eyebrow">DAILY PRACTICE</p><h2>Today's habits</h2></div><span className="progress-pill">{progress}% done</span></div><div className="today-progress"><div><b>{completedToday.length}<small> / {activeHabits.length}</small></b><span>completed today</span></div><div className="ring" style={{"--progress":`${progress*3.6}deg`} as React.CSSProperties}><b>{progress}%</b></div></div><div className="habit-list">{activeHabits.map((habit,index)=>{const done=completedToday.includes(habit.id);return <label key={habit.id} className={`habit-row ${done?"done":""}`}><input type="checkbox" checked={done} onChange={()=>update((draft)=>{const checked=draft.completions[today()]||[];draft.completions[today()]=done?checked.filter((id)=>id!==habit.id):[...checked,habit.id];})}/><span className="checkmark">✓</span><span className="habit-name">{habit.name}</span><small>{index%3===0?"Daily":"Today"}</small><button className="icon-button remove" aria-label={`Remove ${habit.name}`} onClick={(event)=>{event.preventDefault();update((draft)=>{draft.habits=draft.habits.filter((entry)=>entry.id!==habit.id);draft.completions[today()]=(draft.completions[today()]||[]).filter((id)=>id!==habit.id);});}}>×</button></label>})}</div><form className="add-row" onSubmit={(event)=>{event.preventDefault();const name=newHabit.trim();if(!name)return;update((draft)=>draft.habits.push({id:uid(),name,active:true}));setNewHabit("");}}><input value={newHabit} maxLength={80} onChange={(event)=>setNewHabit(event.target.value)} placeholder="Add a small daily habit…"/><button className="primary" type="submit">Add habit</button></form><div className="bulk-actions"><button className="text-link" onClick={()=>update((draft)=>{draft.completions[today()]=activeHabits.map((habit)=>habit.id);})}>✓ Mark all done</button><button className="text-link" onClick={()=>update((draft)=>{draft.completions[today()]=[];})}>↺ Reset today</button></div></div>
          <div className="side-stack"><article className="panel chart-panel"><div className="panel-title"><div><p className="eyebrow">{chartPeriod === "week" ? "LAST 7 DAYS" : "LAST 28 DAYS"}</p><h2>Consistency</h2></div><div className="period-switch"><button className={chartPeriod === "week" ? "active" : ""} onClick={() => setChartPeriod("week")}>Week</button><button className={chartPeriod === "month" ? "active" : ""} onClick={() => setChartPeriod("month")}>Month</button></div></div><div className="chart-summary"><strong>{recentAverage}<small>%</small></strong><span>average completion<br/>this week</span><i/><span>{recentCheckIns} check-ins</span></div><div className="bar-chart">{chartDays.map((day,index)=><div className="bar-column" key={`${day.label}-${index}`} title={`${day.label}: ${day.count} habits · ${day.percent}%`}><div className="bar-track"><div className="bar-value" style={{height:`${Math.max(day.percent, 4)}%`}}/><span>{day.percent}%</span></div><small>{day.label}</small></div>)}</div><div className="heatmap-heading"><b>Daily activity · 28 days</b><span>{bestDay.percent ? `Best day · ${bestDay.label}` : "Start checking in to build your map"}</span></div><div className="heatmap-grid">{heatmapDays.map((day)=><span key={day.key} className="heatmap-cell" title={`${day.label}: ${day.count} check-ins (${day.percent}%)`} style={{"--heat":`${Math.max(day.percent / 100, 0.04)}`} as React.CSSProperties}/>)}</div><div className="heatmap-legend"><span>Less</span>{[0,1,2,3,4].map((level)=><i key={level} className={`heat-level level-${level}`}/>)}<span>More</span></div><p className="chart-note">Each bar shows the share of active habits completed. The activity map makes steady routines easy to spot.</p></article><article className="affirm-card"><p className="eyebrow">A NOTE TO YOURSELF</p><span className="affirm-star">✳</span><blockquote>“{affirmations[affirmIndex]}”</blockquote><button onClick={()=>setAffirmIndex((index)=>(index+1)%affirmations.length)}>Another reminder ↗</button></article></div></section>
        </>}
        {section === "wellness" && <>
          <div className="page-intro"><p className="eyebrow">WELLNESS · BODY METRICS</p><h1>Progress you can <em>feel.</em></h1><p className="muted">Log a few measurements over time and see the trend. Your check-ins stay private in your dashboard.</p></div>
          <section className="wellness-summary">
            <article className="stat-card"><span className="stat-label">LATEST WEIGHT</span><strong>{wellnessEntries.length ? wellnessEntries[wellnessEntries.length - 1].weight : "—"}<small>{wellnessEntries.length ? " kg" : ""}</small></strong><small>{wellnessEntries.length ? new Date(`${wellnessEntries[wellnessEntries.length - 1].date}T12:00:00`).toLocaleDateString(undefined,{month:"short",day:"numeric"}) : "Add your first check-in"}</small></article>
            <article className="stat-card"><span className="stat-label">CHANGE SINCE FIRST LOG</span><strong>{wellnessEntries.length > 1 ? (wellnessEntries[wellnessEntries.length - 1].weight - wellnessEntries[0].weight).toFixed(1) : "—"}<small>{wellnessEntries.length > 1 ? " kg" : ""}</small></strong><small>Trend across your recorded check-ins</small></article>
            <article className="stat-card"><span className="stat-label">WAIST MEASUREMENT</span><strong>{wellnessEntries.at(-1)?.waist ?? "—"}<small>{wellnessEntries.at(-1)?.waist ? " cm" : ""}</small></strong><small>Latest recorded measurement</small></article>
          </section>
          <section className="wellness-layout">
            <article className="panel wellness-chart-panel"><div className="panel-title"><div><p className="eyebrow">WEIGHT HISTORY</p><h2>Your trend</h2></div><span className="progress-pill">{weightEntries.length} check-ins</span></div>
              {weightEntries.length ? <><div className="weight-chart"><svg viewBox="0 0 600 220" role="img" aria-label="Weight trend across your last check-ins"><line x1="30" x2="570" y1="40" y2="40"/><line x1="30" x2="570" y1="110" y2="110"/><line x1="30" x2="570" y1="190" y2="190"/><polyline points={weightPoints}/>{weightEntries.map((entry,index)=><circle key={entry.date} cx={weightEntries.length > 1 ? 30 + index / (weightEntries.length - 1) * 540 : 300} cy={190 - ((entry.weight - weightMin) / weightRange) * 150} r="5"><title>{entry.date}: {entry.weight} kg</title></circle>)}</svg><div className="weight-labels">{weightEntries.map((entry)=><span key={entry.date}>{new Date(`${entry.date}T12:00:00`).toLocaleDateString(undefined,{month:"short",day:"numeric"})}</span>)}</div></div><div className="measurement-list">{weightEntries.slice(-5).reverse().map((entry)=><div key={entry.date}><span>{new Date(`${entry.date}T12:00:00`).toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"})}</span><b>{entry.weight} kg</b><small>{[entry.waist && `Waist ${entry.waist} cm`,entry.hips && `Hips ${entry.hips} cm`,entry.chest && `Chest ${entry.chest} cm`].filter(Boolean).join(" · ") || "Weight only"}</small></div>)}</div></> : <div className="wellness-empty"><span>◌</span><h3>Your first check-in starts the chart</h3><p>Record a weight or measurement below. Your history will build here over time.</p></div>}
            </article>
            <article className="panel wellness-form-panel"><p className="eyebrow">NEW CHECK-IN</p><h2>Log a measurement</h2><form onSubmit={(event)=>{event.preventDefault();const weight=Number(wellnessWeight);if(!Number.isFinite(weight)||weight<=0)return;update((draft)=>{const entries=(draft.wellness||[]).filter((entry)=>entry.date!==wellnessDate);entries.push({date:wellnessDate,weight,...(wellnessWaist?{waist:Number(wellnessWaist)}:{}),...(wellnessHips?{hips:Number(wellnessHips)}:{}),...(wellnessChest?{chest:Number(wellnessChest)}:{})});draft.wellness=entries.sort((a,b)=>a.date.localeCompare(b.date)).slice(-365);});setWellnessWeight("");setWellnessWaist("");setWellnessHips("");setWellnessChest("");}}>
              <label>Date<input type="date" value={wellnessDate} onChange={(event)=>setWellnessDate(event.target.value)} required/></label><label>Weight · kg<input type="number" min="1" max="500" step="0.1" value={wellnessWeight} onChange={(event)=>setWellnessWeight(event.target.value)} placeholder="e.g. 72.4" required/></label><label>Waist · cm<input type="number" min="1" max="300" step="0.1" value={wellnessWaist} onChange={(event)=>setWellnessWaist(event.target.value)} placeholder="Optional"/></label><label>Hips · cm<input type="number" min="1" max="300" step="0.1" value={wellnessHips} onChange={(event)=>setWellnessHips(event.target.value)} placeholder="Optional"/></label><label>Chest · cm<input type="number" min="1" max="300" step="0.1" value={wellnessChest} onChange={(event)=>setWellnessChest(event.target.value)} placeholder="Optional"/></label><button className="primary full" type="submit">Save check-in <span>↗</span></button>
            </form><p className="chart-note">One entry per day. Updating a date replaces its previous check-in.</p></article>
          </section>
        </>}        {section === "goals" && <><div className="page-intro"><p className="eyebrow">KEEP YOUR EYES FORWARD</p><h1>Goals & <em>vision</em></h1><p className="muted">Make the long view real with one small step at a time.</p></div><div className="goal-grid">{state.goals.map((goal)=><article className="goal-card" key={goal.id}><div className="goal-top"><span className="goal-icon">{goal.icon}</span><button className="icon-button remove" aria-label="Delete goal" onClick={()=>update((draft)=>{draft.goals=draft.goals.filter((item)=>item.id!==goal.id);})}>×</button></div><input className="goal-title" value={goal.title} aria-label="Goal title" onChange={(event)=>update((draft)=>{const item=draft.goals.find((x)=>x.id===goal.id);if(item)item.title=event.target.value;})}/><div className="goal-extra"><select aria-label="Goal area" value={goal.category||"Personal Growth"} onChange={(event)=>update((draft)=>{const item=draft.goals.find((x)=>x.id===goal.id);if(item)item.category=event.target.value;})}>{["Health & Fitness","Career Growth","Finances","Relationships","Personal Growth","Home","Adventure","Fun & Hobbies","Community"].map((area)=><option key={area}>{area}</option>)}</select><input value={goal.reward||""} aria-label="Goal reward" placeholder="Reward for reaching this goal" onChange={(event)=>update((draft)=>{const item=draft.goals.find((x)=>x.id===goal.id);if(item)item.reward=event.target.value;})}/></div><div className="goal-meta"><span>{goal.progress}%</span><span>Target · <input value={goal.deadline} aria-label="Goal target date" onChange={(event)=>update((draft)=>{const item=draft.goals.find((x)=>x.id===goal.id);if(item)item.deadline=event.target.value;})}/></span></div><div className="goal-track"><i style={{width:`${goal.progress}%`}}/></div><div className="goal-controls"><button onClick={()=>update((draft)=>{const item=draft.goals.find((x)=>x.id===goal.id);if(item)item.progress=Math.max(0,item.progress-10);})}>−10%</button><button onClick={()=>update((draft)=>{const item=draft.goals.find((x)=>x.id===goal.id);if(item)item.progress=Math.min(100,item.progress+10);})}>+10%</button></div></article>)}</div><button className="primary add-goal" onClick={()=>update((draft)=>draft.goals.push({id:uid(),icon:"🎯",title:"New goal",progress:0,deadline:"Dec 2026",category:"Personal Growth",reward:""}))}>＋ Add a goal</button><div className="section-head vision-head"><div><p className="eyebrow">FIVE-YEAR VISION</p><h2>What are you building toward?</h2></div></div><div className="vision-grid">{Object.entries({career:"☁️ Career",personal:"🧠 Personal",financial:"◈ Financial",business:"✳ Business"}).map(([key,label])=><label className="vision-card" key={key}><span>{label}</span><textarea value={state.vision[key]||""} onChange={(event)=>update((draft)=>{draft.vision[key]=event.target.value;})}/></label>)}</div></>}
        {section === "skills" && <><div className="page-intro"><p className="eyebrow">YOUR PERSONAL DEVELOPMENT</p><h1>Skills & <em>growth</em></h1><p className="muted">Track what you're working on. Adjust a score to reflect where you are today.</p></div><div className="skill-tabs">{skillTabs.map((tab)=><button key={tab} className={skillTab===tab?"selected":""} onClick={()=>setSkillTab(tab)}>{skillLabels[tab]}</button>)}</div><section className="panel skill-panel"><div className="panel-title"><div><p className="eyebrow">GROWTH AREA</p><h2>{skillLabels[skillTab]}</h2></div><span className="progress-pill">{state.skills[skillTab]?.length||0} skills</span></div><div className="skill-list">{(state.skills[skillTab]||[]).map((skill:Skill)=><label className="skill-row" key={skill.id}><span>{skill.name}</span><input type="range" min="0" max="100" value={skill.score} aria-label={`${skill.name} skill score`} onChange={(event)=>update((draft)=>{const item=draft.skills[skillTab]?.find((entry)=>entry.id===skill.id);if(item)item.score=Number(event.target.value);})}/><b>{skill.score}%</b></label>)}</div></section></>}
        {section === "about" && <><div className="page-intro"><p className="eyebrow">WHO I AM</p><h1>Growth is a <em>system.</em></h1><p className="muted">{state.profile.headline}</p></div><section className="panel story-card"><div className="story-avatar">{state.profile.name.trim().charAt(0).toUpperCase()}</div><div><p className="eyebrow">MY STORY · EDITABLE</p><h2>Build systems for growth—in code and in life.</h2><textarea className="about-editor" aria-label="About me" value={state.profile.about} onChange={(event)=>update((draft)=>{draft.profile.about=event.target.value;})}/><div className="tag-list"><span>Goal-oriented</span><span>Lifelong learner</span><span>Cloud native</span><span>Systems thinking</span><span>Continuous improvement</span></div></div></section><div className="about-grid principle-grid"><article className="panel"><span className="stat-icon orange">♨</span><h2>Consistency over perfection</h2><p className="muted">Show up for the next small step, even on an imperfect day.</p></article><article className="panel"><span className="stat-icon purple">⌘</span><h2>Systems thinking</h2><p className="muted">Build routines that make useful actions easier to repeat.</p></article><article className="panel"><span className="stat-icon green">↗</span><h2>One percent better</h2><p className="muted">Let small, honest improvements compound over time.</p></article></div></>}
        {section === "education" && <><div className="page-intro"><p className="eyebrow">JOURNEY & TRACK RECORD</p><h1>Experience & <em>education</em></h1><p className="muted">Cloud and DevOps work, an engineering foundation, and a learning roadmap that keeps moving.</p></div><section className="panel timeline-panel"><p className="eyebrow">PROFESSIONAL EXPERIENCE</p><div className="timeline"><article><span className="timeline-dot"/><small>FEB 2022 — AUG 2025</small><h2>DevOps Engineer</h2><b>Busigence Technologies · Bengaluru</b><p className="muted">Worked across Kubernetes operations, cloud deployments, CI/CD, Kafka and Celery infrastructure, and observability with Prometheus, Grafana, Mimir, Tempo, and Loki.</p></article><article><span className="timeline-dot"/><small>AUG 2021 — JAN 2022</small><h2>DevOps Engineer</h2><b>Anuta Network · Bengaluru</b><p className="muted">Administered EKS and Kubernetes environments, supported provisioning and troubleshooting, and automated routine operations with cloud and delivery tooling.</p></article><article><span className="timeline-dot"/><small>MAY 2021 — AUG 2021</small><h2>DevOps Intern</h2><b>Sirpi · Bengaluru</b><p className="muted">Dockerized Node.js and Python applications and deployed serverless projects on Cloud Run and Cloud Functions using CI/CD.</p></article></div></section><section className="panel education-card"><div className="learning-mark">▤</div><div><p className="eyebrow">ACADEMIC TIMELINE</p><small>2017 — 2021</small><h2>Bachelor of Engineering · Electronics & Communication</h2><b>Visvesvaraya Technological University · Nitte Meenakshi Institute of Technology</b><p className="muted">GPA: 7.4. The original page does not specify the GPA scale.</p></div></section><section className="panel roadmap-panel"><div className="panel-title"><div><p className="eyebrow">CNCF KUBERNETES ROADMAP</p><h2>Learning goals</h2></div><span className="progress-pill">Planned</span></div><div className="roadmap">{["KCNA · Kubernetes and Cloud Native Associate","KCSA · Kubernetes and Cloud Native Security Associate","CKAD · Certified Kubernetes Application Developer","CKA · Certified Kubernetes Administrator","CKS · Certified Kubernetes Security Specialist"].map((item,index)=><div key={item}><span>{String(index+1).padStart(2,"0")}</span><b>{item}</b><small>Planned</small></div>)}</div><button className="text-link" onClick={()=>setSection("goals")}>Track a certification as a goal →</button></section></>}
      </div><footer className="footer"><span>© {new Date().getFullYear()} S-Growth</span><span>Your progress is saved privately to your account.</span></footer>
    </section>
  </main>;
}

