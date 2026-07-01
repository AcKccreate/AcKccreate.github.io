# =============================================================================
# LAPTOP_AUDIT.ps1  (PowerShell 5.1 compatible)
#
# Purpose: Read-only system audit for AnchorWithin AI-workstation planning.
# Output:  LAPTOP_AUDIT.md written to Desktop (or user home if Desktop is missing).
# Safety:  Does NOT modify, delete, or install anything.
# =============================================================================

# Find the real Desktop path (handles OneDrive redirection); fall back to home.
$desktopPath = [Environment]::GetFolderPath('Desktop')
if (-not $desktopPath -or -not (Test-Path $desktopPath)) { $desktopPath = $env:USERPROFILE }
$outPath = Join-Path $desktopPath 'LAPTOP_AUDIT.md'

$lines = New-Object System.Collections.ArrayList
function A { param($t) [void]$lines.Add([string]$t) }
function S { param($t) A ''; A ('## ' + $t); A '' }

A '# LAPTOP_AUDIT.md'
A ''
A ('**Generated:** ' + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'))
A '**Purpose:** Baseline audit for repurposing this laptop as an AnchorWithin AI-assistant workstation.'
A '**Nature:** Read-only - no changes made to the system.'

# ------------------------------------------------------------------
S '1. System Specs'
try {
  $os  = Get-CimInstance Win32_OperatingSystem -EA SilentlyContinue
  $cs  = Get-CimInstance Win32_ComputerSystem  -EA SilentlyContinue
  $cpu = Get-CimInstance Win32_Processor       -EA SilentlyContinue
  $gpu = Get-CimInstance Win32_VideoController -EA SilentlyContinue

  A '### Operating system + hardware'
  A ('- **OS:** ' + $os.Caption + ' build ' + $os.BuildNumber + ' (' + $os.OSArchitecture + ')')
  A ('- **Machine:** ' + $cs.Manufacturer + ' ' + $cs.Model)
  A ('- **Machine name:** ' + $cs.Name)
  A ''

  A '### CPU'
  foreach ($c in $cpu) {
    A ('- **' + $c.Name + '** - ' + $c.NumberOfCores + ' cores / ' + $c.NumberOfLogicalProcessors + ' threads, max ' + $c.MaxClockSpeed + ' MHz')
  }
  A ''

  $ramGB = [math]::Round($cs.TotalPhysicalMemory / 1GB, 1)
  A '### Memory'
  A ('- **Total RAM:** ' + $ramGB + ' GB')
  $mem = Get-CimInstance Win32_PhysicalMemory -EA SilentlyContinue
  foreach ($m in $mem) {
    $g = [math]::Round($m.Capacity / 1GB, 1)
    A ('- Slot ' + $m.DeviceLocator + ': ' + $g + ' GB @ ' + $m.Speed + ' MHz')
  }
  A ''

  A '### GPU'
  foreach ($gd in $gpu) {
    $vram = if ($gd.AdapterRAM) { [math]::Round([math]::Abs($gd.AdapterRAM)/1GB, 2) } else { 'unknown (see driver panel)' }
    A ('- **' + $gd.Name + '** - VRAM: ' + $vram + ' GB, driver ' + $gd.DriverVersion)
  }
  A ''

  A '### Storage'
  $vols = Get-Volume -EA SilentlyContinue | Where-Object { $_.DriveLetter -and $_.Size -gt 0 }
  foreach ($v in $vols) {
    $sz  = [math]::Round($v.Size/1GB, 1)
    $fr  = [math]::Round($v.SizeRemaining/1GB, 1)
    $pct = [math]::Round((1 - $v.SizeRemaining/$v.Size)*100, 0)
    A ('- **' + $v.DriveLetter + ':** (' + $v.FileSystemLabel + ') ' + $fr + ' GB free of ' + $sz + ' GB - ' + $pct + '% used')
  }

  $disks = Get-PhysicalDisk -EA SilentlyContinue
  if ($disks) {
    A ''
    A '### Physical disks (SSD vs HDD matters for AI workloads)'
    foreach ($d in $disks) {
      $sz = [math]::Round($d.Size/1GB, 0)
      A ('- **' + $d.FriendlyName + '** - ' + $d.MediaType + ', ' + $sz + ' GB, bus ' + $d.BusType + ', health: ' + $d.HealthStatus)
    }
  }
} catch {
  A ('_Spec collection error: ' + $_.Exception.Message + '_')
}

# ------------------------------------------------------------------
S '2. AI / Dev Capability Check'
function Probe {
  param($cmd, $flag = '--version')
  try {
    $out = & $cmd $flag 2>$null
    if ($LASTEXITCODE -eq 0 -and $out) { return (($out | Select-Object -First 1) -as [string]) }
  } catch { }
  return 'NOT INSTALLED'
}
A '### Dev toolchain'
A ''
A '| Tool | Detected |'
A '|---|---|'
A ('| Node.js | ' + (Probe 'node') + ' |')
A ('| npm | ' + (Probe 'npm') + ' |')
A ('| Python | ' + (Probe 'python') + ' |')
A ('| py launcher | ' + (Probe 'py' '-V') + ' |')
A ('| pip | ' + (Probe 'pip') + ' |')
A ('| Git | ' + (Probe 'git') + ' |')
A ('| Docker | ' + (Probe 'docker') + ' |')
A ('| PowerShell | ' + $PSVersionTable.PSVersion + ' |')
A ''
A '### Local AI model runners'
A ''
A '| Runner | Detected |'
A '|---|---|'
A ('| Ollama | ' + (Probe 'ollama') + ' |')
$lmpath = Join-Path $env:LOCALAPPDATA 'Programs\LM Studio'
$lmstat = if (Test-Path $lmpath) { 'Installed' } else { 'Not detected' }
A ('| LM Studio | ' + $lmstat + ' |')
$janpath = Join-Path $env:LOCALAPPDATA 'Programs\jan'
$janstat = if (Test-Path $janpath) { 'Installed' } else { 'Not detected' }
A ('| Jan | ' + $janstat + ' |')

# Existing venvs
A ''
A '### Detected Python virtual environments (top 10)'
A ''
try {
  $venvs = Get-ChildItem -Path 'C:\Users' -Include 'venv','.venv' -Recurse -Directory -EA SilentlyContinue -Depth 4 |
    Select-Object -First 10
  if ($venvs) {
    foreach ($v in $venvs) { A ('- ' + $v.FullName) }
  } else { A '_None detected in top 4 levels of C:\Users._' }
} catch {
  A '_Could not scan for venvs._'
}

# ------------------------------------------------------------------
S '3. Installed Programs'
$regPaths = @(
  'HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*',
  'HKLM:\Software\Wow6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*',
  'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*'
)
$progs = Get-ItemProperty $regPaths -EA SilentlyContinue |
  Where-Object { $_.DisplayName } |
  Select-Object DisplayName, DisplayVersion, Publisher, InstallDate,
    @{ n='SizeMB'; e={ if ($_.EstimatedSize) { [math]::Round($_.EstimatedSize/1024, 1) } else { $null } } } |
  Sort-Object DisplayName -Unique

$progCount = @($progs).Count
A ('### All installed programs (' + $progCount + ' detected)')
A ''
A '| Program | Version | Publisher | Installed | Size (MB) |'
A '|---|---|---|---|---|'
foreach ($p in $progs) {
  $sz = if ($p.SizeMB) { [string]$p.SizeMB } else { '-' }
  $dt = '-'
  if ($p.InstallDate -and $p.InstallDate.Length -eq 8) {
    $dt = $p.InstallDate.Substring(0,4) + '-' + $p.InstallDate.Substring(4,2) + '-' + $p.InstallDate.Substring(6,2)
  }
  $name = ($p.DisplayName -replace '\|', '\|')
  A ('| ' + $name + ' | ' + $p.DisplayVersion + ' | ' + $p.Publisher + ' | ' + $dt + ' | ' + $sz + ' |')
}

A ''
A '### Auto-start programs (impact boot time and background CPU)'
A ''
try {
  $st = @(Get-CimInstance Win32_StartupCommand -EA SilentlyContinue)
  if ($st.Count -gt 0) {
    A '| Name | Command | Location | User |'
    A '|---|---|---|---|'
    foreach ($s in $st) {
      $cmd = ($s.Command -replace '\|', '\|')
      A ('| ' + $s.Name + ' | `' + $cmd + '` | ' + $s.Location + ' | ' + $s.User + ' |')
    }
  } else {
    A '_No startup commands enumerated via WMI._'
  }
} catch {
  A '_Could not enumerate startup commands._'
}

# ------------------------------------------------------------------
S '4. Storage & Clutter'

A '### Downloads folder (files older than 30 days, top 20 by size)'
A ''
$dl = @(Get-ChildItem (Join-Path $env:USERPROFILE 'Downloads') -File -EA SilentlyContinue |
  Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } |
  Sort-Object Length -Descending |
  Select-Object -First 20)
$dlSum = ($dl | Measure-Object -Property Length -Sum).Sum
$dlMB  = if ($dlSum) { [math]::Round($dlSum/1MB, 1) } else { 0 }
A ('**Total in this list:** ' + $dlMB + ' MB across ' + $dl.Count + ' files')
A ''
if ($dl.Count -gt 0) {
  A '| File | Size (MB) | Last modified |'
  A '|---|---|---|'
  foreach ($f in $dl) {
    $sz = [math]::Round($f.Length/1MB, 2)
    A ('| ' + $f.Name + ' | ' + $sz + ' | ' + $f.LastWriteTime.ToString('yyyy-MM-dd') + ' |')
  }
} else {
  A '_No old files in Downloads._'
}

A ''
A '### Large files in home folder (>200 MB, top 20)'
A ''
try {
  $big = @(Get-ChildItem $env:USERPROFILE -File -Recurse -EA SilentlyContinue |
    Where-Object { $_.Length -gt 200MB } |
    Sort-Object Length -Descending |
    Select-Object -First 20)
  if ($big.Count -gt 0) {
    A '| Path | Size (MB) |'
    A '|---|---|'
    foreach ($f in $big) {
      $sz = [math]::Round($f.Length/1MB, 1)
      A ('| ' + $f.FullName + ' | ' + $sz + ' |')
    }
  } else {
    A '_No files over 200 MB in home folder._'
  }
} catch {
  A '_Error scanning home folder._'
}

A ''
A '### Temp folders'
A ''
$tempPaths = @($env:TEMP, (Join-Path $env:LOCALAPPDATA 'Temp'), (Join-Path $env:WINDIR 'Temp'))
foreach ($tp in ($tempPaths | Sort-Object -Unique)) {
  if (Test-Path $tp) {
    try {
      $sum = (Get-ChildItem $tp -Recurse -File -EA SilentlyContinue |
        Measure-Object -Property Length -Sum).Sum
      $mb = if ($sum) { [math]::Round($sum/1MB, 1) } else { 0 }
      A ('- **' + $tp + '** : ' + $mb + ' MB')
    } catch {
      A ('- **' + $tp + '** : (permission denied)')
    }
  }
}

A ''
A '### Windows Recycle Bin'
try {
  $shell = New-Object -ComObject Shell.Application
  $rb    = $shell.Namespace(0xA)
  $items = @($rb.Items())
  $rbSize = 0
  foreach ($i in $items) { $rbSize += $i.Size }
  A ('- **Size:** ' + [math]::Round($rbSize/1MB, 1) + ' MB across ' + $items.Count + ' items')
} catch {
  A '- Recycle Bin: could not measure'
}

# ------------------------------------------------------------------
S '5. AI-Workstation Readiness'
$ramGBInt = [math]::Round($cs.TotalPhysicalMemory / 1GB, 0)
$gpuName = if ($gpu) { (@($gpu) | Select-Object -First 1).Name } else { 'none' }
$hasNvidia = $gpuName -match 'NVIDIA|RTX|GTX|Quadro|Tesla|Titan'
$hasAmd    = $gpuName -match 'Radeon|AMD'

A '### Rule-of-thumb verdict'
A ''
if ($ramGBInt -ge 32 -and $hasNvidia) {
  A '- **Tier:** LARGE - 13B / 34B / possibly 70B quantized models comfortably'
  A '- **Recommendation:** Serious hybrid workstation. Ollama + LM Studio locally + cloud APIs for heavy jobs.'
} elseif ($ramGBInt -ge 16 -and $hasNvidia) {
  A '- **Tier:** MEDIUM - 7B / 13B quantized comfortably'
  A '- **Recommendation:** Good hybrid station. Local for iteration, cloud for the biggest work.'
} elseif ($ramGBInt -ge 16) {
  A '- **Tier:** SMALL - 7B quantized only, slow on CPU'
  A '- **Recommendation:** Better as a lightweight cloud-API client. Skip local models unless you get a discrete GPU.'
} else {
  A '- **Tier:** MINIMAL'
  A '- **Recommendation:** Cloud-API client only. Do not attempt local models on this hardware.'
}
A ''
A ('- **RAM:** ' + $ramGBInt + ' GB')
A ('- **GPU:** ' + $gpuName)
A ('- **NVIDIA detected:** ' + $hasNvidia)
A ('- **AMD detected:** ' + $hasAmd)

A ''
A '---'
A ''
A '## Next steps (require your review)'
A ''
A '1. Review the installed-programs list above and mark each Keep / Safe to remove / Needs review.'
A '2. Investigate any large files or downloads you do not recognize.'
A '3. Send this report back to Claude and ask for a prioritized cleanup plan and local-AI-runner setup recommendations.'
A ''

# ------------------------------------------------------------------
$lines | Set-Content -Path $outPath -Encoding UTF8
Write-Host ''
Write-Host '=========================================================' -ForegroundColor Green
Write-Host '  LAPTOP AUDIT COMPLETE' -ForegroundColor Green
Write-Host '=========================================================' -ForegroundColor Green
Write-Host ''
Write-Host ('  Report saved: ' + $outPath) -ForegroundColor Cyan
Write-Host ''
Write-Host '  Read-only audit. No files modified, no software touched.' -ForegroundColor Yellow
Write-Host ''
