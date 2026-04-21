import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import MobileNav from "./MobileNav";

export default function AppShell() {
  const location = useLocation();
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <Topbar />
        <main className="app-content" key={location.pathname}>
          <Outlet />
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
