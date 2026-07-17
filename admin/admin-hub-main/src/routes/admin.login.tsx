import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, LogIn, Loader2, ArrowLeft, ShieldCheck } from "lucide-react";
import { useAdminAuth, type LoginOtpData } from "@/lib/admin-auth";
import { AdminApiError } from "@/lib/admin-api";

export const Route = createFileRoute("/admin/login")({
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const { login, verifyOtp } = useAdminAuth();
  const navigate = useNavigate();

  // Step state: "credentials" or "otp"
  const [step, setStep] = useState<"credentials" | "otp">("credentials");

  // Credential fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPass, setShowPass] = useState(false);

  // OTP fields — stored in component state only, NOT localStorage/sessionStorage
  const [otpData, setOtpData] = useState<LoginOtpData | null>(null);
  const [otp, setOtp] = useState("");

  // Shared
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /* ── Step 1: Submit credentials ── */
  const onLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const data = await login(email.trim(), password);
      // Store OTP context in component state and switch to OTP step
      setOtpData(data);
      setStep("otp");
    } catch (err) {
      const msg =
        err instanceof AdminApiError
          ? err.message
          : "Login failed. Check your credentials and try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Step 2: Submit OTP ── */
  const onOtpSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!otpData) return;
    setError(null);
    setSubmitting(true);
    try {
      await verifyOtp(otpData.adminId, otp);
      // Session established — navigate to dashboard
      void navigate({ to: "/admin/dashboard", replace: true });
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

  /* ── Back to credentials ── */
  const goBack = () => {
    setStep("credentials");
    setOtpData(null);
    setOtp("");
    setError(null);
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
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

          {step === "credentials" ? (
            /* ── Credentials form ── */
            <>
              <h2 className="text-2xl font-semibold">Sign in</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter your admin credentials to continue.
              </p>

              <form onSubmit={onLoginSubmit} className="mt-8 space-y-4">
                <div>
                  <label htmlFor="email" className="text-sm font-medium">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@allstag.com"
                    className="mt-1 h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-foreground/40"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="text-sm font-medium">
                      Password
                    </label>
                    <a
                      href="/admin/forgot-password"
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Forgot?
                    </a>
                  </div>
                  <div className="relative mt-1">
                    <input
                      id="password"
                      type={showPass ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-11 w-full rounded-md border border-border bg-background px-3 pr-10 text-sm outline-none focus:border-foreground/40"
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

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-border"
                  />
                  Remember me for 30 days
                </label>

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
                    <LogIn className="h-4 w-4" />
                  )}
                  Sign in
                </button>
              </form>
            </>
          ) : (
            /* ── OTP form ── */
            <>
              <h2 className="text-2xl font-semibold">Verify OTP</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                A 6-digit code has been sent to{" "}
                <span className="font-medium text-foreground">{otpData?.email}</span>.
              </p>

              <form onSubmit={onOtpSubmit} className="mt-8 space-y-4">
                <div>
                  <label htmlFor="otp" className="text-sm font-medium">
                    One-Time Password
                  </label>
                  <input
                    id="otp"
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
                  onClick={goBack}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-border text-sm font-medium hover:bg-muted"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
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
