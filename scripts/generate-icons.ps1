Add-Type -AssemblyName System.Drawing

function Resize-Image($srcPath, $dstPath, $size) {
    $src = [System.Drawing.Image]::FromFile($srcPath)
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.DrawImage($src, 0, 0, $size, $size)
    $bmp.Save($dstPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    $src.Dispose()
    Write-Host "Generated $dstPath"
}

Resize-Image 'D:\Tradosphere-Final\public\Tradosphere Logo.png' 'D:\Tradosphere-Final\public\icons\icon-192.png' 192
Resize-Image 'D:\Tradosphere-Final\public\Tradosphere Logo.png' 'D:\Tradosphere-Final\public\icons\icon-512.png' 512
Resize-Image 'D:\Tradosphere-Final\public\Tradosphere Logo.png' 'D:\Tradosphere-Final\public\icons\icon-maskable-192.png' 192
Resize-Image 'D:\Tradosphere-Final\public\Tradosphere Logo.png' 'D:\Tradosphere-Final\public\icons\icon-maskable-512.png' 512
Resize-Image 'D:\Tradosphere-Final\public\Tradosphere Logo.png' 'D:\Tradosphere-Final\public\icons\apple-touch-icon.png' 180
Resize-Image 'D:\Tradosphere-Final\public\Tradosphere Logo.png' 'D:\Tradosphere-Final\public\favicon.png' 32
