# 验证记录

更新日期：2026-10-02。只记录实际运行结果。**源码检查、测试夹具与真实 Desktop 验证分开记录**，前者不能替代后者。

## 提交前本地检查（2026-10-02）

按用户要求先保存当前工作区版本。`git diff --check` 与 `npm run check` 全部通过：类型、架构、18 项行为测试、构建及 32 文件安装包检查。本轮没有新增真实 Desktop／Web 运行验证；界面验收沿用下方各轮已记录的证据和边界。README 当前为待补全草稿，npm 发布开关仍为 `private: true`，尚未执行公开发布。

## 顶栏可见间距对齐（2026-10-02，用户截图反馈）

用户截图中标题到视图轨道的距离明显大于轨道到团队图标的距离。原因是标题自带 8px 右内边距，再加 2px 轨道 margin，前一处可见距离为 10px；团队按钮去掉内边距后后一处仅 2px。修复将轨道到团队入口固定为 10px，各宽度仍用同一规则，轨道及按钮尺寸不变。标题子项的 max-width 约束到自身父盒内，让长标题的省略号与右内边距正常保留。

为让左栏收起、400px 聊天列也能保留上述间距，尾侧打开应用主按钮横向内边距从 5px 收为 3px，更多操作宽度从 28px 收为 24px，图标尺寸不变，全部原生按钮保留。新选择器从只读本机 app.asar 的 ui-open-in-app 与 session-log-export 包核对，登记在 host-dom.ts。

运行验收：隔离 `.cache/verify/home-web`，正式 Web 19570 加载最终构建，Playwright Chromium、macOS 标记；1280×820 @2x，实际拖动右栏覆盖短标题、长标题、左栏收起状态与 400／520／640／700px，关闭右栏测 1000px。两处可见间距各档均为 10px；195 次采样中短标题／长标题／收起态整轨位移范围均为 0，轨道 80×22px、按钮 40×22px、滑块偏差为 0。全部顶栏裁切、控件重叠、统计重叠及横向溢出为 0，发送按钮仍在面板内，0 pageerror。新会话统一提示语与多行输入仍正常。

证据：`output/playwright/header-balanced-spacing/` 的同尺寸截图、局部 `header-detail.png` 与 `geometry.json`；脚本不随包分发。原样加载正式构建，报告 before／after 为同一构建，不作为前后对照。

边界：官方 Web 验证，未刷新用户 Desktop 或冷启动 Electron；统计齐全的几何使用补充夹具，不替代真实统计详情数据验证。

补充交互：点击「更多操作」「更多打开方式」均出现 1 个原生 menu，Escape 可关闭。最终 pack 的 prepack 全部通过（类型、架构、18 项行为测试、构建、32 文件包检查）。正式 CLI 已从 `artifacts/install-balanced-spacing-final/dsh-ccd-style-0.1.0.tgz` 更新 desktop 插件；包内、仓库、安装副本客户端逐字节一致，SHA-256 `76b86e3e5bff3ded43f7dea2f0b42d17c6c75d98daf906c104adfdefb9d752de`。用户 `cordis.patch.yml` 与备份逐字节相同，备份在 `.cache/verify/desktop-before-balanced-spacing/`。隔离服务已关闭，用户窗口需 ⌘R 加载新构建。

## 新会话提示语与正常聊天统一（2026-10-02，用户追加要求）

最终按用户要求将新会话默认提示语统一为正常对话的「发消息或创建任务, / 调用指令, @ 文件或对话」，并使用对应英文宿主文案。统一文本与 aria-label，不替换官方 Composer，不改草稿、输入与发送逻辑；工作区选择、阻断及未知语言提示保留。单行省略与整组视图按钮位置修复一并交付。

最终验收：隔离 `.cache/verify/home-web`，正式 Web 19569 加载最终构建，Playwright Chromium、macOS 标记；400px 与 1094px 新会话提示语均与正常聊天逐字相同，窄列高度 24px，aria-label 同文；三行草稿使面板从 42px 增至 90px。重新完成 195 次真实右栏拖动采样：短标题相对聊天列 x=56px，长标题 x=126px，左栏收起 x=162px，各状态内整轨位移为 0，轨道始终 80×22px，滑块偏差为 0。全部顶栏裁切、控件重叠、统计重叠与横向溢出为 0，原生团队／模型菜单和视图切换可达，0 pageerror，未发送消息。

证据：`output/playwright/header-unified-placeholder/` 的截图与 `geometry.json`，脚本 `.verify/header-unified-placeholder.mjs` 不分发。此轮原样加载构建，不替换 CSS 或 placeholder 文案。新增 3 项行为测试验证默认文案与无障碍标签、宿主特殊提示优先、语言变化及停用恢复。

边界：以上为官方 Web 验证，未刷新用户 Desktop 或冷启动 Electron；完整统计结构的几何仍用补充夹具，不代替真实统计详情数据验证。

本地与交付：最终 `npm pack --cache .cache/npm --pack-destination artifacts/install-unified-placeholder-final` 的 prepack 全部通过（类型、架构、18 项行为测试、构建、32 文件包检查）。正式 CLI 已更新现有 desktop 插件，包内、仓库、安装副本的客户端逐字节一致（SHA-256 `4a2211ecbf893d4e56788eb35b173e2a566f33f6a6166554e7b17dc8f1905d05`），LICENSE 一致；用户 `cordis.patch.yml` 与更新前备份逐字节相同，备份在 `.cache/verify/desktop-before-unified-placeholder/`。隔离服务已关闭，用户窗口需 ⌘R 加载新构建。

## 整组视图按钮位置与新会话提示语（2026-10-02，用户复验）

用户明确报告的是整组按钮左右移动，而非内部滑块错位。前轮只验证尺寸与滑块相对几何，遗漏整轨在聊天列中的坐标：同一「你好」会话在 400／640／1000px 列中，轨道相对列左边缘为 56／64／72px。原因是顶栏 padding、相邻 margin 按容器断点变化，长标题的 flex 收缩也推着后续按钮移动。

修复：顶栏各宽度统一左内边距 12px、相邻间距 2px，移除宽度断点；标题保留自然宽度、上限 112px、不随列宽收缩。macOS 左栏收起时省略会话标题，保留宿主窗口控件让位空间，确保 400px 列仍能容纳固定视图按钮、完整团队入口和全部操作按钮。控制组仍随聊天列本身的位置变化，不绝对固定到窗口上。

追加问题：新会话和聊天页使用同一个原生 placeholder，但新会话文案更长；400px 列下旧样式实测为 48px 两行，短聊天提示语为 24px 一行，输入面板只有 42px。修复共享 placeholder 的左右约束和 nowrap／hidden／ellipsis，仅提示语单行省略，实际编辑器不变。

运行：隔离 `.cache/verify/home-web`，正式 DSH Web 19568 加载构建，Playwright Chromium、macOS 标记，1280×820 @2x 实际拖动右栏，短标题、长标题及 900×700 左栏收起状态覆盖 400／520／640／700px；关闭右栏另测 1000px。

| 项 | 结果 |
| --- | --- |
| 整组位置 | 195 次逐步拖动采样：短标题始终距聊天列左边缘 56px，长标题 126px，左栏收起 162px；各状态内位移范围均为 0px |
| 尺寸与滑块 | 轨道全部为 80×22px、每格 40×22px，滑块左边缘与宽度偏差均为 0px |
| 提示语对照 | 同页仅恢复旧 placeholder 样式：新会话原生文案高度 48px，恢复最终样式后为 24px，显示省略号；长中文标点补充夹具同样单行 |
| 真实多行输入 | 新会话实际填入三行草稿：placeholder 消失，输入面板从 42px 增至 90px，发送按钮仍在面板内，未发送消息 |
| 布局与入口 | 各档顶栏裁切、控件重叠、统计重叠及横向溢出均为 0；团队 dialog、模型菜单与视图切换仍可用，0 pageerror |

证据：`output/playwright/header-stable-position/` 的同尺寸截图与 `geometry.json`；脚本 `.verify/header-stable-position.mjs` 不随包分发。整轨坐标与尺寸来自原样加载的构建；仅 `heroPlaceholderBefore` 临时恢复旧 placeholder 样式作前后对照，随后立即移除。

边界：官方 Web 验证，未刷新用户 Desktop 或冷启动 Electron。统计齐全的几何仍用同版本宿主结构补充夹具，不代替真实统计详情数据验证。新增的兼容层 placeholder 选择器只是已有宿主类的来源登记，不改变运行行为。

## 固定视图按钮、恢复团队标签与宽列读数（2026-10-02）

按最新需求移除会话顶栏不可点击的模式展示，智能体团队恢复完整文字与图标；对话／轨迹两格固定为每格 40×22px（整轨 80×22px），统一调矮且不随列宽缩放。最窄列只压缩外部间距和团队按钮内边距，保留全部操作入口。统计不再全局隐藏数字：宽列展示宿主标签中的速率和 token 简短读数；Composer 实际容器 ≤700px 时前两项只留图标，上下文百分比始终显示，仍为同一行。宿主原始文字与详情回调不变。

验收：隔离 `.cache/verify/home-web` profile，官方 Web 19567 正式加载最终构建，Playwright Chromium、macOS 标记，1280×820 @2x 实际拖动宿主右栏分隔条，覆盖 400／520／640／700px 及关闭右栏的 1000px；另测 900×700 左栏收起、400px 聊天列、长标题、多行草稿、新建页与菜单。

| 项 | 结果 |
| --- | --- |
| 固定按钮尺寸 | 90 次逐步拖动采样全部为轨道 80×22px、按钮 40×22px；滑块左边缘与宽度偏差均为 0 |
| 模式与团队 | 模式 display=none；各档团队文字完整显示，点击可打开原生团队 dialog |
| 统计恢复 | 400px 补充夹具前两项 after=none；关闭右栏、1000px 列恢复 20 tok/s 与 11.9K tok，上下文 1% 保留 |
| 几何与交互 | 各档顶栏按钮裁切、控件重叠、统计重叠、横向溢出均为 0；发送按钮在面板内；轨迹／对话切换、模型菜单正常，未发送消息 |
| 渲染异常 | 0 pageerror |

证据：`output/playwright/header-fixed-shape/` 同尺寸截图及 `geometry.json`，本地脚本 `.verify/header-fixed-shape.mjs` 不随包分发；该脚本原样加载正式构建，before／after 标签为同一构建，不作前后对照。

边界：上述为官方 Web 验证，未刷新用户 Desktop 或冷启动 Electron。隔离 profile 没有完整真实 token／上下文数据，三统计项的几何用同版本宿主结构补充夹具验证；不据此认定真实统计详情数据端到端通过。行为测试验证短读数随宿主文字更新、自触发 style 通知收敛与停用清理。

本地与交付：最终打包 prepack 全部通过（类型、架构、15 项行为测试、构建、31 文件包检查）。正式 CLI 已从 `artifacts/install-fixed-shape-final/dsh-ccd-style-0.1.0.tgz` 更新现有 desktop 插件；包内、仓库、Desktop 安装副本的客户端逐字节一致，SHA-256 为 `8d4943cb7dc5527a3b11e3ae2204be0ae7f426b195add7cb5c1b2a82f5ed9032`。用户 `cordis.patch.yml` 与备份逐字节相同，备份位于 `.cache/verify/desktop-before-fixed-shape/`。隔离 Web 服务已关闭，用户窗口需 ⌘R 加载新构建。

## 拖动滑块与常驻标签修正（2026-10-01 晚，用户复验）

用户复验发现前轮仍有三处问题：拖动右栏时视图滑块错位，不可点击的「标准模式」被隐藏，模型推理等级在有剩余空间时仍被省略。

修复：视图适配观察框架 style 改动，同一选中按钮的布局变化即时校正，只有切换选中项才使用 180ms 动画；属性未变化时不重复写入。模式文字常驻，最窄列只去掉其辅助图标并缩紧按钮间距与尾侧留白。模型按钮按实测控制行剩余空间限宽，推理等级常驻，模型名按需省略。速率／token 仍只显示图标，上下文保留百分比，控制行仍为单行。

运行验收：隔离 profile `.cache/verify/home-web`，官方 Web 19566，正式插件加载最终构建；Playwright Chromium、macOS 标记，1280×820 @2x，在窗口不变时真实指针拖动宿主右栏，覆盖 400／520／640／700px 聊天列与收回右栏的 1000px；另测 900×700 侧栏收起、最窄 400px 列、三行输入、长标题、新建页、模型菜单与原生视图切换。

| 项 | 结果 |
| --- | --- |
| 拖动同步 | 90 次逐步采样，滑块左边缘与宽度最大偏差均 0px；布局校正 0ms |
| 常驻文字 | 各聊天列均显示完整「标准模式」12px 文字与 High（29.53px 宽）；400px 新建页同样保留 High |
| 单行与边界 | 聊天顶栏 49px、控制行 28px；顶栏被裁按钮、控件重叠、统计与控件重叠、横向溢出均为 0；发送按钮在面板内 |
| 原生交互 | 轨迹与对话可切换，模型菜单可打开，未发送消息；取消启用标记后命名容器恢复 normal |
| 渲染异常 | 0 pageerror |

证据：`output/playwright/header-refinement/` 的同尺寸截图与 `geometry.json`，脚本 `.verify/header-refinement.mjs` 不随包分发。本轮原样加载正式构建，无样式替换；报告中的 before／after 为相同构建，不作为前后对照。

边界：运行结果来自官方 Web 客户端，未刷新用户 Desktop 或冷启动 Electron。隔离 profile 没有完整真实 token／上下文数据，三项统计齐全的几何使用同版本宿主结构补充夹具验证，详情数据交互不能据此认定通过。

本地与交付：最终 `npm pack --cache .cache/npm --pack-destination artifacts/install-header-refinement-final` 的 prepack 全部通过（类型、架构、14 项行为测试、构建、31 文件包检查）。正式 CLI 已更新现有 desktop 插件，包内、仓库、安装副本客户端逐字节一致（SHA-256 `bfe95f3941e9e930dc3268793e0d0c612cbb3f9a3847f6cccae49f5febfe0063`）；用户 `cordis.patch.yml` 与更新前备份逐字节相同，备份在 `.cache/verify/desktop-before-header-refinement/`。隔离服务在验收后关闭，用户窗口需 ⌘R 加载新构建。

## 右栏拉宽后的单行精简布局（2026-10-01 晚，用户报告）

最终需求：顶栏和 Composer 控制行均保持单行；统计区只留速率、token、上下文三个原生图标，仅上下文显示百分比。速率／token 标签不在常驻栏展示，原生详情按钮与可访问名称保留。

根因：dock 绝对定位在模型组左侧，但插件仅观察文本／子节点和窗口 resize，右栏拖动改变的是框架内联 grid 轨道，模型组的原生收缩也可能晚于前次测量，偏移会过期。顶栏溶解成一行后缺少窄列精简规则。模型 trailing 组还包含空 activity 插槽的间距（12px／8px），只量模型按钮不足以定位 dock。

修复：按实际会话列／Composer 容器宽度应用精简样式；隐藏速率与 token 常驻文字，取消文本镜像；窄列模型按钮按 120px／96px 限宽并省略推理等级、权限文字，顶栏团队入口收成图标、模式标签递减、视图按钮缩紧。统计兼容层只发布完整 trailing 组宽度，MutationObserver 增加 style／class／data-model-compact 失效信号，写属性前比较新旧值以免自触发循环。原生 DOM、发送逻辑、框架轨道与应用 app.asar 均未改动。

本地：最终 `npm pack --cache .cache/npm --pack-destination artifacts/install-responsive-final` 的 prepack 全部通过（类型、架构、12 项行为测试、构建、31 文件包检查）。新增两项行为测试覆盖无需窗口 resize 的几何刷新、自身 style 通知的收敛与释放；纯 CSS 用截图量测验收。

运行验收：隔离 profile `.cache/verify/home-web`，官方 DSH Web 客户端 19565、正式插件加载构建；Playwright Chromium，启动后设置 macOS 标记。1280×820 @2x 窗口不变，真实指针拖动宿主右栏分隔条，测聊天列 400／520／640／700px，再收回右栏恢复 1000px。最后用 `--final-only` 原样加载正式构建，不替换任何源码样式表重新完成整轮验收。

| 项 | 结果 |
| --- | --- |
| 单行与遮盖 | 各宽度顶栏始终 49px、控制行 28px；重叠的统计／控件对 0、顶栏被裁按钮 0、横向溢出 0 |
| 三图标 + 上下文百分比 | 同版本原生统计结构的补充夹具（20 tok/s／11.9K tok／1%）：前两项 `::after=none` 且原生标签隐藏，百分比保留；全部仍在同一行 |
| 同尺寸修复前对照 | 同页恢复旧样式、补上旧文本属性：400px 列复现统计压到「+」／权限／模型，以及「更多操作」被裁；恢复最终样式后全部消失 |
| 侧栏收起、多行输入、长标题 | 900×700、400px 聊天列的收起态及三行草稿均无遮挡；长标题在 400px 列省略，顶栏按钮均留在列内；发送按钮均在输入面板内 |
| 原生入口 | 点击轨迹后 aria-selected=true，再切回对话；点击模型按钮出现原生菜单；没有发送消息 |
| 新会话与作用域 | 400px 与 1094px 列的空白页顶栏仍 40px、面板 42px、控制行 28px，空 dock 不占第二行；移除启用标记后会话容器类型恢复 normal |
| 渲染异常 | 两轮最后验收均 0 pageerror |

证据：`output/playwright/rightbar-responsive/` 是同页前后对照，`output/playwright/rightbar-responsive-final/` 是正式构建原样加载的截图与 `geometry.json`；本地脚本 `.verify/rightbar-responsive.mjs` 不随包分发。

边界：这是官方 Web 客户端验证，未刷新用户 Desktop 或执行 Electron 冷启动。隔离 profile 只有失败请求的原生轮数图标，无真实 token 统计／上下文；三图标齐全的几何用上述结构夹具补测，不能当作真实速率或 token 详情面板的端到端验证。原生按钮的处理函数、可访问名称与节点均保留。

交付：正式 CLI 从 `artifacts/install-responsive-final/dsh-ccd-style-0.1.0.tgz` 更新现有 desktop 插件。包内客户端、仓库构建、Desktop 安装副本的 SHA-256 均为 `80630b51f3857ade4ea52c5d68de964cbbc543d7a5fb9d3dacb75e068a090326`；用户 `cordis.patch.yml` 逐字节保持原样，更新前配置备份在 `.cache/verify/desktop-before-responsive/`。隔离服务已关闭。用户正在使用的窗口需 ⌘R 加载新构建。

## 新会话未选工作区的外层虚线（2026-10-01 晚，用户报告）

根因：官方 `InputBar` 在未选工作区时给卡片加 `.yhfFVG_cardWorkspaceTrigger`，其 `::after` 画覆盖整张卡片（包括控制行）的虚线。插件已让输入面板自己画边框，但遗漏这个伪元素，造成双层边框。按用户要求把虚线移到当前输入面板：仅在插件作用域内设该伪元素 `content: none`，该状态下的输入面板用 `border-style: dashed`；选好工作区后恢复实线，不改原生选择工作区事件或编辑禁用状态。

本地：`npm run check` 通过（类型、架构、10 项行为测试、构建、31 文件安装包检查）；纯 CSS 改动未增加重复断言测试。

实际官方 Web 客户端：独立临时 profile `.cache/verify/dashed-home`、端口 19564、正式插件加载仓库构建，Playwright Chromium 1382×875，设宿主 macOS 标记。移除该临时 profile 的默认工作区记录后从原生入口进入新会话，真实卡片带 `cardWorkspaceTrigger`。修复前截图同页恢复旧 `content: ""` 复现双框；最终重新载入正式构建后外层伪元素为 `none`，面板为 770×42、1px 虚线，发送仍禁用。另一有工作区的隔离 profile（19563）面板为 1px 实线。移除启用属性后，宿主外层虚线恢复（`content: ""`、`border-style: dashed`）。最终截图：`output/playwright/dashed-final{,-card}.png`，与 `dashed-before{,-card}.png` 同尺寸视觉检查通过。原生点击／Enter 处理保留并从官方 InputBar 源码核对；无工作区的目录选择未完成，不把它计为本轮端到端验证。

边界：这是同版本官方 Web 客户端验证，未主动刷新用户正在使用的 Desktop，也未执行本轮 Desktop 冷启动验证。

交付：最终 `npm run pack:local --cache .cache/npm` 通过全部 prepack 检查，通过官方 CLI 从唯一路径 `artifacts/install-dashed-final/dsh-ccd-style-0.1.0.tgz` 更新现有 Desktop 插件；安装副本与仓库 `lib/client.js` 的 SHA-256 一致，用户 `cordis.patch.yml` 逐字节保持原样。更新前 profile 配置备份在 `.cache/verify/desktop-before-dashed/`。用户正在运行的渲染进程需 ⌘R 加载新构建；本轮隔离浏览器与两个 Web 服务已关闭。


## 侧栏按钮固定到窗口控制区（2026-10-01 晚，用户报告）

用户要求：侧栏展开／收起按钮应一直留在红绿灯右侧，点击前后不换位置。此前只对齐宿主侧栏内的交接位置，未对齐真正的 macOS 收起态 shell 入口；本轮取代前文相关「不跳位」结论。

根因：展开态原生按钮在 `SidebarRoot.topStrip`，插件的 `margin-left: auto` 把它推到侧栏右端（隔离环境 x=252）；收起态原生按钮由 `HeaderLeadingControls` 渲染到框架 `[data-shell-leading]`，坐标为 x=88。两者属于不同容器，因此仅修侧栏内的布局无法保持窗口坐标。

修复：macOS 两个原生入口共享横坐标变量（非全屏 88、全屏 12），纵坐标 11、28×28。展开态按钮 fixed 定位以避开侧栏列宽动画中的裁剪；框架发布收起态时立即隐藏旧按钮，由原生 shell 入口响应。原生回调、快捷键、窗口拖动区域和非 macOS 图标轨保留，不增加注册或观察器。

环境：隔离 `.cache/verify/home-web` profile，正式插件加载仓库构建，DSH Web 服务 19562；Playwright 无头 Chromium。启动后设置宿主的 `data-platform=darwin` 并通过原生侧栏切换触发重新渲染，确保量到真实 topStrip／shell.leading；不是合成按钮。新建页按 1374×871、聊天页按用户截图的 1280×820 @2x 验收（PNG 2560×1640）；窄窗口另测 900×700。修复前截图在同一页面把 sidebar 样式表替换为本轮改动前的文本。

| 项 | 结果 | 实测 |
| --- | --- | --- |
| 普通窗口展开／收起／再展开 | 通过 | 可见按钮均为 `[88,11,28,28]`，中心点 hit-test 命中对应原生按钮 |
| 全屏状态展开／收起／再展开 | 通过 | 可见按钮均为 `[12,11,28,28]` |
| 动画交接 | 通过 | 普通、全屏、窄窗口 6 次切换，每次 32–33 帧；所有帧命中同坐标原生按钮，无空帧或位移 |
| 收起时旧按钮 | 通过 | 侧栏内旧按钮 visibility=hidden，只有 shell 按钮可见且可点击 |
| 窄窗口与 Web 轨道 | 通过 | 900×700 macOS 手动展开与收起均为 `[88,11,28,28]`；移除 darwin 标记后原生 Web 图标轨为 `[10,18,36,36]`、relative 定位 |
| 聊天页顶栏 | 通过 | 保持 49px 高，无横向溢出；收起态标题位于 shell 控件后，同尺寸截图检查无遮挡 |
| 样式作用域恢复 | 通过 | 移除根启用属性后回到宿主 `[240,11,28,28]`；恢复属性后为 `[88,11,28,28]`。此处只验证 CSS 作用域，并非本轮重新执行插件开关生命周期 |
| 控制台与本地检查 | 通过 | 0 pageerror；npm run check 与打包 prepack 检查通过（10 项测试、31 个包内文件） |

截图和逐帧量测：`docs/verification/local/sidebar-anchor/`（before-expanded、expanded、collapsed、reexpanded、fullscreen-*、narrow-*、geometry.json）。本轮脚本 `.verify/sidebar-anchor.mjs` 为本地验收工具，不随包分发。

交付：`npm run pack:local --cache .cache/npm` 生成安装包，通过官方 `dsh plugin --profile desktop remove/add` 重装现有样式插件；同版本直接 add 曾复用旧文件，因此用重装后哈希确认。安装副本、tarball 内客户端与仓库构建 sha256 均为 `dd8119b7a23c3b71c9d1bfe10474e795c5c5f2befe7af69051dd9731672b9e79`。桌面进程未刷新或重启，用户按 ⌘R 后加载新构建。

限制：这是同版本官方 Web 客户端的 macOS DOM 验证，未在真实 Electron 窗口中实测系统红绿灯、全屏切换或拖动。全屏通过宿主状态属性验证；截图不含原生红绿灯。桌面端最终观感需刷新后确认。

## 图片圆角与发送／停止按钮固定到底部（2026-10-01 晚）

需求：图片缩略图与输入框圆角一致；发送与停止换成已有图标样式；输入框向上增高时按钮保持在原地。

实现：缩略图与输入面板共用 10px 圆角。发送／停止的 16px 遮罩复用 DSH 静态共享库 `ui-primitives` 的 `IconSendOutlineRegular`／`IconStopFillRegular`，MIT 版权说明随 `LICENSE` 发布。官方按钮保持原有状态、标签与事件；用控制行顶边作为定位基准，按钮底边距输入面板底边固定 9px。生成中继续输入时，两个主按钮横向错开 30px（24px 按钮 + 6px 间距），编辑器相应预留 60px。

运行环境：已有的隔离 DSH Web profile（`.cache/verify/home-web`，19559），真实插件构建经 profile symlink 载入；Chromium 1382×875 @2x，在 Web 启动后加 macOS 样式标记。编辑用实际键盘 `insertText` + Shift+Enter，图片通过官方文件选取入口进入同一附件管线。同页临时注入旧的顶部定位／20px 图片圆角／回车遮罩生成修复前对照。

| 项 | 结果 | 实测 |
| --- | --- | --- |
| 图片圆角 | 通过 | 旧缩略图 20px → 10px，与 `--ccd-composer-radius` 完全一致；原有 image clipping 保留 |
| 新建页增长 | 通过 | 1／8／20 行：面板高度 42／210／336px，顶边 y=796／628／502；按钮始终 y=805、24×24，底边距面板底边 9px，20 行时编辑器正常滚动 |
| 附件加入 | 通过 | 预览轨把整体表面向上扩展，按钮仍是 (1174.5,805)，不会跟着附件轨升到旧位置 y=729 |
| 聊天页增长 | 通过 | 面板 42→138px，按钮始终 (1174.5,805)，面板底边始终 y=838 |
| 停止／双按钮外观夹具 | 通过（仅布局） | 用宿主实际停止 SVG 结构作临时 DOM 夹具：单个停止按钮维持 y=805；两个按钮 x=1144.5／1174.5、y 同为 805，间距 6px，分别采用停止／发送遮罩 |
| 窄窗口 | 通过 | 900×700、760×640：按钮完全在面板内，底边间距仍为 9px，横向 overflow=0 |
| 控制台 | 通过 | 最终运行 0 console error／pageerror |
| 本地检查 | 通过 | `npm run check`：类型、架构、10 项行为测试、构建与安装包检查全部通过；CSS 没有添加重复断言测试 |
| 打包与 Desktop 安装 | 通过 | `npm run pack:local --cache .cache/npm` 生成 31 文件包；官方 CLI 用唯一路径 `artifacts/install-composer.7iDTf9/dsh-ccd-style-0.1.0.tgz` 更新现有插件，profile 配置备份在 `.cache/verify/composer-backup-path.txt` 指向的目录 |
| 安装字节核对 | 通过 | Desktop 安装副本与仓库 `lib/client.js` 逐字节一致（SHA-256 `4c5902dec5ee7566b2a7c0bcc003f516d330f96d2932f5c7c31d177960edc8c1`）；`LICENSE` 同样一致，profile 中 bundle 仍只有一个 |

截图与数据：`output/playwright/composer-attachment-{before,after}.png`、`composer-lines-{1,8,20}.png`、`composer-dual-controls.png`、`composer-active-multiline.png`、`composer-stop.png`、`composer-{900,760}.png`、`composer-controls.json`（本地忽略，不进入包）。

边界：本轮是实际 DSH Web Composer 的样式验证，不是原生 Desktop 冷启动验证。已更新 Desktop 安装包，用户正在运行的渲染进程需 ⌘R 重新载入；本轮未主动刷新或重启用户应用。隔离 profile 无 API Key，因此停止态与双按钮态只验证了对应宿主 DOM 结构的图标及几何，没有发送模型请求或重复验证停止回调。粘贴事件本身未模拟，附件采用同一 intake 管线的文件选择入口。

## 粘贴的图片预览悬在输入框外、发送按钮飞出面板（2026-10-01 晚，用户报告）

用户报告：把截图粘进 Composer 后，图片预览渲染在输入框外面（盖住面板顶边），`↵` 发送按钮也飞到面板外的右上角。

根因：`ui-attachment` 插件把图片预览轨（`.dVdiKa_rail`）渲染成输入面板（`.yhfFVG_scroll`）的**兄弟节点**、位于卡片里面板之前；本插件把卡片外壳透明化、让面板画边框后，预览轨悬在面板上方的页面上（宿主原生布局用 `margin-bottom: -6px` 把它拉进白底卡片，透明卡片下这 6px 变成压在面板顶边上的悬空）；发送按钮绝对定位到卡片右上角（`top: 8px`），预览轨把面板推下来后按钮跟着落在预览轨的高度上——两者都在面板外。

环境：隔离 `DSH_HOME`（`.cache/verify/home-web`，profile 的 `node_modules/dsh-ccd-style` symlink 指向本仓库、`ui-skin-ccd-style` 配 `enabled: true`），`dsh web --no-open --port 19558`，无头 Chromium 按 1382×875 @2x 取图（启动后设 `data-platform="darwin"`）。附件经 Composer 自带的隐藏 `input[type=file]` 注入（React 的 `onPickFiles` → `intakeFiles`，与粘贴进编辑器走同一条附件管线）。「修复前」在**同一页**注入修复前的声明（预览轨透明、`margin-bottom: -6px`、面板恢复顶盖）复现；「修复后」是构建的真实渲染。

| 项 | 结果 | 实测 |
| --- | --- | --- |
| 复现（修复前） | 通过 | 预览轨 `y=721..790`、透明底无框，面板顶边 y=796：预览悬在框外并压住面板顶边；发送按钮 `[1174.5,729 24×24]` 在面板（y=796..838）外，与用户截图一致；截图 `web-composer-attachment-before.png` |
| 修复后（表面合并） | 通过 | 预览轨画顶盖：`1px rgb(224,224,223)`、上圆角 10px、白底、`margin-bottom: 0`、尾侧内边距 38px 预留发送按钮；面板去掉顶盖（`border-top-width: 0`、上圆角 0）；预览轨底边（796）与面板顶边（796）贴合、左右边缘同为 x=442.5..1212.5，两侧边框贴合无缝 |
| 发送按钮回到面板内 | 通过 | `[1174.5,729 24×24]` 完全落在合并表面（预览轨顶盖 y=721 + 面板 y=796..838，x=442.5..1212.5）内；无附件时基线不变：面板 770×42（y=796..838）、按钮 `[1174.5,804 24×24]` 在面板内 |
| 控制台 | 通过 | 两轮运行均 0 error／error 以上信息；`Failed to load plugins` 是无凭据 Web profile 首屏的既有 warning |
| 本地检查 | 通过 | `npm run check`：类型检查、架构边界、5 项测试、构建、安装包检查（31 个包内文件）全部通过 |
| 交付 | 下一轮 | `npm pack --cache .cache/npm --pack-destination artifacts` 重打 `artifacts/dsh-ccd-style-0.1.0.tgz`；desktop profile 的重装与真实观感需用户刷新（⌘R）后确认 |
| 未覆盖 | — | 粘贴（paste）事件本身未模拟：附件经同一条 `intakeFiles` 管线的文件选取路径注入，粘贴路径的 DOM 结果相同（同一预览轨组件）；拖拽叠层（`DropOverlay`）未验证 |

截图：`docs/verification/local/web-composer-attachment.png`（修复后全页）、`web-composer-attachment-before.png`（同页注入修复前声明）、`web-composer-attachment-seam.png`（修复后 Composer 特写：合并表面连续边框、预览与 `↵` 都在框内）。

本轮只改 `src/client/theme/composer.css`（新增两条有预览轨时的合并规则）与 `src/client/compat/host-dom.ts`（钉入 `dVdiKa_rail` 类名）；未改任何 JS 行为、注册或宿主节点。

## 底边菜单被裁成滚动条（2026-10-01 晚，用户报告）

用户报告：账号菜单只画到「意见反馈」，下面的「退出登录」看不到、右侧出现滚动条；模型选择菜单同样只显示一部分，其余要滚动。两处都点名「之前不是这样的，某个改动导致的」，要求找出并修复。

根因（同一处写入的两个后果，都在未提交的「底边菜单翻转 + 高度上限」轮里引入）：`compat/composer-menus.ts` 之前给**每一张**翻转到锚点上方的卡片都写 `max-height = 量到的高度`。

1. 账号菜单：`compat/account-menu.ts` 在卡片打开后才打 `data-ccd-account-menu` 并写 `--ccd-account-name`，本插件自己的 `account-menu.css` 从这时起才画页眉（并加高行）。模块第一次量到的是「没有页眉」的 110px，写上限 110px 后卡片长到 133px，宿主 `.scrollable .viewport` 于是把最后一行滚出可视区。
2. 模型选择菜单：宿主同一个节点在入口格与模型面板之间换 `role`（`role="menu"` → `role="group"`）。入口格上写下的 110px 上限留在节点上，面板内容 144px 被它裁掉——这就是用户「只展示部分」的模型菜单。

修复：放得下的卡片一律不写上限（上限只在卡片高于锚点上方剩余空间时才写，且上限就是那段空间）；卡片离开「固定 `[role="menu"]` 表面」后撤掉自己写过的标记与上限；未加限的高度改为每次校正用卡片实时盒子刷新（实测 `ResizeObserver` 在遮挡窗口一次都不投递，不能当失效信号）。

复现与验证环境：工作区内的隔离 `DSH_HOME`（`.cache/verify/home-web`，`dsh web --no-open --port 19557`；收尾的真实菜单复验把该 profile 复制到 `.verify/menu-home` 后起在 19561）、profile 的 `node_modules/dsh-ccd-style` 指向本仓库、`ui-skin-ccd-style` 配 `enabled: true`；无头 Chromium 1374×871 @2x。账号行在这个 web profile 里不注册（无账号服务，页面里没有 `.ZogL4G_trigger`），因此账号菜单用**真实 compat 模块 + 合成卡片**复现：注入 `.ZogL4G_trigger`/`.ZogL4G_label` 与一张宿主 `.list .scrollable` 卡片，由 `account-menu.ts` 自己打标记、自己写名字，页眉也由插件自己的样式表画上（夹具脚本 `.verify/menu-cap.mjs`）。同一脚本还合成模型选择器的「同节点换 role」流程。

| 项 | 修复前（旧构建 `8e2ff315…`） | 修复后（`2052b7c8…`） |
| --- | --- | --- |
| 账号菜单在插件页眉出现后（合成卡片） | 上限 `110px`、实时高度 `133px`、`.viewport` `65/88`、**出现滚动条** | 无内联上限、高度 133、`.viewport` `88/88`、无滚动 |
| 账号菜单底边与账号行 | 贴住（4px）但内容被裁 | 贴住 4px，`top` 随高度从 713 重算到 690 |
| 模型选择器切到模型面板（合成卡片，内容 144px） | 仍带 `110px` 上限、`.viewport` `102/136`、**出现滚动条** | 上限已撤掉（`max-height: ''`、标记消失）、无滚动 |
| 小窗口 522×318 的高卡片（合成，280px） | 上限 258px、`top=12`、`.viewport` `250/272`、卡片内滚动 | 与修复前逐项相同（该分支未改） |
| 真实模型选择菜单（web profile，1374×871） | — | 入口格 `role=menu`：无内联上限、高 76、贴触发器 4px；切到模型面板 `role=group`：标记已撤、无内联上限、宿主 `max-height: 360px`、`.viewport` `90/90` 无滚动 |
| 真实工作区选择器菜单（web profile，1374×871 与 522×318） | — | 两档都放得下：无内联上限、高 83、无滚动（`viewport` `34/34`） |
| 控制台 | 合成夹具两轮均 0 error／warning | 合成夹具与两个真实菜单复验均 0 error／warning |

本地检查：`npm run check` 通过（类型检查、架构边界、**5 项既有 + 5 项新增**测试、构建、31 个包内文件）。新增 `tests/menu-placement.test.ts` 用窄夹具锁住上表的两种回归：把上限写回「等于当前高度」时第 1 项失败，把「离开菜单表面即撤掉」写回「只撤断开的节点」时第 3 项失败（两种旧写法都实测过）。

交付：`npm run pack:local --cache .cache/npm` 生成 `artifacts/dsh-ccd-style-0.1.0.tgz`，`dsh plugin --profile desktop add artifacts/dsh-ccd-style-0.1.0.tgz` 装入用户的 desktop profile；tarball 内 `package/lib/client.js`、仓库 `lib/client.js` 与安装副本的 sha256 都是 `2052b7c8…`，逐字节相同。

未覆盖：账号菜单没有在 Electron 外壳或带账号的 web profile 里取图（本会话仍起不了第二个桌面实例），它由真实 compat 模块驱动合成卡片验证；运行中的桌面实例需要 ⌘R 或重启才能拿到新构建。

## 收起侧栏的图标轨对齐与收起按钮交接（2026-10-01 晚）

用户报告：侧栏收起后的图标不对齐（Web 与 Electron 都是），并且 Electron 里点「收起侧边栏」后按钮位置会变、有轻微闪烁。

环境同上节：隔离 `DSH_HOME`（`.cache/verify/home-web`，`dsh --profile web --no-open --port 19557`）、`ui-skin-ccd-style` 配 `enabled: true`、无头 Chromium。Electron 外壳差异用启动后设置 `data-platform="darwin"` 复现（启动前设置会让 Web profile 的 `shortcuts` 插件激活失败，见上文）；Web 侧栏与窗口窄到 666×532 时都会进入图标轨（轨道 55px），darwin 下收起后轨道只剩 20px（`_6Qf49G_sidebarCol` 实测 1px），因此「可见的轨」以 Web profile 量测，darwin 只用于复现交接过程。对照基准是**关闭插件**后的同一页面。

| 项 | 结果 | 实测 |
| --- | --- | --- |
| 复现（修复前） | 通过 | 666×532 图标轨：品牌 36、「新会话」27、「插件」28、「添加工作区」36、「搜索」28 —— 两个图标被 8px 内缩推出中线（截图 `web-sidebar-rail-before.png`） |
| 根因 | 确认 | 收起态是宿主另一套布局（根内边距 `18px 10px 6px`、图标按钮 36×36 居中），插件的展开态规则（品牌行 `padding: 0 8px`、工作区区块头 `padding-left: 8px`、控制条 `padding-left: 88px`）在收起态仍然生效 |
| 修复后（图标轨） | 通过 | 收起态六个图标中心全部为 28，x 都是 10..46，纵向间距 48px（18/66/114/162/210…），与关闭插件时**逐项相同**；截图 `web-sidebar-rail.png` |
| 修复后（展开态回归） | 通过 | 品牌行 `[18,6 179x20]`、新会话行 `[10,38 260x30]`、插件行 `[10,70 260x30]`、工作区区块头 `[10,110 260x30]`、设置行 `[10,826 260x37]` 与修复前一致；截图 `web-sidebar-brand-row.png`、`web-sidebar-expanded.png` |
| 收起按钮交接（darwin） | 通过 | 修复前：点击后 `fading` 阶段按钮从 201 跳到 x=88，随后轨内副本从 137 滑到 88 再被裁掉（用户看到的位移与闪烁）。修复后：`fading` 阶段停在 `[240,5]`（宿主控制条自己的 `flex-end`），轨内落到 `[23,19]`；与关闭插件时的 `[240,11]`→`[23,19]` 一致，交接过程没有横向跳变 |
| 展开态按钮位置 | 通过 | 品牌行内 `margin-left: auto`：实测 `[234,2 28x28]`（auto 边距解析为 33px），与宿主交接位置（240）只差 6px（插件品牌行右内边距 8px），点击收起不再出现可见跳动 |
| 收起动画（Web） | 通过 | 非 darwin：`fading` 阶段按钮停在 `[234,2]`（展开位置，不跳），轨内按宿主 `_3WPZCG_rail-in`（`translate(49px)`→0，.15s）从 59 滑到 10，落点与关闭插件时相同 |
| darwin 收起态对照 | 通过 | 收起后轨道 20px、图标 x=10（中心 28）、收起按钮 `[-26,19]`、设置 `[-8,835]`（宿主自己的居中），与关闭插件时逐项相同 |
| 图标颜色 | 通过 | 展开态规则里 `._3WPZCG_iconButton { color: var(--ccd-text-secondary) }` 也收进 `:not(._3WPZCG_collapsed)`：修复前轨内品牌标记是 `rgb(111,111,106)`、其余图标 `rgb(15,17,21)`，修复后六个图标都是 `rgb(15,17,21)`，与关闭插件时相同 |
| 导航行图标列（用户第二轮反馈） | 通过 | 「新会话／插件／自动化任务」三行原本标签分别从 x=39／42／42 开始（加号 14px、面板图标 16px、间距 7px vs 8px），加号中心 25、另外两个 26。修复后三行图标中心都是 26、标签都从 x=42 开始；用户截图 `@2x` 实测标签起点 75／82／85 → 现在对应位置为 84／84／84。复现环境需与桌面一致，故给隔离 profile 补上 `dsh-experimental-schedule-bundle`（否则没有「自动化任务」这一行）；截图 `web-sidebar-nav-rows.png` |
| 会话顶栏回归 | 通过 | 上一轮改动未受影响：标题 300..327 → 切换器 337..445 → 芯片 455..523 → 工具图标 1247..1326，顶栏 49px，控制台 0 error／warning |
| 本地检查 | 通过 | `npm run check`：类型检查、架构边界、5 项测试、构建、安装包检查（31 个包内文件）全部通过 |
| 交付与安装 | 通过 | `npm run pack:local --cache .cache/npm` 生成 `artifacts/dsh-ccd-style-0.1.0.tgz`；`dsh plugin --profile desktop remove` + `add`（pnpm 对同一路径报 `Already up to date`，必须 remove 后再 add）后，安装副本、tarball 内 `package/lib/client.js` 与当时的仓库 `lib/client.js` 的 sha1 都是 `6bb9701a…`（含导航行对齐这一修），逐字节相同；profile 的 `dependencies`／`dsh.profile.bundles` 与 `ui-skin-ccd-style`（`enabled: true`）都完好。工作区另有并行轮同时改动（`theme/composer.css` 等），那些改动由各自轮次交付 |
| 未覆盖 | — | Electron 外壳内仍无法取图（沙箱起不了第二个桌面实例、运行中的实例无调试端口）；darwin 结论来自 Web profile + 启动后设置 `data-platform` 的同一套客户端与宿主 DOM |

截图：`docs/verification/local/web-sidebar-rail.png`（修复后）、`web-sidebar-rail-before.png`（修复前）、`web-sidebar-brand-row.png`、`web-sidebar-expanded.png`。

本轮只改 `src/client/features/sidebar/sidebar.css`：给展开态规则加 `:not(._3WPZCG_collapsed)`（控制条另加 `:not(._3WPZCG_fading)`），并让品牌行里的收起按钮 `margin-left: auto`。未改任何 JS、注册或宿主节点。

## 顶栏顺序：切换器紧随会话标题（2026-10-01 晚）

需求：把「对话／轨迹」切换器从 Agent 预设芯片之后移到会话标题之后，后续同类条目（智能体、后台任务等）继续往后排。

环境：工作区内的隔离 `DSH_HOME`（`.cache/verify/home-web`，`dsh --profile web --no-open --port 19557`），profile 的 `node_modules/dsh-ccd-style` symlink 指向本仓库、`ui-skin-ccd-style` 配 `enabled: true`；本轮额外给 profile 补上 `ui-settings-account.developerTools: true`，否则「轨迹」视图不注册、顶栏不会出现切换器。无头 Chromium 按 1374×871 @2x 取图与量测。会话内容用「发送一条消息」产生（Web profile 没有模型凭据，模型返回 `MISSING_CREDENTIAL`，但用户消息已落库，会话因此不再是空白页、顶栏 chrome 完整渲染）；后续量测改为从侧栏重新打开该会话，不再发送。

| 项 | 结果 | 实测 |
| --- | --- | --- |
| 顺序 | 通过 | 1374×871：标题 `crumbs` order=0（300..327）、切换器 `tabs` order=1（337..445）、Agent 预设芯片 `headerActions` order=2（455..523）、工具图标 `headerUtilities` order=3（1247..1326）、右角 `headerCorner` order=4（1334..1362）；标题→切换器与切换器→芯片各 10px |
| 顶栏行数 | 通过 | `.ST7X_W_header` 仍为单行 flex 49px（`min-height: 0`），空白会话仍为 40px |
| 弹性间距归属 | 通过 | `margin-right: auto` 由轨道移到芯片容器（`.ST7X_W_headerActions`），工具图标与右角继续贴右边缘；宿主只对 `headerUtilities`／`headerCorner` 写了 `:empty { display: none }`，芯片容器没有该规则，因此某个插槽为空时弹性间距不会消失 |
| 原生行为保留 | 通过 | 点「轨迹」后 `aria-selected`／`tabActive` 正确翻转、轨迹账本渲染（出现「时长／轮次／调用」），发布值 `--ccd-view-x` 由 `0px` 变 `54px`，切换器位置与顺序不变 |
| 长标题 | 通过 | 760×640 + 长标题：标题截断到 185px（宿主自己的 `max-width: 220px` 与 ellipsis），切换器仍在标题之后（271..379）、芯片 389..457，两者都没被挤出顶栏 |
| 响应式 | 通过 | 1100×760、900×700、760×640（先在参考尺寸打开会话再缩窗口）：三档都是「标题 → 切换器 → 芯片」相邻、工具图标贴右，`clippedControls=0`、`scrollWidth - clientWidth = 0`；截图 `web-conversation-header-long-title-760x640.png` |
| 空白会话 | 通过 | 新建页顶栏 40px、无切换器、右角仍由宿主自己的 `.ST7X_W_headerBlank .ST7X_W_headerCorner { margin-left: auto }` 贴右，与上一轮一致 |
| 停用恢复 | 通过 | profile 改 `enabled: false` 重启：根属性缺失、插件样式 0 张、顶栏回到 76px `grid`、切换器回到第二行（300,50 1046×25）、轨道 `style` 为空（两个属性已移除）；改回 `enabled: true` 重启后顺序与发布值全部恢复 |
| 换会话重建 | 通过 | 在同一页里从「hi」切到「你好」：React 重建顶栏后标题 42px、切换器紧随其后（352..460）、芯片 470..538，滑块几何在新轨道上重新发布（`0px`／`54px`），顺序不变 |
| 控制台 | 通过 | 全部运行 0 error／warning（除首屏连接未就绪的既有 warning） |
| 本地检查 | 通过 | `npm run check`：类型检查、架构边界、5 项测试、构建、安装包检查（31 个包内文件）全部通过 |
| 交付副本 | 通过 | `artifacts/dsh-ccd-style-0.1.0.tgz` 内的 `package/lib/client.js`、仓库 `lib/client.js` 与 desktop profile 的安装副本 sha1 都是 `e4ee488d…`，即三份产物逐字节相同；安装副本由并行轮在 20:45 装入（晚于本轮的 CSS 改动），因此已含本轮改动 |
| 未覆盖 | — | Electron 外壳内的观感：本会话沙箱起不了第二个桌面实例（渲染进程 `sandbox initialization failed`），本轮取自 Web profile（同一套客户端 bundle 与宿主 DOM，无外壳）；桌面宿主在内存里持有 client bundle，需按 ⌘R 或重启应用才能看到新构建 |

截图：`docs/verification/local/web-conversation-header.png`（1374×871 现状）、`web-conversation-header-trajectory.png`（切到轨迹）、`web-conversation-header-long-title-760x640.png`、`web-conversation-header-disabled-native.png`、`web-conversation-header-reenabled.png`。

本轮只改了 `src/client/features/conversation/conversation.css` 的顶栏 `order` 与边距（切换器 order 2→1、芯片 order 1→2 并接收 `margin-right: auto`），`compat/view-switch.ts` 与宿主插槽注册未动。工作区同时存在另一轮（新建页问候语定位、芯片对齐）的并行改动，本轮未触碰那些文件。

## 新建页芯片边框与底部菜单翻转轮（2026-10-01）

用户提出的两处问题：新建页芯片行的 Agent 预设菜单没有贴在按钮上方、而是整块盖住页面；芯片行没有参考图那样的边框。

复现与验证环境：工作区内的隔离 `DSH_HOME`（`.verify/home`，`dsh --profile web --port 19555`），profile 用 symlink 指向本仓库、`ui-skin-ccd-style` 配置 `enabled: true`。客户端是随应用发布的同一套 DSH Web 客户端与同一套宿主 DOM，只是不含 Electron 外壳。macOS 外壳差异用启动后设置 `data-platform="darwin"` 复现（外壳会因此发布 `--dsh-frame-top-clearance: 48px`）；启动前设置该属性会让 Web profile 的 client `shortcuts` 插件激活失败（25 项 pending），与插件无关，因此不在启动前设置。

| 验证 | 实际结果 |
| --- | --- |
| 修复前复现（522×318 @2x，与用户截图同尺寸） | 预设菜单 `top=34`、`bottom=306`、高 272、无 `data-ccd-menu-flipped`：盖住芯片行（y=207..233）与输入面板（y=239..281），与用户截图一致 |
| 修复后（1374×871 参考窗口） | 菜单 `top=484`、`bottom=756`、高 272，底边距芯片上边缘 4px，未盖输入面板（y=792）；截图 `docs/verification/local/web-hero-menu-above.png` |
| 修复后（522×318 + 48px 顶部让位） | 菜单 `top=68`、`bottom=203`、高 135，距芯片 4px；`.viewport` `scrollHeight 264 / clientHeight 127`、`overflow-y: auto`，余下模式在卡片内滚动；截图 `docs/verification/local/web-hero-menu-above-small.png` |
| 修复前同尺寸对照 | `docs/verification/local/web-hero-menu-covered-before.png` |
| 窗口尺寸连续变化 | 900×700 → 522×318 → 1200×900 → 522×318：每一步菜单底边都贴住芯片上方 4px，高度上限随可用空间变为 272／135／272／135，四步均未盖住 Composer，控制台无错误（未加 `resize` 监听时最后一步停在 1200×900 的 `top=513`，会盖住 Composer，已修） |
| 其它底边菜单回归 | 模型选择菜单（Composer 卡片内）`top=587`、高 76、距触发器 4px；hero 工作区选择器菜单 `top=502`、高 83、距芯片 4px；均不遮挡其锚点 |
| 关闭与释放 | Esc 关闭后 `[role="menu"]` 0 个、`[data-ccd-menu-flipped]` 0 个；根属性与 7 张插件样式表仍在；全部运行控制台 0 error／warning |
| 修复后（芯片边框） | 两个芯片计算样式均为 `1px solid rgb(227,227,225)`、`border-radius: 8px`、透明底、`0 1px 2px rgb(0 0 0 / 4%)`、高 26px；截图 `docs/verification/local/web-hero-chips.png`。参考图实测芯片边框 #e3e3e3、输入面板边框 #e0e0e0，分别对应 `--ccd-border` 与 `--ccd-border-strong`；参考图芯片为 24px 高、边框内填充与页面同色（#fcfcfb） |
| 芯片与输入框对齐（第二轮反馈） | 芯片行左内边距由「侧向留白 + 4px」改为「侧向留白」：1374×871／900×700／522×318 三档实测芯片左边框与 `.yhfFVG_scroll` 左边框为同一个 x（438.5／89.5／72），截图像素测得的边框列都是 x=878；参考图为芯片 982 对输入面板 980，相差 1px。对照图 `docs/verification/local/reference-vs-web-chips.png` |
| 本地检查 | `npm run check`：类型检查、架构边界、5 项测试、构建、安装包检查全部通过；`check:package` 的激活夹具本轮新增窗口监听器计数（`resize` 监听），断言停用后监听器与观察器都归零 |
| 交付 | `npm run pack:local --cache .cache/npm` 生成 `artifacts/dsh-ccd-style-0.1.0.tgz`，`dsh plugin --profile desktop remove` + `add` 装入用户的 desktop profile；两轮修复后的安装副本 `lib/client.js` 与仓库构建 sha1 一致（对齐修正后为 `e4ee488d…`） |
| 未覆盖 | 运行中的桌面实例不带 `--remote-debugging-port`，本轮没有在 Electron 外壳内取图；外壳内的最终观感需用户刷新（⌘R）后确认。芯片行在参考图中为 24px 高，实现沿用此前已验收的 26px，只补边框 |

## 问候语放到页面正中（2026-10-01 晚）

需求：不再为统计卡片预留位置，把「探索未至之境」一行放回页面正中（内容列的水平与垂直中心），底部输入布局保留。

环境同上一节：隔离 `DSH_HOME`（`.cache/verify/home-web`，`dsh web --no-open --port 19557`）、profile 的 `node_modules/dsh-ccd-style` symlink 指向本仓库、`ui-skin-ccd-style` 配 `enabled: true`；无头 Chromium 按 1374×871 @2x 取图与量测（启动前不设 `data-platform="darwin"`，理由见上一节）。

| 项 | 结果 | 实测 |
| --- | --- | --- |
| 正中关系 | 通过 | 问候块矩形中心 827/456，与 `[data-conversation-content]`（x=280 y=40 1094×831）的中心 827/456 完全重合；`.bocITq_root` 计算值 `position: absolute`，`translate: -50% -50%` |
| 标题居中 | 通过 | `headline` 在 834px 块内左右各留 24px（宿主自己的 `padding: 0 24px` 与 `justify-content: center`），未做左对齐 |
| 输入组不受影响 | 通过 | `composerSeat` 仍在底部（y=756、高 115），输入卡片 y=792、770×74；问候块移出组后组高由 165 收到 115 |
| 窄窗口 | 通过 | 900×700：问候块 y=348..392、输入组 y=585；760×640：y=318..362、组 y=525；两者都不重叠，`scrollWidth - innerWidth = 0` |
| 同页 A/B | 通过 | 把旧规则（绝对定位到顶部 + 左对齐）重新注入同一页后，问候块 x=410 y=128、headline 左对齐（x=442），输入卡片位置不变 |
| 截图 | 通过 | `docs/verification/local/web-hero-greeting-middle.png`（现状）、`web-hero-greeting-top-before.png`（旧规则对照） |
| 本地检查 | 通过 | `npm run check`：类型、架构、5 项测试、构建、31 个包内文件 |
| 未覆盖 | — | Electron 外壳内的观感：本会话沙箱起不了第二个桌面实例（渲染进程 `sandbox initialization failed`、崩溃报告写入 `~/Library/Logs` 被拒 EPERM），本页取自 Web profile（同一套客户端 bundle 与宿主 DOM，无外壳）。桌面宿主在内存里持有 client bundle，profile 的 `hmr` 是 `root: []`，因此先按 ⌘R 试，仍无变化则需完全退出应用再打开 |

## README 与 Agent 安装文档轮（2026-10-01）

交付：[中英双语 README](../README.md)、[install.md](../install.md)。README 增加语言导航、兼容徽章、功能与配置表、agent 安装指令；安装指南包含环境预检、配置备份、唯一 tarball 路径、启用合并规则、验收与回退。`check:architecture` 已将 `install.md` 纳入文档链接与空白检查。

| 验证 | 实际结果 |
| --- | --- |
| 本机正式 CLI | `dsh --help` / `dsh --version` 核对安装入口与版本，返回 `0.2.0-rc.2` |
| 文档与命令语法 | `npm run check:architecture`、`git diff --check` 通过；README 与 install.md 的 9 个 shell 代码块全部通过 `bash -n` |
| 安装命令隔离夹具 | 临时目录中模拟 npm 与 DSH CLI；备份保留原配置、含空格路径、两次安装生成不同绝对 tarball 路径、打包失败与错误 DSH 版本时不调用安装均通过 |
| 完整本地检查 | `npm run check` 的类型、架构、5 项测试与构建通过；`check:package` 失败：既有 `@deepseek-ai/dsh-client-ui-primitives` 依赖声明为 `^0.2.0-rc.2`，检查要求精确 `0.2.0-rc.2` |
| 本轮真实 Desktop 安装／启用 | 未执行；本轮为文档更新，隔离夹具不代表真实安装验收 |

边界：保留工作区已有／并行中的依赖与业务源码改动，未为通过检查而改写依赖版本。以上本地检查记录对应命令执行时的工作区；本轮未生成新的可交付安装包，也未改动用户 desktop profile。下文为此前的真实 Desktop 验证记录。

## 已有 Desktop 验证基线

应用版本：DeepSeek Harness Desktop `0.2.0-rc.2`（Electron 44.0.0，macOS arm64），窗口 1280×820 逻辑像素；对照截图在 CDP 设备指标覆盖下按参考窗口 1374×871 渲染。

| 层次 | 验证方式 | 当前状态 |
| --- | --- | --- |
| SDK 与加载协议 | 本机应用资源（app.asar 只读解析）、固定版本公开类型 | 已核实源码／格式 |
| TypeScript | `npm run typecheck` | 通过 |
| 模块边界、颜色归属与文档链接 | `npm run check:architecture` | 通过 |
| 失败回滚与资源所有权 | `npm test` | 5 项通过 |
| JS／声明构建 | `npm run build` | 通过 |
| loader factory、配置传输夹具与安装包内容 | `npm run check:package` | 通过：31 个包内文件；夹具断言每个兼容层观察器都被释放 |
| 本地安装包生成 | `npm run pack:local --cache .cache/npm` | 通过：`artifacts/dsh-ccd-style-0.1.0.tgz` |
| Desktop 实际安装 | `dsh plugin --profile desktop add <tgz>` | 通过：写入 profile 依赖与 `dsh.profile.bundles` |
| Desktop 实际启用 | 插件面板自动生成的「启用 dsh-ccd-style」开关 | 通过：7 张样式表、根属性全部就位 |
| Desktop 实际停用 | 关闭同一开关 | 通过：根属性、7 张样式表、菜单标记与统计自定义属性全部移除，界面回到原生 |
| Desktop 实际恢复 | 再次打开开关 | 通过：资源重新挂载，无需重启 |
| 界面重新加载 | 渲染进程重载（⌘R） | 通过：重载后插件自动从 profile 载入并挂载 |
| 完整应用重启（冷启动） | 退出 DSH 应用后重新打开，读取服务端启动图 | 通过：启动图 68→69 项且含唯一的非官方条目 `dsh-ccd-style`；无 `web-boot` 崩溃日志 |
| 新建页几何 | 同尺寸截图 + DOM 量测 | 通过：输入面板 y 792..833、x 431..1201（参考 795..836、431..1187）；控制行元素中心 852（参考 851.8） |
| 聊天页几何 | 同尺寸截图 + DOM 量测 | 输入面板同上；正文列宽 770px；统计簇落在模型选择之前，与参考图同为控制行内 |
| 中文多行输入 | CDP `Input.insertText` + Shift+Enter | 通过：中文草稿写入编辑器，换行后输入面板由 24px 增至 48px，卡片由 42px 增至 66px |
| 发送 | 测试会话发送「你好，请回复"收到"两个字。」 | 通过：消息落库、phase 由 hero 转 active、模型 1 秒返回 |
| 停止 | 发送长回答请求后在生成中点击主按钮 | 通过：主按钮由「发送消息」变为「停止生成」，点击后回到「发送消息」，会话回到空闲 |
| 工具展开 | 点击工具行 | 通过：`aria-expanded=true`，详情区展开 |
| 模型／权限操作 | 打开模型菜单与访问模式菜单 | 通过：菜单渲染（模型／推理等级；工作区内修改），点击外部可关闭 |
| 设置访问 | 侧栏底部入口 → 账号菜单 → 设置 | 通过：设置对话框打开，含账号、通用、模型、内置插件、Agent 预设 |
| 窄窗口 | 900×700、760×640 设备指标覆盖 | 通过：侧栏自动收起、输入区不越界（`overflowX=0`，被裁剪控件数 0，发送按钮仍在面板内） |
| 侧栏隐藏 | 收起侧栏 | 通过：轨道 0、差值 0；框架左上角出现「打开侧边栏」「新建会话」两个控件（x=88/124，避开红绿灯） |
| 右侧面板打开 | 展开右栏（1280 窗口） | 通过：三列为 280/424/576，Composer 自适应到 401px，无重叠、无裁剪 |
| 内容宽度与导航密度 | 同尺寸截图对照 | 见 `docs/verification/local/compare-new-session.png` |

## 真实 Desktop 验证方法

1. 用安装包安装：`dsh plugin --profile desktop add artifacts/dsh-ccd-style-0.1.0.tgz`。
2. 通过渲染进程的 Chrome DevTools Protocol 端点（`127.0.0.1:9222`，Electron 自带的调试端口）执行脚本：截图、DOM 量测、点击、输入、读取控制台。
3. 设备指标覆盖（`Emulation.setDeviceMetricsOverride`，1374×871、dpr 2）用于产出与参考图同尺寸的截图；真实窗口尺寸为 1280×820。
4. 验证脚本不写入应用文件；`clear` 或刷新即撤销临时注入。

## 交付物

- 安装包：`artifacts/dsh-ccd-style-0.1.0.tgz`（31 个文件：`lib/`、`cordis.patch.yml`、`README.md`、`LICENSE`、`package.json`）。
- 同尺寸截图与对照：`docs/verification/local/desktop-new-session.png`、`desktop-conversation.png`、`compare-new-session.png`、`compare-conversation.png`（含 `*-blend.png` 半透明叠加）。
- 状态证据：`desktop-disabled-native.png`（停用后回到原生界面）、`desktop-reenabled.png`（恢复）、`desktop-sidebar-collapsed.png`、`desktop-rightbar-open.png`、`desktop-new-session-multiline.png`、`responsive/` 下的四组尺寸截图。

## 本轮运行的边界与限制

- 参考截图 `docs/reference/` 与本地截图 `docs/verification/local/` 都只用于本地开发，不进入安装包。
- 统计区未实现：DSH `0.2.0-rc.2` 没有跨会话的全局用量接口，首版不放示例数字（见 [TECH_DEBT.md](TECH_DEBT.md)）。
- 深色模式未实现：语义 token 覆盖与设计变量都按浅色给定，深色下不会得到校准过的观感。
- 字体：参考截图使用 Anthropic Sans／Serif，未获授权分发，插件使用系统 UI 字体栈，字形与字宽与原图存在差异。
- **完整应用重启已验证**（用户手动退出并重新打开应用）：服务端启动图（`/plugins/events` 的首个 `graph` 事件，由 loader 条目在启动时组合）共 69 项，其中唯一的非官方条目是 `dsh-ccd-style`，说明插件在冷启动路径上被正确载入。判据说明：客户端条目导入失败时 DSH 会写出 `crash-*-web-boot.log`（今天 13:44 与 14:01 因 patch 形式写错而各写过一次），本次重启后没有新增崩溃日志。
- 冷启动后的渲染层没有再用 CDP 逐项复验：用户手动重启的实例不带 `--remote-debugging-port`，无法附着。
- **交互验证（点击、输入、发送、停止、菜单、响应式量测）与同尺寸截图使用 15:16 安装的构建**；最终安装的构建（sha1 `7bf0266705386ddc0a68f87c7a036d1e73519601`）只多了一处「样式无条件挂载」的改动——三个 feature 去掉了锚点缺失时的提前返回。该改动不改变已渲染会话页上的任何样式或交互（锚点齐全时两者挂载完全相同的 6 张样式表），并且最终构建已在冷启动启动图中确认载入。若需要逐项复验最终字节，用 `scripts/desktop-coldstart.mjs` 重启并在带调试端口的实例上重跑本文的验证脚本。
- **安装的构建必须与仓库构建一致**：pnpm 对同一个 `file:` tarball 路径会报 `Already up to date` 而不重新解包，因此本轮改用 `remove` + `add` 强制重装，之后 `lib/client.js` 与仓库产物逐字节相同（sha1 `7bf0266705386ddc0a68f87c7a036d1e73519601`）。
- 侧栏宽度属于 DSH 自己的布局偏好（clamp 264–420，默认 280），插件从不写它，也不再把视觉宽度钉到 264：分隔线就是侧栏自己的右边缘，轨道多宽线就在多宽。实测从 280 拖动 +40px 时轨道与手柄同步到 320，向左拖到 264（DSH 自己的下限）时同步到 264。


## 细节修正轮（2026-10-01 下午）

方法：把 `~/.dsh` 以 APFS 克隆到 `/tmp/ccd-verify/home`，用另一个 web 端口（19388）与另一个 CDP 端口（9223）启动**第二个隔离的桌面实例**做实测，全程不触碰用户正在使用的应用与会话；量测与截图通过 CDP `Runtime.evaluate` 与 `Emulation.setDeviceMetricsOverride` 完成。

| 问题 | 结论 | 实测 |
| --- | --- | --- |
| 侧栏拖动方向与分隔线 | 确认存在，同一根因 | 旧实现把视觉宽度钉在 264：轨道 >264 时中列负边距盖住分隔线、拖动无反馈。移除后轨道 280→320 跟随指针 +40，收缩到 264 下限，线始终可见（`border-right` 1px） |
| 新会话↔插件间距 | 确认存在 | 旧值 6px（面板行间距 1px）；改为统一 `--ccd-nav-gap: 2px`，三行 hover 背景等距（实测 86..116、118..148、150..180） |
| 左下角账号菜单 | 确认存在 | 旧 144×110、三行 34px；现 236×151、账号名页眉、28px 行、末组细分隔线，菜单底边距账号行 4px（不再压住它） |
| 加号背景 | 确认存在 | 旧 `rgb(245,246,247)` 圆形 28px；现透明、8px 圆角、28×28 |
| 发送按钮位置 | 参考图核对后修正 | 参考图里输入框内右端是 `↵`（发送），控制行右端是上下文占用环。现发送按钮绝对定位到面板第一行右侧：实测 (1124,746) 24×24，完全落在面板 (392,738,770,42) 内，右边缘距面板右边框 14px |
| 统计读数 | 确认存在，按新要求重排 | 旧为卡片下方独立一行、图标+整句；现位于模型选择之前，每项「图标 + 一个数字」：`210 tok/s`、`117M tok`、`19%`（数值取自宿主渲染文本，未伪造） |
| 菜单压住按钮 | 确认存在 | 工作区菜单 top=725、按钮底边 738（重叠 13px）。兼容层翻转到锚点上方后：菜单 620..703、按钮顶边 706，间距 4px；模型菜单同样（704..780 vs 芯片顶边 784）；账号菜单 622..773 vs 账号行顶边 776 |
| 品牌行对齐 | 确认存在 | 品牌标志 x=10、导航图标 x=18；加 8px 缩进后品牌标志 x=18，与新会话／插件图标对齐 |
| 发送图标居中 | 追加修正 | 文字字符 `↵` 的墨迹中心偏离按钮中心（@2x 实测 +3.0/-4.0 → 1.5px 右、2px 上）；改为遮罩绘制后偏移 -1.0/0.0（@2x），停止方块 0/0 |
| 统计控件形状 | 追加修正 | 宿主把读数画成 999px 胶囊、20px 高；现与同排控件同族：实测读数 88×28/58×28、模型 103×28、`+` 28×28，圆角全为 8px |
| 工作区行对齐 | 追加修正 | 选择器左边缘比输入面板左边缘靠左 12px；行内边距改为「侧向留白 + 4px」后实测为 +4px（参考图同为 +4px） |
| 账号行高度 | 追加修正 | 宿主 44px、hover 背景贴住窗口底边；现为 30px 高（头像 24px 居中）、圆角 8px、距窗口底边 8px（实测 gapBelow=8） |

截图：`docs/verification/local/desktop-new-session.png`、`desktop-conversation.png`、`desktop-account-menu.png`、`desktop-workspace-menu.png`、`compare-*.png`、`responsive/`。窗口尺寸均为参考窗口 1374×871（@2x）。

限制：本轮量测在隔离实例上完成；该实例与用户实例使用同一份 profile 副本与同一构建，但窗口尺寸/系统状态可能不同，因此几何结论以相对关系（间距、包含关系、跟随位移）为准。

## 顶栏视图切换器轮（2026-10-01 傍晚）

需求：把「对话／轨迹」从独占一行改为参考图那样的分段控件（选中段平滑滑动），并移到会话界面最上方的模式之后。

方法同上：`/tmp/ccd-verify` 隔离实例 + CDP 9223，同一构建（安装副本与仓库 `lib/client.js` 逐字节相同，sha1 `74cbd274d962381e86ca25bdafaf0c828aa345e8`）。

| 项 | 结果 | 实测 |
| --- | --- | --- |
| 顶栏行数 | 通过 | `.ST7X_W_header` 由 `grid` 76px 变为 `flex` 49px；`titleRow`/`titleCluster` 为 `display: contents`（0×0），宿主节点未搬动 |
| 切换器位置 | 通过 | 标题 300..494、预设芯片 504..572、切换器 582..690（芯片后 10px）、工具图标 1155..1233、右角 1240..1268；工具图标仍贴右边缘（`margin-right: auto` 提供弹性间距） |
| 分段控件形状 | 通过 | 轨道 108×28、圆角 8px、底色 `#f3f3f2`；两格各 54×28；选中格滑块 54×28、白底、1px `--ccd-border-soft` 边框、8px 圆角、`--ccd-shadow-segment` 阴影——与参考图同为「滑块铺满选中格」 |
| 滑块几何 | 通过 | 发布值 `--ccd-view-x: 0px`、`--ccd-view-w: 54px`；点「轨迹」后为 `54px`/`54px`，与 `getBoundingClientRect` 差 ≤0.5px |
| 平滑移动 | 通过 | 过渡属性 `transform, width`，时长 180ms；切换后逐次采样到中间值 `matrix(1,0,0,1,0.596,0)`→`1.541`→`6.969`→`54`（被遮挡窗口会节流动画帧，因此采样步长不等，但过渡确实在跑并落在目标值） |
| 原生行为保留 | 通过 | 点击仍由宿主按钮处理：`aria-selected` 与 `ST7X_W_tabActive` 正确翻转，视图区切换到轨迹账本（出现「时长／轮次」），再切回对话正常 |
| 换会话重建 | 通过 | 切到空白会话时顶栏无切换器（`showTabs=false`）；切回会话后新元素上重新发布两个属性，滑块仍覆盖选中格 |
| 响应式 | 通过 | 1374×871、1100×760、900×700、760×640 四组：`tabsOnHeaderRow=true`（28px 高、始终在顶栏内）、`tabsClearOfUtilities=true`、`thumbOnActiveTab=true`、`overflowX=0`、被裁剪控件 0、发送按钮仍在输入面板内、统计簇仍在控制行内；截图见 `responsive/` |
| 空白会话顶栏 | 通过 | `headerBlank` 下顶栏仍为 40px、右角贴右；与上一轮 `desktop-new-session.png` 的顶栏区域逐像素差为 0 |
| 停用恢复 | 通过 | 用 profile 的 `disabled: true` 重启：根属性缺失、插件样式 0 张、轨道 `style` 为空（两个属性已移除）、顶栏回到 76px `grid`、切换器回到第二行 952×25 |
| 重新启用 | 通过 | 恢复 `disabled: false` 重启：根属性为 `true`、顶栏 49px、轨道 `style` 为 `--ccd-view-x: 0px; --ccd-view-w: 54px;` |
| 收起侧栏后的红绿灯 | 用户报告重叠，已修 | 宿主把「让开 macOS 窗口按钮」的留白写成 `.ST7X_W_titleRow` 自己的 `padding-inline-start: max(0px, --dsh-frame-leading-clearance - 20px)`；该行被 `display: contents` 溶解后这条留白失效，收起侧栏（`--dsh-frame-leading-clearance: 160px`）时标题滑到红绿灯下面。改由该行的第一个子元素 `.ST7X_W_crumbs` 承担同一条计算后实测：收起时 `padding-inline-start: 140px`、标题左边缘 160px（红绿灯区约 12..88px），展开时 0px、标题左边缘 300px，与改造前一致 |
| 渲染进程重载 | 通过 | `Page.reload` 后插件自动重新挂载：根属性 `true`、顶栏 49px、两个属性重新发布 |
| 源码检查 | 通过 | `npm run check`（类型、架构、5 项测试、构建、31 个包内文件）；`check:package` 夹具断言观察器开／关数量相等 |

截图：`desktop-conversation.png`、`desktop-new-session.png`、`desktop-sidebar-collapsed.png`、`desktop-disabled-native.png`、`desktop-reenabled.png`、`compare-conversation{,-blend}.png`、`compare-new-session{,-blend}.png`、`responsive/`（均已按本轮构建重拍；窗口 1374×871、@2x）。

限制：动画只在被遮挡的隔离窗口里量到中间值（Chromium 会节流不可见窗口的帧），因此「平滑」的证据是过渡属性 + 中间采样值，而不是逐帧录屏；隔离实例的侧栏宽度是 DSH 的默认 280px（上一轮截图是拖动过后的 264px，两者不是同一状态，比较时只看相对关系）。本轮 `desktop-conversation.png` 的正文内容是一段新建的短会话（隔离实例的工作区列表只剩当前会话，上一轮那段长会话无法再打开），顶栏与输入区几何仍与上一轮一致；CDP 截图不含 macOS 红绿灯本身，因此收起侧栏的结论以量测为准，`desktop-sidebar-collapsed.png` 只作留白效果参考。
