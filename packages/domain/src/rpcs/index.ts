import { HealthRpcs } from "./health";
import { UserRpcs } from "./user";
import { ProfileRpcs } from "./profile";
import { CompanyRpcs } from "./company";
import { JobPublicRpcs, JobAuthRpcs } from "./job";
import { CVTemplatePublicRpcs, CVTemplateAuthRpcs } from "./cv-template";
import { CVEditorRpcs } from "./cv-editor";
import { OnboardingRpcs } from "./onboarding";
import { ApplicationRpcs } from "./application";
import { AuthMiddleware } from "../middleware/auth";

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

export * from "./health";
export * from "./user";
export * from "./profile";
export * from "./company";
export * from "./job";
export * from "./cv-template";
export * from "./cv-editor";
export * from "./onboarding";
export * from "./application";
export * from "../middleware/auth";
