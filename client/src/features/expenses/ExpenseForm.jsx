import { useEffect, useState } from "react";
import { Input, Select, Button } from "../../components/ui";
import { DEFAULT_CATEGORIES } from "../../lib/categories";
import { toInputDate } from "../../lib/format";

const TYPES = [
  { value: "recurring", label: "Recurring" },
  { value: "one-time", label: "One-time" },
  { value: "flexible", label: "Flexible" }
];
const FREQS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" }
];

function emptyForm() {
  return {
    name: "",
    amount: "",
    type: "one-time",
    recurringType: "monthly",
    category: "Other",
    date: toInputDate(new Date())
  };
}

export default function ExpenseForm({ expense, categories, onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (expense) {
      setForm({
        name: expense.name || "",
        amount: expense.amount ?? "",
        type: expense.type || "one-time",
        recurringType: expense.recurringType || "monthly",
        category: expense.category || "Other",
        date: toInputDate(expense.type === "recurring" ? expense.nextDueDate || expense.date : expense.date)
      });
    } else {
      setForm(emptyForm());
    }
  }, [expense]);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    onSubmit({
      name: form.name.trim(),
      amount: Number(form.amount),
      type: form.type,
      recurringType: form.type === "recurring" ? form.recurringType : null,
      category: form.category,
      date: form.date
    });
  };

  const cats = categories?.length ? categories : DEFAULT_CATEGORIES;

  return (
    <form onSubmit={submit} className="stack gap-4" noValidate>
      <Input label="Name" name="name" required value={form.name} onChange={onChange} placeholder="e.g. Electricity bill" />
      <div className="row gap-4 wrap">
        <div style={{ flex: 1, minWidth: 140 }}>
          <Input label="Amount (₹)" name="amount" type="number" inputMode="decimal" step="0.01" min="0.01" required value={form.amount} onChange={onChange} placeholder="0" />
        </div>
        <div style={{ flex: 1, minWidth: 140 }}>
          <Select label="Type" name="type" value={form.type} onChange={onChange}>
            {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </Select>
        </div>
      </div>
      <div className="row gap-4 wrap">
        <div style={{ flex: 1, minWidth: 140 }}>
          <Select label="Category" name="category" value={form.category} onChange={onChange}>
            {cats.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </div>
        {form.type === "recurring" && (
          <div style={{ flex: 1, minWidth: 140 }}>
            <Select label="Frequency" name="recurringType" value={form.recurringType} onChange={onChange}>
              {FREQS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </Select>
          </div>
        )}
      </div>
      <Input
        label={form.type === "recurring" ? "Next due date" : "Date"}
        name="date"
        type="date"
        value={form.date}
        onChange={onChange}
        max={form.type === "recurring" ? undefined : toInputDate(new Date())}
        hint={form.type === "recurring"
          ? "When the next payment is due — can be today or in the future."
          : "One-time and flexible expenses record what already happened. Future dates aren't allowed."}
      />
      <div className="row gap-3" style={{ justifyContent: "flex-end" }}>
        <Button variant="ghost" type="button" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" type="submit" loading={submitting}>
          {expense ? "Save changes" : "Create expense"}
        </Button>
      </div>
    </form>
  );
}
