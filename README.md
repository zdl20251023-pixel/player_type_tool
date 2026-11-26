# player_type_tool

独立的 Bun + TypeScript 德州扑克玩家风格实验工具。将同一行动线分别交给松弱、紧凶、GTO 三种档位，比较动作、概率、EV 和推荐，保存完整响应并离线生成 HTML 报告。

提供本机 Web 工作台和 CLI，共用执行、存储、分析与报告模块；不依赖其他项目、数据库、Redis、后端配置表或运行中的后端服务。

## Web 工作台

```powershell
bun install --frozen-lockfile
bun run web
```

打开命令输出的本机地址，默认 [http://127.0.0.1:3210](http://127.0.0.1:3210)。端口可通过本项目 `.env` 的 `WEB_PORT` 修改。服务只绑定本机，启动和预览不会自动发送第三方请求。

1. **模型与提示词**：选择 DeepSeek 或 Gemini，从模型列表选择 Flash、Pro 或视觉模型，也可刷新服务端模型列表或手动填写 ID。填写根地址和密钥后可直接快速测试，显示回复、耗时、token 用量；测试可附图，无需先保存配置。也可使用本项目 `.env` 中的 `DEEPSEEK_API_KEY` / `GEMINI_API_KEY`。三个步骤的提示词独立编辑、预览、版本保存与恢复。
2. **玩家配置库**：描述玩家让模型推荐已有档位，或手动组合翻前与翻后 `profileName`。推荐需要点击保存才进入配置库。
3. **策略档位浏览**：搜索全部 catalog 选项、实测指标与适用桌型。首版执行固定为 6 人、100BB、无前注无抓注，只允许 `2-0 / 4-6p` 的对应街道档位。
4. **实验工作台**：选择玩家、数量和场景要求；使用现有场景或让模型生成。玩家推荐和场景生成可附参考截图，由视觉模型理解。模型任务在后台执行，显示等待与流式接收进度，刷新只恢复查询，不重复请求；生成超时默认 600 秒，可按秒调整。支持逐条编辑、单条重新生成、移除和批量 JSON 导入。先合法性校验，再保存不可变请求计划。
5. **结果与分析**：显式启动 solver，查看进度、失败原因和横向结果；成功缓存始终复用。结论分析和报告重建独立执行，不重复求解；可打开 HTML 后另存为文件或打印。
6. **牌桌体验**：六个座位分别选择玩家类型，观看 AI 相互对战；支持行动延迟、动画、自动下一手、暂停与单步。快速模式共用牌局核心，跳过展示等待，按位置/座位/玩家类型累计 VPIP、PFR、AF、WTSD 和净赢，支持 CSV、检查点恢复和原始日志查看。详见 [牌桌体验与快速模拟](docs/牌桌体验与快速模拟.md)。

Web 设置、提示词版本、模型调用记录和实验保存在 Git 忽略的 `artifacts/workbench/`。Web 设置中的密钥保存在本机 `secrets.json`，不返回浏览器，不写入请求快照。请将整个目录视作本机私有数据，备份或分享报告时不要附带密钥文件。

首次交付的模型默认名称是可编辑的配置示例；请按账号实际可用模型填写。没有密钥时仍可浏览 catalog、编辑玩家、使用已有场景和创建实验计划。

详见 [Web 工具使用与实现说明](docs/Web工具使用与实现说明.md)。

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
  client/       lookup 与 DeepSeek/Gemini 客户端
  contracts/    lookup 与实验类型
  profiles/     三种风格配置和上游档位快照
  scenarios/    100 条历史、请求构造及合法性校验
  runner/       实验执行、进度和报告编排
  storage/      session v1 与原始响应读写
  analysis/     概率/EV/结构比较、风格判断
  reports/      HTML、Markdown 与模板
  web/          本机 HTTP API、浏览器界面和样式
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
