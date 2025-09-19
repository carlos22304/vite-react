// src/api.js
const base = ""; // Netlify redirect handles prod

export async function askTriApp(question) {
  const res = await fetch(`${base}/webhook/tri-app2`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });

  // Read the body ONCE
  const text = await res.text();

  if (!res.ok) {
    // include backend error text if present
    throw new Error(`HTTP ${res.status}${text ? `: ${text}` : ""}`);
  }

  // Try to parse JSON, otherwise return plain text
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
