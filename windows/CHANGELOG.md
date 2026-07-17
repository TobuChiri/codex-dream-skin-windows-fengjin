# Windows Changelog

## Unreleased

### 1.8.3 · 任务背景与首页细节优化

- 功能卡点击后改用独立任务背景层：清理旧首页卡片的同时继续显示主题图片。
- 横幅整体上移，项目选择区与输入框同步收窄，为右下角拍立得留出独立空间。
- 项目选择栏增加花朵、星光与爱心点缀，并统一其字体、描边和圆角细节。
- 重绘左上角风堇标识的花形图标，统一侧栏图标对齐与中英文标题字体。

### 1.8.2 · 横幅与框架修复

- 横幅改为自动水平居中，并微调预览图裁切位置，使图内边框与真实横幅边框的四周留白更均衡。
- 从同一主题图中增加柔边角色浮层，让角色头部、向日葵和翅膀可以越过横幅上边框，同时保持功能卡可点击。
- 右下角拍立得改为裁切横幅中的角色区域，不再裁到预览图自带的拍立得并叠加第二份文案。
- 侧栏与主内容区的内部接缝统一为直角；窗口最外层仍由主题边框保留统一圆角。

### 1.8.1 · 首页状态与输入框修复

- 修复空输入框同时绘制 Codex 原始占位文本与主题伪元素文本造成的重影；仅在空编辑器状态隐藏原始辅助文本，输入内容不会受影响。
- 首页建议卡被点击时立即退出首页布局。Codex 在原地启动任务、但短暂保留首页 DOM 时，不再让横幅、卡片或主视觉覆盖任务视图并露出背景裁切。

### 1.8.0 · 预览图高还原

- 新增独立的 `hyacine-fengjin-magic-garden-v2` 设计入口；旧风堇主题 ID 和安装包保持不变。
- 桌面横幅允许使用最高 520 px 的受校验高度，使原生建议卡可以像参考图一样嵌入横幅下缘。
- 主题清单新增可选首页标题，渲染层新增侧栏导航分类与四枚主题专用 SVG 图标。
- 参考图视觉只用于横幅与拍立得裁切；侧栏、建议卡、项目选择、输入框及顶部按钮仍为真实 Codex 控件。

### Features

- Added a Windows user-theme library under `%LOCALAPPDATA%\CodexDreamSkin\themes`, with image-picker customization, theme listing, active selection, and live switching back to the bundled theme.
- Theme manifests can customize the hero image, brand text, tagline, project labels, and five primary theme colors. PNG, JPEG, and WebP images up to 50 MB are supported.
- New themes automatically extract a palette from PNG/JPEG images and apply it across the sidebar, shell background, header, cards, composer, controls, task messages, decorations, borders, shadows, and scrollbars. Explicit color arguments remain available for manual art direction.
- Image analysis now generates a deterministic `design` block for the whole composition: focal-point crop, left/right text placement, responsive hero height, corner/card geometry, overlay strength, decoration density, polaroid visibility, and one of four decoration systems (`soft`, `minimal`, `geometric`, or `neon`).
- Theme manifests can now add a semantic `motifs` layer with equalizer, circuit, or waveform patterns; a twin-tail emblem; a corner mark; compact HUD labels; and up to six decorative glyphs. Motifs are CSS geometry and remain non-interactive.
- Added floral and rainbow motif patterns plus a wing emblem for character themes built around flowers, sky, healing, or fantasy imagery.
- Motif manifests can now set independent `brandGlyph` and `accentGlyph` values, so character themes no longer inherit the bundled music note and heart treatment.
- Renderer roots now expose the active theme ID through `data-dream-theme`, allowing reference-led theme variants to remain fully isolated from their original skin.
- Added the independent `hyacine-fengjin-magic-garden` design system: cream-and-coral shell, gold floral framing, overlapping suggestion cards, per-card subtitles, exclusive badge, rainbow/wing ornamentation, and character polaroid.
- The installer now creates a **Codex Dream Skin - Customize** shortcut.

### Compatibility

- Fixed atomic UTF-8 replacement on Windows PowerShell 5.1 by using a same-directory temporary backup path.
- Fixed CRLF multiline-array detection so ambiguous TOML remains unchanged.

### 修复

- 首页建议卡除了固定图标行和徽章尺寸，还会测量每个 SVG 内实际绘制路径的屏幕包围盒，并自动补偿水平与垂直偏移；不再把偏心的 `viewBox` 误当作视觉中心。
- 侧栏与主内容区的内部拼接边统一为直角；横幅、建议卡、项目栏和输入框继续使用同一主题半径变量，消除相邻框架一边圆、一边直的断裂感。
- 渲染层现在只在检测到完整 Codex 主界面壳层时启用皮肤；宠物等透明辅助窗口会主动清理主题背景与装饰节点，避免出现遮挡宠物的矩形背景框。
- 安装与 `-RestoreBaseTheme` 现在严格按 UTF-8 读取，保留原换行风格，并以无 BOM、同目录原子替换方式写回 `config.toml`，避免中文项目名称乱码或导致 Codex 无法启动。
- 遇到带 BOM/无 BOM 的 UTF-16、NUL 字符、无效 UTF-8 或写入期间被其他程序改动的配置时停止修改，不再静默转码或覆盖较新的内容。
- 安装会在当前注册包或 state 记录的旧 Codex 仍运行时明确提示先关闭；配置临时文件写完后会在原子替换前再次核对原始字节，进一步缩小并发覆盖窗口。
- 配置恢复只修改 `[desktop]` 内的外观键，不再误碰其他 section 的同名配置；新增 `-RecoverConfigBackup` 用于显式恢复安装前原始文件，并先保存当前文件。
- 完成配置恢复后会归档本轮安装前备份，使下一次安装重新保存当时的配置，避免重复安装使用过期主题值。
- schema 3 记录的旧 injector PID 只有在 Node 精确路径、脚本命令行、端口、Browser ID 和进程启动时间匹配时才会停止；兼容旧 state 时仍要求原 state 含脚本路径和端口，且 PID 仍匹配 `node.exe`、脚本与 watch 参数，无法确认便归档而不结束进程。
- 启动验证失败会停止 injector、清理状态，并把本次新开的 Codex 恢复为无调试口的普通启动。
- Restore 使用状态中记录的端口，先关闭运行态再写配置；失败时保留 state 并尽量正常重开 Codex，不再留下半完成状态或静默报告假成功。
- Store 更新后若旧版本仍持有已保存的 CDP，会按 state 中的精确路径关闭；检测到新旧版本同时运行时安全停止并提示人工处理。
- 支持带注释或引号的 `[desktop]` 表头与目标键；遇到转义同义键、多行字符串/数组、dotted key 或重复目标键时会在写入前明确停止，避免把合法但无法安全行编辑的 TOML 改坏。
- Store 更新后的旧路径只有在 Appx full name、family name、安装目录和可执行文件仍能与系统注册包匹配时才允许自动关闭；无法证明归属时保留状态并要求手动关闭。
- Store 更新时，仍在运行且身份有效的旧版本 CDP 会直接热重应用；旧版本若未开启 CDP，则在获得现有重启授权后关闭并启动当前注册版本，避免并行打开两个 Codex。
- 遇到 `[desktop.*]` 子表时会在写配置前停止，避免外观标量键与 TOML 子表冲突；热重应用验证失败时会尽力移除本次残余样式。
- Restore 不再要求当前环境仍能找到 Node；schema 3 清理会严格匹配安装时记录的 Node 路径，Node 已升级或卸载也不影响安全恢复。

### 安全

- Codex 以 `--remote-debugging-address=127.0.0.1` 启动；同时校验监听 PID 对应精确的官方 Store 可执行文件。
- 说明：loopback 可阻止局域网访问，但 CDP 不验证同一 Windows 用户下的其他本地进程；不用皮肤时建议执行 Restore 关闭调试会话。
- Appx 发现要求 `SignatureKind=Store` 且不是 development mode，同名开发包或侧载包不会被当作官方 Codex 启动或关闭。
- injector 只连接相同端口、page ID 与路径一致的 loopback WebSocket，并在注入前确认真实 Codex shell DOM 标记。
- watcher 绑定启动时的 CDP Browser ID，并持续持有 Browser WebSocket 作为身份锚；原浏览器关闭或端口被复用时直接退出，不会连接到新端点。
- CDP HTTP、WebSocket 建连与命令均加入超时，HTTP 探测拒绝重定向，异常目标不会无限挂起或把探测带离 loopback。
- injector 日志与验证文件不再记录窗口标题、页面路由、页面文本或被拒绝 URL 的内容，只保留临时 target ID、结构标记和布局结果。
- 快捷方式不再静默携带 `-RestartExisting`；需要重启时先向用户确认。
- install、start、restore 和 verify 使用当前用户互斥锁，避免双击或并发命令竞争端口、配置和 state。

### 改进

- 默认端口被占用时自动在后续 100 个端口内选择空闲端口；显式指定的冲突端口仍安全失败。
- injector 会等待首轮注入完成再判定启动成功；目标异常时使用有上限的指数退避和限频日志，减少后台唤醒和日志膨胀。
- 明确要求 Node.js 22 或更新版本，并记录 `process.execPath`，兼容 PATH 中的启动转发程序。
- 带空格或结尾反斜杠的测试 profile 路径现在按 Windows 命令行规则引用。

### 测试

- 增加渲染层辅助窗口回归测试，覆盖主窗口正常注入、透明辅助窗口清理残余样式，以及辅助目标随后成为完整主界面时可重新启用皮肤。
- 增加中文项目路径、CRLF/LF、UTF-16 与歧义 TOML 拒绝、并发写检测、section 隔离、精确恢复、Appx/state 身份、状态归档、payload 构造、Browser ID 和不安全 CDP URL 的回归检查。
