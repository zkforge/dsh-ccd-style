# 验证记录

更新日期：2026-10-01。只记录实际运行结果。**源码检查、测试夹具与真实 Desktop 验证分开记录**，前者不能替代后者。

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
