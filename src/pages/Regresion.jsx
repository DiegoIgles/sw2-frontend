"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  Cell,
  ReferenceLine,
} from "recharts";
import { RefreshCw } from "lucide-react";

// === UI básicos (sin shadcn, sin alias) ===
const Card = ({ className = "", children }) => (
  <div
    className={`rounded-2xl border shadow-sm ${className}`}
    style={{ padding: 16, background: "rgba(255,255,255,0.05)" }}
  >
    {children}
  </div>
);
const CardHeader = ({ children }) => <div style={{ marginBottom: 8 }}>{children}</div>;
const CardTitle = ({ children }) => <h3 style={{ fontWeight: 600, fontSize: 14 }}>{children}</h3>;
const CardSub = ({ children }) => (
  <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>{children}</div>
);
const CardContent = ({ children }) => <div>{children}</div>;
const Row = ({ children, cols = 2, gap = 16 }) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
      gap,
    }}
  >
    {children}
  </div>
);
const Button = ({ children, ...props }) => (
  <button
    {...props}
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      border: "1px solid #e5e7eb",
      borderRadius: 12,
      padding: "8px 12px",
      background: "transparent",
      cursor: "pointer",
    }}
  >
    {children}
  </button>
);
const Select = ({ value, onChange, options }) => (
  <select
    value={value}
    onChange={onChange}
    style={{
      border: "1px solid #e5e7eb",
      borderRadius: 12,
      padding: "8px 12px",
      background: "transparent",
      cursor: "pointer",
    }}
  >
    {options.map((o) => (
      <option key={o.value} value={o.value}>
        {o.label}
      </option>
    ))}
  </select>
);

function smallStat(label, value, hint) {
  return (
    <div style={{ padding: 12, border: "1px solid #e5e7eb", borderRadius: 12 }}>
      <div style={{ fontSize: 12, opacity: 0.7 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700 }}>{value}</div>
      {hint ? (
        <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>{hint}</div>
      ) : null}
    </div>
  );
}

// =============================
// Config
// =============================
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8010";
const EP = {
  PLAZOS_REG: (k = 5) => `${BASE_URL}/ml/regresion/plazos/dias_restantes?kfold=${k}`,
  DOCS_REG: (k = 5) => `${BASE_URL}/docs/regresion/size_mb?kfold=${k}`,
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

function quantile(arr, q) {
  if (!arr?.length) return 0;
  const a = [...arr].sort((x, y) => x - y);
  const pos = (a.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (a[base + 1] !== undefined) {
    return a[base] + rest * (a[base + 1] - a[base]);
  } else {
    return a[base];
  }
}

function r2BadgeText(r2) {
  if (typeof r2 !== "number") return "R²: —";
  if (r2 >= 0.7) return `R²: ${r2.toFixed(3)} · bueno`;
  if (r2 >= 0.3) return `R²: ${r2.toFixed(3)} · aceptable`;
  if (r2 >= 0) return `R²: ${r2.toFixed(3)} · bajo`;
  return `R²: ${r2.toFixed(3)} · peor que promedio`;
}

// =============================
// Vista principal
// =============================
export default function RegresionLineal() {
  // Controles
  const [kfold, setKfold] = useState(5);
  const [coefSortAbs, setCoefSortAbs] = useState(true); // ordenar por |coef| vs coef descendente

  const plazos = useFetchJson(EP.PLAZOS_REG(kfold), [EP.PLAZOS_REG(kfold)]);
  const docs = useFetchJson(EP.DOCS_REG(kfold), [EP.DOCS_REG(kfold)]);

  const onRefresh = () => {
    plazos.refetch();
    docs.refetch();
  };

  // ====== Derivaciones: Plazos (y = días restantes) ======
  const plazoCoefsBase = useMemo(() => {
    const c = plazos.data?.coefficients_std_space || {};
    return Object.entries(c).map(([name, coef]) => ({ name, coef: Number(coef) }));
  }, [plazos.data]);

  const plazoCoefs = useMemo(() => {
    const items = [...plazoCoefsBase];
    items.sort((a, b) =>
      coefSortAbs ? Math.abs(b.coef) - Math.abs(a.coef) : b.coef - a.coef
    );
    return items;
  }, [plazoCoefsBase, coefSortAbs]);

  const plazoResiduals = useMemo(() => {
    const preds = plazos.data?.predictions || [];
    return preds
      .map((p) => ({
        id: p.id_plazo,
        desc: p.descripcion,
        residual: Number(p.residual), // y_true - y_pred
        absResidual: Math.abs(Number(p.residual)),
        y_true: Number(p.y_true),
        y_pred: Number(p.y_pred),
      }))
      .sort((a, b) => b.absResidual - a.absResidual);
  }, [plazos.data]);

  const plazoResThresh = useMemo(() => {
    const arr = plazoResiduals.map((x) => x.absResidual);
    return quantile(arr, 0.75); // umbral "alto" = P75
  }, [plazoResiduals]);

  const plazoScatter = useMemo(() => {
    const preds = plazos.data?.predictions || [];
    return preds.map((p) => ({
      x: Number(p.y_true),
      y: Number(p.y_pred),
      id: p.id_plazo,
      desc: p.descripcion,
    }));
  }, [plazos.data]);

  const plazoScatterRange = useMemo(() => {
    if (!plazoScatter.length) return { min: 0, max: 1 };
    const xs = plazoScatter.map((p) => p.x);
    const ys = plazoScatter.map((p) => p.y);
    const min = Math.min(...xs, ...ys);
    const max = Math.max(...xs, ...ys);
    return { min, max };
  }, [plazoScatter]);

  const r2FoldsPlz = useMemo(() => {
    const folds = (plazos.data?.cv?.r2_folds || []).filter((v) => typeof v === "number");
    return folds.map((v) => Number(v).toFixed(3)).join(" · ");
  }, [plazos.data]);

  // ====== Derivaciones: Docs (y = size_mb) ======
  const docCoefsBase = useMemo(() => {
    const c = docs.data?.coefficients_std_space || {};
    return Object.entries(c).map(([name, coef]) => ({ name, coef: Number(coef) }));
  }, [docs.data]);

  const docCoefs = useMemo(() => {
    const items = [...docCoefsBase];
    items.sort((a, b) =>
      coefSortAbs ? Math.abs(b.coef) - Math.abs(a.coef) : b.coef - a.coef
    );
    return items;
  }, [docCoefsBase, coefSortAbs]);

  const docResiduals = useMemo(() => {
    const preds = docs.data?.predictions || [];
    return preds
      .map((p) => ({
        id: p.doc_id,
        filename: p.filename,
        residual: Number(p.residual), // y_true - y_pred
        absResidual: Math.abs(Number(p.residual)),
        y_true: Number(p.y_true),
        y_pred: Number(p.y_pred),
      }))
      .sort((a, b) => b.absResidual - a.absResidual);
  }, [docs.data]);

  const docResThresh = useMemo(() => {
    const arr = docResiduals.map((x) => x.absResidual);
    return quantile(arr, 0.75);
  }, [docResiduals]);

  const docScatter = useMemo(() => {
    const preds = docs.data?.predictions || [];
    return preds.map((p) => ({
      x: Number(p.y_true),
      y: Number(p.y_pred),
      filename: p.filename,
    }));
  }, [docs.data]);

  const docScatterRange = useMemo(() => {
    if (!docScatter.length) return { min: 0, max: 1 };
    const xs = docScatter.map((p) => p.x);
    const ys = docScatter.map((p) => p.y);
    const min = Math.min(...xs, ...ys);
    const max = Math.max(...xs, ...ys);
    return { min, max };
  }, [docScatter]);

  // =============================
  // Render
  // =============================
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 600 }}>Regresión lineal</h1>
          <div style={{ fontSize: 12, opacity: 0.75 }}>
            Predicción para plazos (días restantes) y documentos (tamaño MB) con métricas de calidad.
          </div>
          <div style={{ fontSize: 11, opacity: 0.6 }}>API: {BASE_URL}</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label style={{ fontSize: 12, opacity: 0.75 }}>k-fold:</label>
          <Select
            value={String(kfold)}
            onChange={(e) => setKfold(Number(e.target.value))}
            options={[
              { value: 3, label: "3" },
              { value: 5, label: "5" },
              { value: 10, label: "10" },
            ]}
          />
          <Button onClick={onRefresh}>
            <RefreshCw style={{ width: 16, height: 16 }} /> Actualizar
          </Button>
        </div>
      </div>

      {/* === Bloque: Plazos === */}
      <Card>
        <CardHeader>
          <CardTitle>Plazos → Días restantes (Regresión)</CardTitle>
          <CardSub>
            <b>Cómo leerlo:</b> <b>R²</b> indica qué tan bien explica el modelo (1=perfecto; 0=igual a promedio; negativo=peor que el promedio).
            <b> MAE</b> ≈ error promedio en días.
          </CardSub>
        </CardHeader>
        <CardContent>
          <Row cols={3}>
            {smallStat(
              "Modelo",
              plazos.data?.model || "—",
              "Incluye imputación + escalado (sin leakage)"
            )}
            {smallStat(
              "CV (k-fold)",
              `k=${plazos.data?.cv?.splits ?? "—"}`,
              r2FoldsPlz ? `R² por fold: ${r2FoldsPlz}` : ""
            )}
            {smallStat(
              "Calidad media",
              typeof plazos.data?.cv?.r2_mean === "number"
                ? r2BadgeText(plazos.data.cv.r2_mean)
                : "R²: —",
              typeof plazos.data?.cv?.mae_mean === "number" ? `MAE: ${plazos.data.cv.mae_mean.toFixed(2)} días` : ""
            )}
          </Row>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
            <Button onClick={() => setCoefSortAbs((v) => !v)}>
              {coefSortAbs ? "Ordenar por signo (desc)" : "Ordenar por |coef|"}
            </Button>
          </div>

          <Row cols={2}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, margin: "12px 0 6px" }}>
                Importancia de variables (coef. estandarizados)
              </div>
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={plazoCoefs} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(v) => [Number(v).toFixed(3), "coef"]} />
                    <Legend />
                    <Bar dataKey="coef" name="coef">
                      {plazoCoefs.map((d, i) => (
                        <Cell key={i} fill={d.coef >= 0 ? "#22C55E" : "#EF4444"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>
                * En escala estandarizada: ↑1 desviación en la variable cambia la predicción en <i>coef</i> desviaciones.
                Verde: aumenta días; rojo: disminuye.
              </div>
            </div>

            <div>
              <div style={{ fontSize: 13, fontWeight: 600, margin: "12px 0 6px" }}>
                Predicción vs real (con línea ideal)
              </div>
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                    <CartesianGrid />
                    <XAxis type="number" dataKey="x" name="y_true" />
                    <YAxis type="number" dataKey="y" name="y_pred" />
                    <Tooltip formatter={(v, n) => [Number(v).toFixed(3), n]} />
                    <Legend />
                    {/* Línea y = x para referencia */}
                    <ReferenceLine
                      segment={[
                        { x: plazoScatterRange.min, y: plazoScatterRange.min },
                        { x: plazoScatterRange.max, y: plazoScatterRange.max },
                      ]}
                      stroke="#9CA3AF"
                      strokeDasharray="4 4"
                    />
                    <Scatter name="plazos" data={plazoScatter} fill="#6366F1" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>
                * Cada punto es (real, predicho). Mientras más cerca de la diagonal, mejor ajuste.
              </div>
            </div>
          </Row>

          <div>
            <div style={{ fontSize: 13, fontWeight: 600, margin: "12px 0 6px" }}>
              Errores por tarea (residual = real − predicho)
            </div>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={plazoResiduals}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="id" />
                  <YAxis />
                  <Tooltip formatter={(v) => [Number(v).toFixed(3), "residual"]} />
                  <Legend />
                  <Bar dataKey="residual" name="residual">
                    {plazoResiduals.map((d, i) => {
                      const a = Math.abs(d.residual);
                      const color = a >= plazoResThresh ? "#EF4444" : a >= plazoResThresh * 0.5 ? "#F59E0B" : "#22C55E";
                      return <Cell key={i} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>
              * Rojo: casos a revisar primero (errores más altos). Ámbar: seguimiento. Verde: dentro de lo esperado.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* === Bloque: Documentos === */}
      <Card>
        <CardHeader>
          <CardTitle>Documentos → size_mb (Regresión)</CardTitle>
          <CardSub>
            <b>Cómo leerlo:</b> predice el tamaño (MB). <b>MAE</b> ≈ error medio.
            Con muy pocos datos, <b>R²</b> puede ser nulo o poco estable.
          </CardSub>
        </CardHeader>
        <CardContent>
          <Row cols={3}>
            {smallStat("Modelo", docs.data?.model || "—")}
            {smallStat("CV (k-fold)", `k=${docs.data?.cv?.splits ?? "—"}`)}
            {smallStat(
              "Calidad media",
              typeof docs.data?.cv?.r2_mean === "number"
                ? r2BadgeText(docs.data.cv.r2_mean)
                : "R²: —",
              typeof docs.data?.cv?.mae_mean === "number" ? `MAE: ${docs.data.cv.mae_mean.toFixed(3)} MB` : ""
            )}
          </Row>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
            <Button onClick={() => setCoefSortAbs((v) => !v)}>
              {coefSortAbs ? "Ordenar por signo (desc)" : "Ordenar por |coef|"}
            </Button>
          </div>

          <Row cols={2}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, margin: "12px 0 6px" }}>
                Importancia de variables (coef. estandarizados)
              </div>
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={docCoefs} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(v) => [Number(v).toFixed(3), "coef"]} />
                    <Legend />
                    <Bar dataKey="coef" name="coef">
                      {docCoefs.map((d, i) => (
                        <Cell key={i} fill={d.coef >= 0 ? "#22C55E" : "#EF4444"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>
                * Verde: ↑ tamaño estimado; rojo: ↓ (en escala estandarizada).
              </div>
            </div>

            <div>
              <div style={{ fontSize: 13, fontWeight: 600, margin: "12px 0 6px" }}>
                Predicción vs real (con línea ideal)
              </div>
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                    <CartesianGrid />
                    <XAxis type="number" dataKey="x" name="y_true" />
                    <YAxis type="number" dataKey="y" name="y_pred" />
                    <Tooltip formatter={(v, n) => [Number(v).toFixed(3), n]} />
                    <Legend />
                    <ReferenceLine
                      segment={[
                        { x: docScatterRange.min, y: docScatterRange.min },
                        { x: docScatterRange.max, y: docScatterRange.max },
                      ]}
                      stroke="#9CA3AF"
                      strokeDasharray="4 4"
                    />
                    <Scatter name="docs" data={docScatter} fill="#6366F1" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>* (real, predicho) en MB.</div>
            </div>
          </Row>

          <div>
            <div style={{ fontSize: 13, fontWeight: 600, margin: "12px 0 6px" }}>
              Errores por documento (residual)
            </div>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={docResiduals}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="filename" tick={false} height={40} />
                  <YAxis />
                  <Tooltip formatter={(v) => [Number(v).toFixed(3) + " MB", "residual"]} />
                  <Legend />
                  <Bar dataKey="residual" name="residual">
                    {docResiduals.map((d, i) => {
                      const a = Math.abs(d.residual);
                      const color = a >= docResThresh ? "#EF4444" : a >= docResThresh * 0.5 ? "#F59E0B" : "#22C55E";
                      return <Cell key={i} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>
              * Rojo (outliers de error): revisar; Ámbar: seguimiento; Verde: esperado.
            </div>
          </div>
        </CardContent>
      </Card>

      <div style={{ fontSize: 11, opacity: 0.65 }}>
        Nota: El dataset es pequeño (n≈5–9). Con pocos datos, R² puede ser inestable o negativo. Tómalo como guía
        exploratoria; para producción se recomienda más muestras y validación adicional.
      </div>
    </div>
  );
}
