import { useEffect, useState } from "react";
import Card from "../../components/ui/Card";
import { Input, Button } from "../../components/ui";
import { getCategoryMeta, DEFAULT_CATEGORIES } from "../../lib/categories";
import { api } from "../../lib/api";
import { useToast } from "../../context/ToastContext";

export default function CategoriesCard() {
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    api.categories().then((d) => setCategories(d.categories || [])).catch(() => {});
  };
  useEffect(load, []);

  const add = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.addCategory({ category: name.trim() });
      toast.success("Category added", res.category);
      setName("");
      setCategories(res.categories || []);
    } catch (err) {
      toast.error("Couldn't add category", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const customs = categories.filter((c) => !DEFAULT_CATEGORIES.includes(c));

  return (
    <Card title="Categories" subtitle="Ten defaults plus any custom ones you add.">
      <form onSubmit={add} className="input-with-action" style={{ marginBottom: 16 }}>
        <Input name="category" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Fitness" maxLength={40} aria-label="New category" />
        <Button type="submit" variant="secondary" loading={submitting}>Add</Button>
      </form>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {categories.map((c) => {
          const meta = getCategoryMeta(c);
          const isCustom = customs.includes(c);
          return (
            <span key={c} style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "6px 12px",
              borderRadius: "var(--radius-full)",
              background: `${meta.accent}18`,
              border: `1px solid ${meta.accent}44`,
              fontSize: 13, fontWeight: 600, color: "#F8FAFC"
            }}>
              <span>{meta.icon}</span>{c}{isCustom && <small style={{ color: "var(--text-mute)", fontWeight: 500 }}>custom</small>}
            </span>
          );
        })}
      </div>
    </Card>
  );
}
