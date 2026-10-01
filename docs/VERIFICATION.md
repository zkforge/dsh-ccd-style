# 验证记录

更新日期：2026-10-01。只记录实际运行结果，不能把 planned 改成“已完成 UI”。

| 层次 | 验证方式 | 当前状态 |
| --- | --- | --- |
| SDK 和加载协议 | 本机应用资源、固定版本公开类型 | 已核实源码／格式 |
| TypeScript | npm run typecheck | 通过 |
| 模块边界与本地链接 | npm run check:architecture | 通过 |
| 失败回滚与资源所有权 | npm test | 5 项通过 |
| JS／声明构建 | npm run build | 通过 |
| loader factory 与安装包内容 | npm run check:package | 通过：25 个包内文件 |
| 本地安装包生成 | npm run pack:local --cache .cache/npm | 通过 |
| Desktop 实际安装与配置 | 测试项目，应用自带 CLI | 未验证 |
| 实际 Composer 与插槽替换 | 真实 DSH 中运行最小样例 | 未实现／未验证 |
| CCD 视觉与原生功能入口 | 相同窗口尺寸截图、实际操作 | 待后续模型实施 |

本轮运行环境为 Node.js 25.9.0、npm 11.12.1。完整 check 通过，随后 prepack 再次执行检查并生成 `artifacts/dsh-ccd-style-0.1.0.tgz`，约 7.6 kB。检查确认包中不包含源码、参考截图、缓存或开发工具。

VM 检查验证加载器封装、默认无副作用，以及关闭全部视觉 feature 时的启用／停用清理夹具，不模拟完整 DSH。单元测试只验证清理和模块失败隔离；不宣称覆盖浏览器输入法或桌面窗口行为。依赖库声明使用 skipLibCheck，项目代码保持 strict；新增 SDK API 必须检查实际导出，不能用 any 绕过边界。

参考图见 PLAN。新测试结果写明命令、日期与限制；实际 DSH 验证写明应用版本、插件包和启用方式。由于目录尚未初始化 Git，Markdown 空白检查由架构检查承担；有 Git 后额外运行 git diff --check。
