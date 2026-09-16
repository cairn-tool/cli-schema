namespace CairnTool.CliSchema;

/// <summary>
/// Hand-owned schema version and the JSON Schema 2020-12 document.
/// Independent of the NuGet package version.
/// </summary>
public static class Schema {
    public const string Version = "1";
    public const string Id = "https://github.com/cairn-tool/cli-schema/v1/cli-schema.json";

    public static string Json {
        get {
            var assembly = typeof(Schema).Assembly;
            using var stream = assembly.GetManifestResourceStream("CairnTool.CliSchema.cli-schema.json")
                ?? throw new InvalidOperationException("Embedded cli-schema.json is missing.");
            using var reader = new StreamReader(stream);
            return reader.ReadToEnd();
        }
    }
}
