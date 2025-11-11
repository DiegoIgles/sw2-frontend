import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation } from "@apollo/client";
import { GET_CLIENTES, CREATE_EXPEDIENTE } from "../graphql/queries";

export default function ExpedientesCrear() {
  const [titulo, setTitulo] = useState("");
  const [desc, setDesc] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [err, setErr] = useState("");
  const nav = useNavigate();

  // Query para cargar clientes
  const { data: clientesData, loading: loadingClientes, error: errorClientes, refetch: refetchClientes } = useQuery(GET_CLIENTES, {
    variables: { limit: 200, offset: 0 },
    onError: (e) => {
      setErr(e?.graphQLErrors?.[0]?.message || e?.message || "No se pudo cargar la lista de clientes");
    }
  });

  const clientes = clientesData?.clientes || [];

  // Mutation para crear expediente
  const [createExpediente, { loading }] = useMutation(CREATE_EXPEDIENTE, {
    onError: (e) => {
      setErr(e?.graphQLErrors?.[0]?.message || e?.message || "No se pudo crear el expediente");
    },
    onCompleted: () => {
      nav("/expedientes");
    }
  });

  const crear = async (e) => {
    e.preventDefault();
    setErr("");
    if (!clienteId) {
      setErr("Selecciona un cliente.");
      return;
    }
    try {
      await createExpediente({
        variables: {
          idCliente: Number(clienteId),
          titulo,
          descripcion: desc || null,
          estado: "ABIERTO", // GraphQL enum se pasa como string
        }
      });
    } catch (e) {
      // El error ya se maneja en onError del mutation
    }
  };

  return (
    <div className="space-y-4">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 18, fontWeight: 600 }}>Nuevo expediente</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => refetchClientes()} style={{ border: "1px solid #ddd", padding: "8px 12px", borderRadius: 6 }}>
            {loadingClientes ? "Cargando..." : "Recargar clientes"}
          </button>
          <Link to="/expedientes">
            <button style={{ border: "1px solid #ddd", padding: "8px 12px", borderRadius: 6 }}>Volver</button>
          </Link>
        </div>
      </div>

      {err && <div style={{ color: "#b00", fontSize: 13 }}>{err}</div>}
      {errorClientes && <div style={{ color: "#b00", fontSize: 13 }}>{errorClientes?.message || "Error al cargar clientes"}</div>}

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
            <option key={c.idCliente} value={c.idCliente}>
              {c.idCliente} — {c.nombreCompleto}
              {c.contactoEmail ? ` (${c.contactoEmail})` : ""}
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
