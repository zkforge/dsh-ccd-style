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

## 插槽、编辑器和恢复

插槽名称集中在 `src/client/compat/slots.ts`，实际占用与所有权以运行中的注册表为准（`slots.spec()`／`entriesOfSlot()`）。关键事实：

- `sidebar`、`main.conversation` 等位置被官方组件独占，**替换它们会同时移除其声明的子插槽**（`sidebar.workspaces`、`sidebar.settings`、`conversation.header` 等），因此本项目只做加性注册与样式。
- 官方 Composer 拥有 Lexical 编辑器、IME、草稿、引用、附件、slash／@ 和 Queue／Steer；每会话只能有一个可编辑根。本插件不注册任何 `conversation.*` 插槽条目，只改样式。
- 官方 Composer 的卡片、输入面板、工具行分别带 `data-composer-card`、`data-input-scroll`、`data-composer-input` 等稳定属性，是首选的样式锚点。
- 会话顶栏的视图切换器（`conversation.view` 列表插槽 → `[data-conversation-tabs]` 的 `role="tab"` 按钮）同样由官方注册与渲染：插件不注册条目、不接管选中状态，只重排它所在的顶栏并改画外壳（见下）。

## 版本相关的 DOM 适配

DSH 使用 CSS Modules，类名带构建哈希（例如侧栏 `_3WPZCG_`、会话 `ST7X_W_`、输入区 `yhfFVG_`、框架 `_6Qf49G_`）。这类选择器全部集中在 `src/client/compat/host-dom.ts`，逐条注明来源包与源文件。稳定锚点优先使用 `data-slot` 与 `data-*` 状态属性。

框架的三列宽度由 `ui-layout` 求解并写成内联 `grid-template-columns`（默认侧栏轨道 280px，clamp 范围 264–420），拖动时 `AppFrame` 只把指针位移加到自己的偏好上。样式表无法单独改写某个轨道，**插件因此不写轨道值**：分隔线画在侧栏自己的右边缘，线随指针移动。曾用「发布差值 + 中列负边距」把视觉宽度固定到 264px，实测会盖住分隔线并让轨道大于 264 时拖动失去反馈，已移除（`compat/sidebar-track.ts` 删除）。

`compat/account-menu.ts`：账号菜单是 portal 的 `Menu`，插件在它打开期间打上 `data-ccd-account-menu` 并把侧栏账号行上的真实名字镜像到 `--ccd-account-name`，供样式表画参考图的卡片页眉。名字取自 `ZogL4G_label` 的文本，菜单本身由宿主渲染，条目一条不增不减。

`compat/composer-menus.ts`：Composer 贴在窗口底边时，宿主 `Menu` 的视口兜底（`y = min(max(y, 12), vh - 高度 - 12)`）会把朝下打开的菜单顶回锚点上方并盖住它。该模块只对「锚点在窗口底边」的菜单（hero 工作区按钮、Composer 控件、账号行）在放不下时按宿主的 `side: "top"` 几何重新定位，并跟随宿主每帧写入；放得下时完全不干预。因为 Chromium 会节流被遮挡窗口的 `requestAnimationFrame`，校正直接在 MutationObserver 回调（微任务）里执行。

`compat/stats-values.ts`：`ui-chat` 的用量胶囊把多个事实渲染成一句话（`6 轮 498 步 · 210 tok/s`），参考图每个图标只跟一个数字。该模块读取**已经渲染出来的文本**，按 `·` 分段后取「含 `/` 的速率段」或首段，发布成胶囊上的 `--ccd-stat-value`，样式表只负责打印这个属性；React 拥有的文本节点一个字节都不改。同一个模块还用 `.yhfFVG_trailing` 的实测宽度发布 `--ccd-trailing-width`，因为统计簇要落在模型选择之前，而 dock 是卡片的兄弟节点、看不到行内布局。

`compat/view-switch.ts`：会话顶栏的视图切换器要挪到标题行、并让选中段平滑滑动，这两件事都只有宿主知道答案——选中哪个视图、选中格的宽度是多少。该模块不复制这些状态，只在每次 DOM 变更后量一次 `.ST7X_W_tabActive` 相对 `.ST7X_W_tabs` 的位置与宽度，发布成轨道上的 `--ccd-view-x`／`--ccd-view-w`；点击仍然打在宿主自己的按钮上，由宿主决定切换。观察器覆盖 `childList`／`characterData`（换会话会重建顶栏，切语言会换标签文本）与 `class`／`aria-selected` 属性，释放时两个属性一并移除。

顶栏的重排不搬动任何宿主节点：`.ST7X_W_titleRow` 与 `.ST7X_W_titleCluster` 用 `display: contents` 溶解成「只有子元素参与父级 flex 布局」的形态，再用 `order` 指定「标题 → 预设芯片 → 视图切换器 → 工具图标 → 右侧按钮」的顺序，轨道与芯片之间的弹性间距由 `margin-right: auto` 提供（与宿主原来「芯片之后留白」的观感一致）。React 仍然拥有整棵顶栏，插件既不 re-parent 也不重排 DOM，因此不存在 React 删除节点时找不到父节点的风险。溶解的代价是写在这两层上的盒子属性一并失效：宿主的 `.ST7X_W_titleRow { padding-inline-start: max(0px, calc(var(--dsh-frame-leading-clearance,0px) - 20px)) }`（收起侧栏／全屏时让开 macOS 窗口按钮）被搬到该行的第一个子元素 `.ST7X_W_crumbs` 上，实测收起侧栏时仍是 140px 留白、标题左边缘 160px。

停用不会重置用户主题或配置：语义颜色覆盖返回 disposer，根属性、菜单标记、`--ccd-stat-value`、`--ccd-trailing-width`、`--ccd-view-x` 与 `--ccd-view-w` 都由各自模块精确恢复。停用后实测：根属性消失、7 张样式表与全部自定义属性移除，顶栏回到 76px 的两行网格、视图切换器回到第二行自己的位置。

## 参考项目

[Nwflower/dsh-claude-style](https://github.com/Nwflower/dsh-claude-style) 可参考布局与清理思路。**当前没有移植其代码**，因此包内不含其许可证声明；若后续移植，需固定提交并保留 MIT 声明。该项目字体文件不在代码 MIT 授权范围内，不分发这些字体。

## 一手资料

- [Desktop](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/desktop/README.zh.md)
- [客户端包规则](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/AGENTS.md)
- [会话与 Factory](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-conversation/README.md)
- [插槽实现](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-slots/src/index.ts)
- [主题服务](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-theme/src/client/index.ts)

master 文档可能前进；适配决策以固定 SDK、本机资源及实际运行结果为准。
