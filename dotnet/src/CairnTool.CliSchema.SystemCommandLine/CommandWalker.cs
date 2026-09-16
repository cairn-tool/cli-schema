using System.CommandLine;
using System.CommandLine.Help;
using System.Diagnostics.CodeAnalysis;
using System.Reflection;
using CairnTool.CliSchema;

namespace CairnTool.CliSchema.SystemCommandLine;

/// <summary>
/// Walks a System.CommandLine tree for the mechanical facts and merges a
/// <see cref="CairnTool.CliSchema.ContractRegistry"/> for the semantic ones the
/// framework cannot know. A command with no registry entry is <c>undeclared</c>
/// rather than an error.
/// </summary>
public static class CommandWalker {

    public static IReadOnlyList<DescribedCommand> Walk(
        Command root,
        ToolInfo tool,
        ContractRegistry? registry = null) {
        var described = new List<DescribedCommand>();
        Visit(root, [], tool.Name, registry, described);
        return described;
    }

    public static DescribeResult BuildDescription(
        Command root,
        ToolInfo tool,
        ContractRegistry? registry = null,
        DescribeCommandOptions? options = null) {
        options ??= new DescribeCommandOptions();
        return new DescribeResult(
            Schema.Version,
            tool,
            options.FormatShorthands is { } shorthands
                ? new Dictionary<string, string>(shorthands)
                : [],
            options.Schemas?.ToList() ?? [],
            Walk(root, tool, registry).ToList()) {
            AdvisoryOutput = options.AdvisoryOutput,
        };
    }

    public static DescribeResult SelectCommands(DescribeResult result, IReadOnlyList<string> path) {
        var id = string.Join(" ", path);
        var commands = result.Commands
            .Where(command => command.Id == id || command.Id.StartsWith(id + " ", StringComparison.Ordinal))
            .ToList();
        if (commands.Count == 0) throw new InvalidOperationException($"Unknown command: {id}");
        return result with { Commands = commands };
    }

    private static void Visit(
        Command command,
        List<string> path,
        string toolName,
        ContractRegistry? registry,
        List<DescribedCommand> described) {
        var children = VisibleChildren(command);
        if (path.Count > 0) {
            var id = string.Join(" ", path);
            CommandContract? contract = null;
            registry?.TryGet(id, out contract);
            var args = command.Arguments.Where(argument => !argument.Hidden).Select(DescribeArgument).ToList();
            var opts = command.Options.Where(IsEmittedOption).Select(DescribeOption).ToList();
            described.Add(new DescribedCommand(
                id,
                path.ToList(),
                command.Description ?? "",
                UsageBuilder.Build(toolName, path, opts, args),
                args,
                opts,
                children.Select(child => string.Join(" ", path.Concat([child.Name]))).ToList(),
                contract?.Formats,
                contract?.DefaultFormat,
                contract?.FormatConfigurable ?? false,
                contract?.OutputSchema,
                contract?.ExitCodes ?? [],
                contract?.Stream,
                contract?.Writes,
                contract?.Stability ?? "undeclared") {
                JsonlSchema = contract?.JsonlSchema,
                SarifSchema = contract?.SarifSchema,
                ExitCodePassthrough = contract?.ExitCodePassthrough,
                Notes = contract?.Notes,
            });
        }

        foreach (var child in children) {
            var next = path.Concat([child.Name]).ToList();
            Visit(child, next, toolName, registry, described);
        }
    }

    private static List<Command> VisibleChildren(Command command) =>
        command.Subcommands.Where(child => !child.Hidden && child.Name != "help").ToList();

    private static bool IsEmittedOption(Option option) =>
        !option.Hidden && option is not HelpOption and not VersionOption;

    private static DescribedOption DescribeOption(Option option) {
        var aliases = option.Aliases.Where(alias => alias != option.Name).ToList();
        var valueType = ValueTypes.From(option.ValueType, out var allowed);
        var described = new DescribedOption(
            option.Name.StartsWith('-') ? option.Name : $"--{option.Name}",
            aliases,
            option.Description ?? "",
            option.HelpName,
            MapArity(option.Arity),
            option.Required,
            Negatable: false,
            valueType,
            allowed,
            option.Recursive);
        if (HasExplicitDefault(option) && option.HasDefaultValue) {
            var value = option.GetDefaultValue();
            if (value is not false)
                described = described with { Default = value };
        }
        return described;
    }

    private static DescribedArgument DescribeArgument(Argument argument) {
        var valueType = ValueTypes.From(argument.ValueType, out var allowed);
        var described = new DescribedArgument(
            argument.Name,
            argument.Description ?? "",
            MapArity(argument.Arity),
            valueType,
            allowed);
        if (HasExplicitDefault(argument) && argument.HasDefaultValue)
            described = described with { Default = argument.GetDefaultValue() };
        return described;
    }

    private static Arity MapArity(ArgumentArity arity) {
        // System.CommandLine uses 100_000 (MaximumArity) for unbounded, not int.MaxValue.
        int? max = arity.MaximumNumberOfValues >= 100_000 ? null : arity.MaximumNumberOfValues;
        return new Arity(arity.MinimumNumberOfValues, max);
    }

    [UnconditionalSuppressMessage("Trimming", "IL2075", Justification = "DefaultValueFactory is on Option<T>/Argument<T> and is read only to decide whether to emit default.")]
    private static bool HasExplicitDefault(object symbol) {
        var property = symbol.GetType().GetProperty("DefaultValueFactory", BindingFlags.Public | BindingFlags.Instance);
        return property?.GetValue(symbol) is not null;
    }
}
