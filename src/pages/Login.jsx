import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("admin@legal.com");
  const [password, setPassword] = useState("TuPassword123");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  // Si ya hay sesión, ir al dashboard
  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await login(email, password);          // <- esto setea el user en el contexto
      navigate("/", { replace: true });      // <- redirige al dashboard
    } catch (e) {
      // Manejar errores de GraphQL
      const errorMessage = e?.graphQLErrors?.[0]?.message || 
                           e?.networkError?.message || 
                           e?.message || 
                           "Error de login";
      setErr(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{minHeight:'100vh', display:'grid', placeItems:'center'}}>
      <form onSubmit={onSubmit} style={{width:320, border:'1px solid #eee', borderRadius:8, padding:16, display:'grid', gap:8}}>
        <h1 style={{fontSize:18, fontWeight:600}}>Admin Login</h1>
        {err && <div style={{color:'#c00', fontSize:12}}>{err}</div>}
        <input
          value={email}
          onChange={e=>setEmail(e.target.value)}
          placeholder="email"
          style={{padding:8, border:'1px solid #ddd', borderRadius:6}}
          disabled={loading}
        />
        <input
          type="password"
          value={password}
          onChange={e=>setPassword(e.target.value)}
          placeholder="password"
          style={{padding:8, border:'1px solid #ddd', borderRadius:6}}
          disabled={loading}
        />
        <button disabled={loading} style={{background:'#111', color:'#fff', padding:'8px', borderRadius:6, opacity:loading?0.7:1}}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
