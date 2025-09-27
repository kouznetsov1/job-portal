import { createFileRoute } from "@tanstack/react-router";
import { Result, useAtomValue } from "@effect-atom/atom-react";
import { Cause } from "effect";
import { api } from "@/lib/rpc-client";

export const Route = createFileRoute("/job/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      Hello "/job/"!
      <Job id={123} />
      <Job id={35123} />
    </div>
  );
}

function Job({ id }: { id: number }) {
  const thing = useAtomValue(api.query("job.get", { id }));

  return (
    <div>
      {Result.match(thing, {
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
