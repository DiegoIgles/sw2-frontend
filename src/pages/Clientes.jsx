import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { GET_CLIENTES, CREATE_CLIENTE } from "../graphql/queries";
import Table from "../components/Table";

export default function Clientes() {
  const [err, setErr] = useState("");

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [tel, setTel] = useState("");

  // Query para listar clientes
  const { data, loading, refetch } = useQuery(GET_CLIENTES, {
    variables: { limit: 100, offset: 0 },
    onError: (e) => {
      setErr(e?.graphQLErrors?.[0]?.message || e?.message || "Error al listar clientes");
    }
  });

  // Mutation para crear cliente
  const [createCliente, { loading: creating }] = useMutation(CREATE_CLIENTE, {
    refetchQueries: [{ query: GET_CLIENTES, variables: { limit: 100, offset: 0 } }],
    onError: (e) => {
      setErr(e?.graphQLErrors?.[0]?.message || e?.message || "Error al crear cliente");
    },
    onCompleted: () => {
      setNombre("");
      setEmail("");
      setTel("");
      setErr("");
    }
  });

  // Normalizar datos de GraphQL (camelCase) a formato de tabla
  const rows = (data?.clientes || []).map(c => ({
    id_cliente: c.idCliente,
    nombre_completo: c.nombreCompleto,
    contacto_email: c.contactoEmail ?? "",
    contacto_tel: c.contactoTel ?? "",
    fecha_creacion: c.fechaRegistro,
  }));

  // crear
  const crear = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      await createCliente({
        variables: {
          nombreCompleto: nombre,
          contactoEmail: email || null,
          contactoTel: tel || null,
        }
      });
    } catch (e) {
      // El error ya se maneja en onError del mutation
    }
  };

  return (
    <div className="space-y-4">
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <h1 style={{fontSize:18, fontWeight:600}}>Clientes</h1>
        <div style={{display:'flex', gap:8, alignItems:'center'}}>
          {loading && <span style={{fontSize:12, opacity:.7}}>Cargando...</span>}
          <button onClick={() => refetch()} style={{border:'1px solid #ddd', padding:'6px 10px', borderRadius:6}}>Recargar</button>
        </div>
      </div>

      {err && <div style={{color:'#b00', fontSize:13}}>{err}</div>}

      <form onSubmit={crear} style={{display:'flex', gap:8, flexWrap:'wrap'}}>
        <input placeholder="Nombre" value={nombre} onChange={e=>setNombre(e.target.value)} style={{padding:8, border:'1px solid #ddd', borderRadius:6}}/>
        <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} style={{padding:8, border:'1px solid #ddd', borderRadius:6}}/>
        <input placeholder="Tel" value={tel} onChange={e=>setTel(e.target.value)} style={{padding:8, border:'1px solid #ddd', borderRadius:6}}/>
        <button disabled={creating} style={{background:'#111', color:'#fff', padding:'8px 12px', borderRadius:6, opacity:creating?0.7:1}}>
          {creating ? "Creando..." : "Crear"}
        </button>
      </form>

      <Table
  cols={["ID","Nombre","Email","Tel","Fecha"]}
  rows={rows.map(c => ({
    "ID": c.id_cliente,
    "Nombre": c.nombre_completo,
    "Email": c.contacto_email || "",
    "Tel": c.contacto_tel || "",
    "Fecha": c.fecha_creacion ? new Date(c.fecha_creacion).toLocaleString() : "-"
  }))}
/>

    </div>
  );
}
