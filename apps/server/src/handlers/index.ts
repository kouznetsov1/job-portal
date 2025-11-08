import { Layer } from "effect";
import { Health } from "./health";
import { User } from "./users";
import { UserRepo } from "../services/user-repo";
import { Auth } from "@repo/auth";
import { Database } from "@repo/db";
import { AuthMiddlewareLive } from "../middleware/auth";

export const RpcHandlers = Layer.mergeAll(Health, User).pipe(
  Layer.provide(AuthMiddlewareLive),
  Layer.provide(UserRepo.Default),
  Layer.provide(Auth.Default),
  Layer.provide(Database.Live),
);
