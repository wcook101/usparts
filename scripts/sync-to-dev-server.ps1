# Sync USParts to the dev server at 192.168.1.153
# Usage: .\scripts\sync-to-dev-server.ps1 [-User deploy] [-TargetDir /opt/usparts]

param(
    [string]$Server = "192.168.1.153",
    [string]$User = "bill",
    [string]$TargetDir = "/home/bill/usparts",
    [string]$SourceDir = "C:\Web-Apps\USParts"
)

$ErrorActionPreference = "Stop"

Write-Host "Syncing USParts to ${User}@${Server}:${TargetDir}" -ForegroundColor Cyan

ssh "${User}@${Server}" "mkdir -p ${TargetDir}"

# rsync is ideal but may not exist on Windows; scp recursive works everywhere OpenSSH is installed
$excludes = @(
    "node_modules",
    ".next",
    ".git"
)

$tempArchive = Join-Path $env:TEMP "usparts-sync.tar"
if (Test-Path $tempArchive) { Remove-Item $tempArchive -Force }

Push-Location $SourceDir
try {
    $items = Get-ChildItem -Force | Where-Object {
        $name = $_.Name
        $name -notin $excludes
    }

    tar -cf $tempArchive @($items.Name)
}
finally {
    Pop-Location
}

scp $tempArchive "${User}@${Server}:/tmp/usparts-sync.tar"

ssh "${User}@${Server}" @"
set -e
mkdir -p ${TargetDir}
cd ${TargetDir}
tar -xf /tmp/usparts-sync.tar
rm /tmp/usparts-sync.tar
"@

Remove-Item $tempArchive -Force

Write-Host ""
Write-Host "Sync complete." -ForegroundColor Green
Write-Host "On the server, run:" -ForegroundColor Yellow
Write-Host "  ssh ${User}@${Server}"
Write-Host "  cd ${TargetDir}"
Write-Host "  chmod +x scripts/setup-dev-server.sh"
Write-Host "  ./scripts/setup-dev-server.sh"
Write-Host "  ./scripts/start-dev.sh"
