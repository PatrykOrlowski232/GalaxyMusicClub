# Podgląd lokalny z backendem (Windows + MySQL)

Param(
  [string]$Mysql = "C:\Program Files\MySQL\MySQL Server 9.1\bin\mysql.exe"
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

if (-not (Test-Path .env)) {
  Copy-Item .env.example .env
}

Write-Host "Sprawdzam MySQL / bazę galaxy..."
& $Mysql -u galaxy -pgalaxy --default-character-set=utf8mb4 -e "USE galaxy; SELECT COUNT(*) AS tables_ok FROM information_schema.tables WHERE table_schema='galaxy';" 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Host "Importuję schemat i seed (UTF-8)..."
  & $Mysql -u root --default-character-set=utf8mb4 -e "CREATE DATABASE IF NOT EXISTS galaxy CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; CREATE USER IF NOT EXISTS 'galaxy'@'localhost' IDENTIFIED BY 'galaxy'; CREATE USER IF NOT EXISTS 'galaxy'@'127.0.0.1' IDENTIFIED BY 'galaxy'; GRANT ALL PRIVILEGES ON galaxy.* TO 'galaxy'@'localhost'; GRANT ALL PRIVILEGES ON galaxy.* TO 'galaxy'@'127.0.0.1'; FLUSH PRIVILEGES;"
  cmd /c "`"$Mysql`" -u root --default-character-set=utf8mb4 galaxy < `"$PSScriptRoot\..\db\schema.sql`""
  cmd /c "`"$Mysql`" -u root --default-character-set=utf8mb4 galaxy < `"$PSScriptRoot\..\db\seed.sql`""
}

Write-Host "Start Next.js: http://localhost:3000"
npm run dev
