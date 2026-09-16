namespace CairnTool.CliSchema;

/// <summary>
/// Spec-defined usage string. A pure function of the rest of the command, so two
/// emitters cannot disagree on a required field.
/// </summary>
public static class UsageBuilder {
    public static string Build(
        string toolName,
        IReadOnlyList<string> path,
        IReadOnlyList<DescribedOption> options,
        IReadOnlyList<DescribedArgument> arguments) {
        var parts = new List<string> { toolName };
        parts.AddRange(path);
        var rest = new List<string>();
        if (options.Count > 0) rest.Add("[options]");
        foreach (var argument in arguments) {
            var variadic = argument.Arity.Max is null or > 1;
            var required = argument.Arity.Min >= 1;
            if (variadic) rest.Add(required ? $"<{argument.Name}...>" : $"[{argument.Name}...]");
            else rest.Add(required ? $"<{argument.Name}>" : $"[{argument.Name}]");
        }
        parts.AddRange(rest);
        return string.Join(" ", parts);
    }
}
