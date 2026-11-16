namespace IceCream.Domain.Common;

/// <summary>Thrown when a business rule is broken. The API maps it to HTTP 400.</summary>
public sealed class DomainException(string message) : Exception(message);
