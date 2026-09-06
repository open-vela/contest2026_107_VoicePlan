param(
    [string]$Device,
    [string]$Adb = "$env:USERPROFILE\.vela\sdk\tools\adb\win\adb.exe",
    [switch]$CheckOnly
)

$ErrorActionPreference = 'Stop'
$deviceDirectory = '/data/files/com.velaplan.watch'
$deviceFile = "$deviceDirectory/mimo-voice.json"

if (-not (Test-Path -LiteralPath $Adb -PathType Leaf)) {
    throw 'ADB not found. Install the AIoT-IDE SDK or pass -Adb.'
}
$deviceLines = & $Adb devices
if ($LASTEXITCODE -ne 0) { throw 'Unable to list devices.' }
$devices = @($deviceLines | ForEach-Object {
    if ($_ -match '^(\S+)\s+device\s*$') { $Matches[1] }
})
if (-not $Device) {
    if ($devices.Count -ne 1) { throw 'Connect exactly one watch/emulator, or pass -Device.' }
    $Device = $devices[0]
}
if ($Device -notin $devices) { throw 'The selected device is not connected.' }
$listing = (& $Adb -s $Device shell ls $deviceDirectory) -join "`n"
if ($LASTEXITCODE -ne 0 -or $listing -notmatch '(?m)^/data/files/com\.velaplan\.watch:') {
    throw 'Install and open VelaPlan on the device once, then retry.'
}

if ($CheckOnly) {
    $configured = $listing -match '(?m)^\s*mimo-voice\.json\s*$'
    Write-Host "Device: $Device"
    Write-Host "Private directory: ready"
    Write-Host "Voice configuration present: $configured (contents not read)"
    exit 0
}

Write-Host 'VelaPlan - configure MiMo voice transcription'
Write-Host 'Audio is sent to Xiaomi MiMo. API usage may consume your quota.'
Write-Host 'The key is stored on this device, not in source code or the RPK.'
Write-Host 'Paste the API key at the hidden prompt and press Enter. Do not paste it into chat.'
if ($listing -match '(?m)^\s*mimo-voice\.json\s*$') {
    if ((Read-Host 'Replace the existing voice configuration? Type YES') -cne 'YES') { exit 0 }
}
$secure = Read-Host 'MiMo API key (sk- or tp-)' -AsSecureString
$pointer = [IntPtr]::Zero
$temporaryFile = $null
try {
    $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    $key = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer).Trim()
    if ($key -notmatch '^(sk|tp)-[A-Za-z0-9._-]{1,250}$') {
        throw 'Invalid key format. Nothing was installed.'
    }
    $apiUrl = 'https://api.xiaomimimo.com/v1/chat/completions'
    if ($key.StartsWith('tp-')) { $apiUrl = 'https://token-plan-cn.xiaomimimo.com/v1/chat/completions' }
    $json = @{ apiKey = $key; model = 'mimo-v2.5'; apiUrl = $apiUrl } | ConvertTo-Json -Compress
    $temporaryFile = Join-Path ([IO.Path]::GetTempPath()) ("velaplan-mimo-{0}.json" -f [Guid]::NewGuid())
    [IO.File]::WriteAllText($temporaryFile, $json, [Text.UTF8Encoding]::new($false))
    # adb reports successful transfer progress on stderr. Capture it without
    # letting PowerShell's Stop preference mistake that progress for failure.
    $oldErrorActionPreference = $ErrorActionPreference
    try {
        $ErrorActionPreference = 'Continue'
        $null = & $Adb -s $Device push $temporaryFile $deviceFile 2>&1
        $pushExitCode = $LASTEXITCODE
    } finally {
        $ErrorActionPreference = $oldErrorActionPreference
    }
    if ($pushExitCode -ne 0) { throw 'Device write failed. Reconnect and retry.' }
    $verification = (& $Adb -s $Device shell ls $deviceDirectory) -join "`n"
    if ($verification -notmatch '(?m)^\s*mimo-voice\.json\s*$') { throw 'Configuration file was not found after transfer.' }
    Write-Host 'Configuration written. This does not verify API access or remaining quota.'
    Write-Host 'In VelaPlan, record a short goal, review the transcript, then generate the plan.'
} finally {
    if ($pointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer) }
    if ($temporaryFile -and (Test-Path -LiteralPath $temporaryFile)) {
        Remove-Item -LiteralPath $temporaryFile -Force
    }
    $key = $null
    $json = $null
    $secure.Dispose()
}
