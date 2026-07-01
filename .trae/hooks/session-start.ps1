$ErrorActionPreference = 'Continue'

$stdinText = [System.Console]::In.ReadToEnd()
if ([string]::IsNullOrWhiteSpace($stdinText)) {
    $stdinText = [string]$env:HOOK_PAYLOAD
}

if ([string]::IsNullOrWhiteSpace($stdinText)) {
    exit 0
}

$payload = $null
try {
    $PSVersion = $PSVersionTable.PSVersion
    if ($PSVersion.Major -ge 6) {
        $payload = $stdinText | ConvertFrom-Json -Depth 20
    } else {
        $payload = $stdinText | ConvertFrom-Json
    }
} catch {
    exit 0
}
if ($null -eq $payload) { exit 0 }

$sessionId = ''
foreach ($name in @('session_id', 'sessionId', 'conversation_id', 'conversationId', 'id')) {
    if ($payload.PSObject.Properties.Name -contains $name) {
        $v = [string]$payload.$name
        if (-not [string]::IsNullOrWhiteSpace($v)) {
            $sessionId = $v
            break
        }
    }
}
if ([string]::IsNullOrWhiteSpace($sessionId)) {
    exit 0
}

$projectRoot = ''
$cwd = ''
if ($payload.PSObject.Properties.Name -contains 'cwd') {
    $cwd = [string]$payload.cwd
}
if (-not [string]::IsNullOrWhiteSpace($cwd) -and (Test-Path $cwd)) {
    $projectRoot = $cwd
}
if ([string]::IsNullOrWhiteSpace($projectRoot)) {
    $projectRoot = (Get-Location).Path
}
if ([string]::IsNullOrWhiteSpace($projectRoot)) {
    exit 0
}

$sessionsFile = Join-Path $projectRoot 'docs\trae\sessions.md'
$parentDir = Split-Path $sessionsFile
if (-not (Test-Path $parentDir)) {
    New-Item -ItemType Directory -Force -Path $parentDir | Out-Null
}

$fileExists = Test-Path $sessionsFile
if (-not $fileExists) {
    @'
# Trae Session Log

Managed by Trae Hooks (SessionStart) - auto-appended.

---

'@ | Set-Content -Path $sessionsFile -Encoding UTF8
}

$now = Get-Date
$isoStamp = $now.ToString('yyyy-MM-dd HH:mm:ss')

$count = 0
if (Test-Path $sessionsFile) {
    $count = (Select-String -Path $sessionsFile -Pattern '^## Session \d+' -SimpleMatch:$false -AllMatches).Count
}
$nextNum = $count + 1

$source = ''
if ($payload.PSObject.Properties.Name -contains 'source') {
    $source = [string]$payload.source
}

$lines = New-Object System.Collections.Generic.List[string]
$lines.Add('')
$lines.Add('')
$lines.Add("## Session $nextNum")
$lines.Add('')
$lines.Add("- **Session ID** : ``$sessionId``")
if (-not [string]::IsNullOrWhiteSpace($source)) {
    $lines.Add("- **Source** : $source")
}
$lines.Add("- **Time** : $isoStamp")
$lines.Add('- **Note** : (pending)')
$lines.Add('- **Output** : (pending)')
$lines.Add('- **Link** : (pending)')
$lines.Add('')
$lines.Add('---')

Add-Content -Path $sessionsFile -Value $lines -Encoding UTF8

Write-Output "[Trae-Hook] SessionStart: id=$sessionId num=$nextNum time=$isoStamp"
exit 0
