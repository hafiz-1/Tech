import { AlertTriangle, Loader2, PackageOpen, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      className="flex items-center justify-center gap-2.5 py-20 text-sm text-muted-foreground"
      role="status"
    >
      <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden />
      <span>{label}</span>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 px-6 py-12 text-center"
      role="alert"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-6 w-6 text-destructive" aria-hidden />
      </span>
      <p className="font-display text-base font-semibold text-foreground">Something went wrong</p>
      <p className="text-sm leading-relaxed text-muted-foreground">{message}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" className="mt-1" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

export function EmptyState({
  title,
  hint,
  icon: Icon = PackageOpen,
  action,
}: {
  title: string;
  hint?: string;
  icon?: LucideIcon;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-background shadow-soft">
        <Icon className="h-6 w-6 text-muted-foreground" aria-hidden />
      </span>
      <div className="space-y-1">
        <p className="font-display text-base font-semibold text-foreground">{title}</p>
        {hint ? <p className="mx-auto max-w-sm text-sm text-muted-foreground">{hint}</p> : null}
      </div>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function ProductGridSkeleton({ count = 8, className }: { count?: number; className?: string }) {
  return (
    <div
      className={cn("grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4", className)}
      aria-hidden
    >
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-2xl border border-border/70 bg-card">
          <div className="skeleton aspect-[4/3] w-full" />
          <div className="space-y-3 p-4">
            <div className="skeleton h-2.5 w-16 rounded-full" />
            <div className="skeleton h-3.5 w-full rounded-full" />
            <div className="skeleton h-3.5 w-3/4 rounded-full" />
            <div className="skeleton h-8 w-full rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}
