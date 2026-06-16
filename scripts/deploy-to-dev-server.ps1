# Deploy USParts to bill@192.168.1.153
# Usage: .\scripts\deploy-to-dev-server.ps1

param(
    [string]$Server = "192.168.1.153",
    [string]$User = "bill",
    [string]$Password = "pass",
    [string]$TargetDir = "/home/bill/usparts",
    [string]$SourceDir = "C:\Web-Apps\USParts",
    [switch]$SetupProduction
)

$ErrorActionPreference = "Stop"
$hostkey = "ssh-ed25519 255 SHA256:8QD0r5OdQpdEO5UyYgY34LtOFwdpsMYwDAHvLz551pM"
$plink = "C:\Program Files\PuTTY\plink.exe"
$pscp = "C:\Program Files\PuTTY\pscp.exe"
$remote = "${User}@${Server}"
$archive = Join-Path $env:TEMP "usparts-sync.tar"

Write-Host "Deploying USParts to ${remote}:${TargetDir}" -ForegroundColor Cyan

# Connectivity check
$ping = Test-Connection -ComputerName $Server -Count 1 -Quiet -ErrorAction SilentlyContinue
if (-not $ping) {
    Write-Host "ERROR: Cannot reach $Server. Connect to the same network as the dev server and retry." -ForegroundColor Red
    exit 1
}

Push-Location $SourceDir
try {
    if (Test-Path $archive) { Remove-Item $archive -Force }
    $items = Get-ChildItem -Force | Where-Object { $_.Name -notin @('node_modules', '.next', '.git') }
    tar -cf $archive @($items.Name)
    Write-Host "Created archive ($([math]::Round((Get-Item $archive).Length / 1KB)) KB)" -ForegroundColor Gray
}
finally {
    Pop-Location
}

& $plink -ssh $remote -pw $Password -batch -hostkey $hostkey "mkdir -p $TargetDir"
& $pscp -pw $Password -hostkey $hostkey $archive "${remote}:/tmp/usparts-sync.tar"
& $pscp -pw $Password -hostkey $hostkey (Join-Path $SourceDir "scripts\remote-deploy.sh") "${remote}:/tmp/remote-deploy.sh"

& $plink -ssh $remote -pw $Password -batch -hostkey $hostkey "sed -i 's/\r$//' /tmp/remote-deploy.sh /tmp/setup-production-server.sh 2>/dev/null; sed -i 's/\r$//' /tmp/remote-deploy.sh && chmod +x /tmp/remote-deploy.sh && SUDO_PASSWORD=$Password bash /tmp/remote-deploy.sh"

if ($SetupProduction) {
    Write-Host "Running one-time production setup (Caddy, systemd, backups)..." -ForegroundColor Cyan
    & $pscp -pw $Password -hostkey $hostkey (Join-Path $SourceDir "scripts\setup-production-server.sh") "${remote}:/tmp/setup-production-server.sh"
    & $plink -ssh $remote -pw $Password -batch -hostkey $hostkey "sed -i 's/\r$//' /tmp/setup-production-server.sh && chmod +x /tmp/setup-production-server.sh && SUDO_PASSWORD=$Password bash /tmp/setup-production-server.sh"
}

Remove-Item $archive -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Deploy complete: http://${Server}" -ForegroundColor Green
Write-Host "Direct app (server only): http://${Server}:3000 is no longer exposed when Caddy is installed." -ForegroundColor Gray
