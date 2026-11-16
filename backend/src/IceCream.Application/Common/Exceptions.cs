namespace IceCream.Application.Common;

public sealed class NotFoundException(string entity, object key)
    : Exception($"{entity} '{key}' was not found.");

public sealed class ForbiddenException(string message = "You do not have access to this resource.")
    : Exception(message);

public sealed class ConflictException(string message) : Exception(message);

public sealed class UnauthorizedException(string message = "Invalid credentials.") : Exception(message);
