$projectRoot = Split-Path -Parent $PSScriptRoot
$quickAppRoot = Join-Path $projectRoot 'quickapp\hello_quickapp'

$tools = @(
  'git',
  'node',
  'npm',
  'python',
  'java',
  'adb',
  'aiot'
)

$fallbacks = @{
  adb = Join-Path $env:USERPROFILE '.vela\sdk\tools\adb\win\adb.exe'
  aiot = Join-Path $quickAppRoot 'node_modules\.bin\aiot.cmd'
}

$rows = foreach ($tool in $tools) {
  $cmd = Get-Command $tool -ErrorAction SilentlyContinue
  $path = if ($cmd) { $cmd.Source } elseif (Test-Path $fallbacks[$tool]) { $fallbacks[$tool] } else { $null }
  if ($path) {
    $version = ''
    try {
      if ($tool -eq 'java') {
        $version = (& $path -version 2>&1 | Select-Object -First 1)
      } else {
        $version = (& $path --version 2>&1 | Select-Object -First 1)
      }
    } catch {
      $version = $_.Exception.Message
    }
    [pscustomobject]@{
      Tool = $tool
      Status = 'OK'
      Path = $path
      Version = $version
    }
  } else {
    [pscustomobject]@{
      Tool = $tool
      Status = 'Missing'
      Path = ''
      Version = ''
    }
  }
}

$rows | Format-Table -AutoSize

Write-Host ''
Write-Host 'Manual checks:'
Write-Host '- AIoT-IDE installed'
Write-Host '- aiot-core >= 1.7.22'
Write-Host '- aiot-emulator >= 1.7.22'
Write-Host '- emulator image: vela-miwear-watch-5.0(开发者大赛)'
