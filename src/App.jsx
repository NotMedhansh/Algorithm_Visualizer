import { useState, useEffect, useRef, useCallback } from "react";

// ─── THEME ────────────────────────────────────────────────────────────────────
const COLORS = {
  default:   "#1e3a5f",
  comparing: "#f59e0b",
  swapping:  "#ef4444",
  sorted:    "#10b981",
  pivot:     "#a855f7",
  visited:   "#6366f1",
  queued:    "#3b82f6",
  path:      "#10b981",
  wall:      "#1e293b",
  start:     "#22c55e",
  end:       "#ef4444",
  prime:     "#10b981",
  composite: "#ef4444",
  unknown:   "#1e3a5f",
  current:   "#f59e0b",
  hull:      "#10b981",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── AI API HELPER ────────────────────────────────────────────────────────────
const callAI = async (prompt, systemPrompt = "") => {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost:5173", // optional but recommended
      "X-Title": "Algo Visualizer", // optional
    },
    body: JSON.stringify({
      model: "deepseek/deepseek-chat",
      messages: [
        {
          role: "system",
          content: systemPrompt || "You are a helpful assistant.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  const data = await response.json();

  if (!data.choices) {
    throw new Error(JSON.stringify(data));
  }

  return data.choices[0].message.content;
};
// ═══════════════════════════════════════════════════════════════════════════════
// FEATURE 1 — AI EXPLAINER PANEL
// Sits below the canvas in any visualizer. Call triggerExplain(context) to fire.
// ═══════════════════════════════════════════════════════════════════════════════
function AIExplainerPanel({ algoName, algoContext }) {
  const [explanation, setExplanation] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const explain = async () => {
    setOpen(true);
    setLoading(true);
    setExplanation("");
    try {
      const system = `You are an algorithm tutor. Respond in exactly 2-3 plain sentences. No markdown. No bullet points. No bold or italic symbols. No headers. No lists. Just plain conversational sentences. Example of correct output: "Bubble Sort is comparing index 3 and index 4. Since 47 is greater than 12, it will swap them. This pushes larger values toward the end of the array."`;
      const prompt = `Algorithm: ${algoName}\nCurrent state: ${algoContext}\nExplain what is happening right now and why. Remember: 2-3 plain sentences only, no markdown.`;
      const result = await callAI(prompt, system);
      setExplanation(result);
    } catch (e) {
      setExplanation("Could not load explanation. Check your API key in the .env file.");
    }
    setLoading(false);
  };

  return (
    <div style={{ borderTop: "1px solid #1e293b", background: "#080e1a" }}>
      {/* Toggle bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, color: "#10b981" }}>✦</span>
          <span style={{ fontSize: 12, color: "#64748b", fontFamily: "'IBM Plex Mono', monospace" }}>AI Explainer</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={explain}
            style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", padding: "5px 14px", background: "#064e3b", border: "1px solid #10b981", color: "#10b981", borderRadius: 6, cursor: "pointer", transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "#10b981"; e.currentTarget.style.color = "#0f172a"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#064e3b"; e.currentTarget.style.color = "#10b981"; }}
          >
            ✦ Explain This
          </button>
          {open && (
            <button
              onClick={() => setOpen(false)}
              style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, padding: "5px 10px", background: "transparent", border: "1px solid #1e293b", color: "#64748b", borderRadius: 6, cursor: "pointer" }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Explanation box */}
      {open && (
        <div style={{ padding: "0 20px 14px" }}>
          <div style={{ background: "#0d1829", border: "1px solid #1e3a5f", borderLeft: "3px solid #10b981", borderRadius: 6, padding: "12px 16px", minHeight: 60, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, lineHeight: 1.8, color: loading ? "#64748b" : "#cbd5e1" }}>
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ animation: "pulse 1s infinite" }}>✦</span> Analyzing algorithm state...
              </span>
            ) : explanation}
          </div>
        </div>
      )}
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FEATURE 2 — AI ALGORITHM RECOMMENDER
// Sits on the home page below the module cards
// ═══════════════════════════════════════════════════════════════════════════════
function AIRecommender({ onNavigate }) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const VALID_IDS = ["sorting", "pathfinding", "bsearch", "nqueen", "convexhull", "primes", "recursion"];

  const ask = async () => {
    if (!query.trim() || loading) return;
    setLoading(true);
    setResult(null);
    try {
      const system = `
You are an algorithm recommendation engine.

Return ONLY valid JSON. Do NOT include any explanation, text, or markdown.

Format:
{"id":"module_id","name":"Module Name","reason":"Short explanation"}

Valid ids:
sorting, pathfinding, bsearch, nqueen, convexhull, primes, recursion
`;
      const prompt = `User's problem: ${query}`;
      const raw = await callAI(prompt, system);
      let parsed;

try {
  const match = raw.match(/\{[\s\S]*\}/); // extract JSON
  if (!match) throw new Error("No JSON found");

  parsed = JSON.parse(match[0]);
} catch (err) {
  console.error("RAW AI RESPONSE:", raw);
  throw new Error("Invalid JSON");
}
      if (VALID_IDS.includes(parsed.id)) setResult(parsed);
      else setResult({ id: null, name: "Unsure", reason: raw });
    } catch (e) {
      setResult({ id: null, name: "Error", reason: "Could not get a recommendation. Please check your API key." });
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 40px" }}>
      {/* Section header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <span style={{ fontSize: 16, color: "#10b981" }}>✦</span>
          <span style={{ fontFamily: "'Exo 2', sans-serif", fontWeight: 700, fontSize: 20, color: "#f1f5f9" }}>AI Algorithm Recommender</span>
        </div>
        <p style={{ fontSize: 13, color: "#64748b", fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.7 }}>
          Describe your problem in plain English and the AI will recommend the right algorithm and visualizer for you.
        </p>
      </div>

      {/* Input row */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && ask()}
          placeholder='e.g. "Find the shortest path between two cities" or "Sort a list of student grades"'
          style={{ flex: 1, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, background: "#1e293b", border: "1px solid #334155", color: "#e2e8f0", padding: "10px 16px", borderRadius: 8, outline: "none", transition: "border 0.15s" }}
          onFocus={e => e.target.style.borderColor = "#10b981"}
          onBlur={e => e.target.style.borderColor = "#334155"}
        />
        <button
          onClick={() => {
            if (!loading) ask();
}}
          disabled={loading || !query.trim()}
          style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", padding: "10px 22px", background: loading ? "#064e3b" : "#064e3b", border: "1px solid #10b981", color: "#10b981", borderRadius: 8, cursor: loading ? "default" : "pointer", opacity: !query.trim() ? 0.5 : 1, whiteSpace: "nowrap", transition: "all 0.15s" }}
          onMouseEnter={e => { if (!loading && query.trim()) { e.currentTarget.style.background = "#10b981"; e.currentTarget.style.color = "#0f172a"; } }}
          onMouseLeave={e => { e.currentTarget.style.background = "#064e3b"; e.currentTarget.style.color = "#10b981"; }}
        >
          {loading ? "✦ Thinking..." : "✦ Recommend"}
        </button>
      </div>

      {/* Result card */}
      {result && (
        <div style={{ background: "#1e293b", border: "1px solid #334155", borderLeft: "3px solid #10b981", borderRadius: 10, padding: "20px 24px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: "#10b981", fontFamily: "'IBM Plex Mono', monospace", textTransform: "uppercase", letterSpacing: 1 }}>Recommended</span>
              <span style={{ fontFamily: "'Exo 2', sans-serif", fontWeight: 700, fontSize: 17, color: "#f1f5f9" }}>{result.name}</span>
            </div>
            <p style={{ fontSize: 13, color: "#94a3b8", fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.8, margin: 0 }}>{result.reason}</p>
          </div>
          {result.id && (
            <button
              onClick={() => onNavigate(result.id)}
              style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", padding: "10px 20px", background: "#10b981", border: "none", color: "#0f172a", borderRadius: 8, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}
            >
              Open Visualizer →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── HOME PAGE ────────────────────────────────────────────────────────────────
const MODULES = [
  { id: "sorting",     label: "Sorting Algorithms",  desc: "Visualize Bubble, Merge, Quick, Heap, and more",                  icon: "⬆" },
  { id: "pathfinding", label: "Pathfinder",           desc: "BFS, DFS, Dijkstra, A* on an interactive grid",                  icon: "🗺" },
  { id: "bsearch",     label: "Binary Search",        desc: "Step-by-step binary search on a sorted array",                   icon: "🔍" },
  { id: "nqueen",      label: "N-Queens",             desc: "Backtracking solution to the N-Queens puzzle",                   icon: "♛" },
  { id: "convexhull",  label: "Convex Hull",          desc: "Graham Scan & Jarvis March on random point sets",                icon: "📐" },
  { id: "primes",      label: "Prime Numbers",        desc: "Sieve of Eratosthenes vs Brute Force comparison",                icon: "🔢" },
  { id: "recursion",   label: "Recursion Tree",       desc: "Visualize Fibonacci, Factorial and recursive call trees",        icon: "🌲" },
];

function HomePage({ onNavigate }) {
  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", color: "#e2e8f0", fontFamily: "'IBM Plex Mono', monospace" }}>
      {/* Hero */}
      <div style={{ textAlign: "center", padding: "80px 24px 48px" }}>
        <div style={{ fontSize: 13, letterSpacing: 4, color: "#64748b", textTransform: "uppercase", marginBottom: 16 }}>
          Interactive Learning Tool
        </div>
        <h1 style={{ fontSize: "clamp(2rem,5vw,3.5rem)", fontFamily: "'Exo 2', sans-serif", fontWeight: 800, margin: 0, lineHeight: 1.1 }}>
          Algorithm{" "}
          <span style={{ color: "#10b981" }}>Visualizer</span>
        </h1>
        <p style={{ marginTop: 20, color: "#94a3b8", fontSize: 16, maxWidth: 560, marginLeft: "auto", marginRight: "auto", lineHeight: 1.7 }}>
          Explore algorithms with step-by-step animations. Understand sorting,
          pathfinding, backtracking and more through interactive visualization.
        </p>
      </div>

      {/* ── FEATURE 2: AI Recommender sits between hero and cards ── */}
      <AIRecommender onNavigate={onNavigate} />

      {/* Cards */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 80px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
        {MODULES.map((m) => (
          <button
            key={m.id}
            onClick={() => onNavigate(m.id)}
            style={{
              background: "#1e293b", border: "1px solid #334155", borderRadius: 12,
              padding: "28px 24px", textAlign: "left", cursor: "pointer", color: "inherit",
              transition: "all 0.2s", fontFamily: "inherit",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#10b981"; e.currentTarget.style.background = "#1a2e26"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#334155"; e.currentTarget.style.background = "#1e293b"; }}
          >
            <div style={{ fontSize: 32, marginBottom: 14 }}>{m.icon}</div>
            <div style={{ fontSize: 17, fontWeight: 700, fontFamily: "'Exo 2', sans-serif", marginBottom: 8, color: "#f1f5f9" }}>{m.label}</div>
            <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>{m.desc}</div>
            <div style={{ marginTop: 18, fontSize: 12, color: "#10b981", letterSpacing: 1, textTransform: "uppercase" }}>Explore →</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── SHARED LAYOUT ────────────────────────────────────────────────────────────
function VisualizerLayout({ title, onBack, controls, legend, children, aiPanel }) {
  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", color: "#e2e8f0", fontFamily: "'IBM Plex Mono', monospace", display: "flex", flexDirection: "column" }}>
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", borderBottom: "1px solid #1e293b", background: "#0a0f1a", position: "sticky", top: 0, zIndex: 50 }}>
        <button onClick={onBack} style={{ background: "transparent", border: "1px solid #334155", color: "#94a3b8", padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontFamily: "inherit", fontSize: 12, transition: "all 0.15s" }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#10b981"; e.currentTarget.style.color = "#10b981"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#334155"; e.currentTarget.style.color = "#94a3b8"; }}>
          ← Home
        </button>
        <span style={{ fontFamily: "'Exo 2', sans-serif", fontWeight: 700, fontSize: 18, color: "#10b981" }}>{title}</span>
      </div>
      {/* Body */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        {/* Controls bar */}
        <div style={{ background: "#0d1829", borderBottom: "1px solid #1e293b", padding: "10px 20px", display: "flex", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          {controls}
        </div>
        {/* Canvas area */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          {children}
        </div>
        {/* Legend */}
        {legend && (
          <div style={{ background: "#0a0f1a", borderTop: "1px solid #1e293b", padding: "8px 20px", display: "flex", gap: 20, flexWrap: "wrap" }}>
            {legend.map((l) => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#94a3b8" }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: l.color, flexShrink: 0 }} />
                {l.label}
              </div>
            ))}
          </div>
        )}
        {/* ── FEATURE 1: AI Explainer panel slot ── */}
        {aiPanel}
      </div>
    </div>
  );
}

// ─── CONTROL COMPONENTS ───────────────────────────────────────────────────────
function Btn({ label, variant = "default", onClick, disabled }) {
  const styles = {
    default: { bg: "#1e293b", border: "#334155", color: "#94a3b8", hoverBg: "#334155", hoverColor: "#e2e8f0" },
    primary: { bg: "#064e3b", border: "#10b981", color: "#10b981", hoverBg: "#10b981", hoverColor: "#0f172a" },
    danger:  { bg: "#450a0a", border: "#ef4444", color: "#ef4444", hoverBg: "#ef4444", hoverColor: "#fff" },
  };
  const s = styles[variant];
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", padding: "7px 16px", background: s.bg, border: `1px solid ${s.border}`, color: s.color, borderRadius: 6, cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.5 : 1, transition: "all 0.15s" }}
      onMouseEnter={(e) => { if (!disabled) { e.currentTarget.style.background = s.hoverBg; e.currentTarget.style.color = s.hoverColor; } }}
      onMouseLeave={(e) => { e.currentTarget.style.background = s.bg; e.currentTarget.style.color = s.color; }}
    >{label}</button>
  );
}

function Slider({ label, min, max, step = 1, value, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: 11, color: "#64748b", whiteSpace: "nowrap" }}>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)}
        style={{ width: 90, accentColor: "#10b981", cursor: "pointer" }} />
      <span style={{ fontSize: 11, color: "#10b981", minWidth: 30, textAlign: "right" }}>{value}</span>
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 11, color: "#64748b" }}>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, background: "#1e293b", border: "1px solid #334155", color: "#e2e8f0", padding: "5px 10px", borderRadius: 6, cursor: "pointer", outline: "none" }}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function StatBadge({ label, value }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#1e293b", border: "1px solid #334155", borderRadius: 6, padding: "4px 12px" }}>
      <span style={{ fontSize: 11, color: "#64748b" }}>{label}:</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: "#10b981" }}>{value}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SORTING VISUALIZER
// ═══════════════════════════════════════════════════════════════════════════════
function SortingVisualizer({ onBack }) {
  const canvasRef = useRef(null);
  const stateRef = useRef({ arr: [], colors: {}, running: false, cancel: false });
  const [algo, setAlgo] = useState("bubble");
  const [size, setSize] = useState(60);
  const [speed, setSpeed] = useState(50);
  const [running, setRunning] = useState(false);
  const [stats, setStats] = useState({ comparisons: 0, swaps: 0 });

  const ALGO_LABELS = { bubble: "Bubble Sort", selection: "Selection Sort", insertion: "Insertion Sort", quick: "Quick Sort", merge: "Merge Sort", heap: "Heap Sort" };

  const getDelay = () => Math.max(1, 101 - speed);

  const generateArr = useCallback((n = size) => {
    stateRef.current.cancel = true;
    stateRef.current.running = false;
    setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const h = canvas.height;
      stateRef.current.arr = Array.from({ length: n }, () => Math.floor(Math.random() * (h - 40)) + 20);
      stateRef.current.colors = {};
      stateRef.current.cancel = false;
      setStats({ comparisons: 0, swaps: 0 });
      setRunning(false);
      drawBars(stateRef.current.arr, {});
    }, 50);
  }, [size]);

  const drawBars = (arr, colors) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, W, H);
    const bw = (W - 10) / arr.length;
    arr.forEach((v, i) => {
      const x = 5 + i * bw;
      ctx.fillStyle = colors[i] || COLORS.default;
      ctx.fillRect(x + 0.5, H - v - 5, bw - 1, v);
    });
  };

  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
      generateArr();
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => { if (!running) generateArr(size); }, [size]);

  const stop = () => { stateRef.current.cancel = true; stateRef.current.running = false; setRunning(false); };

  const runSort = async () => {
    if (stateRef.current.running) return;
    stateRef.current.cancel = false;
    stateRef.current.running = true;
    setRunning(true);
    const s = stateRef.current;
    s.colors = {};
    let comparisons = 0, swaps = 0;

    const delay = () => sleep(getDelay());
    const set = (i, c) => { s.colors[i] = c; };
    const clr = (...idx) => idx.forEach((i) => delete s.colors[i]);
    const redraw = () => drawBars(s.arr, s.colors);
    const swap = async (i, j) => {
      set(i, COLORS.swapping); set(j, COLORS.swapping); redraw(); await delay();
      [s.arr[i], s.arr[j]] = [s.arr[j], s.arr[i]]; swaps++;
      clr(i, j); setStats((p) => ({ ...p, swaps }));
    };
    const compare = async (i, j) => {
      set(i, COLORS.comparing); set(j, COLORS.comparing); redraw(); comparisons++;
      setStats((p) => ({ ...p, comparisons })); await delay();
      clr(i, j);
      return s.arr[i] > s.arr[j];
    };
    const chk = () => s.cancel;

    const algorithms = {
      bubble: async () => {
        for (let i = 0; i < s.arr.length - 1 && !chk(); i++) {
          for (let j = 0; j < s.arr.length - i - 1 && !chk(); j++) {
            if (await compare(j, j + 1)) await swap(j, j + 1);
          }
          set(s.arr.length - 1 - i, COLORS.sorted);
        }
        set(0, COLORS.sorted);
      },
      selection: async () => {
        for (let i = 0; i < s.arr.length - 1 && !chk(); i++) {
          let mi = i; set(mi, COLORS.pivot);
          for (let j = i + 1; j < s.arr.length && !chk(); j++) {
            set(j, COLORS.comparing); comparisons++; setStats((p) => ({ ...p, comparisons })); redraw(); await delay(); clr(j);
            if (s.arr[j] < s.arr[mi]) { clr(mi); mi = j; set(mi, COLORS.pivot); }
          }
          if (mi !== i) await swap(i, mi);
          set(i, COLORS.sorted);
        }
        set(s.arr.length - 1, COLORS.sorted);
      },
      insertion: async () => {
        set(0, COLORS.sorted);
        for (let i = 1; i < s.arr.length && !chk(); i++) {
          const key = s.arr[i]; let j = i - 1;
          while (j >= 0 && s.arr[j] > key && !chk()) {
            comparisons++; s.arr[j + 1] = s.arr[j]; swaps++;
            set(j + 1, COLORS.swapping); redraw(); await delay(); clr(j + 1); set(j + 1, COLORS.sorted); j--;
          }
          s.arr[j + 1] = key; set(j + 1, COLORS.sorted); setStats({ comparisons, swaps });
        }
        redraw();
      },
      quick: async () => {
        const part = async (lo, hi) => {
          const piv = s.arr[hi]; set(hi, COLORS.pivot); let i = lo - 1;
          for (let j = lo; j < hi && !chk(); j++) {
            comparisons++; set(j, COLORS.comparing); redraw(); await delay(); clr(j);
            if (s.arr[j] <= piv) { i++; await swap(i, j); }
          }
          await swap(i + 1, hi); set(i + 1, COLORS.sorted); return i + 1;
        };
        const qs = async (lo, hi) => {
          if (lo >= hi || chk()) return;
          const pi = await part(lo, hi);
          await qs(lo, pi - 1); await qs(pi + 1, hi);
        };
        await qs(0, s.arr.length - 1); redraw();
      },
      merge: async () => {
        const merge = async (lo, mid, hi) => {
          const L = s.arr.slice(lo, mid + 1), R = s.arr.slice(mid + 1, hi + 1);
          let i = 0, j = 0, k = lo;
          while (i < L.length && j < R.length && !chk()) {
            comparisons++;
            set(k, COLORS.comparing); redraw(); await delay();
            if (L[i] <= R[j]) s.arr[k++] = L[i++];
            else s.arr[k++] = R[j++];
            swaps++; set(k - 1, COLORS.sorted); setStats({ comparisons, swaps });
          }
          while (i < L.length) { s.arr[k++] = L[i++]; swaps++; }
          while (j < R.length) { s.arr[k++] = R[j++]; swaps++; }
          for (let x = lo; x <= hi; x++) set(x, COLORS.sorted);
          redraw(); await delay();
        };
        const ms = async (lo, hi) => {
          if (lo >= hi || chk()) return;
          const mid = Math.floor((lo + hi) / 2);
          await ms(lo, mid); await ms(mid + 1, hi); await merge(lo, mid, hi);
        };
        await ms(0, s.arr.length - 1); redraw();
      },
      heap: async () => {
        const heapify = async (n, i) => {
          let lg = i, l = 2 * i + 1, r = 2 * i + 2;
          comparisons += 2;
          if (l < n && s.arr[l] > s.arr[lg]) lg = l;
          if (r < n && s.arr[r] > s.arr[lg]) lg = r;
          if (lg !== i) { set(i, COLORS.comparing); set(lg, COLORS.swapping); redraw(); await delay(); await swap(i, lg); await heapify(n, lg); }
        };
        for (let i = Math.floor(s.arr.length / 2) - 1; i >= 0 && !chk(); i--) await heapify(s.arr.length, i);
        for (let i = s.arr.length - 1; i > 0 && !chk(); i--) { await swap(0, i); set(i, COLORS.sorted); await heapify(i, 0); }
        set(0, COLORS.sorted); redraw();
      },
    };

    await (algorithms[algo] || algorithms.bubble)();
    if (!chk()) { for (let i = 0; i < s.arr.length; i++) set(i, COLORS.sorted); redraw(); }
    stateRef.current.running = false;
    setRunning(false);
  };

  return (
    <VisualizerLayout
      title="Sorting Algorithms" onBack={onBack}
      controls={
        <>
          <Select label="Algorithm" value={algo} onChange={setAlgo} options={[
            { value: "bubble",    label: "Bubble Sort"    },
            { value: "selection", label: "Selection Sort" },
            { value: "insertion", label: "Insertion Sort" },
            { value: "quick",     label: "Quick Sort"     },
            { value: "merge",     label: "Merge Sort"     },
            { value: "heap",      label: "Heap Sort"      },
          ]} />
          <Slider label="Size" min={10} max={200} value={size} onChange={setSize} />
          <Slider label="Speed" min={1} max={100} value={speed} onChange={setSpeed} />
          <Btn label="Generate" onClick={() => generateArr(size)} disabled={running} />
          <Btn label="▶ Run" variant="primary" onClick={runSort} disabled={running} />
          <Btn label="■ Stop" variant="danger" onClick={stop} disabled={!running} />
          <StatBadge label="Comparisons" value={stats.comparisons} />
          <StatBadge label="Swaps" value={stats.swaps} />
        </>
      }
      legend={[
        { color: COLORS.default,   label: "Unsorted"   },
        { color: COLORS.comparing, label: "Comparing"  },
        { color: COLORS.swapping,  label: "Swapping"   },
        { color: COLORS.pivot,     label: "Pivot"      },
        { color: COLORS.sorted,    label: "Sorted"     },
      ]}
      aiPanel={<AIExplainerPanel algoName={ALGO_LABELS[algo]} algoContext={`Sorting ${size} elements using ${ALGO_LABELS[algo]}. Comparisons so far: ${stats.comparisons}, Swaps: ${stats.swaps}.`} />}
    >
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
    </VisualizerLayout>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PATHFINDING VISUALIZER
// ═══════════════════════════════════════════════════════════════════════════════
const ROWS = 20, COLS = 45;

function PathfindingVisualizer({ onBack }) {
  const makeGrid = () =>
    Array.from({ length: ROWS }, (_, r) =>
      Array.from({ length: COLS }, (_, c) => ({ r, c, type: "empty", dist: Infinity, parent: null, g: 0, f: 0 }))
    );

  const gridRef = useRef(makeGrid());
  const [, forceRender] = useState(0);
  const [algo, setAlgo] = useState("bfs");
  const [drawMode, setDrawMode] = useState("wall");
  const [speed, setSpeed] = useState(20);
  const [running, setRunning] = useState(false);
  const [stats, setStats] = useState({ steps: 0, pathLen: 0 });
  const runRef = useRef({ cancel: false });
  const mouseDown = useRef(false);
  const startCell = useRef({ r: 10, c: 5 });
  const endCell = useRef({ r: 10, c: 39 });

  const ALGO_LABELS = { bfs: "Breadth-First Search", dfs: "Depth-First Search", dijkstra: "Dijkstra's Algorithm", astar: "A* Search" };

  useEffect(() => {
    gridRef.current[10][5].type = "start";
    gridRef.current[10][39].type = "end";
    forceRender((n) => n + 1);
  }, []);

  const CELL_SIZE = Math.min(26, Math.floor((window.innerWidth - 300) / COLS));

  const getColor = (type) => ({
    empty: "#0d1829", wall: "#1e293b", start: "#22c55e", end: "#ef4444",
    visited: "#312e81", queued: "#1e3a8a", path: "#10b981",
  }[type] || "#0d1829");

  const handleCellInteract = (r, c) => {
    if (running) return;
    const g = gridRef.current;
    const cell = g[r][c];
    if (drawMode === "wall" && cell.type !== "start" && cell.type !== "end") {
      cell.type = cell.type === "wall" ? "empty" : "wall";
    } else if (drawMode === "start" && cell.type !== "end") {
      g[startCell.current.r][startCell.current.c].type = "empty";
      cell.type = "start"; startCell.current = { r, c };
    } else if (drawMode === "end" && cell.type !== "start") {
      g[endCell.current.r][endCell.current.c].type = "empty";
      cell.type = "end"; endCell.current = { r, c };
    } else if (drawMode === "erase" && cell.type !== "start" && cell.type !== "end") {
      cell.type = "empty";
    }
    forceRender((n) => n + 1);
  };

  const reset = () => {
    runRef.current.cancel = true;
    setTimeout(() => {
      const g = makeGrid();
      g[startCell.current.r][startCell.current.c].type = "start";
      g[endCell.current.r][endCell.current.c].type = "end";
      gridRef.current = g;
      setStats({ steps: 0, pathLen: 0 }); setRunning(false);
      forceRender((n) => n + 1);
    }, 60);
  };

  const generateMaze = () => {
    reset();
    setTimeout(() => {
      const g = gridRef.current;
      for (let r = 0; r < ROWS; r++)
        for (let c = 0; c < COLS; c++)
          if (g[r][c].type === "empty" && Math.random() < 0.28)
            g[r][c].type = "wall";
      forceRender((n) => n + 1);
    }, 80);
  };

  const neighbors = (g, cell) =>
    [[0,1],[1,0],[0,-1],[-1,0]]
      .map(([dr,dc]) => { const nr=cell.r+dr, nc=cell.c+dc; return (nr>=0&&nr<ROWS&&nc>=0&&nc<COLS)?g[nr][nc]:null; })
      .filter(Boolean);

  const runPathfinding = async () => {
    if (running) return;
    const g = gridRef.current;
    for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) {
      const cell = g[r][c];
      if (cell.type==="visited"||cell.type==="queued"||cell.type==="path") cell.type="empty";
      cell.dist=Infinity; cell.parent=null; cell.g=0; cell.f=0;
    }
    g[startCell.current.r][startCell.current.c].type="start";
    g[endCell.current.r][endCell.current.c].type="end";
    runRef.current.cancel = false; setRunning(true);
    let steps=0, found=false;
    const start = g[startCell.current.r][startCell.current.c];
    const end = g[endCell.current.r][endCell.current.c];
    const delay = () => sleep(Math.max(1, 51-speed));

    if (algo==="bfs") {
      const q=[start]; start.dist=0;
      while (q.length&&!runRef.current.cancel) {
        const cur=q.shift();
        if (cur.type!=="start"&&cur.type!=="end") cur.type="visited";
        steps++; setStats({steps, pathLen:0}); forceRender(n=>n+1); await delay();
        if (cur===end){found=true;break;}
        for (const nb of neighbors(g,cur)) {
          if (nb.type==="wall") continue;
          if (nb.dist>cur.dist+1){nb.dist=cur.dist+1;nb.parent=cur;if(nb.type!=="end")nb.type="queued";q.push(nb);}
        }
      }
    } else if (algo==="dfs") {
      const stack=[start]; const vis=new Set();
      while (stack.length&&!runRef.current.cancel) {
        const cur=stack.pop(); if(vis.has(cur))continue; vis.add(cur);
        if (cur.type!=="start"&&cur.type!=="end") cur.type="visited";
        steps++; setStats({steps,pathLen:0}); forceRender(n=>n+1); await delay();
        if (cur===end){found=true;break;}
        for (const nb of neighbors(g,cur)) {
          if (nb.type==="wall"||vis.has(nb))continue;
          nb.parent=cur; if(nb.type!=="end")nb.type="queued"; stack.push(nb);
        }
      }
    } else if (algo==="dijkstra"||algo==="astar") {
      const h = algo==="astar"
        ? (c) => Math.abs(c.r-end.r)+Math.abs(c.c-end.c)
        : () => 0;
      const open=[start]; start.g=0; start.f=h(start);
      const closed=new Set();
      while (open.length&&!runRef.current.cancel) {
        open.sort((a,b)=>a.f-b.f);
        const cur=open.shift(); if(closed.has(cur))continue; closed.add(cur);
        if (cur.type!=="start"&&cur.type!=="end") cur.type="visited";
        steps++; setStats({steps,pathLen:0}); forceRender(n=>n+1); await delay();
        if (cur===end){found=true;break;}
        for (const nb of neighbors(g,cur)) {
          if (nb.type==="wall"||closed.has(nb))continue;
          const tg=cur.g+1;
          if (tg<nb.g||nb.g===0){nb.parent=cur;nb.g=tg;nb.f=tg+h(nb);if(nb.type!=="end")nb.type="queued";open.push(nb);}
        }
      }
    }

    if (found&&!runRef.current.cancel) {
      let cur=end; let pl=0;
      while (cur&&cur!==start){if(cur!==end)cur.type="path";cur=cur.parent;pl++;forceRender(n=>n+1);await sleep(30);}
      setStats({steps,pathLen:pl});
    }
    setRunning(false);
  };

  return (
    <VisualizerLayout
      title="Pathfinder" onBack={onBack}
      controls={
        <>
          <Select label="Algorithm" value={algo} onChange={setAlgo} options={[
            {value:"bfs",label:"BFS"},{value:"dfs",label:"DFS"},{value:"dijkstra",label:"Dijkstra"},{value:"astar",label:"A*"},
          ]} />
          <Select label="Mode" value={drawMode} onChange={setDrawMode} options={[
            {value:"wall",label:"Draw Wall"},{value:"start",label:"Set Start"},{value:"end",label:"Set End"},{value:"erase",label:"Erase"},
          ]} />
          <Slider label="Speed" min={1} max={50} value={speed} onChange={setSpeed} />
          <Btn label="Clear" onClick={reset} disabled={running} />
          <Btn label="Maze" onClick={generateMaze} disabled={running} />
          <Btn label="▶ Run" variant="primary" onClick={runPathfinding} disabled={running} />
          <Btn label="■ Stop" variant="danger" onClick={() => { runRef.current.cancel=true; setRunning(false); }} disabled={!running} />
          <StatBadge label="Steps" value={stats.steps} />
          <StatBadge label="Path" value={stats.pathLen} />
        </>
      }
      legend={[
        {color:COLORS.start,label:"Start"},{color:COLORS.end,label:"End"},
        {color:"#1e293b",label:"Wall"},{color:"#1e3a8a",label:"Queued"},
        {color:"#312e81",label:"Visited"},{color:COLORS.path,label:"Path"},
      ]}
      aiPanel={<AIExplainerPanel algoName={ALGO_LABELS[algo]} algoContext={`Running ${ALGO_LABELS[algo]} on a ${ROWS}x${COLS} grid. Steps explored: ${stats.steps}. Path length found: ${stats.pathLen}.`} />}
    >
      <div
        style={{ overflowX: "auto", overflowY: "auto", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#0b1220", userSelect: "none" }}
        onMouseLeave={() => mouseDown.current=false}
        onMouseUp={() => mouseDown.current=false}
      >
        <div style={{ display: "inline-block" }}>
          {gridRef.current.map((row, r) => (
            <div key={r} style={{ display: "flex" }}>
              {row.map((cell, c) => (
                <div key={c}
                  style={{ width: CELL_SIZE, height: CELL_SIZE, background: getColor(cell.type), border: "1px solid #0d1829", boxSizing: "border-box", cursor: running ? "default" : "pointer", transition: "background 0.05s" }}
                  onMouseDown={() => { mouseDown.current=true; handleCellInteract(r,c); }}
                  onMouseEnter={() => { if (mouseDown.current&&drawMode==="wall") handleCellInteract(r,c); if(mouseDown.current&&drawMode==="erase") handleCellInteract(r,c); }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </VisualizerLayout>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// BINARY SEARCH
// ═══════════════════════════════════════════════════════════════════════════════
function BinarySearchVisualizer({ onBack }) {
  const [arr, setArr] = useState([]);
  const [target, setTarget] = useState(0);
  const [size, setSize] = useState(24);
  const [speed, setSpeed] = useState(60);
  const [running, setRunning] = useState(false);
  const [highlightLo, setHi_lo] = useState(-1);
  const [highlightHi, setHi_hi] = useState(-1);
  const [highlightMid, setHi_mid] = useState(-1);
  const [foundIdx, setFoundIdx] = useState(-1);
  const [steps, setSteps] = useState(0);
  const runRef = useRef({ cancel: false });

  const generate = useCallback((n = size) => {
    runRef.current.cancel = true;
    setTimeout(() => {
      const s = new Set();
      while (s.size < n) s.add(Math.floor(Math.random() * 999) + 1);
      const a = Array.from(s).sort((x, y) => x - y);
      setArr(a);
      setTarget(a[Math.floor(Math.random() * a.length)]);
      setHi_lo(-1); setHi_hi(-1); setHi_mid(-1); setFoundIdx(-1);
      setSteps(0); setRunning(false);
    }, 50);
  }, [size]);

  useEffect(() => { generate(24); }, []);
  useEffect(() => { if (!running) generate(size); }, [size]);

  const run = async () => {
    if (running || arr.length === 0) return;
    runRef.current.cancel = false; setRunning(true); setFoundIdx(-1);
    let lo = 0, hi = arr.length - 1, found = -1, s = 0;
    const d = Math.max(100, 1501 - speed * 25);
    while (lo <= hi && !runRef.current.cancel) {
      const mid = Math.floor((lo + hi) / 2);
      s++; setSteps(s);
      setHi_lo(lo); setHi_hi(hi); setHi_mid(mid);
      await sleep(d);
      if (arr[mid] === target) { found = mid; break; }
      else if (arr[mid] < target) lo = mid + 1;
      else hi = mid - 1;
    }
    if (!runRef.current.cancel) {
      setFoundIdx(found);
      if (found >= 0) { setHi_lo(found); setHi_hi(found); setHi_mid(found); }
      else { setHi_lo(-1); setHi_hi(-1); setHi_mid(-1); }
    }
    setRunning(false);
  };

  const maxVal = arr.length ? Math.max(...arr) : 1;

  const getBarColor = (i) => {
    if (foundIdx === i) return COLORS.sorted;
    if (i === highlightMid) return COLORS.pivot;
    if (highlightLo >= 0 && i >= highlightLo && i <= highlightHi) return COLORS.comparing;
    if (highlightLo >= 0 && (i < highlightLo || i > highlightHi)) return "#0f2040";
    return COLORS.default;
  };

  return (
    <VisualizerLayout
      title="Binary Search" onBack={onBack}
      controls={
        <>
          <Slider label="Size" min={10} max={48} value={size} onChange={setSize} />
          <Slider label="Speed" min={1} max={60} value={speed} onChange={setSpeed} />
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:11,color:"#64748b"}}>Target:</span>
            <span style={{fontSize:15,fontWeight:700,color:"#f59e0b"}}>{target}</span>
          </div>
          <Btn label="Generate" onClick={() => generate(size)} disabled={running} />
          <Btn label="▶ Search" variant="primary" onClick={run} disabled={running} />
          <Btn label="■ Stop" variant="danger" onClick={() => { runRef.current.cancel=true; setRunning(false); }} disabled={!running} />
          <StatBadge label="Steps" value={steps} />
        </>
      }
      legend={[
        {color:COLORS.default,label:"Array"},{color:COLORS.comparing,label:"Search Range"},
        {color:COLORS.pivot,label:"Mid"},{color:COLORS.sorted,label:"Found"},
        {color:"#0f2040",label:"Eliminated"},
      ]}
      aiPanel={<AIExplainerPanel algoName="Binary Search" algoContext={`Searching for ${target} in a sorted array of ${size} elements. Steps taken: ${steps}. ${foundIdx >= 0 ? `Found at index ${foundIdx}.` : "Still searching."}`} />}
    >
      <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "20px 20px 10px", background: "#0b1220", overflowX: "auto" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 2, marginBottom: 6 }}>
          {arr.map((v, i) => (
            <div key={i} style={{ flex: "1 1 0", minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
              {i === highlightMid && <div style={{fontSize:9,color:COLORS.pivot,marginBottom:2}}>mid</div>}
              {i === highlightLo && highlightLo !== highlightMid && <div style={{fontSize:9,color:COLORS.comparing,marginBottom:2}}>lo</div>}
              {i === highlightHi && highlightHi !== highlightMid && <div style={{fontSize:9,color:COLORS.comparing,marginBottom:2}}>hi</div>}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: "65%", minHeight: 200 }}>
          {arr.map((v, i) => (
            <div key={i} style={{ flex: "1 1 0", minWidth: 4, height: `${(v / maxVal) * 100}%`, background: getBarColor(i), borderRadius: "2px 2px 0 0", transition: "background 0.15s" }} />
          ))}
        </div>
        <div style={{ display: "flex", gap: 2, marginTop: 4 }}>
          {arr.map((v, i) => (
            <div key={i} style={{ flex:"1 1 0", minWidth:0, textAlign:"center", fontSize:Math.min(10,Math.floor(800/arr.length)), color: getBarColor(i)===COLORS.sorted?"#10b981":getBarColor(i)==="#0f2040"?"#1e3a5f":"#475569", overflow:"hidden" }}>
              {arr.length <= 32 ? v : ""}
            </div>
          ))}
        </div>
        {foundIdx >= 0 && (
          <div style={{textAlign:"center",marginTop:12,fontSize:14,color:"#10b981",fontWeight:700}}>
            ✓ Found {target} at index {foundIdx} in {steps} step{steps!==1?"s":""}
          </div>
        )}
        {!running && steps > 0 && foundIdx < 0 && (
          <div style={{textAlign:"center",marginTop:12,fontSize:14,color:COLORS.swapping}}>
            ✗ {target} not found after {steps} steps
          </div>
        )}
      </div>
    </VisualizerLayout>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// N-QUEENS
// ═══════════════════════════════════════════════════════════════════════════════
function NQueensVisualizer({ onBack }) {
  const [n, setN] = useState(8);
  const [board, setBoard] = useState(Array(8).fill(-1));
  const [tryPos, setTryPos] = useState({ r: -1, c: -1 });
  const [conflictRow, setConflictRow] = useState(-1);
  const [speed, setSpeed] = useState(80);
  const [running, setRunning] = useState(false);
  const [stats, setStats] = useState({ steps: 0, solutions: 0 });
  const runRef = useRef({ cancel: false, board: Array(8).fill(-1) });

  const reset = (newN = n) => {
    runRef.current.cancel = true;
    setTimeout(() => {
      const b = Array(newN).fill(-1);
      runRef.current.board = [...b];
      setBoard(b); setTryPos({ r: -1, c: -1 }); setConflictRow(-1);
      setStats({ steps: 0, solutions: 0 }); setRunning(false);
    }, 60);
  };

  const isSafe = (brd, row, col) => {
    for (let r = 0; r < row; r++) {
      if (brd[r] === col || Math.abs(brd[r] - col) === Math.abs(r - row)) return false;
    }
    return true;
  };

  const run = async () => {
    if (running) return;
    runRef.current.cancel = false;
    const brd = Array(n).fill(-1);
    runRef.current.board = [...brd];
    setBoard([...brd]); setRunning(true);
    let steps = 0, solutions = 0;

    const solve = async (row) => {
      if (runRef.current.cancel) return false;
      if (row === n) {
        solutions++;
        setStats({ steps, solutions });
        await sleep(600);
        return true;
      }
      for (let col = 0; col < n; col++) {
        if (runRef.current.cancel) return false;
        steps++;
        setTryPos({ r: row, c: col });
        setStats({ steps, solutions });
        await sleep(Math.max(10, 501 - speed * 5));
        if (isSafe(runRef.current.board, row, col)) {
          runRef.current.board[row] = col;
          setBoard([...runRef.current.board]);
          if (await solve(row + 1)) return true;
          if (!runRef.current.cancel) {
            setConflictRow(row);
            await sleep(Math.max(10, 501 - speed * 5));
            setConflictRow(-1);
            runRef.current.board[row] = -1;
            setBoard([...runRef.current.board]);
          }
        }
      }
      return false;
    };

    await solve(0);
    if (!runRef.current.cancel) setTryPos({ r: -1, c: -1 });
    setRunning(false);
  };

  const CELL = Math.min(56, Math.floor(Math.min(window.innerWidth - 40, window.innerHeight - 200) / n));

  return (
    <VisualizerLayout
      title="N-Queens Problem" onBack={onBack}
      controls={
        <>
          <Slider label="N" min={4} max={12} value={n} onChange={(v) => { setN(v); reset(v); }} />
          <Slider label="Speed" min={1} max={100} value={speed} onChange={setSpeed} />
          <Btn label="Reset" onClick={() => reset(n)} disabled={running} />
          <Btn label="▶ Solve" variant="primary" onClick={run} disabled={running} />
          <Btn label="■ Stop" variant="danger" onClick={() => { runRef.current.cancel=true; setRunning(false); }} disabled={!running} />
          <StatBadge label="Steps" value={stats.steps} />
          <StatBadge label="Solutions" value={stats.solutions} />
        </>
      }
      legend={[
        {color:"#10b981",label:"Queen (safe)"},{color:"#ef4444",label:"Conflict/Backtrack"},
        {color:"rgba(245,158,11,0.3)",label:"Trying"},
      ]}
      aiPanel={<AIExplainerPanel algoName="N-Queens Backtracking" algoContext={`Solving ${n}-Queens problem. Steps taken: ${stats.steps}. Solutions found: ${stats.solutions}. Currently trying to place a queen.`} />}
    >
      <div style={{ height:"100%", display:"flex", alignItems:"center", justifyContent:"center", background:"#0b1220" }}>
        <div style={{ display:"inline-block", border:"2px solid #334155", borderRadius:4 }}>
          {board.map((col, r) => (
            <div key={r} style={{ display:"flex" }}>
              {Array.from({length:n}, (_,c) => {
                const isLight = (r+c)%2===0;
                const hasQueen = col===c;
                const isTrying = tryPos.r===r && tryPos.c===c;
                const isConflict = conflictRow===r && hasQueen;
                let bg = isLight ? "#1e293b" : "#0d1829";
                if (isTrying) bg = "rgba(245,158,11,0.25)";
                if (isConflict) bg = "rgba(239,68,68,0.3)";
                return (
                  <div key={c} style={{ width:CELL, height:CELL, background:bg, display:"flex", alignItems:"center", justifyContent:"center", borderRight:c<n-1?"1px solid #0d1829":undefined, borderBottom:r<n-1?"1px solid #0d1829":undefined, transition:"background 0.1s" }}>
                    {hasQueen && (
                      <span style={{ fontSize:CELL*0.6, lineHeight:1, filter:isConflict?"hue-rotate(120deg)":"none", color:isConflict?"#ef4444":"#10b981" }}>♛</span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </VisualizerLayout>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONVEX HULL
// ═══════════════════════════════════════════════════════════════════════════════
function ConvexHullVisualizer({ onBack }) {
  const canvasRef = useRef(null);
  const stateRef = useRef({ pts: [], hull: [], stack: [], current: null, running: false, cancel: false });
  const [algo, setAlgo] = useState("graham");
  const [numPts, setNumPts] = useState(30);
  const [speed, setSpeed] = useState(40);
  const [running, setRunning] = useState(false);
  const [stats, setStats] = useState({ points: 0, hull: 0 });

  const ALGO_LABELS = { graham: "Graham Scan", jarvis: "Jarvis March" };

  const draw = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const { pts, hull, stack, current } = stateRef.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#0b1220"; ctx.fillRect(0,0,canvas.width,canvas.height);
    if (hull.length >= 3) {
      ctx.beginPath(); ctx.moveTo(hull[0].x, hull[0].y);
      hull.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.closePath(); ctx.fillStyle = "rgba(16,185,129,0.07)"; ctx.fill();
      ctx.strokeStyle = "#10b981"; ctx.lineWidth = 2; ctx.stroke();
    }
    if (stack.length >= 2) {
      ctx.beginPath(); ctx.moveTo(stack[0].x, stack[0].y);
      stack.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.strokeStyle = "rgba(245,158,11,0.5)"; ctx.lineWidth = 1.5; ctx.stroke();
    }
    pts.forEach(p => {
      const inHull = hull.includes(p);
      const inStack = stack.includes(p);
      ctx.beginPath(); ctx.arc(p.x, p.y, inHull ? 6 : 4, 0, Math.PI*2);
      ctx.fillStyle = inHull ? "#10b981" : inStack ? "#f59e0b" : "#475569";
      ctx.fill();
    });
    if (current) {
      ctx.beginPath(); ctx.arc(current.x, current.y, 8, 0, Math.PI*2);
      ctx.strokeStyle = "#f59e0b"; ctx.lineWidth = 2; ctx.stroke();
    }
  };

  const generate = (n = numPts) => {
    stateRef.current.cancel = true;
    setTimeout(() => {
      const canvas = canvasRef.current; if (!canvas) return;
      const margin = 50, W = canvas.width, H = canvas.height;
      const pts = Array.from({length:n}, () => ({
        x: margin + Math.random()*(W - 2*margin),
        y: margin + Math.random()*(H - 2*margin),
      }));
      stateRef.current = { pts, hull:[], stack:[], current:null, running:false, cancel:false };
      setStats({points:n, hull:0}); setRunning(false); draw();
    }, 60);
  };

  useEffect(() => {
    const resize = () => {
      const c = canvasRef.current; if (!c) return;
      c.width = c.parentElement.clientWidth;
      c.height = c.parentElement.clientHeight;
      generate(numPts);
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => { if (!running) generate(numPts); }, [numPts]);

  const cross = (o,a,b) => (a.x-o.x)*(b.y-o.y)-(a.y-o.y)*(b.x-o.x);

  const runAlgo = async () => {
    if (running) return;
    stateRef.current.cancel = false; stateRef.current.running = true; setRunning(true);
    const s = stateRef.current;
    s.hull = []; s.stack = []; s.current = null;
    const delay = () => sleep(Math.max(5, 101-speed));

    if (algo==="graham") {
      let pts = [...s.pts].sort((a,b)=>a.y===b.y?a.x-b.x:a.y-b.y);
      const pivot = pts[0];
      pts = pts.slice(1).sort((a,b) => Math.atan2(a.y-pivot.y,a.x-pivot.x)-Math.atan2(b.y-pivot.y,b.x-pivot.x));
      pts.unshift(pivot);
      const stack = [pts[0], pts[1]];
      s.stack = [...stack]; draw();
      for (let i=2; i<pts.length && !s.cancel; i++) {
        const p = pts[i]; s.current=p; draw(); await delay();
        while (stack.length>1 && cross(stack[stack.length-2],stack[stack.length-1],p)<=0) {
          stack.pop(); s.stack=[...stack]; draw(); await delay();
        }
        stack.push(p); s.stack=[...stack]; draw();
      }
      s.hull=[...stack]; s.stack=[]; s.current=null;
    } else {
      const pts = s.pts; const n = pts.length;
      const hullPts = [];
      let l = pts.reduce((mi,p,i)=>p.x<pts[mi].x?i:mi, 0);
      let p = l;
      do {
        if (s.cancel) break;
        hullPts.push(pts[p]); s.hull=[...hullPts]; draw();
        let q = (p+1)%n;
        for (let r=0; r<n; r++) {
          if (s.cancel) break;
          s.current=pts[r]; draw(); await sleep(15);
          if (cross(pts[p],pts[q],pts[r])<0) q=r;
        }
        p=q; await delay();
      } while (p!==l);
      s.hull=[...hullPts]; s.stack=[]; s.current=null;
    }
    if (!s.cancel) setStats({points:s.pts.length, hull:s.hull.length});
    draw(); stateRef.current.running=false; setRunning(false);
  };

  const handleCanvasClick = (e) => {
    if (running) return;
    const rect = canvasRef.current.getBoundingClientRect();
    stateRef.current.pts.push({ x: e.clientX-rect.left, y: e.clientY-rect.top });
    stateRef.current.hull=[]; stateRef.current.stack=[];
    setStats(s=>({...s,points:stateRef.current.pts.length}));
    draw();
  };

  return (
    <VisualizerLayout
      title="Convex Hull" onBack={onBack}
      controls={
        <>
          <Select label="Algorithm" value={algo} onChange={setAlgo} options={[{value:"graham",label:"Graham Scan"},{value:"jarvis",label:"Jarvis March"}]} />
          <Slider label="Points" min={5} max={80} value={numPts} onChange={setNumPts} />
          <Slider label="Speed" min={1} max={100} value={speed} onChange={setSpeed} />
          <Btn label="Generate" onClick={()=>generate(numPts)} disabled={running} />
          <Btn label="▶ Run" variant="primary" onClick={runAlgo} disabled={running} />
          <Btn label="■ Stop" variant="danger" onClick={()=>{stateRef.current.cancel=true;setRunning(false);}} disabled={!running} />
          <StatBadge label="Points" value={stats.points} />
          <StatBadge label="Hull" value={stats.hull} />
        </>
      }
      legend={[
        {color:"#475569",label:"Points"},{color:"#f59e0b",label:"Considering"},
        {color:"#10b981",label:"Hull Vertex"},{color:"rgba(16,185,129,0.3)",label:"Hull Area"},
      ]}
      aiPanel={<AIExplainerPanel algoName={ALGO_LABELS[algo]} algoContext={`Running ${ALGO_LABELS[algo]} on ${stats.points} points. Hull vertices found so far: ${stats.hull}.`} />}
    >
      <canvas ref={canvasRef} onClick={handleCanvasClick} style={{width:"100%",height:"100%",display:"block",cursor:"crosshair"}} />
    </VisualizerLayout>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRIME SIEVE
// ═══════════════════════════════════════════════════════════════════════════════
function PrimeSieveVisualizer({ onBack }) {
  const [limit, setLimit] = useState(200);
  const [algo, setAlgo] = useState("sieve");
  const [speed, setSpeed] = useState(60);
  const [running, setRunning] = useState(false);
  const [cellState, setCellState] = useState(() => Array(201).fill("unknown"));
  const [currentNum, setCurrentNum] = useState(-1);
  const [stats, setStats] = useState({ primes: 0, steps: 0 });
  const runRef = useRef({ cancel: false });

  const ALGO_LABELS = { sieve: "Sieve of Eratosthenes", brute: "Brute Force Prime Search" };

  const reset = (l = limit) => {
    runRef.current.cancel = true;
    setTimeout(() => { setCellState(Array(l+1).fill("unknown")); setCurrentNum(-1); setStats({primes:0,steps:0}); setRunning(false); }, 60);
  };

  useEffect(() => { reset(200); }, []);
  useEffect(() => { if (!running) reset(limit); }, [limit]);

  const run = async () => {
    if (running) return;
    runRef.current.cancel = false; setRunning(true);
    const state = Array(limit+1).fill("unknown");
    let primes=0, steps=0;
    const delay = () => sleep(Math.max(1, 101-speed));

    if (algo==="sieve") {
      for (let i=2; i<=limit && !runRef.current.cancel; i++) {
        if (state[i]==="unknown") {
          state[i]="prime"; primes++;
          setCurrentNum(i); setCellState([...state]); setStats({primes,steps}); await delay();
          for (let j=i*2; j<=limit && !runRef.current.cancel; j+=i) {
            state[j]="composite"; steps++;
          }
        } else if (state[i]==="unknown") state[i]="composite";
        if (i%5===0||i<=20) setCellState([...state]);
      }
    } else {
      const isPrime = (n) => { for (let i=2;i<=Math.sqrt(n);i++){steps++;if(n%i===0)return false;} return true; };
      for (let i=2; i<=limit && !runRef.current.cancel; i++) {
        state[i] = isPrime(i)?"prime":"composite";
        if (state[i]==="prime") primes++;
        setCurrentNum(i); setCellState([...state]); setStats({primes,steps}); await delay();
      }
    }
    if (!runRef.current.cancel) { setCurrentNum(-1); setCellState([...state]); }
    setRunning(false);
  };

  const cols = Math.ceil(Math.sqrt(limit * (window.innerWidth / (window.innerHeight - 160))));
  const cellSize = Math.max(18, Math.min(36, Math.floor((window.innerWidth-40)/cols)));

  const getColor = (i) => {
    if (i<=1) return "#0d1829";
    if (i===currentNum) return COLORS.current;
    switch(cellState[i]) {
      case "prime": return COLORS.prime;
      case "composite": return "#3b0a0a";
      default: return "#1e293b";
    }
  };

  return (
    <VisualizerLayout
      title="Prime Numbers" onBack={onBack}
      controls={
        <>
          <Select label="Algorithm" value={algo} onChange={setAlgo} options={[{value:"sieve",label:"Sieve of Eratosthenes"},{value:"brute",label:"Brute Force"}]} />
          <Slider label="Limit" min={50} max={500} step={10} value={limit} onChange={setLimit} />
          <Slider label="Speed" min={1} max={100} value={speed} onChange={setSpeed} />
          <Btn label="Reset" onClick={()=>reset(limit)} disabled={running} />
          <Btn label="▶ Run" variant="primary" onClick={run} disabled={running} />
          <Btn label="■ Stop" variant="danger" onClick={()=>{runRef.current.cancel=true;setRunning(false);}} disabled={!running} />
          <StatBadge label="Primes" value={stats.primes} />
          <StatBadge label="Steps" value={stats.steps} />
        </>
      }
      legend={[
        {color:"#1e293b",label:"Unknown"},{color:COLORS.current,label:"Current"},
        {color:COLORS.prime,label:"Prime"},{color:"#3b0a0a",label:"Composite"},
      ]}
      aiPanel={<AIExplainerPanel algoName={ALGO_LABELS[algo]} algoContext={`Running ${ALGO_LABELS[algo]} up to ${limit}. Primes found: ${stats.primes}. Steps taken: ${stats.steps}.`} />}
    >
      <div style={{overflowY:"auto",height:"100%",padding:"12px 16px",background:"#0b1220"}}>
        <div style={{display:"grid",gridTemplateColumns:`repeat(${cols}, ${cellSize}px)`,gap:2}}>
          {Array.from({length:limit-1},(_,i)=>i+2).map(i=>(
            <div key={i} style={{width:cellSize,height:cellSize,background:getColor(i),display:"flex",alignItems:"center",justifyContent:"center",borderRadius:3,transition:"background 0.1s"}}>
              {cellSize>=20 && <span style={{fontSize:Math.min(11,cellSize-6),color:cellState[i]==="prime"?"#0f172a":cellState[i]==="composite"?"#7f1d1d":i===currentNum?"#0f172a":"#475569",fontWeight:cellState[i]==="prime"?700:400}}>{i}</span>}
            </div>
          ))}
        </div>
      </div>
    </VisualizerLayout>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// RECURSION TREE
// ═══════════════════════════════════════════════════════════════════════════════
function RecursionTreeVisualizer({ onBack }) {
  const canvasRef = useRef(null);
  const [func, setFunc] = useState("fibonacci");
  const [n, setN] = useState(6);
  const [speed, setSpeed] = useState(50);
  const [running, setRunning] = useState(false);
  const [stats, setStats] = useState({ calls: 0, depth: 0 });
  const runRef = useRef({ cancel: false });

  const FUNC_LABELS = { fibonacci: "Fibonacci Recursion", factorial: "Factorial Recursion", power: "Power Function Recursion" };

  const draw = (nodes, edges, active=-1) => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W=canvas.width, H=canvas.height;
    ctx.clearRect(0,0,W,H); ctx.fillStyle="#0b1220"; ctx.fillRect(0,0,W,H);
    ctx.strokeStyle="#1e3a5f"; ctx.lineWidth=1.5;
    edges.forEach(({from,to})=>{
      const f=nodes[from], t=nodes[to];
      ctx.beginPath(); ctx.moveTo(f.x,f.y); ctx.lineTo(t.x,t.y); ctx.stroke();
    });
    nodes.forEach((node,i)=>{
      const isActive = i===active;
      const r=16;
      ctx.beginPath(); ctx.arc(node.x,node.y,r,0,Math.PI*2);
      ctx.fillStyle=isActive?COLORS.comparing:node.done?COLORS.sorted:COLORS.default;
      ctx.fill();
      ctx.fillStyle="#e2e8f0"; ctx.font=`bold 10px 'IBM Plex Mono'`;
      ctx.textAlign="center"; ctx.textBaseline="middle";
      ctx.fillText(node.label, node.x, node.y);
    });
  };

  const run = async () => {
    if (running) return;
    runRef.current.cancel=false; setRunning(true);
    const canvas=canvasRef.current; if (!canvas) return;
    const W=canvas.width;
    const nodes=[], edges=[];
    let callCount=0, maxDepth=0;
    const delay=()=>sleep(Math.max(10, 201-speed*2));

    const buildAndAnimate=async()=>{
      const animate=async(label,depth,px,parentId=-1)=>{
        if (runRef.current.cancel) return 0;
        callCount++;
        const nodeId=nodes.length;
        const y=depth*70+50;
        nodes.push({label,x:px,y,done:false,depth});
        if (parentId>=0) edges.push({from:parentId,to:nodeId});
        maxDepth=Math.max(maxDepth,depth);
        setStats({calls:callCount,depth:maxDepth});
        draw(nodes,edges,nodeId);
        await delay();

        let result=0;
        if (func==="fibonacci") {
          const fib_n=parseInt(label.split("(")[1]?.replace(")",""));
          if (fib_n<=1) { result=fib_n; }
          else {
            const spread=Math.max(20,(W*0.8)/Math.pow(2,depth+1));
            result=await animate(`F(${fib_n-1})`,depth+1,px-spread,nodeId)
                  +await animate(`F(${fib_n-2})`,depth+1,px+spread,nodeId);
          }
        } else if (func==="factorial") {
          const f_n=parseInt(label.split("(")[1]?.replace(")",""));
          if (f_n<=0) result=1;
          else result=f_n*(await animate(`f(${f_n-1})`,depth+1,px+20,nodeId));
        } else if (func==="power") {
          const parts=label.replace("pow(","").replace(")","").split(",");
          const [base,exp]=parts.map(Number);
          if (exp===0) result=1;
          else result=base*(await animate(`pow(${base},${exp-1})`,depth+1,px,nodeId));
        }

        nodes[nodeId].done=true;
        nodes[nodeId].label=`${label}=${result}`;
        draw(nodes,edges,nodeId);
        await delay();
        return result;
      };

      if (func==="fibonacci") await animate(`F(${n})`,0,W/2);
      else if (func==="factorial") await animate(`f(${n})`,0,W/2);
      else if (func==="power") await animate(`pow(2,${n})`,0,W/2);
    };

    await buildAndAnimate();
    if (!runRef.current.cancel) draw(nodes,edges);
    setRunning(false);
  };

  useEffect(()=>{
    const resize=()=>{
      const c=canvasRef.current; if (!c) return;
      c.width=c.parentElement.clientWidth;
      c.height=c.parentElement.clientHeight;
      draw([],[]);
    };
    resize();
    window.addEventListener("resize",resize);
    return ()=>window.removeEventListener("resize",resize);
  },[]);

  return (
    <VisualizerLayout
      title="Recursion Tree" onBack={onBack}
      controls={
        <>
          <Select label="Function" value={func} onChange={setFunc} options={[
            {value:"fibonacci",label:"Fibonacci(n)"},{value:"factorial",label:"Factorial(n)"},{value:"power",label:"Power(2,n)"},
          ]} />
          <Slider label="n" min={2} max={func==="fibonacci"?8:10} value={Math.min(n,func==="fibonacci"?8:10)} onChange={setN} />
          <Slider label="Speed" min={1} max={100} value={speed} onChange={setSpeed} />
          <Btn label="▶ Visualize" variant="primary" onClick={run} disabled={running} />
          <Btn label="■ Stop" variant="danger" onClick={()=>{runRef.current.cancel=true;setRunning(false);}} disabled={!running} />
          <StatBadge label="Calls" value={stats.calls} />
          <StatBadge label="Depth" value={stats.depth} />
        </>
      }
      legend={[
        {color:COLORS.default,label:"Pending"},{color:COLORS.comparing,label:"Active"},
        {color:COLORS.sorted,label:"Resolved"},
      ]}
      aiPanel={<AIExplainerPanel algoName={FUNC_LABELS[func]} algoContext={`Visualizing ${FUNC_LABELS[func]} with n=${n}. Total recursive calls so far: ${stats.calls}. Maximum recursion depth: ${stats.depth}.`} />}
    >
      <canvas ref={canvasRef} style={{width:"100%",height:"100%",display:"block"}} />
    </VisualizerLayout>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT APP
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [page, setPage] = useState("home");

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;700&family=Exo+2:wght@400;700;800&display=swap";
    document.head.appendChild(link);
  }, []);

  const PAGES = {
    home:       <HomePage onNavigate={setPage} />,
    sorting:    <SortingVisualizer onBack={() => setPage("home")} />,
    pathfinding:<PathfindingVisualizer onBack={() => setPage("home")} />,
    bsearch:    <BinarySearchVisualizer onBack={() => setPage("home")} />,
    nqueen:     <NQueensVisualizer onBack={() => setPage("home")} />,
    convexhull: <ConvexHullVisualizer onBack={() => setPage("home")} />,
    primes:     <PrimeSieveVisualizer onBack={() => setPage("home")} />,
    recursion:  <RecursionTreeVisualizer onBack={() => setPage("home")} />,
  };

  return PAGES[page] || PAGES.home;
}