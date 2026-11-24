# Imagen para publicar el backend de SuSu en Render (u otro servicio con Docker).
# Etapa 1: compilar
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY SuSu.Api.csproj ./
RUN dotnet restore SuSu.Api.csproj
COPY . ./
RUN dotnet publish SuSu.Api.csproj -c Release -o /app --no-restore

# Etapa 2: ejecutar (imagen ligera, sin el SDK)
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app ./
# Render envía el tráfico al puerto 10000 por defecto.
ENV ASPNETCORE_HTTP_PORTS=10000
EXPOSE 10000
ENTRYPOINT ["dotnet", "SuSu.Api.dll"]
