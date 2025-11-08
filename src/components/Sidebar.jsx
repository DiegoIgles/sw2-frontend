import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";

const links = [
  { to: "/",           label: "Dashboard",   icon: "📊" },
  { to: "/clientes",   label: "Clientes",    icon: "👥" },
  { to: "/expedientes",label: "Expedientes", icon: "🗂️" },
  { to: "/notas",      label: "Notas",       icon: "📝" },
  { to: "/plazos",     label: "Plazos",      icon: "⏰" },
  { to: "/documentos", label: "Documentos",  icon: "📄" },
];

const baseLink = (collapsed) => ({
  display: "flex",
  alignItems: "center",
  gap: collapsed ? 0 : 10,
  padding: "8px 12px",
  borderRadius: 6,
  textDecoration: "none",
  color: "#111",
  justifyContent: collapsed ? "center" : "flex-start",
  whiteSpace: "nowrap",
  overflow: "hidden",
});

const activeLink = (collapsed) => ({
  ...baseLink(collapsed),
  background: "#f1f5f9",
});

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  // Persistir estado en localStorage
  useEffect(() => {
    const saved = localStorage.getItem("sidebar:collapsed");
    if (saved === "1") setCollapsed(true);
  }, []);
  useEffect(() => {
    localStorage.setItem("sidebar:collapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  const container = {
    width: collapsed ? 64 : 220,
    borderRight: "1px solid #eee",
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 6,
    transition: "width .2s ease",
    position: "sticky",
    top: 0,
    height: "100vh",
    background: "#fff",
  };

  const toggleWrap = {
    display: "flex",
    alignItems: "center",
    justifyContent: collapsed ? "center" : "flex-end",
    marginBottom: 8,
  };

  const toggleBtn = {
    border: "1px solid #e5e7eb",
    borderRadius: 6,
    background: "#f8fafc",
    padding: 6,
    cursor: "pointer",
    width: collapsed ? 36 : 40,
    height: 32,
  };

  const iconBox = {
    width: 24,
    height: 24,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
  };

  return (
    <div style={container}>
      {/* Botón minimizar/expandir */}
      <div style={toggleWrap}>
        <button
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
          title={collapsed ? "Expandir" : "Colapsar"}
          style={toggleBtn}
        >
          {collapsed ? "➡️" : "⬅️"}
        </button>
      </div>

      {/* Enlaces */}
      {links.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          title={l.label} // tooltip útil cuando está colapsado
          style={({ isActive }) => (isActive ? activeLink(collapsed) : baseLink(collapsed))}
        >
          <span style={iconBox} aria-hidden="true">{l.icon}</span>
          {!collapsed && <span>{l.label}</span>}
        </NavLink>
      ))}
    </div>
  );
}
