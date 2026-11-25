# player_type_tool

独立的 Bun + TypeScript 德州扑克玩家风格实验工具。将同一行动线分别交给松弱、紧凶、GTO 三种档位，比较动作、概率、EV 和推荐，保存完整响应并离线生成 HTML 报告。

当前提供 CLI，后续 Web 平台复用同一套执行、存储、分析与报告模块；不依赖其他项目、数据库、Redis、后端配置表或运行中的后端服务。

## 安装与检查

在本项目根目录执行，需要 Bun 1.3.10 或更高版本：

```powershell
bun install --frozen-lockfile
bun run check:type
bun run lint
bun run test
bun run format:check
```

依赖版本沿用迁移时已验证的版本，由本仓库 `bun.lock` 锁定。普通测试只使用本机临时 HTTP 服务，不调用真实第三方。

## 直接查看已有正式实验

已迁入实验 `95071a04-37d2-4858-9b00-ea057adaca09` 的 600 份原始请求与响应及报告，位于 Git 忽略的本地 `artifacts/runs/`。这些缓存不会随 Git 克隆自动分发，请自行保留或传递整个实验目录。

```powershell
$resultDir = 'artifacts/runs/95071a04-37d2-4858-9b00-ea057adaca09'

# 离线重建：不需要 .env，不加载 HTTP 客户端，不发新请求
bun run lookup --render-only $resultDir

# 直接用浏览器打开生成的 HTML
Start-Process "$resultDir/report.html"

# 续跑：已有成功/失败缓存都复用，仅请求缺失的条目
bun --env-file=.env run lookup --resume $resultDir

# 明确需要重试失败结果时才加此选项；成功缓存仍不重发
bun --env-file=.env run lookup --resume $resultDir --retry-failed
```

已验证迁移后的离线重建与完整缓存续跑均为 **0 个新请求，复用 600 个结果**。报告调整始终用 `--render-only`，不必重新运行真实实验。

## 新建实验

```powershell
# 不需要配置：校验 100 条历史并保存请求计划
bun run lookup --dry-run

# 首次请求前复制模板，再自行填写服务地址和必要的代理配置
Copy-Item .env.example .env

# 100 条 × 3 风格 × 默认 2 次 = 600 次真实请求
bun --env-file=.env run lookup

# 单独调试某条历史
bun --env-file=.env run lookup --scenario P02 --repeat 1

bun run lookup --help
```

### 三条代表性补充路线

默认仍为原有 100 条。新增 S01（BTN A5s 面对 BB 3bet）、S02（BB 强组合听牌面对持续下注）、S03（河牌顶对面对超池第三枪）仅在显式选择时运行。支持逗号分隔多个场景，未知编号会在请求前拒绝。

```powershell
# 3 场景 × 3 风格 × 2 次 = 18 次正式请求，先校验、落盘，再出 HTML
bun run lookup --scenario S01,S02,S03 --dry-run
bun --env-file=.env run lookup --scenario S01,S02,S03
```

详细路线与观察口径见 [代表性补充场景](docs/代表性补充场景.md)。

`AI_SERVICE_URL` 为上游根地址，客户端固定调用 `/lookup?services=RL`。`AI_REQUEST_TIMEOUT_MS` 默认 3000ms；`AI_USE_PROXY=true` 时使用 `AI_PROXY_URL`，代理方式保留原客户端的 HTTP 路由行为。显式关闭代理时不读取系统 HTTP_PROXY 自动代理。本次没有复制任何真实 `.env` 或凭据。

`--repeat` 为 1..10，默认 2。每个结果先原子写入本地文件，再生成报告；生成 HTML 失败也不会丢掉已经保存的响应。

## 目录

```text
src/
  cli/          命令入口
  client/       lookup HTTP 客户端与独立超时配置
  contracts/    lookup 与实验类型
  profiles/     三种风格配置和上游档位快照
  scenarios/    100 条历史、请求构造及合法性校验
  runner/       实验执行、进度和报告编排
  storage/      session v1 与原始响应读写
  analysis/     概率/EV/结构比较、风格判断
  reports/      HTML、Markdown 与模板
tests/          本地单测和临时 HTTP 服务集成测试
docs/           风格、场景、方法、接口及迁移说明
artifacts/runs/ 本地实验数据，不入 Git
```

为兼容既有 session v1，首轮迁移保留实验目录内的平铺文件布局，暂不拆成 responses/reports 子目录。原始 JSON 与 HTML 保持同目录，HTML 内的原始数据链接可以继续使用。HTML 本身不依赖网络或后端服务，单独复制仍可查看全部派生内容。

## 文档

- [三种玩家风格与档位](docs/三种玩家风格与档位.md)：固定档位、实际指标及选择依据。
- [100 条行动线场景设计](docs/100条行动线场景设计.md)：翻前 50、翻后 50。
- [实验方法与判断口径](docs/实验方法与判断口径.md)：概率方向、容差、近纯弃牌边界与解读限制。
- [lookup 接口说明](docs/lookup接口说明.md)：请求与响应语义。
- [迁移来源与兼容性](docs/迁移来源与兼容性.md)：直接复制、适配范围与校验记录。
- [Web 平台演进规划](docs/Web平台演进规划.md)：下一阶段边界。

`docs/原工具运行说明.md` 和原始 API 文档保留来源信息，仅供历史参考；本仓库运行命令以本文为准。
