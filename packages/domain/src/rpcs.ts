import { HealthRpcs } from "./domains/health";
import { JobsRpcs } from "./domains/jobs";

export const Rpcs = HealthRpcs.merge(JobsRpcs);
