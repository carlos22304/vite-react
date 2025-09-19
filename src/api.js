// src/api.js
const base = ""; // rely on Netlify redirect in production

export async function askTriApp(question) {
  const res = await fetch(`${base}/webhook/tri-app2`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });

  if (!res.ok) {
    let body = "";
    try { body = await res.text(); } catch {}
    throw new Error(`HTTP ${res.status}${body ? `: ${body}` : ""}`);
  }

  try {
    return await res.json();
  } catch {
    return await res.text();
  }
}
