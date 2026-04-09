/**
 * WallCalendar — Premium Interactive Calendar Component
 *
 * Features:
 *  - Playfair Display + DM Sans typography pairing
 *  - Full-bleed hero image per month with smooth fade transition
 *  - Monday-first week grid with weekend color distinction
 *  - Day range selector with live hover preview
 *  - Blue pip for days that have a saved note
 *  - Holiday markers (pip + name on hover)
 *  - Notes panel: per-date, per-range, or per-month
 *  - Saved notes feed with click-to-edit
 *  - Dark / light theme toggle
 *  - Year ± navigation buttons
 *  - Month strip quick-jump
 *  - Spiral binding visual
 *  - Page-flip animation on month change
 *  - Keyboard ← → navigation
 *  - localStorage persistence
 *  - Fully responsive (stacked on mobile, side-by-side ≥560px)
 */

import { useState, useEffect, useCallback } from "react";

// ─── Data ──────────────────────────────────────────────────────────────────────
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const WDAYS  = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const WE     = [5, 6]; // Sat, Sun in Mon-first grid
const SEASONS = ["❄ Winter","❄ Winter","🌱 Spring","🌱 Spring","🌸 Spring","☀ Summer","☀ Summer","☀ Summer","🍂 Autumn","🍂 Autumn","🍂 Autumn","❄ Winter"];

const IMGS = [
  "https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?w=900&q=80",
  "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=900&q=80",
  "https://images.unsplash.com/photo-1490750967868-88df5691cc44?w=900&q=80",
  "https://images.unsplash.com/photo-1462275646964-a0e3386b89fa?w=900&q=80",
  "https://images.unsplash.com/photo-1508193638397-1c4234db14d8?w=900&q=80",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900&q=80",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=900&q=80",
  "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=900&q=80",
  "https://images.unsplash.com/photo-1477414348463-c0eb7f1359b6?w=900&q=80",
  "https://images.unsplash.com/photo-1543722530-d2c3201371e7?w=900&q=80",
  "https://images.unsplash.com/photo-1477601263568-180e2c6d046e?w=900&q=80",
  "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=900&q=80",
];

const HOLIDAYS = {
  "1-1":"🎉 New Year's Day","2-14":"💝 Valentine's Day","3-17":"☘ St. Patrick's Day",
  "5-12":"💐 Mother's Day","6-15":"👔 Father's Day","7-4":"🎆 Independence Day",
  "10-31":"🎃 Halloween","11-11":"🎖 Veterans Day","11-27":"🦃 Thanksgiving",
  "12-25":"🎄 Christmas","12-31":"🥂 New Year's Eve",
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
const tsOf    = (y, m, d) => new Date(y, m, d).getTime();
const mkDay   = (y, m, d) => ({ y, m, d, ts: tsOf(y, m, d) });
const sameDay = (a, b)    => a && b && a.y===b.y && a.m===b.m && a.d===b.d;
const between = (day, a, b) => {
  if (!a || !b) return false;
  const [s, e] = a.ts <= b.ts ? [a, b] : [b, a];
  return day.ts > s.ts && day.ts < e.ts;
};
const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
const monFirstDay = (y, m) => { const d = new Date(y, m, 1).getDay(); return d === 0 ? 6 : d - 1; };

const SK = "cal_premium_v1";
const loadNotes = () => { try { return JSON.parse(localStorage.getItem(SK)) || {}; } catch { return {}; } };

// ─── Spiral Binding ────────────────────────────────────────────────────────────
function Binding() {
  return (
    <div style={{ height:20, background:"var(--tan)", display:"flex", alignItems:"center",
                  padding:"0 20px", borderBottom:"1px solid var(--border)", overflow:"hidden", gap:3 }}>
      {Array.from({ length: 30 }).map((_, i) => (
        <div key={i} style={{ width:16, height:14, borderRadius:"50%", border:"2.5px solid var(--muted)",
          background:"var(--cream)", flexShrink:0, opacity:.7, position:"relative" }} />
      ))}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function WallCalendar() {
  const today = new Date();
  const [vY, setVY]       = useState(today.getFullYear());
  const [vM, setVM]       = useState(today.getMonth());
  const [rS, setRS]       = useState(null);
  const [rE, setRE]       = useState(null);
  const [hov, setHov]     = useState(null);
  const [notes, setNotes] = useState(loadNotes);
  const [noteText, setNoteText] = useState("");
  const [imgSrc, setImgSrc]     = useState("");
  const [imgReady, setImgReady] = useState(false);
  const [flip, setFlip]         = useState(null);
  const [dark, setDark]         = useState(false);
  const [tab, setTab]           = useState("notes");
  const [holBar, setHolBar]     = useState("");

  // Note key
  const nk = useCallback(() => {
    if (rS && rE) {
      const [a, b] = rS.ts <= rE.ts ? [rS, rE] : [rE, rS];
      return `r_${a.y}_${a.m}_${a.d}__${b.y}_${b.m}_${b.d}`;
    }
    if (rS) return `d_${rS.y}_${rS.m + 1}_${rS.d}`;
    return `m_${vY}_${vM}`;
  }, [rS, rE, vY, vM]);

  useEffect(() => { try { localStorage.setItem(SK, JSON.stringify(notes)); } catch {} }, [notes]);
  useEffect(() => { setNoteText(notes[nk()] || ""); }, [nk, notes]);

  // Load hero image
  useEffect(() => {
    setImgReady(false);
    const img = new Image();
    img.src = IMGS[vM];
    img.onload = () => { setImgSrc(IMGS[vM]); setImgReady(true); };
  }, [vM]);

  // Keyboard nav
  useEffect(() => {
    const handler = (e) => { if (e.key === "ArrowLeft") navigate(-1); if (e.key === "ArrowRight") navigate(1); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  const navigate = (dir) => {
    setFlip(dir === 1 ? "next" : "prev");
    setTimeout(() => {
      setVM(m => { let nm = m + dir; if (nm > 11) { setVY(y => y+1); return 0; } if (nm < 0) { setVY(y => y-1); return 11; } return nm; });
      setRS(null); setRE(null); setFlip(null);
    }, 190);
  };

  const handleDayClick = (d) => {
    const day = mkDay(vY, vM, d);
    if (!rS || (rS && rE)) { setRS(day); setRE(null); }
    else { if (sameDay(day, rS)) setRS(null); else setRE(day); }
  };

  const saveNote = () => {
    const k = nk();
    setNotes(prev => noteText.trim() ? { ...prev, [k]: noteText } : Object.fromEntries(Object.entries(prev).filter(([key]) => key !== k)));
  };

  // Build cells
  const D   = daysInMonth(vY, vM);
  const fd  = monFirstDay(vY, vM);
  const pD  = daysInMonth(vY, vM - 1 < 0 ? 11 : vM - 1);
  const cells = [
    ...Array.from({ length: fd }, (_, i) => ({ d: pD - fd + 1 + i, ghost: true })),
    ...Array.from({ length: D }, (_, i)  => ({ d: i + 1, ghost: false })),
  ];
  const nc = cells.length % 7 === 0 ? 0 : 7 - (cells.length % 7);
  for (let i = 0; i < nc; i++) cells.push({ d: i + 1, ghost: true });

  const pE = rS && !rE && hov ? hov : rE;

  const getDayClass = (cell, colIdx) => {
    if (cell.ghost) return "ghost";
    const day = mkDay(vY, vM, cell.d);
    if (sameDay(day, rS))                              return "start";
    if (rE && sameDay(day, rE))                        return "end";
    if (!rE && hov && !sameDay(day, rS) && sameDay(day, hov)) return "pv-end";
    if (rE && between(day, rS, rE))                    return "between";
    if (!rE && hov && between(day, rS, hov))           return "pv-btw";
    if (cell.d === today.getDate() && vM === today.getMonth() && vY === today.getFullYear()) return "today";
    if (WE.includes(colIdx))                           return "we";
    return "normal";
  };

  const selLabel = () => {
    if (!rS) return null;
    if (!rE) return { range: `${MONTHS[rS.m].slice(0,3)} ${rS.d}, ${rS.y}`, days: "Select end date" };
    const [a, b] = rS.ts <= rE.ts ? [rS, rE] : [rE, rS];
    const days = Math.round((b.ts - a.ts) / 86400000) + 1;
    return { range: `${MONTHS[a.m].slice(0,3)} ${a.d} – ${MONTHS[b.m].slice(0,3)} ${b.d}`, days: `${days} day${days > 1 ? "s" : ""} selected` };
  };

  const allNotes = Object.entries(notes).filter(([, v]) => v?.trim());
  const fmtKey = (k) => {
    if (k.startsWith("m_")) { const [,y,m] = k.split("_"); return `${MONTHS[+m]} ${y}`; }
    if (k.startsWith("d_")) { const [,y,m,d] = k.split("_"); return `${MONTHS[+m-1].slice(0,3)} ${d}, ${y}`; }
    const rest = k.slice(2), [fr, to] = rest.split("__");
    const [,m1,,d1] = ["r",...fr.split("_")], [,m2,,d2] = ["r",...to.split("_")];
    return `${MONTHS[+m1].slice(0,3)} ${d1} – ${MONTHS[+m2].slice(0,3)} ${d2}`;
  };

  const sel = selLabel();
  const flipAnim = flip === "next" ? { animation:"flipN .38s ease" } : flip === "prev" ? { animation:"flipP .38s ease" } : {};

  // CSS variables for theming
  const theme = dark ? {
    "--ink":"#f0ede6","--paper":"#1c1b18","--cream":"#232219","--tan":"#2e2c26",
    "--accent":"#e8a04a","--accent2":"#c17f3b","--accent-pale":"#2a2215",
    "--muted":"#6b6860","--border":"#3a3830","--ghost":"#555",
    "--shadow":"0 2px 40px rgba(0,0,0,.5)",
  } : {
    "--ink":"#0f0e0d","--paper":"#faf8f4","--cream":"#f2efe8","--tan":"#e8e2d4",
    "--accent":"#c17f3b","--accent2":"#8b5a1e","--accent-pale":"#fdf3e7",
    "--muted":"#9a9589","--border":"#ddd8ce","--ghost":"#ccc",
    "--shadow":"0 2px 40px rgba(0,0,0,.13)",
  };

  const s = (obj) => obj; // passthrough for style objects

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
        @keyframes flipN{0%,100%{transform:perspective(1000px) rotateX(0) scale(1)}40%{transform:perspective(1000px) rotateX(-10deg) scale(.97)}}
        @keyframes flipP{0%,100%{transform:perspective(1000px) rotateX(0) scale(1)}40%{transform:perspective(1000px) rotateX(10deg) scale(.97)}}
        .wc-day:hover{background:var(--accent-pale)!important;color:var(--accent)!important;}
        .wc-day.ghost:hover{background:none!important;color:var(--ghost)!important;}
        .wc-day.start,.wc-day.end{box-shadow:0 2px 8px rgba(193,127,59,.35);}
        .nf-item:hover{border-color:var(--accent)!important;}
        @media(min-width:560px){.cal-body{grid-template-columns:1fr 200px!important;}.side-panel{border-top:none!important;border-left:1px solid var(--border)!important;}}
      `}</style>

      <div style={{ fontFamily:"'DM Sans',sans-serif", background:"var(--cream)", minHeight:"100vh",
                    padding:"16px 14px 40px", transition:"background .3s", ...theme }}>
        <div style={{ maxWidth:780, margin:"0 auto" }}>

          {/* Top bar */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:15, color:"var(--accent)", letterSpacing:.5 }}>◈ Calendrier</div>
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              {/* Year nav */}
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                {[["‹", -1],["›", 1]].map(([lbl, d]) => (
                  <button key={d} onClick={() => d === -1 ? setVY(y => y-1) : setVY(y => y+1)}
                    style={{ width:22, height:22, borderRadius:"50%", border:"1px solid var(--border)", background:"none", color:"var(--muted)", cursor:"pointer", fontSize:13, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {lbl}
                  </button>
                ))}
                <span style={{ fontSize:13, color:"var(--ink)", fontWeight:500, minWidth:36, textAlign:"center" }}>{vY}</span>
              </div>
              <button onClick={() => setDark(d => !d)}
                style={{ padding:"5px 13px", borderRadius:20, border:"1px solid var(--border)", background:"none", fontSize:11, fontFamily:"'DM Sans',sans-serif", color:"var(--muted)", cursor:"pointer", letterSpacing:.3 }}>
                {dark ? "☀ Light" : "◐ Dark"}
              </button>
            </div>
          </div>

          {/* Month strip */}
          <div style={{ display:"flex", gap:3, marginBottom:14, overflowX:"auto", scrollbarWidth:"none", paddingBottom:2 }}>
            {MONTHS.map((m, i) => (
              <button key={i} onClick={() => { setVM(i); setRS(null); setRE(null); }}
                style={{ padding:"5px 10px", borderRadius:20, border:`1px solid ${i===vM?"var(--ink)":"transparent"}`,
                         background: i===vM ? "var(--ink)" : "none", fontSize:11, fontFamily:"'DM Sans',sans-serif",
                         color: i===vM ? "var(--paper)" : "var(--muted)", cursor:"pointer", whiteSpace:"nowrap", flexShrink:0, transition:"all .15s" }}>
                {m.slice(0,3)}
              </button>
            ))}
          </div>

          {/* Card */}
          <div style={{ background:"var(--paper)", borderRadius:16, border:"1px solid var(--border)",
                        boxShadow:"var(--shadow)", overflow:"hidden", transition:"background .3s,border .3s", ...flipAnim }}>
            <Binding />

            {/* Hero */}
            <div style={{ position:"relative", paddingBottom:"42%", overflow:"hidden" }}>
              <img src={imgSrc} alt={MONTHS[vM]}
                style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover",
                         opacity: imgReady ? 1 : 0, transform: imgReady ? "scale(1)" : "scale(1.04)", transition:"opacity .6s,transform .6s" }} />
              <div style={{ position:"absolute", inset:0, background:"linear-gradient(120deg,rgba(0,0,0,.48) 0%,rgba(0,0,0,0) 60%,rgba(0,0,0,.3) 100%)" }} />
              <div style={{ position:"absolute", top:0, left:0, right:0, height:60, background:"linear-gradient(to bottom,rgba(0,0,0,.25),transparent)" }} />
              <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"18px 24px 20px", display:"flex", justifyContent:"space-between", alignItems:"flex-end" }}>
                <div style={{ fontFamily:"'Playfair Display',serif" }}>
                  <span style={{ fontSize:13, color:"rgba(255,255,255,.65)", letterSpacing:3, fontWeight:400, display:"block", marginBottom:2 }}>{vY}</span>
                  <span style={{ fontSize:"clamp(32px,7vw,52px)", color:"#fff", fontWeight:700, lineHeight:1, textShadow:"0 2px 20px rgba(0,0,0,.4)", display:"block" }}>{MONTHS[vM]}</span>
                  <span style={{ fontSize:11, color:"rgba(255,255,255,.55)", letterSpacing:2, fontFamily:"'DM Sans',sans-serif", fontWeight:400, marginTop:4, display:"block" }}>{SEASONS[vM]}</span>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:6, alignItems:"flex-end" }}>
                  <div style={{ display:"flex", gap:6 }}>
                    {[["‹",-1],["›",1]].map(([lbl,dir]) => (
                      <button key={dir} onClick={() => navigate(dir)}
                        style={{ width:34, height:34, borderRadius:"50%", border:"1.5px solid rgba(255,255,255,.5)", background:"rgba(255,255,255,.12)", color:"#fff", fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(6px)" }}>
                        {lbl}
                      </button>
                    ))}
                  </div>
                  <div style={{ padding:"4px 10px", borderRadius:12, background:"rgba(255,255,255,.15)", backdropFilter:"blur(8px)", fontSize:11, color:"rgba(255,255,255,.9)", border:"1px solid rgba(255,255,255,.2)" }}>
                    {SEASONS[vM]}
                  </div>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="cal-body" style={{ display:"grid", gridTemplateColumns:"1fr" }}>
              {/* Grid */}
              <div style={{ padding:"20px 18px 16px" }}>
                {/* Week labels */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", marginBottom:6 }}>
                  {WDAYS.map((d, i) => (
                    <div key={d} style={{ textAlign:"center", fontSize:9, fontWeight:600, letterSpacing:1.2, textTransform:"uppercase", color: WE.includes(i) ? "var(--accent)" : "var(--muted)", padding:"2px 0" }}>{d}</div>
                  ))}
                </div>
                {/* Days */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2 }}>
                  {cells.map((cell, idx) => {
                    const col = idx % 7;
                    const cls = getDayClass(cell, col);
                    const hk  = `${vM+1}-${cell.d}`;
                    const dnk = `d_${vY}_${vM+1}_${cell.d}`;
                    const hasNote = !cell.ghost && notes[dnk]?.trim();
                    const base = { width:"100%", aspectRatio:"1", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", borderRadius:"50%", cursor:cell.ghost?"default":"pointer", fontSize:"clamp(11px,2vw,13px)", fontFamily:"'DM Sans',sans-serif", border:"none", background:"none", transition:"background .12s,color .12s,transform .08s", position:"relative", maxWidth:44, margin:"auto" };
                    const variants = {
                      ghost:   { ...base, color:"var(--ghost)", fontWeight:300 },
                      start:   { ...base, background:"var(--accent)", color:"#fff", fontWeight:600 },
                      end:     { ...base, background:"var(--accent2)", color:"#fff", fontWeight:600 },
                      "pv-end":   { ...base, background:"rgba(193,127,59,.45)", color:"#fff" },
                      between:    { ...base, background:"var(--accent-pale)", borderRadius:0 },
                      "pv-btw":   { ...base, background:"rgba(193,127,59,.09)", borderRadius:0 },
                      today:   { ...base, border:"2px solid var(--accent)", color:"var(--accent)", fontWeight:600 },
                      we:      { ...base, color:"var(--accent)", fontWeight:500 },
                      normal:  { ...base, color:"var(--ink)" },
                    };
                    return (
                      <div key={idx} style={{ display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <button className={`wc-day ${cls}`} style={variants[cls] || variants.normal}
                          onClick={() => !cell.ghost && handleDayClick(cell.d)}
                          onMouseEnter={() => { if (!cell.ghost) { setHov(mkDay(vY,vM,cell.d)); setHolBar(HOLIDAYS[hk]||""); }}}
                          onMouseLeave={() => { setHov(null); setHolBar(""); }}>
                          {cell.d}
                          {!cell.ghost && HOLIDAYS[hk] && <span style={{ position:"absolute", bottom:3, width:3, height:3, borderRadius:"50%", background:"var(--accent)" }} />}
                          {hasNote && <span style={{ position:"absolute", top:3, right:3, width:4, height:4, borderRadius:"50%", background:"#2563eb" }} />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Side panel */}
              <div className="side-panel" style={{ borderTop:"1px solid var(--border)", padding:"18px 16px" }}>
                {/* Tabs */}
                <div style={{ display:"flex", borderBottom:"1px solid var(--border)", marginBottom:14 }}>
                  {["notes","saved"].map(t => (
                    <button key={t} onClick={() => setTab(t)}
                      style={{ padding:"7px 14px", fontSize:10, letterSpacing:1.2, textTransform:"uppercase", fontFamily:"'DM Sans',sans-serif", fontWeight:600, cursor:"pointer", background:"none", border:"none", borderBottom: tab===t ? "2px solid var(--accent)" : "2px solid transparent", color: tab===t ? "var(--ink)" : "var(--muted)", marginBottom:-1, transition:"all .15s" }}>
                      {t}
                    </button>
                  ))}
                </div>

                {tab === "notes" && (
                  <>
                    <div style={{ marginBottom:12 }}>
                      <div style={{ fontSize:10, fontWeight:600, letterSpacing:1.5, textTransform:"uppercase", color:"var(--muted)", marginBottom:4 }}>Selected period</div>
                      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:16, color:"var(--ink)", fontStyle:"italic", minHeight:22, lineHeight:1.2 }}>{sel ? sel.range : "–"}</div>
                      <div style={{ fontSize:11, color:"var(--accent)", fontWeight:500, marginTop:2, minHeight:14 }}>{sel?.days}</div>
                    </div>
                    <textarea value={noteText} onChange={e => { setNoteText(e.target.value); const k=nk(); const v=e.target.value; setNotes(prev => v.trim() ? {...prev,[k]:v} : Object.fromEntries(Object.entries(prev).filter(([key])=>key!==k))); }}
                      style={{ width:"100%", border:"1px solid var(--border)", borderRadius:10, padding:"10px 11px", fontSize:12, fontFamily:"'DM Sans',sans-serif", color:"var(--ink)", background:"var(--cream)", resize:"none", outline:"none", minHeight:90, lineHeight:1.65 }}
                      placeholder={rS ? (rE ? "Notes for selected range…" : `Notes for ${MONTHS[rS.m].slice(0,3)} ${rS.d}…`) : `Notes for ${MONTHS[vM]} ${vY}…`} />
                    <div style={{ display:"flex", gap:7, marginTop:9, flexWrap:"wrap" }}>
                      <button onClick={saveNote}
                        style={{ padding:"6px 16px", background:"var(--accent)", border:"none", borderRadius:20, fontSize:10, letterSpacing:1, textTransform:"uppercase", fontFamily:"'DM Sans',sans-serif", fontWeight:600, color:"#fff", cursor:"pointer" }}>
                        Save
                      </button>
                      {(rS || rE) && (
                        <button onClick={() => { setRS(null); setRE(null); }}
                          style={{ padding:"6px 12px", background:"none", border:"1px solid var(--border)", borderRadius:20, fontSize:10, letterSpacing:1, textTransform:"uppercase", fontFamily:"'DM Sans',sans-serif", color:"var(--muted)", cursor:"pointer" }}>
                          Clear
                        </button>
                      )}
                    </div>
                  </>
                )}

                {tab === "saved" && (
                  <div style={{ display:"flex", flexDirection:"column", gap:8, maxHeight:240, overflowY:"auto", scrollbarWidth:"thin" }}>
                    {allNotes.length === 0
                      ? <div style={{ fontSize:12, color:"var(--muted)", fontStyle:"italic", fontFamily:"'Playfair Display',serif" }}>No notes saved yet.<br/>Select a date and write something.</div>
                      : allNotes.map(([k, v]) => (
                          <div key={k} className="nf-item" style={{ padding:"9px 11px", background:"var(--cream)", border:"1px solid var(--border)", borderRadius:10, cursor:"pointer", transition:"border .15s" }}>
                            <div style={{ fontSize:9, letterSpacing:1, textTransform:"uppercase", color:"var(--accent)", marginBottom:3, fontWeight:600 }}>{fmtKey(k)}</div>
                            <div style={{ fontSize:11, color:"var(--muted)", lineHeight:1.5, whiteSpace:"pre-wrap", overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>{v}</div>
                          </div>
                        ))
                    }
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 18px 12px", borderTop:"1px solid var(--border)" }}>
              <div style={{ fontSize:11, color:"var(--accent)", fontStyle:"italic", minHeight:16 }}>{holBar}</div>
              <div style={{ display:"flex", gap:10 }}>
                {[["var(--accent)","Start"],["var(--accent2)","End"],["rgba(193,127,59,.35)","Range"],["transparent","Today",true]].map(([c,l,b])=>(
                  <div key={l} style={{ display:"flex", alignItems:"center", gap:4 }}>
                    <div style={{ width:8, height:8, borderRadius:"50%", background:c, border:b?"1.5px solid var(--accent)":"none" }}/>
                    <span style={{ fontSize:9, color:"var(--muted)", letterSpacing:.5, textTransform:"uppercase" }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
