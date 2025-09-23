## Example Route

```typescript
import { ApiResponse } from "@repo/domain";

// Define API Group
class HelloGroup extends HttpApiGroup.make("hello")
  .add(HttpApiEndpoint.get("get", "/").addSuccess(ApiResponse))
  .prefix("/hello") {}

const Api = HttpApi.make("Api").add(HelloGroup);

// Define Live Handler
const HelloGroupLive = HttpApiBuilder.group(Api, "hello", (handlers) =>
  handlers.handle("get", () => {
    const data: typeof ApiResponse.Type = {
      message: "Hello bhEvr!",
      success: true,
    };
    return Effect.succeed(data);
  }),
);
```
