import { Routes, Route, Navigate } from "react-router-dom";
import PrivateRoute from "./auth/PrivateRoute";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Clientes";
import Expedientes from "./pages/Expedientes";
import Documentos from "./pages/Documentos";
import Notas from "./pages/Notas";
import Plazos from "./pages/Plazos";
import ExpedientesCrear from "./pages/ExpedientesCrear";
import Regresion from "./pages/Regresion";
function Layout({ children }) {
  return (
    <div style={{display:'flex', flexDirection:'column', height:'100vh'}}>
      <Navbar/>
      <div style={{display:'flex', flex:1}}>
        <Sidebar/>
        <div style={{flex:1, overflow:'auto', padding:'16px'}}>{children}</div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login/>} />
      <Route
        path="/*"
        element={
          <PrivateRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard/>} />
                <Route path="/clientes" element={<Clientes/>} />
                <Route path="/expedientes" element={<Expedientes/>} />
                <Route path="/expedientes/nuevo" element={<ExpedientesCrear/>} />
                <Route path="/documentos" element={<Documentos/>} />
                <Route path="/notas" element={<Notas/>} />
                <Route path="/plazos" element={<Plazos/>} />
                <Route path="/regresion" element={<Regresion/>} />
                <Route path="*" element={<Navigate to="/" replace/>} />
              </Routes>
            </Layout>
          </PrivateRoute>
        }
      />
    </Routes>
  );
}
