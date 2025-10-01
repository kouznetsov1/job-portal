import { createFileRoute } from "@tanstack/react-router";
import { LoginForm } from "./_components/login-form";

export const Route = createFileRoute("/(auth)/login")({
  component: RouteComponent,
});

function RouteComponent() {
  return <LoginForm />;
}
