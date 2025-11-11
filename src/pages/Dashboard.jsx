"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from "recharts";
import { RefreshCw, AlertTriangle, FileWarning } from "lucide-react";

// Tip: If you're using shadcn/ui in your project, these imports will work out of the box.
// If not, you can replace Card components with simple <div> wrappers.
// Reemplazo: componentes simples para no depender de shadcn/ui ni alias @
const Card = ({ className = "", children }) => (
  <div className={`rounded-2xl border p-4 shadow-sm bg-white/5 dark:bg-zinc-900/40 ${className}`}>{children}</div>
);
const CardHeader = ({ children }) => <div className="mb-2">{children}</div>;
const CardTitle = ({ className = "", children }) => (
  <h3 className={`font-semibold ${className}`}>{children}</h3>
);
const CardContent = ({ children }) => <div>{children}</div>;

const Button = ({ className = "", children, ...props }) => (
  <button className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 border hover:shadow ${className}`} {...props}>
    {children}
  </button>
);

// =============================
// Config
// =============================
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8010";

const EP = {
  SUP_PROB_RIESGO: `${BASE_URL}/ml/supervisado/prob_riesgo`,
  ML_CLUSTERS: (k = 3) => `${BASE_URL}/ml/no_supervisado/clusters?k=${k}`,
  ML_ANOMALIAS: `${BASE_URL}/ml/no_supervisado/anomalias`,
  DOCS_CLUSTERS: (k = 3) => `${BASE_URL}/docs/no_supervisado/clusters?k=${k}`,
  DOCS_ANOMALIAS: (cont = 0.2, explain = true, kReasons = 3) =>
    `${BASE_URL}/docs/no_supervisado/anomalias?contaminacion=${cont}&explain=${String(
      explain
    )}&k_reasons=${kReasons}`,
  DOCS_NEAR_DUP: (threshold = 0.85, maxPairs = 50, wName = 0.7, wSize = 0.3) =>
    `${BASE_URL}/docs/near_duplicados?threshold=${threshold}&max_pairs=${maxPairs}&w_name=${wName}&w_size=${wSize}`,
  // Deep / Autoencoders:
  AE_PLAZOS: `${BASE_URL}/ml/deep/plazos/autoencoder?epochs=150&hidden=8&bottleneck=3&lr=0.01&top=10`,
  AE_DOCS: `${BASE_URL}/ml/deep/docs/autoencoder?epochs=150&hidden=8&bottleneck=2&lr=0.01&top=10`,
};

// =============================
// Helpers
// =============================
function useFetchJson(url, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const run = useCallback(async () => {
    if (!url) return;
    setLoading(true);
    setError(null);
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15000);
    try {
      const res = await fetch(url, { signal: ctrl.signal, headers: { "Content-Type": "application/json" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(e);
    } finally {
      clearTimeout(t);
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, error, loading, refetch: run };
}

const COLORS = [
  "#6366F1",
  "#22C55E",
  "#F59E0B",
  "#EF4444",
  "#14B8A6",
  "#8B5CF6",
  "#06B6D4",
  "#A3E635",
  "#FB7185",
];

// === Intérpretes legibles para clusters ===
function explainPlazoClusterCenter(ce = {}) {
  const parts = [];
  const d = Number(ce.days_to_due ?? 0);
  if (d <= 2) parts.push("próximos a vencer");
  else if (d < 10) parts.push("en curso");
  else parts.push("lejanos a vencer");

  const dc = Number(ce.docs_count_exp ?? 0);
  if (dc === 0) parts.push("sin documentos");
  else if (dc < 2) parts.push("1 documento");
  else parts.push("varios documentos");

  const r7 = Number(ce.recent_docs_7d ?? 0);
  parts.push(r7 >= 0.5 ? "actividad reciente" : "sin actividad reciente");

  const dl = Number(ce.desc_len ?? 0);
  if (dl >= 25) parts.push("descripciones largas");
  else if (dl <= 8) parts.push("descripciones cortas");

  return { label: parts.slice(0, 3).join(" · "), bullets: parts };
}

function explainDocClusterCenter(ce = {}) {
  const parts = [];
  const s = Number(ce.size_mb ?? 0);
  if (s < 0.3) parts.push("archivos pequeños");
  else if (s < 0.7) parts.push("archivos medianos");
  else parts.push("archivos grandes");

  const dsc = Number(ce.days_since_created ?? 0);
  parts.push(dsc <= 0 ? "recientes" : "antiguos");

  const nl = Number(ce.name_len ?? 0);
  if (nl < 20) parts.push("nombre corto");
  else if (nl < 35) parts.push("nombre medio");
  else parts.push("nombre largo");

  const pdf = Number(ce.is_pdf ?? 0);
  parts.push(pdf >= 0.5 ? "PDF" : "no PDF");

  return { label: parts.slice(0, 3).join(" · "), bullets: parts };
}

// =============================
// Main Dashboard
// =============================
export default function Dashboard() {
  // Endpoints
  const sup = useFetchJson(EP.SUP_PROB_RIESGO, [EP.SUP_PROB_RIESGO]);
  const mlClu = useFetchJson(EP.ML_CLUSTERS(3), [EP.ML_CLUSTERS(3)]);
  const mlAno = useFetchJson(EP.ML_ANOMALIAS, [EP.ML_ANOMALIAS]);
  const docClu = useFetchJson(EP.DOCS_CLUSTERS(3), [EP.DOCS_CLUSTERS(3)]);
  const docAno = useFetchJson(EP.DOCS_ANOMALIAS(0.2, true, 3), [EP.DOCS_ANOMALIAS(0.2, true, 3)]);
  const nearDup = useFetchJson(EP.DOCS_NEAR_DUP(0.85, 50, 0.7, 0.3), [EP.DOCS_NEAR_DUP(0.85, 50, 0.7, 0.3)]);
  // Deep / Autoencoders
  const aePlazos = useFetchJson(EP.AE_PLAZOS, [EP.AE_PLAZOS]);
  const aeDocs   = useFetchJson(EP.AE_DOCS,   [EP.AE_DOCS]);

  const onRefresh = () => {
    sup.refetch();
    mlClu.refetch();
    mlAno.refetch();
    docClu.refetch();
    docAno.refetch();
    nearDup.refetch();
    aePlazos.refetch();
    aeDocs.refetch();
  };

  // =============================
  // Derivations - Supervisado (plazos)
  // =============================
  const prioridadPie = useMemo(() => {
    const rows = sup.data?.data || [];
    const counts = rows.reduce(
      (acc, r) => {
        acc[r.prioridad_recomendada] = (acc[r.prioridad_recomendada] || 0) + 1;
        return acc;
      },
      { ALTA: 0, MEDIA: 0, BAJA: 0 }
    );
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [sup.data]);

  const topRiesgo = useMemo(() => {
    const rows = [...(sup.data?.data || [])];
    rows.sort((a, b) => b.riesgo_atraso - a.riesgo_atraso);
    return rows.slice(0, 5).map((r) => ({
      id_plazo: r.id_plazo,
      descripcion: r.descripcion,
      riesgo: Number(r.riesgo_atraso?.toFixed(4)),
      prioridad: r.prioridad_recomendada,
    }));
  }, [sup.data]);

  const overdueStats = useMemo(() => {
    const rows = sup.data?.data || [];
    const yes = rows.filter((r) => r.overdue_now).length;
    const no = rows.length - yes;
    return [
      { name: "Vencidos", value: yes },
      { name: "Al día", value: no },
    ];
  }, [sup.data]);

  // =============================
  // Derivations - No supervisado (plazos)
  // =============================
  const clusterSizes = useMemo(() => {
    const clusters = mlClu.data?.clusters || [];
    return clusters.map((c) => ({ cluster: String(c.cluster), size: c.size }));
  }, [mlClu.data]);

  const plazoClusterExplain = useMemo(() => {
    const clusters = mlClu.data?.clusters || [];
    const map = {};
    clusters.forEach((c) => {
      map[String(c.cluster)] = explainPlazoClusterCenter(c.center || {});
    });
    return map;
  }, [mlClu.data]);

  const anomalyBars = useMemo(() => {
    const top = mlAno.data?.top || [];
    return top.map((t) => ({
      id: t.id_plazo,
      descripcion: t.descripcion,
      score: Number((t.anomaly_score).toFixed(4)),
      es_anomalo: t.es_anomalo,
    }));
  }, [mlAno.data]);

  // =============================
  // Derivations - Docs clustering & anomalies
  // =============================
  const docClusterSizes = useMemo(() => {
    const clusters = docClu.data?.clusters || [];
    return clusters.map((c) => ({ cluster: String(c.cluster), size: c.size }));
  }, [docClu.data]);

  const docClusterExplain = useMemo(() => {
    const clusters = docClu.data?.clusters || [];
    const map = {};
    clusters.forEach((c) => {
      map[String(c.cluster)] = explainDocClusterCenter(c.center || {});
    });
    return map;
  }, [docClu.data]);

  const docsScatter = useMemo(() => {
    const assigns = docClu.data?.assignments || [];
    return assigns.map((a) => ({
      x: a.features?.name_len ?? 0,
      y: Number((a.features?.size_mb ?? 0).toFixed(3)),
      cluster: String(a.cluster),
      filename: a.filename,
    }));
  }, [docClu.data]);

  const docAnomalyBars = useMemo(() => {
    const top = docAno.data?.top || [];
    return top.map((t) => ({
      filename: t.filename,
      score: Number((t.anomaly_score).toFixed(4)),
      es_anomalo: t.es_anomalo,
      reasons: t.reasons || [],
    }));
  }, [docAno.data]);

  const nearPairs = useMemo(() => nearDup.data?.pairs || [], [nearDup.data]);

  // =============================
  // Deep / Autoencoders (derivations)
  // =============================
  const aePlazosBars = useMemo(() => {
    const top = aePlazos.data?.top || [];
    return top.map((t) => ({
      id: t.id_plazo,
      descripcion: t.descripcion,
      score: Number((t.deep_anomaly_score ?? 0).toFixed(4)),
    }));
  }, [aePlazos.data]);

  const aeDocsBars = useMemo(() => {
    const top = aeDocs.data?.top || [];
    return top.map((t) => ({
      filename: t.filename,
      score: Number((t.deep_anomaly_score ?? 0).toFixed(4)),
    }));
  }, [aeDocs.data]);

  // =============================
  // UI Helpers
  // =============================
  const LoadingOrError = ({ loading, error }) => (
    <div className="text-sm zinc-500">
      {loading && <span>Cargando…</span>}
      {!loading && error && (
        <span className="text-red-500">Error: {String(error?.message || error)}</span>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <p className="text-sm zinc-500">
            Bienvenido al panel de analítica de IA (supervisado, no supervisado y deep).
          </p>
          <p className="text-xs zinc-500">API: {BASE_URL}</p>
        </div>
        <Button size="sm" variant="default" onClick={onRefresh} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Actualizar
        </Button>
      </div>

      {/* Ayuda breve */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">¿Qué estoy viendo? (Glosario rápido)</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm" style={{lineHeight: 1.5}}>
            <li><b>Riesgo de atraso:</b> probabilidad (0–1) de que un plazo se retrase, estimada por un modelo supervisado.</li>
            <li><b>Prioridad recomendada:</b> sugerencia de urgencia (ALTA/MEDIA/BAJA) en base al riesgo y contexto.</li>
            <li><b>Cluster:</b> grupo de elementos con características parecidas detectado automáticamente (no es una prioridad por sí misma).</li>
            <li><b>Centro del cluster:</b> el promedio de sus características; lo usamos para describirlo (p. ej., “próximos a vencer + actividad reciente”).</li>
            <li><b>Anomalía:</b> elemento poco frecuente respecto al resto. <i>anomaly_score</i> cercano a 1 ⇒ más raro (no siempre malo, solo inusual).</li>
            <li><b>Anomalía (Deep):</b> el sistema aprende el “patrón normal” y marca lo que no encaja. Score alto ⇒ más inusual (revisar primero).</li>
          </ul>
        </CardContent>
      </Card>

      {/* Row 1: Supervisado */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Prioridad recomendada (plazos)</CardTitle>
            <div className="text-xs zinc-500">ALTA/MEDIA/BAJA sugerida según la probabilidad estimada de atraso.</div>
          </CardHeader>
          <CardContent>
            <LoadingOrError loading={sup.loading} error={sup.error} />
            <div style={{height: 224}}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={prioridadPie} dataKey="value" nameKey="name" outerRadius={80} label>
                    {prioridadPie.map((_, idx) => (
                      <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Top 5 riesgo de atraso</CardTitle>
            <div className="text-xs zinc-500">Riesgo ∈ [0,1]. Más alto ⇒ más probable que se retrase.</div>
          </CardHeader>
          <CardContent>
            <LoadingOrError loading={sup.loading} error={sup.error} />
            <div style={{height: 224}}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topRiesgo} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="id_plazo" label={{ value: "id_plazo", position: "insideBottom", dy: 10 }} />
                  <YAxis domain={[0, 1]} />
                  <Tooltip formatter={(v) => [`${(Number(v)*100).toFixed(1)}%`, 'Riesgo']} />
                  <Legend />
                  <Bar dataKey="riesgo" name="riesgo_atraso">
                    {topRiesgo.map((_, idx) => (
                      <Cell key={`br-${idx}`} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-xs zinc-500">
              {topRiesgo.map((r) => (
                <div key={r.id_plazo} className="flex items-center justify-between">
                  <span>#{r.id_plazo} • {r.descripcion}</span>
                  <span className={
                    r.prioridad === "ALTA" ? "text-red-500" : r.prioridad === "MEDIA" ? "text-amber-500" : "text-emerald-600"
                  }>{r.prioridad}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Estado actual (vencidos vs al día)</CardTitle>
            <div className="text-xs zinc-500">Según <code>overdue_now</code>: plazos vencidos vs al día.</div>
          </CardHeader>
          <CardContent>
            <LoadingOrError loading={sup.loading} error={sup.error} />
            <div style={{height: 224}}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={overdueStats} dataKey="value" nameKey="name" innerRadius={40} outerRadius={80} label>
                    {overdueStats.map((_, idx) => (
                      <Cell key={`od-${idx}`} fill={COLORS[(idx + 4) % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: No supervisado (plazos) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Clusters de plazos (k=3)</CardTitle>
            <div className="text-xs zinc-500">Un <b>cluster</b> es un grupo de plazos con rasgos parecidos (p. ej., días para vencer, documentos, actividad). La barra = cuántos hay en cada grupo.</div>
          </CardHeader>
          <CardContent>
            <LoadingOrError loading={mlClu.loading} error={mlClu.error} />
            <div style={{height: 256}}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={clusterSizes} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="cluster" />
                  <YAxis allowDecimals={false} />
                  <Tooltip content={({active, payload}) => {
                    if (!active || !payload?.length) return null;
                    const cl = String(payload[0]?.payload?.cluster ?? "?");
                    const info = plazoClusterExplain[cl];
                    return (
                      <div className="rounded-md border white p-2 text-xs shadow">
                        <div className="font-medium">Cluster C{cl}</div>
                        <div>{info?.label || "sin resumen"}</div>
                        {info?.bullets?.length ? (
                          <ul className="list-disc pl-4 mt-1">
                            {info.bullets.slice(0,4).map((b,i)=>(<li key={i}>{b}</li>))}
                          </ul>
                        ) : null}
                      </div>
                    );
                  }} />
                  <Legend />
                  <Bar dataKey="size" name="tareas por cluster">
                    {clusterSizes.map((_, idx) => (
                      <Cell key={`c-${idx}`} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Anomalías en plazos (Isolation Forest)</CardTitle>
            <div className="text-xs zinc-500"><b>Anomalía</b> = caso inusual respecto al resto. Rojo = detectado como anómalo.</div>
          </CardHeader>
          <CardContent>
            <LoadingOrError loading={mlAno.loading} error={mlAno.error} />
            <div style={{height: 256}}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={anomalyBars} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="id" />
                  <YAxis domain={[0, 1]} />
                  <Tooltip formatter={(v) => [Number(v).toFixed(3), 'anomaly_score (0–1)']} />
                  <Legend />
                  <Bar dataKey="score" name="anomaly_score">
                    {anomalyBars.map((d, idx) => (
                      <Cell key={`a-${idx}`} fill={d.es_anomalo ? "#EF4444" : "#22C55E"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 space-y-1">
              {anomalyBars.slice(0, 5).map((a) => (
                <div key={a.id} className="flex items-center gap-2 text-sm">
                  {a.es_anomalo ? (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  ) : (
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                  )}
                  <span className="truncate">#{a.id} – {a.descripcion}</span>
                  <span className="ml-auto text-xs zinc-500">{a.score.toFixed(4)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Explicación de clusters calculada automáticamente */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Explicación de clusters (automática)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="font-medium mb-1">Plazos</div>
              <div className="text-sm">
                {(mlClu.data?.clusters || []).map((c) => (
                  <div key={`plz-c-${c.cluster}`} className="mb-1">
                    <b>C{String(c.cluster)}:</b> {plazoClusterExplain[String(c.cluster)]?.label || "sin resumen"}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="font-medium mb-1">Documentos</div>
              <div className="text-sm">
                {(docClu.data?.clusters || []).map((c) => (
                  <div key={`doc-c-${c.cluster}`} className="mb-1">
                    <b>C{String(c.cluster)}:</b> {docClusterExplain[String(c.cluster)]?.label || "sin resumen"}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="text-xs zinc-500 mt-2">Nota: las etiquetas se infieren del centro de cada cluster (promedios) y son una guía rápida.</div>
        </CardContent>
      </Card>

      {/* Row Deep: Autoencoders (plazos y documentos) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Anomalías (Deep) en plazos</CardTitle>
            <div className="text-xs zinc-500">
              El autoencoder aprende el patrón “normal” y asigna <b>deep_anomaly_score</b> (0–1).
              Más alto ⇒ más inusual (revisar primero).
            </div>
          </CardHeader>
          <CardContent>
            <LoadingOrError loading={aePlazos.loading} error={aePlazos.error} />
            <div style={{height: 256}}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={aePlazosBars} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="id" />
                  <YAxis domain={[0, 1]} />
                  <Tooltip formatter={(v) => [Number(v).toFixed(4), 'deep_anomaly_score (0–1)']} />
                  <Legend />
                  <Bar dataKey="score" name="deep_anomaly_score">
                    {aePlazosBars.map((d, i) => {
                      const c = d.score >= 0.7 ? "#EF4444" : d.score >= 0.4 ? "#F59E0B" : "#22C55E";
                      return <Cell key={i} fill={c} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Anomalías (Deep) en documentos</CardTitle>
            <div className="text-xs zinc-500">
              Analiza (days_since_created, name_len). Score alto ⇒ documento distinto al patrón habitual.
            </div>
          </CardHeader>
          <CardContent>
            <LoadingOrError loading={aeDocs.loading} error={aeDocs.error} />
            <div style={{height: 256}}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={aeDocsBars} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="filename" tick={false} height={40} />
                  <YAxis domain={[0, 1]} />
                  <Tooltip formatter={(v) => [Number(v).toFixed(4), 'deep_anomaly_score (0–1)']} />
                  <Legend />
                  <Bar dataKey="score" name="deep_anomaly_score">
                    {aeDocsBars.map((d, i) => {
                      const c = d.score >= 0.7 ? "#EF4444" : d.score >= 0.4 ? "#F59E0B" : "#22C55E";
                      return <Cell key={i} fill={c} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Docs clustering & anomalies */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Clusters de documentos (k=3)</CardTitle>
            <div className="text-xs zinc-500">Se agrupan por tamaño (MB), antigüedad, largo del nombre y tipo (PDF).</div>
          </CardHeader>
          <CardContent>
            <LoadingOrError loading={docClu.loading} error={docClu.error} />
            <div style={{height: 224}}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={docClusterSizes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="cluster" />
                  <YAxis allowDecimals={false} />
                  <Tooltip content={({active, payload}) => {
                    if (!active || !payload?.length) return null;
                    const cl = String(payload[0]?.payload?.cluster ?? "?");
                    const info = docClusterExplain[cl];
                    return (
                      <div className="rounded-md border white p-2 text-xs shadow">
                        <div className="font-medium">Cluster C{cl}</div>
                        <div>{info?.label || "sin resumen"}</div>
                        {info?.bullets?.length ? (
                          <ul className="list-disc pl-4 mt-1">
                            {info.bullets.slice(0,4).map((b,i)=>(<li key={i}>{b}</li>))}
                          </ul>
                        ) : null}
                      </div>
                    );
                  }} />
                  <Legend />
                  <Bar dataKey="size" name="docs por cluster">
                    {docClusterSizes.map((_, idx) => (
                      <Cell key={`dc-${idx}`} fill={COLORS[(idx + 2) % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Docs: tamaño vs longitud de nombre</CardTitle>
            <div className="text-xs zinc-500">Cada punto es un documento: X = largo del nombre, Y = tamaño (MB).</div>
          </CardHeader>
          <CardContent>
            <LoadingOrError loading={docClu.loading} error={docClu.error} />
            <div style={{height: 224}}>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                  <CartesianGrid />
                  <XAxis type="number" dataKey="x" name="name_len" />
                  <YAxis type="number" dataKey="y" name="size_mb" />
                  <Tooltip content={({active, payload}) => {
                    if (!active || !payload?.length) return null;
                    const p = payload[0]?.payload || {};
                    const info = docClusterExplain[String(p.cluster)] || {};
                    return (
                      <div className="rounded-md border white p-2 text-xs shadow">
                        <div className="font-medium mb-1 truncate max-w-[220px]">{p.filename}</div>
                        <div>Cluster: C{String(p.cluster)} — {info.label || "sin resumen"}</div>
                        <div className="mt-1"><span className="font-mono">name_len</span>: {p.x} · <span className="font-mono">size_mb</span>: {p.y}</div>
                      </div>
                    );
                  }} />
                  <Legend />
                  <Scatter name="docs" data={docsScatter} fill="#6366F1" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-xs zinc-500">Cada punto es un documento (x=name_len, y=size_mb).</div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Anomalías en documentos</CardTitle>
            <div className="text-xs zinc-500">Score ∈ [0,1]. Rojo = documento inusual. El tooltip muestra 3 razones principales.</div>
          </CardHeader>
          <CardContent>
            <LoadingOrError loading={docAno.loading} error={docAno.error} />
            <div style={{height: 224}}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={docAnomalyBars}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="filename" tick={false} height={40} />
                  <YAxis domain={[0, 1]} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const p = payload[0].payload;
                      return (
                        <div className="rounded-md border white p-2 text-xs shadow">
                          <div className="font-medium mb-1 truncate max-w-[220px]">{p.filename}</div>
                          <div>score: {p.score}</div>
                          {Array.isArray(p.reasons) && p.reasons.length > 0 && (
                            <div className="mt-1">
                              <div className="font-medium">reasons:</div>
                              <ul className="list-disc pl-4">
                                {p.reasons.slice(0, 3).map((r, i) => (
                                  <li key={i}>
                                    <span className="font-mono">{r.feature}</span>: {Number(r.value).toFixed(3)} (z={Number(r.zscore).toFixed(2)})
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      );
                    }}
                  />
                  <Legend />
                  <Bar dataKey="score" name="anomaly_score">
                    {docAnomalyBars.map((d, idx) => (
                      <Cell key={`da-${idx}`} fill={d.es_anomalo ? "#EF4444" : "#22C55E"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 4: Near-duplicates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Near-duplicados de documentos</CardTitle>
          <div className="text-xs zinc-500">Pares potencialmente similares según nombre y tamaño. Si no aparecen, baja el <i>threshold</i>.</div>
        </CardHeader>
        <CardContent>
          <LoadingOrError loading={nearDup.loading} error={nearDup.error} />
          {nearPairs.length === 0 ? (
            <div className="flex items-center gap-2 text-sm zinc-500">
              <FileWarning className="h-4 w-4" /> No se encontraron pares candidatos con el threshold actual.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left zinc-500 border-b">
                    <th className="py-2 pr-2">Doc A</th>
                    <th className="py-2 pr-2">Doc B</th>
                    <th className="py-2 pr-2">score</th>
                  </tr>
                </thead>
                <tbody>
                  {nearPairs.map((p, idx) => (
                    <tr key={idx} className="border-b last:border-0">
                      <td className="py-2 pr-2">{p.a?.filename || p.a?.doc_id}</td>
                      <td className="py-2 pr-2">{p.b?.filename || p.b?.doc_id}</td>
                      <td className="py-2 pr-2">{Number(p.score ?? 0).toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footer small note */}
      <div className="text-xs zinc-500">
        Consejos: ajusta NEXT_PUBLIC_API_BASE_URL en tu .env.local si despliegas el backend en otra URL. Los gráficos usan Recharts.
      </div>
    </div>
  );
}
