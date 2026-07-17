# Codex Dream Skin Windows 自定义主题版

## 环境要求

- Windows 10/11
- Microsoft Store 安装的官方 `OpenAI.Codex`
- Node.js 22 或更高版本
- PowerShell 5.1 或更高版本

## 安装

先完全关闭 Codex，在 `windows` 目录执行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\install-dream-skin.ps1
```

安装后桌面会出现启动、定制和恢复快捷方式。

## 内置主题：风堇 · 魔法花园 V2

本仓库附带高还原主题包 `theme-packs\hyacine-fengjin-magic-garden-v2`。安装引擎后，在 `windows` 目录执行：

```powershell
$theme = ".\theme-packs\hyacine-fengjin-magic-garden-v2"
$target = Join-Path $env:LOCALAPPDATA "CodexDreamSkin\themes\hyacine-fengjin-magic-garden-v2"
New-Item -ItemType Directory -Force -Path (Split-Path $target) | Out-Null
Copy-Item -LiteralPath $theme -Destination $target -Recurse -Force
.\scripts\switch-theme-windows.ps1 -Id hyacine-fengjin-magic-garden-v2 -PromptRestart
```

该主题使用角色示例素材；请在公开再分发或商用前确认图片权利，详情见仓库根目录 [`NOTICE.md`](../NOTICE.md)。

## 用自己的图片创建主题

双击桌面的 **Codex Dream Skin - Customize**，在图片选择器中选择 PNG、JPEG 或 WebP。图片不能超过 50 MB，横向、宽度 2000 像素以上的图片效果较好。PNG 和 JPEG 默认会自动提取配色，并应用到侧栏、主背景、标题栏、卡片、输入框、按钮、任务消息、边框、阴影、装饰和滚动条。

也可以使用命令：

```powershell
.\scripts\customize-theme-windows.ps1 `
  -ImagePath "C:\Pictures\background.png" `
  -Id "my-theme" `
  -Name "我的主题"
```

如需手动控制颜色，可以传入 `-Ink`、`-Purple`、`-Violet`、`-Pink`、`-Blush`；使用 `-NoAutoPalette` 可关闭自动取色。

选图时还会自动生成 `theme.json` 中的 `design` 配置：分析视觉主体位置、宽高比、亮度、饱和度和画面复杂度，自动决定文字左右、图片焦点、横幅高度、圆角、遮罩强度、装饰密度、拍立得是否显示，并在柔和、极简、几何、霓虹四种装饰系统中选择。使用 `-NoAutoDesign` 可保留默认布局；生成后的配置也可以手动修改。

需要角色差异化设计时，还可以在 `theme.json` 中加入 `motifs`：`pattern` 支持 `equalizer`、`circuit`、`wave`、`floral`、`rainbow` 等图案，`emblem` 支持 `twin-tail` 与 `wing`，并可设置 `cornerMark`、`badge`、`code`、`brandGlyph`、`accentGlyph` 与最多六个 `glyphs`。这些装饰由 CSS 几何图形生成，不会遮挡或接管 Codex 原生按钮。

主题保存在：

```text
%LOCALAPPDATA%\CodexDreamSkin\themes\<主题 ID>
```

## 查看和切换主题

```powershell
.\scripts\switch-theme-windows.ps1 -List
.\scripts\switch-theme-windows.ps1 -Id "my-theme" -PromptRestart
```

切回项目原始粉紫主题：

```powershell
.\scripts\switch-theme-windows.ps1 -Id "bundled-dream" -PromptRestart
```

如果 Codex 已经通过 Dream Skin 启动，切换主题通常不需要重启；如果当前是普通启动，则会先询问是否重启。

## 恢复官方界面

```powershell
.\scripts\restore-dream-skin.ps1 -RestoreBaseTheme -PromptRestart
```

恢复操作会清除正在运行的注入和调试会话，但不会删除已经创建的个人主题。
