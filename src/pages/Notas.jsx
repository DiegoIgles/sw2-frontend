import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { GET_EXPEDIENTES, GET_NOTAS_EXPEDIENTE, CREATE_NOTA, UPDATE_NOTA, DELETE_NOTA } from "../graphql/queries";
import Table from "../components/Table";

const TIPOS = ["GENERAL", "ACTUACION", "INTERNA"];

export default function Notas() {
  const [expId, setExpId] = useState("");
  const [contenido, setContenido] = useState("");
  const [tipo, setTipo] = useState(TIPOS[0]);
  const [edit, setEdit] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Query para cargar expedientes
  const { data: expedientesData, loading: loadingExp, refetch: refetchExpedientes } = useQuery(GET_EXPEDIENTES, {
    variables: { limit: 200, offset: 0, q: searchTerm || null },
    skip: false,
  });

  const expedientes = expedientesData?.expedientes || [];

  // Query para listar notas del expediente seleccionado
  const { data: notasData, loading: loadingNotas, refetch: refetchNotas } = useQuery(GET_NOTAS_EXPEDIENTE, {
    variables: { idExpediente: expId ? Number(expId) : 0 },
    skip: !expId,
  });

  // Normalizar datos de GraphQL
  const rows = (notasData?.notasExpediente || []).map((n) => ({
    id_nota: n.idNota,
    contenido: n.contenido,
    tipo: n.tipo ?? null,
    fecha_registro: n.fechaCreacion,
  }));

  // Mutation para crear nota
  const [createNota, { loading: creating }] = useMutation(CREATE_NOTA, {
    refetchQueries: [{ query: GET_NOTAS_EXPEDIENTE, variables: { idExpediente: expId ? Number(expId) : 0 } }],
    onCompleted: () => {
      setContenido("");
      setTipo(TIPOS[0]);
    }
  });

  // Mutation para actualizar nota
  const [updateNota, { loading: updating }] = useMutation(UPDATE_NOTA, {
    refetchQueries: [{ query: GET_NOTAS_EXPEDIENTE, variables: { idExpediente: expId ? Number(expId) : 0 } }],
    onCompleted: () => {
      setEdit(null);
    }
  });

  // Mutation para eliminar nota
  const [deleteNota] = useMutation(DELETE_NOTA, {
    refetchQueries: [{ query: GET_NOTAS_EXPEDIENTE, variables: { idExpediente: expId ? Number(expId) : 0 } }],
  });

  // --- Crear nota ---
  const crear = async (e) => {
    e.preventDefault();
    if (!expId || !contenido.trim()) return;
    try {
      await createNota({
        variables: {
          idExpediente: Number(expId),
          contenido,
          tipo: tipo || null,
        }
      });
    } catch (error) {
      console.error("Error al crear nota:", error);
    }
  };

  // --- Edición ---
  const empezarEditar = (nota) => {
    setEdit({ id_nota: nota.id_nota, contenido: nota.contenido, tipo: nota.tipo });
  };

  const cancelarEditar = () => setEdit(null);

  const guardarEdicion = async (e) => {
    e.preventDefault();
    if (!edit?.id_nota) return;
    try {
      await updateNota({
        variables: {
          id: edit.id_nota,
          contenido: edit.contenido,
          tipo: edit.tipo || null,
        }
      });
    } catch (error) {
      console.error("Error al actualizar nota:", error);
    }
  };

  // --- Eliminar ---
  const eliminar = async (id_nota) => {
    if (!window.confirm("¿Eliminar nota?")) return;
    try {
      await deleteNota({
        variables: { id: id_nota }
      });
    } catch (error) {
      console.error("Error al eliminar nota:", error);
      alert("Error al eliminar la nota");
    }
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
            <option key={e.idExpediente} value={e.idExpediente}>
              #{e.idExpediente} · {e.titulo}
            </option>
          ))}
        </select>

        <input
          placeholder="Buscar expediente (por título)"
          value={searchTerm}
          onChange={(ev) => {
            const term = ev.target.value;
            setSearchTerm(term);
            refetchExpedientes({ limit: 200, offset: 0, q: term || null });
          }}
          style={{ padding: 8, border: "1px solid #ddd", borderRadius: 6, minWidth: 220 }}
        />

        <button
          onClick={() => refetchNotas()}
          disabled={!expId}
          style={{
            background: expId ? "#111" : "#999",
            color: "#fff",
            padding: "8px 12px",
            borderRadius: 6,
          }}
        >
          {loadingNotas ? "Cargando..." : "Listar notas"}
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
          disabled={!expId || !contenido.trim() || creating}
          style={{
            background: !expId || !contenido.trim() ? "#999" : "#111",
            color: "#fff",
            padding: "8px 12px",
            borderRadius: 6,
            opacity: creating ? 0.7 : 1,
          }}
        >
          {creating ? "Creando..." : "Crear"}
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
            <button 
              disabled={updating}
              style={{ background: "#111", color: "#fff", padding: "8px 12px", borderRadius: 6, opacity: updating ? 0.7 : 1 }}
            >
              {updating ? "Guardando..." : "Guardar"}
            </button>
            <button 
              type="button" 
              onClick={cancelarEditar} 
              disabled={updating}
              style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #ddd", opacity: updating ? 0.7 : 1 }}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
