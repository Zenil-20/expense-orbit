import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import AuthLayout from "./AuthLayout";
import { Input, Button } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

export default function RegisterPage() {
  const { status, register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);

  if (status === "authenticated") return <Navigate to="/app" replace />;

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const user = await register(form);
      toast.success("Account created", `Welcome to Expense Orbit, ${user.name}`);
      navigate("/app");
    } catch (err) {
      toast.error("Sign-up failed", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create account"
      subtitle="A few details and you're in."
      footer={<>Have an account? <Link to="/login">Sign in</Link></>}
    >
      <form onSubmit={submit} className="stack gap-4" noValidate>
        <Input label="Full name" name="name" required value={form.name} onChange={onChange} autoComplete="name" placeholder="Your name" />
        <Input label="Email" name="email" type="email" required value={form.email} onChange={onChange} autoComplete="email" placeholder="you@example.com" />
        <Input label="Password" name="password" type="password" minLength={6} required value={form.password} onChange={onChange} autoComplete="new-password" placeholder="At least 6 characters" hint="Use 6+ characters with a mix of letters and numbers." />
        <Button type="submit" variant="primary" size="lg" block loading={submitting}>
          {submitting ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </AuthLayout>
  );
}
