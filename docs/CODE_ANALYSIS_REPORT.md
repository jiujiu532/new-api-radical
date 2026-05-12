# New API Radical 深度代码分析报告

## 一、项目概述

**New API Radical** 是一个基于 Go 语言的大模型 API 网关与 AI 资产管理系统。它统一代理 56+ 种 AI 提供商的 API，对外暴露 OpenAI 兼容接口，同时提供完整的用户管理、计费、监控等运营能力。

- **版本**: v0.1.65
- **语言**: Go 1.25 + React 18
- **框架**: Gin (后端) + Vite + Semi Design (前端)
- **数据库**: PostgreSQL / MySQL / SQLite (GORM)
- **缓存**: Redis + 内存缓存 (双层)

---

## 二、核心架构

### 2.1 请求生命周期（完整链路）

```
客户端请求
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│ Gin Router (relay-router.go)                                 │
│   /v1/chat/completions → TokenAuth → ModelRateLimit → Distribute │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│ middleware/auth.go :: TokenAuth()                             │
│   1. 解析 Authorization Bearer sk-xxx                        │
│   2. 支持 sk-{key}-{channelId} 管理员指定渠道                  │
│   3. ValidateUserToken → 检查 Token 有效性                    │
│   4. IP 白名单检查 (CIDR)                                    │
│   5. 用户状态检查 (封禁/定时封禁自动解封)                       │
│   6. 分组权限验证                                            │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│ middleware/model-rate-limit.go :: ModelRequestRateLimit()     │
│   - 管理员豁免检查                                           │
│   - 分组级别限速配置                                          │
│   - Redis 令牌桶 / 内存滑动窗口 双模式                        │
│   - 区分总请求数限制 vs 成功请求数限制                         │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│ middleware/distributor.go :: Distribute()                     │
│   1. 解析请求体获取 model 名称                                │
│   2. Token 模型白名单检查                                    │
│   3. 渠道亲和性检查 (Channel Affinity)                       │
│   4. 随机加权选择渠道 (CacheGetRandomSatisfiedChannel)        │
│   5. SetupContextForSelectedChannel (注入渠道配置到 Context)   │
│   6. 请求完成后记录亲和性绑定                                 │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│ controller/relay.go :: Relay()                                │
│   1. 解析并验证请求 (GetAndValidateRequest)                   │
│   2. 敏感词检测                                              │
│   3. Token 计数 (估算 prompt tokens)                         │
│   4. 计费定价 (ModelPriceHelper)                             │
│   5. 预扣费 (PreConsumeQuota)                                │
│   6. 重试循环 (最多 RetryTimes 次)                           │
│      ├─ getChannel() → 选择/切换渠道                         │
│      ├─ relayHandler() → 实际转发                            │
│      ├─ 成功 → return                                       │
│      └─ 失败 → processChannelError → shouldRetry?           │
│   7. 失败时返还预扣费                                        │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│ relay/compatible_handler.go :: TextHelper()                   │
│   1. 模型映射 (ModelMappedHelper)                            │
│   2. StreamOptions 处理                                      │
│   3. 获取适配器 (GetAdaptor)                                 │
│   4. 转换请求格式 (ConvertOpenAIRequest)                     │
│   5. 系统提示注入 (SystemPrompt)                             │
│   6. 参数覆盖 (ParamOverride / HeaderOverride)               │
│   7. 发送请求 (DoRequest)                                    │
│   8. 处理响应 (DoResponse)                                   │
│   9. 后扣费 (postConsumeQuota)                               │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│ relay/channel/openai/adaptor.go :: Adaptor                    │
│   - ConvertOpenAIRequest: 适配 o系列/gpt-5 参数              │
│   - DoRequest: HTTP/WebSocket/Form 请求                      │
│   - DoResponse: 流式SSE / 非流式JSON 响应处理                │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 渠道选择算法

渠道选择是系统最核心的逻辑，位于 `model/channel_cache.go::GetRandomSatisfiedChannel()`：

```
输入: group, model, retry
    │
    ▼
1. 从内存缓存 group2model2channels[group][model] 获取渠道ID列表
   (已按 priority 降序排列)
    │
    ▼
2. 如果找不到，尝试 FormatMatchingModelName 归一化模型名
   (支持 gpts-*, thinking-* 等通配)
    │
    ▼
3. 提取所有唯一优先级，降序排列
   retry=0 → 最高优先级
   retry=1 → 次高优先级
   retry>=len → 最低优先级
    │
    ▼
4. 在目标优先级的渠道中，按权重加权随机选择
   - 每个渠道有效权重 = channel.Weight * smoothingFactor + smoothingAdjustment
   - 当所有权重为0时，均匀分布 (每个渠道有效权重=100)
   - 当平均权重<10时，放大100倍避免精度问题
    │
    ▼
5. 返回选中的 Channel 对象
```

**渠道亲和性 (Channel Affinity)**：
- 基于规则匹配（模型正则、路径正则、UA匹配）
- 从请求中提取亲和性 Key（支持 context_int/context_string/gjson 三种来源）
- LRU 缓存绑定关系，支持 TTL 过期
- 成功响应后记录绑定，失败可选跳过重试

### 2.3 Auto Group 跨分组重试

```
用户 Token 设置 group="auto"
    │
    ▼
GetUserAutoGroup(userGroup) → 获取用户可用的自动分组列表
    │
    ▼
遍历分组列表:
  GroupA: retry=0 → priority0, retry=1 → priority1
  GroupA 用完 → GroupB: retry=0 → priority0, retry=1 → priority1
  ...
    │
    ▼
跨分组重试: 当 crossGroupRetry=true 且当前分组重试次数 >= RetryTimes
  → 切换到下一个分组，重置 retry 计数器
```

---

## 三、适配器模式 (Relay Layer)

### 3.1 接口定义

```go
type Adaptor interface {
    Init(info *RelayInfo)
    GetRequestURL(info *RelayInfo) (string, error)
    SetupRequestHeader(c *gin.Context, req *http.Header, info *RelayInfo) error
    ConvertOpenAIRequest(c *gin.Context, info *RelayInfo, request *GeneralOpenAIRequest) (any, error)
    ConvertClaudeRequest(c *gin.Context, info *RelayInfo, request *ClaudeRequest) (any, error)
    ConvertGeminiRequest(c *gin.Context, info *RelayInfo, request *GeminiChatRequest) (any, error)
    ConvertEmbeddingRequest(...)
    ConvertAudioRequest(...)
    ConvertImageRequest(...)
    ConvertOpenAIResponsesRequest(...)
    DoRequest(c *gin.Context, info *RelayInfo, requestBody io.Reader) (any, error)
    DoResponse(c *gin.Context, resp *http.Response, info *RelayInfo) (usage any, err *NewAPIError)
    GetModelList() []string
    GetChannelName() string
}
```

### 3.2 适配器工厂

`relay/relay_adaptor.go::GetAdaptor()` 根据 API 类型返回对应适配器：
- OpenAI/Azure/OpenRouter/Xinference → `openai.Adaptor{}`
- Anthropic → `claude.Adaptor{}`
- Google Gemini → `gemini.Adaptor{}`
- AWS Bedrock → `aws.Adaptor{}`
- 百度/阿里/智谱/讯飞/腾讯/火山引擎 → 各自独立适配器
- DeepSeek/Mistral/Cohere/Jina/SiliconFlow → 各自独立适配器

### 3.3 OpenAI 适配器关键逻辑

1. **o系列模型适配**: 自动将 `max_tokens` 转为 `max_completion_tokens`，移除 `temperature`
2. **gpt-5 适配**: 清零不支持的参数 (temperature, top_p, logprobs)
3. **推理力度后缀**: 支持 `model-high`/`model-low`/`model-medium` 后缀自动解析为 `reasoning_effort`
4. **developer 角色**: o系列模型自动将 system 消息转为 developer 角色
5. **OpenRouter 适配**: 自动转换 thinking/reasoning 格式
6. **Azure 适配**: 部署名称路径构建、API 版本管理、Responses API 特殊处理

### 3.4 流式响应处理

```go
OaiStreamHandler():
  1. StreamScannerHandler 逐行读取 SSE data
  2. 每个 chunk 追踪 responseText (用于 token 计数)
  3. 处理 thinking_to_content 转换 (<think> 标签包裹)
  4. 最后一个 chunk 提取 usage 信息
  5. 如果上游未返回 usage，本地估算 token 数
  6. HandleFinalResponse 发送最终格式化响应
```

---

## 四、计费系统

### 4.1 双模式计费

| 模式 | 说明 | 计算公式 |
|------|------|----------|
| 按倍率 (QuotaType=0) | 基于 token 数量 | `(promptTokens * 1 + completionTokens * completionRatio + cacheTokens * cacheRatio + imageTokens * imageRatio) * modelRatio * groupRatio` |
| 按次数 (QuotaType=1) | 固定价格 | `modelPrice * QuotaPerUnit * groupRatio` |

### 4.2 预扣费机制

```
PreConsumeQuota():
  1. 检查用户余额 > 0
  2. 估算预扣费额度 = max(promptTokens, PreConsumedQuota) * ratio
  3. 信任机制: 用户余额 > TrustQuota 且 Token 额度充足 → 跳过预扣费
  4. 实际扣减用户余额
  5. 请求完成后: 实际消耗 - 预扣费 = delta
     - delta > 0: 补扣
     - delta < 0: 返还
     - delta = 0: 无操作
```

### 4.3 特殊计费

- **缓存 Token**: `cacheRatio` (通常 < 1.0，鼓励缓存)
- **缓存创建 Token**: `cacheCreationRatio` (Claude 1h 缓存 = 5m 缓存 * 1.6)
- **图像 Token**: `imageRatio` (视觉模型图片 token 独立计费)
- **音频 Token**: `audioRatio` / `audioCompletionRatio`
- **Web Search**: 按调用次数 * 每千次价格
- **File Search**: 按调用次数 * 每千次价格
- **Image Generation Call**: 按质量和尺寸定价

---

## 五、数据模型

### 5.1 核心实体关系

```
User (用户)
  ├── Token (API 令牌, 1:N)
  ├── Log (调用日志, 1:N)
  └── Quota (配额余额)

Channel (渠道/上游提供商)
  ├── Ability (能力映射, 1:N) ← 联合主键: group + model + channel_id
  ├── ChannelInfo (多Key信息, JSON字段)
  └── Setting/ParamOverride/HeaderOverride (配置)

Ability (模型能力)
  - group: 分组名
  - model: 模型名
  - channel_id: 渠道ID
  - enabled: 是否启用
  - priority: 优先级 (越大越优先)
  - weight: 权重 (加权随机)
  - tag: 标签分组
```

### 5.2 Channel 模型关键字段

| 字段 | 类型 | 说明 |
|------|------|------|
| Type | int | 渠道类型 (56种) |
| Key | string | API Key (支持多Key换行分隔) |
| Models | string | 支持的模型列表 (逗号分隔) |
| Group | string | 所属分组 (逗号分隔) |
| Priority | int64 | 优先级 |
| Weight | uint | 权重 |
| ModelMapping | JSON | 模型名映射 |
| ParamOverride | JSON | 参数覆盖 |
| HeaderOverride | JSON | 请求头覆盖 |
| ChannelInfo | JSON | 多Key模式配置 |
| AutoBan | int | 自动禁用 |
| Tag | string | 标签 (批量管理) |

### 5.3 多 Key 模式

```go
ChannelInfo {
    IsMultiKey: true,
    MultiKeySize: 5,
    MultiKeyMode: "random" | "polling",
    MultiKeyStatusList: {0: enabled, 1: disabled, ...},
    MultiKeyPollingIndex: 2,  // 轮询当前位置
}
```

- **随机模式**: 从启用的 Key 中随机选一个
- **轮询模式**: 按顺序轮询，跳过禁用的 Key
- 单个 Key 禁用不影响整个渠道，全部禁用时渠道自动禁用

### 5.4 日志模型

```go
Log {
    UserId, Username, CreatedAt, Type,
    ModelName, TokenName, ChannelId,
    PromptTokens, CompletionTokens,
    Quota, UseTime, IsStream,
    Group, Ip, Other (JSON扩展字段)
}
```

- 支持主库/日志库分离 (`LOG_SQL_DSN`)
- 空回复 (completion_tokens=0) 自动标记为错误日志
- 异步记录模型健康事件和活跃任务槽

---

## 六、缓存架构

### 6.1 三级缓存

| 层级 | 存储 | 数据 | 刷新策略 |
|------|------|------|----------|
| L1 | Go 内存 (sync.Map) | 渠道列表、能力映射、用户信息 | 定时同步 (SYNC_FREQUENCY) |
| L2 | Redis | 限速计数、亲和性绑定、Token 验证 | TTL 过期 |
| L3 | 数据库 | 全量数据 | 实时写入 |

### 6.2 渠道缓存结构

```go
var group2model2channels map[string]map[string][]int  // group → model → channelIDs (按priority排序)
var channelsIDM map[int]*Channel                       // channelID → Channel对象
```

- 定时从数据库全量同步 (`SyncChannelCache`)
- 渠道状态变更时实时更新内存缓存 (`CacheUpdateChannelStatus`)
- 读写锁保护 (`channelSyncLock`)

### 6.3 批量更新优化

```
BATCH_UPDATE_ENABLED=true
  → 用户配额变更、渠道使用量变更 不立即写库
  → 累积到内存队列
  → 每 BATCH_UPDATE_INTERVAL 秒批量写入
  → 减少数据库写入压力
```

---

## 七、安全设计

### 7.1 认证体系

| 认证方式 | 适用场景 | 实现 |
|----------|----------|------|
| Session (Cookie) | 管理后台 Web UI | gin-contrib/sessions |
| Access Token | 管理后台 API | Header: Authorization |
| API Token (sk-xxx) | AI API 调用 | Bearer Token |
| OAuth | 第三方登录 | GitHub/Discord/LinuxDO/Telegram/OIDC |
| 2FA (TOTP) | 二次验证 | pquerna/otp |
| Passkey (WebAuthn) | 无密码登录 | go-webauthn |

### 7.2 Token 安全

- Token Key 格式: `sk-{randomKey}` (去掉 sk- 前缀后为实际 key)
- 支持 `sk-{key}-{channelId}` 管理员指定渠道
- IP 白名单 (CIDR 格式)
- 模型白名单 (Token 级别限制可用模型)
- 配额限制 (Token 级别独立配额)

### 7.3 限速机制

1. **全局 API 限速** (`GlobalAPIRateLimit`): 管理后台接口
2. **模型请求限速** (`ModelRequestRateLimit`):
   - 总请求数限制 (含失败): 令牌桶算法 (Redis) / 滑动窗口 (内存)
   - 成功请求数限制: 滑动窗口
   - 分组级别独立配置
   - 管理员豁免
3. **关键操作限速** (`CriticalRateLimit`): 登录/注册/OAuth
4. **邮件验证限速** (`EmailVerificationRateLimit`)

### 7.4 渠道自动禁用

```go
processChannelError():
  - 检查错误类型是否应该禁用渠道 (ShouldDisableChannel)
  - 多Key模式: 仅禁用出错的 Key，不影响其他 Key
  - 单Key模式: 禁用整个渠道
  - 异步执行，不阻塞请求
```

---

## 八、监控系统 (Radical 增强)

### 8.1 模型健康度

```
数据采集:
  每次请求完成 → RecordModelHealthEventAsync()
    → 写入 model_health_slice_5m 表 (5分钟切片)
    → UPSERT: total_requests++, error_requests++
    → 记录 max_response_bytes, max_completion_tokens, sum_completion_tokens

聚合查询:
  GetPublicModelsHealthHourlyLast24hAPI()
    → 按小时聚合 5分钟切片数据
    → 计算成功率 = (total - error) / total
    → 判断"有效成功" = response_bytes > 1024 || completion_tokens > 2

展示:
  /api/public/model_health/hourly_last24h (无需登录)
    → 24小时 × N个模型 的健康度矩阵
```

### 8.2 活跃任务监控

- 10分钟窗口内调用次数 >= 5 的用户标记为"高活跃"
- 定时扫描器 (10分钟间隔)
- 管理员可查看排行和历史

### 8.3 最近调用缓存

```go
RecentCallsCache():
  - 内存中保存最近 100 次调用的完整请求/响应
  - 包含: 请求体、上游响应体、流式聚合文本、错误信息
  - 用于调试和问题排查
  - 管理员通过 /api/debug/recent_calls 访问
```

---

## 九、前端架构

### 9.1 技术栈

- **框架**: React 18 + React Router 6
- **UI**: Semi Design (字节跳动) + Ant Design + Tailwind CSS
- **图表**: VChart (字节跳动)
- **国际化**: i18next (中/英)
- **构建**: Vite + Bun
- **部署**: 编译为静态文件，通过 Go embed 嵌入二进制

### 9.2 页面模块 (31个)

| 类别 | 页面 |
|------|------|
| 核心管理 | Channel, Token, User, Model, Redemption |
| 数据展示 | Dashboard, Log, Pricing, ModelHealthPublic |
| 安全监控 | Blacklist, Fingerprint, Ranking, ActiveTaskRank |
| 功能页面 | Chat, Playground, TopUp, InvitationCode |
| 运维工具 | RecentCalls, ModelDeployment, Setting |

---

## 十、部署与运维

### 10.1 Docker 多阶段构建

```dockerfile
Stage 1 (Bun): 编译前端 → web/dist/
Stage 2 (Go):  编译后端 + 嵌入前端 → new-api 二进制
Stage 3 (Debian slim): 最终运行镜像
```

### 10.2 环境变量配置

| 变量 | 说明 | 默认值 |
|------|------|--------|
| SQL_DSN | 数据库连接 | SQLite |
| LOG_SQL_DSN | 日志数据库 | 同主库 |
| REDIS_CONN_STRING | Redis | 不使用 |
| SESSION_SECRET | Session 密钥 | 随机 |
| NODE_TYPE | 节点类型 | master |
| SYNC_FREQUENCY | 缓存同步频率 | 60s |
| BATCH_UPDATE_ENABLED | 批量更新 | false |
| STREAMING_TIMEOUT | 流式超时 | 300s |
| RELAY_TIMEOUT | 请求超时 | 0(不限) |

### 10.3 主从架构

- `NODE_TYPE=master`: 处理 Midjourney/Task 任务轮询
- 从节点: 仅处理 API 代理请求
- 多节点必须设置 `SESSION_SECRET` 和 Redis

---

## 十一、代码质量评估

### 11.1 优点

1. **清晰的分层架构**: Router → Middleware → Controller → Service → Model
2. **适配器模式**: 新增 AI 提供商只需实现 Adaptor 接口
3. **完善的重试机制**: 优先级降级 + 跨分组重试
4. **精细的计费**: 支持缓存/图像/音频/工具调用独立计费
5. **多数据库兼容**: 通过 GORM 抽象，SQL 方言差异通过变量处理
6. **内存缓存优化**: 热路径全部走内存，减少数据库压力

### 11.2 潜在风险

1. **全局锁**: `channelSyncLock` 在高并发下可能成为瓶颈
2. **内存占用**: 所有渠道和能力数据常驻内存
3. **println 调试**: 生产代码中残留 `println` 语句 (channel_cache.go)
4. **错误处理**: 部分地方 error 被忽略 (如 `_ = channel.SaveChannelInfo()`)
5. **并发安全**: `ChannelInfo.MultiKeyStatusList` map 的并发读写依赖外部锁

### 11.3 代码规模

| 模块 | 文件数 | 核心复杂度 |
|------|--------|-----------|
| controller/ | 59 | 中等 (CRUD + 业务逻辑) |
| model/ | 37 | 高 (缓存 + 并发 + 多数据库) |
| relay/ | ~80+ | 高 (56种适配器 + 流式处理) |
| middleware/ | 18 | 中等 (认证 + 限速 + 分发) |
| service/ | 30+ | 高 (计费 + 重试 + 亲和性) |
| web/src/ | 31 页面 | 中等 (React SPA) |

---

## 十二、关键设计决策总结

| 决策 | 选择 | 原因 |
|------|------|------|
| 前端嵌入 | go:embed | 单二进制部署，运维简单 |
| 渠道选择 | 内存缓存 + 加权随机 | 高性能，避免每次查库 |
| 计费模式 | 预扣费 + 后结算 | 防止超额使用 |
| 多Key管理 | JSON字段存储 | 灵活，不需要额外表 |
| 日志分库 | 可选 LOG_SQL_DSN | 读写分离，减轻主库压力 |
| 限速 | Redis令牌桶 + 内存滑动窗口 | 有Redis用Redis，无Redis用内存 |
| 渠道亲和性 | LRU缓存 + 规则引擎 | 保持会话一致性，提高缓存命中率 |
