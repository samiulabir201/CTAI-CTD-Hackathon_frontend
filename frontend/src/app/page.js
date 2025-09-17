"use client";
import { useState, useMemo } from "react";

// Prefer env var, fall back to same-origin (good for local dev)
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

export default function Home() {
  const [desc, setDesc] = useState("");
  const [uom, setUom] = useState("");
  const [coreMarket, setCoreMarket] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const canSubmit = useMemo(() => desc.trim().length > 0 && !loading, [desc, loading]);

  const examples = [
    { d: "cat6 ethernet cable 10m", u: "EA", c: "Enterprise" },
    { d: "fiber patch panel 24-port", u: "EA", c: "Critical Ops" },
    { d: "concrete mix 50lb bag", u: "EA", c: "Future Tech" },
  ];

  const predict = async () => {
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
    } catch (e) {
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  const fillExample = (ex) => {
    setDesc(ex.d); setUom(ex.u); setCoreMarket(ex.c);
    setResult(null); setErr("");
  };

  return (
    <main className="min-h-svh bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <header className="mx-auto max-w-5xl px-6 py-8 flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
          CTAI • CTD Material Forecast
        </h1>
        <span className="text-xs sm:text-sm text-slate-300">
          API: <code className="font-mono">{API_BASE.replace(/^https?:\/\//, "")}</code>
        </span>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 pb-4">
        <div className="mb-6">
          <h2 className="text-3xl sm:text-4xl font-bold">Predict Materials & Quantities</h2>
          <p className="mt-2 text-slate-300">
            Enter an item description (and optional UOM / Core Market). We’ll return the predicted
            <span className="font-semibold"> MasterItemNo</span> and <span className="font-semibold">QtyShipped</span>.
          </p>
        </div>
      </section>

      {/* Card */}
      <section className="mx-auto max-w-5xl px-6 pb-16">
        <div className="rounded-3xl bg-white/10 backdrop-blur-md border border-white/10 shadow-2xl p-6 sm:p-8">
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
              onClick={() => { setDesc(""); setUom(""); setCoreMarket(""); setResult(null); setErr(""); }}
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
                  <span className="text-slate-400">uom:</span>{" "}
                  {result.uom ?? "—"}
                </span>
                <span>
                  <span className="text-slate-400">core_market:</span>{" "}
                  {result.core_market ?? "—"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-400">
          Built for CTAI–CTD Hackathon • Deployed on Vercel + Render
        </p>
      </section>
    </main>
  );
}
