import { Rpc, RpcGroup } from "@effect/rpc";
import {
  CVUploadRequest,
  ParsedCVResult,
  ProfileRpcError,
  UpdateProfileData,
  UserProfile,
} from "../schema/profile";

export class ProfileRpcs extends RpcGroup.make(
  Rpc.make("profile.get", {
    success: UserProfile,
    error: ProfileRpcError,
  }),
  Rpc.make("profile.update", {
    payload: UpdateProfileData,
    success: UserProfile,
    error: ProfileRpcError,
  }),
  Rpc.make("profile.uploadCV", {
    payload: CVUploadRequest,
    success: ParsedCVResult,
    error: ProfileRpcError,
  })
) {}
