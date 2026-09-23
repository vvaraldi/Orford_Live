<#
  Tiny static file server for the test suite, rooted at the project folder. Run by run.ps1 as a
  separate process (Start-ThreadJob needs a module Windows PowerShell 5.1 doesn't ship with, so a
  plain child process is what actually works here). Not meant to be run by hand.
#>
param([string]$Root, [int]$Port = 8765)
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
$mime = @{ '.html'='text/html; charset=utf-8'; '.css'='text/css'; '.js'='application/javascript'; '.png'='image/png'; '.jpg'='image/jpeg'; '.svg'='image/svg+xml'; '.json'='application/json' }
while ($listener.IsListening) {
  $c = $listener.GetContext()
  $p = [Uri]::UnescapeDataString($c.Request.Url.AbsolutePath).TrimStart('/')
  if ($p -eq '') { $p = 'index.html' }
  $f = Join-Path $Root $p
  if (-not (Test-Path $f -PathType Leaf) -and $p -match '^tests/_build/(js|css|assets)/(.+)$') {
    # A built page lives at tests/_build/pages/*.html so the app's own "am I under /pages/?"
    # path checks (network.js, layout.js, config.js, auth.js) behave exactly as they do for a
    # real page; its "../js/..." etc. then resolve to tests/_build/js/... which does not
    # physically exist - fall back to the real js/css/assets next to it instead.
    $f = Join-Path $Root "$($Matches[1])/$($Matches[2])"
  }
  if ((Test-Path $f -PathType Leaf) -and ((Resolve-Path $f).Path.StartsWith($Root))) {
    $b = [IO.File]::ReadAllBytes($f)
    $e = [IO.Path]::GetExtension($f).ToLower()
    $c.Response.ContentType = if ($mime.ContainsKey($e)) { $mime[$e] } else { 'application/octet-stream' }
    $c.Response.OutputStream.Write($b, 0, $b.Length)
  } else { $c.Response.StatusCode = 404 }
  $c.Response.Close()
}
