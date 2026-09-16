namespace CairnTool.CliSchema;

public sealed class ContractRegistry {
    private readonly Dictionary<string, CommandContract> _entries = new(StringComparer.Ordinal);

    public ContractRegistry Add(string id, CommandContract contract) {
        _entries[id] = contract;
        return this;
    }

    public bool TryGet(string id, [System.Diagnostics.CodeAnalysis.NotNullWhen(true)] out CommandContract? contract) =>
        _entries.TryGetValue(id, out contract);
}
