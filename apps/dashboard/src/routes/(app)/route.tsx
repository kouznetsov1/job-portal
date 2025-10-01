import { isAuthenticated } from "@/lib/auth.server";
import { createFileRoute } from "@tanstack/react-router";
import { SidebarProvider } from "@repo/ui/components/sidebar";
import { AppSidebar } from "./_components/sidebar";

export const Route = createFileRoute("/(app)")({
  beforeLoad: async () => {
    if (await isAuthenticated()) return;
  },
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <SidebarProvider>
      <AppSidebar />
    </SidebarProvider>
  );
}
