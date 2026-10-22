import { Link } from "@tanstack/react-router";
import { ShieldCheck, ShoppingBag, Sparkles, Truck } from "lucide-react";
import type { ReactNode } from "react";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  eyebrow,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
      <aside className="relative hidden overflow-hidden rounded-3xl border border-border/70 bg-foreground p-10 text-background lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-grid opacity-20" aria-hidden />
        <div
          className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/40 blur-3xl"
          aria-hidden
        />
        <div
          className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-violet-500/25 blur-3xl"
          aria-hidden
        />

        <div className="relative">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-background/10 text-background ring-1 ring-background/20">
              <ShoppingBag className="h-[18px] w-[18px]" aria-hidden />
            </span>
            <span className="font-display text-lg font-bold tracking-tight">
              Tech<span className="text-primary">Cart</span>
            </span>
          </Link>
          <h2 className="mt-12 max-w-sm font-display text-3xl font-bold leading-tight">
            Tech that keeps up with you.
          </h2>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-background/70">
            One account for your cart, orders and delivery details — across mobiles, laptops and
            accessories.
          </p>
        </div>

        <ul className="relative mt-12 space-y-4">
          {[
            { icon: Truck, title: "Nationwide delivery", copy: "City-based shipping across Pakistan." },
            { icon: ShieldCheck, title: "Genuine stock", copy: "Reserved the moment you order." },
            { icon: Sparkles, title: "Transparent pricing", copy: "Every price shown in PKR." },
          ].map((item) => (
            <li key={item.title} className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-background/10 text-background ring-1 ring-background/15">
                <item.icon className="h-4 w-4" aria-hidden />
              </span>
              <div>
                <p className="text-sm font-semibold">{item.title}</p>
                <p className="text-xs text-background/60">{item.copy}</p>
              </div>
            </li>
          ))}
        </ul>
      </aside>

      <section className="flex items-center justify-center">
        <div className="w-full max-w-md">
          {eyebrow ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
          ) : null}
          <h1 className="mt-1.5 font-display text-2xl font-bold sm:text-3xl">{title}</h1>
          {subtitle ? <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{subtitle}</p> : null}
          <div className="mt-7">{children}</div>
          {footer ? <div className="mt-6">{footer}</div> : null}
        </div>
      </section>
    </div>
  );
}
