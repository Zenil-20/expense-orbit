import { NavLink } from "react-router-dom";
import { NAV_ITEMS } from "./navItems";

export default function MobileNav() {
  return (
    <nav className="mobile-nav" aria-label="Primary">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => `mobile-nav-item ${isActive ? "is-active" : ""}`}
        >
          <span className="mobile-nav-icon" aria-hidden>{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
