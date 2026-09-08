# Minimal static file server for the prototype.
#
# The prototype needs a real http:// origin: the YouTube IFrame Player API does
# not work from file:// or data: URLs. This uses HttpListener so it runs on a
# stock Windows box with no Node, Python or package install.
#
#   powershell -ExecutionPolicy Bypass -File prototype/serve.ps1
#
# Then open http://localhost:5173/ . Ctrl+C to stop.

param(
    [int]$Port = 5173
)

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot

$types = @{
    '.html' = 'text/html; charset=utf-8'
    '.css'  = 'text/css; charset=utf-8'
    '.js'   = 'text/javascript; charset=utf-8'
    '.json' = 'application/json; charset=utf-8'
    '.svg'  = 'image/svg+xml'
    '.png'  = 'image/png'
    '.ico'  = 'image/x-icon'
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")

try {
    $listener.Start()
} catch {
    Write-Error "Could not listen on port $Port. Is something already using it? ($_)"
    exit 1
}

Write-Host "Yohaku prototype serving $root"
Write-Host "  http://localhost:$Port/"
Write-Host "Press Ctrl+C to stop."

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $req = $context.Request
        $res = $context.Response

        # One bad request must never take the server down with it.
        try {
            $rel = [System.Uri]::UnescapeDataString($req.Url.AbsolutePath).TrimStart('/')
            if ([string]::IsNullOrWhiteSpace($rel)) { $rel = 'index.html' }

            # Resolve inside the prototype directory only; reject anything that
            # escapes it, so a stray ../ cannot read the rest of the disk.
            $full = [System.IO.Path]::GetFullPath((Join-Path $root $rel))
            $rootFull = [System.IO.Path]::GetFullPath($root)

            if (-not $full.StartsWith($rootFull, [System.StringComparison]::OrdinalIgnoreCase)) {
                $res.StatusCode = 403
                $bytes = [System.Text.Encoding]::UTF8.GetBytes('403 forbidden')
                Write-Host "403 /$rel"
            } elseif (Test-Path -LiteralPath $full -PathType Leaf) {
                $ext = [System.IO.Path]::GetExtension($full).ToLowerInvariant()
                if ($types.ContainsKey($ext)) { $res.ContentType = $types[$ext] }
                else { $res.ContentType = 'application/octet-stream' }
                $bytes = [System.IO.File]::ReadAllBytes($full)
                Write-Host "200 /$rel"
            } else {
                $res.StatusCode = 404
                $res.ContentType = 'text/plain; charset=utf-8'
                $bytes = [System.Text.Encoding]::UTF8.GetBytes("404 $rel")
                Write-Host "404 /$rel"
            }

            # A HEAD request must carry the headers but no body.
            if ($req.HttpMethod -eq 'HEAD') { $bytes = @() }

            # Close(bytes, willBlock) sets Content-Length, writes and closes in
            # one step, which avoids mismatching the length ourselves.
            $res.Close([byte[]]$bytes, $true)
        } catch {
            Write-Host "ERR  $($req.Url.AbsolutePath): $($_.Exception.Message)"
            try { $res.Abort() } catch { }
        }
    }
} finally {
    $listener.Stop()
    $listener.Dispose()
}
