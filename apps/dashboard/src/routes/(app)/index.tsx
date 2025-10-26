import { api } from "@/lib/rpc";
import { useAtomValue } from "@effect-atom/atom-react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/")({
  component: Home,
});

function Home() {
  return <JobSearchPage />;
}

function JobSearchPage() {
  const _searchResults = useAtomValue(api.query("jobs.search", { q: "s" }));

  return <div className="flex h-full w-full" />;
}
