import { HttpApi, HttpApiGroup, HttpApiEndpoint } from "@effect/platform";
import { Schema } from "effect";
import { Job } from "./Job";

export class HealthGroup extends HttpApiGroup.make("health")
  .add(HttpApiEndpoint.get("get", "/").addSuccess(Schema.String))
  .prefix("/health") {}

export class JobGroup extends HttpApiGroup.make("job")
  .add(HttpApiEndpoint.get("get", "/").addSuccess(Job))
  .prefix("/job") {}

export const Api = HttpApi.make("Api").add(HealthGroup).add(JobGroup);
