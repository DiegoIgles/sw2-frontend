import axios from "axios";

// usa tu .env (mejor que hardcodear puertos)
const docs = axios.create({ baseURL: process.env.REACT_APP_API_DOCS || "http://localhost:8081" });

docs.interceptors.request.use(cfg => {
  // ⛔️ No adjuntar Authorization para endpoints públicos
  if (cfg.url?.startsWith("/admin/")) {
    return cfg;
  }
  // ✅ Adjuntar token para el resto (subida, descarga protegida, etc.)
  const t = localStorage.getItem("token");
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

export default docs;
