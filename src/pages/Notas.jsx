import { useEffect, useState } from "react";
import api from "../api/axiosCore";
import Table from "../components/Table";

const TIPOS = ["GENERAL", "ACTUACION", "INTERNA"];

export default function Notas() {
  const [expId, setExpId] = useState("");
  const [expedientes, setExpedientes] = useState([]);
  const [loadingExp, setLoadingExp] = useState(false);

  const [rows, setRows] = useState([]);
  const [contenido, setContenido] = useState("");
  const [tipo, setTipo] = useState(TIPOS[0]);
  const [edit, setEdit] = useState(null); // { id_nota, contenido, tipo }

  // --- Cargar expedientes para el selector ---
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

  // --- Listar notas del expediente seleccionado ---
  const listar = async () => {
    if (!expId) {
      setRows([]);
      return;
    }
    const { data } = await api.get(`/expedientes/${expId}/notas`);
    const mapped = (data || []).map((n) => ({
      id_nota: n.id_nota || n.id || n.idNota,
      contenido: n.contenido,
      tipo: n.tipo ?? null,
      // en tu entity es fecha_registro
      fecha_registro: n.fecha_registro || n.fecha || n.createdAt,
    }));
    setRows(mapped);
  };

  useEffect(() => {
    if (expId) listar();
    else setRows([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expId]);

  // --- Crear nota ---
  const crear = async (e) => {
    e.preventDefault();
    if (!expId || !contenido.trim()) return;
    const { data } = await api.post("/notas", {
      id_expediente: Number(expId),
      contenido,
      tipo,
    });
    setContenido("");
    setTipo(TIPOS[0]);

    const nueva = {
      id_nota: (data && (data.id_nota || data.id)) ?? Math.random(),
      contenido: data?.contenido ?? contenido,
      tipo: data?.tipo ?? tipo ?? null,
      fecha_registro: data?.fecha_registro || new Date().toISOString(),
    };
    setRows((r) => [nueva, ...r]);
  };

  // --- Edición ---
  const empezarEditar = (nota) => {
    setEdit({ id_nota: nota.id_nota, contenido: nota.contenido, tipo: nota.tipo });
  };

  const cancelarEditar = () => setEdit(null);

  const guardarEdicion = async (e) => {
    e.preventDefault();
    if (!edit?.id_nota) return;
    const { data } = await api.patch(`/notas/${edit.id_nota}`, {
      contenido: edit.contenido,
      tipo: edit.tipo,
    });
    const actualizada = {
      id_nota: data?.id_nota ?? edit.id_nota,
      contenido: data?.contenido ?? edit.contenido,
      tipo: data?.tipo ?? edit.tipo ?? null,
      fecha_registro: data?.fecha_registro, // puede venir igual
    };
    setRows((r) => r.map((n) => (n.id_nota === actualizada.id_nota ? actualizada : n)));
    setEdit(null);
  };

  // --- Eliminar ---
  const eliminar = async (id_nota) => {
    if (!window.confirm("¿Eliminar nota?")) return;
    await api.delete(`/notas/${id_nota}`);
    setRows((r) => r.filter((n) => n.id_nota !== id_nota));
  };

  return (
    <div className="space-y-4">
      <h1 style={{ fontSize: 18, fontWeight: 600 }}>Notas</h1>

      {/* Selector de expediente + búsqueda */}
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
          Listar notas
        </button>
      </div>

      {/* Crear nota */}
      <form onSubmit={crear} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          style={{ padding: 8, border: "1px solid #ddd", borderRadius: 6 }}
        >
          {TIPOS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input
          placeholder={expId ? "Contenido de la nota" : "Seleccione un expediente primero"}
          value={contenido}
          onChange={(e) => setContenido(e.target.value)}
          disabled={!expId}
          style={{ padding: 8, border: "1px solid #ddd", borderRadius: 6, minWidth: 320 }}
        />
        <button
          disabled={!expId || !contenido.trim()}
          style={{
            background: !expId || !contenido.trim() ? "#999" : "#111",
            color: "#fff",
            padding: "8px 12px",
            borderRadius: 6,
          }}
        >
          Crear
        </button>
      </form>



      {/* Tabla */}
      <Table
        cols={["ID Nota", "Tipo", "Contenido", "Fecha", "Acciones"]}
        rows={rows.map((n) => ({
          "ID Nota": n.id_nota,
          "Tipo": n.tipo ?? "—",
          "Contenido": n.contenido,
          "Fecha": n.fecha_registro ? new Date(n.fecha_registro).toLocaleString() : "-",
          "Acciones": (
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={() => empezarEditar(n)}
                style={{ textDecoration: "underline" }}
              >
                Editar
              </button>
              <button
                type="button"
                onClick={() => eliminar(n.id_nota)}
                style={{ textDecoration: "underline", color: "#b00" }}
              >
                Eliminar
              </button>
            </div>
          ),
        }))}
      />

      {/* Form de edición */}
      {edit && (
        <form
          onSubmit={guardarEdicion}
          style={{ border: "1px solid #eee", borderRadius: 8, padding: 12, display: "grid", gap: 8, maxWidth: 560 }}
        >
          <div style={{ fontWeight: 600 }}>Editar nota #{edit.id_nota}</div>
          <select
            value={edit.tipo || ""}
            onChange={(e) => setEdit({ ...edit, tipo: e.target.value || null })}
            style={{ padding: 8, border: "1px solid #ddd", borderRadius: 6 }}
          >
            <option value="">— Sin tipo —</option>
            {TIPOS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <input
            value={edit.contenido}
            onChange={(e) => setEdit({ ...edit, contenido: e.target.value })}
            style={{ padding: 8, border: "1px solid #ddd", borderRadius: 6 }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{ background: "#111", color: "#fff", padding: "8px 12px", borderRadius: 6 }}>Guardar</button>
            <button type="button" onClick={cancelarEditar} style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #ddd" }}>
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
