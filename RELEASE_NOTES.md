# 🎉 v1.2.2 - 邀请码系统优化与安全增强

## ✨ 新增功能

### 🎫 邀请码系统重构
- **双类型码支持**：注册码（Type=1）和解封码（Type=2）
- **状态优先级调整**：已用完 > 已过期，更直观的状态显示
- **动态文案显示**：根据码类型自动显示"注册码"或"解封码"
- **删除逻辑优化**：删除过期码时不会影响已用完的码

### 🛡️ 安全优化
- **速率限制默认禁用**：开发环境更友好，生产环境可通过环境变量启用
- **环境变量控制**：
  - `GLOBAL_WEB_RATE_LIMIT_ENABLE=true` 启用 Web 速率限制
  - `GLOBAL_API_RATE_LIMIT_ENABLE=true` 启用 API 速率限制
  - `CRITICAL_RATE_LIMIT_ENABLE=true` 启用敏感操作速率限制

### 🧹 代码清理
- **邀请码页面**：删除未使用的禁用功能代码
- **小黑屋页面**：删除未使用的导入（useNavigate, Empty, Spin）
- **国际化统一**：所有用户可见字符串使用 `t()` 包裹

## 🔧 Bug 修复

- 修复邀请码删除按钮 Tooltip 嵌套导致无法点击的问题
- 修复筛选"已过期"状态时错误包含"已用完"码的问题
- 修复后端删除过期码时影响已用完码的问题

## 🗄️ 数据库兼容性

| 数据库 | 状态 |
|--------|------|
| MySQL | ✅ 完全支持 |
| PostgreSQL | ✅ 完全支持 |
| SQLite | ✅ 完全支持 |

## 📥 下载

| 平台 | 文件 |
|------|------|
| Linux (amd64) | `new-api-linux-amd64` |
| Windows (amd64) | `new-api-windows-amd64.exe` |

## 🔄 升级说明

直接替换二进制文件或更新 Docker 镜像即可，无需数据库迁移。

### 生产环境启用速率限制

如需启用速率限制保护，请设置以下环境变量：

```bash
GLOBAL_WEB_RATE_LIMIT_ENABLE=true
GLOBAL_WEB_RATE_LIMIT=100
GLOBAL_WEB_RATE_LIMIT_DURATION=60

CRITICAL_RATE_LIMIT_ENABLE=true
CRITICAL_RATE_LIMIT=30
CRITICAL_RATE_LIMIT_DURATION=600
```

---

**Full Changelog**: https://github.com/jiujiu532/new-api-radical/compare/v1.2.1...v1.2.2
