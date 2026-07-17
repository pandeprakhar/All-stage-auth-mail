import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  Loader2,
  Mail,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
} from "lucide-react";
import { adminFetch, AdminApiError, AUTH_API_BASE } from "@/lib/admin-api";

export const Route = createFileRoute("/admin/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const navigate = useNavigate();

  // Step: "email" → "otp" → "reset"
  const [step, setStep] = useState<"email" | "otp" | "reset">("email");

  // Shared state
  const [email, setEmail] = useState("");
  const [adminId, setAdminId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // OTP
  const [otp, setOtp] = useState("");

  // Reset password
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  /* ── Step 1: Send forgot-password OTP ── */
  const onEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const data = await adminFetch<{ adminId?: number } | null>(
        `${AUTH_API_BASE}/forgot-password`,
        {
          method: "POST",
          body: JSON.stringify({ email: email.trim() }),
        },
      );
      // Backend may return adminId in data, or we extract from full response
      if (data && typeof data === "object" && "adminId" in data) {
        setAdminId(data.adminId as number);
      }
      setStep("otp");
    } catch (err) {
      const msg =
        err instanceof AdminApiError
          ? err.message
          : "Failed to send OTP. Please try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Step 2: Verify forgot-password OTP ── */
  const onOtpSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (adminId == null) {
      setError("Missing admin ID. Please restart the flow.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await adminFetch(`${AUTH_API_BASE}/verify-forgot-otp`, {
        method: "POST",
        body: JSON.stringify({ adminId, otp }),
      });
      setOtp("");
      setStep("reset");
    } catch (err) {
      const msg =
        err instanceof AdminApiError
          ? err.message
          : "OTP verification failed. Please try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Step 3: Reset password ── */
  const onResetSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (adminId == null) {
      setError("Missing admin ID. Please restart the flow.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await adminFetch(`${AUTH_API_BASE}/reset-password`, {
        method: "POST",
        body: JSON.stringify({ adminId, password, confirmPassword }),
      });
      // Success — redirect to login
      void navigate({ to: "/admin/login", replace: true });
    } catch (err) {
      const msg =
        err instanceof AdminApiError
          ? err.message
          : "Password reset failed. Please try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel — identical to login page */}
      <div className="hidden lg:flex flex-col justify-between bg-foreground p-12 text-background">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center bg-background text-foreground font-bold">
            A
          </div>
          <div>
            <div className="text-lg font-bold uppercase tracking-widest">Allstag</div>
            <div className="text-xs uppercase tracking-widest opacity-70">Admin Console</div>
          </div>
        </div>

        <div className="max-w-md">
          <h1 className="text-4xl font-bold leading-tight">
            Run the store. Ship the drops. Move the numbers.
          </h1>
          <p className="mt-4 text-sm opacity-70">
            Manage orders, inventory, customers and content — all from one command center
            built for speed.
          </p>
        </div>

        <div className="text-xs opacity-60">© {new Date().getFullYear()} Allstag. All rights reserved.</div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center bg-foreground text-background font-bold">
              A
            </div>
            <div className="text-sm font-bold uppercase tracking-widest">Allstag Admin</div>
          </div>

          {step === "email" && (
            <>
              <h2 className="text-2xl font-semibold">Forgot Password</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter your admin email and we'll send a verification code.
              </p>

              <form onSubmit={onEmailSubmit} className="mt-8 space-y-4">
                <div>
                  <label htmlFor="forgot-email" className="text-sm font-medium">
                    Email
                  </label>
                  <input
                    id="forgot-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@allstag.com"
                    className="mt-1 h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-foreground/40"
                    autoFocus
                  />
                </div>

                {error && (
                  <div
                    role="alert"
                    className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400"
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-foreground text-sm font-medium text-background hover:bg-foreground/90 disabled:opacity-60"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                  Send OTP
                </button>

                <button
                  type="button"
                  onClick={() => void navigate({ to: "/admin/login" })}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-border text-sm font-medium hover:bg-muted"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Login
                </button>
              </form>
            </>
          )}

          {step === "otp" && (
            <>
              <h2 className="text-2xl font-semibold">Verify OTP</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                A 6-digit code has been sent to{" "}
                <span className="font-medium text-foreground">{email}</span>.
              </p>

              <form onSubmit={onOtpSubmit} className="mt-8 space-y-4">
                <div>
                  <label htmlFor="forgot-otp" className="text-sm font-medium">
                    One-Time Password
                  </label>
                  <input
                    id="forgot-otp"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    autoComplete="one-time-code"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="mt-1 h-11 w-full rounded-md border border-border bg-background px-3 text-sm tracking-[0.3em] text-center outline-none focus:border-foreground/40"
                    autoFocus
                  />
                </div>

                {error && (
                  <div
                    role="alert"
                    className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400"
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || otp.length !== 6}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-foreground text-sm font-medium text-background hover:bg-foreground/90 disabled:opacity-60"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-4 w-4" />
                  )}
                  Verify
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setOtp("");
                    setError(null);
                  }}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-border text-sm font-medium hover:bg-muted"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
              </form>
            </>
          )}

          {step === "reset" && (
            <>
              <h2 className="text-2xl font-semibold">Reset Password</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter your new password below.
              </p>

              <form onSubmit={onResetSubmit} className="mt-8 space-y-4">
                <div>
                  <label htmlFor="new-password" className="text-sm font-medium">
                    New Password
                  </label>
                  <div className="relative mt-1">
                    <input
                      id="new-password"
                      type={showPass ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-11 w-full rounded-md border border-border bg-background px-3 pr-10 text-sm outline-none focus:border-foreground/40"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded hover:bg-muted"
                      aria-label={showPass ? "Hide password" : "Show password"}
                    >
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirm-password" className="text-sm font-medium">
                    Confirm Password
                  </label>
                  <div className="relative mt-1">
                    <input
                      id="confirm-password"
                      type={showConfirm ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-11 w-full rounded-md border border-border bg-background px-3 pr-10 text-sm outline-none focus:border-foreground/40"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded hover:bg-muted"
                      aria-label={showConfirm ? "Hide password" : "Show password"}
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div
                    role="alert"
                    className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400"
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || !password || !confirmPassword}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-foreground text-sm font-medium text-background hover:bg-foreground/90 disabled:opacity-60"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <KeyRound className="h-4 w-4" />
                  )}
                  Reset Password
                </button>
              </form>
            </>
          )}

          <p className="mt-6 text-xs text-muted-foreground">
            Protected area. Unauthorized access is monitored and logged.
          </p>
        </div>
      </div>
    </div>
  );
}
