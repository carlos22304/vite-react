const base = ""; // dev -> Vite proxy, prod -> Netlify proxy

export async function askTriApp(question) {
  const res = await fetch(`${base}/webhook/tri-app2`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  try { return await res.json(); } catch { return await res.text(); }
}
