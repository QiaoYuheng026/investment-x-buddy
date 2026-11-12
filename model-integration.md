# v4 本地模型集成

## 模型

- 模型：`BAAI/bge-small-zh-v1.5`
- 形式：量化 ONNX（`model_quantized.onnx` + external data）
- 语言：中文
- 许可：MIT（以基础模型仓库声明为准）
- 来源 commit：`9507db33464b5da99a532ac26b2a251767cbc62b`
- 用途：研究目标与 Skill 的中文语义匹配、长期记忆召回

模型不生成财务事实、投资结论或任务 JSON。计划仍由 Skill Registry、Typed Plan Compiler 和 Harness 校验生成；财务计算、风险和证据由确定性工具完成。

## 运行时

包内加入 `onnxruntime-web` 的浏览器运行时（放在工作台根目录）：

- `ort.min.js`
- `ort-wasm-simd-threaded.mjs`
- `ort-wasm-simd-threaded.wasm`

页面启动时检测模型和运行时；“加载本地模型”按钮可以重试。模型加载失败时会显示原因并回退到规则路由，不影响 Harness 和证据闸门。量化模型的 external data 会由页面显式 fetch 后传给 ONNX Runtime，避免浏览器对 external data 路径解析不一致。

## 体积

模型、tokenizer、运行时和工作台的未压缩文件合计约 35.1MB；实测压缩包约 18.5MB，小于 30MB。最终交付前仍需对生成的 zip 再运行一次大小检查。

## 运行边界

直接使用 `file://` 打开时，浏览器会阻止 fetch 本地模型文件；推荐双击包内 `start.cmd`（需要 Python 3）启动本地 HTTP 服务，或用 Sub Agent Studio/其他本地 HTTP 服务打开。模型不可用时，页面明确显示规则回退，不会伪造“模型已加载”。

## 实测

- 基本面比较目标匹配 `fundamental_compare`，并生成财报/分析/证据/报告链路。
- 行业筛选目标匹配 `universe_screen`，并生成筛选相关节点。
- 暴跌归因目标匹配 `event_attribution`，并生成行情/事件/风险/确认链路。
- “看看篮子里的资产会不会一起跌”没有命中原有关键词规则，模型相似度 `portfolio_stress ≈ 0.865`，成功生成组合压力测试计划。
- 上述分数是语义检索相似度，不是校准后的金融判断概率。
