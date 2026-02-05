# 🎉 v1.2.1 - 代码质量优化与性能提升

## ✨ 新增功能

### 🔐 OAuth 注册码支持
- **Discord OAuth 注册码**：Discord 登录现已支持注册码验证
- **OAuth 通用函数**：新增 `oauth_common.go`，统一处理 OAuth 新用户注册流程
- 减少 3 个 OAuth 文件中 ~150 行重复代码

### ⚡ 排名 API 缓存
- 为 6 个排名 API 添加内存缓存（默认 1 分钟）
- 区分管理员/普通用户缓存
- 预计性能提升 10-100 倍（高并发场景）

## 🔧 代码优化

### 📊 数据库查询优化
- **注册码统计**：4 次查询合并为 1 次（GROUP BY + SUM）
- **排名查询**：批量查询替代循环内逐条查询

### 🏠 小黑屋代码重构
- 新增 `findBannedUser()` 和 `findBannedUserByEmail()` 公共函数
- 消除 8 处重复的用户查找和状态检查代码
- 文件总行数减少 ~40 行

### 📋 响应格式统一
- 注册码管理 API：全部统一为 HTTP 200 响应
- 小黑屋 API：全部统一为 HTTP 200 响应
- 便于前端统一处理

### ⏳ 异步处理
- 渠道余额更新改为异步执行
- 避免主线程阻塞

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
| Linux (arm64) | `new-api-linux-arm64` |
| Windows (amd64) | `new-api-windows-amd64.exe` |

## 🔄 升级说明

直接替换二进制文件或更新 Docker 镜像即可，无需数据库迁移。

---

**Full Changelog**: https://github.com/jiujiu532/new-api-radical/compare/v1.2.0...v1.2.1
