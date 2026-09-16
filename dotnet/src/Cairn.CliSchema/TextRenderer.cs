namespace Cairn.CliSchema;

public static class TextRenderer {
    private const string Bold = "\u001b[1m";
    private const string Dim = "\u001b[2m";
    private const string Reset = "\u001b[0m";

    /// <summary>
    /// <c>llm</c> and <c>human</c> share one renderer; <c>human</c> adds ANSI bold and dim.
    /// Character-identical to the JavaScript <c>renderText</c> implementation.
    /// </summary>
    public static string Render(DescribeResult result, bool human) {
        var lines = new List<string> {
            $"{result.Tool.Name} {result.Tool.Version}",
            $"contract schema version: {result.SchemaVersion}",
            $"format shorthands: {string.Join(", ", result.FormatShorthands.Select(entry => $"{entry.Key} = {entry.Value}"))}",
        };
        if (result.AdvisoryOutput is { } advisory) {
            lines.Add("");
            lines.Add($"update notice: {advisory.Description}");
            lines.AddRange(advisory.SuppressedWhen.Select(condition => $"  suppressed when {condition}"));
        }
        lines.Add("");
        lines.Add($"commands ({result.Commands.Count}):");
        lines.Add("");
        foreach (var command in result.Commands) {
            lines.AddRange(RenderCommand(command, human));
            lines.Add("");
        }
        return string.Join("\n", lines).TrimEnd() + "\n";
    }

    private static IEnumerable<string> RenderCommand(DescribedCommand command, bool human) {
        var name = human ? $"{Bold}{command.Id}{Reset}" : command.Id;
        var lines = new List<string> { name, $"  {command.Description}", $"  usage: {command.Usage}" };
        if (command.Formats is { Count: > 0 })
            lines.Add($"  formats: {string.Join(", ", command.Formats)} (default {command.DefaultFormat})");
        if (command.OutputSchema is not null) lines.Add($"  json schema: {command.OutputSchema}");
        if (command.JsonlSchema is not null) lines.Add($"  jsonl schema: {command.JsonlSchema}");
        if (command.Stream is { } stream) {
            var findings = stream.Findings is not null ? $", {stream.Findings} on findings" : "";
            lines.Add($"  stream: {stream.Success} on success{findings}");
        }
        if (command.Writes is true) lines.Add("  writes: may modify files");
        foreach (var exit in command.ExitCodes) lines.Add($"  exit {exit.Code}: {exit.Meaning}");
        if (command.Stability == "undeclared")
            lines.Add(human ? $"  {Dim}contract: undeclared{Reset}" : "  contract: undeclared");
        if (command.Notes is not null) lines.Add($"  note: {command.Notes}");
        return lines;
    }
}
