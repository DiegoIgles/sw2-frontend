import { useEffect, useState } from "react";
import api from "../api/axiosCore";
import Table from "../components/Table";

export default function Plazos() {
  const [expId, setExpId] = useState("");
  const [rows, setRows] = useState([]);
  const [desc, setDesc] = useState("");
  const [fecha, setFecha] = useState(""); // YYYY-MM-DD
  const [edit, setEdit] = useState(null); // { id_plazo, descripcion, fecha_vencimiento }

  const listar = async () => {
    if (!expId) return;
    const { data } = await api.get(`/expedientes/${expId}/plazos`);
    const mapped = data.map(p => ({
      id_plazo: p.id_plazo || p.id || p.idPlazo,
      descripcion: p.descripcion,
      fecha_vencimiento: p.fecha_vencimiento,
      cumplido: !!p.cumplido,
      fecha_cumplimiento: p.fecha_cumplimiento,
    }));
    setRows(mapped);
  };

  const crear = async (e) => {
    e.preventDefault();
    if (!expId || !desc || !fecha) return;
    const { data } = await api.post("/plazos", {
      id_expediente: Number(expId),
      descripcion: desc,
      fecha_vencimiento: fecha,
    });
    setRows(r => [data, ...r]);
    setDesc("");
    setFecha("");
  };

  const cumplir = async (id_plazo) => {
    const { data } = await api.patch(`/plazos/${id_plazo}/cumplir`);
    setRows(r => r.map(p => (p.id_plazo === id_plazo ? { ...p, ...data } : p)));
  };

  const empezarEditar = (p) => {
    setEdit({
      id_plazo: p.id_plazo,
      descripcion: p.descripcion,
      fecha_vencimiento: p.fecha_vencimiento?.slice(0, 10) || "",
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
    setRows(r => r.map(p => (p.id_plazo === data.id_plazo ? data : p)));
    setEdit(null);
  };

  const eliminar = async (id_plazo) => {
    if (!window.confirm("¿Eliminar plazo?")) return;
    await api.delete(`/plazos/${id_plazo}`);
    setRows(r => r.filter(p => p.id_plazo !== id_plazo));
  };

  // Vencidos hasta fecha (opcional)
  const [hasta, setHasta] = useState("");
  const listarVencidos = async () => {
    if (!hasta) return;
    const { data } = await api.get(`/plazos-vencidos`, { params: { hasta } });
    const mapped = data.map(p => ({
      id_plazo: p.id_plazo,
      descripcion: p.descripcion,
      fecha_vencimiento: p.fecha_vencimiento,
      cumplido: !!p.cumplido,
      fecha_cumplimiento: p.fecha_cumplimiento,
    }));
    setRows(mapped);
  };

  useEffect(() => {
    // if (expId) listar();
  }, [expId]);

  return (
    <div className="space-y-4">
      <h1 style={{ fontSize: 18, fontWeight: 600 }}>Plazos</h1>

      {/* Buscar por expediente */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <input
          placeholder="ID Expediente"
          value={expId}
          onChange={(e) => setExpId(e.target.value)}
          style={{ padding: 8, border: "1px solid #ddd", borderRadius: 6, width: 160 }}
        />
        <button onClick={listar} style={{ background: "#111", color: "#fff", padding: "8px 12px", borderRadius: 6 }}>
          Listar
        </button>

        <div style={{ marginLeft: 16, display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            style={{ padding: 8, border: "1px solid #ddd", borderRadius: 6 }}
          />
          <button onClick={listarVencidos} style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #ddd" }}>
            Vencidos hasta fecha
          </button>
        </div>
      </div>

      {/* Crear */}
      <form onSubmit={crear} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          placeholder="Descripción"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          style={{ padding: 8, border: "1px solid #ddd", borderRadius: 6, minWidth: 320 }}
        />
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          style={{ padding: 8, border: "1px solid #ddd", borderRadius: 6 }}
        />
        <button style={{ background: "#111", color: "#fff", padding: "8px 12px", borderRadius: 6 }}>
          Crear
        </button>
      </form>

      {/* Tabla */}
      <Table
        cols={["ID Plazo", "Descripción", "Vence", "Cumplido", "Fec. Cumpl.", "Acciones"]}
        rows={rows.map(p => ({
          "ID Plazo": p.id_plazo,
          "Descripción": p.descripcion,
          "Vence": p.fecha_vencimiento ? new Date(p.fecha_vencimiento).toLocaleDateString() : "-",
          "Cumplido": p.cumplido ? "Sí" : "No",
          "Fec. Cumpl.": p.fecha_cumplimiento ? new Date(p.fecha_cumplimiento).toLocaleDateString() : "-",
          "Acciones": "—"
        }))}
      />

      {/* Acciones por fila */}
      <div style={{ display: "grid", gap: 6 }}>
        {rows.map(p => (
          <div key={p.id_plazo} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>
            <span style={{ opacity: .7 }}>#{p.id_plazo}</span>
            {!p.cumplido && (
              <button onClick={() => cumplir(p.id_plazo)} style={{ textDecoration: "underline" }}>
                Marcar cumplido
              </button>
            )}
            <button onClick={() => empezarEditar(p)} style={{ textDecoration: "underline" }}>Editar</button>
            <button onClick={() => eliminar(p.id_plazo)} style={{ textDecoration: "underline", color: "#b00" }}>Eliminar</button>
          </div>
        ))}
      </div>

      {/* Form de edición */}
      {edit && (
        <form onSubmit={guardarEdicion} style={{ border: "1px solid #eee", borderRadius: 8, padding: 12, display: "grid", gap: 8, maxWidth: 560 }}>
          <div style={{ fontWeight: 600 }}>Editar plazo #{edit.id_plazo}</div>
          <input
            value={edit.descripcion}
            onChange={(e) => setEdit({ ...edit, descripcion: e.target.value })}
            style={{ padding: 8, border: "1px solid #ddd", borderRadius: 6 }}
          />
          <input
            type="date"
            value={edit.fecha_vencimiento}
            onChange={(e) => setEdit({ ...edit, fecha_vencimiento: e.target.value })}
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
