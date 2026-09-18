FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /source
COPY backend/Miras.Api/Miras.Api.csproj backend/Miras.Api/
RUN dotnet restore backend/Miras.Api/Miras.Api.csproj
COPY backend/Miras.Api backend/Miras.Api
RUN dotnet publish backend/Miras.Api -c Release -o /app --no-restore
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app .
ENV ASPNETCORE_URLS=http://+:8080
USER $APP_UID
EXPOSE 8080
ENTRYPOINT ["dotnet","Miras.Api.dll"]
