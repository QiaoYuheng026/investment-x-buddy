/* BGE-small-zh local inference. All resources are served from this package. */
(function () {
  'use strict';
  const root = new URL('./', import.meta.url);
  const status = { phase: 'not_loaded', name: 'BGE-small-zh-v1.5 int8', runs: 0, dimension: 0, lastMs: 0, error: '' };
  let session, tokenizer, loading;
  const cache = new Map();
  const examples = {
    fundamental_compare: ['比较两家公司近三年收入利润和经营现金流，分析盈利质量与长期竞争优势', '这两家企业谁的生意更扎实，财务状况更健康，赚钱能力更持久'],
    universe_screen: ['从行业数据中筛选现金流稳健、负债较低的公司并排序', '根据我提供的企业名单和条件选出最值得进一步研究的标的'],
    event_attribution: ['解释这只股票近期暴跌的原因，检索公告新闻并交叉核验事件', '这只票为什么突然跌这么多，是公司出了事还是市场一起跌'],
    valuation_scenario: ['测算合理估值区间，分析不同增长假设下的价格敏感性', '现在这个价钱贵不贵，改变增长率和折现率后合理价值会怎样'],
    portfolio_stress: ['分析我的持仓组合集中度、行业暴露和下行情景，设计风险约束配置', '看看篮子里的资产会不会一起跌，十万元应该怎样分散风险'],
    strategy_options: ['设计十二个月投资策略的可选方案、适用条件、失效条件和跟踪指标', '如何制定投资研究的行动方案和后续跟踪计划']
  };
  function announce() { window.dispatchEvent(new CustomEvent('research-model-status', { detail: { ...status } })); }
  async function bytes(path) {
    const response = await fetch(new URL(path, root));
    if (!response.ok) throw new Error(path + ': HTTP ' + response.status);
    return new Uint8Array(await response.arrayBuffer());
  }
  async function load() {
    if (session) return true;
    if (loading) return loading;
    status.phase = 'loading'; status.error = ''; announce();
    loading = (async function () {
      try {
        if (!window.ort) throw new Error('ONNX Runtime Web 未加载');
        ort.env.wasm.wasmPaths = root.href;
        ort.env.wasm.numThreads = 1;
        const [tok, cfg, weights, external, module] = await Promise.all([
          bytes('model/tokenizer.json'), bytes('model/tokenizer_config.json'),
          bytes('model/model_quantized.onnx'), bytes('model/model_quantized.onnx_data'),
          import(new URL('model/tokenizers.min.mjs', root).href)
        ]);
        const decoder = new TextDecoder();
        tokenizer = new module.Tokenizer(JSON.parse(decoder.decode(tok)), JSON.parse(decoder.decode(cfg)));
        session = await ort.InferenceSession.create(weights, {
          executionProviders: ['wasm'], graphOptimizationLevel: 'all',
          externalData: [{ path: 'model_quantized.onnx_data', data: external }]
        });
        status.phase = 'ready'; announce(); return true;
      } catch (error) {
        session = null; cache.clear(); status.phase = 'error'; status.error = error.message;
        announce(); throw error;
      } finally { loading = null; }
    })();
    return loading;
  }
  async function embed(text) {
    await load();
    const key = String(text);
    if (cache.has(key)) return cache.get(key);
    // Tokenizer respects the model's lowercase:false and WordPiece settings.
    let ids = tokenizer.encode(key).ids;
    if (ids.length > 128) ids = ids.slice(0, 127).concat(102);
    const length = ids.length;
    const all = {
      input_ids: new ort.Tensor('int64', BigInt64Array.from(ids, BigInt), [1, length]),
      attention_mask: new ort.Tensor('int64', new BigInt64Array(length).fill(1n), [1, length]),
      token_type_ids: new ort.Tensor('int64', new BigInt64Array(length), [1, length])
    };
    const feeds = Object.fromEntries(session.inputNames.map(name => [name, all[name]]));
    const before = performance.now();
    const outputs = await session.run(feeds);
    const tensor = outputs.last_hidden_state || Object.values(outputs).find(t => t.dims.length === 3);
    if (!tensor || tensor.dims.length !== 3 || tensor.dims[2] !== 512) throw new Error('模型输出形状不符合 BGE [1,sequence,512]');
    // BGE uses CLS pooling and L2 normalization.
    const vector = Array.from(tensor.data.slice(0, 512));
    const norm = Math.hypot(...vector);
    if (!norm || !Number.isFinite(norm)) throw new Error('模型输出非有限向量');
    const normalized = vector.map(value => value / norm);
    Object.values(feeds).forEach(t => t.dispose());
    Object.values(outputs).forEach(t => t.dispose());
    status.runs++; status.dimension = normalized.length; status.lastMs = Math.round(performance.now() - before);
    cache.set(key, normalized); announce(); return normalized;
  }
  function cosine(a, b) { return a.reduce((sum, value, i) => sum + value * b[i], 0); }
  async function rank(goal) {
    const query = await embed(goal);
    const scores = [];
    for (const [id, texts] of Object.entries(examples)) {
      let score = -1;
      for (const text of texts) score = Math.max(score, cosine(query, await embed(text)));
      scores.push({ id, score });
    }
    return scores.sort((a, b) => b.score - a.score);
  }
  async function recall(goal, memories) {
    const query = await embed(goal), scored = [];
    for (const memory of memories.slice(-20)) {
      if (!memory.source || !memory.fact) continue;
      const score = cosine(query, await embed(memory.fact));
      if (score >= 0.5) scored.push({ source: memory.source, fact: memory.fact, score });
    }
    return scored.sort((a, b) => b.score - a.score).slice(0, 3);
  }
  window.LocalResearchModel = { load, rank, recall, embed, status, examples };
})();
