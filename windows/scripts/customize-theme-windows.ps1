[CmdletBinding()]
param(
  [string]$ImagePath,
  [string]$Id,
  [string]$Name = 'My Dream Skin',
  [string]$BrandTitle = 'My Codex Theme',
  [string]$BrandSubtitle = 'CODEX DREAM SKIN',
  [string]$Tagline = 'Turn a favorite image into an interactive Codex workspace.',
  [string]$Signature = 'Dream Skin',
  [string]$ProjectPrefix = 'Project - ',
  [string]$ProjectLabel = 'Choose project',
  [string]$Ink = '#4c2364',
  [string]$Purple = '#8b3dce',
  [string]$Violet = '#b45cff',
  [string]$Pink = '#ff73bd',
  [string]$Blush = '#fff3f9',
  [switch]$NoAutoPalette,
  [switch]$NoAutoDesign,
  [switch]$Force,
  [switch]$NoApply,
  [switch]$RestartExisting
)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'theme-windows.ps1')

if (-not $ImagePath) {
  Add-Type -AssemblyName System.Windows.Forms
  $picker = New-Object System.Windows.Forms.OpenFileDialog
  $picker.Title = 'Choose a Codex Dream Skin image'
  $picker.Filter = 'Theme images (*.png;*.jpg;*.jpeg;*.webp)|*.png;*.jpg;*.jpeg;*.webp'
  $picker.Multiselect = $false
  if ($picker.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) {
    Write-Host 'Theme creation was cancelled.'
    return
  }
  $ImagePath = $picker.FileName
}

$ImagePath = [System.IO.Path]::GetFullPath($ImagePath)
if (-not (Test-Path -LiteralPath $ImagePath -PathType Leaf)) { throw "Image does not exist: $ImagePath" }
$image = Get-Item -LiteralPath $ImagePath
if ($image.Length -le 0 -or $image.Length -gt 50MB) { throw 'Theme image must be between 1 byte and 50 MB.' }
$extension = $image.Extension.ToLowerInvariant()
if ($extension -notin @('.png', '.jpg', '.jpeg', '.webp')) {
  throw 'Use a PNG, JPEG, or WebP image.'
}

$paletteMode = 'manual'
$analysis = $null
$design = [ordered]@{
  mode = 'default'
  textSide = 'left'
  decoration = 'soft'
  focalX = 0.72
  focalY = 0.5
  heroHeight = 252
  cornerRadius = 26
  cardRadius = 23
  decorationDensity = 0.62
  overlayStrength = 0.76
  showPolaroid = $true
}
try {
  $analysis = Get-DreamSkinImagePalette -ImagePath $ImagePath
  if (-not $NoAutoDesign) {
    $design = [ordered]@{
      mode = 'auto'
      textSide = $analysis.Design.TextSide
      decoration = $analysis.Design.Decoration
      focalX = $analysis.Design.FocalX
      focalY = $analysis.Design.FocalY
      heroHeight = $analysis.Design.HeroHeight
      cornerRadius = $analysis.Design.CornerRadius
      cardRadius = $analysis.Design.CardRadius
      decorationDensity = $analysis.Design.DecorationDensity
      overlayStrength = $analysis.Design.OverlayStrength
      showPolaroid = $analysis.Design.ShowPolaroid
      imageAspectRatio = $analysis.Design.ImageAspectRatio
      imageLuminance = $analysis.Design.ImageLuminance
      imageSaturation = $analysis.Design.ImageSaturation
      imageEdgeDensity = $analysis.Design.ImageEdgeDensity
    }
  }
} catch {
  Write-Warning "Image design analysis was unavailable; using the default layout. $($_.Exception.Message)"
}
$explicitPalette = @('Ink', 'Purple', 'Violet', 'Pink', 'Blush') | Where-Object {
  $PSBoundParameters.ContainsKey($_)
}
if (-not $NoAutoPalette -and $explicitPalette.Count -eq 0) {
  if ($null -ne $analysis) {
    $Ink = $analysis.Ink
    $Purple = $analysis.Purple
    $Violet = $analysis.Violet
    $Pink = $analysis.Pink
    $Blush = $analysis.Blush
    $paletteMode = 'auto'
    Write-Host "Palette extracted: $Ink $Purple $Violet $Pink $Blush"
  } else {
    $paletteMode = 'default'
  }
}

if (-not $Id) { $Id = "custom-$([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())" }
$Id = $Id.ToLowerInvariant()
Assert-DreamSkinThemeId -Id $Id
if ($Id -ceq 'bundled-dream') { throw 'The bundled-dream ID is reserved.' }
if ([string]::IsNullOrWhiteSpace($Name)) { throw 'Theme name cannot be empty.' }
foreach ($entry in @{
  ink = $Ink; purple = $Purple; violet = $Violet; pink = $Pink; blush = $Blush
}.GetEnumerator()) {
  if (-not (Test-DreamSkinThemeColor -Value $entry.Value)) {
    throw "Theme color $($entry.Key) must use #RRGGBB."
  }
}

$themesRoot = Get-DreamSkinThemesRoot
$themeDirectory = Join-Path $themesRoot $Id
if (-not (Test-DreamSkinPathWithinRoot -Path $themeDirectory -Root $themesRoot)) {
  throw 'Theme path escaped the theme library.'
}
if ((Test-Path -LiteralPath $themeDirectory) -and -not $Force) {
  throw "Theme already exists: $Id. Use -Force to replace it."
}

New-Item -ItemType Directory -Force -Path $themesRoot | Out-Null
$staging = Join-Path $themesRoot ".$Id-$PID-$([guid]::NewGuid().ToString('N'))"
New-Item -ItemType Directory -Path $staging -Force | Out-Null
try {
  $imageName = "background$extension"
  Copy-Item -LiteralPath $ImagePath -Destination (Join-Path $staging $imageName) -Force
  $theme = [ordered]@{
    schemaVersion = 1
    id = $Id
    name = $Name
    brandTitle = $BrandTitle
    brandSubtitle = $BrandSubtitle
    tagline = $Tagline
    signature = $Signature
    projectPrefix = $ProjectPrefix
    projectLabel = $ProjectLabel
    image = $imageName
    paletteMode = $paletteMode
    design = $design
    colors = [ordered]@{
      ink = $Ink
      purple = $Purple
      violet = $Violet
      pink = $Pink
      blush = $Blush
    }
  }
  Write-DreamSkinUtf8FileAtomically -Path (Join-Path $staging 'theme.json') `
    -Content (($theme | ConvertTo-Json -Depth 5) + "`r`n")
  $null = Read-DreamSkinThemeManifest -ThemeDirectory $staging
  if (Test-Path -LiteralPath $themeDirectory) { Remove-Item -LiteralPath $themeDirectory -Recurse -Force }
  Move-Item -LiteralPath $staging -Destination $themeDirectory
} finally {
  Remove-Item -LiteralPath $staging -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host "Theme saved: $Name ($Id)"
if (-not $NoApply) {
  $switchArguments = @('-Id', $Id, '-PromptRestart')
  if ($RestartExisting) { $switchArguments += '-RestartExisting' }
  & (Join-Path $PSScriptRoot 'switch-theme-windows.ps1') @switchArguments
  exit $LASTEXITCODE
}
