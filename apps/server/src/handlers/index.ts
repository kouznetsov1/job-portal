import { Auth } from "@repo/auth";
import { Database } from "@repo/db";
import { Layer } from "effect";
import { AuthMiddlewareLive } from "../middleware/auth";
import { UserRepo } from "../services/user-repo";
import { Health } from "./health";
import { User } from "./users";

export const RpcHandlers = Layer.mergeAll(Health, User).pipe(
  Layer.provide(AuthMiddlewareLive),
  Layer.provide(UserRepo.Default),
  Layer.provide(Auth.Default),
  Layer.provide(Database.Live)
);
