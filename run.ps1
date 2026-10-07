# Builds the web application and starts it on Tomcat.
# Usage (from the project folder):  .\run.ps1
# Then open http://localhost:8080/PublicTransportTicketingSystem/
# Press Ctrl+C to stop Tomcat.

$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

# Tomcat location: uses CATALINA_HOME if already set, otherwise this default.
if (-not $env:CATALINA_HOME) {
    $env:CATALINA_HOME = 'D:\apache-tomcat-10.1.60'
}
$env:CATALINA_BASE = $env:CATALINA_HOME
if (-not (Test-Path "$env:CATALINA_HOME\bin\catalina.bat")) {
    throw "Tomcat was not found at $env:CATALINA_HOME. Set CATALINA_HOME or edit run.ps1."
}

# Database settings: only the password is asked for if it is not already set.
if (-not $env:DB_URL)      { $env:DB_URL = 'jdbc:oracle:thin:@localhost:1521/XEPDB1' }
if (-not $env:DB_USERNAME) { $env:DB_USERNAME = 'SYSTEM' }
if (-not $env:DB_PASSWORD) {
    $secure = Read-Host 'Oracle password' -AsSecureString
    $env:DB_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure))
}

# Copy the frontend and libraries into Tomcat, then compile the Java sources there.
$app = "$env:CATALINA_HOME\webapps\PublicTransportTicketingSystem"
Write-Host "Deploying to $app"
if (Test-Path $app) { Remove-Item $app -Recurse -Force }
Copy-Item frontend $app -Recurse
New-Item -ItemType Directory -Force "$app\WEB-INF\lib" | Out-Null
Copy-Item lib\*.jar "$app\WEB-INF\lib" -Force

Write-Host 'Compiling Java sources'
$classpath = "lib\*;$env:CATALINA_HOME\lib\servlet-api.jar"
$sources = (Get-ChildItem src -Recurse -Filter *.java).FullName
javac --release 17 -cp $classpath -d "$app\WEB-INF\classes" $sources
if ($LASTEXITCODE -ne 0) { throw 'Compilation failed.' }

Write-Host 'Starting Tomcat: http://localhost:8080/PublicTransportTicketingSystem/'
& "$env:CATALINA_HOME\bin\catalina.bat" run
