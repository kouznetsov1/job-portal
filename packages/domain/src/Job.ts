import { Schema } from "effect";

export const Job = Schema.Struct({
  id: Schema.Number,
  name: Schema.String,
});
