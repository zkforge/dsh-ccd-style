# 当前实现

更新日期：2026-10-02。兼容基线为 DSH `0.2.0-rc.2`、macOS、浅色模式。模块边界见 [架构](../ARCHITECTURE.md)，实际验证与限制见 [验证记录](VERIFICATION.md)，后续事项见 [待办](TECH_DEBT.md)。

## 范围与验收基准

首版调整窗口、侧栏、新建页和聊天页的视觉与布局，使用 DSH 身份。Workspace、Session、消息、官方 Composer、模型、权限、工具与发送流程都由宿主持有。当前没有替换官方业务组件或注册新的会话插槽。

用户认可的展示图在 [README](../README.md)。开发用 CCD 参考图保留在本地 `docs/reference/`，不进入 Git 或安装包；字体使用系统栈。视觉修改按同尺寸截图和 DOM 几何验收，不把展示截图当作完整交互验证。

| 模块 | 状态 | 默认 |
| --- | --- | --- |
| shell | implemented | 开启 |
| sidebar | implemented | 开启 |
| new-session | implemented | 开启 |
| conversation | implemented | 开启 |
| tool-calls | planned | 关闭 |
| statistics | planned | 关闭 |

总开关 `enabled` 默认关闭。开启时挂载作用域样式与兼容适配，关闭时释放取得的资源；设置传输和清理流程见架构。

## 窗口与侧栏

入口：`src/client/features/shell/`、`src/client/features/sidebar/`。

- 平铺浅色背景，侧栏右边缘显示分隔线；轨道宽度与拖动完全由 DSH 控制。
- 展开态统一品牌、导航与工作区列表的缩进、图标列及行距；新会话、插件、自动化任务采用相同导航节奏。
- 收起态使用宿主自己的图标轨几何。macOS 展开／收起入口共享窗口坐标：普通窗口 `88/11`，全屏 `12/11`，按钮 `28×28`；非 macOS 保留原生布局。
- 账号行高 30px，底边留白 8px；账号菜单宽 236px、行高 28px，页眉展示宿主账号名，原生条目与回调保留。
- Home/Code 与参考图独有导航没有对应的 DSH 能力，未制作空入口。

## 新建页

入口：`src/client/features/new-session/`。

- 问候块位于内容列的水平与垂直中心；官方 Composer 固定到底部。
- 工作区与 Agent 预设芯片同输入面板左边缘对齐，26px 高、8px 圆角、细边框。
- 输入卡片最大宽度 770px。未选工作区时，仅输入面板显示虚线；选择工作区与编辑器禁用状态由宿主处理。
- 默认提示语与正常聊天统一，中英文可见文本与 aria-label 同步；工作区或阻断提示优先。提示语单行省略，实际编辑器正常换行与增长。

## 聊天页与共用 Composer

入口：`src/client/features/conversation/`；共用输入区几何在 `src/client/theme/composer.css`。

- 正文列宽 770px；调整消息气泡、工具行、推理行与代码块观感，保留原生滚动、执行、授权与工具展开。
- 输入面板最小高度 42px，控制行高 28px，间距 4px；附件轨与面板合成连续表面，缩略图和面板共用 10px 圆角。
- 发送／停止按钮固定在面板底部右侧，24px 按钮、16px 图标，底边间距 9px；同时显示两按钮时留 6px 间距。图标采用 DSH 共享库几何，归属写入 LICENSE。
- 原生速率、token 与上下文读数放到模型选择之前。Composer 容器宽度 ≤700px 时前两项只留图标，上下文保留百分比；读数详情仍由宿主提供。
- 模型按钮按剩余空间限宽，推理等级保留、模型名按需省略；≤560px 时权限控件只留图标。布局依据实际输入列，而非窗口宽度。
- 聊天顶栏合并成 49px 单行：会话标题 → 对话／轨迹 → 智能体团队与原生操作。被动模式展示隐藏，团队完整文字和操作入口保留。
- 视图轨道固定 `80×22px`，每格 `40×22px`。标题自然宽度上限 112px；标题与轨道、轨道与团队的可见间距均为 10px，不随右栏拖动切换断点。
- macOS 侧栏收起时省略会话标题，保留窗口控制区让位。视图选择切换使用 180ms 动画；框架轨道变化即时校正滑块，减少动态效果偏好下关闭动画。

兼容层负责菜单翻转、统计几何、视图滑块、账号展示与提示语适配。选择器来源和版本依赖见 [兼容说明](DSH_COMPATIBILITY.md)。

## 尚未实现

`tool-calls` 保留原生展示，后续可从 `tool.call.toolview` 扩展；不能丢失执行、结果、失败、授权与子调用信息。`statistics` 尚无真实跨会话用量接口，保持关闭，不展示示例数字。其他待办集中在 TECH_DEBT。

## 开发与验证入口

`npm run check` 执行完整本地检查，`npm run pack:local --cache .cache/npm` 生成安装包，正式安装与升级步骤见 [安装指南](../install.md)。`lib/` 为生成目录，`scripts/lib/` 为构建共享源码。

| 工具 | 用途 |
| --- | --- |
| `scripts/desktop-probe.mjs` | CDP 表达式、截图、DOM 与控制台检查 |
| `scripts/desktop-responsive.mjs` | 多组尺寸量测与截图 |
| `scripts/desktop-preview.mjs` | 临时样式预览，clear 或刷新撤销 |
| `scripts/desktop-coldstart.mjs` | 按明确的重启范围执行冷启动与渲染层检查 |
| `scripts/web-harness.mjs` / `scripts/dom-outline.mjs` | 隔离 Web profile 的截图与结构检查 |

工具使用说明在各脚本头部；浏览器工具依赖本机 Playwright 与 Chromium，不随安装包分发。新增功能后同步本文件、兼容说明与验证记录。
