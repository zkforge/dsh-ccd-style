# DSH Claude Code Desktop Style · Agent 安装指南

本指南用于让 agent 从源码完成 **预检 → 构建 → 安装 → 启用 → 验证**。目标环境为 **macOS + DeepSeek Harness Desktop `0.2.0-rc.2` + 浅色模式**。支持事实见 [兼容说明](docs/DSH_COMPATIBILITY.md)；项目介绍见 [README](README.md)。

> **给 agent 的指令：** 按本文安装并启用插件，保留现有 desktop profile 与其他插件配置。安装后报告构建检查、安装包、配置备份和实际启用状态；没有验证的步骤明确标为未验证。

## 1. 预检与取得源码

需要 Git、Node.js `>=22.18.0` 和 npm。DSH Desktop 应至少启动过一次，使 desktop profile 已初始化。当前只适配 `0.2.0-rc.2`；发现其他版本时先报告兼容性差异，不绕过版本限制。

默认应用与 profile：

| 项目 | 默认值 |
| --- | --- |
| 应用 | `/Applications/DeepSeek Harness.app` |
| CLI | `<应用>/Contents/Resources/runtime/cli/bin/dsh` |
| Profile | `${DSH_HOME:-$HOME/.dsh}/profiles/desktop` |
| 包名 | `dsh-ccd-style` |
| 配置条目 ID | `ui-skin-ccd-style` |

已在本仓库时复用当前 checkout，先读 [AGENTS.md](AGENTS.md)，并查看 `git status --short`；保留已有改动。没有源码时，在用户指定或合适的工作目录克隆：

```sh
git clone https://github.com/zkforge/dsh-ccd-style.git
cd dsh-ccd-style
```

应用不在默认位置时，可先 `export DSH_CCD_APP="/实际路径/DeepSeek Harness.app"`。用户使用自定义 DSH 数据目录时，沿用该应用使用的 `DSH_HOME`，避免安装到另一个 profile。

网络需要代理时，按当前环境配置。若已有 `~/.zshrc` 中的 `proxy` 函数，在加载它的 zsh 会话中先执行 `proxy on`；下方 bash 子进程会继承导出的代理变量。不要把 `proxy` 当成所有机器都存在的命令。

## 2. 一键构建并安装

**在仓库根目录复制执行整段命令。** 该流程检查环境、备份 profile 配置、按锁文件安装依赖、运行打包前完整检查，再通过正式 CLI 安装。它不会自动打开视觉开关；继续完成第 3 节。

```bash
bash <<'SH'
set -euo pipefail

[[ "$(uname -s)" == Darwin ]] || { echo 'Requires macOS.' >&2; exit 1; }
command -v node >/dev/null
command -v npm >/dev/null
[[ -f package.json && -f package-lock.json && -f cordis.patch.yml ]] || {
  echo 'Run this block from the dsh-ccd-style repository root.' >&2
  exit 1
}
node --input-type=module <<'NODE'
import { readFileSync } from 'node:fs';
const [major, minor] = process.versions.node.split('.').map(Number);
if (major < 22 || (major === 22 && minor < 18)) {
  throw new Error('Node.js >=22.18.0 is required.');
}
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
if (pkg.name !== 'dsh-ccd-style') throw new Error('Wrong repository.');
NODE

ccd_app="${DSH_CCD_APP:-/Applications/DeepSeek Harness.app}"
ccd_cli="$ccd_app/Contents/Resources/runtime/cli/bin/dsh"
[[ -x "$ccd_cli" ]] || { echo "DSH CLI not found: $ccd_cli" >&2; exit 1; }
ccd_dsh_version="$("$ccd_cli" --version)"
[[ "$ccd_dsh_version" == '0.2.0-rc.2' ]] || {
  echo "Unsupported DSH version: $ccd_dsh_version (expected 0.2.0-rc.2)." >&2
  exit 1
}
ccd_profile="${DSH_HOME:-$HOME/.dsh}/profiles/desktop"
[[ -f "$ccd_profile/package.json" ]] || {
  echo "Launch DSH Desktop once to initialize: $ccd_profile" >&2
  exit 1
}

ccd_backup="$(mktemp -d "$ccd_profile/.ccd-style-backup.XXXXXX")"
for ccd_file in package.json cordis.patch.yml pnpm-lock.yaml package-lock.json yarn.lock; do
  if [[ -f "$ccd_profile/$ccd_file" ]]; then
    cp -p "$ccd_profile/$ccd_file" "$ccd_backup/$ccd_file"
  fi
done
echo "Profile configuration backup: $ccd_backup"

npm ci --cache .cache/npm
# prepack runs typecheck, architecture checks, tests, build and package checks.
npm run pack:local --cache .cache/npm
ccd_version="$(node -p 'require("./package.json").version')"
# A unique path prevents pnpm from reusing an older file: tarball installation.
ccd_install_dir="$(mktemp -d "$PWD/artifacts/install.XXXXXX")"
ccd_tarball="$ccd_install_dir/dsh-ccd-style-$ccd_version.tgz"
cp "$PWD/artifacts/dsh-ccd-style-$ccd_version.tgz" "$ccd_tarball"
"$ccd_cli" plugin --profile desktop add "$ccd_tarball"

echo "Installed package: $ccd_tarball"
echo "Configuration backup: $ccd_backup"
echo 'Next: reload DSH and enable the plugin; see install.md section 3.'
SH
```

`set -euo pipefail` 会在失败处停止，完整检查失败时不会安装插件。输出中的 `artifacts/install.*/` 保存 profile 依赖指向的本地 tarball，**保留该目录**，避免后续重装或依赖恢复时找不到文件。备份保存配置与锁文件，不是会话或完整数据备份。

正式安装会将包加入 desktop profile 的 `dependencies` 与 `dsh.profile.bundles`，再应用包内的 `cordis.patch.yml`。只写一个配置条目不足以安装插件。安装流程不需要编辑应用 `app.asar`。

## 3. 启用风格

### 方式 A：DSH 插件面板

在 DSH 中按 **⌘R** 重新加载界面，打开「插件」→ `dsh-ccd-style` → **「启用 CCD 风格界面」**。开关切换立即生效。必要时正常重启应用；重启前保留当前工作。

安装成功时默认 `enabled: false`，界面保持原生是正常现象。使用浅色主题验收；深色未适配。

### 方式 B：Agent 合并 profile 配置

若 agent 可以编辑 profile 文件，可设置 `<profile>/cordis.patch.yml`。第 2 节已备份既有文件；若直接使用本节，先建立独立备份。将以下覆盖条目**合并到既有顶层 patch 列表**：

```yaml
- id: ui-skin-ccd-style
  name: dsh-ccd-style
  config:
    enabled: true
    debug: false
```

合并规则：

- 已有 `id: ui-skin-ccd-style` 时，只更新该条目的 `config.enabled`；保留已有 `debug`、`features` 及其他字段，不重复追加同一条目。
- 条目不存在时追加上述覆盖条目；文件不存在时以该列表新建。
- 用 YAML 解析／编辑工具保留其他 patch、条目顺序和注释；读取或解析失败时停止写入，不以示例覆盖整份文件。
- 若该条目被显式 `disabled: true`，一并设为 `disabled: false`；这是 loader 停用状态，与 `config.enabled` 是两个独立开关。
- `features.tool-calls` 与 `features.statistics` 尚未实现，保持关闭。四个核心 feature 默认开启；若用户此前关闭了某个模块，保留其选择。

这段列表用于**覆盖 bundle 已插入的条目**，无需再次写 `insert:`。保存后重新加载界面；如果配置没有被当前进程采纳，正常重启 DSH 再验证。

## 4. 验证与交付

分三层记录结果，不用「命令退出成功」代替「实际界面已启用」：

| 层次 | 检查 | 成功条件 |
| --- | --- | --- |
| 源码与包 | `pack:local` 的 prepack 输出 | 类型、架构、生命周期测试、构建、包检查全部通过，tarball 存在 |
| Profile 注册 | 只读取 profile 的 `package.json` | `dependencies` 中存在 `dsh-ccd-style`，`dsh.profile.bundles` 中包含该包名 |
| 实际桌面 | 重载后打开新会话、已有聊天与插件面板 | 开关已开启、核心界面呈现新风格；关闭可恢复，再打开可恢复风格 |

有可用且已授权的桌面／浏览器工具时，检查工作区入口、输入、模型／权限菜单、工具展开和侧栏收起仍可访问。无需为安装验收发送真实消息。不能访问实际 DSH 时，将「桌面启用／界面验收」标为未验证，并给出用户完成它的具体步骤。

若已有 DevTools／CDP 会话，可只读核对 `document.documentElement.getAttribute('data-dsh-ccd-style') === 'true'`。四个核心 feature 全开启时，通常能找到 7 个 `style[data-plugin="dsh-ccd-style"]`；自定义 feature 配置时数量可不同，不能单靠数量判定所有配置失败。停用后根标记和插件样式应移除。不为普通安装额外开启调试端口。

交付报告包含：

```text
DSH 版本 / profile：
源码提交 / 插件版本：
完整构建检查：通过 / 失败（具体步骤）
安装包绝对路径：
profile 配置备份：
profile 注册：已确认 / 未验证
启用方式与状态：
实际桌面验收：通过 / 未验证（原因与剩余操作）
```

项目既往的真实桌面验证与限制见 [docs/VERIFICATION.md](docs/VERIFICATION.md)，不能当作本次安装的实际验收结果。

## 5. 升级、重装与回退

**升级／重装：** 在已更新的源码 checkout 中重新执行第 2 节。已有工作树改动时先检查，不自动 `reset` 或覆盖文件。每次生成唯一 tarball 路径，避免同一 `file:` 路径让 pnpm 报 `Already up to date` 却继续使用旧产物；安装后复核配置与实际界面。既有启用及 feature 配置按第 3 节合并规则保留。

**临时恢复原生界面：** 在插件面板关闭「启用 CCD 风格界面」，或只把对应条目的 `config.enabled` 改为 `false`。插件会释放本次激活取得的资源；不需要卸载。

**卸载：** 使用与安装时相同的应用路径、`DSH_HOME` 和 desktop profile：

```sh
"${DSH_CCD_APP:-/Applications/DeepSeek Harness.app}/Contents/Resources/runtime/cli/bin/dsh" \
  plugin --profile desktop remove dsh-ccd-style
```

若曾在用户层追加覆盖条目，备份后只移除 `id: ui-skin-ccd-style` 的对应条目，保留其他 patch；随后重载。旧版本回退可通过 CLI 安装此前保留的 tarball。

不要在已有其他插件／配置变化后直接覆盖回整份旧 profile 备份。需要恢复时对照备份合并本插件相关差异，并通过 CLI 重新协调依赖与 bundle 注册；备份不包含 `node_modules`，只拷回 `package.json` 并不等于完成依赖回退。

## 6. 常见问题

| 现象 | 处理 |
| --- | --- |
| 找不到 CLI | 检查应用位置，设置 `DSH_CCD_APP`；不依赖 PATH 中可能指向其他版本的 `dsh` |
| 找不到 desktop profile | 启动正式 DSH Desktop 一次，并确认当前 `DSH_HOME` 与应用一致 |
| Node 版本过低 | 使用 Node.js `>=22.18.0`，再执行安装流程 |
| 网络或代理失败 | 修复当前 shell 的网络／代理后重试；保留锁文件，不通过删锁文件解决下载失败 |
| `check:package` 报 SDK 版本不一致 | 对照 `package.json` 与锁文件；项目要求 DSH SDK 固定为 `0.2.0-rc.2`，`^0.2.0-rc.2` 不满足当前检查规则。保留用户改动并报告，不跳过检查安装 |
| 安装后没有视觉变化 | 依次检查 desktop profile 注册、界面重载、loader 是否停用、`config.enabled` 与 feature 开关，并确认浅色模式 |
| 日志出现 `patch: entry ... not found` | 先确认包已通过 CLI 安装并加入 bundles；仅写覆盖条目不会创建 bundle 条目 |
| 更新后仍是旧风格 | 使用新的绝对 tarball 路径重新安装，再重载；必要时通过 CLI 移除并重新添加，保留配置备份 |
| 新版 DSH 的布局异常 | 当前只校准 `0.2.0-rc.2`；先停用恢复原生，再对照兼容层确认版本差异 |

资料来源：本仓库的包声明、配置实现、[DSH 兼容说明](docs/DSH_COMPATIBILITY.md) 与本机 DSH `0.2.0-rc.2` 自带 CLI。安装指南的本地校验范围见 [验证记录](docs/VERIFICATION.md)。
