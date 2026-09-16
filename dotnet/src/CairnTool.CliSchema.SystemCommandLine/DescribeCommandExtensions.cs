using System.CommandLine;
using System.Text.Json;
using CairnTool.CliSchema;

namespace CairnTool.CliSchema.SystemCommandLine;

public static class DescribeCommandExtensions {
    public static readonly string[] Formats = ["llm", "human", "json"];

    /// <summary>
    /// Registers <c>describe</c> on <paramref name="parent"/> using the same
    /// <c>Option</c> / <c>DefaultValueFactory</c> / <c>SetAction</c> idiom as
    /// the KPS CLIs. Returns <paramref name="parent"/> so it chains.
    /// </summary>
    public static Command AddDescribeCommand(
        this Command parent,
        ContractRegistry? registry = null,
        DescribeCommandOptions? options = null) {
        options ??= new DescribeCommandOptions();
        var command = new Command(
            "describe",
            "Describe the CLI contract: commands, options, exit codes, and output schemas");

        var pathArgument = new Argument<string[]>("command") {
            Description = "Optional command path, for example: md graph",
            Arity = ArgumentArity.ZeroOrMore,
        };

        var formatOption = new Option<string>("--format") {
            Description = "Output format: llm, human, json",
            DefaultValueFactory = _ => "llm",
        };
        formatOption.HelpName = "fmt";

        command.Arguments.Add(pathArgument);
        command.Options.Add(formatOption);

        command.SetAction(parseResult => {
            var format = parseResult.GetValue(formatOption) ?? "llm";
            if (Array.IndexOf(Formats, format) < 0)
                throw new InvalidOperationException($"Invalid output format: {format}");

            var path = parseResult.GetValue(pathArgument) ?? [];
            var tool = new ToolInfo(
                options.ToolName ?? parent.Name,
                options.ToolVersion ?? "0.0.0");
            var result = CommandWalker.BuildDescription(parent, tool, registry, options);
            if (path.Length > 0) result = CommandWalker.SelectCommands(result, path);

            var output = format == "json"
                ? JsonSerializer.Serialize(result, CliSchemaJsonContext.Default.DescribeResult) + "\n"
                : TextRenderer.Render(result, human: format == "human");
            parseResult.InvocationConfiguration.Output.Write(output);
            return 0;
        });

        parent.Subcommands.Add(command);
        return parent;
    }
}
