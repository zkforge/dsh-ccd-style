# DSH CCD Style

面向 DeepSeek Harness 桌面版的 CCD 风格插件。当前提供可构建的项目骨架，视觉界面尚待实施。首个兼容目标是 macOS、DSH `0.2.0-rc.2`、浅色模式。

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
npm run pack:local
```

输出为 `lib/index.js`、`lib/client.js`、`lib/types/` 和 `artifacts/` 下的本地安装包。浏览器产物采用 DSH 的 `window.__ModuleLoader__.load()` 协议，不能作为普通 ESM 入口加载。React、Cordis 等共享运行库由宿主提供。

## 安装与配置

在开发运行验证阶段，先完全退出 DSH，再用桌面版自带 CLI 安装实际生成的安装包：

```sh
"/Applications/DeepSeek Harness.app/Contents/Resources/runtime/cli/bin/dsh" plugin --profile desktop add /absolute/path/to/dsh-ccd-style-0.1.0.tgz
```

重新打开 DSH。安装包声明的初始配置为 `enabled: false`。后续通过 DSH 插件配置修改 `enabled` 并重新加载插件；具体的设置页面操作需要在桌面版中验证。专用风格开关 UI 尚未实现。

启用当前骨架只挂载带作用域的设计变量，界面模块标记为 `planned`，不会呈现完成的 CCD 界面。关闭或卸载时释放插件资源。项目保持 `private: true`，支持本地打包；公开发布前还需由项目所有者确定许可证及发布信息。

## 源码目录中的交接入口

- [AGENTS.md](AGENTS.md)：模型工作入口、约束和检查命令。
- [ARCHITECTURE.md](ARCHITECTURE.md)：实际代码结构、状态归属和扩展协议。
- [PLAN.md](PLAN.md)：已确认的需求与截图基准。
- [实施交接](docs/IMPLEMENTATION.md)：各模块的下一步、允许修改的接口与完成条件。
- [DSH 兼容说明](docs/DSH_COMPATIBILITY.md)：加载协议、SDK 和插槽边界。
- [验证记录](docs/VERIFICATION.md)：已验证与尚待验证的边界。

参考 [Nwflower/dsh-claude-style](https://github.com/Nwflower/dsh-claude-style) 的接入思路；当前骨架未移植该项目代码或字体。视觉参数以用户提供的 CCD 截图为基准。参考截图仅用于本地开发，不进入安装包。
