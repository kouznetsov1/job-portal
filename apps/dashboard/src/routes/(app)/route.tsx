import { isAuthenticated } from "#/lib/auth.server";
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)")({
  beforeLoad: async () => {
    if (await isAuthenticated()) <Outlet />;
  },
  component: RouteComponent,
});

function RouteComponent() {
  return <Outlet />;
}
