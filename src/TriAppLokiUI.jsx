// src/TriAppLokiUI.jsx
import { useState } from "react";
import { askTriApp } from "./api";

export default function TriAppLokiUI() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setAnswer("");
    try {
      const res = await askTriApp(question);
      if (typeof res === "string") setAnswer(res);
      else if (res && res.answer) setAnswer(res.answer);
      else setAnswer(JSON.stringify(res, null, 2));
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg,#0ea5e9 0%, #22c55e 55%, #16a34a 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      color: "#0b1b12"
    }}>
      <div style={{
        width: "100%",
        maxWidth: 860,
        background: "rgba(255,255,255,0.92)",
        borderRadius: 16,
        boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
        padding: 28
      }}>
        <h1 style={{ margin: 0, fontSize: 36 }}>TriApp Loki</h1>
        <p style={{ marginTop: 6, opacity: 0.7 }}>Ask anything. We’ll route it to Loki.</p>

        <form onSubmit={onSubmit} style={{ marginTop: 18, display: "grid", gap: 12 }}>
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g., What’s the capital of Colombia?"
            style={{
              width: "100%",
              padding: "14px 16px",
              borderRadius: 12,
              border: "1px solid #cbd5e1",
              outline: "none",
              fontSize: 16
            }}
          />
          <button
            type="submit"
            disabled={!question || loading}
            style={{
              padding: "12px 16px",
              borderRadius: 12,
              border: "none",
              color: "white",
              background: loading ? "#9ca3af" : "#16a34a",
              cursor: loading ? "default" : "pointer",
              fontSize: 16,
              fontWeight: 600
            }}
          >
            {loading ? "Thinking…" : "Ask"}
          </button>
        </form>

        {error && (
          <div style={{
            marginTop: 14,
            padding: 12,
            borderRadius: 12,
            background: "#fee2e2",
            color: "#991b1b",
            fontWeight: 600
          }}>
            Error: {error}
          </div>
        )}

        {answer && (
          <pre style={{
            marginTop: 16,
            padding: 16,
            borderRadius: 12,
            background: "#0f172a",
            color: "#e2e8f0",
            whiteSpace: "pre-wrap"
          }}>
            {answer}
          </pre>
        )}
      </div>
    </div>
  );
}
