import { getAuthenticatedUser } from "@/lib/auth.server";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { SidebarProvider, SidebarInset } from "@repo/ui/components/sidebar";
import { AppSidebar } from "./_components/sidebar";

export const Route = createFileRoute("/(app)")({
  beforeLoad: async () => {
    const user = await getAuthenticatedUser();
    if (!user) {
      throw redirect({
        to: "/login",
      });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <SidebarProvider className="!h-screen !min-h-0">
      <AppSidebar />
      <SidebarInset className="overflow-hidden">
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
