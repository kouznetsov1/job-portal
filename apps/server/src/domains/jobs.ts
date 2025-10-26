import { Effect, Layer, } from "effect";
import { JobsRpcs } from "@repo/domain";
import { JobService } from "../services/job-service";
import { Database } from "@repo/db";

export const JobsLiveHandler = JobsRpcs.toLayer(
  Effect.gen(function* () {
    const jobService = yield* JobService;

    return {
      "jobs.search": (params) => jobService.search(params),
      "jobs.getById": ({ id }) => jobService.getById(id),
    };
  }),
).pipe(Layer.provide(JobService.Default), Layer.provide(Database.Live));
