import { Rpc, RpcGroup } from "@effect/rpc";
import { UserPublic, UserRpcError } from "../schema/user";

export class UserRpcs extends RpcGroup.make(
  Rpc.make("user.getCurrentUser", {
    success: UserPublic,
    error: UserRpcError,
  })
) {}
