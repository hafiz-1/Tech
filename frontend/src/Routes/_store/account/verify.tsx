import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/store/AuthShell";
import { useAuth } from "@/lib/auth";

const RESEND_COUNTDOWN_SECONDS = 60;

type VerifySearch = { email?: string };

export const Route = createFileRoute("/_store/account/verify")({
  validateSearch: (search: Record<string, unknown>): VerifySearch => ({
    email: typeof search.email === "string" ? search.email : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Verify email — TechCart" },
      { name: "description", content: "Verify your TechCart account with the OTP sent to your email." },
      { property: "og:title", content: "Verify email — TechCart" },
      { property: "og:description", content: "Verify your TechCart account with the OTP sent to your email." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: VerifyPage,
});

function VerifyPage() {
  const { verifyEmail, resendOtp } = useAuth();
  const { email: initialEmail } = Route.useSearch();
  const navigate = useNavigate();
  const [email, setEmail] = useState(initialEmail ?? "");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const onVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setSubmitting(true);
    try {
      await verifyEmail(email, otp);
      toast.success("Email verified — you can sign in now");
      void navigate({ to: "/account/login" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setSubmitting(false);
    }
  };

  const onResend = async () => {
    setError(null);
    setNotice(null);
    setResending(true);
    try {
      await resendOtp(email);
      setNotice("A new code was sent to your email.");
      setCountdown(RESEND_COUNTDOWN_SECONDS);
    } catch (err) {
      setError(
        err instanceof Error
          ? `${err.message} If you have used all verification attempts, register again or contact support.`
          : "Could not resend the code",
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Almost there"
      title="Verify your email"
      subtitle="Enter the 6-digit code we sent to your inbox to activate your account."
      footer={
        <p className="text-center text-sm text-muted-foreground">
          Wrong email?{" "}
          <Link to="/account/register" className="font-medium text-primary hover:underline">
            Register again
          </Link>
        </p>
      }
    >
      {error ? (
        <div
          className="mb-4 flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive"
          role="alert"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{error}</span>
        </div>
      ) : null}
      {notice ? (
        <div
          className="mb-4 flex items-start gap-2 rounded-xl border border-success/20 bg-success/5 p-3 text-sm text-success"
          role="status"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{notice}</span>
        </div>
      ) : null}

      <form onSubmit={onVerify} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="otp">Verification code</Label>
          <Input
            id="otp"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            placeholder="000000"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            className="h-12 text-center font-display text-xl tracking-[0.5em]"
          />
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? "Verifying…" : "Verify email"}
        </Button>
      </form>

      <div className="mt-4 flex items-center justify-between text-sm">
        <Button
          variant="link"
          className="h-auto px-0"
          disabled={resending || countdown > 0 || !email}
          onClick={onResend}
        >
          {countdown > 0 ? `Resend in ${countdown}s` : resending ? "Sending…" : "Resend code"}
        </Button>
        <Link to="/account/login" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      </div>
    </AuthShell>
  );
}
