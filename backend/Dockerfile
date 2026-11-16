# syntax=docker/dockerfile:1

# ---------- Build ----------
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Restore first so the layer is cached until a project file changes.
COPY global.json Directory.Build.props Directory.Packages.props IceCream.slnx ./
COPY src/IceCream.Domain/IceCream.Domain.csproj src/IceCream.Domain/
COPY src/IceCream.Application/IceCream.Application.csproj src/IceCream.Application/
COPY src/IceCream.Infrastructure/IceCream.Infrastructure.csproj src/IceCream.Infrastructure/
COPY src/IceCream.Api/IceCream.Api.csproj src/IceCream.Api/
RUN dotnet restore src/IceCream.Api/IceCream.Api.csproj

COPY src/ src/
RUN dotnet publish src/IceCream.Api/IceCream.Api.csproj -c Release -o /app --no-restore /p:UseAppHost=false

# ---------- Runtime ----------
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

ENV ASPNETCORE_URLS=http://+:8080 \
    ASPNETCORE_ENVIRONMENT=Production \
    DOTNET_RUNNING_IN_CONTAINER=true

COPY --from=build /app .
# Uploads folder must be writable by the non root user; mount a volume here in compose.
RUN mkdir -p /app/wwwroot/uploads && chown -R $APP_UID /app/wwwroot

USER $APP_UID
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD ["dotnet", "IceCream.Api.dll", "--healthcheck"]

ENTRYPOINT ["dotnet", "IceCream.Api.dll"]
