import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertCircle, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/store/AuthShell";
import { isAdminRole, useAuth } from "@/lib/auth";

type LoginSearch = { redirect?: string };

export const Route = createFileRoute("/_store/account/login")({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in — TechCart" },
      { name: "description", content: "Sign in to your TechCart account." },
      { property: "og:title", content: "Sign in — TechCart" },
      { property: "og:description", content: "Sign in to your TechCart account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { login, sessionExpiredMessage, clearSessionExpiredMessage } = useAuth();
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (sessionExpiredMessage) {
      setError(sessionExpiredMessage);
      clearSessionExpiredMessage();
    }
  }, [sessionExpiredMessage, clearSessionExpiredMessage]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const user = await login(email, password);
      toast.success("Signed in");
      if (redirect) void navigate({ href: redirect });
      else if (isAdminRole(user.role)) void navigate({ to: "/admin" });
      else void navigate({ to: "/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Account"
      title="Welcome back"
      subtitle="Sign in to manage your cart, orders and delivery details."
      footer={
        <p className="text-center text-sm text-muted-foreground">
          New to TechCart?{" "}
          <Link to="/account/register" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </p>
      }
    >
      {error ? (
        <div
          className="mb-5 flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive"
          role="alert"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{error}</span>
        </div>
      ) : null}
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
          {!submitting ? <ArrowRight className="h-4 w-4" aria-hidden /> : null}
        </Button>
      </form>
    </AuthShell>
  );
}
