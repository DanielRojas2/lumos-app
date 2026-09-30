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
            $brushBg = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(10, 15, 29))
            $g.FillEllipse($brushBg, 1, 1, $size - 2, $size - 2)
            $brushBg.Dispose()
        } else {
            $g.Clear([System.Drawing.Color]::FromArgb(10, 15, 29))
        }

        # Subtle cosmic ambient radial glow in center
        $glowBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(40, 26, 42, 78))
        $glowR = $size * 0.45
        $g.FillEllipse($glowBrush, [float]($size / 2 - $glowR), [float]($size / 2 - $glowR), [float]($glowR * 2), [float]($glowR * 2))
        $glowBrush.Dispose()
    } else {
        $g.Clear([System.Drawing.Color]::Transparent)
    }

    $cx = $size / 2.0
    $cy = $size / 2.0

    # Scale factor (base 108 coordinate system)
    $s = $size / 108.0

    # 1. Outer Concentric Dashed Ring (radius 39.0)
    $outerR = 39.0 * $s
    $outerPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(120, 255, 213, 79)), (0.9 * $s)
    $outerPen.DashStyle = [System.Drawing.Drawing2D.DashStyle]::Dash
    $g.DrawEllipse($outerPen, [float]($cx - $outerR), [float]($cy - $outerR), [float]($outerR * 2), [float]($outerR * 2))
    $outerPen.Dispose()

    # 2. Inner Solid Golden Circular Ring (radius 27.0)
    $ringR = 27.0 * $s
    $ringPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(240, 255, 213, 79)), (1.4 * $s)
    $g.DrawEllipse($ringPen, [float]($cx - $ringR), [float]($cy - $ringR), [float]($ringR * 2), [float]($ringR * 2))
    $ringPen.Dispose()

    # 3. Horizontal & Vertical Needle Crossbars (touching the inner ring)
    $needlePen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(230, 255, 224, 130)), (0.9 * $s)
    $g.DrawLine($needlePen, [float]($cx - $ringR), [float]$cy, [float]($cx + $ringR), [float]$cy)
    $g.DrawLine($needlePen, [float]$cx, [float]($cy - $ringR), [float]$cx, [float]($cy + $ringR))
    $needlePen.Dispose()

    # 4. Central 4-Pointed Flared Golden Star Body
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $top = New-Object System.Drawing.PointF $cx, ($cy - $ringR)
    $right = New-Object System.Drawing.PointF ($cx + $ringR), $cy
    $bottom = New-Object System.Drawing.PointF $cx, ($cy + $ringR)
    $left = New-Object System.Drawing.PointF ($cx - $ringR), $cy

    # Cubic Beziers for 4 diamond curves
    $pinch = 9.0 * $s
    $path.AddBezier($top, [System.Drawing.PointF]::new($cx, $cy - $pinch), [System.Drawing.PointF]::new($cx + $pinch, $cy), $right)
    $path.AddBezier($right, [System.Drawing.PointF]::new($cx + $pinch, $cy), [System.Drawing.PointF]::new($cx, $cy + $pinch), $bottom)
    $path.AddBezier($bottom, [System.Drawing.PointF]::new($cx, $cy + $pinch), [System.Drawing.PointF]::new($cx - $pinch, $cy), $left)
    $path.AddBezier($left, [System.Drawing.PointF]::new($cx - $pinch, $cy), [System.Drawing.PointF]::new($cx, $cy - $pinch), $top)

    # Gold Star Fill & Highlight Stroke
    $starBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 213, 79))
    $g.FillPath($starBrush, $path)
    $starBrush.Dispose()

    $starPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 255, 249, 196)), (0.6 * $s)
    $g.DrawPath($starPen, $path)
    $starPen.Dispose()
    $path.Dispose()

    # 5. Orbiting Golden Satellite Particle (Lower Left at 210° on the inner ring)
    # In screen coordinates: x = cx + R * cos(210°), y = cy - R * sin(210°) -> sin(210°) = -0.5
    $angleRad = 210.0 * [Math]::PI / 180.0
    $satX = $cx + ($ringR * [Math]::Cos($angleRad))
    $satY = $cy - ($ringR * [Math]::Sin($angleRad))

    # Glow halo around satellite
    $satGlowBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(80, 255, 160, 0))
    $glowSize = 4.5 * $s
    $g.FillEllipse($satGlowBrush, [float]($satX - $glowSize), [float]($satY - $glowSize), [float]($glowSize * 2), [float]($glowSize * 2))
    $satGlowBrush.Dispose()

    # Satellite body
    $satBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 255, 224, 130))
    $satR = 2.4 * $s
    $g.FillEllipse($satBrush, [float]($satX - $satR), [float]($satY - $satR), [float]($satR * 2), [float]($satR * 2))
    $satBrush.Dispose()

    # Satellite sparkle center
    $satSparkle = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
    $sparkleR = 1.0 * $s
    $g.FillEllipse($satSparkle, [float]($satX - $sparkleR), [float]($satY - $sparkleR), [float]($sparkleR * 2), [float]($sparkleR * 2))
    $satSparkle.Dispose()

    # 6. Center Light Core Dot
    $coreBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 255, 253, 231))
    $cr = 2.4 * $s
    $g.FillEllipse($coreBrush, [float]($cx - $cr), [float]($cy - $cr), [float]($cr * 2), [float]($cr * 2))
    $coreBrush.Dispose()

    $sparkleBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
    $sr = 1.2 * $s
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

# Also generate web favicon PNG and splash icon
Draw-Lumos-Icon -size 64 -outputPath "public/favicon.png" -isRound $true
Draw-Lumos-Icon -size 192 -outputPath "public/icon-192.png" -isRound $false
Draw-Lumos-Icon -size 512 -outputPath "public/icon-512.png" -isRound $false

Write-Host "SUCCESS: All Lumos Android launcher icons and Web favicons generated successfully!"
