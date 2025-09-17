"use client";
import { useEffect, useMemo, useRef, useState } from "react";

export default function Chatbot({ apiBase, lastPrediction, lastInputs }) {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [chat, setChat] = useState([
    { role: "assistant", content: "Ask me anything about the prediction shown on the page." }
  ]);
  const [busy, setBusy] = useState(false);
  const bodyRef = useRef(null);

  const canAsk = useMemo(() => !!lastPrediction && !busy && msg.trim().length > 0, [lastPrediction, busy, msg]);

  useEffect(() => {
    // Auto-scroll
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
  }, [chat, open]);

  const send = async () => {
    if (!canAsk) return;
    const userTurn = { role: "user", content: msg.trim() };
    setChat((c) => [...c, userTurn]);
    setMsg(""); setBusy(true);
    try {
      const res = await fetch(`${apiBase}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userTurn.content,
          context: lastPrediction,
          inputs: lastInputs
        })
      });
      const data = await res.json();
      const assistantTurn = { role: "assistant", content: data?.answer || "No answer." };
      setChat((c) => [...c, assistantTurn]);
    } catch (e) {
      setChat((c) => [...c, { role: "assistant", content: `Error: ${String(e)}` }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-40 rounded-full bg-sky-500 hover:bg-sky-600 shadow-xl px-4 py-3 text-white font-medium"
      >
        {open ? "Close Chat" : "Ask about result"}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-40 w-[360px] max-w-[90vw] rounded-2xl bg-white text-slate-900 shadow-2xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 bg-slate-900 text-white text-sm flex items-center justify-between">
            <span className="font-semibold">Prediction Assistant</span>
            <span className="text-xs opacity-80">{lastPrediction ? "grounded" : "no prediction yet"}</span>
          </div>

          <div ref={bodyRef} className="h-64 overflow-y-auto px-4 py-3 space-y-3 bg-slate-50">
            {chat.map((m, i) => (
              <div key={i} className={m.role === "assistant" ? "text-sm" : "text-sm text-right"}>
                <div className={
                  "inline-block rounded-2xl px-3 py-2 max-w-[85%] " +
                  (m.role === "assistant" ? "bg-white border border-slate-200" : "bg-sky-100 border border-sky-200")
                }>
                  {m.content}
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 flex items-center gap-2 border-t border-slate-200 bg-white">
            <input
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={lastPrediction ? "e.g., Why this MasterItemNo?" : "Make a prediction first…"}
              className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
            <button
              onClick={send}
              disabled={!canAsk}
              className="rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-50 px-4 py-2 text-sm text-white"
            >
              {busy ? "…" : "Send"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
