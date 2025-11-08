import { Rpc, RpcGroup } from "@effect/rpc";
import {
  CVUploadRequest,
  LinkedInImportRequest,
  ParsedCVResult,
  ProfileRpcError,
  UpdateProfileData,
  UserProfile,
} from "../schema/profile";

export class ProfilesRpcs extends RpcGroup.make(
  Rpc.make("profiles.get", {
    success: UserProfile,
    error: ProfileRpcError,
  }),
  Rpc.make("profiles.update", {
    payload: UpdateProfileData,
    success: UserProfile,
    error: ProfileRpcError,
  }),
  Rpc.make("profiles.uploadCV", {
    payload: CVUploadRequest,
    success: ParsedCVResult,
    error: ProfileRpcError,
  }),
  Rpc.make("profiles.parseLinkedIn", {
    payload: LinkedInImportRequest,
    success: UpdateProfileData,
    error: ProfileRpcError,
  }),
) {}
