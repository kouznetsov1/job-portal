import { jobAtom } from "@/lib/atom";
import { Result, useAtom } from "@effect-atom/atom-react";
import { createFileRoute } from "@tanstack/react-router";
import { Cause } from "effect";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const [res, getJob] = useAtom(jobAtom);

  return Result.match(res, {
    onInitial: () => {
      <div>Loading...</div>;
    },
    onFailure: (e) => {
      <div>failed: {Cause.pretty(e.cause)}</div>;
    },
    onSuccess: (d) => {
      <div>{d.value.name}</div>;
    },
  });

  // return (
  //   <div className="w-screen h-screen flex items-center justify-center">
  //     <button className="size-12 bg-red-500" onClick={() => getJob()}>
  //       click me
  //     </button>
  //     <div className="size-96 bg-blue-100">
  //       {Result.builder(res)
  //         .onWaiting(() => <div>Loading...</div>)
  //         .onSuccess((data) => <div>Success: {data.name}</div>)
  //         .orNull()}
  //     </div>
  //   </div>
  // );
}
