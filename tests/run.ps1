<#
.SYNOPSIS
  Runs Orford Live's test suite against a mocked Firebase (see README.md in this folder).

.DESCRIPTION
  Starts a throwaway local web server rooted at the project folder, builds each (real page +
  mock + spec) combination into a runnable page under tests\_build (gitignored, safe to delete),
  opens it in headless Microsoft Edge, and reports PASS/FAIL per assertion.

  Requires: Windows PowerShell, Microsoft Edge installed at the default path below. Nothing else
  (no Node, no npm) - that is why the "build" step is a plain string replace, not a bundler.

.PARAMETER Only
  Optional: run only the named test(s) - see the $tests table below for names (e.g. -Only
  inspection-dashboard-ski, kind). Omit to run everything.

.PARAMETER Quiet
  Only print failing assertions and the final totals (default: print every assertion).

.EXAMPLE
  .\run.ps1
  .\run.ps1 -Only kind,mapservice
  .\run.ps1 -Quiet
#>
param(
  [string[]]$Only,
  [int]$Budget = 30000, # virtual time: a spec that waits a lot (Sentiers) needs the margin, normal runs are not slower
  [switch]$Quiet
)

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path "$PSScriptRoot\..").Path
$buildDir = Join-Path $PSScriptRoot '_build'
$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$utf8 = New-Object Text.UTF8Encoding($false)
$port = 8765

if (-not (Test-Path $edge)) { throw "Microsoft Edge not found at $edge - edit `$edge at the top of run.ps1 if yours is elsewhere." }
New-Item -ItemType Directory -Force -Path $buildDir | Out-Null

# ---- Test definitions: which real page + which spec + which URL query strings ----------------
# "page" = built from a real page + the mock + a spec (see Build-Page). "unit" = a spec file
# that already stands alone (t-*.html style: loads real js/core/*.js directly, no mock/page needed).
$tests = @(
  @{ name = 'smoke-index';              type = 'page'; page = 'index.html';                          spec = 'smoke.html';       queries = @('?page=index&net=ski', '?page=index&net=both', '?page=index&net=ski&meteo=0') }
  @{ name = 'smoke-meteo';              type = 'page'; page = 'pages\meteo-report.html';             spec = 'smoke.html';       queries = @('?page=meteo-report&net=ski', '?page=meteo-report&net=bike') }
  @{ name = 'meteo-report';             type = 'page'; page = 'pages\meteo-report.html';             spec = 'meteo-report.html'; queries = @('?page=meteo-report&net=ski', '?page=meteo-report&net=ski&as=system', '?page=meteo-report&net=ski&as=inspector') }
  @{ name = 'smoke-support';            type = 'page'; page = 'pages\support.html';                  spec = 'smoke.html';       queries = @('?page=support&net=bike') }
  @{ name = 'smoke-user-profile';       type = 'page'; page = 'pages\user-profile.html';              spec = 'smoke.html';       queries = @('?page=profile&net=ski') }
  @{ name = 'smoke-user-management';    type = 'page'; page = 'pages\user-management.html';           spec = 'smoke.html';       queries = @('?page=user-management&net=ski&as=system', '?page=user-management&net=both&as=admin', '?page=user-management&net=both&as=admin&choice=bike') }
  @{ name = 'infraction-report';        type = 'page'; page = 'pages\infraction-report.html';         spec = 'sector-apps.html'; queries = @('?page=infraction-report&net=ski', '?page=infraction-report&net=bike') }
  @{ name = 'signalisation-report';     type = 'page'; page = 'pages\signalisation-report.html';      spec = 'sector-apps.html'; queries = @('?page=signalisation-report&net=ski', '?page=signalisation-report&net=bike', '?page=signalisation-report&net=ski&kind=downhill') }
  @{ name = 'infraction-admin';         type = 'page'; page = 'pages\infraction-admin.html';          spec = 'sector-apps.html'; queries = @('?page=infraction-admin&net=ski', '?page=infraction-admin&net=bike') }
  @{ name = 'signalisation-admin';      type = 'page'; page = 'pages\signalisation-admin.html';       spec = 'sector-apps.html'; queries = @('?page=signalisation-admin&net=ski', '?page=signalisation-admin&net=bike', '?page=signalisation-admin&net=ski&kind=downhill') }
  @{ name = 'signalisation-resume';     type = 'page'; page = 'pages\signalisation-resume.html';      spec = 'sector-apps.html'; queries = @('?page=signalisation-resume&net=ski', '?page=signalisation-resume&net=bike', '?page=signalisation-resume&net=ski&kind=downhill') }
  @{ name = 'inspection-dashboard';     type = 'page'; page = 'pages\inspection-dashboard.html';      spec = 'inspection.html'; queries = @('?page=inspection-dashboard&net=ski', '?page=inspection-dashboard&net=bike', '?page=inspection-dashboard&net=both&choice=ski', '?page=inspection-dashboard&net=both&choice=bike', '?page=inspection-dashboard&net=ski&kind=downhill') }
  @{ name = 'inspection-trail-report';  type = 'page'; page = 'pages\inspection-trail-report.html';   spec = 'inspection.html'; queries = @('?page=inspection-trail-report&net=ski', '?page=inspection-trail-report&net=bike', '?page=inspection-trail-report&net=ski&kind=downhill', '?page=inspection-trail-report&net=ski&trail=trail_2&status=open', '?page=inspection-trail-report&net=bike&trail=bike_2&status=open', '?page=inspection-trail-report&net=ski&kind=downhill&trail=run_extra&status=closed') }
  @{ name = 'inspection-shelter-report';type = 'page'; page = 'pages\inspection-shelter-report.html'; spec = 'inspection.html'; queries = @('?page=inspection-shelter-report&net=ski', '?page=inspection-shelter-report&net=bike', '?page=inspection-shelter-report&net=ski&kind=downhill', '?page=inspection-shelter-report&net=ski&shelter=shelter_1') }
  @{ name = 'inspection-history';       type = 'page'; page = 'pages\inspection-history.html';        spec = 'inspection.html'; queries = @('?page=inspection-history&net=ski', '?page=inspection-history&net=bike', '?page=inspection-history&net=ski&kind=downhill', '?page=inspection-history&net=ski&as=system&choice=ski') }
  @{ name = 'inspection-admin';         type = 'page'; page = 'pages\inspection-admin.html';          spec = 'inspection.html'; queries = @('?page=inspection-admin&net=ski', '?page=inspection-admin&net=bike', '?page=inspection-admin&net=ski&kind=downhill', '?page=inspection-admin&net=ski&as=system&choice=ski') }
  @{ name = 'cartes-tab';               type = 'page'; page = 'pages\user-management.html';           spec = 'maps.html';       queries = @('?page=user-management&net=ski&as=system') }
  @{ name = 'sentiers-tab';             type = 'page'; page = 'pages\user-management.html';           spec = 'trails.html';     queries = @('?page=user-management&net=ski&as=system&choice=ski') }
  @{ name = 'photoloc-signalisation-admin';  type = 'page'; page = 'pages\signalisation-admin.html';  spec = 'photolocation-pages.html'; queries = @('?page=signalisation-admin&net=ski&kind=downhill') }
  @{ name = 'photoloc-signalisation-resume'; type = 'page'; page = 'pages\signalisation-resume.html'; spec = 'photolocation-pages.html'; queries = @('?page=signalisation-resume&net=ski&kind=downhill&as=inspector', '?page=signalisation-resume&net=ski&kind=downhill&as=admin') }
  @{ name = 'photoloc-inspection-history';   type = 'page'; page = 'pages\inspection-history.html';   spec = 'photolocation-pages.html'; queries = @('?page=inspection-history&net=ski&as=inspector', '?page=inspection-history&net=ski&as=admin') }
  @{ name = 'photoloc-inspection-dashboard'; type = 'page'; page = 'pages\inspection-dashboard.html'; spec = 'photolocation-pages.html'; queries = @('?page=inspection-dashboard&net=ski&as=inspector') }
  @{ name = 'photoloc-maintenance-admin';    type = 'page'; page = 'pages\maintenance-admin.html';    spec = 'photolocation-pages.html'; queries = @('?page=maintenance-admin&net=bike') }
  @{ name = 'photoloc-infraction-admin';     type = 'page'; page = 'pages\infraction-admin.html';     spec = 'photolocation-pages.html'; queries = @('?page=infraction-admin&net=ski') }
  @{ name = 'photoloc-signalisation-report'; type = 'page'; page = 'pages\signalisation-report.html'; spec = 'photolocation-pages.html'; queries = @('?page=signalisation-report&net=ski&kind=downhill') }
  @{ name = 'photoloc-infraction-report';    type = 'page'; page = 'pages\infraction-report.html';    spec = 'photolocation-pages.html'; queries = @('?page=infraction-report&net=ski') }
  @{ name = 'photoloc-maintenance-report';   type = 'page'; page = 'pages\maintenance-report.html';   spec = 'photolocation-pages.html'; queries = @('?page=maintenance-report&net=bike') }
  @{ name = 'stats-infraction';    type = 'page'; page = 'pages\infraction-stats.html';    spec = 'data-admin-pages.html'; queries = @('?page=infraction-stats&net=ski', '?page=infraction-stats&net=bike', '?page=infraction-stats&net=ski&as=system&choice=ski') }
  @{ name = 'stats-signalisation'; type = 'page'; page = 'pages\signalisation-stats.html'; spec = 'data-admin-pages.html'; queries = @('?page=signalisation-stats&net=ski', '?page=signalisation-stats&net=ski&kind=downhill', '?page=signalisation-stats&net=bike', '?page=signalisation-stats&net=ski&kind=downhill&as=system&choice=ski') }
  @{ name = 'stats-maintenance';   type = 'page'; page = 'pages\maintenance-stats.html';   spec = 'data-admin-pages.html'; queries = @('?page=maintenance-stats&net=bike', '?page=maintenance-stats&net=ski', '?page=maintenance-stats&net=bike&as=system&choice=bike') }
  @{ name = 'new-password';             type = 'page'; page = 'pages\new-password.html';             spec = 'new-password.html'; queries = @('?page=new-password&mode=resetPassword&oobCode=CODE1&code=ok', '?page=new-password&mode=resetPassword&oobCode=CODE1&code=ok&confirm=weak', '?page=new-password&mode=resetPassword&oobCode=CODE1&code=ok&confirm=used', '?page=new-password&mode=resetPassword&oobCode=CODE1&code=expired', '?page=new-password&mode=resetPassword&oobCode=CODE1&code=invalid', '?page=new-password&mode=resetPassword&oobCode=CODE1&code=offline', '?page=new-password&mode=resetPassword', '?page=new-password&mode=verifyEmail&oobCode=CODE1') }
  @{ name = 'stats-meteo';         type = 'page'; page = 'pages\meteo-stats.html';         spec = 'meteo-stats.html'; queries = @('?page=meteo-stats&net=ski', '?page=meteo-stats&net=bike', '?page=meteo-stats&net=ski&as=system&choice=ski', '?page=meteo-stats&net=bike&as=system&choice=bike') }
  @{ name = 'trailservice';             type = 'unit'; spec = 'trailservice.html' }
  @{ name = 'mapservice';               type = 'unit'; spec = 'mapservice.html' }
  @{ name = 'kind';                     type = 'unit'; spec = 'kind.html' }
  @{ name = 'hosting';                  type = 'unit'; spec = 'hosting.html' }
  @{ name = 'photolocation';             type = 'unit'; spec = 'photolocation.html' }
  @{ name = 'storage-cleanup';            type = 'unit'; spec = 'storage-cleanup.html' }
  @{ name = 'volunteer-limits';           type = 'unit'; spec = 'volunteer-limits.html' }
  @{ name = 'weather-service';            type = 'unit'; spec = 'weather-service.html' }
  @{ name = 'weather-public';             type = 'unit'; spec = 'weather-public.html' }
)
if ($Only) { $tests = $tests | Where-Object { $Only -contains $_.name } }

# ---- Build: real page + mock (replacing the firebase-loader/auth script pair) + spec ---------
# A page under pages\ is built to tests\_build\pages\ (not just tests\_build\) so its served URL
# still contains "/pages/" at the same relative depth as the real thing - several core scripts
# (network.js, layout.js, config.js, auth.js) branch on that to build "../assets/...", "../js/..."
# style paths at runtime; _server.ps1 falls those back to the real js/css/assets next door.
# index.html is the one page that lives at the site root instead (no "../" prefix, not under
# pages\), so it is built one level shallower to match. Building it at the wrong depth "works" for
# plain <script src="js/..."> tags but silently breaks anything computed at runtime, like the map
# image src - which is exactly how this was first discovered (a "map is missing" failure).
function Build-Page($def) {
  $mock = [IO.File]::ReadAllText("$PSScriptRoot\mock.html", $utf8)
  $page = [IO.File]::ReadAllText("$root\$($def.page)", $utf8)
  $isSubPage = $def.page -like 'pages\*'
  $rx = if ($isSubPage) {
    '<script src="\.\./js/core/firebase-loader\.js"></script>\s*<script src="\.\./js/core/auth\.js"></script>'
  } else {
    '<script src="js/core/firebase-loader\.js"></script>\s*<script src="js/core/auth\.js"></script>'
  }
  if (-not [regex]::IsMatch($page, $rx)) { throw "loader/auth scripts not found in $($def.page) - has that page's markup changed?" }
  $page = [regex]::Replace($page, $rx, { param($m) $mock })
  $spec = [IO.File]::ReadAllText("$PSScriptRoot\specs\$($def.spec)", $utf8)
  if ($isSubPage) {
    New-Item -ItemType Directory -Force -Path "$buildDir\pages" | Out-Null
    $out = "$buildDir\pages\$($def.name).html"
  } else {
    $out = "$buildDir\$($def.name).html"
  }
  [IO.File]::WriteAllText($out, $page.Replace('</body>', $spec + "`n</body>"), $utf8)
  return $out
}

# ---- A tiny static server, rooted at the project (tests\_build lives inside it, so it just works).
# Run as a separate process, not a background job: Start-ThreadJob needs a module Windows
# PowerShell 5.1 doesn't ship with by default.
Start-Process powershell.exe -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-File',"$PSScriptRoot\_server.ps1",'-Root',$root,'-Port',$port) -WindowStyle Hidden

try {
  Start-Sleep -Seconds 2
  $totalPass = 0; $totalFail = 0
  foreach ($def in $tests) {
    $urls = if ($def.type -eq 'unit') { , "tests/specs/$($def.spec)" } else {
      Build-Page $def | Out-Null
      $builtPath = if ($def.page -like 'pages\*') { "tests/_build/pages/$($def.name).html" } else { "tests/_build/$($def.name).html" }
      $def.queries | ForEach-Object { "$builtPath$_" }
    }
    foreach ($url in $urls) {
      $o = "$buildDir\last-run.dom.txt"
      Start-Process -FilePath $edge -ArgumentList @('--headless=new','--disable-gpu',"--virtual-time-budget=$Budget",'--dump-dom',"http://localhost:$port/$url") -RedirectStandardOutput $o -RedirectStandardError "$buildDir\edge-err.txt" -Wait -NoNewWindow
      $d = [IO.File]::ReadAllText($o)
      if ($d -match '(?s)<pre id="out"[^>]*>(.*?)</pre>') {
        $lines = ([Net.WebUtility]::HtmlDecode($Matches[1])) -split "`n"
        $p = @($lines | Where-Object { $_ -like 'PASS*' }).Count
        $f = @($lines | Where-Object { $_ -notlike 'PASS*' -and $_.Trim() }).Count
        $totalPass += $p; $totalFail += $f
        "===== $url : $p pass, $f fail/other ====="
        if ($Quiet) { $lines | Where-Object { $_ -notlike 'PASS*' -and $_.Trim() } } else { $lines }
      } else { "===== $url : NO OUTPUT ====="; $totalFail++ }
    }
  }
  "TOTAL: $totalPass pass, $totalFail fail/other"
} finally {
  Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" |
    Where-Object { $_.CommandLine -match '_server\.ps1' } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
}
