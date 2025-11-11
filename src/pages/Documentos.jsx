import { useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import { GET_EXPEDIENTES, GET_ADMIN_DOCUMENTOS } from "../graphql/queries";
import docs from "../api/axiosDocs"; // Para descarga (REST directo)

const LIMIT_DEFAULT = 25;

// ---- Helper: formatea bytes a KB/MB/GB ----
const formatBytes = (value) => {
  const bytes = Number(value);
  if (!bytes || Number.isNaN(bytes)) return "-";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const num = bytes / Math.pow(1024, i);
  const decimals = i <= 1 ? 0 : 1;
  return `${num.toFixed(decimals)} ${units[i]}`;
};

export default function Documentos() {
  const [err, setErr] = useState("");

  // Paginación
  const [limit, setLimit] = useState(LIMIT_DEFAULT);
  const [offset, setOffset] = useState(0);

  // Filtros UI
  const [expId, setExpId] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Query para cargar expedientes (selector)
  const { data: expedientesData, loading: loadingExp, refetch: refetchExpedientes } = useQuery(GET_EXPEDIENTES, {
    variables: { limit: 200, offset: 0, q: searchTerm || null },
  });

  const expedientes = expedientesData?.expedientes || [];

  // Query para listar documentos (admin)
  const { data: documentosData, loading, error, refetch } = useQuery(GET_ADMIN_DOCUMENTOS, {
    variables: { limit, offset },
    onError: (e) => {
      setErr(e?.graphQLErrors?.[0]?.message || e?.message || "Error al listar documentos");
    }
  });

  // Normalizar datos de GraphQL (camelCase) a formato de tabla
  const rows = (documentosData?.adminDocumentos || []).map(d => ({
    doc_id: d.docId,
    filename: d.filename,
    size: d.size,
    id_cliente: d.idCliente,
    id_expediente: d.idExpediente,
    created_at: d.createdAt,
  }));

  const descargar = async (doc_id) => {
    try {
      // Descarga directa por REST (no está en GraphQL)
      const res = await docs.get(`/documentos/${doc_id}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `${doc_id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("No se pudo descargar el documento");
    }
  };

  // Filtro en memoria (sobre la página actual)
  const filtered = useMemo(() => {
    let out = rows;

    if (expId.trim() !== "") {
      const expNum = Number(expId.trim());
      if (!Number.isNaN(expNum)) {
        out = out.filter(r => Number(r.id_expediente) === expNum);
      }
    }
    if (desde) {
      const d = new Date(desde + "T00:00:00");
      out = out.filter(r => new Date(r.created_at) >= d);
    }
    if (hasta) {
      const h = new Date(hasta + "T23:59:59");
      out = out.filter(r => new Date(r.created_at) <= h);
    }
    return out;
  }, [rows, expId, desde, hasta]);

  const paginaSiguiente = () => setOffset(o => o + limit);
  const paginaAnterior = () => setOffset(o => Math.max(0, o - limit));

  // estilos pequeños
  const card = { border: "1px solid #e5e7eb", borderRadius: 8, padding: 12, background: "#fff" };
  const help = { fontSize: 12, color: "#64748b", marginTop: 4 };

  return (
    <div className="space-y-4">
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:8}}>
        <h1 style={{fontSize:18, fontWeight:600}}>Documentos (admin público)</h1>
        <div style={{display:'flex', gap:8, alignItems:'center'}}>
          {loading && <span style={{fontSize:12, opacity:.7}}>Cargando...</span>}
          <button onClick={() => refetch()} style={{border:'1px solid #ddd', padding:'6px 10px', borderRadius:6}}>Recargar</button>
        </div>
      </div>

      {err && <div style={{color:'#b00', fontSize:13}}>{err}</div>}
      {error && <div style={{color:'#b00', fontSize:13}}>{error?.message || "Error al cargar documentos"}</div>}

      {/* Filtros */}
      <div style={{ ...card, display:'grid', gap:12 }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>Filtros</div>
        <div style={{display:'flex', gap:8, flexWrap:'wrap', alignItems:'center'}}>

          {/* Selector de expediente + búsqueda de expedientes */}
          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <select
                value={expId}
                onChange={(e) => setExpId(e.target.value)}
                style={{ padding: 8, border: "1px solid #ddd", borderRadius: 6, minWidth: 260 }}
              >
                <option value="">{loadingExp ? "Cargando expedientes..." : "— Filtrar por expediente —"}</option>
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
            </div>
            <div style={help}>
              Selecciona un expediente para ver solo sus documentos en la lista actual.
            </div>
          </div>

          {/* Fechas de carga (created_at) */}
          <div style={{display:'flex', gap:6, alignItems:'center'}}>
            <label style={{fontSize:13, opacity:.8}}>Desde</label>
            <input type="date" value={desde} onChange={e=>setDesde(e.target.value)}
                   style={{padding:8, border:'1px solid #ddd', borderRadius:6}}/>
          </div>
          <div style={{display:'flex', gap:6, alignItems:'center'}}>
            <label style={{fontSize:13, opacity:.8}}>Hasta</label>
            <input type="date" value={hasta} onChange={e=>setHasta(e.target.value)}
                   style={{padding:8, border:'1px solid #ddd', borderRadius:6}}/>
          </div>

          {/* Paginación */}
          <div style={{display:'flex', gap:8, alignItems:'center', marginLeft:'auto'}}>
            <label style={{fontSize:13, opacity:.8}}>Límite</label>
            <input
              type="number" value={limit}
              onChange={e=>setLimit(Math.max(1, Math.min(200, Number(e.target.value) || LIMIT_DEFAULT)))}
              style={{width:90, padding:8, border:'1px solid #ddd', borderRadius:6}}
            />
            <label style={{fontSize:13, opacity:.8}}>Offset</label>
            <input
              type="number" value={offset}
              onChange={e=>setOffset(Math.max(0, Number(e.target.value) || 0))}
              style={{width:110, padding:8, border:'1px solid #ddd', borderRadius:6}}
            />
            <button onClick={paginaAnterior} disabled={offset===0}
                    style={{padding:'6px 10px', borderRadius:6, border:'1px solid #ddd'}}>◀ Anterior</button>
            <button onClick={paginaSiguiente}
                    style={{padding:'6px 10px', borderRadius:6, border:'1px solid #ddd'}}>Siguiente ▶</button>
          </div>
        </div>
      </div>

      {/* Tabla propia para poder poner el botón por fila */}
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%', borderCollapse:'separate', borderSpacing:0}}>
          <thead>
            <tr>
              {["filename","tamaño","id_cliente","id_expediente","creado","acciones"].map(h=>(
                <th key={h} style={{textAlign:'left', padding:'12px', borderBottom:'1px solid #eee', fontWeight:600}}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, idx)=>(
              <tr key={r.doc_id || idx}>
                <td style={{padding:'10px 12px', borderBottom:'1px solid #f1f1f1'}}>{r.filename}</td>
                <td style={{padding:'10px 12px', borderBottom:'1px solid #f1f1f1', textAlign:'right'}}>
                  {formatBytes(r.size)}
                </td>
                <td style={{padding:'10px 12px', borderBottom:'1px solid #f1f1f1'}}>{r.id_cliente}</td>
                <td style={{padding:'10px 12px', borderBottom:'1px solid #f1f1f1'}}>{r.id_expediente}</td>
                <td style={{padding:'10px 12px', borderBottom:'1px solid #f1f1f1'}}>
                  {r.created_at ? new Date(r.created_at).toLocaleString() : "-"}
                </td>
                <td style={{padding:'10px 12px', borderBottom:'1px solid #f1f1f1'}}>
                  <button
                    onClick={() => descargar(r.doc_id)}
                    style={{ padding:'6px 10px', borderRadius:6, border:'1px solid #ddd' }}
                  >
                    Descargar
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && !loading && (
              <tr>
                <td colSpan={6} style={{padding:'16px', color:'#777'}}>Sin resultados</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
