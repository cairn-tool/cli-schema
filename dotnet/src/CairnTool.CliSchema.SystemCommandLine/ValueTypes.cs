namespace CairnTool.CliSchema.SystemCommandLine;

internal static class ValueTypes {
    public static string? From(Type type, out IReadOnlyList<string>? allowed) {
        allowed = null;
        type = Unwrap(type);
        if (type == typeof(bool)) return "boolean";
        if (type == typeof(string)) return "string";
        if (type == typeof(sbyte) || type == typeof(byte)
            || type == typeof(short) || type == typeof(ushort)
            || type == typeof(int) || type == typeof(uint)
            || type == typeof(long) || type == typeof(ulong))
            return "integer";
        if (type == typeof(float) || type == typeof(double) || type == typeof(decimal))
            return "number";
        if (type.IsEnum) {
            allowed = Enum.GetNames(type);
            return "string";
        }
        return null;
    }

    private static Type Unwrap(Type type) {
        type = Nullable.GetUnderlyingType(type) ?? type;
        if (type.IsArray) {
            var element = type.GetElementType();
            if (element is not null) return Unwrap(element);
        }
        if (type.IsGenericType) {
            var def = type.GetGenericTypeDefinition();
            if (def == typeof(IEnumerable<>)
                || def == typeof(IReadOnlyList<>)
                || def == typeof(IList<>)
                || def == typeof(List<>)
                || def == typeof(ICollection<>)
                || def == typeof(IReadOnlyCollection<>)) {
                return Unwrap(type.GetGenericArguments()[0]);
            }
        }
        return type;
    }
}
