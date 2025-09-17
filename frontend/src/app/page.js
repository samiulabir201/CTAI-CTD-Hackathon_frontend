"use client";
import { useMemo, useRef, useState } from "react";

// Prefer env var; fall back to same-origin (good for local dev)
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined" ? window.location.origin.replace(/\/$/, "") : "");

function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
    </svg>
  );
}

function Bubble({ role, children }) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} my-1`}>
      <div
        className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed border
        ${isUser
          ? "bg-sky-500 text-white border-sky-400"
          : "bg-white/10 text-slate-100 border-white/15"}`}
      >
        {children}
      </div>
    </div>
  );
}

export default function Home() {
  const [desc, setDesc] = useState("");
  const [uom, setUom] = useState("");
  const [coreMarket, setCoreMarket] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // Chat state
  const [chatOpen, setChatOpen] = useState(true);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I can explain the prediction, suggest vendors/timelines at a high level, and help you interpret QtyShipped. Ask me anything about the result.",
    },
  ]);
  const chatEndRef = useRef(null);

  const canSubmit = useMemo(() => desc.trim().length > 0 && !loading, [desc, loading]);

  const examples = [
    { d: "cat6 ethernet cable 10m", u: "EA", c: "Enterprise" },
    { d: "fiber patch panel 24-port", u: "EA", c: "Critical Ops" },
    { d: "concrete mix 50lb bag", u: "EA", c: "Future Tech" },
  ];

  async function predict() {
    setErr("");
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: desc,
          uom: uom || null,
          core_market: coreMarket || null,
        }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`HTTP ${res.status}: ${txt}`);
      }
      const data = await res.json();
      setResult(data);

      // Seed chat with a quick system line about the new prediction
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: `Noted. Latest prediction → MasterItemNo: ${data.MasterItemNo}, QtyShipped: ${data.QtyShipped}. Ask me for a quick rationale or procurement tips.`,
        },
      ]);
    } catch (e) {
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  function fillExample(ex) {
    setDesc(ex.d);
    setUom(ex.u);
    setCoreMarket(ex.c);
    setResult(null);
    setErr("");
  }

  async function sendChat() {
    const msg = chatInput.trim();
    if (!msg) return;
    setChatInput("");
    setMessages((m) => [...m, { role: "user", content: msg }]);
    setChatLoading(true);

    try {
      const payload = {
        message: msg,
        context: result || {}, // {MasterItemNo, QtyShipped, uom, core_market}
        inputs: { description: desc, uom, core_market: coreMarket },
      };
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`HTTP ${res.status}: ${txt}`);
      }
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", content: data.answer || "(no answer)" }]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "I couldn't reach the explainer service. Please try again in a moment. (" +
            String(e?.message || e) +
            ")",
        },
      ]);
    } finally {
      setChatLoading(false);
      // Scroll to bottom of chat
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendChat();
    }
  }

  return (
    <main className="min-h-svh bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <header className="mx-auto max-w-6xl px-6 py-8 flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
          CTAI • CTD Material Forecast
        </h1>
        <span className="text-xs sm:text-sm text-slate-300">
          API: <code className="font-mono">{API_BASE.replace(/^https?:\/\//, "")}</code>
        </span>
      </header>

      {/* Body: two columns on desktop */}
      <section className="mx-auto max-w-6xl px-6 pb-16 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Predictor card */}
        <div className="rounded-3xl bg-white/10 backdrop-blur-md border border-white/10 shadow-2xl p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-3xl sm:text-4xl font-bold">Predict Materials & Quantities</h2>
            <p className="mt-2 text-slate-300">
              Enter an item description (and optional UOM / Core Market). We’ll return the predicted{" "}
              <span className="font-semibold">MasterItemNo</span> and{" "}
              <span className="font-semibold">QtyShipped</span>.
            </p>
          </div>

          {/* Inputs */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-3">
              <label className="block text-sm text-slate-200 mb-1">Item Description *</label>
              <input
                className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400"
                type="text"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="e.g., cat6 ethernet cable 10m"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-200 mb-1">UOM (optional)</label>
              <input
                className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400"
                type="text"
                value={uom}
                onChange={(e) => setUom(e.target.value)}
                placeholder="EA, BOX, etc."
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm text-slate-200 mb-1">CORE_MARKET (optional)</label>
              <input
                className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400"
                type="text"
                value={coreMarket}
                onChange={(e) => setCoreMarket(e.target.value)}
                placeholder="Enterprise, Future Tech, Critical Ops…"
              />
            </div>
          </div>

          {/* Examples */}
          <div className="mt-4 flex flex-wrap gap-2">
            {examples.map((ex, i) => (
              <button
                key={i}
                onClick={() => fillExample(ex)}
                className="text-xs bg-white/10 hover:bg-white/20 border border-white/15 rounded-full px-3 py-1 transition"
                title="Fill example"
              >
                {ex.d}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={predict}
              disabled={!canSubmit}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-50 px-5 py-3 font-medium transition focus:outline-none focus:ring-2 focus:ring-sky-400"
            >
              {loading ? <Spinner /> : null}
              {loading ? "Predicting…" : "Predict"}
            </button>

            <button
              onClick={() => {
                setDesc(""); setUom(""); setCoreMarket("");
                setResult(null); setErr("");
              }}
              className="rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 px-4 py-3 text-sm transition"
            >
              Clear
            </button>
          </div>

          {/* Error */}
          {err && (
            <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              <b>Error:</b> {err}
            </div>
          )}

          {/* Result */}
          {result && !err && (
            <div className="mt-6 rounded-2xl border border-white/15 bg-white/5 p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Prediction</h3>
                <span className="text-xs rounded-full bg-emerald-500/20 text-emerald-200 px-2 py-1 border border-emerald-400/30">
                  Success
                </span>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-white/5 p-3 border border-white/10">
                  <div className="text-xs text-slate-300">MasterItemNo</div>
                  <div className="text-xl font-semibold">{result.MasterItemNo}</div>
                </div>
                <div className="rounded-xl bg-white/5 p-3 border border-white/10">
                  <div className="text-xs text-slate-300">QtyShipped</div>
                  <div className="text-xl font-semibold">{result.QtyShipped}</div>
                </div>
              </div>
              <div className="mt-3 text-sm text-slate-300">
                <span className="mr-4">
                  <span className="text-slate-400">uom:</span> {result.uom ?? "—"}
                </span>
                <span>
                  <span className="text-slate-400">core_market:</span> {result.core_market ?? "—"}
                </span>
              </div>
            </div>
          )}

          <p className="mt-6 text-center text-xs text-slate-400">
            Built for CTAI–CTD Hackathon • Deployed on Vercel + Render
          </p>
        </div>

        {/* Right: Chatbot panel */}
        <div className="rounded-3xl bg-white/10 backdrop-blur-md border border-white/10 shadow-2xl p-6 sm:p-8 flex flex-col">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Prediction Explainer</h3>
            <button
              onClick={() => setChatOpen((v) => !v)}
              className="text-xs rounded-full bg-white/10 hover:bg-white/20 border border-white/15 px-3 py-1 transition"
            >
              {chatOpen ? "Hide" : "Show"}
            </button>
          </div>

          {chatOpen && (
            <>
              <div className="mt-4 flex-1 overflow-y-auto pr-1" style={{ minHeight: 260 }}>
                {messages.map((m, i) => (
                  <Bubble key={i} role={m.role}>{m.content}</Bubble>
                ))}
                <div ref={chatEndRef} />
              </div>

              <div className="mt-3 flex items-end gap-2">
                <textarea
                  rows={2}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Ask: why this item? how is quantity estimated? vendor timing tips…"
                  className="flex-1 resize-none rounded-xl border border-white/20 bg-white/5 px-3 py-2 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
                <button
                  onClick={sendChat}
                  disabled={chatLoading || !chatInput.trim()}
                  className="inline-flex items-center gap-2 rounded-xl bg-fuchsia-500 hover:bg-fuchsia-600 disabled:opacity-50 px-4 py-2 font-medium transition focus:outline-none focus:ring-2 focus:ring-fuchsia-400"
                  title="Send"
                >
                  {chatLoading ? <Spinner /> : null}
                  Send
                </button>
              </div>

              {!result && (
                <p className="mt-2 text-xs text-slate-400">
                  Tip: run a prediction first for the most useful, grounded answers.
                </p>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
