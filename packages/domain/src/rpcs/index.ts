import { HealthRpcs } from "./health";
import { JobsRpcs } from "./job";

export const Rpcs = HealthRpcs.merge(JobsRpcs);
