# v3 行为测试报告

## 测试范围

测试了四类研究目标，并用本地 HTTP 页面实际操作了目标输入、计划预览和 CSV 上传；另外从最终压缩包检查模型二进制和推理运行时。

## 目标到计划结果

| 目标 | ResearchIntent | 生成计划 | 结果 |
| --- | --- | --- | --- |
| 比较 APX 与 BTW 近三年盈利和现金流，判断长期竞争力 | `fundamental_compare` | `clarify → fundamentals → analytics → events → verify → report` | 通过 |
| 上传新能源行业表，找未来 12 个月现金流最稳健公司 | `fundamental_compare + universe_screen`，含 `dataset_id` | `clarify → data_quality → screen → analytics → verify → report` | 通过 |
| 某股票最近暴跌，分析原因并判断是否需要减仓 | `event_attribution + strategy_options`，动作意图为 `watchlist_draft` | `clarify → market → events → risk → verify → report → watchlist` | 通过 |
| 我有 10 万元、平衡风险、12 个月，设计组合 | `portfolio_stress` | `clarify → screen → fundamentals → analytics → risk → verify → report` | 通过 |

之前测试发现“减仓”会误触发组合压力测试，已经修正为事件归因主链路；减仓只会触发独立的观察清单确认节点。

## 实际页面行为

- 基本面目标实际生成了 6 个节点，目标 Planner 显示了 Skill、工具和每一步触发原因。
- 暴跌归因目标实际生成了事件归因计划，并生成 `watchlist` 外部动作节点。
- CSV 本地上传生成了 `dataset_id`、质量分数、字段预览和 `[D1]` 引用格式；错误的测试夹具曾造成 0 行显示，换成真实换行的 CSV 后解析逻辑通过。
- 计划执行前显示 `PLAN_PREVIEW`，需要点击“审核计划并执行”；外部写入节点进入 `WAITING_CONFIRMATION`。

## 小模型检查结论

当前压缩包**没有加入 MiniLM 模型**：

- zip 内只有 HTML、Markdown 和 JSON，没有 `.onnx`、`.gguf`、`.safetensors` 或模型 `.bin` 文件。
- 页面没有 `fetch`、tokenizer、ONNX Runtime、WebAssembly 推理入口。
- “MiniLM int8 · 检索与路由”目前是配置角色和包体预算说明，不代表模型已能实际推理。
- 当前离线版本使用关键词规则作为模型不可用时的回退；这条回退已用于本次目标 smoke test。

要让小模型真正可用，需要再加入实际量化权重、tokenizer 和运行时，并重新做离线推理测试；在 30MB 限制下建议只让它负责意图分类、Skill 检索和记忆召回，计划编译、金融计算、风险和证据验证继续由规则与确定性工具完成。

## 包体检查

- 当前 `investment-x-buddy-v3.zip`：约 30KB。
- 该体积说明当前没有模型二进制；加入模型后必须重新计算真实 zip 大小。
- `package-budget.json` 预留 MiniLM int8 约 23.6MB，总预算估算 25.4MB / 30MB，但这是预算，不是已下载模型的实测结果。
