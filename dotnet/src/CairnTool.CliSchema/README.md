# CairnTool.CliSchema

Portable CLI-description model, JSON Schema, usage builder, and text renderer. No System.CommandLine dependency.

```csharp
using CairnTool.CliSchema;

var json = Schema.Json;
var validShape = Schema.Version; // "1"
```

To walk a live System.CommandLine tree, reference `CairnTool.CliSchema.SystemCommandLine`.
