# Generate placeholder icons for Tauri build
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$sizes = 32, 128, 256
foreach ($s in $sizes) {
    $bmp = New-Object Drawing.Bitmap ($s, $s)
    $g = [Drawing.Graphics]::FromImage($bmp)
    $g.Clear([Drawing.Color]::FromArgb(255, 0, 160, 255))
    $penWidth = [Math]::Max(2, [int]($s / 16))
    $pen = New-Object Drawing.Pen ([Drawing.Color]::FromArgb(255, 0, 220, 255)), $penWidth
    $g.DrawEllipse($pen, $s * 0.1, $s * 0.1, $s * 0.8, $s * 0.8)
    $g.FillEllipse((New-Object Drawing.SolidBrush ([Drawing.Color]::FromArgb(90, 0, 220, 255))), $s * 0.25, $s * 0.25, $s * 0.5, $s * 0.5)
    $bmp.Save("${s}x${s}.png", [Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose(); $bmp.Dispose()
}

# ICO for Windows
$bmp = New-Object Drawing.Bitmap (256, 256)
$g = [Drawing.Graphics]::FromImage($bmp)
$g.Clear([Drawing.Color]::FromArgb(255, 0, 160, 255))
$pen = New-Object Drawing.Pen ([Drawing.Color]::FromArgb(255, 0, 220, 255)), 16
$g.DrawEllipse($pen, 26, 26, 204, 204)
$g.FillEllipse((New-Object Drawing.SolidBrush ([Drawing.Color]::FromArgb(90, 0, 220, 255))), 64, 64, 128, 128)
$hicon = $bmp.GetHicon()
$ico = [System.Drawing.Icon]::FromHandle($hicon)
$fs = [IO.File]::Open('icon.ico', 'Create')
$ico.Save($fs)
$fs.Close()
$g.Dispose(); $bmp.Dispose()
