# DSH Claude Code Desktop Style

为 DeepSeek Harness Desktop 提供 Claude Code Desktop 风格的侧栏、新会话页、聊天页与输入区。

支持 macOS（Apple 芯片）与 Windows 10 及以上（64 位）、DSH `0.2.0-rc.2`，浅色与深色模式。首次安装后自动开启，升级沿用已保存的配置。

## 安装

当前使用[源码安装](https://github.com/zkforge/dsh-ccd-style/blob/main/install.md)。复制以下指令交给 Agent：

```text
请按 https://github.com/zkforge/dsh-ccd-style/blob/main/install.md 安装 DSH Claude Code Desktop Style。
```

npm 发布及市场收录完成后，可使用以下入口：

| 入口 | 安装方式 |
| --- | --- |
| 官方插件页 | 「插件 → 添加插件」输入 `dsh-ccd-style` |
| 终端 | `dsh plugin --profile desktop add dsh-ccd-style` |
| 插件市场 | 搜索 `dsh-ccd-style` 并安装 |

## 功能

- 紧凑侧栏、工作区导航与会话列表，新会话条目在第一次发送后出现。
- 统一的新会话页、输入卡片和聊天布局，正文边缘随滚动渐隐。
- 模型与 effort 独立选择器，支持搜索、滑块和键盘操作。
- 会话顶栏提供终端、浏览器和应用打开入口。
- Markdown 链接、行内代码、表格与代码块样式。
- 新会话页的像素小鲸鱼，待机眨眼与摆尾。
- 跟随 DSH 的浅色、深色和系统主题，支持自定义背景色与字体。
- 用量统计卡片：Overview／Models 视图、时间范围、贡献热力图与模型图表，默认关闭。

## 配置

打开「插件 → dsh-ccd-style → ui-skin-ccd-style」，调整总开关、模块、主题、颜色和字体。改动即时生效。

界面默认使用 Geist，未安装时使用系统字体。仓库的 `assets/fonts/` 提供本机安装用字体与 OFL 许可。

## 开发

```sh
npm ci --cache .cache/npm
npm run check
npm run pack:local --cache .cache/npm
```

代码结构见 [ARCHITECTURE.md](https://github.com/zkforge/dsh-ccd-style/blob/main/ARCHITECTURE.md)。

## 反馈与许可

通过 [Issue](https://github.com/zkforge/dsh-ccd-style/issues) 反馈问题，附上 DSH 版本、窗口尺寸和复现步骤。

[MIT](./LICENSE) © 2026 zkforge。
