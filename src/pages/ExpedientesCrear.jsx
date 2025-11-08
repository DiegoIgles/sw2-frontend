import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axiosCore";

export default function ExpedientesCrear() {
  const [titulo, setTitulo] = useState("");
  const [desc, setDesc] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [err, setErr] = useState("");
  const [errClientes, setErrClientes] = useState("");
  const nav = useNavigate();

  // Cargar clientes para el select
  const cargarClientes = async () => {
    setErrClientes("");
    setLoadingClientes(true);
    try {
      const { data } = await api.get("/clientes"); // tu endpoint GET /clientes
      setClientes(Array.isArray(data) ? data : []);
    } catch (e) {
      setErrClientes(e?.response?.data?.message || "No se pudo cargar la lista de clientes");
    } finally {
      setLoadingClientes(false);
    }
  };

  useEffect(() => {
    cargarClientes();
  }, []);

  const crear = async (e) => {
    e.preventDefault();
    setErr("");
    if (!clienteId) {
      setErr("Selecciona un cliente.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/expedientes", {
        titulo,
        descripcion: desc || null,
        estado: "ABIERTO",
        fecha_inicio: new Date().toISOString().slice(0, 10),
        id_cliente: Number(clienteId),
      });
      nav("/expedientes"); // volver a la lista
    } catch (e) {
      setErr(e?.response?.data?.message || "No se pudo crear el expediente");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 18, fontWeight: 600 }}>Nuevo expediente</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={cargarClientes} style={{ border: "1px solid #ddd", padding: "8px 12px", borderRadius: 6 }}>
            {loadingClientes ? "Cargando..." : "Recargar clientes"}
          </button>
          <Link to="/expedientes">
            <button style={{ border: "1px solid #ddd", padding: "8px 12px", borderRadius: 6 }}>Volver</button>
          </Link>
        </div>
      </div>

      {err && <div style={{ color: "#b00", fontSize: 13 }}>{err}</div>}
      {errClientes && <div style={{ color: "#b00", fontSize: 13 }}>{errClientes}</div>}

      <form onSubmit={crear} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          placeholder="Título"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          style={{ padding: 8, border: "1px solid #ddd", borderRadius: 6, minWidth: 260 }}
        />
        <input
          placeholder="Descripción"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          style={{ padding: 8, border: "1px solid #ddd", borderRadius: 6, minWidth: 320 }}
        />

        {/* SELECT de clientes */}
        <select
          value={clienteId}
          onChange={(e) => setClienteId(e.target.value)}
          disabled={loadingClientes || clientes.length === 0}
          style={{ padding: 8, border: "1px solid #ddd", borderRadius: 6, minWidth: 260 }}
        >
          <option value="">{loadingClientes ? "Cargando clientes..." : "Selecciona un cliente"}</option>
          {clientes.map((c) => (
            <option key={c.id_cliente} value={c.id_cliente}>
              {c.id_cliente} — {c.nombre_completo}
              {c.contacto_email ? ` (${c.contacto_email})` : ""}
            </option>
          ))}
        </select>

        <button
          disabled={loading}
          style={{ background: "#111", color: "#fff", padding: "8px 12px", borderRadius: 6 }}
        >
          {loading ? "Creando..." : "Crear"}
        </button>
      </form>
    </div>
  );
}
