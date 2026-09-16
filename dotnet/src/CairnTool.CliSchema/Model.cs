using System.Text.Json.Serialization;

namespace CairnTool.CliSchema;

public sealed record ToolInfo(string Name, string Version);

public sealed record Arity(int Min, int? Max);

public sealed record ExitCodeMeaning(int Code, string Meaning);

public sealed record AdvisoryOutput(
    string Description,
    string Stream,
    IReadOnlyList<string> SuppressedWhen,
    string OptOutEnv);

public sealed record SchemaRef(string Id, string Uri, string Title, IReadOnlyList<string> Commands);

public sealed record CommandStream(string Success, string? Findings = null);

public sealed record ExitCodePassthrough(int Min, int Max, string Description);

public sealed record DescribedArgument(
    string Name,
    string Description,
    Arity Arity,
    string? ValueType,
    IReadOnlyList<string>? AllowedValues) {
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    [JsonPropertyName("default")]
    public object? Default { get; init; }
}

public sealed record DescribedOption(
    string Name,
    IReadOnlyList<string> Aliases,
    string Description,
    string? ValueName,
    Arity Arity,
    bool Required,
    bool Negatable,
    string? ValueType,
    IReadOnlyList<string>? AllowedValues,
    bool Recursive) {
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    [JsonPropertyName("default")]
    public object? Default { get; init; }
}

public sealed record DescribedCommand(
    string Id,
    IReadOnlyList<string> Path,
    string Description,
    string Usage,
    IReadOnlyList<DescribedArgument> Arguments,
    IReadOnlyList<DescribedOption> Options,
    IReadOnlyList<string> Subcommands,
    IReadOnlyList<string>? Formats,
    string? DefaultFormat,
    bool FormatConfigurable,
    string? OutputSchema,
    IReadOnlyList<ExitCodeMeaning> ExitCodes,
    CommandStream? Stream,
    bool? Writes,
    string Stability) {
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? JsonlSchema { get; init; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? SarifSchema { get; init; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public ExitCodePassthrough? ExitCodePassthrough { get; init; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Notes { get; init; }
}

public sealed record DescribeResult(
    string SchemaVersion,
    ToolInfo Tool,
    Dictionary<string, string> FormatShorthands,
    IReadOnlyList<SchemaRef> Schemas,
    IReadOnlyList<DescribedCommand> Commands) {
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public AdvisoryOutput? AdvisoryOutput { get; init; }
}

public sealed record CommandContract(
    IReadOnlyList<string>? Formats,
    string? DefaultFormat,
    bool FormatConfigurable,
    string? OutputSchema,
    IReadOnlyList<ExitCodeMeaning> ExitCodes,
    CommandStream? Stream,
    bool? Writes,
    string Stability) {
    public string? JsonlSchema { get; init; }
    public string? SarifSchema { get; init; }
    public ExitCodePassthrough? ExitCodePassthrough { get; init; }
    public string? Notes { get; init; }
}
