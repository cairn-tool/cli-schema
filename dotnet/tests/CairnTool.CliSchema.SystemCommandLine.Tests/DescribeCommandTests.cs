using System.CommandLine;
using CairnTool.CliSchema;
using CairnTool.CliSchema.SystemCommandLine;

namespace CairnTool.CliSchema.SystemCommandLine.Tests;

public class DescribeCommandTests {
    [Fact]
    public void Usage_matches_the_spec_algorithm() {
        UsageBuilder.Build(
            "demo",
            ["run"],
            [new DescribedOption("--output", [], "", "path", new Arity(1, 1), false, false, "string", null, false)],
            [
                new DescribedArgument("script", "", new Arity(1, 1), "string", null),
                new DescribedArgument("args", "", new Arity(0, null), "string", null),
            ]).Should().Be("demo run [options] <script> [args...]");
    }

    [Fact]
    public void Text_renderer_is_stable_without_ansi_for_llm() {
        var result = CommandWalker.BuildDescription(
            Fixtures.Contract(),
            Fixtures.Tool,
            Fixtures.ContractRegistry(),
            Fixtures.ContractOptions());
        var text = TextRenderer.Render(result, human: false);
        text.Should().Contain("demo 0.0.0");
        text.Should().Contain("contract schema version: 1");
        text.Should().Contain("format shorthands: -fj = --format=json");
        text.Should().Contain("  contract: undeclared");
        text.Should().NotContain("\u001b[");
    }

    [Fact]
    public void Text_renderer_uses_ansi_for_human() {
        var result = CommandWalker.BuildDescription(
            Fixtures.Contract(),
            Fixtures.Tool,
            Fixtures.ContractRegistry(),
            Fixtures.ContractOptions());
        var text = TextRenderer.Render(result, human: true);
        text.Should().Contain("\u001b[1mrun\u001b[0m");
        text.Should().Contain("\u001b[2mcontract: undeclared\u001b[0m");
    }

    [Fact]
    public void AddDescribeCommand_writes_json() {
        var root = Fixtures.Minimal();
        root.AddDescribeCommand(options: new DescribeCommandOptions {
            ToolName = "demo",
            ToolVersion = "0.0.0",
        });
        var output = new StringWriter();
        var config = new InvocationConfiguration { Output = output };
        var parseResult = root.Parse(["describe", "--format", "json"]);
        parseResult.Invoke(config);
        output.ToString().Should().Contain("\"schemaVersion\": \"1\"");
        output.ToString().Should().Contain("\"greet\"");
    }

    [Fact]
    public void AddDescribeCommand_rejects_unknown_format() {
        var root = new RootCommand();
        root.AddDescribeCommand(options: new DescribeCommandOptions { ToolName = "demo", ToolVersion = "0.0.0" });
        var parseResult = root.Parse(["describe", "--format", "yaml"]);
        var act = () => parseResult.Invoke(new InvocationConfiguration { EnableDefaultExceptionHandler = false });
        act.Should().Throw<InvalidOperationException>().WithMessage("Invalid output format: yaml");
    }
}
