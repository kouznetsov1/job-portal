import { Auth } from "@repo/auth";
import { Database } from "@repo/db";
import { Layer } from "effect";
import { AuthMiddlewareLive } from "../middleware/auth";
import { UserRepo } from "../services/user-repo";
import { Profile } from "../services/profile-repo";
import { JobRepo } from "../services/job-repo";
import { FileStorage } from "../services/file-storage";
import { OCR } from "../services/ocr";
import { Embedding } from "../services/embedding";
import { Health } from "./health";
import { User } from "./users";
import { Profiles } from "./profiles";
import { Jobs } from "./jobs";
import { BunContext } from "@effect/platform-bun";

export const RpcHandlers = Layer.mergeAll(Health, User, Profiles, Jobs).pipe(
  Layer.provide(AuthMiddlewareLive),
  Layer.provide(UserRepo.Default),
  Layer.provide(Profile.Default),
  Layer.provide(JobRepo.Default),
  Layer.provide(FileStorage.Default),
  Layer.provide(OCR.Default),
  Layer.provide(Embedding.Default),
  Layer.provide(Auth.Default),
  Layer.provide(Database.Live),
  Layer.provide(BunContext.layer)
);
