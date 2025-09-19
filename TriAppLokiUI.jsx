// src/TriAppLokiUI.jsx
import { useState } from "react";
import { askTriApp } from "./api";

export default function TriAppLokiUI() {
  const [q, setQ] = useState("");
  const [out, setOut] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setOut("");
    setError("");
    try {
      const data = await askTriApp(q || "hello");
      setOut(typeof data === "string" ? data : JSON.stringify(data, null, 2));
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 16, maxWidth: 720, fontFamily: "system-ui, Arial" }}>
      <h1>TriApp Loki</h1>
      <form onSubmit={onSubmit} style={{ display: "flex", gap: 8 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Type a question…"
          style={{ flex: 1, padding: 8, fontSize: 16 }}
        />
        <button disabled={loading} style={{ padding: "8px 14px", fontSize: 16 }}>
          {loading ? "Sending…" : "Send"}
        </button>
      </form>

      {error && <div style={{ color: "crimson", marginTop: 12 }}>Error: {error}</div>}
      {out && (
        <pre style={{ marginTop: 12, whiteSpace: "pre-wrap" }}>
          {out}
        </pre>
      )}
    </div>
  );
}
