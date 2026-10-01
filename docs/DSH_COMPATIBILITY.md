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
- 附件展示由官方 `ui-attachment` 插件注册渲染（`conversation.input.attachments` 等插槽），本插件不接管数据与回调，只把它的图片预览轨并进输入表面（样式见 `theme/composer.css`，类钉在 `compat/host-dom.ts`）。
- Composer 主按钮的状态由 `ui-conversation/InputBar` 拥有：停止态内联 SVG 含 `rect`，发送态含 `path`；这项 0.2.0-rc.2 结构仅用于 CSS 选择遮罩。生成中输入新草稿时两个主按钮是 `.yhfFVG_trailing` 下相邻的兄弟节点，首个停止按钮向左错开 30px；不用嵌套 `:has()`（Chromium 不支持）。控制行保留宿主的 inline-size containment，并设 `position: relative`；按钮以行顶边为基准向上偏移「行间距 + 面板底内边距 + 1px 边框」，因此不依赖编辑器或附件高度。遮罩几何取自静态共享库 `ui-primitives` 的 `IconSendOutlineRegular`／`IconStopFillRegular`，不复制业务组件、不增加运行时依赖。
- 官方 Composer 的卡片、输入面板、工具行分别带 `data-composer-card`、`data-input-scroll`、`data-composer-input` 等稳定属性，是首选的样式锚点。
- 未选工作区时 `InputBar.module.css` 的 `.yhfFVG_cardWorkspaceTrigger::after` 画整卡虚线（`border: 1px dashed; inset: 0`）；插件在作用域内设 `content: none`，改由该状态下的输入面板用 `border-style: dashed` 表达提示；选好工作区后自然回到实线。类名记录在 `compat/host-dom.ts`，来源为本机 DSH `0.2.0-rc.2` 的官方 InputBar；原生卡片点击、编辑器键盘入口与禁用状态保留。
- 会话顶栏的视图切换器（`conversation.view` 列表插槽 → `[data-conversation-tabs]` 的 `role="tab"` 按钮）同样由官方注册与渲染：插件不注册条目、不接管选中状态，只重排它所在的顶栏并改画外壳（见下）。

## 版本相关的 DOM 适配

DSH 使用 CSS Modules，类名带构建哈希（例如侧栏 `_3WPZCG_`、会话 `ST7X_W_`、输入区 `yhfFVG_`、框架 `_6Qf49G_`）。这类选择器全部集中在 `src/client/compat/host-dom.ts`，逐条注明来源包与源文件。稳定锚点优先使用 `data-slot` 与 `data-*` 状态属性。

框架的三列宽度由 `ui-layout` 求解并写成内联 `grid-template-columns`（默认侧栏轨道 280px，clamp 范围 264–420），拖动时 `AppFrame` 只把指针位移加到自己的偏好上。样式表无法单独改写某个轨道，**插件因此不写轨道值**：分隔线画在侧栏自己的右边缘，线随指针移动。曾用「发布差值 + 中列负边距」把视觉宽度固定到 264px，实测会盖住分隔线并让轨道大于 264 时拖动失去反馈，已移除（`compat/sidebar-track.ts` 删除）。

侧栏收起后宿主换的是另一套布局，不是同一套布局变窄：`._3WPZCG_root` 多出 `_3WPZCG_collapsed`（交接瞬间还会先经过 `_3WPZCG_fading`），宿主自己的规则把根内边距改成 `18px 10px 6px`、品牌行改成 `padding: 0; height: 36px`、每个图标按钮改成 36×36 并各自居中（`._3WPZCG_collapsed ._3WPZCG_iconButton`／`_newSession`／`_panelRow`／`_settingsArea` 等）；图标轨的入场是 `@keyframes _3WPZCG_rail-in { 0% { opacity: 0; transform: translate(49px) } }`（.15s、`backwards`），所以未入场时整条轨停在右侧 49px 处被 `_6Qf49G_sidebarCol { overflow: hidden }` 裁掉。macOS 的按钮由两处原生组件渲染：展开时在 `SidebarRoot` 的 `topStrip`，收起时由框架挂载 `[data-shell-leading]`（`HeaderLeadingControls`，还带原生「新建会话」按钮）。此前插件的 `margin-left: auto` 把展开按钮推到侧栏右端，而收起入口位于窗口 `88/11`，因此点击前后会换位置。现在两处共用 `--ccd-sidebar-toggle-left`：非全屏 88px、全屏 12px，纵坐标 11px、28×28。展开态 `.toggle` 用 `position: fixed` 和 `-webkit-app-region: no-drag` 保持窗口坐标与点击能力；框架出现 `[data-sidebar-collapsed]` 时旧 `.toggle` 立即 `visibility: hidden`，交接帧只由原生 shell 入口响应。不改变 topStrip 的拖动区域、宿主回调或列宽。非 macOS 的 `margin-left: auto` 与图标轨几何保留；展开态压缩仍带 `:not(._3WPZCG_collapsed)`，topStrip 的流内高度规则仍排除 fading。纯样式随 sidebar 清理作用域释放，不增加监听器、注册或 DOM 搬移。来源：本机 app.asar 中的 `ui-sidebar/SidebarRoot`、`ui-sidebar/HeaderLeadingControls` 与 `ui-layout/AppFrame`（只读核对）。

`compat/account-menu.ts`：账号菜单是 portal 的 `Menu`，插件在它打开期间打上 `data-ccd-account-menu` 并把侧栏账号行上的真实名字镜像到 `--ccd-account-name`，供样式表画参考图的卡片页眉。名字取自 `ZogL4G_label` 的文本，菜单本身由宿主渲染，条目一条不增不减。

`compat/composer-menus.ts`：Composer 与新建页的芯片行都贴在窗口底边，宿主 `Menu` 的视口兜底（`y = min(max(y, overlayTop), vh - 高度 - 12)`，上界即宿主自己的 `overlayTopMargin()`：`max(12, --dsh-frame-top-clearance + 20)`，全屏只留 20）会把朝下打开的菜单顶回锚点上方并盖住它。该模块只对「锚点在窗口底边」的菜单（hero 芯片行的工作区选择器与 Agent 预设芯片、Composer 控件、账号行）生效：放不下时按宿主的 `side: "top"` 几何重新定位，菜单底边贴在锚点上方 4px。**只有比锚点上方空间更高的卡片才会被加 `max-height`**，上限就是那段剩余空间（宿主带 `.scrollable` 的卡片本来就让 `.viewport` 滚动），于是这种卡片仍然贴着按钮、余下模式在卡片内滚动，而不是盖住 Composer；放得下的卡片一律保留自己的高度，插件不写任何上限——写一个等于当前高度上限会在卡片长高时裁掉内容，而卡片确实会在量测之后长高：账号菜单的页眉由本插件自己的样式表在第二轮才画上，选择器的行也常常晚一轮到达。放得下、或向上显示的内容不比宿主兜底更多时完全不干预；带二级卡片的菜单只在放得下时才翻转（宿主不裁剪这类卡片，插件也不给它加会被裁掉的滚动容器）。菜单不再是「固定的 `[role="menu"]` 表面」（模型选择器从入口格切到模型面板时同一个节点会换成 `role="group"`）后，模块会撤掉自己写过的标记与上限。未加限的高度按菜单量一次并缓存，之后每次校正都用卡片的实时盒子刷新：只要当前高度不是被插件自己的上限裁出来的，那个盒子就是卡片自己的高度。缓存只在「卡片确实高于剩余空间」时兜底，因为量那个高度要先摘掉上限、量完再写回，把这两次写入留在每次观察器回调里会让观察器自己的记录反过来无限喂给自己。因为 Chromium 会节流被遮挡窗口的 `requestAnimationFrame`（`ResizeObserver` 的投递同样依赖渲染步骤，实测遮挡时一次都不来，所以不能用它当失效信号），校正直接在 MutationObserver 回调（微任务）里执行；窗口尺寸变化另由 `resize` 监听触发，因为宿主自己的定位循环同样是 rAF，遮挡时不会更新。

`compat/stats-values.ts`：按用户最新要求，宽列每个图标显示一个简短读数（速率优先取含 `/` 的段，token 取首段）；只从宿主标签读取并发布 `--ccd-stat-value`，不修改宿主文本。Composer 容器 ≤700px 时 CSS 省略前两项文字，上下文图标始终显示百分比。模块用 `.yhfFVG_trailing` 的完整实测宽度发布 `--ccd-trailing-width`，让兄弟节点 dock 落在模型组之前；量控制行内宽、前导控件、统计簇与组间 gap 后发布 `--ccd-model-max-width`，模型按钮按剩余空间限宽，保留推理等级并只省略模型名。右栏拖动只改框架的内联 grid 轨道、不触发窗口 resize，因此 MutationObserver 同时观察 `style`／`class`／`data-model-compact`；每次写入先比较属性值，自己的 style 通知最多补一轮空操作，不会循环。原生 trailing 的空 activity 插槽仍占组间 gap（宽列 12px、窄列 8px），不能用模型按钮宽度替代组宽。窗口 resize 监听与观察器仍随作用域释放。

`compat/view-switch.ts`：会话顶栏的视图切换器要挪到标题行、并让选中段平滑滑动，这两件事都只有宿主知道答案——选中哪个视图、选中格的宽度是多少。该模块不复制这些状态，只在每次 DOM 变更后量一次 `.ST7X_W_tabActive` 相对 `.ST7X_W_tabs` 的位置与宽度，发布成轨道上的 `--ccd-view-x`／`--ccd-view-w`；点击仍然打在宿主自己的按钮上，由宿主决定切换。观察器覆盖 `childList`／`characterData`（换会话会重建顶栏，切语言会换标签文本）与 `class`／`aria-selected`／`style` 属性（右栏拖动的框架轨道失效信号）。`--ccd-view-duration` 区分选择变化（180ms）和同一按钮的布局校正（0ms），数值相同时不写属性，不取消正在运行的选择动画。释放时三个属性一并移除。

顶栏的重排不搬动任何宿主节点：`.ST7X_W_titleRow` 与 `.ST7X_W_titleCluster` 用 `display: contents` 溶解成「只有子元素参与父级 flex 布局」的形态，再用 `order` 指定「标题 → 视图切换器 → 预设芯片 → 工具图标 → 右侧按钮」的顺序，标题与切换器的盒子之间固定留 2px（标题另有 8px 右内边距），切换器到团队入口固定留 10px，使两处可见间距同为 10px，顶栏固定左侧 12px 内边距；标题保持自然宽度、上限 112px，不随列宽变化而收缩，成组后的弹性间距由 `.ST7X_W_headerActions` 的 `margin-right: auto` 提供。弹性间距挂在芯片容器而不是轨道上，是为了让「标题 → 切换器 → 芯片」始终靠左、工具图标始终贴右，且后续在芯片之后追加条目（后台任务等）时不必再动轨道；宿主只对 `headerUtilities`／`headerCorner` 写了 `:empty { display: none }`，芯片容器即使没有内容也仍是 flex 项，弹性间距因此不会因某个插槽为空而消失。React 仍然拥有整棵顶栏，插件既不 re-parent 也不重排 DOM，因此不存在 React 删除节点时找不到父节点的风险。溶解的代价是写在这两层上的盒子属性一并失效：宿主的 `.ST7X_W_titleRow { padding-inline-start: max(0px, calc(var(--dsh-frame-leading-clearance,0px) - 20px)) }`（收起侧栏／全屏时让开 macOS 窗口按钮）被搬到该行的第一个子元素 `.ST7X_W_crumbs` 上，当前让位按 `--dsh-frame-leading-clearance - 12px` 计算；macOS 收起左栏时隐藏标题 crumbs，仅保留窗口控件的让位空间，视图切换器距聊天列左边缘固定 162px（非全屏）。

停用不会重置用户主题或配置：语义颜色覆盖返回 disposer，根属性、菜单标记、`--ccd-trailing-width`、`--ccd-model-max-width`、`--ccd-stat-value`、`--ccd-view-x`、`--ccd-view-w` 与 `--ccd-view-duration` 都由各自模块精确恢复。停用后实测：根属性消失、7 张样式表与全部自定义属性移除，顶栏回到 76px 的两行网格、视图切换器回到第二行自己的位置。

Composer 的精简样式用命名容器查询 `ccd-composer`，因此窗口不变、右栏拉宽时也会切换；顶栏已取消按列宽改变的内边距和相邻间距，避免整组视图按钮跳动。顶栏按用户要求移除被动模式展示，保留所有操作按钮及智能体团队完整文字；视图切换器固定为 80×22（每格 40×22），拖动时不改变尺寸，各列宽统一使用紧凑外部间距、团队按钮内边距及尾侧留白；Composer 模型按钮按实测剩余空间限宽（border-box），推理等级常驻、模型名按需省略；权限按钮在窄列隐藏文本。新增固定选择器来自本机同版本 `ui-permission-presets/PermissionSelect.module.css`、`experimental/client-ui-agent-team/TeamAction.module.css`、`ui-agent-preset/AgentPresetLabel.module.css`，均登记在 `compat/host-dom.ts`，没有运行时导入这些插件。

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

顶栏间距修正：尾侧 `.iq4beG_main`（本机 `ui-open-in-app/OpenTargetButton.module.css`）横向内边距从 5px 收为 3px，`.Da3aKq_moreButton`（本机 `session-log-export/HeaderAction.module.css`）宽度从 28px 收为 24px，合计收回 8px，留给视图轨道到团队入口的 10px 间距。来源由只读 app.asar 中对应包核对并登记在 host-dom.ts；只加载插件样式，没有改应用归档。视图按钮维持 40×22px，各宽度使用同一规则，不引入拖动断点。
