# 项目状态与实施交接

更新日期：2026-10-01。四个核心界面模块已经实现并在真实 Desktop 中验证；本文件记录每个模块**现在**做了什么、边界在哪，以及剩余动作。结构事实见 [ARCHITECTURE.md](../ARCHITECTURE.md)，需求与截图基准见 [PLAN.md](../PLAN.md)，验证结果见 [验证记录](VERIFICATION.md)。

## 实现方式（统一前提）

新会话页与聊天页都是 `conversation.content` 的两种 phase（`hero` / `active`），Composer 是官方 `conversation.composer.bar`。因此四个模块都**不替换**宿主组件，只做两件事：

1. 通过 `environment.dom.mountStyles()` 挂载作用域样式（`html[data-dsh-ccd-style="true"]`）；
2. 只在必须读取宿主动态几何时使用兼容层（打开中的账号菜单、贴着窗口底边的菜单翻转）。

所有特效样式表都是惰性的：宿主元素尚未渲染时挂载不会产生任何效果，因此可以无条件挂载，避免「在插件面板页启用后切回会话却没有样式」的问题。

## shell

入口：`src/client/features/shell/index.ts` + `shell.css`。

- 去掉 macOS 侧栏的蓝紫渐变底色，改为平铺设计色；
- 分隔线画在侧栏自己的右边缘（1px `--ccd-border`），中列不再重复画左边缘；
- 三列轨道完全交给 `ui-layout`：插件不写宽度、不发布差值，所以拖动分隔条时线与指针同步（实测 ±40px 跟随，收缩到 DSH 自己的 264px 下限）。

## sidebar

入口：`src/client/features/sidebar/index.ts` + `sidebar.css`。

- 侧栏内边距、行高、圆角、选中态按参考图压缩；
- 品牌行压缩为紧凑一行（顶部控制条之下），并与下方导航行同缩进（8px），标志与名称和新会话／插件图标对齐；
- 「新会话」从凸起按钮改为扁平导航行；全局面板行同规格；
- 项目分组与会话行使用宿主类名压缩到 30/28px，时间戳与图标降噪；
- 底部账号行压到 30px（宿主默认 44px）、圆角 8px，并与窗口底边留 8px（`--ccd-sidebar-bottom-padding`），hover 背景不再贴住窗口边缘；分隔线保留在行上方；
- 账号菜单按参考图展开成卡片：236px 宽、账号名作为页眉、28px 行高、末组上方一条细分隔线；菜单条目仍是 DSH 自己的三条（设置／意见反馈／退出登录），插件不增删条目；参考图的 272×208 是六条目 + 双行页眉的尺寸，DSH 只有三条且账号行没有工作区文案，因此取更窄的行高节奏而不是照抄外框；
- 「新会话」「插件」「自动化任务」三行共用 `--ccd-nav-gap`（2px）节奏，hover 背景等距。

未做：参考图的 Home/Code 分段控件、Routines/Customize/More 导航行没有对应的 DSH 能力，按约束不制作空按钮；DSH 的品牌行与「插件」面板行保留在原位。

## new-session

入口：`src/client/features/new-session/index.ts` + `new-session.css`。

- `hero` phase 的问候块从居中改为绝对定位到内容列顶部（与 Composer 列左对齐）；
- 工作区／模式选择行与输入面板左边缘对齐：行内边距 = 侧向留白 + 4px，实测选择器左边缘在输入面板左边缘右侧 4px（与参考图一致）；
- Composer 区块用 `margin-top: auto` 推到底部；
- `--dsh-chat-content-width` 与 `--dsh-composer-card-max-width` 设为 770px，输入卡片据此居中；
- 参考图 `docs/reference/ccd-new-session.png` 实测（窗口原点 x=112/y=76 @2x）：输入框 y=795..836、x=431..1187（770×41）；实现实测 y=792..833、x=431..1201，误差 ≤3px；
- 控制行在输入框下方 4px，行内元素中心与参考图一致（参考图 y≈851.8，实现 852）。

## conversation

入口：`src/client/features/conversation/index.ts` + `conversation.css`，共用几何在 `src/client/theme/composer.css`。

- 卡片外壳透明化，边框与圆角移到输入面板（`.yhfFVG_scroll`），控制行留在面板下方 4px 处——参考图同样是「有边框的输入面板 + 面板外的控制行」；
- 输入面板最小高度 42px，随内容增长；控制行 28px；输入框底边到窗口底边合计 38px（参考图 34.5px）；
- 发送／停止按钮移进输入面板第一行右侧（24px、透明底、8px 圆角，与同排控件同形；生成中保留宿主的停止方块图标），输入文本为其预留 30px；
- `↵` 用 `--ccd-icon-return` 遮罩绘制而不是文字字符：字符会跟着字体基线走（实测偏右 1.5px、偏上 2px），遮罩在 24px 按钮里几何居中（实测停止方块偏移 0/0，`↵` 偏移 -0.5/0）；
- 「+」命令按钮去掉宿主的圆形底色，改为 28px 无底色图标；
- 三个读数与同排控件同形：高度 28px、圆角 8px（等于宿主的 `--dsw-radius-sm`），与模型／权限选择器、`+` 按钮完全一致；选择「和模型／权限选择器统一」而不是保留宿主胶囊形，是因为同一排里的可点控件应当属于同一族；
- 会话用量与上下文占用（`conversation.composer.dock` + `ContextMeter`）不再单独占一行：dock 是卡片的兄弟节点，因此绝对定位到控制行上、**模型选择之前**（偏移量由 `--ccd-trailing-width` 实时测得，见 `compat/stats-values.ts`）；每个读数只保留「图标 + 一个数字」——速率 `210 tok/s`、用量 `117M tok`、上下文 `19%`，点击仍打开原有详情面板；
- 正文列宽 770px；用户消息气泡底色、圆角、内边距按参考图调整；
- 工具行、推理行、代码块的文字颜色降噪；
- 顶栏合成一行：`.ST7X_W_titleRow` 与 `.ST7X_W_titleCluster` 用 `display: contents` 溶解（不搬动任何宿主节点），再靠 flex `order` 把 DSH 自己的视图切换器排到 Agent 预设芯片之后、工具图标之前；宿主为第二行预留的 `min-height: 76px` 随之去掉，会话页顶栏由 76px 收到 49px，空白会话仍保持原来的 40px；
- 溶解掉的那一行原本还承担「让开 macOS 窗口按钮」的留白（`padding-inline-start: max(0px, --dsh-frame-leading-clearance - 20px)`），这条留白改挂在该行的第一个子元素 `.ST7X_W_crumbs` 上：收起侧栏时 `--dsh-frame-leading-clearance` 会跳到 160px（全屏 84px），标题因此仍然从 160px 开始，不会滑到红绿灯下面；
- 视图切换器（对话／轨迹）改成参考图的分段控件：宿主自己的 `role="tablist"` 与两个 `role="tab"` 按钮原样使用——角色、标签、点击处理、`aria-selected` 与「开发者工具关闭时隐藏轨迹」的过滤都还是宿主的，插件只画外壳：轨道 108×28、8px 圆角浅灰底，选中段是轨道 `::before` 的白色滑块（1px 边框 + 8px 圆角 + 细分阴影，与参考图同为「滑块铺满选中格」）；滑块位置由 `compat/view-switch.ts` 实测选中按钮后发布 `--ccd-view-x`／`--ccd-view-w`，切换时 180ms 平滑移动，`prefers-reduced-motion` 下不动画。

未做：参考图顶栏没有这组视图切换（CCD 只有标题 + 芯片 + 图标），本轮按用户要求把它并入顶栏而不是删除；DSH 的 `对话／轨迹` 原生功能因此完全保留。

## tool-calls

入口：`src/client/features/tool-calls/index.ts`，状态 `planned`，默认关闭。首版保留原生工具展示与展开交互。续做时用 `tool.call.toolview`，保留准备、执行、结果、失败、授权与子调用信息，不改工具生命周期。

## statistics

入口：`src/client/features/statistics/index.ts`，状态 `planned`，默认关闭。参考图的 Overview 卡片需要全局会话数、消息数、token 总量、活跃天、峰值时段与热力图。DSH `0.2.0-rc.2` 没有可聚合这些数字的全局用量接口：会话级用量只存在于当前会话的 `conversation.composer.dock`（`ui-chat` StatsPills），跨会话统计需要新增 Host 路由。因此首版不放统计区，也不使用示例数字。续做时先确定 Host 数据边界，再扩展 Host 层。

## 交付与验证工具

`scripts/` 下有三个**不随包发布**的验证工具，用于真实 Desktop 校准：

- `desktop-probe.mjs`：通过渲染进程的 CDP 端点执行表达式、截图、抓取 DOM 结构与控制台；
- `desktop-responsive.mjs`：在一次连接内按多组窗口尺寸渲染、量测并截图；
- `desktop-preview.mjs`：把源码样式表临时注入真实渲染进程，用于插件尚未安装时的视觉校准，`clear` 或刷新即撤销；
- `web-harness.mjs` / `dom-outline.mjs`：在工作区内的沙箱 DSH profile 上做快速迭代。

新增功能后请更新本文件与 [验证记录](VERIFICATION.md)。待处理事项见 [TECH_DEBT.md](TECH_DEBT.md)。
