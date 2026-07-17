# Codex Dream Skin for Windows

The Windows build applies a reversible skin to the official Microsoft Store Codex app through loopback CDP. It does not modify `WindowsApps`, `app.asar`, or the package signature.

## Requirements

- Windows 10 or 11
- Official Microsoft Store package `OpenAI.Codex`
- Node.js 22 or newer
- PowerShell 5.1 or newer

## Install

Close Codex, then run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\install-dream-skin.ps1
```

The installer creates launch, customize, and restore shortcuts. Use **Codex Dream Skin - Customize** to pick a PNG, JPEG, or WebP image and create a theme. PNG and JPEG themes automatically derive a matching palette for the entire Codex shell.

## Included theme: Fengjin Magic Garden V2

The repository includes `theme-packs\hyacine-fengjin-magic-garden-v2`. After installing the engine, run from `windows`:

```powershell
$theme = ".\theme-packs\hyacine-fengjin-magic-garden-v2"
$target = Join-Path $env:LOCALAPPDATA "CodexDreamSkin\themes\hyacine-fengjin-magic-garden-v2"
New-Item -ItemType Directory -Force -Path (Split-Path $target) | Out-Null
Copy-Item -LiteralPath $theme -Destination $target -Recurse -Force
.\scripts\switch-theme-windows.ps1 -Id hyacine-fengjin-magic-garden-v2 -PromptRestart
```

The character preview asset is supplied only as an example. Clear image rights before public redistribution or commercial use; see [`../NOTICE.md`](../NOTICE.md).

## Create a theme

Open the image picker:

```powershell
.\scripts\customize-theme-windows.ps1
```

Or create one non-interactively:

```powershell
.\scripts\customize-theme-windows.ps1 `
  -ImagePath "C:\Pictures\background.png" `
  -Id "blue-night" `
  -Name "Blue Night" `
  -Ink "#DCE8FF" `
  -Purple "#4667C8" `
  -Violet "#7657D6" `
  -Pink "#E56AA6" `
  -Blush "#EEF3FF"
```

Images are copied into `%LOCALAPPDATA%\CodexDreamSkin\themes\<id>`. Source images must be PNG, JPEG, or WebP and no larger than 50 MB.

The generated palette controls the sidebar, window background, header, home cards, composer, project selector, buttons, task messages, borders, shadows, decorations, and scrollbars. Pass any of `-Ink`, `-Purple`, `-Violet`, `-Pink`, or `-Blush` to use manual colors, or add `-NoAutoPalette` to keep the original default palette.

Image analysis also writes a `design` block into `theme.json`. It chooses the focal crop, puts text opposite the visual subject, adjusts hero/card geometry, controls overlay strength and decoration density, and selects a `soft`, `minimal`, `geometric`, or `neon` decoration system. Use `-NoAutoDesign` to keep the default layout. The generated block remains editable for manual tuning.

Character-directed themes can add a `motifs` block. Patterns include `equalizer`, `circuit`, `wave`, `floral`, and `rainbow`; `twin-tail` and `wing` are available as emblems; and the manifest may provide a corner mark, HUD badge, code label, independent brand/accent glyphs, and up to six decorative glyphs. These are non-interactive CSS geometry layers.

## List and switch themes

```powershell
.\scripts\switch-theme-windows.ps1 -List
.\scripts\switch-theme-windows.ps1 -Id "blue-night" -PromptRestart
.\scripts\switch-theme-windows.ps1 -Id "bundled-dream" -PromptRestart
```

When Codex is already running with the verified Dream Skin CDP session, switching is applied without restarting the app. A normally launched Codex window still requires restart consent.

## Verify and restore

```powershell
.\scripts\verify-dream-skin.ps1 -ScreenshotPath "$env:TEMP\dream-skin.png"
.\scripts\restore-dream-skin.ps1 -RestoreBaseTheme -PromptRestart
```

The active selection is stored at `%LOCALAPPDATA%\CodexDreamSkin\active-theme.json`. Restore removes the live skin but keeps user-created themes so they can be used again later.
