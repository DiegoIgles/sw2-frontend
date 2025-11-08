import { useEffect, useState } from "react";
import api from "../api/axiosCore";
import Table from "../components/Table";

const TIPOS = ["GENERAL", "ACTUACION", "INTERNA"];

export default function Notas() {
  const [expId, setExpId] = useState("");
  const [rows, setRows] = useState([]);
  const [contenido, setContenido] = useState("");
  const [tipo, setTipo] = useState(TIPOS[0]);
  const [edit, setEdit] = useState(null); // { id_nota, contenido, tipo }

  const listar = async () => {
    if (!expId) return;
    const { data } = await api.get(`/expedientes/${expId}/notas`);
    // normaliza filas (por si vienen campos extra)
    const mapped = data.map(n => ({
      id_nota: n.id_nota || n.id || n.idNota,
      contenido: n.contenido,
      tipo: n.tipo,
      fecha_creacion: n.fecha_creacion,
    }));
    setRows(mapped);
  };

  const crear = async (e) => {
    e.preventDefault();
    if (!expId || !contenido) return;
    const { data } = await api.post("/notas", {
      id_expediente: Number(expId),
      contenido,
      tipo,
    });
    setContenido("");
    setTipo(TIPOS[0]);
    setRows(r => [data, ...r]);
  };

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
    setRows(r => r.map(n => (n.id_nota === data.id_nota ? data : n)));
    setEdit(null);
  };

  const eliminar = async (id_nota) => {
    if (!window.confirm("¿Eliminar nota?")) return;
    await api.delete(`/notas/${id_nota}`);
    setRows(r => r.filter(n => n.id_nota !== id_nota));
  };

  useEffect(() => {
    // si quieres cargar automáticamente cuando expId cambia:
    // if (expId) listar();
  }, [expId]);

  return (
    <div className="space-y-4">
      <h1 style={{ fontSize: 18, fontWeight: 600 }}>Notas</h1>

      {/* Buscar por expediente */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          placeholder="ID Expediente"
          value={expId}
          onChange={(e) => setExpId(e.target.value)}
          style={{ padding: 8, border: "1px solid #ddd", borderRadius: 6, width: 160 }}
        />
        <button onClick={listar} style={{ background: "#111", color: "#fff", padding: "8px 12px", borderRadius: 6 }}>
          Listar
        </button>
      </div>

      {/* Crear nota */}
      <form onSubmit={crear} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <select value={tipo} onChange={(e) => setTipo(e.target.value)} style={{ padding: 8, border: "1px solid #ddd", borderRadius: 6 }}>
          {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <input
          placeholder="Contenido"
          value={contenido}
          onChange={(e) => setContenido(e.target.value)}
          style={{ padding: 8, border: "1px solid #ddd", borderRadius: 6, minWidth: 320 }}
        />
        <button style={{ background: "#111", color: "#fff", padding: "8px 12px", borderRadius: 6 }}>
          Crear
        </button>
      </form>

      {/* Tabla */}
      <Table
        cols={["ID Nota", "Tipo", "Contenido", "Fecha", "Acciones"]}
        rows={rows.map(n => ({
          "ID Nota": n.id_nota,
          "Tipo": n.tipo,
          "Contenido": n.contenido,
          "Fecha": n.fecha_creacion ? new Date(n.fecha_creacion).toLocaleString() : "-",
          "Acciones": "—"
        }))}
      />

      {/* Acciones por fila */}
      <div style={{ display: "grid", gap: 6 }}>
        {rows.map(n => (
          <div key={n.id_nota} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>
            <span style={{ opacity: .7 }}>#{n.id_nota}</span>
            <button onClick={() => empezarEditar(n)} style={{ textDecoration: "underline" }}>Editar</button>
            <button onClick={() => eliminar(n.id_nota)} style={{ textDecoration: "underline", color: "#b00" }}>Eliminar</button>
          </div>
        ))}
      </div>

      {/* Form de edición */}
      {edit && (
        <form onSubmit={guardarEdicion} style={{ border: "1px solid #eee", borderRadius: 8, padding: 12, display: "grid", gap: 8, maxWidth: 560 }}>
          <div style={{ fontWeight: 600 }}>Editar nota #{edit.id_nota}</div>
          <select value={edit.tipo} onChange={(e) => setEdit({ ...edit, tipo: e.target.value })} style={{ padding: 8, border: "1px solid #ddd", borderRadius: 6 }}>
            {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
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
