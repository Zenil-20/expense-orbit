import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import EmptyState from "../../components/ui/EmptyState";
import ExpenseForm from "./ExpenseForm";
import ExpenseCard from "./ExpenseCard";
import FilterBar from "./FilterBar";
import { useExpenses } from "./useExpenses";
import { api } from "../../lib/api";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";

export default function ExpensesPage() {
  const toast = useToast();
  const { user } = useAuth();
  const { expenses, loading, reload } = useExpenses();
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useSearchParams();

  const [modal, setModal] = useState({ open: false, expense: null });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState({ q: "", type: "", category: "", status: "" });

  useEffect(() => {
    api.categories().then((d) => setCategories(d.categories || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (search.get("new") === "1") {
      setModal({ open: true, expense: null });
      search.delete("new");
      setSearch(search, { replace: true });
    }
  }, [search, setSearch]);

  const filtered = useMemo(() => {
    const q = filter.q.trim().toLowerCase();
    return expenses.filter((e) => {
      if (q && !e.name.toLowerCase().includes(q)) return false;
      if (filter.type && e.type !== filter.type) return false;
      if (filter.category && e.category !== filter.category) return false;
      if (filter.status && e.status !== filter.status) return false;
      return true;
    });
  }, [expenses, filter]);

  const openNew = () => setModal({ open: true, expense: null });
  const openEdit = (expense) => setModal({ open: true, expense });
  const close = () => setModal({ open: false, expense: null });

  const onSubmit = async (payload) => {
    setSubmitting(true);
    try {
      if (modal.expense) {
        await api.updateExpense(modal.expense._id, payload);
        toast.success("Updated", `${payload.name} saved.`);
      } else {
        await api.createExpense(payload);
        toast.success("Created", `${payload.name} added.`);
      }
      await reload();
      close();
    } catch (err) {
      toast.error("Couldn't save", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const onMarkPaid = async (expense) => {
    try {
      await api.markPaid(expense._id);
      toast.success("Marked paid", expense.name);
      reload();
    } catch (err) {
      toast.error("Action failed", err.message);
    }
  };

  const onDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteExpense(deleteTarget._id);
      toast.success("Deleted", deleteTarget.name);
      setDeleteTarget(null);
      reload();
    } catch (err) {
      toast.error("Couldn't delete", err.message);
    }
  };

  const onTestOverdue = async (expense) => {
    if (!user?.reminderEmailVerified) {
      toast.warning("Verify a reminder email first", "Head to Settings to enable email reminders.");
      return;
    }
    try {
      const res = await api.testOverdue(expense._id);
      toast.success("Test email sent", res.message);
    } catch (err) {
      toast.error("Couldn't send test", err.message);
    }
  };

  return (
    <div className="page-transition">
      <div className="page-head">
        <div>
          <div className="page-title">Expenses</div>
          <div className="page-sub">Every recurring, one-time, and flexible cost you track.</div>
        </div>
        <Button variant="primary" onClick={openNew}>+ Add expense</Button>
      </div>

      <FilterBar value={filter} onChange={setFilter} categories={categories} />

      {loading ? (
        <div className="stack gap-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 72 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={expenses.length === 0 ? "No expenses yet" : "Nothing matches those filters"}
          description={expenses.length === 0 ? "Add your first expense to start tracking." : "Try clearing a filter."}
          action={expenses.length === 0 ? <Button variant="primary" onClick={openNew}>+ Add expense</Button> : null}
        />
      ) : (
        <div className="exp-list">
          {filtered.map((e) => (
            <ExpenseCard
              key={e._id}
              expense={e}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
              onMarkPaid={onMarkPaid}
              onTestOverdue={onTestOverdue}
            />
          ))}
        </div>
      )}

      <Modal
        open={modal.open}
        onClose={close}
        title={modal.expense ? "Edit expense" : "New expense"}
      >
        <ExpenseForm
          expense={modal.expense}
          categories={categories}
          onSubmit={onSubmit}
          onCancel={close}
          submitting={submitting}
        />
      </Modal>

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete expense?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={onDelete}>Delete permanently</Button>
          </>
        }
      >
        <p style={{ color: "var(--text-soft)" }}>
          This will permanently remove <strong style={{ color: "#F8FAFC" }}>{deleteTarget?.name}</strong>. You can't undo this.
        </p>
      </Modal>
    </div>
  );
}
