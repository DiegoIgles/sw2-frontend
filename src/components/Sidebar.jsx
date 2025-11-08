import { NavLink } from "react-router-dom";

const base = { display:'block', padding:'8px 12px', borderRadius:6, textDecoration:'none', color:'#111' };
const active = { ...base, background:'#f1f5f9' };

export default function Sidebar() {
  return (
    <div style={{width:220, borderRight:'1px solid #eee', padding:12, display:'flex', flexDirection:'column', gap:6}}>
      <NavLink to="/" style={({isActive})=> isActive?active:base}>Dashboard</NavLink>
      <NavLink to="/clientes" style={({isActive})=> isActive?active:base}>Clientes</NavLink>
      <NavLink to="/expedientes" style={({isActive})=> isActive?active:base}>Expedientes</NavLink>
      <NavLink to="/notas" style={({isActive})=> isActive?active:base}>Notas</NavLink>
      <NavLink to="/plazos" style={({isActive})=> isActive?active:base}>Plazos</NavLink>
      <NavLink to="/documentos" style={({isActive})=> isActive?active:base}>Documentos</NavLink>
    </div>
  );
}
