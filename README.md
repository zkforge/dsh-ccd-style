# DSH CCD Style

面向 DeepSeek Harness 桌面版的 CCD 风格界面插件。首版支持 macOS、浅色模式，兼容基线为 DSH `0.2.0-rc.2`。

插件把窗口骨架、左侧栏、新建会话页和聊天页调整到参考截图的几何与观感，同时保留 DSH 的身份、数据与全部原生能力：项目、会话、消息、编辑器、发送／停止、模型与权限操作仍然由 DSH 提供，插件只改变呈现。

参考截图与本地验证截图（`docs/reference/`、`docs/verification/local/`）**不随仓库发布**：前者含第三方产品界面与已登录账号，后者含真实会话内容。文档里指向它们的链接只在本地开发时可用，见 [.gitignore](.gitignore)。

## 开发

需要 Node.js `>=22.18.0` 和 npm。

```sh
npm ci --cache .cache/npm
npm run check
npm run dev
```

`check` 包含严格类型检查、模块边界检查、生命周期测试、构建和发布包检查。`dev` 重建 JS/CSS；打包前运行完整构建刷新声明文件。它不会自动安装或重载 DSH。

```sh
npm run build
npm run pack:local --cache .cache/npm
```

输出为 `lib/index.js`、`lib/client.js`、`lib/types/` 和 `artifacts/dsh-ccd-style-0.1.0.tgz`。浏览器产物采用 DSH 的 `window.__ModuleLoader__.load()` 协议，不能作为普通 ESM 入口加载。React、Cordis 等共享运行库由宿主提供。

## 安装、启用、停用与恢复

用桌面版自带 CLI 把安装包加入 desktop profile：

```sh
"/Applications/DeepSeek Harness.app/Contents/Resources/runtime/cli/bin/dsh" plugin --profile desktop add \
  /absolute/path/to/dsh-ccd-style-0.1.0.tgz
```

该命令会把包写入 profile 的 `dependencies` 并自动加入 `dsh.profile.bundles`，因此包内的 `cordis.patch.yml` 会被当作 bundle 层插入。此后重新加载界面（⌘R）即可生效；无需修改应用 `app.asar`。

插件默认配置为 `enabled: false`。启用方式二选一：

1. 在 DSH 的「插件」面板里打开 `dsh-ccd-style`，用自动生成的「启用」开关打开或关闭；切换立即生效，无需重启。
2. 在 `~/.dsh/profiles/desktop/cordis.patch.yml` 中覆盖条目配置：

   ```yaml
   - id: ui-skin-ccd-style
     name: dsh-ccd-style
     config:
       enabled: true
       debug: false
   ```

**停用与恢复**：把开关关闭（或把 `enabled` 设为 `false`）后，插件会以逆序释放本次启用取得的全部资源——根属性、注入的样式表，以及写在宿主节点上的自定义属性（账号菜单标记与名称、统计读数、视图切换器几何），界面回到未改造的原生状态。重新打开开关即恢复。卸载用 `dsh plugin --profile desktop remove dsh-ccd-style`。

配置项：`enabled`（总开关）、`debug`（控制台日志）、`features.*`（按模块开关：`shell`、`sidebar`、`new-session`、`conversation` 默认开启，`tool-calls`、`statistics` 默认关闭）。

## 源码目录中的交接入口

- [AGENTS.md](AGENTS.md)：模型工作入口、约束和检查命令。
- [ARCHITECTURE.md](ARCHITECTURE.md)：实际代码结构、状态归属和扩展协议。
- [PLAN.md](PLAN.md)：已确认的需求与截图基准。
- [实施状态](docs/IMPLEMENTATION.md)：各模块的当前实现与后续动作。
- [DSH 兼容说明](docs/DSH_COMPATIBILITY.md)：加载协议、SDK、插槽与版本相关选择器。
- [验证记录](docs/VERIFICATION.md)：已完成的检查、真实 Desktop 验证及其边界。

参考 [Nwflower/dsh-claude-style](https://github.com/Nwflower/dsh-claude-style) 的接入思路；本项目未移植该项目代码或字体。视觉参数以用户提供的 CCD 截图为基准。参考截图与本地验证截图仅用于本地开发，不进入安装包，也不随仓库发布。

## 许可

[MIT](LICENSE)。参考截图中的字体（Anthropic Sans／Serif）不在本项目授权范围内，也未随包分发；插件使用系统字体栈。
