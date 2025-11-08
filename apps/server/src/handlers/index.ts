import { Layer } from "effect";
import { Health } from "./health";

export const RpcHandlers = Layer.mergeAll(Health);
