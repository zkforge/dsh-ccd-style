# DSH CCD Style 实施计划

更新日期：2026-10-01。当前阶段：四个核心界面模块（shell、sidebar、new-session、conversation）已实现并在真实 Desktop 中验证；tool-calls 与 statistics 按范围保持关闭。代码地图见 [ARCHITECTURE.md](ARCHITECTURE.md)，当前状态见 [验证记录](docs/VERIFICATION.md)。

## 目标与首版边界

做一个可供其他用户安装的 DSH 插件，将 DeepSeek Harness 桌面版的新建会话页、聊天页和左侧栏改成极度接近用户提供的 Claude Code Desktop（CCD）截图的样式。首版支持 macOS、浅色模式，明确兼容本机 DSH `0.2.0-rc.2`。

使用 DSH 名称和标志。项目、会话、消息及工作目录继续使用 DSH 的真实数据。DSH 特有能力保留可用入口，其他功能集中到“更多”和设置中。安装后由用户手动启用，支持切回原界面。

根据最后一次范围调整，先完成视觉和布局，保留 DSH 现有交互。CCD 专有交互、搜索操作细节、工具概要重构、快捷键复刻等放到后续阶段，无需先提供录屏。全局统计卡片和热力图只有真实数据来源可用时才纳入，不能用展示用数字代替。

## 参考与视觉差异

- [CCD 新建会话页](docs/reference/ccd-new-session.png)
- [DSH 新建会话页改造前](docs/reference/dsh-new-session-before.png)
- [CCD 聊天页](docs/reference/ccd-conversation.png)

以上三张参考截图仅本地保留：其中两张是第三方产品界面，另一张含已登录账号，因此 `docs/reference/` 与 `docs/verification/local/` 都在 [.gitignore](.gitignore) 里，不随仓库发布；这些链接只在本地开发时可用。

同尺寸新会话对比图分别为 `2972 × 1966` 和 `2970 × 1964` 像素，窗口基本相同。下表为按 @2x 图片估算的逻辑尺寸，作为初始目标；实施时用真实 DOM 和窗口坐标复核。

| 部位 | CCD 参考 | DSH 改造前 | 首版实现结果 |
| --- | ---: | ---: | --- |
| 侧栏宽度 | 264 px | 280 px | DSH 自己的偏好（默认 280，clamp 264–420），插件不写轨道值，分隔线画在侧栏右边缘 |
| 输入卡片宽度 | 770 px | 737 px | 770 px |
| 输入卡片高度 | 42 px（单行） | 116 px | 42 px，输入增多时增长 |
| 输入卡片底边距窗口底边 | 35 px | 326 px | 35 px（新建页实测 794..835 与参考 795..836 对齐） |
| 侧栏背景 | 近白 #fbfbfa | 蓝灰渐变 | 平铺 #fbfbfa，无渐变 |
| 品牌与导航 | 紧凑 | 大品牌行、大按钮 | 压缩品牌区与行高，保留原生入口 |

上表为真实 Desktop 中按 1374×871 参考窗口尺寸渲染后的实测值；对照图见 `docs/verification/local/compare-new-session.png`。

新建页拆为上部内容区与底部输入区。聊天页对齐顶栏、正文宽度、消息样式和底部输入区。优先校准整体几何，再处理颜色、字体、图标、边框、圆角和阴影。

参考截图用于本地开发与验收，不随插件发布包分发。本项目的视觉验收基准是上述截图。

## 开源参考的采用方式

已定位 [Nwflower/dsh-claude-style](https://github.com/Nwflower/dsh-claude-style)。其代码采用 MIT 许可证；项目明确将 Anthropic Sans／Serif 字体排除在该授权之外。首版使用系统字体或可分发的开源字体，发布包不复制这些字体文件；字体字形差异应在验收时单独记录。

该项目的 [STYLE.md](https://github.com/Nwflower/dsh-claude-style/blob/master/docs/STYLE.md) 和 [架构说明](https://github.com/Nwflower/dsh-claude-style/blob/master/docs/architecture.md) 记录了保留官方 hero／Composer 结构、通过样式将输入区移到底部，以及通过 `conversation.input.dock` 放入统计区等方法。其主要实现为 CSS 与客户端 DOM 覆盖，也存在 DOM 标记与宿主类名片段选择器，复制前需要逐项核实对当前版本的依赖。

可借鉴插件声明、加载与释放流程，以及复用官方 Composer 的方法。颜色、字体、尺寸、导航密度和组件位置按本项目截图重新校准，不直接沿用整套样式。该项目已有自定义权限、模型、搜索和归档操作，首版不直接继承这些交互；优先使用 DSH 原生控制器。阶段 1 固定参考代码的具体提交，检查许可证归属及适配点；不以仓库最新版本号推断与本机 DSH 的兼容性。

## 已核实的技术依据

DSH 的桌面版共享 Web 客户端及其插件加载链。已从本机应用资源只读核对：相关 UI 包均为 `0.2.0-rc.2`。官方插槽支持覆盖组件，因此插件能够调整布局，能力不限于颜色主题。

- 颜色：`ctx.theme.overrideTokens()`；主题注册：`ctx.theme.register()`。字体和布局另用插件作用域内的样式。
- 组件：`ctx.slots.register()`，较低 `priority` 优先于官方默认的 `0`。通过 `ctx.slots.inject()` 等待位置声明并管理生命周期。
- 侧栏：`sidebar`、`sidebar.workspaces`、`sidebar.settings` 等位置。
- 会话：`main` 的 `conversation` 项、`conversation.header`、`conversation.session.header` 和输入区系列位置。
- 复用：官方 `conversation.content` Factory 保留会话内容与 Composer。
- 项目：DSH 原生 Workspace 可对应 CCD 项目分组，已有会话列表、折叠、新建等能力。

关键边界：覆盖父组件后，不能假定还能自由调用它独占的官方子插槽。官方编辑器包含输入法、附件、引用、命令菜单和草稿逻辑，同会话不能建立两套可编辑根。因此先验证细粒度覆盖和官方 Factory 复用，再决定是否替换整个侧栏或会话壳。

目前完成源码与文档核实，以及本地骨架构建；实际 Desktop 加载、布局效果和停用恢复仍需验证。

## 实施顺序

### 1. 审查参考项目与验证最小插件

- [x] 定位 `dsh-claude-style` 并初步核实许可证和实现方式。
- [x] 记录可复用的接入方法和造成视觉不一致的具体实现；按许可证保留必要归属。
- [x] 建立 TypeScript 客户端插件骨架、构建产物和安装包声明。
- [x] 在真实 Desktop 中验证配置传输、样式挂载与官方 Composer 复用。
- [x] 验证启用、停用、界面重新加载，以及原界面恢复。
- [ ] 固定参考项目的具体提交（未移植其代码，因此不阻塞首版；移植前必须完成）。

**结论（改变后续设计）**：逐个比对后确认，`sidebar`、`main.conversation` 等位置被官方组件独占，替换它们会让其声明的子插槽（`sidebar.workspaces`、`sidebar.settings`、`conversation.header`）一并消失。因此首版不做组件替换，只做插件作用域样式加性注册；官方 Composer 与整个会话壳保持原样，交互与数据来源不变。

完成条件：加载方式、组件复用和恢复流程真实可用，确定后续改造可使用的插槽与样式挂载点。

### 2. 校准公共样式与窗口骨架

- [x] 从参考图建立颜色、字体、字号、边距、边框、圆角、阴影的样式基准（`theme/tokens.css`）。
- [x] 以插件作用域样式为主；必须依赖宿主结构的选择器集中在 `compat/host-dom.ts`。
- [x] 调整侧栏宽度、背景、分隔线、标题栏留白及主画布。
- [x] 保留 macOS 窗口按钮、窗口拖动区域及侧栏隐藏后的操作入口（收起后左上角控件实测 x=88/124）。
- [x] 启用开关与主题、样式、注册的释放逻辑统一管理（配置变化即重挂载，停用即完全释放）。

完成条件：整体结构接近截图，停用后没有残留样式或导航覆盖。

### 3. 改造侧栏

- [x] 缩小品牌区域，压缩新建、设置及全局面板等真实功能入口的密度。
- [x] 将 Workspace 显示为紧凑项目分组，校准标题、会话行、选中态及底部账号区域。
- [x] 复用 DSH 的项目与会话导航服务、持久化状态和操作（未新增任何导航状态）。
- [x] 保持模型／插件设置、会话管理及其他 DSH 功能入口可达。
- [x] 收起态（36px 图标轨）改用宿主自己的几何：图标全部落在轨道中线上，非 macOS 保留原生交接；macOS 展开／收起的原生按钮共用红绿灯右侧窗口坐标，侧栏动画期间位置不变。

完成条件：侧栏几何和层级接近 CCD，项目／会话仍对应原有 DSH 数据。Home／Code、Routines 等仅在存在真实对应能力时呈现。

### 4. 改造新建会话页与输入区

- [x] 输入区改为底部布局；问候块按用户要求留在宿主原本的位置（居中于输入列上方、工作区行之上），不做参考图的顶部左对齐。
- [x] 复用官方 Composer，校准宽度、最小高度、边框、圆角、阴影和底部间距。
- [x] 调整工作区、模型、权限、附件等控件的位置与密度；保留发送、停止和授权操作。
- [x] 发送／停止固定在输入面板底部右侧（复用 DSH 共享库的细线箭头／小圆角方块，图片缩略图与输入框共用 10px 圆角），「+」去掉圆形底色，会话用量与上下文占用改为控制行内的图标。
- [x] 输入内容增多时允许高度增长（实测 42→66px），较窄窗口下控件不越界。
- [x] 检查统计数据接口；DSH 无跨会话全局用量接口，首版省略统计区，不使用示例数据。

完成条件：同尺寸截图中输入区位于目标底部位置，原有中文输入、草稿、附件、命令和发送流程可用。

### 5. 改造聊天页

- [x] 校准会话顶栏、正文宽度（770px）、用户消息背景和助手正文排版。
- [x] 统一工具调用、推理行等内容的颜色与间距（代码块配色细节见待办）。
- [x] 使用与新建页一致的底部 Composer 布局（共用 `theme/composer.css`）。
- [x] 保留原生工具展开、执行状态、错误和授权呈现；未改写执行逻辑。
- [x] 顶栏合成一行：视图切换器（对话／轨迹）改成参考图的分段控件，紧随会话标题之后（其后才是 Agent 预设芯片与工具图标，后续同类条目继续往后排），顶栏由 76px 收到 49px。
- [x] 检查右侧文件、终端、预览、产物与修改入口的可达性（右栏展开后三列为 280/424/576，无遮挡）。

完成条件：聊天页布局接近参考，长消息滚动与输入区互不遮挡，执行和审批状态清楚可见。

### 6. 验收与可分发打包

- [x] 在 1374×871（参考窗口尺寸）下截取新建页与聊天页，按区域对照并修正差异。
- [x] 按顺序校准：侧栏与内容区尺寸 → 输入区位置 → 排版 → 颜色及细节。
- [x] 用测试会话验证新建、切换、中文多行输入、发送、停止、工具展开、模型／权限及设置访问。
- [x] 检查较窄窗口（900×700、760×640）、侧栏隐藏、右侧面板打开、界面重载、完整应用重启和停用恢复。
- [x] 生成可本地安装的插件包（31 个文件），检查发布包内容和运行依赖。
- [x] 写明兼容版本、启用方式、恢复方式、已知差异和后续工作。
- [x] 完整应用退出／冷启动：重启后服务端启动图含 `dsh-ccd-style`，无启动崩溃日志。

完成条件：插件包可由其他用户安装，视觉对照和必要操作通过；公共包发布另作为明确的后续动作。

## 安装验证方式

桌面版需使用应用自带 CLI。安装时先完全退出 DSH，再用以下形式安装实际构建的包，随后重新打开应用：

```sh
"/Applications/DeepSeek Harness.app/Contents/Resources/runtime/cli/bin/dsh" plugin --profile desktop add <package>
```

已验证的实际行为：`plugin add` 会把包写入 profile 的 `dependencies` 并自动追加到 `dsh.profile.bundles`；包内 `cordis.patch.yml` 以 bundle 层插入 `ui-skin-ccd-style`，用户层再用同 id 覆盖 `enabled`。**手写 `- id: ui-skin-ccd-style` 覆盖条目不会创建条目**，只会得到 `patch: entry "ui-skin-ccd-style" not found`。开发环境也支持 `link:` 安装，但 pnpm 在 `link:` → `file:` 切换时会重新解析被链接项目，曾导致本仓库 `node_modules` 被清理，推荐使用安装包路径。

启用后 DSH 会为该插件自动生成设置表单（因为 `Config` 字段标了 `.volatile()`），因此「启用」开关本身就是停用／恢复入口，无需重启。

## 后续阶段

深色模式与跟随系统、Windows／Linux 支持、更多 DSH 版本适配、CCD 专有导航与快捷键、工具单行概要及展开行为复刻、全局统计与热力图。实施这些功能时再补所需参考和数据核查。

## 资料来源

- [dsh-claude-style](https://github.com/Nwflower/dsh-claude-style)、[许可证](https://github.com/Nwflower/dsh-claude-style/blob/master/LICENSE)、[样式说明](https://github.com/Nwflower/dsh-claude-style/blob/master/docs/STYLE.md)、[架构说明](https://github.com/Nwflower/dsh-claude-style/blob/master/docs/architecture.md)
- [官方 Desktop 说明](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/desktop/README.zh.md)
- [官方客户端包规则](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/AGENTS.md)
- [主题接口](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-theme/src/client/index.ts)
- [插槽实现](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-slots/src/index.ts)
- [注册生命周期](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-renderer/src/client/registry.ts)
- [会话与 Factory](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-conversation/README.md)
- [Workspace 导航服务](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-workspace/src/client/navigation.ts)
- [官方工具展示接口](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-tool/README.md)

上述 master 文档用于理解机制；最终实现和兼容判断以已核实的 `0.2.0-rc.2` 为基线。
