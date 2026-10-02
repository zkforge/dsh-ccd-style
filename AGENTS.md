# AGENTS.md

本项目是 DSH 桌面版的 CCD 风格插件。用户已确认 macOS、浅色、新建页／聊天页／侧栏优先，使用 DSH 身份；先实现视觉和布局，高级交互后置。先读 [ARCHITECTURE.md](ARCHITECTURE.md)，再按 [docs/IMPLEMENTATION.md](docs/IMPLEMENTATION.md) 选模块；截图见 [README.md](README.md)，安装见 [install.md](install.md)，后续工作见 [docs/TECH_DEBT.md](docs/TECH_DEBT.md)。

## 工作约束

- 兼容基线为 DSH `0.2.0-rc.2`，通过正式插件加载，不修改应用 `app.asar`。
- 使用真实 Workspace、Session 和官方 Composer；不另建业务数据／发送逻辑，不复制官方插件组件。
- `.tsx` 组件接收 SDK 派生 props 和回调，不接收 `ctx`。服务操作在注册／适配层完成。
- 跨界面模块组合只在 `src/client/apply.ts`；兄弟 feature 之间不直接导入。
- 每个注册、样式、监听、观察器和异步资源都必须归属清理作用域；不能在模块顶层改 DOM。
- 用主题变量表达颜色；版本相关 DOM 选择器放兼容层并注明来源。参考字体 Anthropic Sans／Serif 未授权分发：不加入仓库、不加入包，也不写进字体栈。替代的 Geist 以 SIL OFL 1.1 分发，字体文件与 `OFL.txt` 放 `assets/fonts/`，**只供本机安装、不进 npm 包**；字体栈默认以它打头，未安装时自动回落系统字体。
- `planned` 是尚未实现；完成后改成 `implemented` 并提供 `mount()`，不要用空实现冒充完成。
- 原生 DSH 功能必须可达。真实统计数据缺失时省略统计区。
- 新增原生 DSH 插件只可类型导入；共享静态库可运行时导入，见兼容说明。

## 常用命令

```sh
npm ci --cache .cache/npm
npm run typecheck
npm run check:architecture
npm test
npm run build
npm run check:package
npm run check
npm run pack:local
```

`lib/` 是生成目录，不能手改。改变模块／SDK／构建协议时更新架构和兼容说明；每次交接更新验证记录，明确区分本地检查与真实 DSH 运行验证。视觉改动按同尺寸截图验收，不为纯 CSS 写重复断言；生命周期或业务入口变化需要针对对应行为验证。

清理时保留 `scripts/lib/` 源码、设计参考图、最新验收证据，以及 profile 或配置备份仍引用的安装包；其他生成文件可按构建命令重建。文档描述当前状态，已被取代的修复过程查 Git 历史。

## 代理

`proxy` 是定义在 `~/.zshrc` 的 shell 函数，用于给终端 CLI 开关代理：`proxy on`、`proxy off`、`proxy status`。它只影响当前终端会话，不会持久化。需要联网时在加载了该函数的 zsh 会话中使用。
