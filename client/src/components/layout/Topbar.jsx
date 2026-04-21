import { Wordmark } from "../brand/Logo";
import UserMenu from "./UserMenu";

export default function Topbar() {
  return (
    <header className="topbar">
      <div className="topbar-brand"><Wordmark /></div>
      <div className="topbar-actions">
        <UserMenu />
      </div>
    </header>
  );
}
