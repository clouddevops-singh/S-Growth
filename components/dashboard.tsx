"use client";

import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GrowthState, Skill } from "@/lib/model";

type Section = "home" | "about" | "education" | "growth" | "skills" | "goals";
const sections: { id: Section; label: string; icon: string }[] = [
  { id: "home", label: "Home", icon: "⌂" }, { id: "about", label: "About", icon: "◉" },
  { id: "education", label: "Education", icon: "▤" }, { id: "growth", label: "Growth", icon: "↗" },
  { id: "skills", label: "Skills", icon: "✳" }, { id: "goals", label: "Goals", icon: "◎" },
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
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [affirmIndex, setAffirmIndex] = useState(0);
  const [photoUrl, setPhotoUrl] = useState("");
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
    if (data.photoKey) setPhotoUrl(`/api/photo?t=${Date.now()}`);
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
    setAuthenticated(false); setState(null); setPhotoUrl(""); setSection("home");
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
  const chartDays = useMemo(() => {
    if (!state) return [] as { label: string; count: number }[];
    if (chartPeriod === "month") return Array.from({ length: 4 }, (_, offset) => {
      const end = new Date(); end.setDate(end.getDate() - offset * 7);
      const start = new Date(end); start.setDate(start.getDate() - 6);
      let count = 0;
      for (const day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) count += state.completions[day.toLocaleDateString("en-CA")]?.length || 0;
      return { label: offset === 0 ? "Now" : `${offset}w`, count };
    }).reverse();
    return Array.from({ length: 7 }, (_, offset) => {
      const date = new Date(); date.setDate(date.getDate() - (6 - offset));
      const key = date.toLocaleDateString("en-CA");
      return { label: date.toLocaleDateString(undefined, { weekday: "short" }), count: state.completions[key]?.length || 0 };
    });
  }, [state, chartPeriod]);

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
          <section className="welcome"><div><p className="eyebrow">{new Date().toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric",year:"numeric"}).toUpperCase()}</p><h1>Build a little.<br/><em>Every day.</em></h1><p className="muted">A clearer view of the habits that move you forward.</p><button className="primary" onClick={() => setSection("growth")}>Open growth dashboard <span>↗</span></button></div><div className="welcome-art"><div className="art-orbit orbit-one"/><div className="art-orbit orbit-two"/><div className="art-core">S<span>+</span></div><div className="art-label label-top">SMALL STEPS</div><div className="art-label label-bottom">REAL PROGRESS</div></div></section>
          <div className="section-head"><div><p className="eyebrow">YOUR MOMENTUM</p><h2>A little progress adds up.</h2></div><button className="text-link" onClick={() => setSection("growth")}>View details ↗</button></div>
          <section className="stat-grid"><article className="stat-card"><span className="stat-icon purple">◷</span><span className="stat-label">TODAY'S PROGRESS</span><strong>{progress}%</strong><small>{completedToday.length} of {activeHabits.length} habits checked</small><div className="mini-progress"><i style={{ width: `${progress}%` }}/></div></article><article className="stat-card"><span className="stat-icon orange">♨</span><span className="stat-label">CURRENT STREAK</span><strong>{streak} <small>days</small></strong><small>Keep showing up for yourself.</small><div className="streak-dots">{Array.from({length:7},(_,i)=><i key={i} className={i < Math.min(streak,7) ? "on" : ""}/>)}</div></article><article className="stat-card"><span className="stat-icon green">◎</span><span className="stat-label">ACTIVE GOALS</span><strong>{state.goals.length}</strong><small>{state.goals.filter((goal) => goal.progress >= 100).length} completed so far</small><button className="small-link" onClick={() => setSection("goals")}>Review your goals →</button></article></section>
          <section className="quote-card"><div className="quote-mark">“</div><blockquote>{quotes[quoteIndex][0]}</blockquote><div className="quote-foot"><span>— {quotes[quoteIndex][1]}</span><div className="dots">{quotes.map((_, index)=><button aria-label={`Show quote ${index+1}`} key={index} className={index===quoteIndex?"active":""} onClick={()=>setQuoteIndex(index)}/>)}</div></div></section>
        </>}
        {section === "growth" && <><div className="page-intro"><p className="eyebrow">LIVE GROWTH TRACKING</p><h1>Your <em>Growth</em> Dashboard</h1><p className="muted">Every habit logged. Every day counts. This is your proof that you are becoming who you want to be.</p></div>
          <section className="growth-layout"><div className="panel habits-panel"><div className="panel-title"><div><p className="eyebrow">DAILY PRACTICE</p><h2>Today's habits</h2></div><span className="progress-pill">{progress}% done</span></div><div className="today-progress"><div><b>{completedToday.length}<small> / {activeHabits.length}</small></b><span>completed today</span></div><div className="ring" style={{"--progress":`${progress*3.6}deg`} as React.CSSProperties}><b>{progress}%</b></div></div><div className="habit-list">{activeHabits.map((habit,index)=>{const done=completedToday.includes(habit.id);return <label key={habit.id} className={`habit-row ${done?"done":""}`}><input type="checkbox" checked={done} onChange={()=>update((draft)=>{const checked=draft.completions[today()]||[];draft.completions[today()]=done?checked.filter((id)=>id!==habit.id):[...checked,habit.id];})}/><span className="checkmark">✓</span><span className="habit-name">{habit.name}</span><small>{index%3===0?"Daily":"Today"}</small><button className="icon-button remove" aria-label={`Remove ${habit.name}`} onClick={(event)=>{event.preventDefault();update((draft)=>{draft.habits=draft.habits.filter((entry)=>entry.id!==habit.id);draft.completions[today()]=(draft.completions[today()]||[]).filter((id)=>id!==habit.id);});}}>×</button></label>})}</div><form className="add-row" onSubmit={(event)=>{event.preventDefault();const name=newHabit.trim();if(!name)return;update((draft)=>draft.habits.push({id:uid(),name,active:true}));setNewHabit("");}}><input value={newHabit} maxLength={80} onChange={(event)=>setNewHabit(event.target.value)} placeholder="Add a small daily habit…"/><button className="primary" type="submit">Add habit</button></form><div className="bulk-actions"><button className="text-link" onClick={()=>update((draft)=>{draft.completions[today()]=activeHabits.map((habit)=>habit.id);})}>✓ Mark all done</button><button className="text-link" onClick={()=>update((draft)=>{draft.completions[today()]=[];})}>↺ Reset today</button></div></div>
          <div className="side-stack"><article className="panel chart-panel"><div className="panel-title"><div><p className="eyebrow">{chartPeriod === "week" ? "LAST 7 DAYS" : "LAST 28 DAYS"}</p><h2>Consistency</h2></div><div className="period-switch"><button className={chartPeriod === "week" ? "active" : ""} onClick={() => setChartPeriod("week")}>Week</button><button className={chartPeriod === "month" ? "active" : ""} onClick={() => setChartPeriod("month")}>Month</button></div></div><div className="bar-chart">{chartDays.map((day,index)=><div className="bar-column" key={`${day.label}-${index}`}><div className="bar-value" style={{height:`${Math.max(7, day.count/Math.max(1,activeHabits.length*(chartPeriod === "week" ? 1 : 7))*100)}%`}}/><small>{day.label}</small></div>)}</div><p className="chart-note">Based on your completed habit check-ins.</p></article><article className="affirm-card"><p className="eyebrow">A NOTE TO YOURSELF</p><span className="affirm-star">✳</span><blockquote>“{affirmations[affirmIndex]}”</blockquote><button onClick={()=>setAffirmIndex((index)=>(index+1)%affirmations.length)}>Another reminder ↗</button></article></div></section>
        </>}
        {section === "goals" && <><div className="page-intro"><p className="eyebrow">KEEP YOUR EYES FORWARD</p><h1>Goals & <em>vision</em></h1><p className="muted">Make the long view real with one small step at a time.</p></div><div className="goal-grid">{state.goals.map((goal)=><article className="goal-card" key={goal.id}><div className="goal-top"><span className="goal-icon">{goal.icon}</span><button className="icon-button remove" aria-label="Delete goal" onClick={()=>update((draft)=>{draft.goals=draft.goals.filter((item)=>item.id!==goal.id);})}>×</button></div><input className="goal-title" value={goal.title} aria-label="Goal title" onChange={(event)=>update((draft)=>{const item=draft.goals.find((x)=>x.id===goal.id);if(item)item.title=event.target.value;})}/><div className="goal-meta"><span>{goal.progress}%</span><span>Target · <input value={goal.deadline} aria-label="Goal target date" onChange={(event)=>update((draft)=>{const item=draft.goals.find((x)=>x.id===goal.id);if(item)item.deadline=event.target.value;})}/></span></div><div className="goal-track"><i style={{width:`${goal.progress}%`}}/></div><div className="goal-controls"><button onClick={()=>update((draft)=>{const item=draft.goals.find((x)=>x.id===goal.id);if(item)item.progress=Math.max(0,item.progress-10);})}>−10%</button><button onClick={()=>update((draft)=>{const item=draft.goals.find((x)=>x.id===goal.id);if(item)item.progress=Math.min(100,item.progress+10);})}>+10%</button></div></article>)}</div><button className="primary add-goal" onClick={()=>update((draft)=>draft.goals.push({id:uid(),icon:"🎯",title:"New goal",progress:0,deadline:"Dec 2026"}))}>＋ Add a goal</button><div className="section-head vision-head"><div><p className="eyebrow">FIVE-YEAR VISION</p><h2>What are you building toward?</h2></div></div><div className="vision-grid">{Object.entries({career:"☁️ Career",personal:"🧠 Personal",financial:"◈ Financial",business:"✳ Business"}).map(([key,label])=><label className="vision-card" key={key}><span>{label}</span><textarea value={state.vision[key]||""} onChange={(event)=>update((draft)=>{draft.vision[key]=event.target.value;})}/></label>)}</div></>}
        {section === "skills" && <><div className="page-intro"><p className="eyebrow">YOUR PERSONAL DEVELOPMENT</p><h1>Skills & <em>growth</em></h1><p className="muted">Track what you're working on. Adjust a score to reflect where you are today.</p></div><div className="skill-tabs">{skillTabs.map((tab)=><button key={tab} className={skillTab===tab?"selected":""} onClick={()=>setSkillTab(tab)}>{skillLabels[tab]}</button>)}</div><section className="panel skill-panel"><div className="panel-title"><div><p className="eyebrow">GROWTH AREA</p><h2>{skillLabels[skillTab]}</h2></div><span className="progress-pill">{state.skills[skillTab]?.length||0} skills</span></div><div className="skill-list">{(state.skills[skillTab]||[]).map((skill:Skill)=><label className="skill-row" key={skill.id}><span>{skill.name}</span><input type="range" min="0" max="100" value={skill.score} aria-label={`${skill.name} skill score`} onChange={(event)=>update((draft)=>{const item=draft.skills[skillTab]?.find((entry)=>entry.id===skill.id);if(item)item.score=Number(event.target.value);})}/><b>{skill.score}%</b></label>)}</div></section></>}
        {section === "about" && <><div className="page-intro"><p className="eyebrow">A WORK IN PROGRESS</p><h1>Growth is a <em>practice.</em></h1><p className="muted">This space brings daily habits, learning, and longer-term goals into one view.</p></div><div className="about-grid"><article className="panel"><span className="stat-icon purple">✳</span><h2>Make progress visible</h2><p className="muted">Use simple daily check-ins to notice the effort behind long-term change. Your dashboard turns consistency into something you can see.</p></article><article className="panel"><span className="stat-icon green">↗</span><h2>Keep learning</h2><p className="muted">Track professional and personal skills alongside the habits that make room for focused work, health, and reflection.</p></article><article className="panel"><span className="stat-icon orange">◎</span><h2>Own your pace</h2><p className="muted">Set goals that matter to you, adjust them as life changes, and return to the next useful step.</p></article></div></>}
        {section === "education" && <><div className="page-intro"><p className="eyebrow">LEARNING JOURNEY</p><h1>Keep learning.<br/><em>Keep growing.</em></h1><p className="muted">A place to connect your daily learning with the skills you want to build next.</p></div><section className="panel learning-card"><div className="learning-mark">▤</div><div><p className="eyebrow">YOUR NEXT CHAPTER</p><h2>Learning is part of the journey.</h2><p className="muted">Use the Skills and Goals sections to record what you're studying and where you want to go. Add a learning goal to make your next milestone concrete.</p><button className="primary" onClick={()=>setSection("goals")}>Set a learning goal →</button></div></section></>}
      </div><footer className="footer"><span>© {new Date().getFullYear()} S-Growth</span><span>Your progress is saved privately to your account.</span></footer>
    </section>
  </main>;
}
