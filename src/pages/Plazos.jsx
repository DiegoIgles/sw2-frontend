import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { GET_EXPEDIENTES, GET_PLAZOS_EXPEDIENTE, CREATE_PLAZO, UPDATE_PLAZO, MARCAR_PLAZO_CUMPLIDO, DELETE_PLAZO } from "../graphql/queries";
import Table from "../components/Table";

export default function Plazos() {
  const [expId, setExpId] = useState("");
  const [desc, setDesc] = useState("");
  const [fecha, setFecha] = useState("");
  const [edit, setEdit] = useState(null);
  const [soloPendientes, setSoloPendientes] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Query para cargar expedientes
  const { data: expedientesData, loading: loadingExp, refetch: refetchExpedientes } = useQuery(GET_EXPEDIENTES, {
    variables: { limit: 200, offset: 0, q: searchTerm || null },
  });

  const expedientes = expedientesData?.expedientes || [];

  // Query para listar plazos del expediente
  const { data: plazosData, loading: loadingPlazos, refetch: refetchPlazos } = useQuery(GET_PLAZOS_EXPEDIENTE, {
    variables: { idExpediente: expId ? Number(expId) : 0 },
    skip: !expId,
  });

  // Normalizar datos de GraphQL
  const rows = (plazosData?.plazosExpediente || []).map((p) => ({
    id_plazo: p.idPlazo,
    descripcion: p.descripcion,
    fecha_vencimiento: p.fechaVencimiento,
    cumplido: p.cumplido,
    fecha_cumplimiento: p.fechaCumplimiento,
  }));

  // Mutation para crear plazo
  const [createPlazo, { loading: creating }] = useMutation(CREATE_PLAZO, {
    refetchQueries: [{ query: GET_PLAZOS_EXPEDIENTE, variables: { idExpediente: expId ? Number(expId) : 0 } }],
    onCompleted: () => {
      setDesc("");
      setFecha("");
    }
  });

  // Mutation para marcar como cumplido
  const [marcarCumplido] = useMutation(MARCAR_PLAZO_CUMPLIDO, {
    refetchQueries: [{ query: GET_PLAZOS_EXPEDIENTE, variables: { idExpediente: expId ? Number(expId) : 0 } }],
  });

  // Mutation para actualizar plazo
  const [updatePlazo, { loading: updating }] = useMutation(UPDATE_PLAZO, {
    refetchQueries: [{ query: GET_PLAZOS_EXPEDIENTE, variables: { idExpediente: expId ? Number(expId) : 0 } }],
    onCompleted: () => {
      setEdit(null);
    }
  });

  // Mutation para eliminar plazo
  const [deletePlazo] = useMutation(DELETE_PLAZO, {
    refetchQueries: [{ query: GET_PLAZOS_EXPEDIENTE, variables: { idExpediente: expId ? Number(expId) : 0 } }],
  });

  // Crear plazo
  const crear = async (e) => {
    e.preventDefault();
    if (!expId || !desc.trim() || !fecha) return;
    try {
      await createPlazo({
        variables: {
          idExpediente: Number(expId),
          descripcion: desc,
          fechaVencimiento: fecha,
        }
      });
    } catch (error) {
      console.error("Error al crear plazo:", error);
      alert("Error al crear el plazo");
    }
  };

  // Marcar como cumplido
  const cumplir = async (id_plazo) => {
    try {
      await marcarCumplido({
        variables: { idPlazo: id_plazo }
      });
    } catch (error) {
      console.error("Error al marcar plazo como cumplido:", error);
      alert("Error al marcar el plazo como cumplido");
    }
  };

  // Editar plazo
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
    try {
      await updatePlazo({
        variables: {
          idPlazo: edit.id_plazo,
          descripcion: edit.descripcion,
          fechaVencimiento: edit.fecha_vencimiento,
        }
      });
    } catch (error) {
      console.error("Error al actualizar plazo:", error);
      alert("Error al actualizar el plazo");
    }
  };

  // Eliminar plazo
  const eliminar = async (id_plazo) => {
    if (!window.confirm("¿Eliminar plazo?")) return;
    try {
      await deletePlazo({
        variables: { idPlazo: id_plazo }
      });
    } catch (error) {
      console.error("Error al eliminar plazo:", error);
      alert("Error al eliminar el plazo");
    }
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
            onClick={() => refetchPlazos()}
            disabled={!expId}
            style={{
              background: expId ? "#111" : "#999",
              color: "#fff",
              padding: "8px 12px",
              borderRadius: 6,
            }}
          >
            {loadingPlazos ? "Cargando..." : "Listar plazos"}
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
            disabled={!expId || !desc.trim() || !fecha || creating}
            style={{
              background: !expId || !desc.trim() || !fecha ? "#999" : "#111",
              color: "#fff",
              padding: "8px 12px",
              borderRadius: 6,
              height: 40,
              opacity: creating ? 0.7 : 1,
            }}
          >
            {creating ? "Creando..." : "Crear"}
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
        </div>
      )}
    </div>
  );
}
