Add-Type -AssemblyName System.Drawing

function Draw-Lumos-Icon {
    param (
        [int]$size,
        [string]$outputPath,
        [bool]$isRound = $false,
        [bool]$isForegroundOnly = $false
    )

    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    if (-not $isForegroundOnly) {
        if ($isRound) {
            $g.Clear([System.Drawing.Color]::Transparent)
            $brushBg = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(8, 12, 22))
            $g.FillEllipse($brushBg, 1, 1, $size - 2, $size - 2)
            $brushBg.Dispose()
        } else {
            $g.Clear([System.Drawing.Color]::FromArgb(8, 12, 22))
        }

        # Subtle celestial radial glow in center
        $glowBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(35, 21, 33, 64))
        $glowR = $size * 0.45
        $g.FillEllipse($glowBrush, ($size / 2 - $glowR), ($size / 2 - $glowR), ($glowR * 2), ($glowR * 2))
        $glowBrush.Dispose()
    } else {
        $g.Clear([System.Drawing.Color]::Transparent)
    }

    $cx = $size / 2.0
    $cy = $size / 2.0

    # Scale factor (base 108 coordinate system)
    $s = $size / 108.0

    # 1. Orbital Ring
    $ringR = 30.0 * $s
    $ringPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(190, 255, 213, 79)), (1.2 * $s)
    $g.DrawEllipse($ringPen, [float]($cx - $ringR), [float]($cy - $ringR), [float]($ringR * 2), [float]($ringR * 2))
    $ringPen.Dispose()

    # 2. Satellite Particle
    $satBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 224, 130))
    $satX = $cx + (24.0 * $s)
    $satY = $cy - (12.0 * $s)
    $satR = 2.2 * $s
    $g.FillEllipse($satBrush, [float]($satX - $satR), [float]($satY - $satR), [float]($satR * 2), [float]($satR * 2))
    $satBrush.Dispose()

    # 3. 4-Pointed Lumos Star
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $top = New-Object System.Drawing.PointF $cx, ($cy - 23.0 * $s)
    $right = New-Object System.Drawing.PointF ($cx + 23.0 * $s), $cy
    $bottom = New-Object System.Drawing.PointF $cx, ($cy + 23.0 * $s)
    $left = New-Object System.Drawing.PointF ($cx - 23.0 * $s), $cy

    # Cubic Beziers for 4 diamond curves
    $path.AddBezier($top, [System.Drawing.PointF]::new($cx, $cy - 9.0 * $s), [System.Drawing.PointF]::new($cx + 9.0 * $s, $cy), $right)
    $path.AddBezier($right, [System.Drawing.PointF]::new($cx + 9.0 * $s, $cy), [System.Drawing.PointF]::new($cx, $cy + 9.0 * $s), $bottom)
    $path.AddBezier($bottom, [System.Drawing.PointF]::new($cx, $cy + 9.0 * $s), [System.Drawing.PointF]::new($cx - 9.0 * $s, $cy), $left)
    $path.AddBezier($left, [System.Drawing.PointF]::new($cx - 9.0 * $s, $cy), [System.Drawing.PointF]::new($cx, $cy - 9.0 * $s), $top)

    # Gold Star Fill & Highlight Stroke
    $starBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 213, 79))
    $g.FillPath($starBrush, $path)
    $starBrush.Dispose()

    $starPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 249, 196)), (0.9 * $s)
    $g.DrawPath($starPen, $path)
    $starPen.Dispose()
    $path.Dispose()

    # 4. Center Core Pulse Ring & Sparkle
    $coreRingPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(140, 255, 224, 130)), (0.7 * $s)
    $cr = 5.0 * $s
    $g.DrawEllipse($coreRingPen, [float]($cx - $cr), [float]($cy - $cr), [float]($cr * 2), [float]($cr * 2))
    $coreRingPen.Dispose()

    $sparkleBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
    $sr = 2.6 * $s
    $g.FillEllipse($sparkleBrush, [float]($cx - $sr), [float]($cy - $sr), [float]($sr * 2), [float]($sr * 2))
    $sparkleBrush.Dispose()

    $dir = [System.IO.Path]::GetDirectoryName($outputPath)
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }

    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Created: $outputPath ($($size)x$($size))"
}

$densities = @(
    @{ Name = "mipmap-mdpi"; Size = 48; FgSize = 108 },
    @{ Name = "mipmap-hdpi"; Size = 72; FgSize = 162 },
    @{ Name = "mipmap-xhdpi"; Size = 96; FgSize = 216 },
    @{ Name = "mipmap-xxhdpi"; Size = 144; FgSize = 324 },
    @{ Name = "mipmap-xxxhdpi"; Size = 192; FgSize = 432 }
)

$baseDir = "android/app/src/main/res"

foreach ($d in $densities) {
    $folder = Join-Path $baseDir $d.Name
    Draw-Lumos-Icon -size $d.Size -outputPath (Join-Path $folder "ic_launcher.png") -isRound $false
    Draw-Lumos-Icon -size $d.Size -outputPath (Join-Path $folder "ic_launcher_round.png") -isRound $true
    Draw-Lumos-Icon -size $d.FgSize -outputPath (Join-Path $folder "ic_launcher_foreground.png") -isForegroundOnly $true
}

Write-Host "SUCCESS: All Lumos Android launcher icons generated successfully!"
