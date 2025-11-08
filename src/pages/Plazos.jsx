import { useEffect, useState } from "react";
import api from "../api/axiosCore";
import Table from "../components/Table";

export default function Plazos() {
  const [expId, setExpId] = useState("");
  const [expedientes, setExpedientes] = useState([]);
  const [loadingExp, setLoadingExp] = useState(false);

  const [rows, setRows] = useState([]);
  const [desc, setDesc] = useState("");
  const [fecha, setFecha] = useState(""); // YYYY-MM-DD
  const [edit, setEdit] = useState(null); // { id_plazo, descripcion, fecha_vencimiento }
  const [soloPendientes, setSoloPendientes] = useState(false);

  // ---------- Expedientes (selector + búsqueda) ----------
  const cargarExpedientes = async (q) => {
    setLoadingExp(true);
    try {
      const { data } = await api.get("/expedientes", { params: { limit: 200, q } });
      setExpedientes(data || []);
    } finally {
      setLoadingExp(false);
    }
  };

  useEffect(() => {
    cargarExpedientes();
  }, []);

  // ---------- Listar por expediente ----------
  const listar = async () => {
    if (!expId) {
      setRows([]);
      return;
    }
    const { data } = await api.get(`/expedientes/${expId}/plazos`);
    const mapped = (data || []).map((p) => ({
      id_plazo: p.id_plazo || p.id || p.idPlazo,
      descripcion: p.descripcion,
      fecha_vencimiento: p.fecha_vencimiento,
      cumplido: !!p.cumplido,
      fecha_cumplimiento: p.fecha_cumplimiento,
    }));
    setRows(mapped);
  };

  useEffect(() => {
    if (expId) listar();
    else setRows([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expId]);

  // ---------- Crear ----------
  const crear = async (e) => {
    e.preventDefault();
    if (!expId || !desc.trim() || !fecha) return;
    const { data } = await api.post("/plazos", {
      id_expediente: Number(expId),
      descripcion: desc,
      fecha_vencimiento: fecha,
    });
    const nueva = {
      id_plazo: data?.id_plazo || data?.id || Math.random(),
      descripcion: data?.descripcion ?? desc,
      fecha_vencimiento: data?.fecha_vencimiento ?? fecha,
      cumplido: !!data?.cumplido,
      fecha_cumplimiento: data?.fecha_cumplimiento ?? null,
    };
    setRows((r) => [nueva, ...r]);
    setDesc("");
    setFecha("");
  };

  // ---------- Cumplir ----------
  const cumplir = async (id_plazo) => {
    const { data } = await api.patch(`/plazos/${id_plazo}/cumplir`);
    setRows((r) =>
      r.map((p) => (p.id_plazo === id_plazo ? { ...p, ...data, cumplido: true } : p))
    );
  };

  // ---------- Editar ----------
  const empezarEditar = (p) => {
    setEdit({
      id_plazo: p.id_plazo,
      descripcion: p.descripcion,
      fecha_vencimiento: p.fecha_vencimiento ? String(p.fecha_vencimiento).slice(0, 10) : "",
    });
  };

  const cancelarEditar = () => setEdit(null);

  const guardarEdicion = async (e) => {
    e.preventDefault();
    if (!edit?.id_plazo) return;
    const body = {
      descripcion: edit.descripcion,
      fecha_vencimiento: edit.fecha_vencimiento,
    };
    const { data } = await api.patch(`/plazos/${edit.id_plazo}`, body);
    const actualizada = {
      id_plazo: data?.id_plazo ?? edit.id_plazo,
      descripcion: data?.descripcion ?? edit.descripcion,
      fecha_vencimiento: data?.fecha_vencimiento ?? edit.fecha_vencimiento,
      cumplido: !!data?.cumplido,
      fecha_cumplimiento: data?.fecha_cumplimiento ?? null,
    };
    setRows((r) => r.map((p) => (p.id_plazo === actualizada.id_plazo ? actualizada : p)));
    setEdit(null);
  };

  // ---------- Eliminar ----------
  const eliminar = async (id_plazo) => {
    if (!window.confirm("¿Eliminar plazo?")) return;
    await api.delete(`/plazos/${id_plazo}`);
    setRows((r) => r.filter((p) => p.id_plazo !== id_plazo));
  };

  const displayRows = soloPendientes ? rows.filter((p) => !p.cumplido) : rows;

  // estilos atajos
  const card = {
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    padding: 12,
    background: "#ffffff",
  };
  const help = { fontSize: 12, color: "#64748b", marginTop: 4 };

  return (
    <div className="space-y-4">
      <h1 style={{ fontSize: 18, fontWeight: 600 }}>Plazos</h1>

      {/* --- Sección: Selección de expediente --- */}
      <div style={{ ...card, display: "grid", gap: 12 }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>1) Seleccione un expediente</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <select
            value={expId}
            onChange={(e) => setExpId(e.target.value)}
            style={{ padding: 8, border: "1px solid #ddd", borderRadius: 6, minWidth: 260 }}
          >
            <option value="">{loadingExp ? "Cargando expedientes..." : "— Seleccione expediente —"}</option>
            {expedientes.map((e) => (
              <option key={e.id_expediente} value={e.id_expediente}>
                #{e.id_expediente} · {e.titulo}
              </option>
            ))}
          </select>

          <input
            placeholder="Buscar expediente (por título)"
            onChange={(ev) => {
              const term = ev.target.value;
              cargarExpedientes(term || undefined);
            }}
            style={{ padding: 8, border: "1px solid #ddd", borderRadius: 6, minWidth: 220 }}
          />

          <button
            onClick={listar}
            disabled={!expId}
            style={{
              background: expId ? "#111" : "#999",
              color: "#fff",
              padding: "8px 12px",
              borderRadius: 6,
            }}
          >
            Listar plazos
          </button>

          <label style={{ display: "inline-flex", gap: 6, alignItems: "center", marginLeft: 8 }}>
            <input
              type="checkbox"
              checked={soloPendientes}
              onChange={(e) => setSoloPendientes(e.target.checked)}
            />
            <span style={{ fontSize: 13 }}>Mostrar solo pendientes</span>
          </label>
        </div>

        {/* Leyenda/ayuda de fechas */}
        <div style={{ padding: 10, border: "1px dashed #cbd5e1", borderRadius: 8, background: "#f8fafc", maxWidth: 520 }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>¿Qué significa cada fecha?</div>
          <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13, color: "#334155" }}>
            <li><b>Vence</b>: fecha límite del compromiso o tarea del plazo.</li>
            <li><b>Fec. Cumpl.</b>: cuándo se marcó como cumplido (se completa al usar <i>Marcar cumplido</i>).</li>
          </ul>
        </div>
      </div>

      {/* --- Sección: Crear plazo --- */}
      <div style={{ ...card, display: "grid", gap: 8 }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>2) Crear un nuevo plazo</div>
        <form onSubmit={crear} style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 180px 120px", alignItems: "start" }}>
          <div style={{ display: "grid", gap: 4 }}>
            <input
              placeholder={expId ? "Descripción del plazo (ej. Presentar memorial)" : "Seleccione un expediente primero"}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              disabled={!expId}
              style={{ padding: 8, border: "1px solid #ddd", borderRadius: 6 }}
            />
            <div style={help}>Describe qué hay que hacer para este plazo.</div>
          </div>

          <div style={{ display: "grid", gap: 4 }}>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              disabled={!expId}
              style={{ padding: 8, border: "1px solid #ddd", borderRadius: 6 }}
            />
            <div style={help}>Fecha <b>Vence</b>: el límite para cumplir el plazo.</div>
          </div>

          <button
            disabled={!expId || !desc.trim() || !fecha}
            style={{
              background: !expId || !desc.trim() || !fecha ? "#999" : "#111",
              color: "#fff",
              padding: "8px 12px",
              borderRadius: 6,
              height: 40,
            }}
          >
            Crear
          </button>
        </form>
      </div>

      {/* --- Sección: Tabla --- */}
      <div style={card}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>3) Plazos del expediente</div>
        <Table
          cols={["ID Plazo", "Descripción", "Vence", "Cumplido", "Fec. Cumpl.", "Acciones"]}
          rows={displayRows.map((p) => {
            const venceStr = p.fecha_vencimiento ? new Date(p.fecha_vencimiento).toLocaleDateString() : "-";
            const cumpleStr = p.fecha_cumplimiento ? new Date(p.fecha_cumplimiento).toLocaleDateString() : "-";
            return {
              "ID Plazo": p.id_plazo,
              "Descripción": p.descripcion,
              "Vence": <span title={p.fecha_vencimiento || ""}>{venceStr}</span>,
              "Cumplido": p.cumplido ? "Sí" : "No",
              "Fec. Cumpl.": <span title={p.fecha_cumplimiento || ""}>{cumpleStr}</span>,
              "Acciones": (
                <div style={{ display: "flex", gap: 8 }}>
                  {!p.cumplido && (
                    <button type="button" onClick={() => cumplir(p.id_plazo)} style={{ textDecoration: "underline" }}>
                      Marcar cumplido
                    </button>
                  )}
                  <button type="button" onClick={() => empezarEditar(p)} style={{ textDecoration: "underline" }}>
                    Editar
                  </button>
                  <button type="button" onClick={() => eliminar(p.id_plazo)} style={{ textDecoration: "underline", color: "#b00" }}>
                    Eliminar
                  </button>
                </div>
              ),
            };
          })}
        />
      </div>

      {/* --- Sección: Edición --- */}
      {edit && (
        <div style={{ ...card }}>
          <form onSubmit={guardarEdicion} style={{ display: "grid", gap: 10, maxWidth: 620 }}>
            <div style={{ fontWeight: 600 }}>Editar plazo #{edit.id_plazo}</div>

            <div style={{ display: "grid", gap: 4 }}>
              <label style={{ fontSize: 13, color: "#334155" }}>Descripción</label>
              <input
                value={edit.descripcion}
                onChange={(e) => setEdit({ ...edit, descripcion: e.target.value })}
                style={{ padding: 8, border: "1px solid #ddd", borderRadius: 6 }}
              />
              <div style={help}>Descripción breve del compromiso.</div>
            </div>

            <div style={{ display: "grid", gap: 4 }}>
              <label style={{ fontSize: 13, color: "#334155" }}>Fecha de vencimiento</label>
              <input
                type="date"
                value={edit.fecha_vencimiento}
                onChange={(e) => setEdit({ ...edit, fecha_vencimiento: e.target.value })}
                style={{ padding: 8, border: "1px solid #ddd", borderRadius: 6, maxWidth: 220 }}
              />
              <div style={help}>Actualiza la fecha <b>Vence</b> si cambió el plazo límite.</div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ background: "#111", color: "#fff", padding: "8px 12px", borderRadius: 6 }}>
                Guardar
              </button>
              <button
                type="button"
                onClick={cancelarEditar}
                style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #ddd" }}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
