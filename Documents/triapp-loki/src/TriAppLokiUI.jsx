import React, { useMemo, useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Textarea } from "./components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./components/ui/tabs";
import { Label } from "./components/ui/label";
import { Switch } from "./components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./components/ui/select";
import { Separator } from "./components/ui/separator";
import { Badge } from "./components/ui/badge";
import { Upload, Wand2, Globe, Play, Trash2, Loader2, Settings, Image as ImageIcon, File as FileIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";

// Use the Vite proxy path in dev so you don't hit CORS.
// In vite.config.js we proxy /triapp-api -> http://<PI-IP>:5680


const EXTRA_HEADERS = {
  // "x-api-key": "YOUR_KEY",
};

async function fileToBase64(file) {
  const arrayBuf = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  const base64 = btoa(binary);
  return { base64, mime: file.type || "application/octet-stream" };
}

const uid = () => Math.random().toString(36).slice(2, 10);

export default function TriAppLokiUI() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [outputs, setOutputs] = useState(null);
  const [error, setError] = useState(null);
  const [enableImages, setEnableImages] = useState(false);
  const [temperature, setTemperature] = useState("0.8");
  const [maxTokens, setMaxTokens] = useState("1200");
  const [persona, setPersona] = useState("default");
  const [files, setFiles] = useState([]);
  const [busyAgent, setBusyAgent] = useState(null);
  const fileInputRef = useRef(null);

  // === START: n8n webhook + optional Basic Auth ============================
  // Dev default hits Vite proxy (/triapp-api) so you don’t fight CORS locally.
  // Prod fallback points at your Railway URL and route name tri-app2.
  const N8N_WEBHOOK_URL =
    (import.meta.env.VITE_N8N_WEBHOOK_URL || "/triapp-api/webhook/tri-app2").trim() ||
    "https://primary-production-fe14.up.railway.app/webhook/tri-app2";

  const N8N_USER = (import.meta.env.VITE_N8N_USER || "").trim();
  const N8N_PASS = (import.meta.env.VITE_N8N_PASS || "").trim();

  const N8N_AUTH_HEADER =
    N8N_USER && N8N_PASS ? { Authorization: `Basic ${btoa(`${N8N_USER}:${N8N_PASS}`)}` } : {};
  // === END: n8n webhook + optional Basic Auth ==============================

  // Optional extra headers if you later add an API key/header
  const EXTRA_HEADERS = {
    // "x-api-key": "YOUR_KEY",
  };

  // Force dark so inputs aren’t white-on-white
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  const canAsk = useMemo(() => question.trim().length > 0 || files.length > 0, [question, files]);

  async function sendToTriApp() {
    setLoading(true);
    setOutputs(null);
    setError(null);

    try {
      const encodedFiles = await Promise.all(
        files.map(async (f) => {
          const { base64, mime } = await fileToBase64(f);
          return { id: uid(), name: f.name, mime, size: f.size, data_base64: base64 };
        })
      );

      const payload = {
        question: question.trim(),
        options: {
          temperature: Number(temperature),
          max_tokens: Number(maxTokens),
          persona,
          enable_images: enableImages,
        },
        files: encodedFiles,
        client_meta: { app: "Tri-App Loki UI", ts: new Date().toISOString() },
      };

      const res = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...N8N_AUTH_HEADER,  // <-- make sure Basic Auth is actually sent
          ...EXTRA_HEADERS,
        },
        body: JSON.stringify(payload),
      });

      // If your n8n Respond node returns plain text, switch to:
      // const text = await res.text(); setOutputs({ combined: text });

      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}${msg ? ` – ${msg}` : ""}`);
      }

      const data = await res.json(); // expecting JSON (combined/agents/images…)
      setOutputs(data);

      setHistory((h) => [
        {
          id: uid(),
          q: question,
          files: encodedFiles.map((f) => f.name),
          at: new Date().toLocaleString(),
          data,
        },
        ...h,
      ]);

      setQuestion("");
      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setError(err?.message || "Something went wrong.");
    } finally {
      setLoading(false);
      setBusyAgent(null);
    }
  }

  function onPickFiles(e) {
    const f = e.target.files ? Array.from(e.target.files) : [];
    if (f.length) setFiles((prev) => [...prev, ...f]);
  }

  function removeFile(name) {
    setFiles((prev) => prev.filter((f) => f.name !== name));
  }

  // …keep your JSX below as-is…

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black text-slate-100">
      <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-slate-900/60 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <motion.div initial={{ scale: 0.9, rotate: -8 }} animate={{ scale: 1, rotate: 0 }} className="w-9 h-9 rounded-2xl grid place-items-center bg-emerald-400/10 border border-emerald-400/40">
            <Wand2 className="w-5 h-5 text-emerald-300" />
          </motion.div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Tri-App • <span className="text-emerald-300">Loki Edition</span></h1>
            <p className="text-xs text-slate-400">Chat orchestration • Docs & images • Presentation-ready output</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="secondary" className="rounded-2xl" onClick={() => window.location.reload()}>
              <Globe className="w-4 h-4 mr-1" /> Refresh
            </Button>
            <Button variant="default" className="rounded-2xl" onClick={sendToTriApp} disabled={!canAsk || loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}Run
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 grid md:grid-cols-2 gap-6">
        {/* LEFT: Compose */}
        <section>
          <Card className="bg-slate-900/60 border-white/10">
            <CardHeader>
              <CardTitle>Compose</CardTitle>
              <CardDescription>Ask a question, attach docs/images, tweak settings, then run.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="q">Question / Task</Label>
                <Textarea
                      id="q"
                  placeholder="Ask a question, attach docs/images, tweak settings, then run."
                  className="bg-slate-900 text-white placeholder:text-slate-400 focus-visible:ring-sky-500"
                   value={question}
                  onChange={(e) => setQuestion(e.target.value)}
               />

              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Persona</Label>
                  <Select value={persona} onValueChange={setPersona}>
                    <SelectTrigger className="bg-slate-800/60 border-white/10">
                      <SelectValue placeholder="Choose persona" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="telecom-analyst">Telecom Analyst</SelectItem>
                      <SelectItem value="security-ops">Security Ops</SelectItem>
                      <SelectItem value="product-manager">Product Manager</SelectItem>
                      <SelectItem value="law-brief">Law-Style Brief</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Creativity (temperature)</Label>
                  <Input type="number" min="0" max="1" step="0.1" value={temperature} onChange={(e) => setTemperature(e.target.value)} className="bg-slate-800/60 border-white/10" />
                </div>
                <div className="space-y-2">
                  <Label>Max tokens</Label>
                  <Input type="number" min="64" max="4096" step="64" value={maxTokens} onChange={(e) => setMaxTokens(e.target.value)} className="bg-slate-800/60 border-white/10" />
                </div>
                <div className="space-y-2 flex items-center justify-between rounded-xl px-3 border border-white/10">
                  <div className="py-3">
                    <Label htmlFor="enableImages">Enable image generation</Label>
                    <p className="text-xs text-slate-400">If your tri-flow can return images</p>
                  </div>
                  <Switch id="enableImages" checked={enableImages} onCheckedChange={setEnableImages} />
                </div>
              </div>

              <Separator className="my-2 bg-white/10" />

              <div className="space-y-3">
                <Label>Attachments</Label>
                <div className="flex items-center gap-2">
                  <Input ref={fileInputRef} type="file" multiple onChange={onPickFiles} className="bg-slate-800/60 border-white/10" />
                  <Button variant="secondary" className="rounded-2xl" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="w-4 h-4 mr-1" /> Add files
                  </Button>
                </div>
                {files.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {files.map((f) => (
                      <Badge key={f.name} variant="secondary" className="gap-2">
                        <FileIcon className="w-3 h-3" /> {f.name}
                        <button onClick={() => removeFile(f.name)} className="ml-1 opacity-70 hover:opacity-100">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="mt-6">
            <Card className="bg-slate-900/60 border-white/10">
              <CardHeader>
                <CardTitle>History</CardTitle>
                <CardDescription>Recent prompts & runs (local only)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {history.length === 0 && <p className="text-slate-400 text-sm">No runs yet.</p>}
                {history.map((h) => (
                  <div key={h.id} className="p-3 rounded-xl bg-slate-800/50 border border-white/10">
                    <div className="text-xs text-slate-400">{h.at}</div>
                    <div className="text-sm mt-1">{h.q || <em>(no question, files only)</em>}</div>
                    {h.files?.length ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {h.files.map((n) => (
                          <Badge key={n} variant="outline" className="text-xs">{n}</Badge>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* RIGHT: Output */}
        <section>
          <Card className="bg-slate-900/60 border-white/10">
            <CardHeader>
              <CardTitle>Results</CardTitle>
              <CardDescription>Combined answer, agent breakdown, and media</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="combined" className="w-full">
                <TabsList className="grid grid-cols-4 bg-slate-800/60 border border-white/10">
                  <TabsTrigger value="combined">Combined</TabsTrigger>
                  <TabsTrigger value="agents">Agents</TabsTrigger>
                  <TabsTrigger value="media">Media</TabsTrigger>
                  <TabsTrigger value="raw">Raw</TabsTrigger>
                </TabsList>

                <TabsContent value="combined" className="mt-4">
                  {!outputs && !error && (
                    <p className="text-slate-400 text-sm">Run a query to see results.</p>
                  )}
                  {error && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-400/30 text-sm text-red-200">{error}</div>
                  )}
                  {outputs?.combined && (
                    <article className="prose prose-invert max-w-none">
                      <ReactMarkdown>{outputs.combined}</ReactMarkdown>
                    </article>
                  )}
                </TabsContent>

                <TabsContent value="agents" className="mt-4 space-y-4">
                  {!outputs?.agents && <p className="text-slate-400 text-sm">No agent breakdown returned.</p>}
                  {outputs?.agents && Object.entries(outputs.agents).map(([name, text]) => (
                    <div key={name} className="rounded-xl p-3 bg-slate-800/50 border border-white/10">
                      <div className="text-xs uppercase tracking-wider text-slate-400 mb-2">{name}</div>
                      <article className="prose prose-invert max-w-none">
                        <ReactMarkdown>{String(text || "")}</ReactMarkdown>
                      </article>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="media" className="mt-4 space-y-4">
                  {Array.isArray(outputs?.images) && outputs.images.length > 0 ? (
                    <div className="grid sm:grid-cols-2 gap-4">
                      {outputs.images.map((img, i) => (
                        <figure key={i} className="overflow-hidden rounded-2xl border border-white/10">
                          {img?.url ? (
                            <img src={img.url} alt={img.caption || `image-${i}`} className="w-full h-auto" />
                          ) : img?.base64 ? (
                            <img src={`data:${img?.mime || "image/png"};base64,${img.base64}`} alt={img.caption || `image-${i}`} className="w-full h-auto" />
                          ) : (
                            <div className="p-6 text-center text-slate-400">No image data</div>
                          )}
                          {img?.caption && <figcaption className="p-2 text-xs text-slate-400">{img.caption}</figcaption>}
                        </figure>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 text-sm">No media returned.</p>
                  )}
                </TabsContent>

                <TabsContent value="raw" className="mt-4">
                  <pre className="text-xs bg-slate-950/60 p-3 rounded-xl border border-white/10 overflow-auto max-h-[420px]">{JSON.stringify(outputs, null, 2)}</pre>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="mt-6 grid sm:grid-cols-2 gap-4">
            <Card className="bg-slate-900/60 border-white/10">
              <CardHeader>
                <CardTitle className="text-sm">Endpoint</CardTitle>
                <CardDescription>Where this UI sends your payload</CardDescription>
              </CardHeader>
              <CardContent>
                <code className="text-xs break-all">{N8N_WEBHOOK_URL}</code>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/60 border-white/10">
              <CardHeader>
                <CardTitle className="text-sm">Payload schema</CardTitle>
                <CardDescription>Exactly what we POST</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="text-xs whitespace-pre-wrap">{`{
  question: string,
  options: { temperature: number, max_tokens: number, persona: string, enable_images: boolean },
  files: [ { id, name, mime, size, data_base64 } ],
  client_meta: { app, ts }
}`}</pre>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <footer className="max-w-6xl mx-auto px-4 pb-10 pt-4 text-xs text-slate-500 flex items-center justify-between">
        <div>© {new Date().getFullYear()} Tri-App • Loki UI</div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1"><ImageIcon className="w-3 h-3" /> images</span>
          <span className="inline-flex items-center gap-1"><FileIcon className="w-3 h-3" /> docs</span>
          <span className="inline-flex items-center gap-1"><Settings className="w-3 h-3" /> options</span>
        </div>
      </footer>
    </div>
  );
}