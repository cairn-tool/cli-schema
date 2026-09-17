using System.CommandLine;
using CairnTool.CliSchema;
using CairnTool.CliSchema.SystemCommandLine;

namespace CairnTool.CliSchema.SystemCommandLine.Tests;

internal enum OutputKind {
    Json,
    Text,
}

internal static class Fixtures {
    public static readonly ToolInfo Tool = new("demo", "0.0.0");

    public static RootCommand Minimal() {
        var root = new RootCommand();
        var greet = new Command("greet", "Say hello");
        var name = new Option<string>("--name") { Description = "Who to greet" };
        name.HelpName = "name";
        name.Aliases.Add("-n");
        greet.Options.Add(name);
        root.Subcommands.Add(greet);
        return root;
    }

    public static RootCommand Nested() {
        var root = new RootCommand();
        var alpha = new Command("alpha", "First level");
        var global = new Option<string>("--global") {
            Description = "Applies to subcommands",
            Recursive = true,
        };
        global.HelpName = "value";
        alpha.Options.Add(global);

        var beta = new Command("beta", "Second level");
        var gamma = new Command("gamma", "Third level");
        var local = new Option<string>("--local") { Description = "Only on gamma" };
        local.HelpName = "value";
        gamma.Options.Add(local);
        beta.Subcommands.Add(gamma);
        alpha.Subcommands.Add(beta);
        alpha.Subcommands.Add(new Command("secret", "Hidden") { Hidden = true });
        root.Subcommands.Add(alpha);
        return root;
    }

    public static RootCommand Arity(bool includeNegate = false) {
        var root = new RootCommand();

        var flag = new Command("flag", "A boolean flag");
        var verbose = new Option<bool>("--verbose") {
            Description = "Be loud",
            Arity = ArgumentArity.Zero,
        };
        verbose.Aliases.Add("-v");
        flag.Options.Add(verbose);
        root.Subcommands.Add(flag);

        var value = new Command("value", "A single-value option");
        var output = new Option<string>("--output") {
            Description = "Output path",
            DefaultValueFactory = _ => "out.txt",
        };
        output.HelpName = "path";
        value.Options.Add(output);
        root.Subcommands.Add(value);

        var variadic = new Command("variadic", "A variadic argument");
        variadic.Arguments.Add(new Argument<string[]>("files") {
            Description = "Input files",
            Arity = ArgumentArity.ZeroOrMore,
        });
        root.Subcommands.Add(variadic);

        var repeat = new Command("repeat", "A repeatable option");
        var tag = new Option<string[]>("--tag") {
            Description = "A tag",
            Arity = ArgumentArity.OneOrMore,
        };
        tag.HelpName = "tag";
        repeat.Options.Add(tag);
        root.Subcommands.Add(repeat);

        var enumCommand = new Command("enum", "An option with allowed values");
        var format = new Option<OutputKind>("--format") { Description = "Output format" };
        format.HelpName = "fmt";
        enumCommand.Options.Add(format);
        root.Subcommands.Add(enumCommand);

        if (includeNegate) {
            var negate = new Command("negate", "A negated boolean option");
            negate.Options.Add(new Option<bool>("--no-config") { Description = "Disable config" });
            root.Subcommands.Add(negate);
        }

        return root;
    }

    public static RootCommand Contract() {
        var root = new RootCommand();
        var run = new Command("run", "Run a script");
        run.Arguments.Add(new Argument<string>("script") { Description = "Script to run" });
        run.Arguments.Add(new Argument<string[]>("args") {
            Description = "Arguments forwarded to the script",
            Arity = ArgumentArity.ZeroOrMore,
        });
        var output = new Option<string>("--output") { Description = "Write a report here" };
        output.HelpName = "path";
        output.Aliases.Add("-o");
        run.Options.Add(output);
        root.Subcommands.Add(run);

        var group = new Command("group", "A group of commands");
        group.Subcommands.Add(new Command("leaf", "A leaf under an undeclared group"));
        root.Subcommands.Add(group);
        return root;
    }

    public static ContractRegistry ContractRegistry() =>
        new ContractRegistry().Add("run", new CommandContract(
            Formats: ["llm", "human", "json"],
            DefaultFormat: "llm",
            FormatConfigurable: true,
            OutputSchema: "run-result",
            ExitCodes:
            [
                new ExitCodeMeaning(0, "Success"),
                new ExitCodeMeaning(1, "Invocation error"),
                new ExitCodeMeaning(2, "Findings"),
            ],
            Stream: new CommandStream("stdout") { Findings = "stderr" },
            Writes: true,
            Stability: "stable") {
            JsonlSchema = "run-record",
            SarifSchema = "https://json.schemastore.org/sarif-2.1.0.json",
            ExitCodePassthrough = new ExitCodePassthrough(0, 255, "Forwards the child process exit status."),
            Notes = "Writes a report to --output when set.",
        });

    public static DescribeCommandOptions ContractOptions() => new() {
        FormatShorthands = new Dictionary<string, string> { ["-fj"] = "--format=json" },
        AdvisoryOutput = new AdvisoryOutput(
            "The update notice is advisory only and never appears on a machine-readable stream.",
            "stderr",
            ["DEMO_NO_NOTICE=1", "CI is set"],
            "DEMO_NO_NOTICE"),
        Schemas =
        [
            new SchemaRef("run-result", "https://example.invalid/run-result.json", "Run result", ["run"]),
        ],
    };
}
