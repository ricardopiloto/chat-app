param([switch]$Silent)

$ErrorActionPreference = 'Stop'
$api = 'https://api.github.com/repos/ricardopiloto/chat-app/releases/latest'
$architecture = [System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture.ToString()
if ($architecture -ne 'X64' -and $architecture -ne 'Arm64') {
    throw "Mesa: arquitetura Windows não suportada: $architecture"
}
$release = Invoke-RestMethod -Uri $api -Headers @{ Accept = 'application/vnd.github+json'; 'User-Agent' = 'Mesa-installer' }
if ($release.draft -or $release.prerelease) { throw 'Mesa: a última release não está publicada.' }
$assets = @($release.assets)
$manifest = @($assets | Where-Object { $_.name -eq 'SHA256SUMS' })
if ($manifest.Count -ne 1) { throw 'Mesa: a release não contém SHA256SUMS.' }
$installers = @($assets | Where-Object {
    $_.name -match '(?i)\.exe$' -and $_.name -match '(?i)Mesa' -and
    (($_.name -match '(?i)arm64' -and $architecture -eq 'Arm64') -or
     ($_.name -notmatch '(?i)arm64' -and $architecture -eq 'X64'))
})
if ($installers.Count -ne 1) { throw "Mesa: esperado um instalador NSIS para $architecture; encontrados $($installers.Count)." }
$installer = $installers[0]
foreach ($asset in @($manifest[0], $installer)) {
    if ($asset.browser_download_url -notlike 'https://github.com/ricardopiloto/chat-app/releases/download/*') {
        throw 'Mesa: URL inesperada na release.'
    }
}
$temporary = Join-Path ([IO.Path]::GetTempPath()) ("mesa-install-" + [guid]::NewGuid())
New-Item -ItemType Directory -Path $temporary | Out-Null
try {
    $installerPath = Join-Path $temporary $installer.name
    $manifestPath = Join-Path $temporary 'SHA256SUMS'
    Invoke-WebRequest -Uri $installer.browser_download_url -OutFile $installerPath
    Invoke-WebRequest -Uri $manifest[0].browser_download_url -OutFile $manifestPath
    $line = @(Get-Content $manifestPath | Where-Object { $_ -match "^([0-9a-fA-F]{64})\s+\*?([^
]+)$" -and $Matches[2] -eq $installer.name })
    if ($line.Count -ne 1) { throw "Mesa: hash SHA-256 ausente ou duplicado para $($installer.name)." }
    $expected = ($line[0] -split '\s+')[0]
    $actual = (Get-FileHash -Algorithm SHA256 $installerPath).Hash
    if ($actual -ine $expected) { throw 'Mesa: SHA-256 não confere; instalação interrompida.' }
    if ($Silent) {
        $process = Start-Process -FilePath $installerPath -ArgumentList '/S' -Wait -PassThru
    } else {
        $process = Start-Process -FilePath $installerPath -Wait -PassThru
    }
    if ($process.ExitCode -ne 0) { throw "Mesa: instalador terminou com código $($process.ExitCode)." }
    Write-Host 'Mesa instalada. Execute novamente este script para atualizar manualmente.'
}
finally {
    Remove-Item -Recurse -Force $temporary -ErrorAction SilentlyContinue
}
