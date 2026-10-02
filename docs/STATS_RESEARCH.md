# 新会话页统计卡片调研

更新日期：2026-10-03。目标：在新建页复刻用户截图里的统计卡片（6 个统计格 + 贡献热力图 + 底部书比对文案），只保留卡片主体，不做 `Overview／Models` 标签页与 `All／30d／7d` 范围切换。**卡片与真实数据都已落地**：视觉实测见第十节，数据通路与实测数字见第十一节。模块状态见 [实施状态](IMPLEMENTATION.md)。

## 一、目标卡片的来源

**它不是 DSH 的组件，而是 Claude 桌面端「Code」页的官方统计卡（上游闭源）。**

- 对 DSH `0.2.0-rc.2` 的 `app.asar`（12,973 个文件）做全量字符串检索：`Peak hour`、`Favorite model`、`Active days`、`What's up next`、`more tokens than` **0 命中**；57 个 `@deepseek-ai/dsh-client-*` 官方包同样没有这些文案。
- 命中在 `/Applications/Claude.app`：组件 `Contents/Resources/ion-dist/assets/v1/cf6ae6197-NvQqGhz6.js`（根节点 `data-testid="epitaxy-stats-card"`），聚合在主进程 worker `heavyWorkWorker.js` 的任务 `codeStats`，文案在 `ion-dist/i18n/en-US.json`（`CxxK0C0XoL` = `You've used ~{times}× more tokens than {book}.`）。
- 截图里的 `deepseek/deepseek-v…` 只是该侧配置的模型 id，底部 `Sonnet 5.5／High`、`Local／resume／main／worktree`、`+ Accept edits` 也都是 Claude 桌面端的界面元素。

因此**不存在可直接复制的原版实现**，像素级一致性只能按下面的规格重建；数据必须换成 DSH 自己的真实会话数据。

## 二、视觉规格

以下数值来自 Claude.app 的组件源码（Tailwind 类名）与截图实测（2188×1630 的 @2x 截图，除以 2 得 CSS px）。两套来源在每一处都吻合。

| 项 | 值 | 实测校验 |
| --- | --- | --- |
| 卡片 | `max-w-480px`，内边距 12px（顶部 8px），圆角 8px，外描边 `0 0 0 1px hsl(from #0b0b0b h s l / 10%)`，底色 5% 黑（`alpha-1`） | 卡片 480×305.5，内边距 12 ✓ |
| 统计格容器 | `grid-cols-3`、`gap-1`（4px） | 列宽 ≈148.5，gap 4 ✓ |
| 单个统计格 | `p-xs`（4px）、行间 2px、圆角 5px、底色 10% 黑（`alpha-2`，叠在卡片上） | 148.5×44，实测色 #DADADA = 5% 黑底上再叠 10% 黑，逐位吻合 ✓ |
| 标签 | `text-footnote` 12/15px，`#898781`，单行省略 | 标签高 17px@2x ✓ |
| 数值 | `tabular-nums text-body-semibold` 13/19px，字重 580，`#0b0b0b`；`Favorite model` 一格用 `text-footnote` | 数值高 19px@2x ✓ |
| 热力图 | `flex gap-[3px] w-full`，**26 列 × 7 行 = 182 天**；列 `flex flex-col gap-[3px] flex-1`；格子 `aspect-square`、圆角 2px | 周期 17.5px = 格子 14.65 + gap 3，26 列正好铺满 456 ✓ |
| 格子着色 | 空/零：`alpha-2`；非零：`hsl(217 70% L%)`，`L = 80 - ceil(ratio*4)*8` → 恰好 72／64／56／48 四档（`ratio = 当天 messages / 窗口内最大值`）；未来日期透明 | 浅蓝实测 (136,171,232) = L 72%，深蓝 (38,101,207) = L 48%，吻合 ✓ |
| 底部文案 | `text-caption` 11/17px、`#898781`、上间距 4px | 文案高 16px@2x ✓ |

数字格式：token 用 `M／k／B` 一位小数并去掉尾随 `.0`（`493.1M`）；计数用 `Intl.NumberFormat`（`1,556`）；峰值小时用 `Intl` 的 `{hour:"numeric"}`（`11 AM`，无数据 `—`）；`Favorite model` 直接显示模型 id，不做美化，无数据 `—`。

书比对文案：`times = floor(总 token / 书的 token 数)`，`times < 2` 时改用 `about as many tokens as {book}`；书单 10 本（小王子 22k → 战争与和平 730k，含 Hobbit 123k），在"token 数不超过当前总量"的书里随机挑一本。

**范围固定**：截图里的 26 列就是全部（`All`），卡片不做范围切换，因此不需要时间窗折叠逻辑。

## 三、可复用的开源实现

三层候选，按"离可用有多近"排序。

### A. DSH 生态内（已解决"数据从哪来"）

| 仓库 | 许可证 | 形态 | 可复用点 |
| --- | --- | --- | --- |
| [solstice621/dsh-token-usage-dashboard](https://github.com/solstice621/dsh-token-usage-dashboard) | MIT | DSH 插件（host + client 两半，bundle 与动态插件两种形态） | 完整的数据管线：`sessionQuery` + `sessionPersistence` 折叠 `assistant/message` 的 usage、`lastSeq` 增量水位、`~/.dsh/storages/token-stats/snapshot.json` 快照、`webServer` 路由供数；53 列热力图网格数学；`FitValue` 单行数值自适应 |
| [2327644800/dsh-usage-analytics](https://github.com/2327644800/dsh-usage-analytics) | Apache-2.0 | DSH 插件（host + client） | **聚合产物正好覆盖卡片全部指标**：`sessions／turns／userMessages／tokens／days／hours／models／activeDays／busyHour／topModel／streaks`；per-session seq 水位 + revision diff 的增量快照；时间尺度纯函数并带单测 |
| [JingbiaoMei/Tokdash](https://github.com/JingbiaoMei/Tokdash) | MIT | Python 本地服务 + 前端 | 支持直接解析 `$DSH_HOME/sessions/*/*/session.jsonl.zstd`（多帧 zstd），2D/3D 贡献热力图与报表；重量级参考，不适合直接移植 |
| [Han-1413141/dsh-cost-meter](https://github.com/Han-1413141/dsh-cost-meter) | 待核 | DSH 插件 | 会话与模型成本、预算、额度，同一数据源的另一种口径 |

### B. Claude 仿（内容最接近）

| 仓库 | 许可证 | 可复用点 |
| --- | --- | --- |
| [Clovis500c/claude-stats](https://github.com/Clovis500c/claude-stats) | MIT | **唯一实现书比对规则的开源项目**：`src/books.js` 的 `BOOKS` 数组（含 Hobbit 95,356 words）、`TOKENS_PER_WORD = 1.3`、`pickBook()`；`src/collect.js` 从 JSONL 折叠出 6 个指标的算法 |
| [chiphuyen/sniffly](https://github.com/chiphuyen/sniffly) | MIT | 会话／消息／token 聚合与 `hourly_pattern`（峰值小时），无热力图 |
| [hoangsonww/Claude-Code-Agent-Monitor](https://github.com/hoangsonww/Claude-Code-Agent-Monitor) | MIT | `client/src/components/StatCard.tsx` 的统计格排版 |

### C. Codex 仿与热力图组件

| 仓库 | 许可证 | 可复用点 |
| --- | --- | --- |
| [bircni/aitrack](https://github.com/bircni/aitrack) | MIT | TS 的 `intensity.ts`（百分位分档）、`viewModel.ts`（`StatCell {label,value,sub}` 抽象）、`readers/codex.ts` |
| [grubersjoe/react-activity-calendar](https://github.com/grubersjoe/react-activity-calendar) | MIT | 现成 React 周×7 SVG 热力图，`blockSize／blockMargin／blockRadius` 与 light/dark 主题可调 |
| [sculptdotfun/viberank](https://github.com/sculptdotfun/viberank) | MIT | 零依赖 CSS Grid 热力图（`src/components/ActivityHeatmap.tsx`），适合作为自绘蓝本 |
| [@pearpages/heatmap](https://github.com/pearpages/heatmap) | MIT | 零运行时依赖、3.3 kB，React 19 + ESM |

**许可风险（只可看，不可抄）**：[charmbracelet/crush](https://github.com/charmbracelet/crush) 的 `crush stats` 是 FSL-1.1-MIT；[winfunc/opcode](https://github.com/winfunc/opcode) 与 [siteboon/claudecodeui](https://github.com/siteboon/claudecodeui) 是 AGPL-3.0；`stefan5441/react-activity-heatmap` 没有 LICENSE 文件。

## 四、两个 DSH 插件的源码剖析

两者都装了"host 半折叠会话日志 → 自己的通道供数 → client 半渲染"，这也正是本项目 `statistics` 需要的形状。

### 数据入口

| | dsh-token-usage-dashboard | dsh-usage-analytics |
| --- | --- | --- |
| inject | `['webServer']` | `['webServer', 'sessionPersistence', 'timer']` |
| 读取 | `ctx.get('sessionQuery')` 的 `listSessions()／readSession(id)`，`ctx.get('sessionPersistence')` 的 `list()／readFrom(id, fromSeq)` | `ctx.sessionPersistence` 的 `listSnapshots()／readFrom(id, fromSeq)` |
| 事件 | `session/event`（记 `liveFloor`）、`session/created` | `session/event`、`session/flush`（只标脏，不折叠） |
| 增量 | `lastSeq` 水位 + `liveFloor` 强制重折"直播起点之前的头部" | per-session `{rev, seq}` 水位，`revision` 未变直接跳过 |
| 快照 | `~/.dsh/storages/token-stats/snapshot.json`，10s 定时 flush | 数据目录 `agg.json`，原子写（临时文件 + rename），`CACHE_VERSION` 不匹配即重建 |
| 并发 | 回补时对全部会话 `Promise.all`（**无并发上限**） | `mapLimit(work, 4, …)` |

两边都盯上了同一个坑：**"直播事件"和"从日志回放"如果共用一个游标，会漏折或重复折**。tokstats 的解法是 `liveFloor` + 强制折叠头部（不这么做时实测从 1.4 亿掉到 73 万 token）；usage-analytics 的解法更干脆——**只从持久化读窗口折叠**，直播事件仅用于"该刷新了"，并在注释里写明上一版因为共用游标少算了 30–50%。

### 聚合产物（usage-analytics 的 `lib/aggregate.js`）

`days[YYYY-MM-DD] = {tokens, tokensRaw, output, turns, steps, toolCalls, userMessages, sessions}`、`hours[0-23]`、`models[provider/model]`、`weeks[ISO 周]`、`tokens{input,output,cacheRead,cacheWrite,reasoning,total}`，再由 `computeInsights()` 产出 `activeDays`、`busyHour`（峰值小时）、`topModel`（最爱模型）、`currentStreakDays／longestStreakDays`、`peakDay`、`avgTokensPerSession`。**卡片需要的 6 个指标全部现成。**

token 口径有两条，需要选一条：
- `total = input + output + cacheWrite`（"新 token"，不含缓存命中）；
- `tokensRaw = total + cacheRead`（供应商控制台式总量，含缓存命中）。

`reasoningTokens` 是 `outputTokens` 的子集，**不能重复相加**。另有"幽灵分叉会话"（fork 复制来但从未运行，`lastUsageAt <= createdAt`）必须排除，否则父会话 token 被重复计。

### 供数通道与客户端

- 两者都用 `ctx.webServer.register({kind:'exact', path:'/api/…', handler})` 暴露 JSON；usage-analytics 额外做 loopback 校验（`remoteAddress` + `Host` + `Sec-Fetch-Site`）并返回 `cache-control: no-store`。
- 客户端都是 `window.__ModuleLoader__.load({id, factory(require)})`，只从共享模块表 `require('react')`，CSS 以字符串常量插入 `<style>` 并在释放时移除。
- 注册座位不同：tokstats 挂 `settings.section`，usage-analytics 挂 `sidebar.footer.action` 与 `shell.overlay`。**两者都不是新建页的卡片座位**，注册代码不可复用，只有聚合与渲染数学可移植。
- 两者都在组件里 `fetch` + 定时轮询，并用模块级桥（`intervalRef`、`activeLang`）绕开"组件拿不到 ctx"的限制；这与本项目的约束冲突（详见下节）。

### 移植时必须避开的坑

1. **webServer 时序**：不声明硬依赖时，`apply` 可能先于 `dsh-host-webserver` 执行，`ctx.get('webServer')` 为 `undefined`，路由被静默跳过。host 半必须把服务写进 `inject`。
2. **水位与直播竞争**：见上；只从持久化读窗口推进水位，或保留 `liveFloor` 强制回头折。
3. **回补期间显示半截数字**：客户端要等 `ready` 再显示数值，扫描中轮询 2s、就绪后 30s。
4. **重扫接口的双计**：tokstats 的 `POST /rescan` 直接对已有聚合再折一遍（`backfill()` 不重置），只能在全新进程或删掉快照后重建；移植时 `force` 必须伴随重置。
5. **分档算法**：tokstats 记录过纯对数分档会把所有活跃日压成一档、纯线性又会把小日子压到最低档；Claude 原版用的是"相对窗口内最大值"的四档线性，直接照原版即可。
6. **会话日志格式**：`~/.dsh/sessions/<cwd 编码>/<sessionId>/session.jsonl.zstd` 是**多帧 zstd 拼接**，不能整块解压；不要自己解析，走 `sessionQuery／sessionPersistence`。
7. **组件内直接 fetch/轮询、模块级可变状态**（`styleEl`、`intervalRef`、`activeLang`）在两个插件里都存在，对 HMR 与多次挂载都不友好，本项目不允许照搬。

## 五、为什么现成插件不能直接用：位置不对

用户核对后的反馈是"都是那种侧边栏的"。原因是座位选择，不是实现质量：

| 插件 | 注册的座位 | 形态 |
| --- | --- | --- |
| dsh-token-usage-dashboard | `settings.section`（id `token-stats`，order 20） | 设置页里的一块面板 |
| dsh-usage-analytics | `sidebar.footer.action` + `shell.overlay` | 侧栏入口 + 整屏浮层 |
| Tokdash | 独立的 Python 服务与网页 | 另一个浏览器页面 |

而新建页 hero 区在 DSH 里只有三个座位：`conversation.hero.brand.mark`、`conversation.hero.workspace`、`conversation.hero.agent`——都是问候块内部的小格子，**没有承载整块卡片的插槽**。所以"新会话页正文里的卡片"这件事，现成插件一个都没做，它们只解决了"数据从哪来"。

hero 区的真实结构（据 `src/client/features/new-session/new-session.css` 与 `src/client/compat/host-dom.ts` 的固定锚点）：

```
[data-phase="hero"] .ST7X_W_root
└─ .ST7X_W_scrollBody
   ├─ .bocITq_root            ← 问候块（本项目把它绝对定位到页面中央）
   │  ├─ .bocITq_headline／.bocITq_titleGroup／.bocITq_fish
   │  └─ conversation.hero.brand.mark／workspace／agent 三个座位
   └─ .ST7X_W_composerSeat     ← 工作区行 + Composer（本项目推到底部）
```

## 六、挂载位置的可选方案

1. **自管容器（推荐，已实测可行）**：把 `data-ccd-stats-card` 容器插进 `.ST7X_W_composerStack.ST7X_W_composerHero`（问候块所在的容器）末尾，再用绝对定位放到标题下方。实测（隔离实例 `.cache/verify/home-web`，1382×875，插件启用）确认：插入的 480×305 容器在编辑器输入、React 状态更新之后**仍然存活**，不会被常规重渲染清掉。两点必须注意：容器所在位置在底部（`y=760`），流式子节点会排进 Composer 区，问候块之所以在中间是因为它被绝对定位，所以卡片也必须绝对定位、与问候块共用坐标系；hero 阶段一旦卸载（切到聊天页）容器随之消失，需要 MutationObserver 在回到 hero 时重建、离开时移除，释放时连同监听一起拆掉。渲染方式还没定：宿主模块表里存在 `react-dom/client`（asar 中的官方客户端 bundle 已在 `require` 它），但本项目的 `BASELINE_MODULES` 未列入，要么先验证再入基线，要么纯 DOM 构建（卡片内容是静态的，零依赖更可控）。

   实测几何（同一实例）：

   ```
   [data-phase="hero"] .ST7X_W_root                     280,0    1102×875
   └─ .ST7X_W_body                                      280,40   1102×835
      └─ .ST7X_W_scrollBody                             280,40   1100×?
         ├─ div（空占位）                                 0,0      0×0
         └─ .ST7X_W_composerSeat                        280,760  1095×115
            └─ div[display:contents] ×2
               └─ .ST7X_W_composerStack.ST7X_W_composerHero  427,760  802×115
                  ├─ .bocITq_root（问候块，被插件绝对定位）      414,436  834×44
                  └─ Composer 的其余三块
   ```

   问候块高 44px、水平居中、垂直中心在 50%，所以卡片位置可以直接写成 `top: calc(50% + 22px + 间距)`、`left: 50%`、`translate: -50% 0`、宽 480px；也可以用 `compat/` 读一次问候块 `getBoundingClientRect()` 再写 CSS 变量，与项目里 `stats-values`、`view-switch` 的做法一致。
2. **占用 hero 座位**：注册到 `conversation.hero.agent` 之类的座位再用 CSS 挪位。节点由 React 渲染、不会被清理，但三个座位都在问候块内部、语义不符，且可能与官方 agent 展示冲突，需要先探测座位的实际占位情况。
3. **放到侧栏／设置页**：就是现成插件的形态，用户已否定。

探测一律在隔离实例（`.cache/verify/home-*` + 另一个端口）里做，不动用户正在使用的桌面实例。注意隔离 home 若没有 API Key，新会话页会弹出"添加一个 API Key 开始使用"模态并遮住输入区，后续视觉验证前要先解决凭据。

## 七、对本项目的移植建议

结论：**以 `dsh-usage-analytics` 的 `aggregate.js` + `store.js` 为蓝本重写 host 半的数据层，用 `dsh-token-usage-dashboard` 的热力图网格数学与坑记录做校验，客户端按本项目规范自绘。** 理由是前者的聚合产物已覆盖全部 6 个指标，且它已经用注释记录了"直播／回放共用水位"这类真金白银的教训。

映射到现有模块：

| 位置 | 内容 |
| --- | --- |
| `src/host/stats/`（新增） | 纯函数折叠（事件 → 会话统计 → 全局聚合）+ 快照存储；`src/host/index.ts` 侧注册服务、监听与清理 |
| `src/client/contracts/` | 新增结构化声明的服务端口（对齐现有 `ConfigFormsPort` 的做法：只声明用到的成员，不复制第三方类型） |
| `src/client/features/statistics/` | `planned` → `implemented`；卡片视图与数据接线 |
| `src/client/compat/` | 挂载容器：插入点、宿主几何读取、phase 切换与可逆拆除 |
| `src/client/theme/tokens.css` | 热力图四档与空格、卡片／统计格底色（颜色字面量只允许在这里） |
| `src/client/apply.ts` | 需要新的组合时才在此接线 |

## 八、许可证与归属

- `dsh-usage-analytics` 为 **Apache-2.0**：移植需保留版权与许可声明，并注明改动。
- `dsh-token-usage-dashboard` 为 **MIT**：移植需在 `LICENSE` 的第三方归属里加版权与许可声明（与现有 DSH 图标／文案、`zanwei/claude-model-selector` 同一处）。
- 其余候选仅作参考，不引入代码；`crush`（FSL-1.1-MIT）、`opencode`（AGPL-3.0）、`claudecodeui`（AGPL-3.0）明确不引入。
- 本插件不新增运行时依赖：热力图用 CSS Grid 自绘，不引入 npm 组件。

## 九、未决问题（已全部定案，2026-10-03）

1. **挂载位置**：自管容器（第六节实测）。渲染方式为纯 DOM 构建，不扩 `BASELINE_MODULES`。
2. **token 口径**：`Total tokens` 用**含缓存命中**的供应商总量——`totalTokens` 优先，缺失时 `inputTokens + outputTokens + cacheReadTokens + cacheWriteTokens`（`reasoningTokens` 是 `outputTokens` 的子集，不重复加）。这与宿主自己 `dsh-client-ui-chat` 的 `normalizeUsage` 一致（它把 `inputTokens` 命名为 `uncachedInputTokens`）。
3. **文案语言**：保持参考的英文原句（含弯引号 `’` 与乘号 `×`）。
4. **首次扫描体验**：不画骨架、不闪 0——快照尚未可用（`pending > 0` 且还没有任何产出）时不渲染卡片，等下一次轮询（0.6s）出数再出现。

## 十、静态卡片已落地（2026-10-03）

实现位置：`src/client/features/statistics/card.ts`（纯 DOM 渲染与分档函数）、`mount.ts`（容器挂载与 phase 跟随）、`statistics.css`（几何）、`theme/tokens.css` 的 `--ccd-stats-*`（深浅两套颜色）。零新依赖：宿主模块表虽然提供 `react-dom/client`，但本项目 `BASELINE_MODULES` 未列入，卡片又是静态结构，因此用命令式 DOM 构建。

实测（隔离 web 实例 `.cache/verify/home-web`，1382×875，插件启用，`features.statistics: true`）：

| 项 | 参考规格 | 实测 |
| --- | --- | --- |
| 卡片 | 480 宽、圆角 8、内边距 `12px pt-8`、底 `#f0f0f0` | 480×299、8px、`8px 12px 12px`、`rgb(240,240,240)` ✓ |
| header | 胶囊 24px 高、`px-8`、13px medium、底 `alpha-1`（叠在卡片上） | 72.9×24、`padding 0 8px`、13/24、`rgb(230,230,230)` ✓ |
| 统计格 | 3 列 gap 4、高 44、底色 `#dadada`、圆角 5 | 148.66px×3、gap 4、高 44、`rgb(218,218,218)`、5px ✓ |
| 标签／数值 | 12/15 `#898781`；13/19、字重 580、`#0b0b0b` | 完全一致 ✓ |
| 热力图 | 26 列 × 7 行、格距 3、格 14.65、圆角 2 | 26 列 182 格、gap 3、14.6px、2px ✓ |
| 热力四档 | `hsl(217 70% 72／64／56／48%)` | `rgb(134,172,234)`／`(99,148,227)`／`(37,102,208)` ✓ |
| 段间距 | 卡顶→统计格 ≈46、统计格→热力图 7、热力图→文案 ≈21（均按参考图实测，单位为其图内像素） | 卡顶→统计格 41、统计格→热力图 6、热力图→文案 6＋`pt-4` ✓ |
| 标题 | `--cds-font-size-title`（1.25rem ≈ 20px）、行高 25–26、字重 400 | 20px／26px／400 ✓ |

间距是按"统计格高度"归一化后比对的（两张截图缩放不同，绝对值不可直接比）：参考卡片整体换算过来约 303px 高，当前实现 299px。曾经偏大的一处是底部——参考把书比对文案放在 body 组里（`gap-6` ＋ `pt-4`），而不是沿用卡片自身那 20px 节奏，所以热力图到文案只有约 12px，之前写成 24px 就显空。卡顶到统计格这一段随后按用户要求收到 41px。

标题字号是参考自身的排版档位（`text-title` 走 `--cds-font-size-title`，1.25rem，`--cds-leading-title` 1.5625rem，字重 400）；此前插件用的是 26px，明显偏大。问候块高度随之从 44px 变成 38px，所以卡片偏移改成实测：`mount.ts` 读问候块高度写 `--ccd-stats-gap`（高度 + 20），CSS 只留 `top: calc(--ccd-hero-top + var(--ccd-stats-gap, 58px))`。

构图（用户确认后已从"问候块垂直居中"改为"问候块靠近顶部＋左对齐"，`--ccd-hero-top: 16px`）：实测问候块顶部 56px（视口 6%）、卡片 114–439px、Composer 座位 760px 起（87%），与参考截图的 6%／15–53%／87% 一致，卡片不再压到 Composer。**横向是左对齐而不是居中**：参考里标题、卡片与 Composer 输入卡共用同一条左边缘，实测标题 446、卡片 446、输入卡 443（宿主的标题栈自带 3px 偏移），`left` 取 `50% - Composer 卡宽 / 2`，宿主 headline 的 `justify-content: center` 被覆盖为 `flex-start`。验收截图在 `docs/verification/local/stats-card/`（该目录按惯例不进 Git）。

当时剩下的只有数据，`SAMPLE_STATS` 是参考截图里的数字；第十一节记录了当天接上的真实聚合与实测结果——卡片本身（几何、结构、颜色）没有改动。

## 十一、真实数据已接入（2026-10-03）

数据全部由 Host 半折叠，浏览器半只读一个 JSON；卡片组件与几何没有改动，只把 `SAMPLE_STATS` 换成快照。

### 通路

| 层 | 位置 | 职责 |
| --- | --- | --- |
| 折叠单元 | `src/host/stats/unit.ts` | `ccdUsage` 投影单元：纯函数 `apply(state, event)`。`user/message` 且 `source.kind === 'user'` 记一次真人提示（按本地日／小时分桶）；`assistant/message` 记 token 总量并按最近一次 `request/header` 的 `provider/model` 归属；`seq < inheritedEventCount` 的事件是 fork 继承前缀，整段跳过 |
| 聚合 | `src/host/stats/aggregate.ts` | 纯函数：会话数（有自己产出的才算）、提示数、token 总量、活跃天数、峰值小时（并列取最早）、最爱模型（排除 `unknown`）、按天序列（上限 366 天） |
| 服务 | `src/host/stats/service.ts` | `ctx.inject(['sessionProjections','connection'])` 后注册单元与 `/api/ccd-stats`；存活会话走 `sessionProjections.snapshot`，冷会话走 `sessionProjectionCache.cachedSnapshot`，缺失时用读句柄折一次并写回检查点（4 路并发、失败 60s 冷却、逐会话容错） |
| 契约 | `src/shared/stats.ts` | 路由常量、快照类型、浏览器侧的 `readStatsSnapshot()` 校验 |
| 取数与视图 | `src/client/features/statistics/{source,view,books}.ts` | 轮询（`pending > 0` 2s、等待首帧 0.6s、就绪 30s）、参考的窗口与格式算法、书比对句式 |

宿主 DSH 的接口细节（响应式配置 cell、投影 seam、鉴权路由、wire 视图的下发面）记在 [DSH 兼容边界](DSH_COMPATIBILITY.md#统计卡片的数据通道2026-10-03)。

### 与参考的对齐

第十节那套几何与配色不变。窗口算法按参考当前 bundle（`cc70f2bdf-oAbIMYEh.js` 的 `FO` 组件）核到逐条一致：

```text
end   = 今天 + (6 - 今天.getDay())        // 本周的周六
start = end - 181 天                      // 正好 26 列
行列   = 列内按周日→周六（列主序 column*7 + row）
档位   = ratio === 0 ? 0 : 80 - ceil(ratio*4)*8   // 4/3/2/1 档
未来   = 晚于今天的格子不着色（透明），不是空格子
```

数字格式保持参考的写法（`en-US`）：计数 `1,556`、token `493.1M`／`12k`／`1M`、小时 `11 AM`、无数据显示 `—`。书比对句与三分支照参考（`times >= 2` 用 `~{times}× more tokens than {book}`，否则 `about as many tokens as {book}`，一本书都不够时整行不渲染），随机取书一次一挂载。

### 隔离实例实测（真实语料）

隔离 home 里放的是用户真实会话库的**只读副本**（59 个会话、26 MB 压缩日志）＋已有的 `session_projcache`，走 `dsh --profile web`（与桌面同一套 bundle），Playwright Chromium 1382×875 @2x：

| 场景 | 结果 |
| --- | --- |
| 全量冷启动第一响应 | 40 ms 返回 `{sessions: 0, pending: 59}`（不阻塞请求） |
| 冷折完成 | 1 s 内 59/59 折完并写回 `ccdUsage` 检查点；卡片在 1.4 s 出现 |
| 热启动 | 首响应即有数，卡片 0.6 s 出现 |
| 稳定读数 | 会话 55、提示 136、token 1.070B、活跃 4 天、峰值 12 AM、最爱模型 `opencode-go/deepseek-v4.1-flash`；重复轮询逐项一致 |
| 独立核对 | 直接汇总 59 条 `ccdUsage` 检查点：55 个工作会话、136 提示、1,070,017,050 token，与路由输出逐项吻合 |
| 卡片几何 | 480×299、左上 (446,114)、问候块下缘 94 → 间距 20px、圆角 8、底色 `rgb(240,240,240)`、内边距 `8px 12px 12px`、182 格（四档各 1 格、其余为空） |
| 存活会话 | 侧栏打开既有会话后它成为 live（走帧内投影快照），读数与打开前逐项一致、`missed` 0；离开 hero 页卡片随阶段卸载 |
| 控制台 | 0 pageerror（含被鉴权路由拒绝等异常路径） |

暖启动没有 `pending` 时，路由 30 ms 内应答；冷启动期间浏览器按 `pending` 加快轮询，折完自然回落到 30s。

### 取舍与已知边界

- **wire 视图会被下发。** DSH 的会话列表与当前会话快照都带投影值，变更还会走 `session/controls` 变更流；`ccdUsage` 的 wire 值因此只放卡片要的稀疏数字（每会话约 100–200 B）。客户端生成的投影 schema 会丢弃未声明的键，不报错。
- **聚合随插件启用常驻**，`features.statistics` 只控制卡片显示——这样在设置页打开统计不需要重启。插件整体关闭时不注册任何东西。
- **删除的会话不再计入**：每轮刷新按当前会话列表重建，历史数字随之消失；这与"统计当前会话库"一致。
- **另一个进程正在写的会话**（例如同时在跑 CLI）读到的是它上一次检查点，可能略旧；下次刷新自愈。
- **未做**：`Overview／Models` 标签、`All／30d／7d` 范围切换、骨架屏、点击下钻。
