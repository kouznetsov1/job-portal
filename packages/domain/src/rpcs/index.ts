import { HealthRpcs } from "./health";
import { JobsRpcs } from "./job";
import { JobAdsRpcs } from "./jobads";
import { CvRpcs } from "./cv";

export const Rpcs = HealthRpcs.merge(JobsRpcs).merge(JobAdsRpcs).merge(CvRpcs);
