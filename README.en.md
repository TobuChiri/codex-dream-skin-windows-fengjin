# Codex Dream Skin · Fengjin Windows Edition

> A reversible external theme layer for the official Microsoft Store OpenAI Codex desktop app on Windows. It injects CSS through loopback CDP and never modifies WindowsApps, `app.asar`, binaries, or signatures.

[中文](./README.md) · [Windows guide](./windows/README.md) · [Upstream attribution](./UPSTREAM.md) · [MIT License](./LICENSE)

## Fengjin · Magic Garden V2

<p align="center">
  <img src="./windows/theme-packs/hyacine-fengjin-magic-garden-v2/fengjin-preview-source.png" alt="Fengjin Magic Garden V2 preview" width="900">
</p>

V2 rebuilds the supplied layout with a character-led hero, garden badge, four overlapping action cards, coloured SVG icons, branded sidebar, petal trail, project bar, composer, and polaroid. The sidebar, cards, project picker, and composer remain real Codex controls rather than a whole-window image overlay.

## Quick start

### Requirements

- Windows 10 or 11
- Official Microsoft Store `OpenAI.Codex`
- Node.js 22 or newer
- PowerShell 5.1 or newer

### Install the engine

Close Codex, open PowerShell, and run from this checkout:

```powershell
cd .\windows
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\install-dream-skin.ps1
```

The installer adds launch, customize, and restore shortcuts.

### Install and enable Fengjin V2

```powershell
$theme = ".\theme-packs\hyacine-fengjin-magic-garden-v2"
$target = Join-Path $env:LOCALAPPDATA "CodexDreamSkin\themes\hyacine-fengjin-magic-garden-v2"
New-Item -ItemType Directory -Force -Path (Split-Path $target) | Out-Null
Copy-Item -LiteralPath $theme -Destination $target -Recurse -Force
.\scripts\switch-theme-windows.ps1 -Id hyacine-fengjin-magic-garden-v2 -PromptRestart
```

Launch Codex through the **Codex Dream Skin** desktop shortcut afterwards.

## Use and customization

List local themes:

```powershell
.\windows\scripts\switch-theme-windows.ps1 -List
```

Enable Fengjin V2:

```powershell
.\windows\scripts\switch-theme-windows.ps1 -Id hyacine-fengjin-magic-garden-v2 -PromptRestart
```

Create a theme from your own image:

```powershell
.\windows\scripts\customize-theme-windows.ps1 `
  -ImagePath "C:\Pictures\background.png" `
  -Id "my-theme" `
  -Name "My Theme"
```

Images are copied to `%LOCALAPPDATA%\CodexDreamSkin\themes`. PNG/JPEG images receive an automatic palette and baseline layout; the generated `theme.json` remains editable for focal point, hero height, radii, decorations, and copy.

Restore the stock appearance:

```powershell
.\windows\scripts\restore-dream-skin.ps1 -RestoreBaseTheme -PromptRestart
```

Restore removes the live injection and debugging session but keeps personal themes.

## Safety

- CDP binds to `127.0.0.1` only. Do not run untrusted local processes while it is active.
- No official install files, signatures, `app.asar`, API keys, or provider endpoints are modified.
- Theme images and character artwork remain subject to their respective rights holders. Clear rights before redistribution or commercial use.
- This is not an OpenAI product and is not endorsed by OpenAI.

## Upstream attribution

This public derivative is based on [Fei-Away/Codex-Dream-Skin](https://github.com/Fei-Away/Codex-Dream-Skin). Its MIT license and notices are preserved. See [UPSTREAM.md](./UPSTREAM.md) for scope and credit.

## Verification

```powershell
cd .\windows
powershell -NoProfile -ExecutionPolicy Bypass -File .\tests\run-tests.ps1
.\scripts\verify-dream-skin.ps1 -ScreenshotPath "$env:TEMP\dream-skin.png"
```

## License

Software source is [MIT licensed](./LICENSE). The theme preview artwork is not licensed under MIT; see [NOTICE.md](./NOTICE.md).
