import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axiosCore";

export default function ExpedientesList() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [clienteId, setClienteId] = useState(""); // <- filtro

  const cargar = async (idCli) => {
    setErr(""); setLoading(true);
    try {
      const params = {};
      if (idCli && !Number.isNaN(Number(idCli))) {
        params.id_cliente = Number(idCli);
      }
      const { data } = await api.get("/expedientes", { params });
      setRows(data || []);
    } catch (e) {
      setErr(e?.response?.data?.message || "No se pudo listar expedientes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const buscar = () => cargar(clienteId);
  const limpiar = () => { setClienteId(""); cargar(); };

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      buscar();
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

      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%', borderCollapse:'separate', borderSpacing:0}}>
          <thead>
            <tr>
              {["ID","Título","Estado","Cliente","Creado"].map(h=>(
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
                  {x.cliente?.id_cliente ?? x.id_cliente ?? "-"}
                </td>
                <td style={{padding:'10px 12px', borderBottom:'1px solid #f1f1f1'}}>
                  {x.fecha_creacion ? new Date(x.fecha_creacion).toLocaleString() : "-"}
                </td>
              </tr>
            ))}
            {rows.length === 0 && !loading && (
              <tr><td colSpan={5} style={{padding:16, color:'#777'}}>Sin expedientes</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
