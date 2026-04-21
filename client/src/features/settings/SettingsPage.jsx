import Card from "../../components/ui/Card";
import ReminderEmailCard from "./ReminderEmailCard";
import CategoriesCard from "./CategoriesCard";
import { useAuth } from "../../context/AuthContext";

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="page-transition">
      <div className="page-head">
        <div>
          <div className="page-title">Settings</div>
          <div className="page-sub">Manage how Expense Orbit reaches you.</div>
        </div>
      </div>

      <div className="stack gap-5">
        <Card title="Account" subtitle="These identify you inside the app.">
          <div className="row gap-6 wrap">
            <InfoPair label="Name" value={user?.name} />
            <InfoPair label="Login email" value={user?.email} />
          </div>
        </Card>

        <ReminderEmailCard />
        <CategoriesCard />
      </div>
    </div>
  );
}

function InfoPair({ label, value }) {
  return (
    <div style={{ minWidth: 180 }}>
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-mute)", fontWeight: 700 }}>{label}</div>
      <div style={{ marginTop: 4, fontSize: 15, color: "#F8FAFC", fontWeight: 600 }}>{value || "-"}</div>
    </div>
  );
}
