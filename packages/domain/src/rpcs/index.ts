import { HealthRpcs } from "./health";
import { UsersRpcs } from "./user";
import { ProfilesRpcs } from "./profile";
import { CompaniesRpcs } from "./company";
import { JobsRpcs } from "./job";
import { CVTemplatesRpcs } from "./cv-template";
import { CVEditorRpcs } from "./cv-editor";
import { OnboardingRpcs } from "./onboarding";
import { ApplicationsRpcs } from "./application";

export const Rpcs = HealthRpcs.merge(UsersRpcs).merge(ProfilesRpcs).merge(CompaniesRpcs).merge(JobsRpcs).merge(CVTemplatesRpcs).merge(CVEditorRpcs).merge(OnboardingRpcs).merge(ApplicationsRpcs);

export * from "./health";
export * from "./user";
export * from "./profile";
export * from "./company";
export * from "./job";
export * from "./cv-template";
export * from "./cv-editor";
export * from "./onboarding";
export * from "./application";
