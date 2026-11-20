$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $projectRoot '.env'
if (Test-Path -LiteralPath $envPath) { Write-Output 'Existing .env preserved.'; exit 0 }
function New-TeamflowSecret {
 $buffer = New-Object byte[] 32
 $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
 $rng.GetBytes($buffer)
 $rng.Dispose()
 return ([System.BitConverter]::ToString($buffer)).Replace('-','').ToLowerInvariant()
}
$content = Get-Content -LiteralPath (Join-Path $projectRoot '.env.example') -Raw
foreach ($key in @('JWT_SECRET','SERVICE_SECRET','DB_PASSWORD','DB_ROOT_PASSWORD')) {
 $pattern = '(?m)^' + [regex]::Escape($key) + '=\r?$'
 $content = [regex]::Replace($content, $pattern, $key + '=' + (New-TeamflowSecret))
}
[System.IO.File]::WriteAllText($envPath,$content)
Write-Output 'Created .env with unique local secrets. Optional OAuth credentials can now be configured.'
