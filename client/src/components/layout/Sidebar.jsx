import { NavLink } from "react-router-dom";
import { Wordmark } from "../brand/Logo";
import { useAuth } from "../../context/AuthContext";
import { NAV_ITEMS } from "./navItems";

export default function Sidebar() {
  const { user } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand"><Wordmark /></div>

      <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `nav-item ${isActive ? "is-active" : ""}`}
          >
            <span className="nav-icon" aria-hidden>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {user && (
        <div className="sidebar-foot">
          <div className="sidebar-foot-name">{user.name}</div>
          <div style={{ marginTop: 2 }}>{user.email}</div>
        </div>
      )}
    </aside>
  );
}
