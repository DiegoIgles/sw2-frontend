import { useEffect, useState } from "react";
import api from "../api/axiosCore";
import Table from "../components/Table";

export default function Clientes() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [tel, setTel] = useState("");

  // listar todos
  const listar = async () => {
    setLoading(true);
    setErr("");
    try {
      const { data } = await api.get("/clientes"); // <- GET /clientes
      // normaliza por si faltaran campos
      const mapped = (data || []).map(c => ({
        id_cliente: c.id_cliente,
        nombre_completo: c.nombre_completo,
        contacto_email: c.contacto_email ?? "",
        contacto_tel: c.contacto_tel ?? "",
        fecha_creacion: c.fecha_creacion,
      }));
      setRows(mapped);
    } catch (e) {
      setErr(e?.response?.data?.message || "Error al listar clientes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    listar();
  }, []);

  // crear
  const crear = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      const { data } = await api.post("/clientes", {
        nombre_completo: nombre,
        contacto_email: email || null,
        contacto_tel: tel || null,
      });
      // agrega al inicio y limpia, o simplemente vuelve a listar()
      setRows(r => [data, ...r]);
      setNombre(""); setEmail(""); setTel("");
    } catch (e) {
      setErr(e?.response?.data?.message || "Error al crear cliente");
    }
  };

  return (
    <div className="space-y-4">
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <h1 style={{fontSize:18, fontWeight:600}}>Clientes</h1>
        <div style={{display:'flex', gap:8, alignItems:'center'}}>
          {loading && <span style={{fontSize:12, opacity:.7}}>Cargando...</span>}
          <button onClick={listar} style={{border:'1px solid #ddd', padding:'6px 10px', borderRadius:6}}>Recargar</button>
        </div>
      </div>

      {err && <div style={{color:'#b00', fontSize:13}}>{err}</div>}

      <form onSubmit={crear} style={{display:'flex', gap:8, flexWrap:'wrap'}}>
        <input placeholder="Nombre" value={nombre} onChange={e=>setNombre(e.target.value)} style={{padding:8, border:'1px solid #ddd', borderRadius:6}}/>
        <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} style={{padding:8, border:'1px solid #ddd', borderRadius:6}}/>
        <input placeholder="Tel" value={tel} onChange={e=>setTel(e.target.value)} style={{padding:8, border:'1px solid #ddd', borderRadius:6}}/>
        <button style={{background:'#111', color:'#fff', padding:'8px 12px', borderRadius:6}}>Crear</button>
      </form>

      <Table
        cols={["ID","Nombre","Email","Tel","Fecha"]}
        rows={rows.map(c=>({
          id: c.id_cliente,
          nombre: c.nombre_completo,
          email: c.contacto_email,
          tel: c.contacto_tel,
          fecha: c.fecha_creacion ? new Date(c.fecha_creacion).toLocaleString() : "-"
        }))}
      />
    </div>
  );
}
