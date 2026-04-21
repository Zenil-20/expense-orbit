import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import AuthLayout from "./AuthLayout";
import { Input, Button } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

export default function LoginPage() {
  const { status, login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (status === "authenticated") return <Navigate to="/app" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const user = await login({ email, password });
      toast.success("Welcome back", `Signed in as ${user.name}`);
      navigate("/app");
    } catch (err) {
      toast.error("Sign-in failed", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Welcome back to Expense Orbit."
      footer={<>New here? <Link to="/register">Create an account</Link></>}
    >
      <form onSubmit={submit} className="stack gap-4" noValidate>
        <Input
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
        <Input
          label="Password"
          type="password"
          name="password"
          autoComplete="current-password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 6 characters"
        />
        <Button type="submit" variant="primary" size="lg" block loading={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </AuthLayout>
  );
}
