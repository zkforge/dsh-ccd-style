# npm 发布准备

更新日期：2026-10-03。当前包名为 `dsh-ccd-style`，版本 `0.1.0`，兼容 macOS DSH Desktop `0.2.0-rc.2`。npm 官方 registry 的包名查询返回 404；最终名称校验以正式发布为准。

## 当前状态

- 包声明已移除 `private: true`，补齐作者、仓库、主页、反馈地址与关键词；`publishConfig` 指向 npm 官方 registry，并声明公开访问。
- 安装 bundle 设置 `enabled: true`，首次加载自动开启风格；已有用户层关闭状态仍优先。Host schema 和未加载配置的兜底保持 false。
- 包文件白名单保持 `lib/`、`cordis.patch.yml`、README，npm 自动包含 package.json 与 LICENSE。字体、源码、截图和本地验收材料不进入安装包。消费者无需本地编译。
- README 已准备官方插件页、终端和市场三个入口，明确 npm 未发布、市场未收录；当前使用 [源码安装指南](../install.md)。
- 本轮验证结果见 [验证记录](VERIFICATION.md)。已只读查询 npm 发布身份，返回 `ENEEDAUTH`（本机尚未登录 npm）；真实桌面首次安装、官方插件页按 npm 包名安装与市场安装仍待验证。

## 发布前最后检查

同一工作区仍有另一位 agent 修复 bug，本轮构建只是准备阶段的候选包。待其修复完成后，确认最终源码与文档，再重新执行：

```sh
npm run check
npm run pack:local --cache .cache/npm
```

从实际 tarball 复核入口、默认安装配置、文件清单与 SHA-256，并在隔离 profile 验证首次加载自动开启、保存关闭后升级仍关闭、用户配置保留、关闭恢复原生界面与卸载。记录本地夹具、隔离 Web 和真实 Desktop 的验证范围，不能互相代替。

随后通过 `npm whoami --registry=https://registry.npmjs.org/` 检查发布身份，确认包名未被占用及账号有权创建该包。仓库中的 `author` 只是归属元信息，不表示当前 npm 登录身份或发布权限。

正式公开发布应使用最终已验收的 tarball；本轮不执行发布。发布时更新 README 与安装指南的状态文字，并重打包、复核最终内容，避免公开包仍写“尚未发布”。发布后从 npm 下载验证，随后验收官方插件页输入包名的安装流程。不得把本地 tarball 成功视为 npm 发布或安装成功。

## 市场收录

市场入口要先明确具体产品。以社区 `dshmarket` 为例，其作者说明目录来自 `awesome-dsh-plugin`，需向目录仓库提交收录 PR；npm 发布不会自动使本插件出现在市场里。

收录资料包括 npm 包名、仓库地址、中英文简介、非敏感截图和兼容版本；提交前按目标目录当时的贡献规范核对字段。收录后再验证搜索、来源、目标 profile 与首次加载行为。市场的主题切换机制和本插件的 `config.enabled` 是两条需要核对的接口，未验收前不承诺“一键切换主题”。

参考：[npm 包声明说明](https://docs.npmjs.com/cli/v11/configuring-npm/package-json/)、[dshmarket 收录说明](https://github.com/dsh-market/dsh-market/blob/main/README.zh.md#提交你的插件)。
