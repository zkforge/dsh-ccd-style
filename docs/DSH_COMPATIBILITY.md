# DSH 兼容边界

基线：2026-10-01，本机 DeepSeek Harness Desktop `0.2.0-rc.2`（Electron 44.0.0，macOS arm64）。通过只读解析应用 app.asar 核实官方模板、加载格式、主题服务与 UI 包版本；项目 devDependencies 使用相同版本的公开 SDK。

## 加载协议

Host 入口导出 Config／apply。包声明 `dsh.bundle.patch`、`dsh.client.platform=web`，并暴露 `./client`。

安装到 profile 的正确路径是包管理器可见的依赖，而不是手写 patch 条目：

```sh
dsh plugin --profile desktop add /absolute/path/dsh-ccd-style-0.1.0.tgz
```

该命令把包写进 profile 的 `dependencies`，并在包声明了 `dsh.bundle.patch` 时把包名追加到 `dsh.profile.bundles`（`dsh-app-boot` 的 `reconcileProfilePlugins`）。bundle 层随后应用包内的 `cordis.patch.yml`，它用 `insert:` 形式插入条目 `ui-skin-ccd-style`。

**只有 `insert:` 能新增条目。** 形如 `- id: X` / `name: Y` 的顶层条目是**覆盖**已存在条目；当 X 不在任何 bundle 层里时，加载器只打印 `patch: entry "X" not found` 并忽略，插件不会出现——这一点在本轮排查中实际发生过。用户层再用同一个 `- id: ui-skin-ccd-style` 覆盖 bundle 插入的条目来设置 `enabled`。

Client 产物调用 `window.__ModuleLoader__.load()`，factory 返回模块导出（`apply`、`inject`）。不能作为普通 ESM 入口加载。运行服务由导出的 Cordis `inject` 控制；`dsh.client.inject` 只是包名信息边。

静态客户端条目由 `dsh-client-modules` 按 loader 条目创建，`loader.create({ name })` **不带配置**，因此客户端半不能通过 `apply` 的第二个参数读到插件配置。

## 客户端配置传输

官方做法是 Host `Config` 中把要暴露的字段标记 `.volatile()`，DSH 设置层（`dsh-settings` 的 `volatileForm`／`projectForm`）只投影 volatile 路径，客户端半用 `ctx.configForms.get(entryId)` 订阅同一份数据。要点：

- 未标记 volatile 的字段不会出现在配置表单里，`getSnapshot().value` 里也没有；
- 未被服务的命名空间返回 `status: "unavailable"`；服务前是 `"loading"`，必须订阅而不是只读一次；
- 表单提供 `getSnapshot()`、`subscribe()`、`set()`、`unset()`、`mutate()`；
- 提供方是 `@deepseek-ai/dsh-client-ui-settings`，它不在本项目的类型基线内，因此 `ConfigFormsPort` 在 `src/client/contracts/ports.ts` 中结构化声明，只覆盖本项目使用的成员。
- `set(field, value)` 的 `field` **不拆点号**，等价于 `path: [field]`；嵌套字段（`features.sidebar`、`appearance.canvas`、`fonts.code`）必须走 `mutate([{ op: 'set', path: [...] }])`。写入按 revision 加栅栏，过期写入返回 `settings/conflict`。
- **一个 volatile 节点必须覆盖整棵子树，且不能再嵌套 volatile 节点。** Cordis 对「volatile 字段位于另一个 volatile 字段内」直接报错（`volatile fields require a fixed object path without an enclosing volatile field`），整条插件条目不会激活；`features`、`appearance`、`fonts` 因此都是「节对象 volatile、叶子字段普通」，`tests/host-config.test.ts` 固定这条契约。

## 插件自带的配置页（2026-10-02）

DSH 不自动渲染 volatile 表单：`dsh-settings` 的 `autoGenerate` 目前没有任何客户端消费者，「设置 → 内置插件」分区只渲染各插件自己注册的标签页。要让用户改配置，插件必须自己注册页面。

本项目注册进侧栏「插件」页声明的 `plugins.row.config`（keyed，键 `<包名>#<行 id>`，本插件为 `dsh-ccd-style#ui-skin-ccd-style`；声明处是 `ui-plugin-manager` 的 `main` 面板注册，children 里 `{ kind: 'keyed', scope: 'root' }`）。要点：

- 行标题本身就是那个「配置」控件；没有注册的行走纯文本分支，因此缺失时不会出现点不动的入口。
- 宿主给页面传 `view`（`summary`／`page`）与 locale 席位；表单由插件自己用 `ctx.configForms.get(entryId)` 持有，不依赖页面透传的 `form` 包装。
- `ui-plugin-manager` 不在本项目的类型基线内，`compat/plugin-manager.ts` 结构化声明 `inject`／`register` 两个成员并注明来源；`ctx.slots.inject` 会等到该插槽被声明，没有该面板的部署只是不挂载页面。
- 注册声明 `locale: 'ccdSettings'`，字典经 `ctx.locale.register(ns, { zh, en })` 注册（命名空间用 `declare module '@deepseek-ai/dsh-client-ui-slots'` 的 `LocaleNamespaceMap` 增强保持键类型）。**没有 locale 服务的部署会让带 `locale` 的注册在渲染时直接报错**，因此本项目把 `slots` 与 `locale` 成对注入：缺一就不注册页面，界面其余部分照常运行。

## 系统字体清单（2026-10-02）

配置页的字体候选来自 Chromium 的 Local Font Access API（`window.queryLocalFonts()`）。两点核实过的事实：

- **桌面窗口不需要授权提示。** 应用主进程为主窗口 session 安装了权限处理器（`app.asar/lib/main.js` 的 `installMicrophonePermissions`）：`setPermissionCheckHandler` 对非 `media` 权限直接 `return true`，`setPermissionRequestHandler` 对非 `media` 权限直接 `callback(true)`，因此 `local-fonts` 自动放行。
- **失败形态是"空清单"而不是异常。** 未授权时 Chromium 实测解析为 `[]`（不 reject）；没有该 API 的浏览器（Safari／Firefox）连函数都不存在。两种情况都退回手填，不报错。
- 实测本机返回 800 个 face → 258 个族，含 `PingFang SC/TC/HK`、`Hiragino Sans GB`、`Songti SC`、`Heiti SC`、`SF Pro`、`SF Mono`、`Menlo`、`Maple Mono NF CN`；未安装的字体（Noto Sans SC、微软雅黑）不出现。`family` 是英文族名，`style` 等其余字段不参与拼栈。
- 查询在**首次展开菜单或聚焦输入框时**发起（权限需要用户手势），结果按页面会话缓存，切换行或页面不重复查询；选中的族名立即写入（页面是即时生效语义）。
- **不用原生 `<datalist>`**：它的下拉是 OS 控件，既不吃本页样式，在桌面窗口里滚轮也不滚动（用户实测 258 项无法滚动），因此候选菜单由插件自绘（无边框圆角卡片 + 阴影 + 与下拉框行首对齐 + 搜索 + 260px 滚动区，当前项在行尾带蓝色 ✓），滚动、搜索、键盘都由本页负责；菜单用固定定位并跟随锚点矩形重定位，滚动时不关闭——把菜单打开的那次点击之后还会到达一个"滚动进视野"的事件，监听滚动关闭会让菜单刚开就消失。
- 开关与下拉框同样自绘：宿主 `Switch`／`SegmentedControl` 等来自 `@deepseek-ai/dsh-client-ui-primitives`，该包不在本项目的类型基线内（本机未安装类型），引入它会新增依赖并让包检查夹具需要额外桩；自绘件只复用宿主设置页的形状与 token——开关 36×20 胶囊、16px 滑块，开启态用宿主的蓝色静态 token `--dsw-static-blue-450`（浅色与深色都定义在宿主基础调色板里），关闭态 `--dsw-alias-border-l3`，滑块 `--dsw-alias-switch-thumb`／`--dsw-alias-label-primary-foreground`；下拉框用 `--dsw-alias-border-l2`、`--dsw-radius-sm`、`--dsw-elevation-prominent`。

## 默认界面字体与 Geist（2026-10-03）

- 界面默认栈的唯一来源是 `src/client/theme/tokens.css` 的 `--ccd-font-fallback`；现在它以 `Geist` 打头。未安装该族时由 CSS 直接落到后面的平台栈，不需要 JS 兜底——`theme/tokens.ts` 只在用户配置了族名时前置，不复制字体清单。
- Geist 是 Anthropic Sans 的上游设计（`Anthropic Sans` 的字体厂商字段为 `BSPK x Geist x Anthropic`），按 SIL OFL 1.1 分发：仓库放 `assets/fonts/Geist-Variable.ttf`（上游 `Geist[wght].ttf` 的逐字节副本，仅改文件名）与 `assets/fonts/OFL.txt`。它**不在** `package.json` 的 `files` 白名单里，因此 npm 包体积与 `check:package` 的 54 文件清单都不变，只服务"从仓库安装"这条路径。
- **为什么附 TTF 而不是 woff2**：macOS／CoreText 安装字体只认 TTF／OTF／TTC，网页用的 woff2 复制进 `~/Library/Fonts` 不会被识别。
- **字体只在应用启动时枚举**：把文件拷进 `~/Library/Fonts/` 后需要正常重启 DSH，⌘R 重载界面看不到新字体；配置页候选清单同样在页面加载时抓取（与上一节同一条缓存语义）。
- 参考字体 Anthropic Sans／Serif 仍不分发、不写进字体栈，只在本机自行安装时才可能被用户手动选进 `fonts.uiLatin`。

## 主题 token 覆盖（2026-10-02）

`ctx.theme.overrideTokens(source, tokens)` 是插件改全局颜色与字体的入口。核实要点：

- 它**只校验值是 `{ light, dark }` 字符串对**，不校验 token 名，也不与 `BUILTIN_INSPECT_TOKENS`（那只是 `exportInspectTokens()` 的目录，14 个颜色 token）比对；`--ccd-*` 这类自有变量同样可下发。
- presenter 把 `snapshot.active.tokens` 逐个 `body.style.setProperty`，移除 layer 时清理，因此覆盖是内联在 `body` 上的：**插件样式表在 `html`／`:root` 上重设同名变量赢不了它**，引用宿主 token 的声明也必须落在 `body` 或更深，不能在 `html` 上转发。
- 本插件下发的宿主 token：`--dsw-alias-bg-base`（会话画布）、`--dsw-specific-sidebar-fill`（侧栏）、`--dsw-alias-border-l3`（分隔线）、`--dsw-font-family`（界面字体栈）、`--ds-font-family-code`（代码字体栈）。字体 token 定义在 `ui-theme` 的基础样式（`:root`），不在「每元素重新声明」的遮蔽块里，因此 body 内联可胜出。
- 覆盖 `--dsw-font-family` 会连带改变 `--dsw-font-family-brand` 的兜底（它是 `"Montserrat", var(--dsw-font-family)`）。右侧栏 xterm 终端（JS 选项 + canvas 量宽）、PDF／Excel／HTML 预览、KaTeX 公式与桌面原生欢迎窗不经过这些变量，插件不承诺覆盖它们。
- **两套配色同时下发。** 每个条目都是 `{ light, dark }`，presenter 按解析后的配色取一侧内联到 `body`；未配置的 `--ccd-*` 不由这一层下发。因此插件的深色块写在 `body[data-ds-dark-theme]` 上而不是 `html` 上——覆盖是 body 内联，`html` 上的重设赢不了它（见上一条），深色变量必须落在同一层或更深才能被后代继承到。
- **深色的信号来自宿主自己。** `@deepseek-ai/dsh-client-ui-theme` 的客户端样式用 `body[data-ds-dark-theme]` 切换整套 `--dsw-*`，插件只在这个属性下声明自己的深色变量，不新增开关；`system` 由宿主的 `prefers-color-scheme` 媒体查询解析（插件不读媒体查询）。
- **偏好读写只有三个成员。** `ThemeRuntime.getTheme()` 读快照（`preference` 是持久值，`active` 是解析后的配色）、`setTheme(id)` 是唯一写入口、`theme/change` 是唯一变更信号；插件配置页的「外观 → 主题」就架在这三个成员上（`compat/adapter.ts`），写出的值落在 profile 的 `ui-theme` 条目里，与宿主自己的 Appearance 行共用一份状态。三者缺一即不渲染该行，不报错。升级时核对成员名与 `body[data-ds-dark-theme]` 这枚属性。

## 插槽、编辑器和恢复

插槽名称集中在 `src/client/compat/slots.ts`，实际占用与所有权以运行中的注册表为准（`slots.spec()`／`entriesOfSlot()`）。关键事实：

- `sidebar`、`main.conversation` 等位置被官方组件独占，**替换它们会同时移除其声明的子插槽**（`sidebar.workspaces`、`sidebar.settings`、`conversation.header` 等），因此本项目保留这些容器的原生占用。
- 官方 Composer 拥有 Lexical 编辑器、IME、草稿、引用、附件、slash／@ 和 Queue／Steer；每会话只能有一个可编辑根。本插件保留 Composer，仅 shadow 无子位置的 `conversation.input.model` 展示插槽。
- 附件展示由官方 `ui-attachment` 插件注册渲染（`conversation.input.attachments` 等插槽），本插件不接管数据与回调，只把它的图片预览轨并进输入表面（样式见 `theme/composer.css`，类钉在 `compat/host-dom.ts`）。
- Composer 主按钮的状态由 `ui-conversation/InputBar` 拥有：停止态内联 SVG 含 `rect`，发送态含 `path`；这项 0.2.0-rc.2 结构仅用于 CSS 选择遮罩。生成中输入新草稿时两个主按钮是 `.yhfFVG_trailing` 下相邻的兄弟节点，首个停止按钮向左错开 30px；不用嵌套 `:has()`（Chromium 不支持）。控制行保留宿主的 inline-size containment，并设 `position: relative`；按钮以行顶边为基准向上偏移「行间距 + 面板底内边距 + 1px 边框」，因此不依赖编辑器或附件高度。遮罩几何取自静态共享库 `ui-primitives` 的 `IconSendOutlineRegular`／`IconStopFillRegular`，不复制业务组件、不增加运行时依赖。
- 官方 Composer 的卡片、输入面板、工具行分别带 `data-composer-card`、`data-input-scroll`、`data-composer-input` 等稳定属性，是首选的样式锚点。
- 未选工作区时 `InputBar.module.css` 的 `.yhfFVG_cardWorkspaceTrigger::after` 画整卡虚线（`border: 1px dashed; inset: 0`）；插件在作用域内设 `content: none`，改由该状态下的输入面板用 `border-style: dashed` 表达提示；选好工作区后自然回到实线。类名记录在 `compat/host-dom.ts`，来源为本机 DSH `0.2.0-rc.2` 的官方 InputBar；原生卡片点击、编辑器键盘入口与禁用状态保留。
- 会话顶栏的视图切换器（`conversation.view` 列表插槽 → `[data-conversation-tabs]` 的 `role="tab"` 按钮）同样由官方注册与渲染：插件不注册条目、不接管选中状态，只重排它所在的顶栏并改画外壳（见下）。

## 模型选择服务（2026-10-02）

类型依赖 `@deepseek-ai/dsh-client-ui-model-selection@0.2.0-rc.2`，只作 `import type`；manifest 增加该提供方包的信息边，没有新增动态运行时 require。共用 `conversation.input.model` 的 owner `locked`、`model` locale、ModelDirectoryState 和 select 参数均由 SDK 派生。

注册层等待模型目录、sessions、slots 与 `remote`／`remote.session` 后，获取当前会话的官方目录。Cordis 会把服务调用绑定到调用方 Context；调用 `directoryFor()` 的作用域同样需要声明远程命名空间，不能只依赖模型插件自身的 inject。子注入 Fiber 的 dispose 归属 CleanupScope，slot 注册的 disposer 归属该 Fiber。priority -10 在默认 0 的原生条目前渲染，原生条目始终留在注册表，释放后自动恢复。

TSX 接收 `locked`、`available`、目录标准 hook 与注册层回调；不访问 Context 或重建 ModelDirectory。模型列表与 effort 分开渲染，两者调用同一官方 selectModel 管线；加载状态、partial failures、不可路由的保留选择和选取错误来自官方目录。只提供当前 route 广告的 effort，缺省值以该模型元数据处理；提交前重新核对 route／能力／pending。无模型选择能力的 addressed subagent 继续省略入口。

`HOST.modelSelectTrigger` 兼容原生按钮与 `[data-ccd-model-controls]`；统计几何把两个按钮作为完整选择组量测，保留现有名称限宽与 effort 不收缩行为。新浮层使用自有 dialog，通过 React effect 管理定位和交互，原生菜单翻转适配无需接管。

## 版本相关的 DOM 适配

DSH 使用 CSS Modules，类名带构建哈希（例如侧栏 `_3WPZCG_`、会话 `ST7X_W_`、输入区 `yhfFVG_`、框架 `_6Qf49G_`）。这类选择器全部集中在 `src/client/compat/host-dom.ts`，逐条注明来源包与源文件。稳定锚点优先使用 `data-slot` 与 `data-*` 状态属性。

助手正文 Markdown 样式限定在 `ui-chat/AssistantMarkdown.module.css` 的 `.gKv1-q_root` 内。官方静态共享库 `ui-primitives/markdown/MarkdownText.module.css` 在本机 Web／Desktop 共用的 web-frontend bundle 中映射为 `._markdown_1ypvv_5`，文件导航按钮为 `._fileMention_1ypvv_85`；类名登记在 `compat/host-dom.ts`，来源经只读 app.asar 和运行中的官方 Web 组件核对。`data-markdown-variant="compact"` 用于排除推理／工具的紧凑 Markdown；`:not(pre) > code` 仅调整行内代码，不影响代码块。宿主代码字号规则自带 `!important`，插件仅对该字号比例作同等优先级覆盖。长代码芯片使用 `inline-block` 与 `max-width: 100%` 在自身内部换行，避免 Chromium 对逐行克隆背景边框的额外宽度计算造成溢出。链接和代码中的路径按钮仍由原生 Markdown delegate 处理，原生链接图标与焦点环保留；没有新增导航或发送逻辑。

助手正文表格（2026-10-02）：同一个 `MarkdownText` 把表格渲染成原生 `<table>`，宿主 `0.2.0-rc.2` 的实测形态与参考图相差较远，插件因此整块重画卡片外观。运行时读到的宿主事实：`table` 是 `border-collapse: collapse`、无边框、字号 13px／行高 22px；`th` 与 `td` 都带 `padding: 10px 16px 10px 0`（**首列没有左内边距**），字号同样是 13px／22px；`th` 字重 500、下边框 1px `--dsw-alias-border-l3`，`td` 下边框 1px `rgba(0,0,0,.1)`；列对齐由宿主写成 `text-align`（`:---`／`:---:`／`---:` → `left`／`center`／`right`），插件不改。折叠边框画不出圆角，所以卡片改用 `border-collapse: separate; border-spacing: 0` 并自带 1px 外框，表头填充与行线由单元格自己画、由表格的 `overflow: hidden` 裁到圆角内；字号与行高回到正文的 14px／24px。宿主表格规则来自构建期 CSS Modules，本机 `document.styleSheets` 里取不到（返回 0 条命中），因此这些值以运行中的 computed style 为准。

框架的三列宽度由 `ui-layout` 求解并写成内联 `grid-template-columns`（默认侧栏轨道 280px，clamp 范围 264–420），拖动时 `AppFrame` 只把指针位移加到自己的偏好上。样式表无法单独改写某个轨道，**插件因此不写轨道值**：分隔线画在侧栏自己的右边缘，线随指针移动。曾用「发布差值 + 中列负边距」把视觉宽度固定到 264px，实测会盖住分隔线并让轨道大于 264 时拖动失去反馈，已移除（`compat/sidebar-track.ts` 删除）。

侧栏收起后宿主换的是另一套布局，不是同一套布局变窄：`._3WPZCG_root` 多出 `_3WPZCG_collapsed`（交接瞬间还会先经过 `_3WPZCG_fading`），宿主自己的规则把根内边距改成 `18px 10px 6px`、品牌行改成 `padding: 0; height: 36px`、每个图标按钮改成 36×36 并各自居中（`._3WPZCG_collapsed ._3WPZCG_iconButton`／`_newSession`／`_panelRow`／`_settingsArea` 等）；图标轨的入场是 `@keyframes _3WPZCG_rail-in { 0% { opacity: 0; transform: translate(49px) } }`（.15s、`backwards`），所以未入场时整条轨停在右侧 49px 处被 `_6Qf49G_sidebarCol { overflow: hidden }` 裁掉。macOS 的按钮由两处原生组件渲染：展开时在 `SidebarRoot` 的 `topStrip`，收起时由框架挂载 `[data-shell-leading]`（`HeaderLeadingControls`，还带原生「新建会话」按钮）。此前插件的 `margin-left: auto` 把展开按钮推到侧栏右端，而收起入口位于窗口 `88/11`，因此点击前后会换位置。现在两处共用 `--ccd-sidebar-toggle-left`：非全屏 88px、全屏 12px，纵坐标 11px、28×28。展开态 `.toggle` 用 `position: fixed` 和 `-webkit-app-region: no-drag` 保持窗口坐标与点击能力；框架出现 `[data-sidebar-collapsed]` 时旧 `.toggle` 立即 `visibility: hidden`，交接帧只由原生 shell 入口响应。不改变 topStrip 的拖动区域、宿主回调或列宽。非 macOS 的 `margin-left: auto` 与图标轨几何保留；展开态压缩仍带 `:not(._3WPZCG_collapsed)`，topStrip 的流内高度规则仍排除 fading。纯样式随 sidebar 清理作用域释放，不增加监听器、注册或 DOM 搬移。来源：本机 app.asar 中的 `ui-sidebar/SidebarRoot`、`ui-sidebar/HeaderLeadingControls` 与 `ui-layout/AppFrame`（只读核对）。

`compat/account-menu.ts`：账号菜单是 portal 的 `Menu`，插件在它打开期间打上 `data-ccd-account-menu` 并把侧栏账号行上的真实名字镜像到 `--ccd-account-name`，供样式表画参考图的卡片页眉。名字取自 `ZogL4G_label` 的文本，菜单本身由宿主渲染，条目一条不增不减。

`compat/composer-menus.ts`：Composer 与新建页的芯片行都贴在窗口底边，宿主 `Menu` 的视口兜底（`y = min(max(y, overlayTop), vh - 高度 - 12)`，上界即宿主自己的 `overlayTopMargin()`：`max(12, --dsh-frame-top-clearance + 20)`，全屏只留 20）会把朝下打开的菜单顶回锚点上方并盖住它。该模块只对「锚点在窗口底边」的菜单（hero 芯片行的工作区选择器与 Agent 预设芯片、Composer 控件、账号行）生效：放不下时按宿主的 `side: "top"` 几何重新定位，菜单底边贴在锚点上方 4px。**只有比锚点上方空间更高的卡片才会被加 `max-height`**，上限就是那段剩余空间（宿主带 `.scrollable` 的卡片本来就让 `.viewport` 滚动），于是这种卡片仍然贴着按钮、余下模式在卡片内滚动，而不是盖住 Composer；放得下的卡片一律保留自己的高度，插件不写任何上限——写一个等于当前高度上限会在卡片长高时裁掉内容，而卡片确实会在量测之后长高：账号菜单的页眉由本插件自己的样式表在第二轮才画上，选择器的行也常常晚一轮到达。放得下、或向上显示的内容不比宿主兜底更多时完全不干预；带二级卡片的菜单只在放得下时才翻转（宿主不裁剪这类卡片，插件也不给它加会被裁掉的滚动容器）。菜单不再是「固定的 `[role="menu"]` 表面」（模型选择器从入口格切到模型面板时同一个节点会换成 `role="group"`）后，模块会撤掉自己写过的标记与上限。未加限的高度按菜单量一次并缓存，之后每次校正都用卡片的实时盒子刷新：只要当前高度不是被插件自己的上限裁出来的，那个盒子就是卡片自己的高度。缓存只在「卡片确实高于剩余空间」时兜底，因为量那个高度要先摘掉上限、量完再写回，把这两次写入留在每次观察器回调里会让观察器自己的记录反过来无限喂给自己。因为 Chromium 会节流被遮挡窗口的 `requestAnimationFrame`（`ResizeObserver` 的投递同样依赖渲染步骤，实测遮挡时一次都不来，所以不能用它当失效信号），校正直接在 MutationObserver 回调（微任务）里执行；窗口尺寸变化另由 `resize` 监听触发，因为宿主自己的定位循环同样是 rAF，遮挡时不会更新。

`compat/stats-values.ts`：宽列每个图标显示一个简短读数——速率优先取含 `/` 的段，用量取含 `%` 的缓存命中份额（宿主 `stats.cacheHit` 在中文／英文都是 `{percent}%`），两者都没有时回退首段；只从宿主标签读取并发布 `--ccd-stat-value`，不修改宿主文本。Composer 容器 ≤700px 时 CSS 省略前两项文字，上下文图标始终显示百分比。模块用 `.yhfFVG_trailing` 的完整实测宽度发布 `--ccd-trailing-width`，让兄弟节点 dock 落在模型组之前；量控制行内宽、前导控件、统计簇与簇间隙（`--ccd-cluster-gap`）后发布 `--ccd-model-max-width`，模型按钮按剩余空间限宽，保留推理等级并只省略模型名。右栏拖动只改框架的内联 grid 轨道、不触发窗口 resize，因此 MutationObserver 同时观察 `style`／`class`／`data-model-compact`；每次写入先比较属性值，自己的 style 通知最多补一轮空操作，不会循环。原生 trailing 组的最后一个座位是空 activity（语音输入）时仍是一个盒子——渲染器给每个 slot 条目套 `display: contents` 包装，宿主自己的 `:empty` 看不到它为空——插件按 `:has()` 判空并隐藏它，模型／effort 因此贴住控制行右内边缘；座位被占用（`yhfFVG_activityExpanded`）时保持原生布局。窗口 resize 监听与观察器仍随作用域释放。

`compat/view-switch.ts`：会话顶栏的视图切换器要挪到标题行、并让选中段平滑滑动，这两件事都只有宿主知道答案——选中哪个视图、选中格的宽度是多少。该模块不复制这些状态，只在每次 DOM 变更后量一次 `.ST7X_W_tabActive` 相对 `.ST7X_W_tabs` 的位置与宽度，发布成轨道上的 `--ccd-view-x`／`--ccd-view-w`；点击仍然打在宿主自己的按钮上，由宿主决定切换。观察器覆盖 `childList`／`characterData`（换会话会重建顶栏，切语言会换标签文本）与 `class`／`aria-selected`／`style` 属性（右栏拖动的框架轨道失效信号）。`--ccd-view-duration` 区分选择变化（180ms）和同一按钮的布局校正（0ms），数值相同时不写属性，不取消正在运行的选择动画。释放时三个属性一并移除。

顶栏的重排不搬动任何宿主节点：`.ST7X_W_titleRow` 与 `.ST7X_W_titleCluster` 用 `display: contents` 溶解成「只有子元素参与父级 flex 布局」的形态，再用 `order` 指定「标题 → 视图切换器 → 预设芯片 → 工具图标 → 右侧按钮」的顺序，标题与切换器的盒子之间固定留 2px（标题另有 8px 右内边距），切换器到团队入口固定留 10px，使两处可见间距同为 10px，顶栏固定左侧 12px 内边距；标题保持自然宽度、上限 112px，不随列宽变化而收缩，成组后的弹性间距由 `.ST7X_W_headerActions` 的 `margin-right: auto` 提供。弹性间距挂在芯片容器而不是轨道上，是为了让「标题 → 切换器 → 芯片」始终靠左、工具图标始终贴右，且后续在芯片之后追加条目（后台任务等）时不必再动轨道；宿主只对 `headerUtilities`／`headerCorner` 写了 `:empty { display: none }`，芯片容器即使没有内容也仍是 flex 项，弹性间距因此不会因某个插槽为空而消失。React 仍然拥有整棵顶栏，插件既不 re-parent 也不重排 DOM，因此不存在 React 删除节点时找不到父节点的风险。溶解的代价是写在这两层上的盒子属性一并失效：宿主的 `.ST7X_W_titleRow { padding-inline-start: max(0px, calc(var(--dsh-frame-leading-clearance,0px) - 20px)) }`（收起侧栏／全屏时让开 macOS 窗口按钮）被搬到该行的第一个子元素 `.ST7X_W_crumbs` 上，当前让位按 `--dsh-frame-leading-clearance - 12px` 计算；macOS 收起左栏时隐藏标题 crumbs，仅保留窗口控件的让位空间，视图切换器距聊天列左边缘固定 162px（非全屏）。

停用不会重置用户主题或配置：语义颜色覆盖返回 disposer，根属性、菜单标记、`--ccd-trailing-width`、`--ccd-model-max-width`、`--ccd-stat-value`、`--ccd-view-x`、`--ccd-view-w`、`--ccd-view-duration`、滚动视口上的 `data-ccd-fade-top`／`data-ccd-fade-bottom` 与页面主体上的 `--ccd-fade-bottom-inset` 都由各自模块精确恢复。停用后实测：根属性消失、7 张样式表与全部自定义属性移除，顶栏回到 76px 的两行网格、视图切换器回到第二行自己的位置。

## 会话页的滚动结构（2026-10-02）

正文边缘渐隐踩到的结构事实，均在本机 `0.2.0-rc.2` 实测（1280×820）：

- **真正滚动的是 `.ST7X_W_scrollBody`，也就是 `[data-conversation-scroll]`。** 它 `overflow-y: auto`、`flex: 1`，box 与窗口等高（实测 `280,49 998×771`，底边就是窗口底边）。里面的正文列 `.icaHSq_scroll` 在这个布局下是 `overflow: visible; height: auto`，自身没有视口，所以任何「贴视口边缘」的效果只能挂在 `[data-conversation-scroll]` 上；`ANCHOR.conversationScroll` 记的就是这个稳定锚点。
- **常驻 Composer 是滚动视口的子元素。** `.ST7X_W_composerSeat` 是 `[data-conversation-scroll]` 的第二个（也是最后一个）子元素，`position: sticky; bottom: 0; z-index: 7`，吸附时盖住视口最后 79px（实测：seat 顶 741，视口底 820；卡片与 seat 顶边同为 741）。因此：
  - **不能给滚动视口加 `mask-image`**：遮罩作用于整棵子树，输入卡会跟正文一起被擦掉（本轮实机复现：滚动到中段时 Composer 区域像素完全等于画布色，即整块消失）。
  - 底部渐隐的下端点应当是 Composer 的顶边，而不是滚动视口的底边 —— 后者在输入卡背后，淡了什么也看不见。插件把这段覆盖高度发布为页面主体（`.ST7X_W_body`，`position: relative`，其 `::before`／`::after` 正好对应「顶栏以下、窗口底边以上」）上的 `--ccd-fade-bottom-inset`。
- **输入卡上方的槽位也会抬高 Composer。** 结构是 `[data-conversation-scroll] > [data-slot="conversation.session"] → .ST7X_W_viewArea`（正文视口，实测高度 = 视口高 − seat 高）与 `.ST7X_W_composerSeat`（Composer，实测 `y=741`、高 79px，`position: sticky; z-index: 7`）。计划／任务行渲染在 seat 内部的 `[data-slot="conversation.input.dock"]`（宿主把它描述为与正文共享的 dock：**queue dock** 与 **Todo dock**，Todo dock 在 composer 上方、行按 pending／ongoing／done 标记，`.yhfFVG_*` 的行状态类即出自这里），出现时 seat 顶边随之上移（夹具实测：加一条 44px 的行后 seatTop 741→691），正文视口同步变矮。那一带的 seat 背景是 `linear-gradient(transparent 0, base 36px)`，**只有前 36px 是透明的**，所以半透明的任务／计划行会把后面滚过的正文透出来——插件因此把底部渐变层铺满 seat 顶边以下的整片区域，而不只是 24px 渐隐带。
- **正文列顶部内边距 16px、底部 8px**（`.icaHSq_scroll` 的 `padding`），所以 24px 的渐变带落在正文上的实际可见部分本来就比宿主自己的面板更轻，符合参考图里「几乎看不出来」的观感。
- **顶栏下缘是宿主画的发丝线**：`.ST7X_W_header { border-bottom: .5px solid var(--dsw-alias-border-l3) }`（空白会话页的 `.headerBlank` 本来就是 `none`）。插件只把颜色画成透明，保留边框宽度，顶栏高度因此不变。
- **宿主同款渐隐的数值**：内部请求面板的 `fadeTop`／`fadeBottom` 用 `mask-image: linear-gradient(…24px…)`（见 `ui-conversation`／`ui-chat` 的 CSS Modules），开关由滚动状态决定。插件沿用 24px，但换成画在正文之上的渐变层，原因见上。

Composer 的精简样式用命名容器查询 `ccd-composer`，因此窗口不变、右栏拉宽时也会切换；视图切换器所在的一段顶栏不随列宽改变内边距和相邻间距，避免整组视图按钮跳动；尾侧图标簇是唯一的例外，它在 `ccd-conversation` 容器 ≤520px／≤420px 时按 tokens 的两档收紧（见本节开头），因为那一侧必须在 400px 列里装下全部原生按钮。顶栏按用户要求移除被动模式展示，保留所有操作按钮及智能体团队完整文字；视图切换器固定为 80×22（每格 40×22），拖动时不改变尺寸，各列宽统一使用紧凑外部间距、团队按钮内边距及尾侧留白；Composer 模型按钮按实测剩余空间限宽（border-box），推理等级常驻、模型名按需省略；权限按钮在窄列隐藏文本。新增固定选择器来自本机同版本 `ui-permission-presets/PermissionSelect.module.css`、`experimental/client-ui-agent-team/TeamAction.module.css`、`ui-agent-preset/AgentPresetLabel.module.css`，均登记在 `compat/host-dom.ts`，没有运行时导入这些插件。

## 参考项目

[Nwflower/dsh-claude-style](https://github.com/Nwflower/dsh-claude-style) 可参考布局与清理思路。**当前没有移植其代码**，因此包内不含其许可证声明；若后续移植，需固定提交并保留 MIT 声明。该项目字体文件不在代码 MIT 授权范围内，不分发这些字体。

## 一手资料

- [Desktop](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/desktop/README.zh.md)
- [客户端包规则](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/AGENTS.md)
- [会话与 Factory](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-conversation/README.md)
- [插槽实现](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-slots/src/index.ts)
- [主题服务](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-theme/src/client/index.ts)

master 文档可能前进；适配决策以固定 SDK、本机资源及实际运行结果为准。

Composer 的 `.yhfFVG_placeholder` 来自 `ui-conversation/InputBar.module.css`，登记在兼容层。hero 提示语比聊天提示语更长，原先正常换行会将第二行挤入 42px 面板底边；现使用左右 inset 约束、nowrap、hidden 与 ellipsis，只有提示语省略，contenteditable 的换行不变。

`compat/composer-placeholder.ts`：按用户最新要求统一 hero 与正常聊天的默认提示语。SDK 的 Composer placeholder 是父级 owner props，没有可追加的改写入口，故不替换官方 Composer。对 DSH 0.2.0-rc.2 `ui-conversation/locales` 中已知中／英文 hero 文案，读取输入区 `data-placeholder` 作匹配，仅原位更新现有提示语 Text 节点及对应 aria-label；不改 contenteditable 内容或子节点结构。MutationObserver 跟随 phase／文案／locale 与节点更新，写入相同值时不重复修改；进入工作区选择／阻断状态时交还原生提示，停用时仅恢复仍等于本插件写入值的文本／aria-label。未知语言或自定义提示保留宿主原状。观察器与修改记录属于 apply 的清理作用域，版权说明保留在 LICENSE。

顶栏尾侧的间距与图标（2026-10-02 重构）：`.ST7X_W_headerUtilities` 与 `.ST7X_W_headerCorner` 里的条目由渲染器包在 `display: contents` 的 seat（`[data-slot="conversation.session.header.utilities"]`／`.corner`）中，所以尺寸规则写在 seat 的子元素上，seat 自己没有盒子。宿主原来的 8px gap 与 corner 的 `margin-left: 8px`／`margin-right: -16px` 不再清零，改为统一 `gap: 2px`、corner `margin-left: 2px`，顶栏右内边距 12px；三档几何（28/24 命中盒、16px 图标、2px 间隙、12/8px 右留白）只在 `theme/tokens.css` 声明一次。此前为左侧 10px 节奏把主键内边距收到 3px、更多按钮收到 24px 的做法已移除——那正是右上角"看着不齐"的原因（盒 0/1/0px 间隙、22 与 28px 不等高）。

「打开方式」由宿主渲染（`ui-open-in-app/OpenTargetButton`：`iq4beG_split` 内的 `iq4beG_main` 直接打开上次应用，`iq4beG_chevron` 才是应用菜单的唯一入口），插件因此不替换组件，只把 chevron 拉伸成整盒热区、隐藏两半的原生图形并换上 `ui-primitives` 的 `IconRightUpOutlineRegular`（MIT），从而得到"一个通用字形 + 点击弹原生菜单"。`compat/open-target.ts` 提供 CSS 表达不了的两个事实：`.iq4beG_chevron` 是否存在（不存在时写 `data-ccd-open-mode="direct"` 并整块隐藏，避免出现"点了直接打开"的图标），以及被覆盖主键与热区的可访问名称（写 `aria-hidden`／`tabindex="-1"`／`title`／`aria-label`，宿主重渲染后回写，释放时按原值恢复）。菜单本身、条目、图标路由与失败提示全部仍是宿主的。

终端／浏览器两个图标是本插件在 `conversation.session.header.utilities` 注册的 list 条目（`order -2`／`-1`：排在原生"更多"`0` 与日程 `-5` 之间，使"更多"始终收尾）。点击调用跨插件面 `ctx.sidebarRight`（`dsh-client-ui-sidebar-right` 的 `reflect.provide`）：会话已有同类型页签时 `focus(tabId)`，否则 `openTab(kind)`。可用性来自 `ctx.sidebarRightTabs.get(kind)` 并订阅该注册表的失效通知，kind 不存在的构建（例如 Web profile 明确停用 `ui-sidebar-browser`）不注册按钮。这两个服务不在类型基线内，成员在 `contracts/ports.ts` 结构化声明，等价缺失时整组新图标不渲染。

顶栏间距修正（旧实现，已被上一段取代）：尾侧 `.iq4beG_main`（本机 `ui-open-in-app/OpenTargetButton.module.css`）横向内边距从 5px 收为 3px，`.Da3aKq_moreButton`（本机 `session-log-export/HeaderAction.module.css`）宽度从 28px 收为 24px，合计收回 8px，留给视图轨道到团队入口的 10px 间距。视图按钮维持 40×22px，各宽度使用同一规则。
