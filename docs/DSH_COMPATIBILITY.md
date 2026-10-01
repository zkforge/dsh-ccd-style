# DSH 兼容边界

基线：2026-10-01，本机 DeepSeek Harness `0.2.0-rc.2`。通过只读解析应用 app.asar 核实官方模板、加载格式、主题服务与 UI 包版本；项目 devDependencies 使用相同版本的公开 SDK。

## 加载协议

Host 入口导出 Config／apply。`cordis.patch.yml` 的 insert 行注册 `dsh-ccd-style`，初始配置 enabled=false。包声明 dsh.bundle.patch、dsh.client.platform=web，并暴露 ./client。

Client 产物调用 `window.__ModuleLoader__.load()`，factory 返回 apply／inject。不应直接使用 ESM import 加载该产物。`dsh.client.inject` 是包名称信息边，不控制激活顺序；运行服务由导出的 Cordis inject 控制。动态组件注册用 slots.inject 等待插槽实际声明。

共享 React、Cordis、store、ui-slots、ui-primitives、ui-dockkit 由宿主提供。实际功能插件（ui-theme、ui-conversation、ui-workspace 等）不能运行时导入其组件或服务类：只用 SDK 类型、ctx 服务和正式插槽。需要新的静态库时先核实宿主模块表，再更新构建检查。

## 插槽、编辑器和恢复

插槽名称集中在 src/client/compat/slots.ts；类型由安装的 SDK 定义。较低 priority 优先，本项目预留 -10，仍需检查实际占用。单个位置的 children 声明同时包含独占渲染授权；覆盖父组件后不能重复声明或直接调用官方已有子位置。优先细粒度覆盖并复用 conversation.content Factory。

官方 Composer 拥有 Lexical 编辑器、IME、草稿、引用、附件、slash／@ 和 Queue／Steer。每会话只能有一个可编辑根。输入区移位需要运行验证，不能重新实现发送逻辑。

停用不能全局重置用户主题或配置。语义颜色覆盖返回 disposer，使用它恢复覆盖层；属性和内联样式由本模块准确恢复。骨架只检测所需服务形状；这不等同于支持其他 DSH 版本，也不等同于真实加载成功。

## 参考项目

[dsh-claude-style](https://github.com/Nwflower/dsh-claude-style) 可参考布局与清理思路。实施前固定其提交，逐项核对 DOM 适配和许可。当前没有移植其代码。该项目字体文件不在代码 MIT 授权范围内，不分发这些字体。

## 一手资料

- [Desktop](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/desktop/README.zh.md)
- [客户端包规则](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/AGENTS.md)
- [会话与 Factory](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-conversation/README.md)
- [插槽实现](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-slots/src/index.ts)
- [主题服务](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-theme/src/client/index.ts)

master 文档可能前进；适配决策以固定 SDK、本机资源及实际运行结果为准。
