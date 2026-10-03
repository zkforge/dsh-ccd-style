# DeepSeek 极简像素宠物调研

调研日期：2026-10-03。状态：**已实现**（本轮调研只阅读公开 README、许可证和源码，没有安装这些插件；后续落地见 [当前实现](IMPLEMENTATION.md) 的「输入框小鲸鱼」与 [验证记录](VERIFICATION.md)，本文件保留的是当时的选型依据）。

## 结论

已有专门面向 DSH 的开源 DeepSeek 像素鲸鱼。最值得参考的是 [Win-Hao/seek-on-dsh](https://github.com/Win-Hao/seek-on-dsh)：技术和形象都接近需求，但默认是整个窗口右下角的宠物，动作和素材仍比本项目需要的丰富。建议在本插件里实现一个独立、可关闭的轻量展示模块，画一只原创的简洁蓝色像素鲸鱼，贴在 Composer 上沿；借鉴状态映射，不直接安装或整体移植桌宠。

用户给出的 Claude GIF 是位置、尺度与克制程度的视觉参考，并不是本调研中任一开源项目的运行截图。

## 三个可用参考

| 项目 | 已核查许可证 | 匹配程度与值得复用的部分 | 不建议带入的部分 |
| --- | --- | --- | --- |
| [seek-on-dsh](https://github.com/Win-Hao/seek-on-dsh) | [MIT，2026 Win-Hao](https://github.com/Win-Hao/seek-on-dsh/blob/main/LICENSE) | 高：DeepSeek 像素鲸鱼、DSH 插槽、React、会话状态映射；适合参考有限状态选择与逐帧 SVG 动画 | 窗口级拖拽、喝咖啡／看书等大量表演，以及未适配本项目清理规则的素材加载器 |
| [whale-on-desk](https://github.com/cookiesheep/whale-on-desk) | [MIT，2026 contributors](https://github.com/cookiesheep/whale-on-desk/blob/master/LICENSE) | 中：明确分离状态机与渲染；适合参考“待审批优先”与短暂反应播放后回归基础状态 | 语音、成长、水族馆、统计气泡、主动讨活等功能明显超出“简洁”要求 |
| [pet-clawd](https://github.com/companion-inc/pet-clawd) | [MIT，2026 getcompanion-ai](https://github.com/companion-inc/pet-clawd/blob/main/LICENSE) | 视觉参考：少量像素表情配合跳跃、挤压和眨眼就能传达情绪 | Swift/AppKit 独立 macOS 桌宠、录屏与 Claude CLI 聊天架构，不适合嵌入本项目 |

### seek-on-dsh：最接近，但不直接照搬

[README](https://github.com/Win-Hao/seek-on-dsh/blob/main/README.md) 将鲸鱼描述为 DeepSeek logo 的 40×31 网格像素化；每个动作是一个包含 CSS keyframes 的 SVG。[源码](https://github.com/Win-Hao/seek-on-dsh/blob/main/src/client.js) 经 `useSessions(pick)` 读取会话快照，注册到 `shell.overlay`。优先级是审批／问答／计划审核 → 正在运行 → 完成未读 → 待机；全窗口只有一只，状态来自所有会话。

[构建脚本](https://github.com/Win-Hao/seek-on-dsh/blob/main/build.mjs) 定义了实际动作文件和时长。待机随机动作间隔 12–30 秒，每次仅播一轮；连续待机 90 秒后睡眠。点击反应由短期展示状态驱动。运行状态只表示工作中，没有从快照中杜撰“正在思考”或“运行失败”的细粒度信号。

可直接在浏览器查看的 [原始待机 SVG](https://raw.githubusercontent.com/Win-Hao/seek-on-dsh/main/assets/seek-idle-follow.svg)。本轮读取其文本确认：75,219 字节，`viewBox="-15 -25 45 45"`，使用 `crispEdges`、`steps(1,end)`，动画周期 1.833 秒。它是逐帧矢量容器，不是几条路径组成的极小 SVG。

移植前必须解决：

- [package.json](https://github.com/Win-Hao/seek-on-dsh/blob/main/package.json) 的 DSH peerDependencies 为 `*`，没有给出本项目 `0.2.0-rc.2` 的兼容保证。
- `pick()` 扫所有会话；Composer 上的小鲸鱼应优先反映**当前聊天**，避免别的会话让这只鲸鱼看起来仍在工作。
- 源码 `artUrl()` 缓存 `URL.createObjectURL()` 的结果，但未见 `URL.revokeObjectURL()` 与解压异步结果的卸载取消，不能原样满足本项目资源归属要求。
- 独立 `<img>` SVG 的颜色不会继承外部 CSS 自定义属性；本项目需要主题变量，较小的内联原创 SVG 更合适。
- README 说明美术由另一个工作区的视频解码而来、仓库只带成品，并注明鲸鱼形象衍生自 DeepSeek logo。本轮未能核实视频及上游素材的完整来源；仓库 MIT 声明不应被扩展解读为所有上游形象权利的独立授权。优先自己画简化鲸鱼，保留借用代码所需署名。

### whale-on-desk：参考状态机，保留少数动作

[状态机源码](https://github.com/cookiesheep/whale-on-desk/blob/master/lib/pet-machine.mjs) 是无 DOM、无 Node API 的逻辑模块，区分持久状态与短暂反应；审批优先，短暂动画播完后清除，再呈现基础状态。这个机制适合本项目。

[README](https://github.com/cookiesheep/whale-on-desk/blob/master/README.md) 的现成实现是 Host 折叠 `session/event`、浏览器每 500ms 读取状态并播放 GIF；它还有音效、成长和水族馆。本项目已有 SDK 状态 hooks，不必为极简展示另建轮询通道。[美术规格](https://github.com/cookiesheep/whale-on-desk/blob/master/docs/ART_SPEC.md) 采用 48×48 逻辑像素和较多颜色，适合较大的桌宠，不宜直接缩成输入框边缘的小角色。

### pet-clawd：参考像素动作语言

[CrabSpriteRenderer.swift](https://github.com/companion-inc/pet-clawd/blob/main/Clawd/CrabSpriteRenderer.swift) 与 [CrabCharacter.swift](https://github.com/companion-inc/pet-clawd/blob/main/Clawd/CrabCharacter.swift) 将表情帧与弹跳、缩放、倾斜、震动分开。可借鉴“少量像素形变 + 极短位移”的表达方式。其 [Package.swift](https://github.com/companion-inc/pet-clawd/blob/main/Package.swift) 确认这是 macOS 13+ 的 Swift 可执行程序，无法作为网页组件直接复用。

## 本项目建议动作规格（设计建议，非已实现）

先做约 32×20 的逻辑像素鲸鱼，显示约 48–64px 宽；蓝色主体、较浅腹部、深色眼睛，透明背景。锚定输入卡上沿靠右，让腹部基线贴边，平时不在页面乱跑；不加粒子、音效和随机道具。

| 状态 | 动作 | 触发与收敛 |
| --- | --- | --- |
| 待机 | 眨眼，尾鳍偶尔抬一格 | 大部分时间保持静止；不持续上下漂浮 |
| 工作中 | 尾鳍慢摆，身体前倾一格 | 仅当前会话真实运行时循环 |
| 等待用户 | 停下摆尾、抬头看用户 | 来自 SDK 真实待审批／提问状态；不闪屏、不重复跳 |
| 完成 | 很小的一跳，落下时轻压扁 | 只在当前回合完成转换时播一次；不按“完成未读”无限庆祝 |
| 被点击 | 眨眼或短暂缩一下 | 0.3–0.6 秒后恢复；不发送聊天消息 |
| 长时间空闲 | 闭眼趴下 | 可后置；减少动态效果时直接静态姿态 |

若首期只落实视觉，先交付待机／工作中／点击三种，避免为了动作数量引入业务信号。只在真实 SDK 有失败信号时追加失败姿态，不能把普通停止或取消一律画成失败。

## 集成与验证边界

遵守 [架构](../ARCHITECTURE.md)：独立 feature、`.tsx` 仅接收 SDK 派生 props 与回调、跨 feature 的组合留在 `src/client/apply.ts`；所有注册、监听、计时器、观察器与异步任务归清理作用域。色彩放主题 token；不修改 Composer 的业务与发送逻辑。

聊天页优先使用当前宿主的 `conversation.input.overlay` 插槽。本轮读取本地 npm 固定安装的 `@deepseek-ai/dsh-client-ui-conversation@0.2.0-rc.2`：`lib/client.js:17450` 在 `sessionId !== void 0` 时才渲染该槽，`:18301` 将其声明为 `kind: list`、`scope: session`；主任务另核查该层为 Composer 顶边的绝对定位零高锚点，适合向上呈现角色。因此不能假定没有 Session 的新建页也渲染它；新建页如需出现，必须在兼容层通过真实 `[data-composer-card]` 定位并评估 `shell.overlay` 方案，或首期明确只支持聊天页。这里是本地固定包源码检查，不是运行验收。

验收应使用同尺寸截图对比角色位置、像素大小和输入区遮挡；检查新建／聊天切换、窗口缩放、输入卡增高、插件关闭、会话切换、减少动态效果与后台页面暂停。状态转换与资源释放需要行为验证，纯 CSS 不写重复断言。

本轮证据仅覆盖公开源码阅读、SVG 文本读取和方案设计；未运行测试、未构建、未进行真实 DSH 宠物运行验证。

## 落地结果（2026-10-03 后续）

按上面的边界实现为独立 feature `composer-pet`：**只在新会话页出现**（Claude 的机制如此，用户确认后按此实现），座位由 `shell.overlay` 加 `compat/pet-anchor.ts` 量出的卡片顶边右角承担；形象是自己画的 32×24 像素鲸鱼，没有引入任何第三方素材，因此不需要新增署名。只交付待机／工作中两种状态（点击反应做过三版都不合用户意，最终整个撤掉），等待用户与长时间空闲姿态按本文件第 58 行的约定留待真实信号。规格与实现细节见 [当前实现](IMPLEMENTATION.md)，本地检查与截图证据见 [验证记录](VERIFICATION.md)。
