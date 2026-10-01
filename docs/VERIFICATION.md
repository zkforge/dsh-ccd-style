# 验证记录

更新日期：2026-10-02。本文件保留当前验证结论与证据位置，源码检查、夹具和真实运行分开记录。已被后续修复取代的详细记录保存在 Git 提交 `ec55195` 中，可执行 `git show ec55195:docs/VERIFICATION.md` 查看。

## README 完善与提交前检查（2026-10-02）

保留用户现有主标题和截图／安装指南／参与贡献／开源许可证四个标题，补齐兼容范围、Agent 与手动安装、启用与恢复、开发流程和归属说明。手动安装示例直接打包到唯一路径，避免覆盖既有安装包；安装指南标题同步，移除已完成的 README 待办。

`git diff --check` 与完整 `npm run check` 通过（类型、架构、18 项行为测试、构建、32 文件包检查）；README 的四个标题与图片路径已核对，所有 shell 示例通过 `bash -n`，仅检查语法，未执行安装命令。本轮没有新增 Desktop／Web 运行验证，npm 公开发布仍未开启。

## 本轮工作区清理

清理一次性探测脚本、旧 Web 日志、重复截图、参考项目下载与 app.asar 提取缓存，共移除 145 个文件／目录入口、35.93 MiB；保留开发依赖、npm 缓存、设计参考图、最新验收证据、隔离 Web profile，以及配置备份和它们引用的 8 个 tarball，全部 tarball 清理前后 SHA-256 一致。当前 Desktop profile 仍引用 `artifacts/install-balanced-spacing-final/dsh-ccd-style-0.1.0.tgz`。

移除已删除计划文件的文档引用，实施状态与待办改为当前结论；根目录 `/lib/` 忽略规则不再误隐藏 `scripts/lib/platform.mjs`。文档检查自动发现现有 Markdown。两张用户截图按内容重命名并展示在 README，原图 SHA-256 未变。开发工具移除废弃的侧栏补偿参数／读数，响应式检查按当前 80×22px 轨道判断；CSS 预览说明改为实际的显式 clear 行为，并注明不覆盖运行时适配。

本轮没有修改业务或样式、没有安装或重载 DSH，也没有新增 Desktop／Web 运行验收。清理后 `npm run check` 通过；另将 Git 可见的现有源码复制到临时目录，只复用开发依赖，不带忽略的构建产物或本地缓存，完整检查同样通过，临时副本已移除。所有开发脚本通过 `node --check`；本轮没有实际连接 CDP 执行这些工具。客户端构建 SHA-256 仍与最近交付记录一致。

## 最近一次本地完整检查

2026-10-02 清理后 `git diff --check` 与 `npm run check` 全部通过：类型、架构、18 项行为测试、构建、32 文件安装包检查。测试覆盖清理逆序与幂等、激活资源所有权、失败回滚、菜单定位恢复、统计几何与短读数、视图滑块以及提示语／aria-label 的条件恢复。

这类检查证明源码与窄夹具行为，不证明真实 Desktop 的视觉或发送流程。安装包包含 `lib/`、patch、README、LICENSE 与 package.json；开发工具和截图不进入包。

## 最新布局运行验收（2026-10-02）

环境：隔离 `.cache/verify/home-web`，DSH `0.2.0-rc.2` 官方 Web 客户端、正式插件加载，端口 19570；Playwright Chromium，启动后设置 macOS 标记；1280×820 @2x。实际拖动右栏，覆盖短标题、长标题、左栏收起与 400／520／640／700px 聊天列；关闭右栏另测 1000px。

| 项目 | 结果 |
| --- | --- |
| 顶栏间距 | 标题至视图轨道、轨道至团队入口均为 10px |
| 拖动同步 | 195 次采样，各标题／收起状态内整轨位移范围为 0；短标题相对列左边缘 56px，长标题 126px，收起态 162px |
| 轨道与滑块 | 轨道 80×22px、每格 40×22px，滑块偏差为 0 |
| 布局边界 | 顶栏裁切、控件重叠、统计重叠、横向溢出均为 0，发送按钮保持在面板内 |
| 提示语与输入 | 新建页与聊天页默认文案一致；窄列提示语单行，真实多行草稿使面板正常增长 |
| 原生入口 | 团队／模型菜单和视图切换可达；更多操作、更多打开方式出现原生 menu，Escape 可关闭 |
| 渲染异常 | 0 pageerror |

本地证据：`output/playwright/header-balanced-spacing/` 的同尺寸截图、`header-detail.png` 与 `geometry.json`。最终探测脚本 `.verify/header-balanced-spacing.mjs` 保留供本机复验；它使用当前隔离 profile 的测试会话与本机浏览器路径，不是可移植自动测试。报告 before／after 为同一构建，不作前后对照。

边界：该轮没有刷新用户 Desktop 或冷启动 Electron。完整统计结构使用同版本宿主 DOM 补充夹具，不代表真实统计详情数据端到端通过；没有发送消息。

## 其他仍适用的运行结论

| 场景 | 验证范围与边界 |
| --- | --- |
| macOS 侧栏按钮 | 官方 Web macOS DOM 下展开／收起位置 88/11，全屏属性下 12/11；逐帧 hit-test 无空帧或位移。没有在真实 Electron 中实测系统红绿灯与全屏切换 |
| Composer 增长与附件 | 官方文件选择与真实多行编辑器；1／8／20 行面板为 42／210／336px，按钮底边间距保持 9px。未模拟剪贴板 paste 或拖拽叠层 |
| 停止／发送双按钮 | 宿主 DOM 结构夹具验证 24px 按钮与 6px 间距、16px 图标；未重跑真实请求组合 |
| 底边菜单 | 同版本 Web 的真实账号／模型／工作区菜单，放得下时不写高度上限，离开固定 menu 表面后撤掉标记与上限 |
| 未选工作区 | 实际 Web 新建页仅输入面板显示虚线，发送保持禁用；未完成目录选择的端到端流程 |

保留证据：`docs/verification/local/sidebar-anchor/`、`output/playwright/composer-controls.json` 与对应最终截图、`docs/verification/local/web-hero-menu-above*.png`。详细旧记录与限制可从上述 Git 提交查看。

## 真实 Desktop 基线（2026-10-01）

环境：DSH `0.2.0-rc.2`，Electron 44.0.0，macOS arm64。真实窗口 1280×820；同尺寸对照使用 1374×871、dpr 2 的 CDP 设备指标覆盖。

| 层次 | 已确认 |
| --- | --- |
| 安装与配置 | 正式 CLI 将包加入 profile dependencies 与 bundles；自动生成设置开关，默认关闭 |
| 启用／停用／恢复 | 根属性与插件样式挂载、释放、重新挂载；原生界面恢复 |
| 界面重载 | ⌘R 后自动载入与挂载 |
| 冷启动 | 用户完整重启后服务端启动图包含插件，无新增 web-boot 崩溃；未用 CDP 复验冷启动后的渲染层 |
| 基础交互 | 测试会话的中文多行输入、发送、停止、工具展开、模型／权限与设置访问通过 |
| 响应式 | 900×700、760×640、侧栏隐藏与右栏打开时的基础几何通过 |

这些结果来自早期 Desktop 构建，不能替代最新布局的 Electron 复验。Desktop 截图与对照保留在 `docs/verification/local/desktop-*.png`、`compare-*.png` 和 `responsive/`，仅作对应构建的历史基线。

## 最近一次安装交付

2026-10-02，正式 CLI 已安装 `artifacts/install-balanced-spacing-final/dsh-ccd-style-0.1.0.tgz`。交付时包内、仓库与安装副本客户端逐字节一致，SHA-256 为 `76b86e3e5bff3ded43f7dea2f0b42d17c6c75d98daf906c104adfdefb9d752de`。用户 patch 与备份逐字节相同；备份在 `.cache/verify/desktop-before-balanced-spacing/`。这是交付时记录，本轮没有重新检查运行中渲染进程的加载字节。

当前开发构建可由 `npm run build` 重建。重装须使用新的 tarball 路径，不能覆盖 profile 或备份仍引用的安装包；升级与回退见 [安装指南](../install.md)。

## 下一次验收

本地执行 `npm run check`；界面变化按同尺寸截图核对，并针对生命周期或业务入口变化验证相应行为。Desktop 工具、隔离 Web 工具和依赖要求见 [当前实现](IMPLEMENTATION.md)。

尚未覆盖的真实运行场景集中在 [待办](TECH_DEBT.md)。参考图与本地验收资料不随包或仓库发布；README 中的两张用户展示图保留在 `assets/`。
