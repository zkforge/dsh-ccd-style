<div align="center">

# DSH CCD Style

**更轻盈的 DSH 桌面界面 · A quieter interface for DSH Desktop**

CCD 风格布局，DSH 原生能力。<br>
CCD-inspired presentation, powered by native DSH.

![DSH compatibility](https://img.shields.io/badge/DSH-0.2.0--rc.2-536878?style=flat-square)
![Platform](https://img.shields.io/badge/platform-macOS-777777?style=flat-square)
![Appearance](https://img.shields.io/badge/appearance-light-f0f0ef?style=flat-square)
[![License: MIT](https://img.shields.io/badge/license-MIT-508c48?style=flat-square)](LICENSE)

[简体中文](#简体中文) · [English](#english) · [Agent 安装 / Install](install.md)

</div>

---

## 简体中文

面向 **DeepSeek Harness Desktop** 的 CCD 风格界面插件。通过正式插件机制调整窗口、侧栏、新建会话页和聊天页的布局与观感，保留 DSH 品牌与原生工作流。

### 界面亮点

| 区域 | 改进 |
| --- | --- |
| 窗口与侧栏 | 柔和浅色、紧凑导航、统一选中态；分隔线跟随原生侧栏拖动 |
| 新建会话 | 顶部问候、对齐的工作区选择器、底部输入区，内容最大宽度 770px |
| 聊天与输入 | 精简消息样式；发送／停止按钮位于输入框内；原生用量读数收进控制行 |
| 会话顶栏 | 标题、Agent 预设与「对话／轨迹」合为一行，分段选中块平滑切换 |
| 菜单与小窗口 | 紧凑账号菜单、底部菜单避让；保留侧栏收起与右侧面板能力 |

Workspace、Session、消息、官方 Composer、发送／停止、模型、权限及工具展开均由 DSH 提供。关闭插件开关会释放样式与观察器，恢复原生界面。

### 支持范围

- **兼容基线：** DSH `0.2.0-rc.2`，macOS、浅色模式；真实桌面验证环境为 macOS arm64。
- **已实现：** `shell`、`sidebar`、`new-session`、`conversation`。
- **尚未实现：** 深色主题、独立工具调用界面、跨会话统计面板；没有真实统计接口时不展示示例数字。
- **字体：** 系统 UI 字体栈；不分发参考截图中的 Anthropic 字体。

### 快速安装

**交给 agent：** 复制下面的指令；完整的预检、一键命令、启用与验收步骤见 [install.md](install.md)。

```text
请读取 https://github.com/zkforge/dsh-ccd-style/blob/main/install.md，
按文档在本机安装并启用 DSH CCD Style，保留已有 profile 配置，
完成验证并报告安装包路径、备份位置和实际启用状态。
```

**从源码安装：** 需要 Git、Node.js `>=22.18.0`、npm，以及已启动过的 DSH Desktop `0.2.0-rc.2`。在新的工作目录执行：

```sh
(
set -eu
git clone https://github.com/zkforge/dsh-ccd-style.git
cd dsh-ccd-style
npm ci --cache .cache/npm
npm run pack:local --cache .cache/npm

DSH_CCD_VERSION="$(node -p 'require("./package.json").version')"
"/Applications/DeepSeek Harness.app/Contents/Resources/runtime/cli/bin/dsh" \
  plugin --profile desktop add "$PWD/artifacts/dsh-ccd-style-$DSH_CCD_VERSION.tgz"
)
```

`pack:local` 在打包前自动执行类型、架构、生命周期测试、构建和安装包检查。上述命令适用于首次安装；**升级或重装请使用 [install.md](install.md) 中的唯一安装包路径流程**，避免同路径 tarball 被缓存。

安装后在 DSH 中按 **⌘R** 重新加载，进入「插件」→ `dsh-ccd-style`，打开 **「启用 CCD 风格界面」**。插件默认关闭；安装成功与视觉启用是两个步骤。完整应用重启也已验证，详见 [验证记录](docs/VERIFICATION.md)。

### 配置与恢复

| 配置 | 默认值 | 作用 |
| --- | --- | --- |
| `enabled` | `false` | 总开关，切换立即生效 |
| `debug` | `false` | 控制台调试日志 |
| `features.shell` / `sidebar` / `new-session` / `conversation` | `true` | 四个已实现模块的独立开关 |
| `features.tool-calls` / `statistics` | `false` | 尚未实现，保持关闭 |

关闭总开关即可恢复原生界面，再打开即可恢复风格。卸载命令：

```sh
"/Applications/DeepSeek Harness.app/Contents/Resources/runtime/cli/bin/dsh" \
  plugin --profile desktop remove dsh-ccd-style
```

### 开发与文档

```sh
npm ci --cache .cache/npm
npm run check
npm run dev
```

`dev` 监听并重建 JS/CSS，不自动安装或重载 DSH。`lib/` 是生成目录；正式打包由完整构建更新声明文件。客户端使用 DSH 的 `window.__ModuleLoader__.load()` 协议，共享运行库由宿主提供。

下列文档面向源码仓库；安装包不包含完整开发文档。

| 文档 | 内容 |
| --- | --- |
| [install.md](install.md) | Agent 安装、启用、验证、升级与回退 |
| [AGENTS.md](AGENTS.md) | 代理工作约束与检查命令 |
| [ARCHITECTURE.md](ARCHITECTURE.md) | 模块边界、状态归属与资源清理 |
| [实施状态](docs/IMPLEMENTATION.md) | 各模块已实现内容与后续动作 |
| [DSH 兼容说明](docs/DSH_COMPATIBILITY.md) | SDK、加载协议、配置传输与 DOM 适配 |
| [验证记录](docs/VERIFICATION.md) | 本地检查与真实 Desktop 验证的证据及边界 |
| [PLAN.md](PLAN.md) · [技术债](docs/TECH_DEBT.md) | 产品目标与待处理事项 |

参考 [Nwflower/dsh-claude-style](https://github.com/Nwflower/dsh-claude-style) 的接入思路，未移植其代码或字体。参考图与验收截图含账号或真实会话内容，仅用于本地开发，不随仓库或安装包分发。

---

## English

A CCD-inspired presentation plugin for **DeepSeek Harness Desktop**. It refines the window, sidebar, new-session page and conversation page through DSH's official plugin system, retaining DSH branding and native workflows.

### Interface highlights

| Area | Improvements |
| --- | --- |
| Window & sidebar | Soft light surfaces, compact navigation and consistent selection states; the divider follows native sidebar resizing |
| New session | Greeting at the top, aligned workspace selector and bottom composer; content width capped at 770px |
| Conversation & composer | Refined messages, send/stop inside the input panel and native usage readings in the control row |
| Conversation header | Title, Agent preset and conversation/trace tabs on one row, with an animated selection indicator |
| Menus & smaller windows | Compact account menu, bottom-menu positioning and support for collapsed sidebars and right panels |

DSH owns workspaces, sessions, messages, the official Composer, send/stop, models, permissions and tool expansion. Disabling the plugin releases its styles and observers and restores the native interface.

### Support

- **Compatibility baseline:** DSH `0.2.0-rc.2`, macOS, light mode. Desktop verification was performed on macOS arm64.
- **Implemented:** `shell`, `sidebar`, `new-session`, `conversation`.
- **Not implemented yet:** dark mode, a dedicated tool-call interface and cross-session statistics. No placeholder statistics are shown.
- **Typography:** system UI fonts; Anthropic fonts from the reference images are not distributed.

### Quick install

**Ask your agent:** Copy this instruction. [install.md](install.md) contains prerequisites, a single installation command block, activation and acceptance checks. The detailed guide is in Chinese; its commands and configuration keys are language-independent.

```text
Read https://github.com/zkforge/dsh-ccd-style/blob/main/install.md and install
and enable DSH CCD Style on this machine. Preserve existing profile settings,
verify the result, and report the package path, backup location and actual
activation status.
```

**Install from source:** Requires Git, Node.js `>=22.18.0`, npm and DSH Desktop `0.2.0-rc.2`, launched at least once. Run in a new working directory:

```sh
(
set -eu
git clone https://github.com/zkforge/dsh-ccd-style.git
cd dsh-ccd-style
npm ci --cache .cache/npm
npm run pack:local --cache .cache/npm

DSH_CCD_VERSION="$(node -p 'require("./package.json").version')"
"/Applications/DeepSeek Harness.app/Contents/Resources/runtime/cli/bin/dsh" \
  plugin --profile desktop add "$PWD/artifacts/dsh-ccd-style-$DSH_CCD_VERSION.tgz"
)
```

`pack:local` runs type checks, architecture checks, lifecycle tests, the build and package checks before packing. These commands cover a first install. **For updates or reinstalls, use the unique archive path workflow in [install.md](install.md)** to avoid tarball caching.

After installation, press **⌘R** in DSH, open **Plugins → `dsh-ccd-style`** and turn on **「启用 CCD 风格界面」** (“Enable CCD-style interface”). The plugin is disabled by default: registration and visual activation are separate steps. A full application restart has also been verified; see the [verification record](docs/VERIFICATION.md).

### Configuration & removal

| Setting | Default | Purpose |
| --- | --- | --- |
| `enabled` | `false` | Master switch; changes take effect immediately |
| `debug` | `false` | Console debug logging |
| `features.shell` / `sidebar` / `new-session` / `conversation` | `true` | Independent switches for the four implemented modules |
| `features.tool-calls` / `statistics` | `false` | Planned modules; leave disabled |

Turn off the master switch to restore the native interface, or turn it back on to restore the style. To uninstall:

```sh
"/Applications/DeepSeek Harness.app/Contents/Resources/runtime/cli/bin/dsh" \
  plugin --profile desktop remove dsh-ccd-style
```

### Development & documentation

```sh
npm ci --cache .cache/npm
npm run check
npm run dev
```

`dev` watches and rebuilds JS/CSS; it does not install the plugin or reload DSH. `lib/` is generated. A full build refreshes declarations before packing. The client uses DSH's `window.__ModuleLoader__.load()` protocol, with shared runtime libraries supplied by the host.

The links below target the source repository; the package does not include the full development documentation.

| Document | Contents |
| --- | --- |
| [install.md](install.md) | Agent installation, activation, verification, updates and rollback |
| [AGENTS.md](AGENTS.md) | Agent constraints and check commands |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Module boundaries, state ownership and resource cleanup |
| [Implementation status](docs/IMPLEMENTATION.md) | Implemented behavior and remaining work |
| [DSH compatibility](docs/DSH_COMPATIBILITY.md) | SDK, loading protocol, configuration transport and DOM adapters |
| [Verification record](docs/VERIFICATION.md) | Local checks, actual Desktop evidence and limitations |
| [PLAN.md](PLAN.md) · [Technical debt](docs/TECH_DEBT.md) | Product goals and open work |

The integration approach references [Nwflower/dsh-claude-style](https://github.com/Nwflower/dsh-claude-style); no code or fonts have been ported. Reference and acceptance screenshots contain account details or real conversation content and remain local development material, excluded from the repository and package.

---

## License / 许可

[MIT](LICENSE). Anthropic Sans/Serif are not covered by this project's license and are not included. / Anthropic Sans／Serif 不在本项目授权范围内，也未随包分发。
