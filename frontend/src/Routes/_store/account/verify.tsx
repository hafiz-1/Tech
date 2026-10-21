import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    <Card className="mx-auto max-w-md">
      <CardContent className="space-y-4 p-6">
        <h1 className="text-xl font-bold">Verify your email</h1>
        <p className="text-sm text-muted-foreground">
          Enter the 6-digit code we sent to your email address.
        </p>
        {error ? (
          <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p className="rounded-md bg-primary/10 p-3 text-sm text-primary" role="status">
            {notice}
          </p>
        ) : null}
        <form onSubmit={onVerify} className="space-y-4">
          <div className="space-y-1">
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
          <div className="space-y-1">
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
            />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Verifying…" : "Verify"}
          </Button>
        </form>
        <div className="flex items-center justify-between text-sm">
          <Button
            variant="link"
            className="px-0"
            disabled={resending || countdown > 0 || !email}
            onClick={onResend}
          >
            {countdown > 0 ? `Resend code in ${countdown}s` : resending ? "Sending…" : "Resend code"}
          </Button>
          <Link to="/account/login" className="text-primary hover:underline">
            Back to sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
