# AGENTS.md

本项目是 DSH Desktop 的 CCD 风格插件。使用说明见 [README.md](README.md)，安装见 [install.md](install.md)，代码结构见 [ARCHITECTURE.md](ARCHITECTURE.md)。

## 常用命令

```sh
npm ci --cache .cache/npm
npm run typecheck
npm run check:architecture
npm test
npm run build
npm run check:package
npm run check
npm run pack:local --cache .cache/npm
```

DSH 换了构建后，宿主 CSS Module 类名会重新哈希，用下面的命令从新构建的 `app.asar` 重解前缀表（不带 `--write` 只打印）：

```sh
node scripts/host-prefixes.mjs --windows <app.asar> --write
node scripts/host-prefixes.mjs --pinned <macOS app.asar> --windows <Windows app.asar> --write
```