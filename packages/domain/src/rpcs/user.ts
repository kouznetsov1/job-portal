import { Rpc, RpcGroup } from "@effect/rpc";
import { UserPublic, UserRpcError } from "../schema/user";

export class UsersRpcs extends RpcGroup.make(
  Rpc.make("users.getCurrentUser", {
    success: UserPublic,
    error: UserRpcError,
  }),
) {}
