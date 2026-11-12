# v2 验证报告

## 需求验证

| 验证角色 | 检查内容 | 结果 |
| --- | --- | --- |
| 投研产品 | 目标定义、数据取数、分析、策略、风险、跟踪和动作预览是否成链 | 通过 |
| 金融工具 | 每个工具是否说明解决的问题、输入、输出、时效、权限和 adapter | 通过 |
| Harness | 状态、超时、重试、压缩、阻断、重规划、确认、记忆和回放是否可见 | 通过 |
| 风险体验 | 陈旧数据、高风险建议、外部写入是否在动作前确认 | 通过 |
| 模型预算 | 候选本地模型角色是否受限，估算包体是否小于 30MB | 通过，25.4MB 估算 |

## 自动检查

- 内嵌 JavaScript：`node --check` 通过。
- `<script>` 标签：1 对 1 闭合。
- 功能扫描：研究目标、工具注册表、Harness 配置、确认弹窗、策略与风险、回放和 MiniLM 预算均存在。
- 包体预算：`estimated_total_bytes=25,400,000 < limit_bytes=30,000,000`。

## 已知边界

- 当前页面使用确定性 Mock 数据，没有外部市场 API 和真实订单权限。
- GitHub API 在当前环境被网络策略阻断，模型二进制未下载；MiniLM 体积是候选量化估算，最终需用实际文件复核。
- 接入真实环境时应先实现 `market_data`、`financials`、`news_events` 和 `risk_engine` 的真实 adapter，再保持现有 schema、证据和确认闸门。

## v3 实际压缩包

- `investment-x-buddy-v3.zip`：29,684 bytes（约 0.028MB），小于 30MB。
- 当前压缩包不包含模型二进制；模型预算仍按 `package-budget.json` 预留，加入实际 MiniLM 文件后必须重新压缩并复核。

## 动态 Planner 验证

- 基本面比较会生成 `clarify → fundamentals → analytics → events → verify → report`。
- 事件归因会生成 `clarify → market → events → risk → verify → report`。
- 组合风险目标会生成 `clarify → screen → fundamentals → analytics → risk → verify → report`。
- 上传数据并要求筛选会增加 `data_quality → screen`，并把 `dataset_id` 放入 ResearchIntent 和证据引用。
- 表达“观察清单/订单/买入/卖出”会增加 `watchlist` 节点，且该节点必须经过确认。
- 上传 CSV/JSON/XLSX 后会生成 `dataset_id`、质量分数、字段预览和 `[D1]` 引用格式；默认单文件超过 20MB 会阻断。
- 工具注册表下方提供每个工具的启用开关，配置快照会记录启用工具集合。

## 自检修复

- 修复了 XLSX 上传可能造成“已读取表格”的误解：当前未打包 XLSX 解析库时，页面只登记元数据并显示“待启用轻量 XLSX adapter”，不会伪造行数据。
- 明确离线包当前用关键词规则作为小模型不可用时的回退；真实 MiniLM 只接入意图分类、Skill 检索和记忆召回，不能绕过受约束计划编译器、验证器和确认闸门。
- 修复后再次通过 `node --check`、DOM 引用检查和压缩包大小检查。

## v4 本地模型验证

- 已加入 BGE-small-zh-v1.5 量化 ONNX 权重、external data、tokenizer、tokenizers.js 和 ONNX Runtime Web。
- Chrome 本地 HTTP 实测状态为“已就绪 · BGE-small-zh-v1.5 int8 · 本地推理”。
- 基本面目标得到 `fundamental_compare`，行业筛选目标得到 `universe_screen`，暴跌目标得到 `event_attribution`，语义改写“看看篮子里的资产会不会一起跌”得到 `portfolio_stress`。
- 模型分数会进入 `ResearchIntent.model_ranked_skills`，高置信 Skill 合并到 `objective_types`，再由 `compilePlan` 生成目标专属计划。
- 模型失败时记录 `Model unavailable` 并按配置回退；模型加载期间按钮被禁用，避免并发运行互相覆盖状态。
- 最终压缩包实测约 18.5MB，包含 23.8MB 权重的压缩版本，低于 30MB。

这些计划由目标关键词、结构化槽位、上传数据和动作意图共同决定；页面不再对所有目标套用同一条任务链路。
