# Finds your MSFS Community folder, writes layout.json, and copies the panel there.
$src = Join-Path $PSScriptRoot 'trade-winds-panel'
$cands = @(
  "$env:LOCALAPPDATA\Packages\Microsoft.Limitless_8wekyb3d8bbwe\LocalCache\UserCfg.opt",
  "$env:APPDATA\Microsoft Flight Simulator 2024\UserCfg.opt",
  "$env:LOCALAPPDATA\Packages\Microsoft.FlightSimulator_8wekyb3d8bbwe\LocalCache\UserCfg.opt",
  "$env:APPDATA\Microsoft Flight Simulator\UserCfg.opt")
$targets = @()
foreach($c in $cands){ if(Test-Path $c){ $line = Select-String -Path $c -Pattern '^InstalledPackagesPath' | Select-Object -First 1; if($line){ $p = ($line.Line -replace '^InstalledPackagesPath\s+"?','') -replace '"\s*$',''; $com = Join-Path $p 'Community'; if(Test-Path $com){ $targets += $com } } } }
$targets = $targets | Select-Object -Unique
if(-not $targets){ Write-Host " Couldn't find your Community folder. Copy the 'trade-winds-panel' folder into it yourself."; exit 1 }
# layout.json
$files = Get-ChildItem -Path $src -Recurse -File | Where-Object { $_.FullName -notmatch '\\Build\\' -and $_.Name -ne 'layout.json' -and $_.Name -ne 'manifest.json' }
$content = @(); $total = 0
foreach($f in $files){ $rel = $f.FullName.Substring($src.Length+1).Replace('\','/'); $content += [ordered]@{ path=$rel; size=$f.Length; date=$f.LastWriteTime.ToFileTimeUtc() }; $total += $f.Length }
@{ content = $content } | ConvertTo-Json -Depth 4 | Set-Content -Encoding UTF8 (Join-Path $src 'layout.json')
foreach($t in $targets){ $dst = Join-Path $t 'trade-winds-panel'; if(Test-Path $dst){ Remove-Item $dst -Recurse -Force }
  New-Item -ItemType Directory -Path $dst | Out-Null
  Get-ChildItem $src | Where-Object { $_.Name -ne 'Build' } | Copy-Item -Destination $dst -Recurse -Force
  Write-Host " Installed to $dst" }
Write-Host ""; Write-Host " Done. Start MSFS, open the toolbar at the top, and click the Trade Winds icon."
Write-Host " Keep the Trade Winds app running: the panel shows what the app is doing."
