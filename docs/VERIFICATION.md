# 验证记录

更新日期：2026-10-03。本文件保留当前验证结论与证据位置，源码检查、夹具和真实运行分开记录。已被后续修复取代的详细记录保存在 Git 提交 `ec55195` 中，可执行 `git show ec55195:docs/VERIFICATION.md` 查看。

## 当前全部改动提交前检查（2026-10-03）

用户要求一并提交当前工作区全部改动。提交前 `npm run check` 完整通过：类型、架构与文档链接、133 项测试、构建、70 文件的包检查；`git diff --check` 通过。本轮只复核本地检查，真实 CLI／Web 与 Desktop 验证范围仍以上述各项记录为准，未重新安装日常 profile，未发布 npm 包。生成目录、安装包与本地验收材料依照忽略规则保留。

## npm 发布准备与首次安装自动开启（2026-10-03）

**范围。** 用户要求先准备发布，另一个 agent 同时修 bug。本轮只改包声明、锁文件、安装 bundle、安装默认值测试与相关文档，不改运行时源码、不改日常 desktop profile、不公开发布。候选包来自当时共享工作区，正式发布前须等待其他修复完成并重验最终产物。

**行为。** `cordis.patch.yml` 的安装条目设置 `enabled: true`，首次加载自动开启；Host schema 和未加载配置的客户端兜底保留 false。已有用户层 `enabled: false`、loader `disabled: true` 以及颜色、模块配置仍优先。包声明移除 `private: true`、补齐公开元信息并固定 npm 发布源。README 的 npm/官方页入口标为发布后可用，市场入口标为待收录。新增 `tests/install-default.test.ts` 用 YAML 读取实际 bundle，经 SDK reactive cells 的 `get()` 模拟设置传输后验证自动启用、默认模块与显式关闭配置。

**本地检查。** `npm run pack:local --cache .cache/npm` 的 prepack 完整通过：类型、架构、文档链接、133 项测试、构建、包检查；70 文件，126.4 kB（450.6 kB 解包），无字体、源码、截图或开发资源。锁文件通过离线 `--package-lock-only --ignore-scripts` 更新，未重新安装共享工作区的 node_modules。候选包 `artifacts/install.release-prep.wQWae4/dsh-ccd-style-0.1.0.tgz`，SHA-256 `c46a90df41c70ec54b5623acc0783492a1a2c17c9980cd4824f746e9c0f25c16`。

**真实 CLI 配置组合。** 使用本机 DSH `0.2.0-rc.2` 自带 CLI、新建隔离 `DSH_HOME=.cache/verify/home-install-default.In0wME` 的 Web profile。正式安装 tarball 后 dependencies/bundles 注册正确，`--dump-config` 的安装条目为 `enabled: true`；保存 `enabled: false`、canvas `#aabbcc`、sidebar feature false 后重装，用户 patch 逐字节未变且三项选择都保持；loader 的显式停用优先；正式 remove 后依赖与 bundle 均移除。脚本 `.verify/release-prep-install.mjs`，汇总证据 `output/playwright/release-prep/report.json`。pnpm 的 peers 检查提示 profile 层缺 Cordis peer；内置官方插件也声明同一 peer，实际 Cordis 由宿主提供，以下真实宿主启动与浏览器运行成功，不向插件打入私有副本。

**真实 Web 运行。** 重新安装同一个候选包并清空用户覆盖，通过正式 `dsh web --no-open --port 19643` 启动，Playwright CLI 的独立 release-prep 浏览器访问官方客户端。首次页面自动出现根标记 `data-dsh-ccd-style=true`，12 张插件样式，配置页总开关为 checked；无需手工启用。点击总开关关闭后根标记移除，只剩配置页的 1 张样式；重载后仍关闭，配置页仍可访问；重新打开后恢复根标记与 12 张样式。浏览器 console errors 0。只跳过新 profile 的 API Key 提示，未配置密钥、未发送消息。浏览器和服务器已关闭，插件已从隔离 profile 移除；候选包与证据保留。

**未完成的发布验收。** 真实 Electron 窗口、官方插件页按 npm 包名安装、npm 下载与市场收录尚未验证。本机 `npm whoami --registry=https://registry.npmjs.org/` 返回 `ENEEDAUTH`；用户须在正式发布前登录 npm。已准备不等于已发布，后续流程见 [发布说明](RELEASE.md)。

## 鲸鱼不再遮住 effort 弹窗（2026-10-03）

用户截图反馈：新会话页上点开 effort 弹窗后，输入卡右上角的像素鲸鱼压在弹窗右上角，盖住「Smarter」。

**根因（安装包只读核对＋运行实测）。** effort 弹窗是 `.ccd-effort`（`position: fixed; z-index: 1000`），渲染在 `conversation.input.model` 槽里，也就是 Composer 的工具行。宿主给那一行写了 `container-type: inline-size`（安装包 `app.asar` 内 `.yhfFVG_row` 的规则体与 npm 固定包 `uV2eYG_row` 逐字相同，只有构建前缀不同）；size containment 隐含 layout containment，这一行因此是 stacking context，弹窗的 `z-index` 被夹在行内，低于帧级 `shell.overlay` 的 `_6Qf49G_overlayLayer`（`z-index: 20`）——鲸鱼的座位正画在那个浮层里。实测：座位 `1118,717 32×24`、弹窗 `937.5,667.4 220×111.6`，两者相交，鲸鱼落在 `Smarter` 一端，与用户截图同一处。

**修法（一条让位规则，不动宿主层序）。** `features/composer-pet/pet.css` 增加 `html[data-dsh-ccd-style="true"]:has(.ccd-effort) .ccd-pet-blank-seat { display: none; }`：弹窗是一时的表面，鲸鱼是装饰，装饰让位，关闭弹窗时由 `:has()` 自动解除。没有改宿主的 `z-index`，也没有把弹窗 portal 出工具行——那会让 `.ccd-model-controls` 祖先链上的墨色守卫（见下面「模型名与 effort 的选值墨色」）失效。

**本地检查。** 改动是纯 CSS，按同尺寸截图验收，没有新增重复断言。当前共享工作区的提交前完整 `npm run check` 已通过：类型、架构与颜色归属、文档链接、133 项测试、构建、70 文件的包检查；其中包含发布准备新增的安装默认值测试。

**真实运行（隔离 Web profile）。** `.cache/verify/home-pet`（由 `home-web` 复制，`DSH_HOME` 指向它、`dsh web --no-open --port 19642`，DSH `0.2.0-rc.2`，插件经正式 CLI 从 `artifacts/install.pet-effort2/dsh-ccd-style-0.1.0.tgz` 安装，安装副本 `lib/client.js` 与工作区构建逐字节一致（SHA-256 `3228500782a6e5a60f676a95654ad3e6902c80138d19ab5fbb6cd409c0769067`）；Playwright Chromium 1280×820 @2x，脚本 `.verify/pet-effort-overlap.mjs`，**0 pageerror**）。同一页上做对照：注入一层可关闭的 `!important` 样式把座位强制显示＝改前，关掉＝改后，两半共享其余每一个像素。10 项判定全部 true：

| 判定 | 实测 |
| --- | --- |
| 改前鲸鱼与弹窗相交 | 座位 `1118,717 32×24` × 弹窗 `937.5,667.4 220×111.6` 相交，座位落在弹窗右半边（`Smarter` 一端） |
| 根因：座位所在浮层 | `_6Qf49G_overlayLayer`，`z-index: 20`、`pointer-events: none` |
| 根因：弹窗被 containment 夹住 | 最近的容器祖先 `yhfFVG_row`，`container-type: inline-size` |
| 改后让位 | 座位 `display: none`、盒归零 |
| 弹窗不受影响 | 几何逐项与改前相同，拖动条值／等级名／`Faster`・`Smarter` 两端标签都在 |
| 关窗恢复 | 座位回到 `1118,717 32×24`、`display: block`，与改前同一角落 |
| 再开一次 | 仍然让位 |
| 控制台 | 0 pageerror |

证据：`output/playwright/pet-effort-final/`（`before-band.png`＝改前鲸鱼压住 `Smarter`、`after-band.png`＝改后弹窗完整，另有 `restored-band.png`、`closed-band.png`、两张整窗图与 `report.json`）；对照图 `docs/verification/local/pet-effort/compare-pet-effort.png`（同尺寸 2×，上=改前／下=改后）。

**安装。** 用户选择立即生效：`artifacts/install.pet-effort2/dsh-ccd-style-0.1.0.tgz`（2026-10-03 16:00 打包，70 文件，就是本轮真实运行验证的那份构建）由正式 CLI 装入 desktop profile，配置备份 `.ccd-style-backup.AfkT5u/`；安装副本 `lib/client.js` 的 SHA-256 与工作区构建一致（`3228500782…`）、含本轮的让位规则，profile 的用户层配置与 `dshmarket` 等其他 bundles 未动。装的是本轮验证过的快照：另一个会话随后落的安装默认值（`cordis.patch.yml` 的 `enabled: true`）与发布准备不在这份构建里，也不影响既有的 profile 用户层。

**尚未做真实 Electron 窗口验证。** 桌面端要 ⌘R（或重启）才会加载这份构建：核对新会话页上打开 effort 弹窗时鲸鱼不在、关掉弹窗后鲸鱼回到卡片右上角同一角落。

## 「回到底部」控件移到中间并缩小（2026-10-03）

用户反馈：正文末尾那个「跳到最下方消息」的箭头和输入框小鲸鱼挤在同一个角上；要求像 Claude 那样改到中间，仍是圆形但小一点。

**宿主事实（只读核对安装包）。** 那个控件不是插件的，是 `@deepseek-ai/dsh-client-ui-chat` 的 `ChatView` 在读者离开正文末尾时渲染的 `toBottomSlot`／`toBottom`（`ChatView.module.css`，`0.2.0-rc.2`）：槽是零高度 flex 行、`justify-content: flex-end` 并带一段 `padding-right` 内容沟槽，按钮 34×34、`border-radius: 100px`、靠自己的 `margin-top: -34px` 顶到那一行上。输入卡右上角正好是鲸鱼座位，两者因此重叠——隔离运行实测改前按钮 `(1127.5, 691, 34×34)` 与鲸鱼 `(1117.5, 717, 32×24)` 相交。

**实现（只改展示几何）。** `features/conversation/conversation.css` 把槽改成 `justify-content: center`、去掉 `padding-right`，按钮盒改成新 token `--ccd-to-bottom-size`（22px），负边距跟着盒走，所以「按钮下沿到输入卡上沿」这条宿主自己的 16px 间距逐像素不变。按钮本体、chevron、`aria-label`、回调与浮层表面都仍是宿主的；两个类名登记进 `compat/host-dom.ts`（`HOST.chatViewToBottomSlot`／`HOST.chatViewToBottom`）。尺寸依据是用户给的 Claude 参考图：同一个控件实测 40×44 设备像素 @2x（约 21px），宿主是 34px。

**本地检查。** `npm run check` 全绿：类型、架构与颜色归属、131 项测试、构建、包内容 70 文件（比上一轮少 1 个声明文件，来自同工作区另一个会话正在进行的 composer-pet 重构，与本轮无关）。

**真实运行（隔离 Web profile，两趟）。** `.cache/verify/home-arrow`（由 `home-web` 复制，`DSH_HOME` 指向它、`dsh web --no-open --port 19631`（第二趟 19632），DSH `0.2.0-rc.2`，插件经正式 CLI 从 `artifacts/install.toBottom/dsh-ccd-style-0.1.0.tgz` 安装；Playwright Chromium 1280×820 @2x，脚本 `.verify/to-bottom-placement.mjs`，两趟都是 **0 pageerror**）。隔离 profile 的会话都短于视口，所以用页内夹具把正文撑长，再用真实滚轮手势离开末尾让控件出现；样式表、状态机与按钮都是真实实现。改前的对照是把宿主的两条原值用一层可关闭的 `!important` 样式加回同一个页面，两半共享其余每一个像素。

第一趟（15:06，构建 sha256 `6276c682…`，也就是用户截图时的那份代码，鲸鱼在场）11 项判定全部 true：

| 判定 | 实测 |
| --- | --- |
| 22×22 圆形 | `22×22`、`border-radius: 100px` |
| 水平居中 | 按钮中心 776.5 ＝ 正文列中心 ＝ 输入卡中心 776.5（滚动视口中心 779，差的 2.5px 是宿主自己的滚动条沟槽） |
| 不再压住鲸鱼 | 改后按钮 `(765.5, 703, 22×22)` 与鲸鱼 `(1117.5, 717, 32×24)` 不相交；改前两者相交 |
| 宿主间距不变 | 按钮下沿到输入卡上沿改前改后都是 16px |
| 本体仍是宿主样式 | 背景 `rgb(255,255,255)`、阴影、圆角与 `aria-label`「回到底部」逐项与改前一致 |
| 回调仍在 | 点按钮后正文回到最下方（scrollTop 525 ＝ range 525），控件自己消失 |

第二趟（15:46，当时工作区的构建 sha256 `b4647adb…`，安装副本与该构建逐字节一致）复核产物：几何逐项与第一趟相同（按钮 `(765.5, 703, 22×22)`、按钮／正文列／输入卡中心同为 776.5、点击回到最下方、0 pageerror）；两项与鲸鱼相关的判定记为 `null` 而非通过——同工作区另一个会话正在重构 composer-pet，这份构建里卡片内鲸鱼座位暂时不渲染，脚本因此拒绝把「不相交」当成结论。

对照图：`docs/verification/local/to-bottom/compare-to-bottom.png`（同尺寸 2×，上=改后／下=改前）与放大图 `button-zoom.png`；两趟的原始证据分别在 `output/playwright/to-bottom-placement/` 与 `output/playwright/to-bottom-placement-final/`（各含 `report.json` 与截图）。

**尚未做真实 Electron 窗口验证。** 以上结论来自隔离 Web 客户端（与桌面同一套 bundle）。桌面端要等重启加载新构建后按同尺寸截图核对：正文往上滚时控件出现在正文列中间、比原来小一圈，鲸鱼独占卡片右上角。本轮结束时用户已在自己的窗口里看到该改动生效。

## 新会话条目按第一次发送出现（2026-10-03）

用户反馈：点「新会话」后左侧立刻多出一条「新会话」条目，不需要；只显示新会话页即可，真正输入并聊天时再出现条目。实现是**展示过滤**，不是延迟建会话：DSH 在点「新会话」时就已经建好 Session（并在下一次点击时复用它），宿主自己用 `blank` 字段表达「已创建、还没有内容」——`@deepseek-ai/dsh-api-session-controller` 的 `SessionSummary.blank` 文档写明「New Session reuses a blank one targeting the same workspace. Filtering stays with the consumer」，宿主浏览器只显示当前选中的那一条 blank。插件把**所有** blank 根会话挡在列表外，第一次消息落盘时宿主清掉 `blank`，条目自己出现。之所以不改成"点了先不建会话"：无会话的新建页在固定版本里是 inert Composer（`InputBar` 用 `sessionId !== void 0` 守卫草稿编辑器，卡片变成工作区选择触发器，占位文案 `hero.chooseWorkspace`），先不建会话就没法直接打字发送。

**实现。** 新增 `src/client/compat/blank-session-rows.ts`：`blankSessionIds()` 从宿主会话列表快照里取 `blank === true` 且没有 `parentId` 的根会话（fork 落地前的临时 blank 不算新会话占位）；`mountBlankSessionRows()` 给宿主自己的 `[data-row-key^="session:"]` 行打 `data-ccd-blank-session`，由会话列表订阅与文档 childList 观察（先判断变更是否落在 `[data-slot="sidebar.workspaces"]` 内，聊天页流式输出不触发列表读取）驱动同步，释放时摘标记、退订、断开观察。`features/sidebar/sidebar.css` 只隐藏带标记的行。宿主事实经 `HostServices.blankSessions`（`compat/adapter.ts` 从 `ctx.sessions.list` 构造，成员缺失时为 null → 保留原生条目）交给 feature。**一处激活期修复**：Cordis 的上下文代理对未在 `inject` 里声明的服务会抛 `cannot get property "sessions" without inject`，所以 `apply.ts` 的 `inject` 补上 `sessions`（它本来就是 `uiWorkspace` 的前置）；补上之前隔离实例报 `dsh-ccd-style: failed`。

**本地检查。** `npm run check` 全绿：类型、架构与颜色归属、130 项测试（本轮新增 10 项 `tests/blank-session-rows.test.ts`：行键解析、blank 根会话判定、fork 子会话豁免、标记双向跟随、观察器只对浏览器区域内的变更读列表、死节点不再跟踪、释放清标记与两条信号、数据源抛错只上报、订阅失败时把已开的观察器一并关掉），构建，包内容 72 文件。`scripts/check-package.mjs` 的打包夹具新增一段：顶层提供 `sessions`（含一条 `blank` 会话）、文档返回两条 `data-row-key` 行，开启 sidebar 后 blank 行被打标记、真实行不动、样式表 +2，关掉后标记被摘掉；夹具同时断言观察器开关配平。

**真实运行（隔离 Web profile）。** `.cache/verify/home-web`（`dsh --profile web`，DSH `0.2.0-rc.2`，插件经正式 CLI 从 `artifacts/install.blank-rows3/dsh-ccd-style-0.1.0.tgz` 安装，Playwright Chromium 1382×875 @2x，脚本 `.verify/blank-session-row.mjs`，**0 pageerror**）。11 项判定全部 true：

| 场景 | 结果 |
| --- | --- |
| 点「新会话」 | 会话页进入 `data-phase="hero"`；该行被打标记且 `display:none`（高 0），可见行数 5 → 5（不新增条目） |
| 再点一次「新会话」 | 宿主复用同一条 blank 会话，隐藏行仍是同一条，可见行数仍 5 |
| 去掉根属性（原生对照） | 同一条行恢复可见（高 32、原生行高），可见行数 5 → 6 —— 行仍在宿主列表里，插件只改展示 |
| 在新建页发送第一条消息 | 宿主清掉 `blank`，标记消失、标题变成消息生成的标题，条目自己出现（该行由隐藏转可见） |
| 发送后再点「新会话」 | 新建一条 blank 会话并同样隐藏（隐藏行 id 与上一条不同） |

一条读法上的注意：宿主的浏览器自己会给每个分组截断行数并把多出来的放进 `overflow:` 行，所以"条目出现"这条判定看的是**那条临时行本身由隐藏转可见、且不再带标记**，不是总可见行数加一（分组满员时它会把另一行换进 overflow，原生行为，与本插件无关）。

证据：`output/playwright/blank-session-row/` 的 `report.json` 与五张截图；并排对照在 `docs/verification/local/blank-session-row/compare-sidebar.png`（1 点新会话无条目／2 首次发送后出现／3 关掉插件的原生列表）。

**安装。** `artifacts/install.blank-rows3/dsh-ccd-style-0.1.0.tgz`（2026-10-03 14:18，72 文件）由正式 CLI 装入 desktop profile：profile `dependencies` 指向该 tarball、`dsh.profile.bundles` 含 `dsh-ccd-style`，安装副本 `lib/client.js` 的 SHA-256 与工作区 `lib/client.js` 一致（`4988f807…`）；profile 配置备份在 `.ccd-style-backup.Dzgt9M/`。

**尚未做真实 Electron 窗口验证。** 以上结论来自本地检查与隔离 Web 客户端；桌面端要等重启加载新构建后按同尺寸截图核对（重点：点「新会话」后侧栏不出现条目、发送后条目带生成标题出现、再点「新会话」不累积）。

## 输入框小鲸鱼（2026-10-03）

工作区里那只半成品鲸鱼（feature 没接线、`npm run typecheck` 在 `SlotPet.tsx` 上报 TS2339）由本轮接手完成：`composer-pet` 接进配置开关与 apply 装配点，补上两个颜色 token，两个座位都落到宿主的真实插槽上。

**座位与几何。** 聊天页注册进卡片自己的 `conversation.input.overlay`（list／session）；新建页没有 Session，固定版本的 `InputBar` 用 `sessionId !== void 0` 守着那个槽（npm 固定包 `lib/client.js:17450` 与安装包里的同一处），所以那一页由帧级 `shell.overlay` 承担，位置来自 `compat/pet-anchor.ts` 对 `.ST7X_W_root[data-phase="hero"] [data-composer-card]` 的量测。锚点在卡片里发现 `[data-ccd-pet-session]` 时发布 null，因此一页只有一只鲸鱼。腹部基线落在卡片顶边这条几何不是猜的：宿主自己的锚点规则是 `.yhfFVG_overlayAnchor{height:0;position:absolute;inset:0 0 auto}`（安装包 `app.asar` 内读出），与 npm 固定包里同一条规则的规则体逐字一致（只有类名前缀不同），所以 `.ccd-pet-seat` 的 `bottom: 0` 正好是卡片顶边。

**本地检查。** `npm run check` 全绿：类型、架构与颜色归属、116 项测试（新增 7 项）、构建、包内容 71 文件。新增的 `tests/composer-pet.test.ts` 覆盖状态映射、无障碍名随语言、锚点在卡片缺位／未布局／页面隐藏／已有会话座位四种情况下都不发布位置、卡片移动与替换后跟随、释放后观察器与窗口／文档监听全部关闭且不再发布，以及「量测盒 = 样式表画的盒」这条尺寸契约。`scripts/check-package.mjs` 的打包夹具新增一段：`composer-pet` 关闭时不注册任何座位；开启后两个座位各注册一次、会话键随插槽字符串下发、锚点观察文档、关闭后座位与作用域一起归零，且文档监听的开闭计数相等。

**预览页视觉验收**（同尺寸 1374×871、2× 截图，证据在 `docs/verification/local/composer-pet/`）：实测卡片右缘 1204、顶边 792，鲸鱼盒 32×24 落在 `left = 1204 - 44 = 1160`、`top = 792 - 24 = 768`；浅色 `#4d6bfe`、深色 `#7b93ff`。`hero-light.png`／`chat-light.png`／`hero-dark.png` 三张对照，`poke.png` 是点击后 120ms 的状态（`data-ccd-pet-state` 读作 `poke`，720ms 后回到 `idle`），`plugin-off.png` 是关掉插件后的同一个角（没有鲸鱼）。

这一轮同时修掉两个只有渲染才会暴露的问题：宠物规则原来用裸类名，被宿主侧通用的按钮规则（预览页的仿真宿主与真宿主同一写法）盖掉颜色，现在整表挂在 `html[data-dsh-ccd-style="true"]` 下；预览页原来把组件直接挂在锚点上，少了真机插槽渲染出的 `.ccd-pet-seat` 座位，鲸鱼落到了卡片左上，现在补出同一个座位再挂真组件。

**第二轮：按用户截图反馈收三处（同一轮内完成）。** 用户指出眼睛应该在尾部（与官方鲸鱼一致）、当前鲸鱼太大（要按 Claude 参考窗口的比例）、以及**卡片上方有任务条或其他条目时干脆不显示**。

- 眼睛回到尾部（`M17 11H19V12H20V14H18V13H17Z`，闭眼线同位），也就是最初那版画法的位置；头仍是左端钝头。
- 尺寸从 64×48 收到 **32×24**（网格 1:1，Retina 上一格两个设备像素，仍是整设备像素对齐），量测常量、样式表三个盒子与 `Whale.tsx` 的 `width`／`height` 同步改小，`tests/composer-pet.test.ts` 里那条「量测盒 = 样式表画的盒」契约继续把关。参考窗口里 Claude 的角色约 28×21 CSS px，32×24 与之同量级。
- 新增 `pet.css` 规则：`.ST7X_W_composerStack:has(> :not(.bocITq_root):not(.ST7X_W_heroWorkspaceRow):not(.yhfFVG_root) ~ .yhfFVG_root) .ccd-pet-seat { display: none }`。读作「卡片之前还有一个既不是问候块、也不是工作区芯片行、也不是卡片自己的子元素」——也就是宿主自己的 dock 条目（待办面板、排队消息）或别的插件放进来的行；挂在卡片**之后**的统计卡片不在判据里，不会误伤。三个类名都在 `compat/host-dom.ts` 登记过，并在安装包 `app.asar` 里逐个核对（`.bocITq_root`、`.ST7X_W_heroWorkspaceRow`、`.ST7X_W_composerStack`、`.yhfFVG_root`）。
- 预览页实测：同一个角在聊天页与新建页都是 32×24 @ `1160,768`；插进一条模拟的「任务 1 进行中 · 7 待处理」dock 行后 `display` 变 `none`（`getBoundingClientRect` 归零），移除后恢复；证据 `dock-row-hidden.png`。三张对照图与 `plugin-off.png` 已按新尺寸重拍。

**第三轮：点击动作改成喷水、排队消息不再被压（用户反馈，同一轮内完成）。**

- 用户指出点击后的挤压／弹跳不对味，要经典鲸鱼喷水。状态从 `poke` 改名 `spout`：`Whale.tsx` 增加一组画在背上的喷口、水柱与三颗水滴（新 token `--ccd-pet-spray`，浅色 `#8fb4ff`、深色 `#a8c3ff`），平时 `opacity: 0`，点击时跑 700ms 的 `ccd-pet-spout`（六步 `steps()`：升起 → 散开 → 落回），身体不再变形、眼睛保持睁开；组件计时器同步改成 700ms。预览页实测点击后 `data-ccd-pet-state` 读作 `spout`、700ms 后回到 `idle`，峰值帧证据 `spout.png`。
- 用户报告排队等待发送的消息仍被鲸鱼压住。查安装包确认：那条气泡不是 Composer 的 dock 行，而是正文末尾的回显用户气泡（`PendingSubmissionBubble` → `UserStyleBubble`，`data-submission-echo`；转向中是 `data-pending-steering`），所以上一条基于 Composer 栈结构的规则覆盖不到它。新增一条按这两个宿主属性判断的规则（卡片内座位与帧级座位都管），属性消失即恢复；预览页实测插入一条 `data-submission-echo` 气泡后 `display` 从 `block` 变 `none`，证据 `queued-echo-hidden.png`。

**安装（第二轮之后）。** `artifacts/install.4Ordxe/dsh-ccd-style-0.1.0.tgz` 由正式 CLI 装入 desktop profile（配置备份 `.ccd-style-backup.6RC1fo/`），装的是**含另一个会话「临时新会话行」改动与 `apply.ts` 的 `sessions` 声明**的那一版；那次安装修掉了 `dsh-ccd-style: cannot get property "sessions" without inject`（见下）。第三轮的喷水与排队规则写在此之后，需要再装一次才进 profile。

**第四轮：用户给参考动画，水花重做（同一轮内完成）。** 用户发来一只会喷水的像素鲸鱼 GIF（47 帧、约 3.9s，150×150、深色底）并说「看一下这个参考」——上一版那根细水柱「几乎看不出来，不好看」。

- 逐帧拆参考动画：水花是**悬在头上的一团白云**，先冒头、长大成一片带尖刺的浪冠（峰值时宽约鲸身宽度的 55%），再炸成十几个分离的水滴、铺成一片弧形散开、最后消失；整段约 1.2s，鲸鱼本体一直在游动。据此把水花从「细柱＋圆盖」改成**六张整帧像素图**（冒头／长大／浪冠／炸开／散开／落回），全部锚在头顶（`x` 对称于 5.5，底边贴住背部），900ms 走完，`step-end` 关键帧让任一时刻只有一张在屏。
- 颜色换成一对新的 azure（`--ccd-pet-spray` 浅色 `#2b96f0`／深色 `#74bcff`，浪尖的泡沫 `--ccd-pet-spray-light` `#6fbaff`／`#a9d4ff`）：上一版的 `#8fb4ff` 在白卡上太浅，是「看不出来」的主因。参考里的水花是纯白，白卡上无法用，所以取「比鲸鱼更亮的蓝」这条路，并保留泡沫色让浪冠不至于是块实心色。
- 画布从 32×24 长到 **32×32**（上面 8 行是水花空域），`PET_HEADROOM` 与 `PET_BOX`、`Whale.tsx` 的 `viewBox`／`width`／`height`、`pet.css` 三个盒子同步改；鲸鱼本体的 24 行没动，腹部基线仍在卡片顶边。
- 新增契约测试三条：图形网格 = 量测盒（`viewBox="0 -8 32 32"`）、六帧每一张都有对应的样式表动画且时长 = `SPOUT_MS`、六帧的可见区间首尾相接铺满 0–100%（既不重叠也不留缝）。连点会重放水花（`Whale` 用 `seq` 重挂载）。
- 逐帧验收：把动画 `animation-delay` 设成负值并 `paused` 定格在 70/210/390/570/710/840ms 六个时刻截图（同尺寸、2×），实测六帧依次出现、时刻与关键帧一致，900ms 后 `data-ccd-pet-state` 回到 `idle`；当时的证据图 `splash-frames.png` 与旧的 `spout.png`（细柱版）都在第五轮随功能一起删除。
- **预览页的变化：** 本轮进行期间，工作区里的 `showcase/` 静态预览页与 `scripts/build-showcase.mjs`（以及 `package.json` 的 `build:showcase`）被另一个会话从工作区移除了。为了不与其冲突，本轮改用 `/tmp` 下的最小仿真外壳截图：同一份插件样式表与真组件（`tokens.css`＋`pet.css`＋`ComposerPet`，esbuild 打包），宿主骨架只保留鲸鱼依赖的那几个类名与 `.yhfFVG_overlayAnchor{height:0;position:absolute;inset:0 0 auto}`。截图里的卡片外壳因此比真机简化，鲸鱼的位置、尺寸、颜色与六帧动画不受影响。

**第五轮：用户决定撤掉点击反应（同一轮内完成）。** 第四轮的水花交付后用户回复「算了，一点都不好看，直接删了吧，点击没效果就行了」——三版点击反应（挤压／弹跳 → 像素水柱 → 参考动画的六帧水花）都不合意，最终**整个撤掉**，鲸鱼回到纯装饰。

- 删除的范围：`Whale.tsx` 里的整组水花图形与 8 行空域（画布回到 32×24、`viewBox="0 0 32 24"`，鲸鱼本体的坐标一个没动）；`pet.css` 的六帧规则、六段关键帧、泡沫色与 `prefers-reduced-motion` 里的静态浪冠；组件里的点击处理、`spouting` 状态、`seq` 重挂载与 900ms 计时器；`PET_HEADROOM` 与 `--ccd-pet-spray`／`--ccd-pet-spray-light` 两个 token（`theme/tokens.css` 回到只有鲸鱼的两色）。
- 同时收掉随点击一起存在的接线：`ComposerPet` 从 `<button>` 变成 `aria-hidden="true"` 的 `<span>`（没有动作的按钮对读屏是假承诺），座位与图形都不接指针事件，`compat/pet-labels.ts`（无障碍名）连同它的语言测试一起删除，插槽面从 `{ useRunning, label, sessionKey }` 收成 `{ useRunning }`，`BlankPetFace` 只剩 `useAnchor`。`petState()` 也回到两个状态。
- **行为验收（仿真外壳，2×）**：座位与图形实测都是 32×24、`viewBox="0 0 32 24"`、`pointer-events: none`；鲸鱼中心点的 `elementFromPoint` 命中 `.ST7X_W_scrollBody`（即正文），说明那个角落的按下会像鲸鱼不存在一样落到下面，不会触发卡片的「未选工作区即点开选择器」；真实点击后 `data-ccd-pet-state` 仍是 `idle`、组件 DOM 逐字节未变、页面里 `[class*="spout"]` 节点数为 0。
- 契约测试换掉三条喷水帧测试，新增一条「装饰契约」：组件必须 `aria-hidden`、不得出现 `onClick`／`onPointerDown`／`setTimeout`／`SPOUT`，图形与样式表里不得再出现 `ccd-pet-spout`，样式表不得出现 `pointer-events: auto`／`cursor: pointer`；`check:package` 的夹具改成断言宠物面**只有** `useRunning` 一个键（反应状态、计时器或文案再溜回来都会失败）。
- 本地检查：`npm run check` 全绿——131 项测试（较上轮 −2）、架构与颜色归属、构建、包内容 71 文件（少了 `pet-labels` 的声明文件）。旧的两张水花证据图已删除，`docs/verification/local/composer-pet/` 回到座位、尺寸、收起行为那几张。

**安装（第五轮）。** `artifacts/install.SIi9CH/dsh-ccd-style-0.1.0.tgz` 由正式 CLI 装入 desktop profile（配置备份 `.ccd-style-backup.5BtC56/`），装的就是撤掉反应后的这一版：安装副本与仓库构建逐字节一致（`lib/client.js` sha256 `6276c682…`），安装包里 `ccd-pet-spout` 与 `pet-spray` 的命中数都是 0，`inject` 仍是 `["slots", "theme", "uiWorkspace", "configForms", "sessions"]`。第三、四轮那两次安装（`artifacts/install.MPSD9V/`、`artifacts/install.bDc2vk/`）保留未删。

**第六轮：宠物改成只在新会话页出现（用户纠正，同一轮内完成）。** 用户说「claude 的机制是只有新会话会展示宠物，一旦开始聊天，宠物就会消失」——此前插件是反的：聊天页用卡片内座位（`conversation.input.overlay`）显示鲸鱼，新会话页用帧级座位，一页一只但**每个对话里都有**。

- 先把宿主的判据读出来（npm 固定包 `@deepseek-ai/dsh-client-ui-conversation/lib/client.js`）：`const hero = sessionId === void 0 || shellPhase === "blank" && (openState === "open" || summaryBlank === true); const phase = settling ? "settling" : hero ? "hero" : "active"`。也就是 `data-phase="hero"` = 「还没有会话，或会话一条消息都没发过」，第一条消息落盘即变 `active`。锚点的选择器本来就是 `.ST7X_W_root[data-phase="hero"] [data-composer-card]`，所以**只要删掉卡片内那个座位，闸门就已经成立**——不需要新增判据，也不会自己发明"什么算新会话"。
- 删掉卡片内座位：`SlotPet.tsx`、`mount.ts` 里对 `conversation.input.overlay` 的注册、`DSH_SLOTS.composerOverlay` 这个名字，以及随之而来的会话读取（`sessions` 注入、`sessionRunning`、`useRunning` 面）。`SlotPet.tsx` 改名 `BlankPet.tsx`，只留帧级座位；`mountComposerPet` 的注入从 `['slots', 'sessions']` 收成 `['slots']`。
- 于是 `state.ts`（`petState`／`sessionRunning`）与"工作中"姿态成了死代码：新会话页没有会话可读，永远只有待机。整块删掉，连同 `data-ccd-pet-state` 属性、`ccd-pet-swim` 关键帧与 `.ccd-composer-pet[data-ccd-pet-state="working"]` 两条规则；`ComposerPet` 不再接 props，组件里唯一的 state 是"页面是否隐藏"。锚点里"卡片已带会话座位就发布 null"的守卫也一并删除（那个座位不存在了）。
- 两条收起规则改挂在文档根上：座位现在画在帧级浮层里、**不是** `.ST7X_W_composerStack` 的后代，原来的后代选择器永远匹配不到（实测确实是 `display: block`）。改成 `html[...]:has(.ST7X_W_composerStack > :not(...) ~ .yhfFVG_root) .ccd-pet-blank-seat`，与排队气泡那条同一写法。
- **行为验收（仿真外壳，2×；锚点用的是仓库里的真模块，宿主 DOM 用真类名与 `data-composer-card`）**：`data-phase="hero"` 时座位存在且落在卡片顶边右角（实测 `left 792 / top 489`、32×24）；把根节点改成 `data-phase="active"`（即一个正常对话）后座位**消失**，切回 `hero` 又回来；卡片上方插一行 → `display: none`；插入 `data-submission-echo` 气泡 → `display: none`。截图证据：`hero-light.png`、`hero-dark.png`（新会话页有宠物）、`chat-no-whale.png`（普通对话页没有）、`dock-row-hidden.png`、`queued-echo-hidden.png`，以及把它们拼成一行的 `states.png`；旧的 `chat-light.png`（鲸鱼在对话页）已删除。
- 契约测试：删掉状态映射两条，新增两条闸门契约——锚点选择器必须含 `[data-phase="hero"]`；`mount.ts` 的代码（去掉注释后）不得出现 `input.overlay`／`composerOverlay`／`SlotPet`、必须注册 `shell.overlay` 且受 `features['new-session']` 管，`DSH_SLOTS` 里不再有那个名字。`check:package` 夹具改成"只有一个帧级座位"，宠物面只剩 `useAnchor` 一个键。
- 本地检查：`npm run check` 全绿——131 项测试、架构与颜色归属、构建、包内容 70 文件。

**安装（第六轮）。** `artifacts/install.K7ITth/dsh-ccd-style-0.1.0.tgz` 由正式 CLI 装入 desktop profile（配置备份 `.ccd-style-backup.ExWELo/`），安装副本与仓库构建逐字节一致（`lib/client.js` sha256 `a7db644b…`）。安装包里 `ccd-pet-seat` 与 `ccd-pet-spout` 的命中数都是 0、`ccd-pet-blank-seat` 2 处，`conversation.input.overlay` 只剩 `mount.ts` 注释里那一句「为什么没有卡片内座位」；`inject` 仍是 `["slots", "theme", "uiWorkspace", "configForms", "sessions"]`（宠物自己只用 `slots`，其余是别的 feature 的）。

**一次激活期故障（并发改动，已修）。** 工作区里另一个会话在 `compat/adapter.ts` 里从 `ctx.sessions` 构造端口，但当时 `apply.ts` 的 `inject` 没声明 `sessions`：Cordis 的上下文代理对未声明的服务直接抛错（`cannot get property "sessions" without inject`），而这次读取发生在 `createHostServices`（在挂载的 try/catch 之外），于是整个条目失效、界面回到原生。修法是 `inject` 补上 `sessions`（`uiWorkspace` 本来就需要它）。为了这类错误不再以「整个插件消失」的形式出现，`scripts/check-package.mjs` 的夹具改成按 Cordis 的契约解析服务：根上下文只提供 `inject` 里声明过的服务，读到未声明的服务直接让 `check:package` 失败。把 `sessions` 从声明里去掉做过变异验证：夹具报 `the plugin reads ctx.sessions but does not declare it in inject`。

**尚未做真实 DSH 运行验证。** 桌面应用当时正在运行但没有开调试端口（`127.0.0.1:9222` 无 CDP 目标），本轮没有重启它，所以以上结论来自本地检查、固定版本宿主源码只读核对与仿真外壳（2×，锚点用真模块）截图。需要用户 ⌘R 后核对三件事：**新会话页上鲸鱼是否落在卡片顶边右角**；**给一个新会话发出第一条消息后鲸鱼是否整块消失**（判据是宿主的 `data-phase`，仿真外壳只重放了属性切换，真机才是完整路径）；以及新会话页上卡片上方多一行或出现排队气泡时是否收起。顺带确认点击鲸鱼所在的角落时界面没有任何变化、也不会误开工作区选择器。

## 侧栏按参考图收敛（2026-10-03）

用户给出一张左右并排的截图：左侧是 CCD 参考窗口，右侧是本插件的 DSH 侧栏（截到侧栏右缘的 1px 分隔线，右侧被压在另一个窗口的阴影下）。两窗口在同一张图里、比例相同，用插件自己已知的三个值反推比例——开关 `left:88px` + `28px` 盒 → 图标中心 102px、侧栏内边距 10px、导航行高 30px——三者都落在 2 截图像素／逻辑像素上，因此所有实测值（截图像素 ÷ 2）都与插件的 CSS 数字直接可比。左窗口左边被裁掉约 2px、右缘被遮挡，绝对值有 ±1~2px 误差，行高、行距、字号这类间隔量不受影响。

实测对照（逻辑 px）：

| 部位 | 参考 | 改前 | 改后 |
| --- | --- | --- | --- |
| 导航行高／行间距 | 26／0.5 | 30／2 | 26／1 |
| 导航行圆角 | ≈8 | 10 | 8 |
| 三行块总高 | 79 | 94 | 80 |
| 非当前行墨色 | `#4a4a47` | `#1f1f1d` | `--ccd-text-nav` |
| 当前行底色 | `#eeeeec` | 与悬停同为 `#f0f0ee` | `--ccd-selected`（悬停仍 `#f0f0ee`） |
| 三颗导航图标 | 13／15／13 | 13／15／13 | 13／13／11（面板行统一 14px 盒） |
| 项目行高／标签左缘 | 34~35／14 | 30／40.5 | 34／14 |
| 项目行悬停 | 无灰底 | `--ccd-selected` 灰底 | 无灰底，标签升到 `--ccd-text` |
| 项目行行尾 | 常驻「＋」 | 悬停才出现 | 常驻「＋」与「…」 |
| 折叠箭头 | 1px 线条 `>` | 实心三角 | 线条箭头（`--ccd-icon-chevron-right`，宿主 `IconChevronRightOutlineArtwork` 几何） |
| 会话行前导标记 | 5.5px 浅色圆点 | 14px 活动环（12px 实墨） | 8px 环（6px 实墨） |
| 会话行标签左缘 | 38 | 38.5 | 38.5（16px 槽不变） |
| 标题行 | 无标题、无这排按钮 | 「工作区」+ 三颗图标 | 去标题，三颗图标（加号／竖排滑块／搜索） |

两处从截图里读出来、值得记下的事实：**新会话行那块灰底是悬停态**，不是「当前页」标记——宿主的 `.newSession` 只有 `:hover`，没有 active 类，所以「当前行底色」这条落在宿主自己会标记的 `panelActive` 面板行上；**会话行前导那颗不是静态圆点**，是 `data-state="ongoing"` 的活动环（`.spinner`，14px 盒、24 viewBox 里 r=9.5 的两个圆），缩到 8px 后实墨约 6px；静态状态点 `.dot` 是 10px 槽 + `::after` inset 20% 的 6px 实心核心，本来就与参考同量级，未改。

**用户发现的一个回归（同一轮内修掉）**：「…」按钮原本按参考只做常驻的「＋」，把溢出触发留在悬停里；结果是点开菜单、指针移向弹层时行失去悬停 → 触发按钮被 `display:none` 摘掉 → 宿主「指针已离开触发器」立即关掉菜单（`Menu` 的 `closeOnPointerLeave` 只在触发器和列表**都在**时才靠 grace 撑过间隙）。两处收尾：项目行不再铺灰底（悬停改为标签升到 `--ccd-text`，只有宿主自己的「菜单已打开」锚点底色保留），行尾两个按钮都常驻。宿主源码只读核对见 `ui-primitives` 的 `Menu` 文档注释与 `ui-workspace` 的 `ProjectRowItem` 结构。

实现落在 `src/client/features/sidebar/sidebar.css`，新增三个 token（`--ccd-text-nav` 深浅各一、`--ccd-icon-plus`、`--ccd-icon-chevron-right`，两个图形取自 DSH 的 `IconPlusOutlineArtwork`／`IconChevronRightOutlineArtwork`，MIT）；`--ccd-nav-row-height` 与 `--ccd-nav-gap` 随之改为 26px／1px。项目行的「文字在前、箭头在后、行尾按钮贴右」用 flex `order` 完成，没有改宿主 DOM；箭头的线条化是把宿主自己的线条箭头画回它的标记槽（宿主 `arrowOpen` 仍驱动那一次旋转，`prefers-reduced-motion` 下不转），视图选项的竖排滑块是把宿主自己的图形旋转 90°，都没有重画。项目行的 4px 内边距保留 `--dsh-workspace-indent`，分组视图的层级不丢。

本地检查：`npm run check` 全绿（typecheck／架构与颜色归属／109 项测试／构建／包内容 64 文件）。安装：正式 CLI 将 `artifacts/install.6I2w1y/dsh-ccd-style-0.1.0.tgz`（2026-10-03 13:22，含灰底、箭头与常驻三处收尾改动）装入 desktop profile，安装副本 `lib/client.js` 已确认含新增规则、且不再含「悬停才显示行尾按钮」那条规则；profile 配置备份在 `.ccd-style-backup.fbrDId/`。

**尚未做真实 DSH 运行验证**：以上结论来自本地检查、宿主 `0.2.0-rc.2` 的 DOM/CSS/JSX 只读核对与截图实测，没有在运行中的 Electron 里复验渲染结果，需要用户 ⌘R 后按同尺寸截图对照（尤其是图标尺寸、箭头位置与行尾加号三项）。

## 统计卡片：悬浮提示、Models 视图与范围切换（2026-10-03）

在已接入的真实数据通路之上补齐参考卡片剩下的三个交互。参考实现从 Claude Desktop bundle 逐段核出（`cc70f2bdf-oAbIMYEh.js`），几何用两张 @2x 截图实测，两者都记在 [统计卡片调研](STATS_RESEARCH.md) 第十二节。

**真实语料**（隔离 home `.cache/verify/home-stats`，59 会话只读副本，`dsh --profile web`，Playwright Chromium 1382×875 @2x，脚本 `/tmp/ccd-probe/probe-v2.mjs`）：

| 场景 | 结果 |
| --- | --- |
| 卡片出现 | 712 ms；读数与上一轮逐项一致：会话 55／消息 136／1.1B token／活跃 4 天／峰值 12 AM／`opencode-go/deepseek-v4.1-flash` |
| 分段控件 | 20px 高、圆角 4、13px/500；`Overview*／Models`、`All*／30d／7d`，激活底色 `rgb(230,230,230)` |
| 热力图提示 | 悬停 10 月 3 日那格（29 次）→ `Oct 3 — 29`；84.5×24、`rgb(12,12,12)`、圆角 6、锚点上方 3.5px、水平居中偏差 1.5px、溢出卡片（与参考同行为） |
| Models 视图 | 160px 图表、4 根柱（Sep 30–Oct 3）、柱宽 71.8 = 天列 99.7 的 72%、模型 1/2 配色 `rgb(73,130,223)`／`rgb(103,151,228)`、y 刻度 `0/200M/400M/600M`、x 标签 4/4 可见 |
| 图表提示 | 悬停 Oct 3 → 加粗日期 + `opencode-go/deepseek-v4.1-flash: 210.2M`，上方 3px、居中偏差 0.6px |
| 图例 | 2 行、行高 15、8px 色块、`30.8M in · 4.2M out`／`1.1M in · 45.3k out`、`99.2%`／`0.8%` |
| 范围切换 | 三档互斥激活并重画卡片；本语料活动全在 7 天内，读数不变（范围过滤另用合成快照验证） |
| 控制台 | 0 pageerror |

**范围过滤与标签抽稀**（合成快照经 `page.route` 喂给真实客户端代码，脚本 `/tmp/ccd-probe/probe-synth.mjs`）：合成库为 139 天里 44 个活跃日、3 个模型、1.327 亿 token，期望值用独立循环算出。

| 范围 | 统计格（会话／消息／token／活跃天） | 图表天数 | x 标签 | 图例百分比 |
| --- | --- | --- | --- | --- |
| All | 9／270／132.7M／44 | 44（期望 44）✓ | 9/44（抽稀） | 47.8／32.5／19.6 ✓ |
| 30d | 9／138／64.5M／22 | 22（期望 22）✓ | 11/22 | 49.5／32.4／18.1 ✓ |
| 7d | 9／44／20.9M／7 | 7（期望 7）✓ | 7/7 | 54.7／29.8／15.6 ✓ |

热力图在三档范围下逐格不变（参考行为），y 轴刻度随范围重算（`0/2M/4M/6M` → `0/1M…5M`），图表提示按模型分行，控制台 0 pageerror。

**宿主侧的额外发现**：web profile 的 `dsh-session-query-sqlite` 是 `path: ':memory:', openAt: never`，`sessionQuery.listSessions()` 只列出宿主登记过的会话——手工放进 `sessions/<项目目录>/` 的合成日志（命名、v4 头、锁文件都与真实会话一致，Node 侧解压校验通过）不会被列出。因此"用合成语料驱动 host 聚合"这条验证路线不可行；host 的范围口径由 41 项单元测试覆盖（`tests/stats-{unit,aggregate,view}.test.ts`），端到端范围行为由上面的路由拦截验证。

本地检查：`npm run check` 全绿（typecheck／架构与颜色归属／109 项测试／构建／包内容 64 文件）。验证过程中同一工作区还有另一条工作流在写 `showcase/`（`tsconfig.json` 已把 `showcase/**` 纳入 include），它的 WIP 一度让仓库级 `typecheck` 失败；本轮先用 `.cache/tsconfig.scope.json` 限定 `src/`＋`tests/` 验证自己的作用域，对方修好后仓库级检查已恢复全绿，双方文件互不覆盖。证据：`docs/verification/local/stats-card/stats-v2-*.png`（该目录按惯例不进 Git）。

## 输入框像素鲸鱼调研（2026-10-03，尚未实现）

本轮只调研开源实现与接入方案，见 [宠物调研](PET_RESEARCH.md)。解析用户参考 GIF（434×298、67 帧、5.11 秒）并抽帧观察点击后的姿态变化；只读检查本地 DSH `0.2.0-rc.2` 的插槽声明与 Composer 渲染代码，确认 `conversation.input.overlay` 是 session 级 list 插槽，锚点位于输入卡顶边；没有 Session 时宿主不渲染此插槽，因此新建页需要单独适配。宠物未接入、未安装、未进行真实 DSH 运行验收；本轮没有改动运行时代码。

本地文档检查：`npm run check:architecture`（含本地链接）与 `git diff --check` 通过；未运行完整测试或构建。

## 统计卡片接入真实数据（2026-10-03）

Host 半注册 `ccdUsage` 投影单元折叠会话日志，浏览器半读 `/api/ccd-stats`。语料用用户真实会话库的**只读副本**（59 个会话、26 MB `session.jsonl.zstd`）＋其 `session_projcache` 检查点副本，隔离 home `.cache/verify/home-stats`（`dsh --profile web`，与桌面同一套 bundle），Playwright Chromium 1382×875 @2x，脚本 `/tmp/ccd-probe/probe-final.mjs`、`probe-cold.mjs`。

| 场景 | 结果 |
| --- | --- |
| 冷启动第一响应（清空全部 `ccdUsage` 行后） | **40 ms** 返回 `{sessions: 0, pending: 59}`；请求不被折叠阻塞 |
| 冷折完成 | **1 s 内** 59/59 会话折完并写回检查点，卡片 **1.4 s** 出现 |
| 热启动 | 首响应即有数，卡片 **0.6 s** 出现；路由 30 ms 内应答 |
| 读数稳定 | 会话 55／提示 136／token 1.070B／活跃 4 天／峰值 12 AM／最爱模型 `opencode-go/deepseek-v4.1-flash`，重复轮询逐项一致 |
| 独立核对 | 直接汇总 59 条写回的 `ccdUsage` 检查点：55 个工作会话、136 提示、1,070,017,050 token —— 与路由输出逐项吻合 |
| 卡片几何（真实数据下） | 480×299、左上 (446,114)、问候块下缘 94 → 间距 20、圆角 8、`rgb(240,240,240)`、`8px 12px 12px`、182 格（1–4 档各 1 格） |
| 存活会话读取 | 侧栏打开一个既有会话（它随即成为 live，走 `sessionProjections.snapshot`），路由读数与打开前逐项一致、`missed` 保持 0；离开 hero 页时卡片随阶段卸载（`card: false`） |
| 控制台 | 0 pageerror |

排查中确认的三处宿主事实（细节见 [DSH 兼容边界](DSH_COMPATIBILITY.md#统计卡片的数据通道2026-10-03)）：插件配置是带 `get()` 的响应式 cell（直接读字段会拿到对象，门控静默失效）；`apply` 执行时 `sessionProjections` 与 `connection` 尚未就绪，需 `ctx.inject` 等待；浏览器半的 `ctx.sessions` 是 `dsh-api-session-controller` 的 client store，导入 host 的 `dsh-session` 类型会把它改错（`npm run typecheck` 抓到，已在 `model-controls/mount.ts` 用结构化声明修正）。

本地检查：`npm run check` 全绿（typecheck／架构与颜色归属／93 项测试／构建／包内容 63 文件）。证据：`docs/verification/local/stats-card/stats-data-{cold,warm}.png` 与 `stats-data-card-{cold,warm}.png`（该目录按惯例不进 Git）。边界：隔离 Web profile 的只读副本，不是真实 Electron 窗口；本轮未在桌面端实跑（需要重启 DSH 才加载新构建）。

## 四列以上的表格超出 Composer 宽度（2026-10-03，已修）

用户截图（2515×1667，按 1.79 设备像素/逻辑像素反算＝1293×833 逻辑窗口、默认 280px 侧栏）反映：拖动侧边栏时正文跟着缩、拖回后表格右缘超出居中的 Composer。逐列像素量与真实运行都指向**宿主自己的宽表格加宽**，与拖动无关。

机制（DSH `0.2.0-rc.2`，`app.asar` 内两个模块）：渲染器（`dsh-client-ui-primitives`）给**四列及以上**的 Markdown 表格加 `md-table-wide`（`ui-chat` 的 `AssistantMarkdown.module.css`）：

```css
.gKv1-q_body .md-table-wide {
  --dsh-table-spare: max(0px, calc((100cqw - var(--dsh-chat-content-width)) / 2));
  --dsh-table-lead: calc(var(--dsh-table-spare) + min(var(--dsh-chat-content-width), 100cqw) - 100%);
  width: calc(100% + var(--dsh-table-lead) + var(--dsh-table-spare));
  max-width: none; margin-left: calc(-1 * var(--dsh-table-lead)); padding-left: var(--dsh-table-lead);
}
```

包装层因此被撑到滚动视口的整个内容宽度，左边用负外边距＋等量左内边距把表格左缘钉回正文列。宿主本意是让「内容确实装不下」的宽表格借用左右余量（原生下表格是 `width: max-content`，短表不会借用）。插件把表格改成 `width: 100%`（与宿主 `.tableScroll table{width:max-content}` 冲突且特异度更高），于是**每一张四列以上的表格都被撑满加宽后的包装层**。

修法（`features/conversation/conversation.css`，只加一条守卫规则，不动宿主的 `overflow-x` 与滚动条槽）：把该包装层收回正文列——`width: 100%`、`max-width: 100%`、`margin-left: 0`、`padding-left: 0`。表格于是与正文列同宽、和 Composer 左右缘对齐；列的下限都放不进的表格仍用宿主自己的 `md-table-wide` 悬停横向滚动。

隔离 `.cache/verify/home-web` 官方 Web 客户端（`dsh web`，插件经 `file:` 挂载仓库，DSH `0.2.0-rc.2`，Playwright Chromium 1293×833 @2x，脚本 `.verify/table-wide-bleed.mjs`，**0 pageerror**）用宿主原版 `MarkdownText` 渲染三张表（短四列表、用户截图那张长四列表、8 列表），只改侧栏轨道宽度；同一构建用 `--legacy` 把宿主的加宽逐字节加回页面作为对照：

| 侧栏 | 100cqw | 正文列＝Composer | 短四列／长四列（修前） | 短四列／长四列（修后） | 8 列（修前／修后） |
| --- | --- | --- | --- | --- | --- |
| 240 | 982 | 770 | 876（+106） | **770（±0）** | 962（+192） |
| 280（默认，＝用户截图） | 942 | 770 | 856（+86） | **770（±0）** | 962（+192） |
| 380 | 842 | 770 | 806（+36） | **770（±0）** | 962（+192） |
| 520 | 702 | 702 | 702（−16） | 702（−16） | 962（+244） |
| 拖回 280 | 942 | 770 | 856（+86） | **770（±0）** | 962（+192） |

括号内是「表格右缘超出 Composer 右缘」的像素数。修前表格宽 = 770 + `spare`（`spare = (100cqw − 770) / 2`），短表与长表完全相同，说明宽度来自 `width: 100%` 而不是内容；修后两张四列表恒为 770，与 Composer 逐项对齐，五种侧栏宽度下都是 0 超出。8 列表在任何状态下都放不进 770（宿主每格 `min-width: 100px`，8×120＝960），修后它被包装层按列右缘裁住、`scrollWidth − clientWidth` 实测 **192px**，`overflow-x` 停在宿主的 `hidden → 悬停 scroll`（悬停实测 `scroll`，滚动可达），与原生同一套兜底。拖回后几何逐项复现，**没有残留状态**（侧栏拖动只改 `100cqw`；宿主那套 `--dsh-chat-user-width`／`--dsh-conversation-column-width` 由 ResizeObserver 写内联样式，但插件的 `--dsh-chat-content-width: 770px` 固定在 `.ST7X_W_body` 上，实测为该值，宿主那条 `clamp(680px, 64%, 920px)` 不生效）。插件关闭的对照（两阶段一致）：正文列 680、Composer 712，短的四列表 **512**（不借用，右缘在 Composer 内 184px），长的四列表 913（`max-content`，超出 Composer **217px**），8 列 1040——即加宽本身是宿主行为，插件让它对每张四列表都发生。

用户截图像素复核：表格 1532px／1.790 ＝ **856** 逻辑、Composer 1379px／1.790 ＝ **770**，与上表 280 侧栏一档（修前）逐项吻合（表格左缘与列左缘重合＝`lead` 左内边距）。

本地检查：`npm test` 68 项、`npm run build`、`npm run check:package` 54 文件通过；`npm run check:architecture` 在本轮**工作区**上失败于并行改动（`README.md` 尾随空格与指向已被删除的 `assets/new-session-light.png` 的链接），与本次改动无关，未处理。改动是纯 CSS，按同尺寸截图验收，不新增重复断言。

复验脚本 `.verify/table-wide-bleed.mjs`；证据 `output/playwright/table-wide-bleed/before|after/` 的 `report.json`、`baseline.png`、标注版 `baseline-annotated.png`（红＝Composer 右缘、蓝＝四列表右缘：修前 1168／1254，修后两条线重合）、`sidebar-240/380/520.png`、`restored.png`、`native-restored.png`、`overflow-hover.png`。边界：隔离 Web profile 的夹具，不是真实 Electron 窗口。本轮按用户决定**没有打包、也没有装入 Desktop profile**（工作区还有并行进行的字体／主题等改动），修复暂留在工作区；桌面端要看到效果需在改动落定后重新打包安装并 ⌘R。

## 模型名与 effort 的选值墨色（2026-10-03）

用户反馈模型菜单里的字「灰蒙蒙的，加粗也没用」，确认后要求改成纯黑、并把相应字重去掉。

原因不是配色值而是级联：`theme/composer.css` 的 `html[data-dsh-ccd-style="true"] .yhfFVG_row button`（特异度 0-2-2）把工具行里每个按钮都刷成 `--ccd-text-secondary`，而模型控件与它的浮层恰好都是这一行的后代（浮层是 `.ccd-model-controls` 的 fixed 子元素），于是 `.ccd-model-trigger`（0-1-0）与 `.ccd-model-options button`（0-1-1）的 `color` 全部输给这条规则——菜单里的模型名和两个触发器因此都是次级灰，加粗只改字重、改不了颜色。改动前的探针实测：三处都是 `rgb(111,111,106)`（模型名 500 字重、两个触发器 600 字重），同行的原生按钮也由这条规则上色。

改动：`theme/tokens.css` 新增成对的 `--ccd-text-strong`（浅 `#000000`／深 `#ffffff`）——不复用 `--ccd-text`，也不由配置表面派生，所以自成一段而不进两个配色块；`features/model-controls/controls.css` 用 0-3-2／0-3-1 的守卫规则把墨色写到行规则之上，并去掉两个触发器的 `--ccd-font-weight-strong`；`features/model-controls/ModelControls.tsx` 的模型名元素从 `<strong>` 改成 `<span class="ccd-model-name">`（强调由墨色承担，元素不再声称强调）；`theme/composer.css` 里原生触发器的两个 span 同样改取 `--ccd-text-strong`、不再加粗，同一个座位无论谁渲染都一致。provider 分组标题仍是有意保留的 `--ccd-text-secondary`。

本地检查：`npm run check` 通过——类型、架构、68 项行为测试、构建、54 文件包检查。

真实运行在隔离 `.cache/verify/home-ink`（由 `.cache/verify/home-web` 复制，`file:` 指向仓库、正式插件加载）的官方 Web 客户端，DSH `0.2.0-rc.2`，Playwright Chromium 1280×820 @2x，脚本 `.verify/model-panel-ink.mjs`，**0 pageerror**。同一页读计算样式与胜出的规则：

| 探针 | 改动前 | 改动后 | 改动后胜出规则 |
| --- | --- | --- | --- |
| 菜单里的模型名 | `rgb(111,111,106)`／500 | **`rgb(0,0,0)`／400** | `.ccd-model-controls .ccd-model-options button`（0-3-2） |
| 模型触发器 | `rgb(111,111,106)`／600 | **`rgb(0,0,0)`／400** | `.ccd-model-controls .ccd-model-trigger`（0-3-1） |
| effort 触发器 | `rgb(111,111,106)`／600 | **`rgb(0,0,0)`／400** | `.ccd-model-controls .ccd-effort-trigger`（0-3-1） |
| provider 分组标题 | `rgb(111,111,106)` | `rgb(111,111,106)`（有意保留） | `.ccd-model-provider` |
| 行内相邻的原生按钮 | `rgb(111,111,106)` | `rgb(111,111,106)`（无回归） | `.yhfFVG_row button` |
| 深色（同一 DOM 置 `body[data-ds-dark-theme]`） | — | 模型名与两个触发器 `rgb(255,255,255)` | 同上的深色声明 |

浮层几何不变（240px 宽、同一锚点）；模型项改用 span 后点击链仍通：点已选中的那一项仍走官方 select 并关闭菜单（`labelBefore`／`labelAfter` 都是 `DeepSeek-V41-Flash`，`menuClosed` true）。

证据：`output/playwright/model-panel-ink/` 的 `before/`（改动前）与 `after/model-panel.png` 加两份 `report.json`；复验脚本 `.verify/model-panel-ink.mjs`（自带 before／after 记录、深色探针与点击校验）。`.verify/effort-lifecycle.mjs` 里按名字点选模型项的选择器随标记改成 `.ccd-model-name`。

边界：只在隔离 Web profile 复验，**没有在真实 Electron 窗口重装复验**；`.verify/effort-lifecycle.mjs` 本轮没有整脚本重跑（它测 effort 生命周期，不是这次样式），只单独验证了改用 span 后的点选与关闭。`--ccd-text-strong` 与 `--ccd-text` 一样不由配置画布派生，因此「浅色方案 + 用户配了很深的画布」时纯黑字同样会失去对比度——与既有的「文字与强调色不可配」是同一处边界（见 [待办](TECH_DEBT.md)）。

## 界面字体栈以 Geist 打头（2026-10-03）

确认参考字体 Anthropic Sans／Serif 不能分发之后（字体里只有 `Copyright 2025 Anthropic PBC`、没有许可字段，本机那两份来自第三方 GitHub 副本），改用一支可再分发的近似字体：Geist 是 Anthropic Sans 的上游设计（`Anthropic Sans` 的字体厂商字段为 `BSPK x Geist x Anthropic`），以 SIL OFL 1.1 分发，允许随软件分发且要求随附许可。

改动：`theme/tokens.css` 的 `--ccd-font-fallback` 前加 `Geist`——它是默认栈的唯一来源，`theme/tokens.ts` 只在用户配置了族名时前置，不复制字体清单；新增 `assets/fonts/Geist-Variable.ttf`（上游 Geist v1.7.2 的 `Geist[wght].ttf` 逐字节副本，SHA-256 `cdcc4815cbf5f9882fa74e48f8ab410a0495781a58ff7316570f664e7e987753`，只改文件名）与 `assets/fonts/OFL.txt`（`c683bfbcc7e087f5d37a54ef628f10387c451a83ddc459b151403a164ac46c90`）；`install.md` 增加可选安装小节（校验和、已有 Geist 就整段跳过、不需要 sudo、回退命令）；README／AGENTS／IMPLEMENTATION／DSH_COMPATIBILITY 同步。**字体不进 npm 包**：`package.json` 的 `files` 白名单不含 `assets/`，`check:package` 仍是 54 文件，包体积不变。

本地检查：`npm run check` 通过——类型、架构、68 项行为测试、构建、54 文件包检查。

真实运行在隔离 `.cache/verify/home-web` 的官方 Web 客户端（DSH `0.2.0-rc.2`、`file:` 指向仓库、正式插件加载），Playwright Chromium 1280×900 @2x，脚本 `.verify/font-stack.mjs`，**0 pageerror**。探针继承 `body`（插件把 `var(--ccd-font-ui)` 写在 `html[data-dsh-ccd-style="true"] body` 上），实际使用的字体由 CDP `CSS.getPlatformFontsForNode` 读出：

| 探针 | 计算出的 font-family | 实际使用的字体 |
| --- | --- | --- |
| 西文，`var(--ccd-font-ui)` | `Geist, -apple-system, "system-ui", "SF Pro Text", …` | **Geist**（61/61 字形） |
| 中文，同一栈 | 同上 | **PingFang SC**（13/13 字形）——Geist 不含 CJK，按设计回落 |
| 仅尾部栈（未装 Geist 的机器看到的效果） | `-apple-system, "system-ui", "SF Pro Text", …` | `.SF NS`，与改动前的默认栈一致 |

本机 `~/Library/Fonts` 已有用户自行安装的 Geist 三支静态字重（`Geist-Regular/Medium/SemiBold.ttf`），所以"装了 Geist 就生效"这一半是在**真实系统字体**上测到的，不是注入的网页字体；`document.fonts.check('14px Geist')` 为 true。新会话页与聊天页同尺寸截图无异常。

边界与未验证：**没有在真实 Electron 窗口复验**（用户的运行窗口未重载，Desktop profile 也没有重装）。隔离 Web 实例里 Chromium 的 Local Font Access API 返回空清单（该实例没有应用主进程的权限处理器，见兼容说明），因此"配置页字体菜单里出现 Geist"要在桌面窗口重启后确认；字体栈按族名解析，不依赖这个菜单。未装 Geist 时的回落只在"仅尾部栈"探针上测量，没有在卸载系统字体的机器上复测。参考字体 Anthropic Sans／Serif 仍不随仓库分发，也不写进字体栈。

证据：`output/playwright/font-stack/` 的 `new-session.png`、`conversation.png` 与 `report.json`；复验脚本 `.verify/font-stack.mjs`；字体与许可见 `assets/fonts/`。

## 深色模式与配置页主题控件（2026-10-03）

按要求做深色。DSH 自己拥有 light／dark／system 偏好（`ThemeRuntime`），所以没有新建开关，只做两件事：把「为浅色画布挑的颜色」与深色解耦（成对下发 + 内置深色调色板），并按用户截图在配置页加一行「外观 → 主题」的三段控件，写同一条宿主偏好。

改动：`theme/tokens.css` 新增 `html[data-dsh-ccd-style="true"] body[data-ds-dark-theme]` 深色块（表面、线、文字、Markdown、diff、effort 参考字段与阴影），颜色字面量仍只在这一个文件里；`theme/palette.ts` 新增 `BUILT_IN_DARK` 与深色块逐字节对应；`theme/tokens.ts` 的每个条目改成 `{ light, dark }`——浅色侧是配置派生值（未配置时内置浅色），深色侧固定内置深色，字体两项两侧同值；`contracts/ports.ts` 新增 `ThemePreferencePort`，`compat/adapter.ts` 用 `getTheme`／`setTheme`／`theme/change` 构造它（缺成员时为 null，页面少一行而不是激活失败），`apply.ts` 把它交给配置页；配置页新增 `ThemeRow`（三格、16px 图标、箭头键在组内循环）与「外观」节标题，`settings.css` 的槽、分段与选中格全部用宿主 `--dsw-*` token，因为插件关闭时这页也要能读。

本地检查：`npm run check` 通过——类型、架构、68 项行为测试、构建、54 文件包检查。新增／改写断言：两套内置值必须与 stylesheet 逐字节一致、浅色块声明过的每个颜色变量都要有深色对应、深色正文与次级文字对画布的对比度 ≥7:1 与 ≥4.5:1、深色卡片比画布亮而侧栏比画布暗、配置色只影响浅色侧、字体两侧同值；`tests/theme-preference.test.ts` 覆盖偏好端口的读／写／订阅与「缺成员即降级」。

真实运行在隔离 `.cache/verify/home-web` 的官方 Web 客户端（DSH `0.2.0-rc.2`、`file:` 指向仓库、正式插件加载），Playwright Chromium 1280×900 @2x，脚本 `.verify/theme-dark.mjs`，**0 pageerror**：

| 检查 | 结果 |
| --- | --- |
| 控件几何 | 槽 92×32、圆角 9px，三格各 30×30；浅色实测槽 `rgb(243,243,242)`、选中格 `rgb(255,255,255)` + 边框 `rgb(235,235,233)`（参考图槽 #f3f3f3、选中格白底细边），深色槽 `rgb(31,30,29)`、选中格 `rgb(48,48,46)` + 边框 `rgb(52,52,49)`——两种配色里都是「凹槽 + 抬起的一格」；起始选择等于持久偏好 |
| 点「深色」 | `body[data-ds-dark-theme]` 出现；`--ccd-canvas` #262624、`--ccd-card` #30302e、`--ccd-sidebar` #1f1e1d、`--ccd-border` #3e3e3b；宿主三个被覆盖 token 同步为 #262624／#1f1e1d／#3e3e3b |
| 持久化 | profile `cordis.patch.yml` 的 `ui-theme.preference` 先变 `dark` 再回 `light`；插件自己的 `ui-skin-ccd-style` 条目逐字未改 |
| 键盘 | 选中格是组内唯一 tab stop，←／→ 移动选择并循环 |
| 配置色 | 浅色下配 `#303030` 后画布即 #303030，切深色仍是 #262624（配置色不进入深色） |
| system | `emulateMedia({colorScheme:'dark'})` 下选 system → 深色；媒体查询回到浅色 → 恢复 |
| 界面 | 新会话页画布 #262624、侧栏 #1f1e1d、Composer 卡片可见；聊天页用户气泡 #2f2f2d 与画布区分；effort 浮层 #2b2a28 底、深紫渐变字段与浅色滑钮 |
| 关闭界面 | 配置页仍在、主题行仍可切换；重开后回到浅色并保持 `enabled: true` |

证据：`output/playwright/theme-dark/` 的 `config-light.png`／`config-dark.png`／`config-light-again.png`／`config-off-dark.png`／`hero-light.png`／`hero-dark.png`／`chat-dark.png`／`effort-dark.png` 与 `report.json`（12 项判定全部 true）；复验脚本 `.verify/theme-dark.mjs`（固定本机浏览器路径与隔离 profile 的测试会话，不是可移植自动测试）。

**补充：背景色作用域的说明文字（用户要求）。** 两个背景色行下方加了一行灰色说明（`.ccd-settings-note`，走宿主 `--dsw-alias-label-caption`）：「自定义背景色只作用于浅色模式；深色模式使用内置深色调色板。」文案在 `features/settings/locales.ts` 的 `note.coloursApplyToLight`（zh／en 各一条），挂在两行之后而不是每行重复一次。隔离 Web 客户端实测（`.verify/config-colour-note.mjs`，0 pageerror）：说明只有 1 处、位于「外观」节内、在两行背景色之下，文案命中「只作用于浅色模式」「内置深色」，浅色墨色 `rgb(173,178,184)`、深色 `rgb(129,133,140)`（宿主 caption token 随配色翻转）。证据：`output/playwright/config-colour-note/` 的 `section-light.png`／`section-dark.png`／`config-light.png`／`config-dark.png` 与 `report.json`（4 项判定全部 true）。

补充交付：`artifacts/install-colour-note-20261003-003422/dsh-ccd-style-0.1.0.tgz`（54 文件，SHA-256 `2a2025a54a562614e4c472fc97a2c594120477bf58a14de9178618937dde3e0d`，包内与安装副本 `lib/client.js` `6d3a8f6cd4409792eb6e316012ae500beda08ba560702addabb93ba26aee8424`，等于当时的仓库构建；包内含说明文案）。安装前备份 `~/.dsh/profiles/desktop/.ccd-style-backup.SNrJhF/`；安装后用户 patch 逐字节未变（含 `enabled: true`、`debug: true`、`ui-theme.preference`），profile 依赖指向该 tarball。上一枚深色包 `install-dark-20261003-002252/` 保留作回退。

边界：本轮**没有在真实 Electron 窗口复验，也没有重装 Desktop profile**（已安装的是上一版构建，深色要装新包后 ⌘R 才生效）；隔离 profile 的会话是短会话，正文里的代码块／表格／行内代码只做了变量与对比度断言，没有逐张深色截图核对；effort 浮层的像素场只做了整体观感与取色核对。自定义背景色按设计只在浅色侧生效，按模式各配一套颜色尚未提供（见 [待办](TECH_DEBT.md)）。

交付：用户确认后已用正式 CLI 装入 Desktop profile。tarball 为 `artifacts/install-dark-20261003-002252/dsh-ccd-style-0.1.0.tgz`（54 文件，SHA-256 `1869cd9807238730576850b1a24b7e304b5ef3e99903009000f9baac8bfa3b2e`，包内 `lib/client.js` `c28e68225cbc18769902958aa8db97d17f076894ec1deae65560c0b0221d71f7`，含 3 处 `data-ds-dark-theme` 与 `ccd-settings-theme`）；安装副本的 `lib/client.js` 与仓库构建及包内逐字节一致（同哈希），profile 依赖指向该唯一路径，`dsh plugin --profile desktop list` 报 `dsh-ccd-style@0.1.0`。安装前配置备份在 `~/.dsh/profiles/desktop/.ccd-style-backup.4nkjHe/`（`package.json`／`cordis.patch.yml`／`pnpm-lock.yaml`）；安装前后用户 patch 的插件条目（`enabled: true`、`debug: true` 与字体、外观配置）逐字未动，唯一差异是 `ui-theme.preference` 在 00:25:32 由应用侧从 `system` 写成 `dark`（不是安装命令写的，也不影响插件条目）。桌面端按 ⌘R 重载后生效。注：打包时工作树里还有并行进行的「界面字体栈以 Geist 打头」与 `--ccd-text-strong` 改动（见本文件上一节），该包按当时的工作区状态构建，同时包含它们。

## 代码块改为带外框的白底卡片（2026-10-02）

按要求把助手正文代码块从宿主的偏蓝冷灰填充改成带外边框的白底卡片；参考截图里代码块量出 12 设备像素圆角（@2x），与表格卡片取同一条曲线。

改动：`src/client/features/conversation/conversation.css` 新增一组规则，锚点只用宿主稳定属性 `data-code-wrap` 与 `data-code-block-banner`（前者的类名里另有 `md-code-block`），不复制哈希类名；`src/client/theme/tokens.css` 新增 `--ccd-code-radius: 6px`，底色复用已有的 `--ccd-card`，没有新增颜色字面量。

**为什么四层都要重绘。** 夹具实测宿主对同一层冷灰上了四次色：外壳 `#f9fafb`／`16px` 圆角、语言横幅 `#f9fafb`、横幅外包裹层 `#fcfcfb`（回落到页面 token），以及 `pre` 自身 `#f9fafb` 且自带 `0 0 16px 16px` 圆角。只改其中一层会留下灰色带或方角，因此四层统一成纯白卡片＋透明内层。宿主自己的语言标签、换行与复制按钮、语法配色都不动。

本地检查：`npm run check` 通过——类型、架构、65 项行为测试、构建、54 文件包检查。

隔离 Web 运行验证：`dsh web`（插件经 `file:` 挂载本仓库）用宿主自己的 `MarkdownText` 渲染夹具，读四层的计算样式并截图。开启后外壳 `rgb(255,255,255)` ＋ `1px solid rgb(227,227,225)` ＋ `6px` 圆角，`pre` 与横幅透明、零圆角；移除根属性后逐项回到原生 `rgb(249,250,251)`／无边框／`16px`（`pre` 回到 `0 0 16px 16px`），随后属性恢复。控制台无页面错误。

证据：`output/playwright/code-block-card/` 的 `code-block-card.png`（插件）、`code-block-native.png`（原生对照）与 `measurements.json`；复验脚本 `.verify/code-block-card.mjs`（固定本机浏览器路径与隔离 profile 的测试会话，不是可移植自动测试）。

未验证：Electron 桌面窗口中的实际呈现——本轮未重装 Desktop profile；深色模式不在承诺范围内。

## 正文边缘渐隐与顶栏分隔线（2026-10-02）

按要求把对话正文的上下边缘做成宿主内部请求面板同款的淡出（用户截图箭头所指的上下两处），并去掉顶栏下缘的分隔线。

改动：新增 `src/client/compat/conversation-fade.ts`——`edgeFadeState()` 是纯函数，观察器在真正的滚动视口 `[data-conversation-scroll]` 上发布 `data-ccd-fade-top`／`data-ccd-fade-bottom`，并把「常驻 Composer 盖住视口多少」发布为页面主体上的 `--ccd-fade-bottom-inset`；`features/conversation/conversation.css` 用 `.ST7X_W_body` 的两个伪元素绘制 24px 渐变层，并把顶栏 `border-bottom-color` 画成透明（边框宽度保留，高度不变）；`theme/tokens.css` 新增 `--ccd-edge-fade: 24px`（与宿主 `fadeTop`／`fadeBottom` 同值）。

**运行中发现并修复的真实缺陷。** 第一版把 `mask-image` 加在滚动视口上，而常驻 Composer 正是该视口的子元素（吸附在视口底部的座位）：渐隐一打开，输入卡连同正文一起被擦掉——用户实测报告「一滚动，下方的聊天框等等内容就全没了」。改为画在正文之上、Composer（`z-index: 7`）与「回到底部」按钮（`z-index: 8`）之下的渐变层后，同一滚动状态实测 Composer 区域内墨量 1,291,239 对 1,289,221（**100.2%**，即完全不受影响）。结构事实记入 [兼容说明](DSH_COMPATIBILITY.md)。

本地检查：`npm run check` 通过——类型、架构、65 项行为测试、构建、54 文件包检查。新增 `tests/conversation-fade.test.ts` 覆盖：不可滚动时不淡任一侧、两端与中段的开关、回弹越界、亚像素范围、观察器属性过滤（不监听自己写的属性，避免自激）、换会话时迁移监听并清理旧元素、释放时断开观察器与监听并清空属性与属性值、观察器构造失败时只上报一次且不动正文。

隔离 `.cache/verify/home-web` 的官方 Web 客户端（DSH `0.2.0-rc.2`、正式插件加载），Playwright Chromium 1280×820 @2x，0 pageerror。隔离 profile 的会话都短于视口，因此用页内夹具把正文撑长；样式表、滚动视口、观察器与顶栏都是真实实现：

| 位置 | scrollTop | 上淡出 | 下淡出 | 渐变层透明度 | 下端点 |
| --- | --- | --- | --- | --- | --- |
| 末尾 | 1149 | 开 | 关 | 1／0 | 79px |
| 顶部 | 0 | 关 | 开 | 0／1 | 79px |
| 中段 | 400 | 开 | 开 | 1／1 | 79px |
| 末尾 | 1149 | 开 | 关 | 1／0 | 79px |

把一行正好压在边缘（行盒越过边缘 13px）后量边缘 12px 内的墨量：上边缘保留 **12.0%**。用纯色块直接量渐变本身：上边缘 24px 内亮度 251.7 → 64（画布 → 实心），下边缘 717 → 741 亮度 69.6 → 229.7，**端点正好落在 Composer 卡片顶边**（卡片白区自 742 起，seat 与卡片顶边实测同为 741）。顶栏分隔线在同尺寸 before／after 对照中消失，顶栏高度仍为 49px；Composer 区域在渐隐开着与关着时像素一致。

**第二个缺陷（用户实机截图的「任务／目标行」）：** 第一版把下方渐变层做成固定在 Composer 顶边下方的 24px 带。用户装了修复版后截图报告，输入卡上方一旦出现计划／任务行（`conversation.input.dock` 里的「任务 1 进行中 · 4 待处理」），正文就会从那一带的半透明表面后面透出来。根因是 Composer 的整片占位里只有顶边起 36px 由 seat 自己的渐变覆盖，卡片以上、任务行所在的区域是半透明的。改法：下方渐变层改为铺满 Composer 顶边以下的整片区域（`height: calc(--ccd-fade-bottom-inset + --ccd-edge-fade)`、`bottom: 0`），只在上沿保留 24px 渐变。该行是宿主 InputBar 的 **Todo dock**（官方说明：正文与 Composer 共享的 dock，Todo dock 在 composer 上方、行以 pending／ongoing／done 标记；同处还有 queue dock）——用户截图里的「任务 1 进行中 · 4 待处理」正是本会话 22:12 建立的 5 条 todo（1 进行中 + 4 待处理），因此在夹具里可以按真实尺寸重建：行高 **44 CSS px** 由用户 2x 截图量得（正文行间距 48px = 24px 行高 × 2，行本身 88px），表面半透明（0.72 白 + 1px 描边）。夹具注入 `conversation.input.dock` 后实测：seat 顶边 741→691、inset 79px→129px（跟随），渐变端点仍精确落在 691；行内文字上方的横条墨量 **49,456**（开着）对 **318,042**（关掉），行下方的横条两侧同为 49,384（残差是行自身的边框，没有正文鬼影）；另用一条等高的全透明占位行量最坏情况，整带墨量 26,347 对 1,651,578（**-98.4%**）。Composer 自身墨量仍 100.2% 不受影响。

**边界：** 本轮的运行验收在隔离 Web profile 的 Chromium 内完成，长会话由页内夹具充当；**没有在真实 Electron 窗口、也没有在 Desktop profile 的安装副本上复验**。用户 22:29 装的中间构建（`artifacts/install.zd2DVo/`）含上述第一个缺陷，22:44 装的第一版修复（`artifacts/install-fade-20261002-2241/`）含第二个缺陷，两者都已被下一节记录的包取代。

证据：`output/playwright/conversation-edge-fade/` 下的 `report.json`、`after-top.png`／`after-middle.png`／`after-bottom.png`、`before-*-cut.png` 与 `after-*-cut.png`、`before-seam.png`／`after-seam.png`、`before-*-band.png`／`after-*-band.png`、`composer-with-fade.png`／`composer-host-style.png`、`dock-with-fade.png`／`dock-host-style.png`、`ramp.png`；复验脚本 `.verify/conversation-edge-fade.mjs` 与像素分析 `.verify/conversation-edge-fade-ink.py`（固定本机浏览器路径与隔离 profile 的测试会话，不是可移植自动测试）。

交付：用户确认后按 [安装指南](../install.md) 打包并装入 Desktop profile。第一次交付 `artifacts/install-fade-20261002-2241/dsh-ccd-style-0.1.0.tgz`（54 文件，SHA-256 `f09f6d57…`，`lib/client.js` `3c367367…`），用户随即用实机截图报出「任务／目标行」缺陷，于是有第二次交付：**当前安装的是 `artifacts/install-fade2-20261002-2307/dsh-ccd-style-0.1.0.tgz`**（54 文件，SHA-256 `baffc77d507ee8f153c9ccfaf4eecf57b31a0bd75a233c70982f1c46b157843e`），包内、仓库构建与安装副本的 `lib/client.js` 逐字节一致（`850670e2c53f1376f5002c6da794e4bfddfb5e594709c678101ead80c6bb8424`）；`dsh plugin --profile desktop list` 报 `dsh-ccd-style@0.1.0`，profile 依赖指向该唯一路径。两轮安装前的配置备份分别是 `~/.dsh/profiles/desktop/.ccd-style-backup.9c645e/` 与 `.ccd-style-backup.88373f/`（`package.json`／`cordis.patch.yml`／`pnpm-lock.yaml`），安装后用户 patch 与备份逐字节相同，`enabled: true` 保留。该包同时包含工作树里并行进行的其他改动（如空白会话页角落按钮修复），因为安装取的是当前工作区状态。回退可用上述备份与 `artifacts/install.zd2DVo/`。

用户随后要求自查：按用户要求用隔离 profile 起了临时 Web 实例（`DSH_HOME=.cache/verify/home-web`，127.0.0.1:19574，加载工作区构建）交由用户亲自登录查看，用户确认观感后实例已关闭（该实例的会话与凭证都在隔离 profile 内，未接触 `~/.dsh`）。

边界：没有重载用户窗口（Desktop 的 CDP 端口未开启）；已安装的渲染层需要用户在 DSH 内按 ⌘R（宿主未采纳依赖变化时再正常重启）后自查。装的是这一版构建，回退用上述备份与上一枚 tarball `artifacts/install.zd2DVo/dsh-ccd-style-0.1.0.tgz`。

## 空白会话页「多出的侧边栏按钮」（2026-10-02）

用户截图（2502×1675 @2x，Desktop，右侧栏收起）报告：新会话页左上角、窗口控制区右侧多出一个面板字形按钮。

**它不是插件新增的控件，而是被插件拉到列首的原生按钮。** 官方 Web 客户端（DSH `0.2.0-rc.2`、正式插件加载、1280×820 @2x、macOS DOM 标记）里，空白会话页顶栏为 `header.ST7X_W_header.ST7X_W_headerBlank`，DOM 只有两处内容：空的 `[data-conversation-header-leading]` 和角落座位里的原生按钮

```html
<div data-conversation-header-corner><div data-slot="conversation.session.header.corner">
  <button aria-label="打开右侧边栏" aria-keyshortcuts="Shift+Meta+B" data-sidebar-right-expand="true">…
```

宿主用 `.ST7X_W_headerBlank .ST7X_W_headerCorner { margin-left: auto }` 把这一枚「右侧栏收起时的唯一入口」留在尾侧；插件为了让填满的顶栏行按固定 2px 簇间隙排列，在 `.ST7X_W_headerCorner` 上写了 `margin: 0 0 0 var(--ccd-header-action-gap)`，**同特异度下覆盖掉那条自动边距**，空白行因此没有可推开的余量，按钮落到列首——正好在窗口控制区右侧。

修复：`features/conversation/conversation.css` 增加一条只作用于空白行的规则（特异度高于填满行那条），把宿主自己的自动边距还回去；尾侧仍是填满行相同的 12px 内缩，其余任何状态都不受影响。

```css
html[data-dsh-ccd-style="true"] .ST7X_W_headerBlank .ST7X_W_headerCorner { margin-left: auto; }
```

真实运行（隔离 `.cache/verify/home-web`，官方 Web 客户端，插件开启 vs. 用 `--patch` 关闭；Playwright Chromium 1280×820 @2x，0 pageerror；脚本 `.verify/blank-header-corner.mjs`）：

| 状态 | 角落座位（`[data-conversation-header-corner]`）左缘 | 右侧栏入口右缘距列右缘 | 判定 |
| --- | --- | --- | --- |
| 空白会话页，修复前 | x=294（列首，列左缘 280） | 958px | 用户看到的错位 |
| 空白会话页，修复后 | x=1240 | 12px | 与原生一致 |
| 空白会话页，插件关闭（原生） | x=1240 | 12px | 基准 |
| 空白会话页，侧栏收起 | x=1240 | 12px | 不变；`[data-shell-leading]` 的「打开侧边栏」仍在 88,11，侧栏自己那份保持隐藏 |
| 聊天页（有会话） | x=1240 | 12px | 未受影响：标题 292、视图轨道 406、团队入口 496、工具组 1120–1238 |

修复前的列首状态用 `--legacy`（在页面里补回修复前的 `margin-left`）按同尺寸复现，三张顶栏截图拼成 `output/playwright/blank-header-corner/compare-top.png`，另存 `before/`、`after/`、`native/` 三个目录的 `page.png` 与 `report.json`。

本地检查：`npm run check` 通过——类型、架构、65 项行为测试、构建、54 文件包检查。改动是纯 CSS 的宿主对齐还原，按同尺寸截图验收，不新增重复断言。

边界：验证在官方 Web 客户端加 macOS DOM 标记下完成，真实 Electron 窗口的落位仍需用户重载后确认。

交付：`artifacts/install.zd2DVo/dsh-ccd-style-0.1.0.tgz`（54 文件）用正式 CLI 装入 Desktop profile，安装副本与仓库构建逐字节一致（`lib/client.js` SHA-256 `735fd67aa43dd51cd70a165afa8406f40f2daacc4128563c792f652fae8407d5`、`lib/index.js` `a57061f0…`），安装副本的 `client.js` 含 `ST7X_W_headerBlank .ST7X_W_headerCorner { margin-left: auto }`；profile 依赖指向该唯一路径，`dsh plugin --profile desktop list` 报 `dsh-ccd-style@0.1.0`，用户 patch 的 `enabled: true`／`debug: true`／`appearance`／`fonts` 原样保留，安装前配置备份在 `~/.dsh/profiles/desktop/.ccd-style-backup.sNSAxz/`。桌面端按 ⌘R 重载新产物后生效。

## 助手 Markdown 表格外观（2026-10-02）

按用户提供的表格截图（1662×366 的 @2x 裁剪）实现聊天内 Markdown 表格：单张圆角卡片、表头浅灰填充、表头下一条略深的分隔线、行间发丝线、没有竖线，单元格 4px／10px 内边距，表格文字与正文同为 14px／24px。

参考图量测（设备像素换算成逻辑像素）：外框 1px `#e3e3e3`（即 `--ccd-border`）、表头填充 `#f0f0f0`（即 `--ccd-raised`）、表头下边线 1px `#d9d9d9`（比外框深一档，新增 `--ccd-table-head-line`）、行间线 `#e3e3e3`、圆角经四个角的亚像素拟合落在 5–7px（取 6px）、首列文字距卡片左缘 12px（1px 边框 + 10px 内边距 + 字形边距）、表头与数据行都是 33px（24px 行高 + 上下各 4px + 1px 线）。字号用同一张图校准：`目标` 的墨迹宽 51 设备像素与「600 字重 14px」一致，`通读整个仓库` 的墨迹宽 166 设备像素与 14px 一致（13px 只有 154），所以表格文字回到正文尺寸，而不是宿主的 13px。

改动：`theme/tokens.css` 新增 `--ccd-table-radius`／`--ccd-table-head-line`；`theme/palette.ts` 增加一档 14% 墨量的派生线，`theme/tokens.ts` 只在配置了画布色时下发它（未配置时内置值仍是唯一来源）；`features/conversation/conversation.css` 只覆盖助手正文的表格。

本地检查：`npm run check` 通过——类型、架构、65 项行为测试、构建、54 文件包检查。新增断言：内置表头线比卡片外框深、仍浅于正文（`tests/theme-tokens.test.ts`），派生色在配置画布下与其它线一起变深。

真实运行在隔离 `.cache/verify/home-web` 的官方 Web 客户端（DSH `0.2.0-rc.2`、`file:` 指向仓库、正式插件加载），Playwright Chromium 1280×820 @2x，用宿主模块表里的原版 React／`MarkdownText`／`MarkdownDelegateProvider` 渲染用户截图里的同一张表（未复制官方组件、未写会话日志、未发送请求）：

| 项目 | 原生（插件关闭） | 本插件 |
| --- | --- | --- |
| 表格外框 | 无 | 1px `rgb(227,227,225)`，圆角 6px |
| 表头单元格 | 无填充、500 字重、13px/22px、`padding: 10px 16px 10px 0` | 填充 `rgb(240,240,239)`、600 字重、14px/24px、`padding: 4px 10px` |
| 表头下边线 | 1px `rgb(227,227,225)` | 1px `rgb(217,217,216)` |
| 数据行 | 13px/22px、下边线 `rgba(0,0,0,.1)` | 14px/24px、下边线 `rgb(227,227,225)`、末行无 |
| 行高 | 42.5px（表头）／43px | 33px／32px |
| 列对齐 | `left`／`center`／`right` | 相同 |

四张表（示例表、对齐表、单列表、超长标识符表）在 770px 与 340px 正文宽度下横向溢出均为 0，单元格内无裁切；紧凑推理 Markdown 的表格与插件关闭时的原生表格逐项一致（13px/20px、无边框、无填充）；0 pageerror。像素取色核对：渲染后的表头填充、外框、表头线与行线为 240／227／217／227，参考图为 240／227／217／226–228。

证据：`output/playwright/table-appearance/before/`（原生基线）与 `after/`（本插件）的 `report.json`、`table.png`、`table-narrow.png`、`table-native.png`、`conversation.png`，以及 `compare.png`（参考图与实现的同尺度上下对照）；复验脚本 `.verify/table-appearance.mjs`（固定本机浏览器路径与隔离 profile 的测试会话，不是可移植自动测试）。

交付：按 [安装指南](../install.md) 打包并用正式 CLI 装入 Desktop profile。tarball 为 `artifacts/install.xpR4Sb/dsh-ccd-style-0.1.0.tgz`（SHA-256 `797c10dd888402dc84f023880ecc6736b42a8852a3d152fa0eb5503d3af5c0dd`，54 文件），包内、仓库构建与安装副本的 `lib/client.js` 逐字节一致（SHA-256 `735fd67aa43dd51cd70a165afa8406f40f2daacc4128563c792f652fae8407d5`，含 3 处 `ccd-table-head-line`），`lib/index.js` 为 `a57061f0…`。安装前配置备份在 `~/.dsh/profiles/desktop/.ccd-style-backup.96W7ie/`（`package.json`／`cordis.patch.yml`／`pnpm-lock.yaml`），安装后用户 patch 与备份逐字节相同（`enabled: true`、`debug: true` 与字体配置保留）；profile 依赖已指向该唯一路径。

边界：本轮没有在真实 Electron 窗口复验，运行中的 DSH 窗口仍需按 ⌘R（或正常重启）加载新产物；隔离 Web profile 的会话为空，表格由宿主原版 `MarkdownText` 夹具渲染，不代表模型真实回复。参考图里的行内代码芯片比本插件现有芯片窄约 10%（参考图芯片文字约 12.3px、内边距约 1px 3px；本插件沿用上一轮确认的 0.95em 与 `padding: 1px 4px`），因此示例表第三列在 770px 列宽下有一行折行；芯片属于上一轮已确认的元素，本轮没有改动，表格自身的行高、圆角、描边与填充与参考图一致。

## effort 浮层移除 Recommended 行（2026-10-02）

按用户要求删除 effort 浮层底部的 `Recommended` 说明。`EffortPanel` 不再接收 `recommended` 档位、不再渲染该行；`ModelControls` 里只服务于它的 `recommendedIndex` 计算与 `.ccd-effort .recommended` 两条样式一并移除。浮层保留标题（`Effort` + 当前档位）、帮助提示、`Faster／Smarter` 轴与滑块；模型推荐档仍决定「没有保存显式档位时」浮层的初始预览档，这一行为没有变化。

本地检查：`npm run check` 通过——类型、架构、53 项行为测试、构建、51 文件包检查。删除的是纯展示层，按同尺寸截图验收，不新增重复断言。

隔离 `.cache/verify/home-web` 的官方 Web 客户端（DSH `0.2.0-rc.2`、正式插件加载），Playwright Chromium 1280×820 @2x：点击 effort 入口后浮层为 220×111.6px，三行结构 `header 20px → axis 15.6px → track-shell 32px`（12px 内边距），面板文本不含 `Recommended`，四档刻度、帮助提示与 `aria-valuetext="High"` 原样保留，0 pageerror。此前面板约 132px 高，减少的正是被删除的 16px 行加 2px 上边距。

证据：`output/playwright/effort-panel/effort-panel.png` 与 `report.json`；复验脚本 `.verify/effort-panel.mjs`。

交付：用户确认后按 [安装指南](../install.md) 打包并安装到 Desktop profile。tarball 为 `artifacts/install.C8CwTB/dsh-ccd-style-0.1.0.tgz`，包内、仓库与安装副本的 `lib/client.js` 逐字节一致，SHA-256 为 `b4c931f2df5515d9d7120166a024e6eb37332fa9f5c5c380e2ae07c071478f6c`，安装副本不含 `Recommended`；profile 依赖已指向该唯一路径。安装前配置备份在 `~/.dsh/profiles/desktop/.ccd-style-backup.ctHC9u/`（`package.json`／`cordis.patch.yml`／`pnpm-lock.yaml`），用户 patch 与备份逐字节相同。

边界：没有在真实 Electron 窗口复验这一版渲染层，需在 DSH 按 ⌘R（或正常重启）加载新产物；本轮包同时包含上一轮 Composer 尾侧簇修复与工作树中的其他改动。

## Composer 尾侧簇对齐、等距与缓存命中读数（2026-10-02）

按用户截图修复三件事：模型／effort 偏左、尾侧簇间距不一致、用量读数改成缓存命中。

根因（同版本宿主结构）：`.yhfFVG_trailing` 的最后一个座位是原生 activity（语音输入）。空载时它仍是一个盒子——渲染器把每个 slot 条目放进 `display: contents` 包装，宿主自己的 `.yhfFVG_activity:empty{display:none}` 看不到它为空——组内 12px 间隙把模型／effort 挡在控制行右内边缘之外（实测 effort 右缘距卡片右缘 16px，其中只有 4px 是行内边距）。间距方面同时存在四种节奏：宿主 trailing 组 12px、读数簇 2px、dock 与读数簇之间 10px、模型与 effort 4px。

改动：`theme/tokens.css` 新增唯一的簇间隙 `--ccd-cluster-gap: 6px`（取代原 `--ccd-dock-gap`，`compat/stats-values.ts` 读同一个属性做模型按钮宽度预算）；`theme/composer.css` 用它统一 trailing 组、`standardControls`、dock 与 `.OpZ85W_root` 的间隙，并只在 activity 座位确实为空时隐藏它（`:has()` 判空；展开态是另一个类名，不受影响）；`features/model-controls/controls.css` 的模型↔effort 间隙取同一 token；`compat/stats-values.ts` 的短读数优先取带 `%` 的缓存命中份额，没有份额时回退到带 `/` 的速率段或首段。

本地检查：`npm run check` 通过——类型、架构、53 项行为测试、构建、51 文件包检查。`tests/composer-stats.test.ts` 更新为：速率段仍镜像 `210 tok/s`，`117M tok · 缓存命中 95%` 镜像 `缓存命中 95%`，只有总量时回退 `117M tok`；模型宽度预算按 6px 簇间隙重算。

真实运行在隔离 `.cache/verify/home-web` 的官方 Web 客户端（DSH `0.2.0-rc.2`、`file:` 指向仓库、正式插件加载），Playwright Chromium 1280×820 @2x。隔离 profile 没有真实计费用量，两个读数与上下文环按宿主同版本标记、类名与文案（`stats.cacheHit` 等）安装为 DOM 夹具；模型／effort 控件、Composer 与全部样式都是真实实现：

| 档位（窗口宽） | 卡片宽 | effort 右缘距卡片右缘 | 簇间隙（读数→环→模型→effort） | 行溢出 |
| --- | --- | --- | --- | --- |
| 1280 | 770px | 4px（= 行内边距） | 6.4／6／6px | 0 |
| 900 | 770px | 4px | 6.4／6／6px | 0 |
| 780 | 741px | 4px | 6.4／6／6px | 0 |
| 700 | 661px | 4px | 6.4／6／6px | 0 |
| 620 | 581px | 4px | 6.4／6／6px | 0 |

同一夹具用 `--legacy` 复现旧间距作对照：effort 右缘距卡片右缘 16px、簇间隙 6.4／12／4px、读数镜像 `117M tok`。宽列读数文本在容器 ≤700px 时按原规则只留图标；长模型名 `DeepSeek-V41-Flash-Preview` 在 1280／700 下由模型按钮截断，effort 与读数不重叠。activity 座位被占用时（夹具放入一个 28px 控件）不隐藏，trailing 组随之变宽并把读数簇推开；恢复空座位后又回到等距布局。0 pageerror。

证据：`output/playwright/composer-cluster/` 的 `geometry.json`、`geometry-legacy.json`、`row-wide.png`／`row-wide-legacy.png`、`composer-wide.png`、`row-medium.png`、`row-narrow.png`、`row-compact.png`、`row-tight.png`、`row-long-model.png`、`row-long-model-compact.png`；复验脚本 `.verify/composer-cluster.mjs`（固定本机浏览器路径与隔离 profile 测试会话，不是可移植自动测试）。

边界：两个读数与上下文环是宿主 DOM 夹具，不证明真实用量数据端到端；本轮没有在真实 Electron 窗口复验，也没有在当轮重新打包。当时 Desktop profile 引用的 `artifacts/install-config-20261002-204846/dsh-ccd-style-0.1.0.tgz`（安装于 20:53）已在本轮源码改动之后构建，包内与安装副本的 `lib/client.js` 都与仓库构建逐字节一致（SHA-256 `1bee175a…`）；该产物随后被下一轮的 `artifacts/install.C8CwTB/` 取代，其中同样包含本修复。

## 精简配置页（2026-10-02）

用户复核后提出：`debug` 对使用者无用、两个未实现模块不该出现、说明性文字不必要、中英文字体是否需要分开。处理：配置页只留 9 行（总开关、4 个已实现模块、2 个背景色、界面字体、代码字体），`debug`／`fonts.uiCjk`／`features.tool-calls`／`features.statistics` 保留在 Host schema 里但不再展示（YAML 进阶可用）；行内说明文字与页脚常驻说明删除，页脚仅在写入中／已保存／被拒绝时显示一行。

隔离 `.cache/verify/home-web` 官方 Web 客户端实测（0 pageerror）：9 行字段、5 个开关、2 个下拉框、`.ccd-settings-hint` 与 `.ccd-settings-note` 计数均为 0、空闲时状态行为空、页面文本不含「调试日志」「尚未实现」「界面中文字体」；切换「侧栏」开关仍即时写入 `sidebar: false`。证据：`output/playwright/config-page/trimmed-page.png`；复验脚本 `.verify/config-trimmed.mjs`。

交付包 `artifacts/install-config-trimmed-20261002-233237/dsh-ccd-style-0.1.0.tgz`（54 文件，SHA-256 `2adb7804571ffbb9ba774bf6776a1672bc0e8abfad0cbab166a7fa7d8bd7e06a`，`lib/client.js` `372437a0c93942fb0dc3c9cb9e82e04ef2745a4accdf3852ffd347231226c03d`）已用正式 CLI 装入 Desktop profile，安装副本与仓库构建逐字节一致，用户 patch 未变（备份 `.ccd-style-backup.VVmzFb/`）。

## 按截图收敛控件细节（2026-10-02）

用户复核后提出四点，全部落地：分节去掉卡片外壳（只用节标题 + 行间细分隔线）；背景色行去掉颜色小方块，只留十六进制文本框；下拉框改成**整块**形状——chevron 内嵌在同一边框里，没有内部分割线；菜单的 ✓ 移到**行尾**并改用蓝色（`--dsw-static-blue-450`），只标当前项。

同时补了一条降级路径：菜单里搜不到（或系统隐藏）的族名，第一行给「使用“xxx”」，回车即提交并走与文本框相同的规范化校验。

用户随后给出更近的下拉框/菜单截图，据此把形状再收一轮：下拉框 260×34、圆角 12px、chevron 内嵌；菜单 300px 宽、圆角 12px、**无边框 + 阴影**、与下拉框行首对齐、选项 34px 纯文本行、当前项仅由行尾蓝色 ✓ 标记（不再给当前项加底色）。实测：`box 260×34 radius 12px`、`menu 300 radius 12px border 0 shadow true`、`alignedLeft true`、`itemHeight 34`、`check "✓" 行尾且 rgb(77, 147, 248)`。证据补在 `output/playwright/config-page/select-menu.png`、`select-page.png`；复验脚本 `.verify/config-select-look.mjs`（覆盖分节无外壳、无色块、下拉框整块、菜单几何与行尾蓝色 ✓、开/关/重开、清单外族名提交）。

交付包 `artifacts/install-config-select2-20261002-232121/dsh-ccd-style-0.1.0.tgz`（54 文件，SHA-256 `cf83099d5d39d77b165df02e993c1a2e2f435f9f6e337972548c6417a415ee49`，`lib/client.js` `1e8ea9fd2c2fbbfe9e7db6e88ce5173abc2d01396330e4f51015daa3fac8b013`）已用正式 CLI 装入 Desktop profile，安装副本与仓库构建逐字节一致，用户 patch 未变（备份 `.ccd-style-backup.fZVf4a/`）。

隔离 `.cache/verify/home-web` 官方 Web 客户端实测（Playwright Chromium，1280×900 @2x，0 pageerror）：4 个分节 `border-width 0 / background transparent`；`input[type=color]` 数量 0；`.ccd-settings-select` 内无分割线（整块一个边框）；开关开启态 `rgb(77, 147, 248)`；菜单 `aria-selected` 1 项，✓ 是行尾最后一个子元素且排在名字之后，颜色 `rgb(77, 147, 248)`；输入 `Maple Mono NF CN Extra` 后首行出现「使用“Maple Mono NF CN Extra”」，回车写入 patch。证据：`output/playwright/config-page/restyle-page.png`、`restyle-menu.png`（脚本后来合并进 `.verify/config-select-look.mjs`，截图保留）。

## 控件形状、即时生效与字体菜单（2026-10-02）

按用户提供的 Claude Code 设置截图重做控件与写入语义：**不要弹窗**，只要控件的形状（蓝色胶囊开关、带 chevron 的下拉框、带边框的按钮）与那种「标题 + 灰说明 / 控件右对齐 / 细分隔线」的行列表；写入改为**即时生效**，取消保存与重新载入。

本地 `npm run check` 通过（63 项行为测试：新增提交边界用例，删除草稿语义用例）。隔离 `.cache/verify/home-web` 官方 Web 客户端实测（Playwright Chromium，1280×900 @2x，0 pageerror）：

| 场景 | 结果 |
| --- | --- |
| 开关 | 点击即写：patch 的 `debug` 立即翻转，状态行「已保存」；开启态实测 `rgb(77, 147, 248)`（`--dsw-static-blue-450`） |
| 颜色 | 输入 `#303030` 后失焦提交：patch 写入 `appearance.canvas`，`body` 内联 `--ccd-canvas` 同步为 `#303030` |
| 字体菜单 | 点 chevron 打开：258 项、搜索 `Maple` 后回车选中 `Maple Mono NF CN` 并立即写入；重开后当前项带 ✓（`aria-selected` 1 项） |
| 再点 chevron | 菜单收起（`aria-expanded` true→false），不残留 |
| 恢复默认 | 清空字段回车 → `unset` 覆盖，patch 与内联 token 同步移除 |

**运行中发现并修复的缺陷**：菜单原本监听 `scroll` 关闭自己，而"把按钮滚动进视野"的滚动事件在打开之后才到，导致菜单刚开就消失（截图脚本里复现）；同时再点一次 chevron 不会收起（外部点击处理器先把它关掉、随后 onClick 又打开）。改为固定定位跟随锚点矩形重定位、外部点击忽略锚点自身，并补了开／关／重开三段断言。

证据：`output/playwright/config-page/live-default.png`、`live-applied.png`、`live-menu.png`；复验脚本 `.verify/config-live.mjs`（即时生效与菜单选中），菜单开/关/重开与几何另见 `.verify/config-select-look.mjs`。

交付包 `artifacts/install-config-live-20261002-231204/dsh-ccd-style-0.1.0.tgz`（54 文件，SHA-256 `20fc11b974d2d68bc498d0861bdb2e55e194bfaf5a8ddc005ca04f0466e599bb`，`lib/client.js` `72537f0913b6e53981dcbd787bbbc30ea53da85395048a95cfe7d3337b3ba579`）已用正式 CLI 装入 Desktop profile，安装副本与仓库构建逐字节一致，用户 patch 未变（备份 `.ccd-style-backup.Ed7852/`）。

## 配置页改版与字体选择器（2026-10-02）

按用户反馈重做配置页：布尔项从原生复选框改成 36×20 滑动开关（沿用宿主 `Switch` 的尺寸与 token），整页改成单列卡片、宽度上限 760px、行间细分隔线；字体候选从原生 `<datalist>` 改成**行内可搜索滚动列表**——原生弹层在桌面窗口里滚轮滚不动，且样式不可控。

本地 `npm run check` 通过（58 项行为测试，新增族名搜索过滤断言）。隔离 `.cache/verify/home-web` 官方 Web 客户端实测（Playwright Chromium，1280×900 @2x，0 pageerror）：

| 项目 | 结果 |
| --- | --- |
| 字体列表 | 258 项；滚动区 `scrollHeight 7740 / clientHeight 240`，滚轮滚动到 600px、程序化到底 7500px（= 最大） |
| 搜索过滤 | 输入 `mono` 后 4 项（Andale Mono / Maple Mono NF CN / PT Mono / SF Mono），候选项按自身字体预览 |
| 键盘 | ↑↓ 移动高亮，Enter 选中并收起，Esc 收起；选中值写入草稿（仍需保存） |
| 开关 | `role="switch"`，点击 `aria-checked` true→false，点击后回到原值 |
| 结构 | 13 行字段、卡片分组（通用／模块／背景色／字体）、页脚状态与按钮分列 |

证据：`output/playwright/config-page/look-default.png`、`look-picker.png`、`look-picker-scrolled.png`；复验脚本 `.verify/config-page-look.mjs`、`.verify/config-page-scroll.mjs`。桌面 Electron 的权限自动放行来自主进程代码（见 [兼容说明](DSH_COMPATIBILITY.md)），未在真实窗口内执行 JS 复核。

交付包 `artifacts/install-config-ui-20261002-221323/dsh-ccd-style-0.1.0.tgz`（54 文件，SHA-256 `1a74282a8b50d1a9c0b87c2b9f602328c65bc476a07a18e4742945ddc8451215`，`lib/client.js` `1b9fe5eccc96d281dddcc2d96aba5c7fa2cb546877b656ecc1cb81fd0d17fd79`）已用正式 CLI 装入 Desktop profile，安装副本与仓库构建逐字节一致，用户 patch 未变（备份 `.ccd-style-backup.G0EKaJ/`）。

## 系统字体候选列表（2026-10-02，已由上一节的列表取代）

字体行接入 Chromium 的 Local Font Access API：首次聚焦时查询本机字体族，去重、`zh` 排序后缓存；拿不到清单时不展开列表、退回手填并显示说明。这一版的候选界面是原生 `<datalist>`，因滚动问题已在上一节改为行内列表，查询与兜底逻辑不变。

交付包 `artifacts/install-fontlist-20261002-215202/dsh-ccd-style-0.1.0.tgz`（52 文件，SHA-256 `a3c563f6d0488b47910d39167d1d1d6db62a025c9c8455e729e80b60b61a6bd5`）已用正式 CLI 装入 Desktop profile（备份 `.ccd-style-backup.XRf0Vo/`）；配置页改版后的交付包见本节末尾记录。

## 配置化：背景色、字体与配置页（2026-10-02）

把侧栏／会话背景色与全局中英文字体、代码字体做成可配置项，并新增插件自己的配置页。Host `Config` 增加 `appearance`（`canvas`／`sidebar`）与 `fonts`（`uiLatin`／`uiCjk`／`code`）两个 volatile 小节；`theme/palette.ts` 从配置色派生悬停／选中／分隔线，`theme/tokens.ts` 合成一个覆盖层交给 `ctx.theme.overrideTokens`；页面注册进侧栏「插件」页的行配置插槽 `plugins.row.config`（键 `dsh-ccd-style#ui-skin-ccd-style`），挂在常驻作用域，因此关掉界面后仍能开回来。方案与调研结论见本轮提交信息，落地细节见 [当前实现](IMPLEMENTATION.md) 与 [兼容说明](DSH_COMPATIBILITY.md)。

本地检查：`npm run check` 通过——类型、架构、53 项行为测试、构建、51 文件安装包检查。新增测试覆盖：颜色／字体名的规范化与拒绝（含 `url(...)`、分号、超长）、`adoptConfig` 在缺失／畸形小节下永不抛错、派生色与 token 组合的确定性、未配置时内置表面逐字节不变、字体栈顺序与 light／dark 成对、配置页草稿折叠成单次 `mutate`、`syncDecision` 对「自己写入回显 / 外部改动」的判别、注册与释放生命周期，以及 **Host schema 不得出现 volatile 嵌套**（`tests/host-config.test.ts`）。

真实运行在隔离 `.cache/verify/home-web` 的官方 Web 客户端（DSH `0.2.0-rc.2`，`file:` 指向仓库，正式插件加载），Playwright Chromium 1280×820 @2x，0 pageerror：

| 步骤 | 结果 |
| --- | --- |
| 打开侧栏「插件」→ `dsh-ccd-style` → 组件行 | 行标题即配置控件，页面渲染 13 行字段（通用／模块／背景色／字体） |
| 非法颜色 `red` 后保存 | 就地提示「颜色需为 #rrggbb 或 #rgb」，profile 未被写入 |
| 保存 `#303030`／`#262a2e`／`Newsreader`／`PingFang SC`／`JetBrains Mono` | 写入 profile 的 `cordis.patch.yml`，状态「已保存」 |
| 页面外观 | 会话列实测 `rgb(48, 48, 48)`；`body` 内联 `--ccd-canvas`、`--dsw-alias-bg-base`、`--dsw-font-family`（`"Newsreader", "PingFang SC", var(--ccd-font-fallback)`）、`--ds-font-family-code` 与配置一致 |
| 关掉总开关 | `data-dsh-ccd-style` 移除、内联 token 清空；配置页仍在 |
| 再打开总开关 | 根属性与 token 恢复 |
| 重新加载页面 | 配置页与字段值、内联 token 全部保留 |
| 「恢复默认」后保存 | `unset` 覆盖，`appearance: {}`／`fonts: {}`，内置调色板恢复 |

**运行中发现并修复的两个真实缺陷**（本地夹具都没有覆盖）：

1. Host schema 最初把 `appearance.canvas` 等叶子字段也标了 `.volatile()`，Cordis 在激活时报 `volatile fields require a fixed object path without an enclosing volatile field`，整条插件条目不激活。改为「节对象 volatile、叶子字段普通」，并新增契约测试。
2. 配置页保存成功后没有重新对齐基线：Host 回显被当成「外部改动」，导致「关掉总开关再打开」这一步实际写不进去、还误报「配置已在外部改变」。抽出 `syncDecision()` 区分自己写入的回显与外部改动，并补单测。

证据：`output/playwright/config-page/` 的 `row-page.png`、`config-page-filled.png`、`hero-configured.png`、`interface-configured.png`、`interface-disabled.png` 与 `report.json`；本机复验脚本 `.verify/config-page.mjs`、`.verify/config-page-shots.mjs`。脚本固定本机浏览器路径与隔离 profile，不是可移植自动测试。

交付包生成在 `artifacts/install-config-20261002-204846/dsh-ccd-style-0.1.0.tgz`（51 文件），包内 `lib/client.js` 与仓库构建逐字节一致，tarball SHA-256 为 `eec5a80304733444bfbbbbd25d3ee1d282955216533ce012cc3bb6ab0f9f3c46`，`lib/client.js` 为 `1bee175ad4740c5463d99de9796ce282fc9fe23c8afe931fd3b0acc8ae95e4f2`。

Desktop 安装：文件权限放开后已用正式 CLI 装入 `/Users/zoukai/.dsh/profiles/desktop`。安装前配置备份在 `.ccd-style-backup.mv39Jm/`（`cordis.patch.yml`、`package.json`、`pnpm-lock.yaml`），用户 patch 与备份逐字节一致（`enabled: true`、`debug: true` 保留）；profile 依赖指向 `artifacts/install-config-20261002-204846/dsh-ccd-style-0.1.0.tgz`，`dsh plugin --profile desktop list` 报 `dsh-ccd-style@0.1.0`，安装副本的 `lib/client.js`／`lib/index.js` 与仓库构建及包内字节一致（`1bee175a…`／`a57061f0…`）。原有安装包 `artifacts/install-header-cluster-20261002/` 保留。

边界：隔离 Web profile 的补丁里临时启用了 `@deepseek-ai/dsh-plugin-manager` 与 `@deepseek-ai/dsh-client-ui-plugin-manager`（Web 组合包默认不带该面板，Desktop 组合包自带），等价于 Desktop 配置。本轮**没有重载用户窗口**：Desktop 的 CDP 端口未开启，安装副本已核对但渲染层未验证，需要用户在 DSH 内按 ⌘R（宿主未采纳依赖变化时再正常重启）；也没有在冷启动后复验。中文字体的中英混排与标点字形只有 DOM 断言，没有逐档截图核对。

## 顶栏图标簇与「打开方式」（2026-10-02）

按用户截图把会话顶栏尾侧改成 CCD 的图标行：`[打开方式] [终端] [浏览器] [更多] [右侧栏开关]`。间距统一为 28×28 命中盒、16px 图标、2px 间隙、簇右缘距列右缘 12px；参考图实测中心距 28.75／30／30px、末位字形中心距窗口右缘 25.75px、行中心距顶边 24.75px，而 DSH 的 10px 上内边距加 30px 行高正好是 25px，所以垂直方向没有改动。「打开方式」改成通用打开字形，点击任意位置弹原生应用菜单；终端／浏览器是本插件注册的两个 list 条目，打开或聚焦右侧栏对应页签。

本地检查：`npm run check` 通过——类型、架构、26 项行为测试、构建、43 文件包检查。新增测试覆盖文档语言标签、页签 focus／open 选择、服务缺失时不出按钮，以及兼容层的 menu／direct 标记与逐条属性恢复；包检查夹具新增两个视图的注册顺序、页签 kind 出现与消失、以及释放断言。

隔离 `.cache/verify/home-web` 的官方 Web 客户端正式加载插件（Playwright Chromium，1280／500／400×820，@2x，macOS DOM 标记）：

| 档位 | 聊天列 | 命中盒 | 相邻间隙 | 右留白 | 新增视图 | 顶栏溢出 |
| --- | --- | --- | --- | --- | --- | --- |
| 宽 | 1000px | 28×28 | 2／2／2／2px | 12px | 终端＋浏览器 | 0 |
| 紧凑 | 500px | 24×24 | 2／2／2／2px | 8px | 终端＋浏览器 | 0 |
| 极窄 | 400px | 24×24 | 2／2px | 8px | 均隐藏 | 0 |

五个控件的中心线偏差为 0，原生「更多」「右侧栏开关」与新增项同盒等高。行为验收：点击终端打开右栏并出现终端页签，再点一次不新增页签，点击浏览器新增其视图，「打开方式」弹出原生 `role="menu"`；0 pageerror。400px 档在隐藏两个新视图后仍溢出 7px，根因是单行顶栏里标题占满剩余宽度，因此该档同时省略会话标题（与 macOS 收起侧栏同一处理），此后溢出为 0。

Web profile 默认停用 `ui-sidebar-browser`（`dsh-web-app` 补丁里 `disabled: profileContext.name !== 'desktop'`），本次在隔离 profile 的补丁里临时启用，等价于 Desktop 配置；这一步同时实测了"页签 kind 不存在时不注册按钮"的降级路径。

证据：`output/playwright/header-icon-cluster/` 的 `header-wide.png`／`header-compact.png`／`header-narrow.png`、`terminal-open.png`、`browser-open.png`、`open-menu.png` 与 `geometry.json`；复验脚本 `.verify/header-icon-cluster.mjs`、`.verify/header-view-behaviour.mjs`。脚本固定本机浏览器路径与隔离 profile 的测试会话，不是可移植自动测试。

交付包生成在 `artifacts/install-header-cluster-20261002/dsh-ccd-style-0.1.0.tgz`（43 文件），包内 `lib/client.js` 与仓库构建逐字节一致，SHA-256 为 `45a133c5e6e35f5dfe8d1fe1f6cd90417ced639b28f9679cb137498976118415`；本轮未安装到 Desktop profile。隔离 profile 里为本次验收临时启用了 `ui-sidebar-browser` 并把补丁快照在 `.cache/verify/cordis.patch.desktop-equivalent.yml`。

边界：没有在真实 Electron 窗口或冷启动后复验，也没有重新安装 Desktop 插件；`assets/conversation-light.png` 展示图仍是旧顶栏，需要重拍后再更新 README。

## 模型与 effort 分离（2026-10-02）

本次按用户参考图收紧 effort 弹层比例：面板目标宽度约 220px、高度约 132px（对应截图的 440×264@2x），补齐 `Recommended` 说明和参考图中的帮助提示（`Recommended` 行后来按用户要求删除，见本轮记录）。修复 `level-stage` 的隐藏测量层；此前最长档位文本作为可见伪元素叠在当前档位上，会让 `default` 常驻并造成重叠。切换标签时也会清理过期 outgoing 文本。

共用 `conversation.input.model` 展示插槽，模型列表和 effort 滑块为独立入口，官方 ModelDirectory 保持唯一数据来源。参考用户目录里的首选 `zanwei/claude-model-selector`，采用其 MIT 样式、磁性吸附、阻尼弹簧及紫色像素算法；颜色归属主题、归属声明纳入 LICENSE。

完整 `npm run check`、`git diff --check` 通过：22 项行为测试及 38 文件包检查。新增测试覆盖同模型 effort 保留、跨模型默认值、无推理模型、provider-default、过期 route、pending 与不支持档位拦截。包检查夹具新增真实构建的模型插槽注册、配置去重及 Fiber／slot／样式释放断言。

隔离 `.cache/verify/home-web` 的官方 DSH `0.2.0-rc.2` Web 客户端正式加载插件，Playwright Chromium、macOS DOM、1280×820 @1x。真实支持的 Off／Low／High／Max 四档来自目录，实际调用官方 select 通过；拖动期间提交次数为 0，松手吸附完成后只提交一次。Home／End、Escape 关闭与焦点返回、模型搜索、空结果和减少动态效果通过。400／520／700px 聊天列实拖验收无控件重叠、越界或横向溢出；上一轮面板为 360×160.19px，本轮按用户参考图收紧为约 220×132px。首次运行的服务注入缺项已修正，最终交互报告 0 pageerror。

额外通过官方 configForms 传输停用／重新启用：自有控件和样式释放，原生合并菜单恢复，已卸载 Canvas 停止绘制，再启用只挂载一组控件。实际切换至 DeepSeek-V4-Pro 后，原生 `/model` 弹层勾选与新入口一致，见 `command-model.png`。

选择失败使用官方目录 store 的受控 UI 夹具验证：pending 结束后恢复真实保存档位，并显示错误。这是失败展示夹具，不代表真实后端失败链路。

证据在 `output/playwright/effort-split/`，包括 `max.png`、`hero-max.png`、`models.png`、`chat.png`、`chat-400.png`／`chat-520.png`／`chat-700.png` 与 `report.json`；本机复验脚本在 `.verify/effort-*.mjs`。截图与测试钩子不进入安装包。最终复验前只读选择计数器保留官方方法调用，不替代业务接口。

本轮交付包生成在 `artifacts/effort-split.wbYcvW/dsh-ccd-style-0.1.0.tgz`，用户确认后已通过正式 CLI 安装至 Desktop profile。tarball 客户端与当前 `lib/client.js` 逐字节相同，SHA-256 为 `8f79863c0d93c97f02eff16e4afea49901ce57cb2d41af61ae7559bc744d293b`。

边界：没有发送模型请求或重载用户 Desktop 窗口，未验证该构建的真实 Electron 渲染及冷启动；安装与配置注册已确认，用户需在 DSH 按 ⌘R 加载新版。包内只增加同版本模型选择 SDK 的开发类型依赖，动态 SDK 未作为运行时 require 引入。

## 模型／effort 修复包（2026-10-02）

修复包已生成在 `artifacts/effort-split-current/dsh-ccd-style-0.1.0.tgz`，包内 `lib/client.js` SHA-256 为 `adc61e5484e2bf512aa6e076e0876e64dabb63bd435b80926306d2ed6c786c11`。本地完整检查和打包检查均通过。

此前同路径 tarball 曾被 DSH 复用，导致运行副本仍是旧哈希。本次改用唯一路径并通过正式 CLI 安装成功：`artifacts/install-effort-animated-20261002/dsh-ccd-style-0.1.0.tgz`。安装副本与包内 `lib/client.js` 均为 `f8f9ede30e026c3402a5c94d2791816e0b64d81d8a94ebe43866398b1569936b`，profile dependency 已指向该唯一 tarball。

安装前配置备份在 `.cache/verify/desktop-before-effort-split.YMYmMi/`；用户 patch 未改变，原有 profile 配置和历史 tarball 保留。Desktop CDP 9222 未开启，安装副本已核对但当前 Electron 窗口仍需按 `⌘R` 或完全重启后验证渲染。这项本地校验不替代真实 Desktop 视觉验收。

## 模型／effort 交互修复（2026-10-02）

按新的 Desktop 截图继续收紧模型弹层：不再渲染模型描述文字，弹层宽度改为约 240px；模型与 effort 入口均移除向下箭头。Recommended 保留为灰色说明，只在当前预览档位等于模型推荐档位时加粗（该行后来按用户要求删除，见本轮记录）。标题切换改为参考库的两个固定 DOM 节点和单一 swap 时序，取消上一轮 frame／timer 后再更新，阻尼回弹只移动滑块，避免重复显示 High／Max。

最终安装包为 `artifacts/install-effort-animated-20261002/dsh-ccd-style-0.1.0.tgz`，`lib/client.js` SHA-256 为 `f8f9ede30e026c3402a5c94d2791816e0b64d81d8a94ebe43866398b1569936b`。`npm run check`、`git diff --check` 均通过。

## 助手 Markdown 视觉调整（2026-10-02）

按用户提供的 CCD 截图补齐常驻蓝色下划线链接、红字灰底细边框的行内代码和正文粗体。仅覆盖助手正文，颜色归属主题变量；无需新增观察器、组件或导航逻辑。

隔离 `.cache/verify/home-web` 的官方 DSH `0.2.0-rc.2` Web 客户端正式加载插件。Playwright 使用宿主模块表中的原版 React、`MarkdownText` 与 `MarkdownDelegateProvider` 渲染临时视觉夹具，未复制官方组件、写入消息日志或发送请求。前后截图为同一正文、1280×820 @1x；额外验证 340px 正文宽度、极长标识符、表格、代码块、紧凑 Markdown 和 streaming 渲染。

最终宽／窄正文均无横向溢出；原生代码块、紧凑 Markdown 与 Composer 的测量样式前后一致。外部链接、文件链接（含第 12 行定位）及行内路径均触发官方 delegate 的对应回调，未调用系统外部打开器；hover 下划线与键盘焦点环保留，移除启用标记后恢复原生样式。0 pageerror。`git diff --check` 与完整 `npm run check` 通过，包含类型、架构、18 项行为测试、构建与 32 文件安装包检查；未为纯 CSS 新增重复断言。

本地证据：`output/playwright/markdown-ccd/` 中的 `before.png`、`after.png`、`detail.png`、`narrow.png` 与 `report.json`；本机复验代码在 `.verify/markdown-native.mjs` 与生成的 `.verify/markdown-native-run.mjs`。这些夹具和截图不进入安装包或 Git。

边界：这轮视觉验收为官方 Web 渲染器中的组件夹具，不代表模型真实回复或 Desktop 完整运行验证；随后已按用户要求更新 Desktop 安装，见下。

## 上一次 Desktop 安装交付（助手 Markdown）

通过 DSH `0.2.0-rc.2` 正式 CLI 将 `artifacts/install-markdown-20261002-1235/dsh-ccd-style-0.1.0.tgz` 安装到 `/Users/zoukai/.dsh/profiles/desktop`。包仅含已验证基线与本次 Markdown 调整；工作区另有正在开发的模型控件，未打入此包。发布快照在 `.cache/verify/markdown-release-20261002-1235/`，完整 `npm run check` 通过（18 项行为测试、32 文件包检查）。

配置和锁文件备份在 `.cache/verify/desktop-before-markdown-20261002-1235/`。安装后依赖路径与 bundle 注册已确认；用户 patch 与备份逐字节一致，`enabled: true` 保留。安装副本客户端与发布快照逐字节一致，SHA-256 为 `17e4e231808fa8d8ec2017b454b525c48a57327093e3fca6d95116d4234851b2`；记录保存在 `output/playwright/markdown-ccd/install.json`。此哈希对应发布快照，不对应含其他开发改动的当前工作区构建。

当前 Desktop 的 CDP 9222 端口未开启，没有新增调试端口或重启用户应用；当前窗口是否载入新产物未验证。用户在 DSH 内按 ⌘R 重载界面后查看聊天正文；如果宿主未采纳依赖变化，再正常重启 DSH。须保留此 tarball，后续安装前的配置备份仍引用该路径。

## README 完善与提交前检查（2026-10-02）

保留用户现有主标题和截图／安装指南／参与贡献／开源许可证四个标题，补齐兼容范围、Agent 与手动安装、启用与恢复、开发流程和归属说明。手动安装示例直接打包到唯一路径，避免覆盖既有安装包；安装指南标题同步，移除已完成的 README 待办。

`git diff --check` 与完整 `npm run check` 通过（类型、架构、18 项行为测试、构建、32 文件包检查）；README 的四个标题与图片路径已核对，所有 shell 示例通过 `bash -n`，仅检查语法，未执行安装命令。本轮没有新增 Desktop／Web 运行验证，npm 公开发布仍未开启。

## 本轮工作区清理

清理一次性探测脚本、旧 Web 日志、重复截图、参考项目下载与 app.asar 提取缓存，共移除 145 个文件／目录入口、35.93 MiB；保留开发依赖、npm 缓存、设计参考图、最新验收证据、隔离 Web profile，以及配置备份和它们引用的 8 个 tarball，全部 tarball 清理前后 SHA-256 一致。当前 Desktop profile 仍引用 `artifacts/install-balanced-spacing-final/dsh-ccd-style-0.1.0.tgz`。

移除已删除计划文件的文档引用，实施状态与待办改为当前结论；根目录 `/lib/` 忽略规则不再误隐藏 `scripts/lib/platform.mjs`。文档检查自动发现现有 Markdown。两张用户截图按内容重命名并展示在 README，原图 SHA-256 未变。开发工具移除废弃的侧栏补偿参数／读数，响应式检查按当前 80×22px 轨道判断；CSS 预览说明改为实际的显式 clear 行为，并注明不覆盖运行时适配。

本轮没有修改业务或样式、没有安装或重载 DSH，也没有新增 Desktop／Web 运行验收。清理后 `npm run check` 通过；另将 Git 可见的现有源码复制到临时目录，只复用开发依赖，不带忽略的构建产物或本地缓存，完整检查同样通过，临时副本已移除。所有开发脚本通过 `node --check`；本轮没有实际连接 CDP 执行这些工具。客户端构建 SHA-256 仍与最近交付记录一致。

## 最近一次本地完整检查

2026-10-02 顶栏图标簇与模型／effort 分离后 `git diff --check` 与 `npm run check` 全部通过：类型、架构、26 项行为测试、构建、43 文件安装包检查。测试覆盖清理逆序与幂等、激活资源所有权、失败回滚、菜单定位恢复、统计几何与短读数、视图滑块、提示语／aria-label 的条件恢复、顶栏视图的注册与降级，以及「打开方式」标注的逐条恢复。

这类检查证明源码与窄夹具行为，不证明真实 Desktop 的视觉或发送流程。安装包包含 `lib/`、patch、README、LICENSE 与 package.json；开发工具和截图不进入包。

## 最新布局运行验收（2026-10-02）

环境：隔离 `.cache/verify/home-web`，DSH `0.2.0-rc.2` 官方 Web 客户端、正式插件加载，端口 19570；Playwright Chromium，启动后设置 macOS 标记；1280×820 @2x。实际拖动右栏，覆盖短标题、长标题、左栏收起与 400／520／640／700px 聊天列；关闭右栏另测 1000px。

| 项目 | 结果 |
| --- | --- |
| 顶栏间距 | 标题至视图轨道、轨道至团队入口均为 10px |
| 拖动同步 | 195 次采样，各标题／收起状态内整轨位移范围为 0；短标题相对列左边缘 56px，长标题 126px，收起态 162px |
| 轨道与滑块 | 轨道 80×22px、每格 40×22px，滑块偏差为 0 |
| 布局边界 | 顶栏裁切、控件重叠、统计重叠、横向溢出均为 0，发送按钮保持在面板内 |
| 提示语与输入 | 新建页与聊天页默认文案一致；窄列提示语单行，真实多行草稿使面板正常增长 |
| 原生入口 | 团队／模型菜单和视图切换可达；更多操作、更多打开方式出现原生 menu，Escape 可关闭 |
| 渲染异常 | 0 pageerror |

本地证据：`output/playwright/header-balanced-spacing/` 的同尺寸截图、`header-detail.png` 与 `geometry.json`。该轮的探测脚本已被 `.verify/header-icon-cluster.mjs` 取代——旧脚本用字符串替换拼 before／after，其替换目标在当前 CSS 中已不存在；新脚本按当前选择器量测。两者都使用当前隔离 profile 的测试会话与本机浏览器路径，不是可移植自动测试。

边界：该轮没有刷新用户 Desktop 或冷启动 Electron。完整统计结构使用同版本宿主 DOM 补充夹具，不代表真实统计详情数据端到端通过；没有发送消息。

## 其他仍适用的运行结论

| 场景 | 验证范围与边界 |
| --- | --- |
| macOS 侧栏按钮 | 官方 Web macOS DOM 下展开／收起位置 88/11，全屏属性下 12/11；逐帧 hit-test 无空帧或位移。没有在真实 Electron 中实测系统红绿灯与全屏切换 |
| Composer 增长与附件 | 官方文件选择与真实多行编辑器；1／8／20 行面板为 42／210／336px，按钮底边间距保持 9px。未模拟剪贴板 paste 或拖拽叠层 |
| 停止／发送双按钮 | 宿主 DOM 结构夹具验证 24px 按钮与 6px 间距、16px 图标；未重跑真实请求组合 |
| 底边菜单 | 同版本 Web 的真实账号／模型／工作区菜单，放得下时不写高度上限，离开固定 menu 表面后撤掉标记与上限 |
| 未选工作区 | 实际 Web 新建页仅输入面板显示虚线，发送保持禁用；未完成目录选择的端到端流程 |

保留证据：`docs/verification/local/sidebar-anchor/`、`output/playwright/composer-controls.json` 与对应最终截图、`docs/verification/local/web-hero-menu-above*.png`。详细旧记录与限制可从上述 Git 提交查看。

## 真实 Desktop 基线（2026-10-01）

环境：DSH `0.2.0-rc.2`，Electron 44.0.0，macOS arm64。真实窗口 1280×820；同尺寸对照使用 1374×871、dpr 2 的 CDP 设备指标覆盖。

| 层次 | 已确认 |
| --- | --- |
| 安装与配置 | 正式 CLI 将包加入 profile dependencies 与 bundles；自动生成设置开关，默认关闭 |
| 启用／停用／恢复 | 根属性与插件样式挂载、释放、重新挂载；原生界面恢复 |
| 界面重载 | ⌘R 后自动载入与挂载 |
| 冷启动 | 用户完整重启后服务端启动图包含插件，无新增 web-boot 崩溃；未用 CDP 复验冷启动后的渲染层 |
| 基础交互 | 测试会话的中文多行输入、发送、停止、工具展开、模型／权限与设置访问通过 |
| 响应式 | 900×700、760×640、侧栏隐藏与右栏打开时的基础几何通过 |

这些结果来自早期 Desktop 构建，不能替代最新布局的 Electron 复验。Desktop 截图与对照保留在 `docs/verification/local/desktop-*.png`、`compare-*.png` 和 `responsive/`，仅作对应构建的历史基线。

## 上一次 Desktop 安装交付（布局）

2026-10-02，正式 CLI 已安装 `artifacts/install-balanced-spacing-final/dsh-ccd-style-0.1.0.tgz`。交付时包内、仓库与安装副本客户端逐字节一致，SHA-256 为 `76b86e3e5bff3ded43f7dea2f0b42d17c6c75d98daf906c104adfdefb9d752de`。用户 patch 与备份逐字节相同；备份在 `.cache/verify/desktop-before-balanced-spacing/`。这是交付时记录，本轮没有重新检查运行中渲染进程的加载字节。

当前开发构建可由 `npm run build` 重建。重装须使用新的 tarball 路径，不能覆盖 profile 或备份仍引用的安装包；升级与回退见 [安装指南](../install.md)。

## 预览页已移除（2026-10-03）

静态预览页（原 `showcase/`、`scripts/build-showcase.mjs`、Pages 工作流）已按用户要求整体删除：仿真宿主外壳与真机偏差明显，展示价值不足以支撑维护成本，README 不再提供在线预览。本文件早前各轮里提到 `showcase/`、以「预览页实测／预览页视觉验收」为证据的条目都是当时的记录，对应证据图仍在 `docs/verification/local/showcase/`（仅本地，不随仓库发布）；此后新改动不再有这条验收路径，界面结论以真实 DSH 运行与同尺寸截图为准。

## 统计卡片进入配置页（2026-10-03）

用户核对「统计卡片（默认关闭）吗？有配置项吗」后要求把它放进配置页。此前 `features.statistics` 只在 Host schema 里（YAML 进阶字段），配置页「模块」节只列 shell／sidebar／new-session／conversation／composer-pet 五项。

改动：`features/settings/ConfigPage.tsx` 的 `OFFERED_FEATURES` 追加 `statistics`（排在末尾；页面注释写的是「真正会挂载东西的模块」，卡片本身就是 `implemented` 的 FeatureDefinition）。`features/settings/locales.ts` 两条文案由「常驻统计／Persistent statistics」改为「统计卡片／Statistics card」：这一行只控制卡片显不显示，聚合本身随插件总开关常驻，旧名字描述的是聚合。Host `Config`、默认值（`false`）与 `apply.ts` 的订阅路径都没动。

为什么不需要新的代码路径：`apply.ts` 订阅 `configForms` 片段，配置变化时先释放旧作用域再 `mountFeatures(FEATURES, …)`，因此这一行与其它五行走同一条即时生效路径——打开即挂载卡片、关闭即释放，不需要重启。

**本地检查。** `npm run check` 全绿：类型、架构与颜色归属、133 项测试、构建、包内容 72 文件。

**真实运行：安装已交付，界面验收待重载确认。** 先前查 CLI 时只看了 PATH 与 `~/.dsh/dsh-runtimes`，漏掉应用自带的那一份；实际入口是 `<应用>/Contents/Resources/runtime/cli/bin/dsh`（[安装指南](../install.md) 第 1 节已登记，`--version` 读作 `0.2.0-rc.2`）。本轮按安装指南第 2 节执行：profile 配置备份到 `.ccd-style-backup.SsTN0B`，`npm run pack:local` 产出 72 文件的 `artifacts/install.2NMCUd/dsh-ccd-style-0.1.0.tgz`，由正式 CLI `plugin --profile desktop add` 装入。装入副本的 `lib/client.js` 与仓库构建逐字节一致（SHA-256 `2ba63c4cf8e2ebe9b7b99ab7951eacd9af66043de89ff28cad8989e7a070bd82`），包内已含 `OFFERED_FEATURES = [… "composer-pet", "statistics"]` 与 zh `feature.statistics`＝统计卡片、en＝Statistics card。用户配置里 `features.statistics` 本来就是 `true`，重载后这一行应显示为开。**运行中渲染进程尚未复验**：应用没有开 CDP 端口（只有 GUI 的 `127.0.0.1:19387`），界面验收等用户按 ⌘R 重载后确认；重载仍看不到时按安装指南第 6 节顺序检查 loader 停用与 `config.enabled`。

**顺带修复（与本轮改动无关）。** 首次运行时 `tests/composer-pet.test.ts` 第 316～317 行报 TS2532：并发进行的鲸鱼喷水文案工作留下 `noUncheckedIndexedAccess` 下的数组下标访问，改为先取 `bands[0]!` 再读两段百分比，测试逻辑不变。

## 下一次验收

本地执行 `npm run check`；界面变化按同尺寸截图核对，并针对生命周期或业务入口变化验证相应行为。Desktop 工具、隔离 Web 工具和依赖要求见 [当前实现](IMPLEMENTATION.md)。

尚未覆盖的真实运行场景集中在 [待办](TECH_DEBT.md)。设计参考图在 `docs/reference/`、验收证据在 `docs/verification/local/`、本机截图在 `assets/`，都不随包或仓库发布。
