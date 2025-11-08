import { useAuth } from "../auth/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  return (
    <div style={{background:'#111', color:'#fff', padding:'8px 12px', display:'flex', justifyContent:'space-between'}}>
      <div style={{fontWeight:600}}>Admin Legal</div>
      <div style={{display:'flex', gap:12, alignItems:'center'}}>
        <span style={{opacity:0.8, fontSize:12}}>{user?.email}</span>
        <button onClick={logout} style={{background:'#fff1', color:'#fff', border:'1px solid #fff3', padding:'4px 10px', borderRadius:6, cursor:'pointer'}}>
          Salir
        </button>
      </div>
    </div>
  );
}
