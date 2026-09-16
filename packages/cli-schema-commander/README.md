commander.js emitter for the portable CLI-description schema. The payload types and JSON Schema live in `@cairn-tool/cli-schema`, which this package depends on.

```js
import { addDescribeCommand } from "@cairn-tool/cli-schema-commander";

addDescribeCommand(program, { registry });
```
