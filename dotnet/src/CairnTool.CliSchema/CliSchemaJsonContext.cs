using System.Text.Json.Serialization;

namespace CairnTool.CliSchema;

[JsonSourceGenerationOptions(
    PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase,
    DefaultIgnoreCondition = JsonIgnoreCondition.Never,
    WriteIndented = true,
    GenerationMode = JsonSourceGenerationMode.Metadata | JsonSourceGenerationMode.Serialization)]
[JsonSerializable(typeof(DescribeResult))]
[JsonSerializable(typeof(ToolInfo))]
[JsonSerializable(typeof(DescribedCommand))]
[JsonSerializable(typeof(DescribedOption))]
[JsonSerializable(typeof(DescribedArgument))]
[JsonSerializable(typeof(SchemaRef))]
[JsonSerializable(typeof(AdvisoryOutput))]
[JsonSerializable(typeof(Dictionary<string, string>))]
public partial class CliSchemaJsonContext : JsonSerializerContext;
