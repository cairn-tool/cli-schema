using System.Text.Json;
using System.Text.Json.Nodes;
using Cairn.CliSchema;
using Cairn.CliSchema.SystemCommandLine;

namespace Cairn.CliSchema.SystemCommandLine.Tests;

public class ConformanceTests {
    [Fact]
    public void Minimal() => AssertMatch("minimal", CommandWalker.BuildDescription(Fixtures.Minimal(), Fixtures.Tool));

    [Fact]
    public void Nested() => AssertMatch("nested", CommandWalker.BuildDescription(Fixtures.Nested(), Fixtures.Tool));

    [Fact]
    public void Arity() =>
        AssertMatch(
            "arity",
            CommandWalker.BuildDescription(Fixtures.Arity(), Fixtures.Tool),
            dropCommandIds: ["negate"]);

    [Fact]
    public void Contract() =>
        AssertMatch(
            "contract",
            CommandWalker.BuildDescription(
                Fixtures.Contract(),
                Fixtures.Tool,
                Fixtures.ContractRegistry(),
                Fixtures.ContractOptions()));

    private static void AssertMatch(string name, DescribeResult payload, params string[] dropCommandIds) {
        var json = JsonSerializer.Serialize(payload, CliSchemaJsonContext.Default.DescribeResult);
        ArtifactWriter.Write(name, json);

        var actual = JsonNode.Parse(json)!.AsObject();
        var expected = JsonNode.Parse(File.ReadAllText(ArtifactWriter.GoldenPath(name)))!.AsObject();
        StripVersion(actual);
        StripVersion(expected);
        foreach (var id in dropCommandIds) DropCommand(expected, id);

        Normalize(actual).Should().Be(Normalize(expected));
    }

    private static void StripVersion(JsonObject payload) {
        if (payload["tool"] is JsonObject tool) tool.Remove("version");
    }

    private static void DropCommand(JsonObject payload, string id) {
        if (payload["commands"] is not JsonArray commands) return;
        for (var i = commands.Count - 1; i >= 0; i--) {
            if (commands[i]?["id"]?.GetValue<string>() == id) commands.RemoveAt(i);
        }
    }

    private static string Normalize(JsonNode node) => Sort(node).ToJsonString(new JsonSerializerOptions { WriteIndented = true });

    private static JsonNode Sort(JsonNode node) {
        if (node is JsonObject obj) {
            var sorted = new JsonObject();
            foreach (var property in obj.OrderBy(p => p.Key, StringComparer.Ordinal))
                sorted[property.Key] = property.Value is null ? null : Sort(property.Value);
            return sorted;
        }
        if (node is JsonArray array) {
            var sorted = new JsonArray();
            foreach (var item in array)
                sorted.Add(item is null ? null : Sort(item));
            return sorted;
        }
        return node.DeepClone();
    }
}

internal static class ArtifactWriter {
    public static string RepoRoot() {
        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        while (dir is not null) {
            if (File.Exists(Path.Combine(dir.FullName, "spec", "v1", "cli-schema.json")))
                return dir.FullName;
            dir = dir.Parent;
        }
        throw new InvalidOperationException("Could not find repository root from " + AppContext.BaseDirectory);
    }

    public static string GoldenPath(string name) =>
        Path.Combine(RepoRoot(), "spec", "conformance", name, "expected.json");

    public static void Write(string name, string json) {
        var dir = Environment.GetEnvironmentVariable("CLI_SCHEMA_ARTIFACTS")
            ?? Path.Combine(RepoRoot(), "artifacts", "dotnet");
        Directory.CreateDirectory(dir);
        File.WriteAllText(Path.Combine(dir, name + ".json"), json.EndsWith('\n') ? json : json + "\n");
    }
}
