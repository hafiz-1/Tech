import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Camera,
  Gamepad2,
  Headphones,
  Laptop,
  Monitor,
  Package,
  Printer,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Tablet,
  Truck,
  Watch,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState, ErrorState, LoadingState, ProductGridSkeleton } from "@/components/StatusState";
import { ProductCard } from "@/components/store/ProductCard";
import { displayPrice, formatPKR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { listBrands, listCategories, listProducts } from "@/lib/endpoints";
import type { Brand, Category, Product } from "@/lib/types";

export const Route = createFileRoute("/_store/")({
  head: () => ({
    meta: [
      { title: "TechCart — Tech retail in Pakistan" },
      {
        name: "description",
        content:
          "Shop mobiles, laptops and accessories at TechCart. Browse categories and brands, with prices in PKR.",
      },
      { property: "og:title", content: "TechCart — Tech retail in Pakistan" },
      {
        property: "og:description",
        content: "Shop mobiles, laptops and accessories at TechCart, with prices in PKR.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HomePage,
});

const PHOTO = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`;

const CATEGORY_VISUALS: Array<{ match: RegExp; icon: LucideIcon; image: string }> = [
  { match: /phone|mobile|smart/i, icon: Smartphone, image: PHOTO("photo-1511707171634-5f897ff02aa9") },
  { match: /laptop|computer|notebook/i, icon: Laptop, image: PHOTO("photo-1496181133206-80ce9b88a853") },
  { match: /audio|head|speaker|sound|ear/i, icon: Headphones, image: PHOTO("photo-1505740420928-5e560c06d30e") },
  { match: /watch|wear/i, icon: Watch, image: PHOTO("photo-1523275335684-37898b6baf30") },
  { match: /camera|photo/i, icon: Camera, image: PHOTO("photo-1516035069371-29a1b244cc32") },
  { match: /gam|console/i, icon: Gamepad2, image: PHOTO("photo-1606144042614-b2417e99c4e3") },
  { match: /monitor|display|tv|screen/i, icon: Monitor, image: PHOTO("photo-1527443224154-c4a3942d3acf") },
  { match: /print/i, icon: Printer, image: PHOTO("photo-1496181133206-80ce9b88a853") },
  { match: /tablet|pad/i, icon: Tablet, image: PHOTO("photo-1544244015-0df4b3ffc6b0") },
];

const DEFAULT_VISUAL = {
  icon: Package,
  image: PHOTO("photo-1517336714731-489689fd1ca8"),
};

function visualFor(name: string) {
  return CATEGORY_VISUALS.find((entry) => entry.match.test(name)) ?? DEFAULT_VISUAL;
}

const BRAND_TONES = [
  "from-zinc-800 to-zinc-600",
  "from-blue-600 to-indigo-600",
  "from-rose-500 to-orange-500",
  "from-emerald-600 to-teal-500",
  "from-violet-600 to-purple-500",
  "from-amber-500 to-orange-600",
  "from-sky-500 to-blue-600",
  "from-fuchsia-600 to-pink-500",
  "from-slate-700 to-slate-500",
  "from-red-600 to-rose-500",
];

const plural = (count: number, singular: string) =>
  `${count} ${singular}${count === 1 ? "" : "s"}`;

function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  id,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  id?: string;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
        <h2 id={id} className="mt-1.5 font-display text-2xl font-bold sm:text-3xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

function CategoryCard({
  category,
  featured = false,
  className,
}: {
  category: Category;
  featured?: boolean;
  className?: string;
}) {
  const { icon: Icon, image } = visualFor(category.name);
  const count = category.productCount ?? 0;

  return (
    <Link
      to="/categories/$categoryId"
      params={{ categoryId: String(category.id) }}
      aria-label={`Shop ${category.name}`}
      className={cn(
        "group relative isolate flex flex-col justify-end overflow-hidden rounded-2xl border border-white/10 p-5 text-white shadow-soft transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        featured ? "col-span-2 row-span-2 p-6 sm:p-7" : "",
        className,
      )}
      style={{
        backgroundImage: `linear-gradient(to top, rgba(9, 9, 11, 0.92) 0%, rgba(9, 9, 11, 0.4) 52%, rgba(9, 9, 11, 0.05) 100%), url("${image}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <span
        className="pointer-events-none absolute inset-0 -z-10 bg-black/0 transition-colors duration-300 group-hover:bg-black/15"
        aria-hidden
      />
      <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/15 backdrop-blur-sm">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <div className="mt-3">
        <h3
          className={cn(
            "font-display font-semibold leading-tight drop-shadow-sm",
            featured ? "text-2xl sm:text-3xl" : "text-base",
          )}
        >
          {category.name}
        </h3>
        {featured && category.description ? (
          <p className="mt-1.5 line-clamp-2 max-w-sm text-sm leading-relaxed text-white/70">
            {category.description}
          </p>
        ) : null}
        <p className="mt-1 text-xs font-medium text-white/70">{plural(count, "product")}</p>
      </div>
      <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-white/90">
        Shop now
        <ArrowUpRight
          className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          aria-hidden
        />
      </span>
    </Link>
  );
}

function CategoryTabs({
  products,
  active,
  onChange,
}: {
  products: Product[];
  active: number | "all";
  onChange: (value: number | "all") => void;
}) {
  const tabs = useMemo(() => {
    const map = new Map<number, { id: number; name: string; count: number }>();
    for (const product of products) {
      if (!product.category) continue;
      const current = map.get(product.category.id);
      if (current) current.count += 1;
      else map.set(product.category.id, { ...product.category, count: 1 });
    }
    return Array.from(map.values()).slice(0, 5);
  }, [products]);

  const chip = (isActive: boolean) =>
    cn(
      "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      isActive
        ? "border-transparent bg-primary text-primary-foreground shadow-xs"
        : "border-border/70 bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground",
    );

  return (
    <div className="no-scrollbar mb-5 flex items-center gap-2 overflow-x-auto pb-1">
      <button type="button" aria-pressed={active === "all"} className={chip(active === "all")} onClick={() => onChange("all")}>
        All
        <span className={cn("rounded-full px-1.5 py-0.5 text-[10px]", active === "all" ? "bg-white/20" : "bg-muted")}>
          {products.length}
        </span>
      </button>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          aria-pressed={active === tab.id}
          className={chip(active === tab.id)}
          onClick={() => onChange(tab.id)}
        >
          {tab.name}
          <span className={cn("rounded-full px-1.5 py-0.5 text-[10px]", active === tab.id ? "bg-white/20" : "bg-muted")}>
            {tab.count}
          </span>
        </button>
      ))}
    </div>
  );
}

function BrandCard({ brand, index }: { brand: Brand; index: number }) {
  const count = brand.productCount ?? 0;
  const tone = BRAND_TONES[index % BRAND_TONES.length];

  return (
    <Link
      to="/brands/$brandId"
      params={{ brandId: String(brand.id) }}
      className="group flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-3.5 transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <span
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br font-display text-lg font-bold text-white shadow-sm",
          tone,
        )}
        aria-hidden
      >
        {brand.name.trim().charAt(0).toUpperCase()}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-display text-sm font-semibold">{brand.name}</span>
        <span className="block text-xs text-muted-foreground">{plural(count, "product")}</span>
      </span>
      <ArrowUpRight
        className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary"
        aria-hidden
      />
    </Link>
  );
}

function HomePage() {
  const products = useQuery({
    queryKey: ["products", "home"],
    queryFn: () => listProducts({ page: 1, limit: 12, sort: "newest" }),
  });
  const categories = useQuery({ queryKey: ["categories"], queryFn: listCategories });
  const brands = useQuery({ queryKey: ["brands"], queryFn: listBrands });
  const [activeCategory, setActiveCategory] = useState<number | "all">("all");

  const newest = products.data?.items ?? [];
  const featured = newest[0];
  const featuredPrice = featured ? displayPrice(featured) : null;
  const visibleProducts =
    activeCategory === "all"
      ? newest
      : newest.filter((product) => product.category?.id === activeCategory);

  return (
    <div className="space-y-20 pb-4">
      <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="absolute inset-0 bg-grid opacity-60 [mask-image:radial-gradient(ellipse_at_top_left,black,transparent_70%)]" aria-hidden />
        <div
          className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/25 blur-3xl"
          aria-hidden
        />
        <div
          className="absolute -bottom-32 right-0 h-80 w-80 rounded-full bg-violet-500/15 blur-3xl"
          aria-hidden
        />

        <div className="relative grid items-center gap-10 px-6 py-12 sm:px-10 lg:grid-cols-[1.05fr_0.95fr] lg:py-16">
          <div className="max-w-xl">
            <Badge variant="soft" className="mb-5 gap-1.5 px-3 py-1 text-[11px] uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              New arrivals this week
            </Badge>
            <h1 className="font-display text-4xl font-bold leading-[1.05] sm:text-5xl lg:text-[3.4rem]">
              Tech that <span className="text-gradient">keeps up</span> with you.
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
              Mobiles, laptops and accessories with transparent PKR pricing and city-based shipping —
              delivered anywhere in Pakistan.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link to="/products">
                  Browse products
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#categories">Explore categories</a>
              </Button>
            </div>
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-border/70 pt-6">
              {[
                { label: "Genuine stock", value: "100%" },
                { label: "PKR pricing", value: "Clear" },
                { label: "Delivery", value: "Nationwide" },
              ].map((stat) => (
                <div key={stat.label}>
                  <dt className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {stat.label}
                  </dt>
                  <dd className="mt-0.5 font-display text-sm font-semibold text-foreground">{stat.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative mx-auto w-full max-w-sm lg:max-w-none">
            <div
              className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-primary/30 via-transparent to-violet-500/20 blur-2xl"
              aria-hidden
            />
            <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card shadow-lift">
              <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
                <span className="flex gap-1.5" aria-hidden>
                  <span className="h-2.5 w-2.5 rounded-full bg-destructive/40" />
                  <span className="h-2.5 w-2.5 rounded-full bg-warning/50" />
                  <span className="h-2.5 w-2.5 rounded-full bg-success/40" />
                </span>
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Featured
                </span>
              </div>
              <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                <div className="absolute inset-0 flex items-center justify-center bg-grid" aria-hidden>
                  <Package className="h-16 w-16 text-muted-foreground/30" />
                </div>
                {featured?.images?.[0] ? (
                  <img
                    src={featured.images[0]}
                    alt={featured.name}
                    className="relative h-full w-full object-cover"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                ) : null}
              </div>
              <div className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate font-display text-sm font-semibold">
                    {featured?.name ?? "Fresh tech, every week"}
                  </p>
                  <p className="text-xs text-muted-foreground">Prices in PKR</p>
                </div>
                <span className="shrink-0 font-display text-sm font-bold text-primary">
                  {formatPKR(featuredPrice)}
                </span>
              </div>
            </div>

            <div className="absolute -left-4 top-16 hidden animate-float items-center gap-2 rounded-xl border border-border/70 bg-card px-3 py-2 shadow-soft sm:flex">
              <BadgeCheck className="h-4 w-4 text-success" aria-hidden />
              <span className="text-xs font-medium">Genuine products</span>
            </div>
            <div className="absolute -right-4 bottom-20 hidden animate-float-slow items-center gap-2 rounded-xl border border-border/70 bg-card px-3 py-2 shadow-soft sm:flex">
              <Truck className="h-4 w-4 text-primary" aria-hidden />
              <span className="text-xs font-medium">Ships across PK</span>
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Why shop with TechCart">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Truck, title: "City-based shipping", copy: "Rates calculated for your city." },
            { icon: ShieldCheck, title: "Stock you can trust", copy: "Reserved the moment you order." },
            { icon: BadgeCheck, title: "Transparent pricing", copy: "Every price shown in PKR." },
            { icon: Sparkles, title: "Curated tech", copy: "Hand-picked mobiles and laptops." },
          ].map((item) => (
            <div
              key={item.title}
              className="flex items-start gap-3 rounded-2xl border border-border/70 bg-card p-4 transition-colors hover:border-primary/25"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <item.icon className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <p className="font-display text-sm font-semibold">{item.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{item.copy}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="categories" aria-labelledby="categories-heading" className="scroll-mt-28">
        <SectionHeading
          eyebrow="Browse"
          title="Shop by category"
          description="Jump straight into the aisle you need — every product is in stock unless marked otherwise."
          id="categories-heading"
          action={
            <Button asChild variant="ghost" size="sm">
              <Link to="/products">
                All products <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
          }
        />
        {categories.isLoading ? (
          <LoadingState label="Loading categories…" />
        ) : categories.isError ? (
          <ErrorState message={categories.error.message} onRetry={() => categories.refetch()} />
        ) : !categories.data || categories.data.length === 0 ? (
          <EmptyState title="No categories yet" hint="Categories will appear here once they are added." />
        ) : (
          <div className="grid auto-rows-[11rem] grid-cols-2 gap-4 lg:grid-cols-4">
            {categories.data.slice(0, 7).map((category, index) => (
              <CategoryCard
                key={category.id}
                category={category}
                featured={index === 0}
                className={index > 0 && index < 3 ? "col-span-2" : undefined}
              />
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="products-heading">
        <SectionHeading
          eyebrow="Just landed"
          title="Newest products"
          description="The latest arrivals across the store, updated as new stock is received."
          id="products-heading"
          action={
            <Button asChild variant="ghost" size="sm">
              <Link to="/products">
                View all <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
          }
        />
        {products.isLoading ? (
          <ProductGridSkeleton count={8} />
        ) : products.isError ? (
          <ErrorState message={products.error.message} onRetry={() => products.refetch()} />
        ) : newest.length === 0 ? (
          <EmptyState title="No products yet" hint="Check back soon — new stock lands every week." />
        ) : (
          <>
            <CategoryTabs products={newest} active={activeCategory} onChange={setActiveCategory} />
            {visibleProducts.length === 0 ? (
              <EmptyState
                title="Nothing new in this category"
                hint="Try another category or view the full catalog."
                action={
                  <Button asChild variant="outline" size="sm">
                    <Link to="/products">Browse all products</Link>
                  </Button>
                }
              />
            ) : (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                {visibleProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </>
        )}
      </section>

      <section aria-labelledby="brands-heading">
        <SectionHeading
          eyebrow="Trusted names"
          title="Shop by brand"
          description="Official stock from the brands customers ask for most."
          id="brands-heading"
          action={
            <Button asChild variant="ghost" size="sm">
              <Link to="/products">
                Browse catalog <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
          }
        />
        {brands.isLoading ? (
          <LoadingState label="Loading brands…" />
        ) : brands.isError ? (
          <ErrorState message={brands.error.message} onRetry={() => brands.refetch()} />
        ) : !brands.data || brands.data.length === 0 ? (
          <EmptyState title="No brands yet" />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            {brands.data.map((brand, index) => (
              <BrandCard key={brand.id} brand={brand} index={index} />
            ))}
          </div>
        )}
      </section>

      <section className="relative overflow-hidden rounded-3xl bg-foreground px-6 py-14 text-center text-background sm:px-12">
        <div className="absolute inset-0 bg-dots opacity-20" aria-hidden />
        <div className="relative mx-auto max-w-xl">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Ready to upgrade your setup?</h2>
          <p className="mt-3 text-sm leading-relaxed text-background/70">
            Browse the full catalog and check out in minutes. Cash on delivery available across
            Pakistan.
          </p>
          <Button asChild size="lg" variant="secondary" className="mt-7">
            <Link to="/products">
              Start shopping
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
