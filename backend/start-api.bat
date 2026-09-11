@echo off
echo ======================================
echo  Starting Job Automation Backend API
echo ======================================
echo.

set DOTNET_EXE=%USERPROFILE%\.dotnet\dotnet.exe

if not exist "%DOTNET_EXE%" (
    echo ERROR: .NET SDK not found at %DOTNET_EXE%
    echo Please ensure .NET 8 SDK is installed.
    pause
    exit /b 1
)

echo Using dotnet: %DOTNET_EXE%
echo.
echo Starting API on http://localhost:5000
echo Swagger UI: http://localhost:5000/swagger
echo.
echo Press Ctrl+C to stop.
echo.

"%DOTNET_EXE%" run --project src\JobAutomation.Api\JobAutomation.Api.csproj
