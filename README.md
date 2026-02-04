<div align="center">

![new-api](/web/public/logo.png)

# New API Radical

🍥 **新一代大模型网关与AI资产管理系统（增强版）**

<p align="center">
  <strong>中文</strong> | 
  <a href="./README.en.md">English</a>
</p>

<p align="center">
  <a href="https://github.com/jiujiu532/new-api-radical">
    <img src="https://img.shields.io/github/stars/jiujiu532/new-api-radical?style=social" alt="stars">
  </a>
  <a href="https://github.com/jiujiu532/new-api-radical/releases/latest">
    <img src="https://img.shields.io/github/v/release/jiujiu532/new-api-radical?color=brightgreen&include_prereleases" alt="release">
  </a>
  <a href="https://raw.githubusercontent.com/jiujiu532/new-api-radical/main/LICENSE">
    <img src="https://img.shields.io/github/license/jiujiu532/new-api-radical?color=brightgreen" alt="license">
  </a>
</p>

</div>

---

## 🙏 致谢

> 本项目站在巨人的肩膀上

| 项目 | 说明 |
|------|------|
| [QuantumNous/new-api](https://github.com/QuantumNous/new-api) | **原作者**，New API 项目的核心开发者 |
| [CassiopeiaCode/new-api-radical](https://github.com/CassiopeiaCode/new-api-radical) | **二次开发版本**，添加了众多增强功能 |
| [songquanpeng/one-api](https://github.com/songquanpeng/one-api) | One API 原创项目 |

**感谢所有贡献者的辛勤付出！** ❤️

---

## 🆕 增强功能 (Radical 版本特色)

### 📊 用户排行榜系统

| 排行榜 | 说明 |
|--------|------|
| 🏆 用户调用排行 | 按调用次数排序，显示用户活跃度 |
| 🌐 IP调用排行 | 按IP统计调用，支持多用户关联显示 |
| 💰 Token消耗排行 | 按Token消耗量统计，包含平均消耗计算 |
| 📱 用户IP数排行 | 统计用户使用的IP数量，识别异常行为 |
| ⏱️ 1分钟IP数监控 | 实时监控用户IP变化，用于风控 |
| 🐿️ 囤囤鼠排行 | 用户余额排行榜 |

### 🔐 安全功能增强

- **管理员隐私保护**：排行榜自动排除管理员用户
- **IP脱敏显示**：非管理员用户查看时IP自动脱敏
- **渠道ID追踪**：日志页面新增渠道ID列
- **小黑屋系统**：封禁用户管理与追踪

### 🎯 模型健康度监控

- 5分钟切片数据采集
- 小时级聚合统计
- 24小时成功率展示
- 公开访问（无需登录）

### 🔧 其他增强

- **模型重定向模板管理**：批量前缀/后缀、一键重定向、模板导入导出
- **随机兑换码生成**：支持前缀、区间额度、批量下载
- **最近100次调用缓存**：调试请求/响应原始数据
- **管理员限速豁免**：灵活的RPM限速控制
- **LinuxDO授权登录**：支持 LinuxDO 社区登录

### 🗄️ 数据库兼容性

| 数据库 | 状态 |
|--------|------|
| MySQL | ✅ 完全支持 |
| PostgreSQL | ✅ 完全支持 |
| SQLite | ✅ 完全支持 |
| 分库部署 | ✅ LOG_DB 和 DB 可配置为不同数据库 |

---

## 🚀 快速开始

### Docker Compose（推荐）

```bash
# 克隆项目
git clone https://github.com/jiujiu532/new-api-radical.git
cd new-api-radical

# 启动服务
docker-compose up -d
```

### 二进制部署

从 [Releases](https://github.com/jiujiu532/new-api-radical/releases) 下载对应平台的二进制文件：

| 平台 | 文件 |
|------|------|
| Linux (amd64) | `new-api-linux-amd64` |
| Windows (amd64) | `new-api-windows-amd64.exe` |

```bash
# Linux
chmod +x new-api-linux-amd64
./new-api-linux-amd64

# Windows
new-api-windows-amd64.exe
```

### 环境变量

复制 `.env.example` 为 `.env` 并根据需要修改：

```bash
cp .env.example .env
```

主要配置项：

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `SQL_DSN` | 数据库连接字符串 | SQLite |
| `REDIS_CONN_STRING` | Redis连接字符串 | 不使用 |
| `SESSION_SECRET` | Session密钥 | 随机生成 |

---

## ✨ 核心特性

### 🎨 用户界面

- 现代化 UI 设计
- 多语言支持（中文、英文）
- 可视化数据看板

### 💰 支付与计费

- 在线充值（易支付、Stripe）
- 模型按次数/Token计费
- 缓存计费支持

### 🔐 授权登录

- GitHub
- LinuxDO
- Discord
- Telegram
- OIDC

### 📡 API 支持

- OpenAI Chat Completions
- OpenAI Responses
- OpenAI Realtime API
- Claude Messages
- Google Gemini
- Azure OpenAI
- 更多...

---

## 📖 文档

详细文档请参考上游项目文档：[docs.newapi.pro](https://docs.newapi.pro/zh/docs)

---

## ⚠️ 免责声明

> [!IMPORTANT]
> - 本项目仅供个人学习使用，不保证稳定性
> - 使用者必须遵循各模型提供商的使用条款及法律法规
> - 请勿用于非法用途

---

## 📄 许可证

本项目采用 [AGPL-3.0](LICENSE) 许可证开源。

---

<p align="center">
  <sub>Made with ❤️ by the community</sub>
</p>
