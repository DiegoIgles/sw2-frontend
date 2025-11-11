import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation } from "@apollo/client";
import { GET_EXPEDIENTES, UPDATE_EXPEDIENTE } from "../graphql/queries";

const ESTADOS = ["ABIERTO", "EN_PROCESO", "CERRADO"];

export default function ExpedientesList() {
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [clienteId, setClienteId] = useState("");

  // Modal editar estado
  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [editEstado, setEditEstado] = useState("");

  // Query para listar expedientes
  const { data, loading, refetch } = useQuery(GET_EXPEDIENTES, {
    variables: {
      limit: 200,
      offset: 0,
      idCliente: clienteId && !Number.isNaN(Number(clienteId)) ? Number(clienteId) : null,
    },
    onError: (e) => {
      setErr(e?.graphQLErrors?.[0]?.message || e?.message || "No se pudo listar expedientes");
    }
  });

  // Mutation para actualizar expediente
  const [updateExpediente, { loading: saving }] = useMutation(UPDATE_EXPEDIENTE, {
    refetchQueries: [{ query: GET_EXPEDIENTES, variables: { limit: 200, offset: 0, idCliente: clienteId && !Number.isNaN(Number(clienteId)) ? Number(clienteId) : null } }],
    onError: (e) => {
      const msg = e?.graphQLErrors?.[0]?.message || e?.message || "No se pudo actualizar el estado";
      setErr(Array.isArray(msg) ? msg.join(", ") : msg);
    },
    onCompleted: () => {
      setOk(`Estado actualizado a "${editEstado}" para #${editRow?.id_expediente}`);
      setEditOpen(false);
      setEditRow(null);
      setEditEstado("");
    }
  });

  // Normalizar datos de GraphQL a formato de tabla
  const rows = (data?.expedientes || []).map(x => ({
    id_expediente: x.idExpediente,
    titulo: x.titulo,
    estado: x.estado,
    id_cliente: x.idCliente,
    fecha_creacion: x.fechaCreacion,
  }));

  const buscar = () => {
    refetch({
      limit: 200,
      offset: 0,
      idCliente: clienteId && !Number.isNaN(Number(clienteId)) ? Number(clienteId) : null,
    });
  };

  const limpiar = () => {
    setClienteId("");
    refetch({
      limit: 200,
      offset: 0,
      idCliente: null,
    });
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      buscar();
    }
  };

  // ---- Editar estado ----
  const openEdit = (row) => {
    setEditRow(row);
    setEditEstado(row?.estado || "ABIERTO");
    setErr("");
    setOk("");
    setEditOpen(true);
  };

  const closeEdit = () => {
    if (saving) return;
    setEditOpen(false);
    setEditRow(null);
    setEditEstado("");
    setErr("");
  };

  const saveEdit = async () => {
    if (!editRow) return;
    setErr("");
    try {
      await updateExpediente({
        variables: {
          id: editRow.id_expediente,
          estado: editEstado,
        }
      });
    } catch (e) {
      // El error ya se maneja en onError del mutation
    }
  };

  return (
    <div className="space-y-4">
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, flexWrap:'wrap'}}>
        <h1 style={{fontSize:18, fontWeight:600}}>Expedientes</h1>
        <div style={{display:'flex', gap:8, alignItems:'center'}}>
          <input
            placeholder="Filtrar por ID de cliente"
            value={clienteId}
            onChange={e=>setClienteId(e.target.value)}
            onKeyDown={onKeyDown}
            style={{padding:8, border:'1px solid #ddd', borderRadius:6, width:220}}
          />
          <button onClick={buscar} style={{border:'1px solid #ddd', padding:'8px 12px', borderRadius:6}}>
            Buscar
          </button>
          <button onClick={limpiar} style={{border:'1px solid #ddd', padding:'8px 12px', borderRadius:6}}>
            Limpiar
          </button>
          <Link to="/expedientes/nuevo">
            <button style={{background:'#111', color:'#fff', padding:'8px 12px', borderRadius:6}}>
              + Nuevo expediente
            </button>
          </Link>
        </div>
      </div>

      {loading && <div style={{fontSize:12, opacity:.7}}>Cargando…</div>}
      {err && <div style={{color:'#b00', fontSize:13}}>{err}</div>}
      {ok && <div style={{color:'#126b12', fontSize:13}}>{ok}</div>}

      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%', borderCollapse:'separate', borderSpacing:0}}>
          <thead>
            <tr>
              {["ID","Título","Estado","Cliente","Creado","Acciones"].map(h=>(
                <th key={h} style={{textAlign:'left', padding:'12px', borderBottom:'1px solid #eee', fontWeight:600}}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((x)=>(
              <tr key={x.id_expediente}>
                <td style={{padding:'10px 12px', borderBottom:'1px solid #f1f1f1'}}>{x.id_expediente}</td>
                <td style={{padding:'10px 12px', borderBottom:'1px solid #f1f1f1'}}>{x.titulo}</td>
                <td style={{padding:'10px 12px', borderBottom:'1px solid #f1f1f1'}}>{x.estado}</td>
                <td style={{padding:'10px 12px', borderBottom:'1px solid #f1f1f1'}}>
                  {x.id_cliente ?? "-"}
                </td>
                <td style={{padding:'10px 12px', borderBottom:'1px solid #f1f1f1'}}>
                  {x.fecha_creacion ? new Date(x.fecha_creacion).toLocaleString() : "-"}
                </td>
                <td style={{padding:'10px 12px', borderBottom:'1px solid #f1f1f1'}}>
                  <button
                    onClick={()=>openEdit(x)}
                    style={{padding:'6px 10px', border:'1px solid #ddd', borderRadius:6, background:'#fff'}}
                    title="Editar estado"
                  >
                    ✏️ Editar
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && !loading && (
              <tr><td colSpan={6} style={{padding:16, color:'#777'}}>Sin expedientes</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Editar Estado */}
      {editOpen && (
        <div
          style={{
            position:'fixed', inset:0, background:'rgba(0,0,0,.45)',
            display:'flex', alignItems:'center', justifyContent:'center', padding:16, zIndex:50
          }}
          onClick={closeEdit}
        >
          <div
            style={{background:'#fff', width:'100%', maxWidth:440, borderRadius:12, padding:16}}
            onClick={(e)=>e.stopPropagation()}
          >
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
              <h2 style={{fontSize:16, fontWeight:700}}>Editar estado — #{editRow?.id_expediente}</h2>
              <button onClick={closeEdit} style={{border:'1px solid #ddd', padding:'6px 10px', borderRadius:6}}>Cerrar</button>
            </div>

            <div style={{marginBottom:10, color:'#555'}}>
              <div style={{marginBottom:8}}>
                <div style={{fontSize:13, color:'#666'}}>Título</div>
                <div style={{fontWeight:600}}>{editRow?.titulo}</div>
              </div>

              <label style={{display:'block', marginBottom:6, fontSize:13, color:'#374151'}}>Estado</label>
              <select
                value={editEstado}
                onChange={e=>setEditEstado(e.target.value)}
                style={{width:'100%', padding:'10px 12px', border:'1px solid #d1d5db', borderRadius:8}}
              >
                {ESTADOS.map(op => <option key={op} value={op}>{op}</option>)}
              </select>

              {err && <div style={{color:'#b00', marginTop:8, fontSize:13}}>{err}</div>}
            </div>

            <div style={{display:'flex', justifyContent:'flex-end', gap:8}}>
              <button
                onClick={closeEdit}
                disabled={saving}
                style={{border:'1px solid #ddd', padding:'8px 12px', borderRadius:6, background:'#fff', opacity:saving?0.6:1}}
              >
                Cancelar
              </button>
              <button
                onClick={saveEdit}
                disabled={saving}
                style={{background:'#111', color:'#fff', padding:'8px 12px', borderRadius:6, opacity:saving?0.7:1}}
              >
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
