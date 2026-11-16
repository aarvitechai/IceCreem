using System.Text.RegularExpressions;

namespace IceCream.Application.Common;

public static partial class Slug
{
    public static string From(string text)
    {
        var slug = NonAlphaNumeric().Replace(text.Trim().ToLowerInvariant(), "-");
        return slug.Trim('-');
    }

    [GeneratedRegex("[^a-z0-9]+")]
    private static partial Regex NonAlphaNumeric();
}
