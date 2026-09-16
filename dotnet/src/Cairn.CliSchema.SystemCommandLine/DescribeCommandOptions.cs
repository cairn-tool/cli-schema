using Cairn.CliSchema;

namespace Cairn.CliSchema.SystemCommandLine;

public sealed class DescribeCommandOptions {
    public string? ToolName { get; init; }
    public string? ToolVersion { get; init; }
    public IReadOnlyDictionary<string, string>? FormatShorthands { get; init; }
    public IReadOnlyList<SchemaRef>? Schemas { get; init; }
    public AdvisoryOutput? AdvisoryOutput { get; init; }
}
