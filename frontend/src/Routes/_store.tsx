import { createFileRoute, Outlet } from "@tanstack/react-router";
import { StoreFooter, StoreHeader } from "@/components/store/StoreHeader";

export const Route = createFileRoute("/_store")({
  component: StoreLayout,
});

function StoreLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <StoreHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      <StoreFooter />
    </div>
  );
}
