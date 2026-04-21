import { useState } from "react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Badge from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

export default function ReminderEmailCard() {
  const { user, refresh } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState(user?.reminderEmail || user?.pendingReminderEmail || "");
  const [otp, setOtp] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [otpOpen, setOtpOpen] = useState(false);

  const verified = user?.reminderEmailVerified && user?.reminderEmail;

  const sendOtp = async (e) => {
    e?.preventDefault?.();
    if (!email) {
      toast.warning("Email required", "Enter the address you want reminders sent to.");
      return;
    }
    setSending(true);
    try {
      await api.requestReminderOtp({ email });
      toast.success("Code sent", `Check ${email} for a 6-digit code.`);
      setOtpOpen(true);
      await refresh();
    } catch (err) {
      toast.error("Couldn't send code", err.message);
    } finally {
      setSending(false);
    }
  };

  const verify = async (e) => {
    e?.preventDefault?.();
    if (!/^\d{6}$/.test(otp)) {
      toast.warning("Enter the 6-digit code", "Check the email we just sent.");
      return;
    }
    setVerifying(true);
    try {
      const res = await api.verifyReminderOtp({ otp });
      toast.success("Email verified", res.message || "A confirmation email was sent.");
      setOtp("");
      setOtpOpen(false);
      await refresh();
    } catch (err) {
      toast.error("Verification failed", err.message);
    } finally {
      setVerifying(false);
    }
  };

  const resendTest = async () => {
    setResending(true);
    try {
      const res = await api.resendTestEmail();
      toast.success("Test email sent", res.message);
    } catch (err) {
      toast.error("Couldn't send test", err.message);
    } finally {
      setResending(false);
    }
  };

  return (
    <Card
      title="Notification email"
      subtitle="One address receives every due reminder, overdue alert, and system confirmation."
      action={
        verified
          ? <Badge variant="success" dot>Verified</Badge>
          : user?.pendingReminderEmail
            ? <Badge variant="warning" dot>Pending</Badge>
            : <Badge variant="muted">Not set</Badge>
      }
    >
      <form onSubmit={sendOtp} className="stack gap-4">
        <div className="input-with-action">
          <Input
            type="email"
            name="reminderEmail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
            aria-label="Reminder email"
          />
          <Button type="submit" variant="primary" loading={sending}>
            {verified && email === user.reminderEmail ? "Re-verify" : "Verify & enable"}
          </Button>
        </div>
        <div className="field-hint">
          We'll send a 6-digit code to this address. On success we automatically send a confirmation email — one flow, one field.
        </div>
        {verified && (
          <div className="row gap-3 wrap" style={{ justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 13, color: "var(--text-soft)" }}>
              Currently sending to <strong style={{ color: "#F8FAFC" }}>{user.reminderEmail}</strong>
            </div>
            <Button variant="secondary" size="sm" onClick={resendTest} loading={resending}>
              Resend confirmation
            </Button>
          </div>
        )}
      </form>

      <Modal
        open={otpOpen}
        onClose={() => setOtpOpen(false)}
        title="Enter verification code"
      >
        <form onSubmit={verify} className="stack gap-4">
          <p style={{ color: "var(--text-soft)", fontSize: 14 }}>
            We sent a 6-digit code to <strong style={{ color: "#F8FAFC" }}>{user?.pendingReminderEmail || email}</strong>. It expires in 10 minutes.
          </p>
          <Input
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            className="otp-input"
            aria-label="One-time verification code"
          />
          <div className="row gap-3" style={{ justifyContent: "space-between" }}>
            <Button type="button" variant="ghost" onClick={sendOtp} loading={sending}>Resend code</Button>
            <Button type="submit" variant="primary" loading={verifying}>Verify email</Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
}
