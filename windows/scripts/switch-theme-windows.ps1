[CmdletBinding()]
param(
  [string]$Id,
  [switch]$List,
  [int]$Port = 9335,
  [switch]$NoApply,
  [switch]$RestartExisting,
  [switch]$PromptRestart
)

$ErrorActionPreference = 'Stop'
$PortExplicit = $PSBoundParameters.ContainsKey('Port')
$WindowsRoot = Split-Path -Parent $PSScriptRoot
. (Join-Path $PSScriptRoot 'theme-windows.ps1')

if ($List) {
  $active = Resolve-DreamSkinActiveTheme -WindowsRoot $WindowsRoot
  $catalog = @((Get-DreamSkinBundledTheme -WindowsRoot $WindowsRoot)) + @(Get-DreamSkinInstalledThemes)
  $catalog | ForEach-Object {
    [pscustomobject]@{
      Active = if ($_.Id -ceq $active.Id) { '*' } else { '' }
      Id = $_.Id
      Name = $_.Name
      Image = $_.ImagePath
    }
  } | Format-Table -AutoSize
  return
}

if (-not $Id) { throw 'Specify -Id <theme-id>, or use -List.' }
Assert-DreamSkinThemeId -Id $Id
if ($Id -ceq 'bundled-dream') {
  $selected = Get-DreamSkinBundledTheme -WindowsRoot $WindowsRoot
} else {
  $themesRoot = Get-DreamSkinThemesRoot
  $themeDirectory = Join-Path $themesRoot $Id
  if (-not (Test-DreamSkinPathWithinRoot -Path $themeDirectory -Root $themesRoot)) {
    throw 'Theme path escaped the theme library.'
  }
  $selected = Read-DreamSkinThemeManifest -ThemeDirectory $themeDirectory
  if ($selected.Id -cne $Id) { throw 'Theme ID does not match its directory.' }
}

Set-DreamSkinActiveTheme -Id $selected.Id
Write-Host "Selected theme: $($selected.Name) ($($selected.Id))"
if (-not $NoApply) {
  $startArguments = @()
  if ($PortExplicit) { $startArguments += @('-Port', $Port) }
  if ($RestartExisting) { $startArguments += '-RestartExisting' }
  if ($PromptRestart) { $startArguments += '-PromptRestart' }
  & (Join-Path $PSScriptRoot 'start-dream-skin.ps1') @startArguments
  exit $LASTEXITCODE
}
