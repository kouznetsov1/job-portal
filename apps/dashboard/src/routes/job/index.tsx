import { createFileRoute } from "@tanstack/react-router";
import { Cause } from "effect";
import { api } from "@/lib/rpc-client";
import { Result, useAtomValue } from "@effect-atom/atom-react";

export const Route = createFileRoute("/job/")({
  component: RouteComponent,
  loader: () => {},
});

function RouteComponent() {
  return (
    <div>
      Hello "/job/"!
      <Job />
    </div>
  );
}

function Job() {
  const job = useAtomValue(
    api.query("job.get", { id: 123 }, { timeToLive: "60 minutes" }),
  );

  return (
    <div>
      {Result.match(job, {
        onInitial: () => <div>Loading...</div>,
        onFailure: (e) => <div>failed: {Cause.pretty(e.cause)}</div>,
        onSuccess: (d) => (
          <div>
            {d.value.id}: {d.value.name}
          </div>
        ),
      })}
    </div>
  );
}
