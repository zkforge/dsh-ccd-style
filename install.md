# 安装指南

环境：macOS、DeepSeek Harness Desktop `0.2.0-rc.2`、Node.js `>=22.18.0`、npm 和 Git。首次安装前启动一次 DSH，初始化 desktop profile。

## 从源码安装

```sh
git clone https://github.com/zkforge/dsh-ccd-style.git
cd dsh-ccd-style
```

已有仓库时，在当前 checkout 执行以下命令：

```sh
set -e
npm ci --cache .cache/npm
npm run pack:local --cache .cache/npm

ccd_app="${DSH_CCD_APP:-/Applications/DeepSeek Harness.app}"
ccd_cli="$ccd_app/Contents/Resources/runtime/cli/bin/dsh"
ccd_version="$(node -p 'require("./package.json").version')"
ccd_install_dir="$(mktemp -d "$PWD/artifacts/install.XXXXXX")"
ccd_tarball="$ccd_install_dir/dsh-ccd-style-$ccd_version.tgz"
cp "$PWD/artifacts/dsh-ccd-style-$ccd_version.tgz" "$ccd_tarball"
"$ccd_cli" plugin --profile desktop add "$ccd_tarball"
```

`pack:local` 会先完成类型、架构、测试、构建和包检查。每次安装使用唯一 tarball 路径；保留安装目录，profile 的本地依赖会引用它。

应用位于其他位置时，通过 `DSH_CCD_APP` 指定。自定义数据目录沿用应用的 `DSH_HOME`；默认 profile 为 `~/.dsh/profiles/desktop`。

## 启用与配置

安装后按 **⌘R** 重载 DSH，首次加载自动显示风格。升级保留此前的开关和配置。

在「插件 → dsh-ccd-style → ui-skin-ccd-style」调整：

- 总开关与各模块开关。
- 跟随系统、浅色或深色主题。
- 会话和侧栏背景色，自定义颜色作用于浅色模式。
- 界面与代码字体，可从本机字体列表选择或输入族名。
- 统计卡片，默认关闭。

改动即时生效，保存于当前 profile 的 `cordis.patch.yml`。颜色与字体留空时使用内置值。

## Geist 字体

双击仓库内的 `assets/fonts/Geist-Variable.ttf`，在 macOS 字体册中安装，然后重启 DSH。字体使用 SIL OFL 1.1 许可，全文见 [OFL.txt](assets/fonts/OFL.txt)。字体仅供本机安装，不包含在 npm 包中。

## 升级与卸载

升级时更新源码，重新执行安装命令。

临时恢复原生界面，在插件配置页关闭「启用 CCD 风格界面」。卸载使用同一应用、`DSH_HOME` 和 profile：

```sh
"${DSH_CCD_APP:-/Applications/DeepSeek Harness.app}/Contents/Resources/runtime/cli/bin/dsh" plugin --profile desktop remove dsh-ccd-style
```

如曾手动添加用户层覆盖配置，移除其中 `id: ui-skin-ccd-style` 的条目，然后重载 DSH。

npm 发布和市场收录后的安装入口见 [README](README.md)。
