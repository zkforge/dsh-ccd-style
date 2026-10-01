# 后续模型实施交接

从 README、ARCHITECTURE 和 PLAN 入手。当前可以构建骨架；所有界面模块是 planned。用户本轮仅要求搭架构，完整 CCD UI 由后续模型实施。无需重新采访已确定的需求，也无需等待录屏。

## 第一步：真实加载验证

运行 npm ci、npm run check，生成本地包；在测试项目／会话中安装，验证默认停用、插件配置启用与重载、停用恢复。读取实际 SDK 的插槽所有权与组件 props，做一个可撤销的小型覆盖，验证 Composer Factory 复用。不要把源码检查或 VM 中 factory 执行写成“桌面版验证通过”。

新增功能遵循 FeatureDefinition：把对应入口改为 implemented，实现 mount(environment, scope)，保留任务／状态记录。Context 不进入组件；所有注册 disposer 进入 scope。可用设置入口由 DSH 原功能提供，专用风格开关 UI 可在实际注册位置核实后补充。

## shell

入口：src/client/features/shell/index.ts。先处理侧栏约 264 px、近白背景、主画布及 macOS 顶部空间。拖动区、窗口按钮、隐藏侧栏后的入口必须有效。版本相关样式挂载点放 compat。完成条件是同尺寸骨架对齐与停用恢复，不只改变背景色。

## sidebar

入口：src/client/features/sidebar/index.ts。用 DSH Workspace 映射项目，用标准 hooks 读取项目／会话，通过 HostServices.workspace 的真实操作导航。压缩品牌区、重排新建和“更多”、校准选中态、行高、标题与底部账号区。若整体 sidebar 覆盖受到 child 所有权限制，先实现正式细粒度扩展，记录可用方案。不要制作无功能的 Home／Code／Routines 按钮。

## new-session

入口：src/client/features/new-session/index.ts。上部问候／内容、底部 Composer，目标输入卡片约 769 px 宽、43 px 最小高度。33 px 是卡片底边到窗口底边的参考距离，包含下方控件布局，不能简单当作整个输入组件的 bottom 值。优先复用官方结构／Factory。多行输入、IME、附件、草稿、权限与模型选择仍可用。

## conversation

入口：src/client/features/conversation/index.ts。重排顶栏和正文宽度，校准用户消息、助手排版、列表与代码块，复用统一底部输入区。保留滚动、发送／停止、审批、右栏、修改和产物入口。Composer 的共同布局若跨模块使用，应提取到公共主题／兼容层，不由两个 feature 互相导入。

## tool-calls

入口：src/client/features/tool-calls/index.ts。首版默认关闭，保留原生展示。后续要重构一行概要和展开时，使用 tool.call.toolview，保留准备、执行、结果、失败、授权和子调用信息；不得更改工具生命周期。

## statistics

入口：src/client/features/statistics/index.ts。首版默认关闭。先确定真实全局用量接口及可聚合范围，再决定统计卡片和热力图。接口缺失时保持关闭；不放示例数字。若需 Host 路由，先记录具体数据边界并扩展 Host 层，不能从展示组件读取 profile 文件。

## 交付要求

每个模块提交代码、必要行为验证、同尺寸目标／实际对照图以及 docs/VERIFICATION 的状态更新。本地截图放 docs/verification/local（被忽略），不要覆盖原参考图。几何估值需用真实 DOM 校准。整个 UI 完成后再次验证本地包、重启、停用与恢复，再决定公开发布和其他版本支持。

待处理事项见 [TECH_DEBT.md](TECH_DEBT.md)。
