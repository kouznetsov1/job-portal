import { HealthRpcs } from "./domains/health";
import { JobsRpcs } from "./domains/job";
import { JobAdsRpcs } from "./domains/job-ads";

export const Rpcs = HealthRpcs.merge(JobsRpcs).merge(JobAdsRpcs);
