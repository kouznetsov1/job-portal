import { AuthMiddleware } from "../middleware/auth";
import { ApplicationRpcs } from "./application";
import { CompanyRpcs } from "./company";
import { CVEditorRpcs } from "./cv-editor";
import { CVTemplateAuthRpcs, CVTemplatePublicRpcs } from "./cv-template";
import { HealthRpcs } from "./health";
import { JobAuthRpcs, JobPublicRpcs } from "./job";
import { OnboardingRpcs } from "./onboarding";
import { ProfileRpcs } from "./profile";
import { UserRpcs } from "./user";

export const PublicRpcs = HealthRpcs.merge(CompanyRpcs)
  .merge(JobPublicRpcs)
  .merge(CVTemplatePublicRpcs);

export const AuthenticatedRpcs = UserRpcs.merge(ProfileRpcs)
  .merge(JobAuthRpcs)
  .merge(CVTemplateAuthRpcs)
  .merge(CVEditorRpcs)
  .merge(OnboardingRpcs)
  .merge(ApplicationRpcs)
  .middleware(AuthMiddleware);

export const Rpcs = PublicRpcs.merge(AuthenticatedRpcs);

export * from "../middleware/auth";
export * from "./application";
export * from "./company";
export * from "./cv-editor";
export * from "./cv-template";
export * from "./health";
export * from "./job";
export * from "./onboarding";
export * from "./profile";
export * from "./user";
