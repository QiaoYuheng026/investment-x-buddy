# Investment X Buddy v4

v4 在 v3 基础上加入真正的中文本地 embedding 模型：用于研究目标与 Skill 的语义匹配、长期记忆召回，并保留规则 Compiler 和 Harness 作为安全回退。

推荐运行方式：双击 `start.cmd`，它会启动本地 HTTP 服务并打开工作台；直接双击 `index.html` 可能导致浏览器阻止本地模型文件加载。

## 演示

1. 在“研究工作台”修改目标，例如“上传新能源行业表，找现金流最稳健公司”或“解释某股票暴跌是否需要减仓”。点击“解析目标并生成计划”。
2. 系统生成 `ResearchIntent`、召回 Skills，并生成目标专属的 Typed DAG。进入“目标 Planner”查看每一步的触发原因、工具和预期产物，点击“审核计划并执行”。
3. 在“数据上传”选择 CSV/JSON/XLSX。CSV/JSON 会在浏览器本地解析；XLSX 会被登记并明确标记为“待启用轻量 XLSX adapter”，不会伪造行数据。数据质量、字段类型和纳入方式会影响下一次规划。
4. 在“上下文状态”查看本次运行的研究协议、当前步骤、证据索引和 checkpoint；长期状态默认为空，只有用户选择允许长期引用时才保存数据集元信息。
5. 在“Harness 配置”修改参数或恢复平衡默认值；配置快照会进入运行事件。

## 关键机制

- 不同目标不会复用同一计划：基本面比较、候选池筛选、事件归因、组合压力测试和外部动作会选择不同 Skill 与工具节点。
- 上传数据默认仅服务当前任务；原始文件不进入交付压缩包，长期状态只保存带来源/时间/置信度的结构化元信息。
- `BAAI/bge-small-zh-v1.5` 量化 ONNX 权重已放在 `model/`，页面通过 ONNX Runtime Web 加载；模型只负责中文语义匹配和记忆召回。模型结果会参与 `ResearchIntent` 的 Skill 选择，再由 Typed Plan Compiler 生成计划。
- 计划由受约束 Compiler 生成，计算、风险和证据由确定性工具处理；模型不可用时回退到关键词规则，不改变 Plan Compiler、验证器和 Harness 闸门。
- 计划审核、陈旧数据确认、外部写入确认和拒绝安全结束仍由 Harness 控制。

## 验证

已通过：

- 内嵌 JavaScript `node --check`。
- script 标签闭合检查。
- 页面包含 7 个工作区、17 个按钮和 22 个输入控件（包括研究参数、上传、配置和工具开关）。
- v2 文件保持不变。

最终压缩包已包含模型、tokenizer 和 ONNX Runtime Web；实测约 18.5MB，小于 30MB。模型实测通过基本面、行业筛选、暴跌归因和组合压力测试目标；无模型时会显示规则回退。

模型详情见 [`model-integration.md`](model-integration.md)。
