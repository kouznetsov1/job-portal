import { HealthRpcs } from "./health";
import { JobsRpcs } from "./job";
import { JobAdsRpcs } from "./jobads";

export const Rpcs = HealthRpcs.merge(JobsRpcs).merge(JobAdsRpcs);
