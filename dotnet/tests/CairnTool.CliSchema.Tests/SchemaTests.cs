using System.Text.Json.Nodes;

namespace CairnTool.CliSchema.Tests;

public class SchemaTests {
    [Fact]
    public void Version_is_hand_owned() {
        Schema.Version.Should().Be("1");
        Schema.Id.Should().Be("https://github.com/cairn-tool/cli-schema/v1/cli-schema.json");
    }

    [Fact]
    public void Json_embeds_the_spec_document() {
        var json = Schema.Json;
        json.Should().Contain(Schema.Id);
        JsonNode.Parse(json).Should().NotBeNull();
    }

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
}
