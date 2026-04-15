$ErrorActionPreference = 'Stop'

$root = 'C:\Users\HP\Desktop\stich'
$prefix = 'http://127.0.0.1:8000/'

Add-Type -AssemblyName System.Web

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)
$listener.Start()

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $requestPath = [System.Web.HttpUtility]::UrlDecode($context.Request.Url.AbsolutePath)
        if ([string]::IsNullOrWhiteSpace($requestPath) -or $requestPath -eq '/') {
            $requestPath = '/index.html'
        }

        $relativePath = $requestPath.TrimStart('/').Replace('/', '\')
        $fullPath = Join-Path $root $relativePath

        if ((Test-Path $fullPath) -and (Get-Item $fullPath).PSIsContainer) {
            $fullPath = Join-Path $fullPath 'index.html'
        }

        if (-not (Test-Path $fullPath)) {
            $context.Response.StatusCode = 404
            $fullPath = Join-Path $root '404.html'
        }

        if (Test-Path $fullPath) {
            $bytes = [System.IO.File]::ReadAllBytes($fullPath)
            $extension = [System.IO.Path]::GetExtension($fullPath).ToLowerInvariant()
            $contentType = switch ($extension) {
                '.html' { 'text/html; charset=utf-8' }
                '.js' { 'application/javascript; charset=utf-8' }
                '.css' { 'text/css; charset=utf-8' }
                '.json' { 'application/json; charset=utf-8' }
                '.svg' { 'image/svg+xml' }
                '.png' { 'image/png' }
                '.jpg' { 'image/jpeg' }
                '.jpeg' { 'image/jpeg' }
                '.webp' { 'image/webp' }
                '.gif' { 'image/gif' }
                '.ico' { 'image/x-icon' }
                '.mp4' { 'video/mp4' }
                '.woff' { 'font/woff' }
                '.woff2' { 'font/woff2' }
                default { 'application/octet-stream' }
            }

            $context.Response.ContentType = $contentType
            $context.Response.ContentLength64 = $bytes.Length
            $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
        }

        $context.Response.OutputStream.Close()
    }
}
finally {
    if ($listener.IsListening) {
        $listener.Stop()
    }
    $listener.Close()
}
