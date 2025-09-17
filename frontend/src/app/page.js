"use client";
import { useState } from "react";

// Base API URL: prefer env var, fallback to same-origin (useful locally)
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined" ? window.location.origin.replace(/\/$/, "") : "");

console.log("API_BASE:", API_BASE);

export default function Home() {
  const [desc, setDesc] = useState("");
  const [uom, setUom] = useState("");
  const [coreMarket, setCoreMarket] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);


  const predict = async () => {
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
        throw new Error(`HTTP ${res.status} ${res.statusText}: ${txt}`);
      }

      const data = await res.json();
      setResult(data);
    } catch (e) {
      setResult({ error: String(e) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8 gap-4">
      <h1 className="text-3xl font-bold mb-2">CTAI - CTD Hackathon</h1>

      <input
        className="border border-gray-400 rounded p-2 w-80"
        type="text"
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        placeholder="Enter item description..."
      />

      <div className="flex gap-3">
        <input
          className="border border-gray-400 rounded p-2 w-36"
          type="text"
          value={uom}
          onChange={(e) => setUom(e.target.value)}
          placeholder="UOM (optional)"
        />
        <input
          className="border border-gray-400 rounded p-2 w-56"
          type="text"
          value={coreMarket}
          onChange={(e) => setCoreMarket(e.target.value)}
          placeholder="CORE_MARKET (optional)"
        />
      </div>

      <button
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-60"
        onClick={predict}
        disabled={loading}
      >
        {loading ? "Predicting..." : "Predict"}
      </button>

      {result && (
        <div className="mt-4 p-4 border rounded bg-gray-50 w-[28rem]">
          {"error" in result ? (
            <p className="text-red-600">
              <b>Error:</b> {result.error}
            </p>
          ) : (
            <>
              <p>
                <b>MasterItemNo:</b> {result.MasterItemNo}
              </p>
              <p>
                <b>QtyShipped:</b> {result.QtyShipped}
              </p>
              <p className="mt-2 text-sm text-gray-700">
                <b>uom:</b> {result.uom ?? "—"} &nbsp;&nbsp;
                <b>core_market:</b> {result.core_market ?? "—"}
              </p>
            </>
          )}
        </div>
      )}
    </main>
  );
}