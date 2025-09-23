import { createFileRoute, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return <div className="bg-red-500">state: hej</div>;
}
