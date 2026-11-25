# Player Type Tool 开发约定

- 本仓库是独立的 Bun + TypeScript 工具，不得从其他工作区项目 import、软链接依赖或读取配置。
- 先检查 `git status --short --branch`，保留已有改动；不主动提交、推送或重写历史。
- `.env` 是本地敏感配置；不要回显、提交或写入文档、测试夹具。模板仅维护 `.env.example`。
- `src/client` 负责第三方调用，`runner` 负责执行，`storage` 保存快照与原始响应，`analysis` 分析，`reports` 展示。未来 CLI 和 Web 共用这些模块。
- 实验结果先落盘；报告调整优先 `bun run lookup --render-only <目录>`，不得为了改样式重复请求第三方。
- 普通测试不得调用真实第三方；HTTP 集成测试使用本机临时服务。真实请求只通过显式运行命令执行。
- 默认 100 条场景，6 人、初始 100BB、无前注、无抓注；场景修改同步文档，调用前进行合法性重放校验。
- `src/profiles/strategyProfile.catalog.ts` 是复制的上游生成数据快照，不手工修改其数据部分；风格映射维护在 `src/profiles/styles.ts`。
- 资金、EV、概率累计与比例计算使用 Decimal；时间快照使用 UTC ISO 字符串，报告以 Asia/Shanghai 展示。
- `artifacts/` 不入 Git；保留正式原始响应直到用户明确要求清理。迁移兼容 session v1 的平铺目录，不擅自改变旧缓存格式。
- 修改后运行 `bun run check:type`、`bun run lint`、`bun run test`，格式检查用 `bun run format:check`。
