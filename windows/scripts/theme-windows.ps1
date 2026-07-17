. (Join-Path $PSScriptRoot 'config-utf8.ps1')

function Get-DreamSkinThemeStateRoot {
  return (Join-Path $env:LOCALAPPDATA 'CodexDreamSkin')
}

function Get-DreamSkinThemesRoot {
  return (Join-Path (Get-DreamSkinThemeStateRoot) 'themes')
}

function Get-DreamSkinActiveThemePath {
  return (Join-Path (Get-DreamSkinThemeStateRoot) 'active-theme.json')
}

function Assert-DreamSkinThemeId {
  param([Parameter(Mandatory = $true)][string]$Id)
  if ($Id -notmatch '^[a-z0-9][a-z0-9._-]{0,63}$') {
    throw "Invalid theme ID: $Id"
  }
}

function Test-DreamSkinThemeColor {
  param([AllowNull()][string]$Value)
  return [string]::IsNullOrEmpty($Value) -or $Value -match '^#[0-9A-Fa-f]{6}$'
}

function Format-DreamSkinRgbHex {
  param(
    [Parameter(Mandatory = $true)][int]$Red,
    [Parameter(Mandatory = $true)][int]$Green,
    [Parameter(Mandatory = $true)][int]$Blue
  )
  $r = [Math]::Max(0, [Math]::Min(255, $Red))
  $g = [Math]::Max(0, [Math]::Min(255, $Green))
  $b = [Math]::Max(0, [Math]::Min(255, $Blue))
  return ('#{0:X2}{1:X2}{2:X2}' -f $r, $g, $b)
}

function Mix-DreamSkinRgb {
  param(
    [Parameter(Mandatory = $true)][int[]]$First,
    [Parameter(Mandatory = $true)][int[]]$Second,
    [Parameter(Mandatory = $true)][double]$SecondWeight
  )
  $weight = [Math]::Max(0.0, [Math]::Min(1.0, $SecondWeight))
  return @(
    [int][Math]::Round(($First[0] * (1.0 - $weight)) + ($Second[0] * $weight)),
    [int][Math]::Round(($First[1] * (1.0 - $weight)) + ($Second[1] * $weight)),
    [int][Math]::Round(($First[2] * (1.0 - $weight)) + ($Second[2] * $weight))
  )
}

function Get-DreamSkinImagePalette {
  param([Parameter(Mandatory = $true)][string]$ImagePath)
  Add-Type -AssemblyName System.Drawing
  $source = $null
  $bitmap = $null
  try {
    $source = [System.Drawing.Image]::FromFile([System.IO.Path]::GetFullPath($ImagePath))
    $bitmap = New-Object System.Drawing.Bitmap $source
    $stepX = [Math]::Max(1, [int][Math]::Ceiling($bitmap.Width / 72.0))
    $stepY = [Math]::Max(1, [int][Math]::Ceiling($bitmap.Height / 72.0))
    $bins = @{}
    [long]$redTotal = 0
    [long]$greenTotal = 0
    [long]$blueTotal = 0
    [long]$sampleCount = 0
    [double]$luminanceTotal = 0.0
    [double]$saturationTotal = 0.0
    [double]$saliencyTotal = 0.0
    [double]$saliencyX = 0.0
    [double]$saliencyY = 0.0
    [double]$edgeTotal = 0.0
    [long]$edgeCount = 0
    for ($y = 0; $y -lt $bitmap.Height; $y += $stepY) {
      $previousPixel = $null
      for ($x = 0; $x -lt $bitmap.Width; $x += $stepX) {
        $pixel = $bitmap.GetPixel($x, $y)
        if ($pixel.A -lt 128) { continue }
        $redTotal += $pixel.R
        $greenTotal += $pixel.G
        $blueTotal += $pixel.B
        $sampleCount++
        $pixelMaximum = [Math]::Max($pixel.R, [Math]::Max($pixel.G, $pixel.B))
        $pixelMinimum = [Math]::Min($pixel.R, [Math]::Min($pixel.G, $pixel.B))
        $pixelSaturation = if ($pixelMaximum -le 0) { 0.0 } else { ($pixelMaximum - $pixelMinimum) / $pixelMaximum }
        $pixelLuminance = (($pixel.R * 0.2126) + ($pixel.G * 0.7152) + ($pixel.B * 0.0722)) / 255.0
        $luminanceTotal += $pixelLuminance
        $saturationTotal += $pixelSaturation
        $saliency = 0.05 + ($pixelSaturation * (1.0 - [Math]::Abs($pixelLuminance - 0.5)))
        $saliencyTotal += $saliency
        $saliencyX += (($x + 0.5) / $bitmap.Width) * $saliency
        $saliencyY += (($y + 0.5) / $bitmap.Height) * $saliency
        if ($null -ne $previousPixel) {
          $edgeTotal += ([Math]::Abs($pixel.R - $previousPixel.R) +
            [Math]::Abs($pixel.G - $previousPixel.G) +
            [Math]::Abs($pixel.B - $previousPixel.B)) / 765.0
          $edgeCount++
        }
        $previousPixel = $pixel
        $key = '{0}-{1}-{2}' -f ([int]($pixel.R / 32)), ([int]($pixel.G / 32)), ([int]($pixel.B / 32))
        if (-not $bins.ContainsKey($key)) {
          $bins[$key] = [pscustomobject]@{ Count = 0; Red = 0L; Green = 0L; Blue = 0L }
        }
        $bucket = $bins[$key]
        $bucket.Count++
        $bucket.Red += $pixel.R
        $bucket.Green += $pixel.G
        $bucket.Blue += $pixel.B
      }
    }
    if ($sampleCount -lt 1 -or $bins.Count -lt 1) { throw 'Image did not contain usable opaque pixels.' }

    $best = $null
    $bestScore = -1.0
    foreach ($bucket in $bins.Values) {
      $red = [double]$bucket.Red / $bucket.Count
      $green = [double]$bucket.Green / $bucket.Count
      $blue = [double]$bucket.Blue / $bucket.Count
      $maximum = [Math]::Max($red, [Math]::Max($green, $blue))
      $minimum = [Math]::Min($red, [Math]::Min($green, $blue))
      $saturation = if ($maximum -le 0) { 0.0 } else { ($maximum - $minimum) / $maximum }
      $luminance = (($red * 0.2126) + ($green * 0.7152) + ($blue * 0.0722)) / 255.0
      if ($saturation -lt 0.18 -or $luminance -lt 0.08 -or $luminance -gt 0.88) { continue }
      $middleWeight = [Math]::Max(0.2, 1.0 - [Math]::Abs($luminance - 0.52))
      $score = [Math]::Sqrt($bucket.Count) * (0.25 + (3.0 * $saturation)) * $middleWeight
      if ($score -gt $bestScore) { $best = $bucket; $bestScore = $score }
    }

    $average = @(
      [int]($redTotal / $sampleCount),
      [int]($greenTotal / $sampleCount),
      [int]($blueTotal / $sampleCount)
    )
    $accent = if ($null -ne $best) {
      @([int]($best.Red / $best.Count), [int]($best.Green / $best.Count), [int]($best.Blue / $best.Count))
    } else {
      $average
    }
    $black = @(0, 0, 0)
    $white = @(255, 255, 255)
    $ink = Mix-DreamSkinRgb -First $accent -Second $black -SecondWeight 0.62
    $purple = Mix-DreamSkinRgb -First $accent -Second $black -SecondWeight 0.18
    $violet = Mix-DreamSkinRgb -First $accent -Second $average -SecondWeight 0.18
    $pink = Mix-DreamSkinRgb -First $accent -Second $white -SecondWeight 0.25
    $blush = Mix-DreamSkinRgb -First $average -Second $white -SecondWeight 0.86
    $averageLuminance = $luminanceTotal / $sampleCount
    $averageSaturation = $saturationTotal / $sampleCount
    $edgeDensity = if ($edgeCount -gt 0) { $edgeTotal / $edgeCount } else { 0.0 }
    $focalX = if ($saliencyTotal -gt 0) { $saliencyX / $saliencyTotal } else { 0.5 }
    $focalY = if ($saliencyTotal -gt 0) { $saliencyY / $saliencyTotal } else { 0.5 }
    $aspectRatio = $bitmap.Width / [double]$bitmap.Height
    $decoration = if ($averageLuminance -lt 0.34 -and $averageSaturation -gt 0.24) {
      'neon'
    } elseif ($edgeDensity -gt 0.19) {
      'minimal'
    } elseif ($averageSaturation -lt 0.18) {
      'geometric'
    } else {
      'soft'
    }
    $textSide = if ($focalX -ge 0.52) { 'left' } else { 'right' }
    $heroHeight = if ($aspectRatio -lt 1.05) { 286 } elseif ($aspectRatio -gt 1.9) { 238 } else { 252 }
    $cornerRadius = if ($decoration -eq 'minimal') { 17 } elseif ($decoration -eq 'geometric') { 20 } else { 26 }
    $cardRadius = if ($decoration -eq 'minimal') { 14 } elseif ($decoration -eq 'geometric') { 18 } else { 23 }
    $decorationDensity = if ($decoration -eq 'minimal') { 0.18 } elseif ($decoration -eq 'neon') { 0.82 } else { 0.62 }
    $overlayStrength = if ($averageLuminance -lt 0.34) { 0.62 } elseif ($averageLuminance -gt 0.72) { 0.86 } else { 0.76 }
    return [pscustomobject]@{
      Ink = Format-DreamSkinRgbHex $ink[0] $ink[1] $ink[2]
      Purple = Format-DreamSkinRgbHex $purple[0] $purple[1] $purple[2]
      Violet = Format-DreamSkinRgbHex $violet[0] $violet[1] $violet[2]
      Pink = Format-DreamSkinRgbHex $pink[0] $pink[1] $pink[2]
      Blush = Format-DreamSkinRgbHex $blush[0] $blush[1] $blush[2]
      Design = [pscustomobject]@{
        Mode = 'auto'
        TextSide = $textSide
        Decoration = $decoration
        FocalX = [Math]::Round([Math]::Max(0.12, [Math]::Min(0.88, $focalX)), 3)
        FocalY = [Math]::Round([Math]::Max(0.12, [Math]::Min(0.88, $focalY)), 3)
        HeroHeight = $heroHeight
        CornerRadius = $cornerRadius
        CardRadius = $cardRadius
        DecorationDensity = $decorationDensity
        OverlayStrength = $overlayStrength
        ShowPolaroid = [bool]($decoration -ne 'minimal' -and $aspectRatio -ge 1.15)
        ImageAspectRatio = [Math]::Round($aspectRatio, 3)
        ImageLuminance = [Math]::Round($averageLuminance, 3)
        ImageSaturation = [Math]::Round($averageSaturation, 3)
        ImageEdgeDensity = [Math]::Round($edgeDensity, 3)
      }
    }
  } finally {
    if ($null -ne $bitmap) { $bitmap.Dispose() }
    if ($null -ne $source) { $source.Dispose() }
  }
}

function Read-DreamSkinThemeJson {
  param([Parameter(Mandatory = $true)][string]$Path)
  $value = (Read-DreamSkinUtf8File -Path $Path) | ConvertFrom-Json -ErrorAction Stop
  if ($null -eq $value -or $value -is [array]) { throw "Theme JSON must contain one object: $Path" }
  return $value
}

function Test-DreamSkinPathWithinRoot {
  param(
    [Parameter(Mandatory = $true)][string]$Path,
    [Parameter(Mandatory = $true)][string]$Root
  )
  $fullPath = [System.IO.Path]::GetFullPath($Path)
  $fullRoot = [System.IO.Path]::GetFullPath($Root).TrimEnd('\') + '\'
  return $fullPath.StartsWith($fullRoot, [System.StringComparison]::OrdinalIgnoreCase)
}

function Read-DreamSkinThemeManifest {
  param([Parameter(Mandatory = $true)][string]$ThemeDirectory)
  $directory = [System.IO.Path]::GetFullPath($ThemeDirectory)
  $manifestPath = Join-Path $directory 'theme.json'
  if (-not (Test-Path -LiteralPath $manifestPath -PathType Leaf)) {
    throw "Theme manifest is missing: $manifestPath"
  }
  $theme = Read-DreamSkinThemeJson -Path $manifestPath
  if ([int]$theme.schemaVersion -ne 1) { throw 'Only theme schemaVersion 1 is supported.' }
  Assert-DreamSkinThemeId -Id "$($theme.id)"
  if ([string]::IsNullOrWhiteSpace("$($theme.name)")) { throw 'Theme name cannot be empty.' }
  if ([string]::IsNullOrWhiteSpace("$($theme.image)")) { throw 'Theme image cannot be empty.' }
  if ([System.IO.Path]::GetFileName("$($theme.image)") -cne "$($theme.image)") {
    throw 'Theme image must be a file name inside the theme directory.'
  }
  $extension = [System.IO.Path]::GetExtension("$($theme.image)").ToLowerInvariant()
  if ($extension -notin @('.png', '.jpg', '.jpeg', '.webp')) {
    throw "Unsupported theme image type: $extension"
  }
  $imagePath = Join-Path $directory "$($theme.image)"
  if (-not (Test-DreamSkinPathWithinRoot -Path $imagePath -Root $directory) -or
    -not (Test-Path -LiteralPath $imagePath -PathType Leaf)) {
    throw 'Theme image is missing or outside the theme directory.'
  }
  $imageSize = (Get-Item -LiteralPath $imagePath).Length
  if ($imageSize -le 0 -or $imageSize -gt 50MB) {
    throw 'Theme image must be between 1 byte and 50 MB.'
  }
  foreach ($key in @('ink', 'purple', 'violet', 'pink', 'blush')) {
    if ($null -ne $theme.colors -and -not (Test-DreamSkinThemeColor -Value "$($theme.colors.$key)")) {
      throw "Theme color $key must use #RRGGBB."
    }
  }
  if ($null -ne $theme.design) {
    if ("$($theme.design.mode)" -notin @('auto', 'default', 'manual')) { throw 'Theme design mode is invalid.' }
    if ("$($theme.design.textSide)" -notin @('left', 'right')) { throw 'Theme design textSide is invalid.' }
    if ("$($theme.design.decoration)" -notin @('soft', 'minimal', 'geometric', 'neon')) {
      throw 'Theme design decoration is invalid.'
    }
    foreach ($range in @(
      @('focalX', 0.0, 1.0), @('focalY', 0.0, 1.0), @('heroHeight', 210.0, 520.0),
      @('cornerRadius', 8.0, 36.0), @('cardRadius', 8.0, 32.0),
      @('decorationDensity', 0.0, 1.0), @('overlayStrength', 0.35, 0.95)
    )) {
      $value = $theme.design.($range[0])
      if ($null -eq $value -or [double]$value -lt [double]$range[1] -or [double]$value -gt [double]$range[2]) {
        throw "Theme design $($range[0]) is outside its supported range."
      }
    }
    if ($theme.design.showPolaroid -isnot [bool]) { throw 'Theme design showPolaroid must be boolean.' }
  }
  if ($null -ne $theme.motifs) {
    if ("$($theme.motifs.pattern)" -notin @('none', 'equalizer', 'circuit', 'wave', 'stars', 'floral', 'rainbow')) {
      throw 'Theme motif pattern is invalid.'
    }
    if ("$($theme.motifs.emblem)" -notin @('none', 'twin-tail', 'wing')) {
      throw 'Theme motif emblem is invalid.'
    }
    foreach ($field in @(
      @('cornerMark', 16), @('badge', 40), @('code', 48),
      @('brandGlyph', 4), @('accentGlyph', 4)
    )) {
      $value = "$($theme.motifs.($field[0]))"
      if ($value.Length -gt [int]$field[1] -or $value -match '[\x00-\x1F\x7F]') {
        throw "Theme motif $($field[0]) is invalid."
      }
    }
    if ($null -ne $theme.motifs.glyphs) {
      if ($theme.motifs.glyphs -isnot [System.Array] -or $theme.motifs.glyphs.Count -gt 6) {
        throw 'Theme motif glyphs must be an array with at most 6 entries.'
      }
      foreach ($glyph in $theme.motifs.glyphs) {
        if ("$glyph".Length -gt 12 -or "$glyph" -match '[\x00-\x1F\x7F]') {
          throw 'Theme motif glyph is invalid.'
        }
      }
    }
  }
  return [pscustomobject]@{
    Id = "$($theme.id)"
    Name = "$($theme.name)"
    Directory = $directory
    ManifestPath = $manifestPath
    ImagePath = $imagePath
    Theme = $theme
  }
}

function Get-DreamSkinBundledTheme {
  param([Parameter(Mandatory = $true)][string]$WindowsRoot)
  return Read-DreamSkinThemeManifest -ThemeDirectory (Join-Path $WindowsRoot 'assets')
}

function Get-DreamSkinInstalledThemes {
  $themesRoot = Get-DreamSkinThemesRoot
  if (-not (Test-Path -LiteralPath $themesRoot -PathType Container)) { return @() }
  $themes = @()
  foreach ($directory in @(Get-ChildItem -LiteralPath $themesRoot -Directory -ErrorAction Stop)) {
    try { $themes += Read-DreamSkinThemeManifest -ThemeDirectory $directory.FullName } catch {
      Write-Warning "Skipped invalid theme $($directory.Name): $($_.Exception.Message)"
    }
  }
  return @($themes | Sort-Object Name, Id)
}

function Set-DreamSkinActiveTheme {
  param([Parameter(Mandatory = $true)][string]$Id)
  Assert-DreamSkinThemeId -Id $Id
  $stateRoot = Get-DreamSkinThemeStateRoot
  New-Item -ItemType Directory -Force -Path $stateRoot | Out-Null
  $selection = [ordered]@{
    schemaVersion = 1
    id = $Id
    selectedAt = (Get-Date).ToUniversalTime().ToString('o')
  }
  Write-DreamSkinUtf8FileAtomically -Path (Get-DreamSkinActiveThemePath) `
    -Content (($selection | ConvertTo-Json -Depth 3) + "`r`n")
}

function Resolve-DreamSkinActiveTheme {
  param([Parameter(Mandatory = $true)][string]$WindowsRoot)
  $selectionPath = Get-DreamSkinActiveThemePath
  if (-not (Test-Path -LiteralPath $selectionPath -PathType Leaf)) {
    return Get-DreamSkinBundledTheme -WindowsRoot $WindowsRoot
  }
  $selection = Read-DreamSkinThemeJson -Path $selectionPath
  if ([int]$selection.schemaVersion -ne 1) { throw 'Unsupported active theme selection schema.' }
  $id = "$($selection.id)"
  Assert-DreamSkinThemeId -Id $id
  if ($id -ceq 'bundled-dream') { return Get-DreamSkinBundledTheme -WindowsRoot $WindowsRoot }
  $themesRoot = Get-DreamSkinThemesRoot
  $directory = Join-Path $themesRoot $id
  if (-not (Test-DreamSkinPathWithinRoot -Path $directory -Root $themesRoot)) {
    throw 'Active theme path escaped the theme library.'
  }
  $theme = Read-DreamSkinThemeManifest -ThemeDirectory $directory
  if ($theme.Id -cne $id) { throw 'Active theme ID does not match its directory.' }
  return $theme
}
