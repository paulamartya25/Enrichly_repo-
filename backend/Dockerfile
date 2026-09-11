FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["src/JobAutomation.Api/JobAutomation.Api.csproj", "src/JobAutomation.Api/"]
RUN dotnet restore "src/JobAutomation.Api/JobAutomation.Api.csproj"
COPY . .
WORKDIR "/src/src/JobAutomation.Api"
RUN dotnet build -c Release -o /app/build

FROM build AS publish
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENV ASPNETCORE_URLS=http://+:10000
EXPOSE 10000
ENTRYPOINT ["dotnet", "JobAutomation.Api.dll"]
