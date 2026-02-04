<div align="center">

![new-api](/web/public/logo.png)

# New API Radical

🍥 **Next-Generation LLM Gateway & AI Asset Management System (Enhanced)**

<p align="center">
  <a href="./README.md">中文</a> | 
  <strong>English</strong>
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

## 🙏 Acknowledgments

> Standing on the shoulders of giants

| Project | Description |
|---------|-------------|
| [QuantumNous/new-api](https://github.com/QuantumNous/new-api) | **Original Author**, core developer of New API |
| [CassiopeiaCode/new-api-radical](https://github.com/CassiopeiaCode/new-api-radical) | **Secondary Development**, added many enhanced features |
| [songquanpeng/one-api](https://github.com/songquanpeng/one-api) | Original One API project |

**Thanks to all contributors!** ❤️

---

## 🆕 Enhanced Features (Radical Edition)

### 📊 User Leaderboard System

| Leaderboard | Description |
|-------------|-------------|
| 🏆 User Call Ranking | Sorted by call count, shows user activity |
| 🌐 IP Call Ranking | Stats by IP, supports multi-user association |
| 💰 Token Consumption Ranking | By token usage, includes average calculation |
| 📱 User IP Count Ranking | Tracks IP count per user, identifies anomalies |
| ⏱️ 1-Min IP Monitor | Real-time IP change monitoring for risk control |
| 🐿️ Balance Ranking | User balance leaderboard |

### 🔐 Security Enhancements

- **Admin Privacy Protection**: Leaderboards automatically exclude admin users
- **IP Masking**: Non-admin users see masked IPs
- **Channel ID Tracking**: Added channel ID column in logs
- **Blacklist System**: Banned user management

### 🎯 Model Health Monitoring

- 5-minute slice data collection
- Hourly aggregation statistics
- 24-hour success rate display
- Public access (no login required)

### 🔧 Other Enhancements

- **Model Redirect Template Management**: Batch prefix/suffix, one-click redirect, template import/export
- **Random Redemption Code Generation**: Prefix support, range amounts, batch download
- **Recent 100 Calls Cache**: Debug request/response raw data
- **Admin Rate Limit Exemption**: Flexible RPM rate limiting
- **LinuxDO OAuth Login**: Support LinuxDO community login

### 🗄️ Database Compatibility

| Database | Status |
|----------|--------|
| MySQL | ✅ Fully supported |
| PostgreSQL | ✅ Fully supported |
| SQLite | ✅ Fully supported |
| Split Deployment | ✅ LOG_DB and DB can be different databases |

---

## 🚀 Quick Start

### Docker Compose (Recommended)

```bash
# Clone the project
git clone https://github.com/jiujiu532/new-api-radical.git
cd new-api-radical

# Start services
docker-compose up -d
```

### Binary Deployment

Download from [Releases](https://github.com/jiujiu532/new-api-radical/releases):

| Platform | File |
|----------|------|
| Linux (amd64) | `new-api-linux-amd64` |
| Windows (amd64) | `new-api-windows-amd64.exe` |

```bash
# Linux
chmod +x new-api-linux-amd64
./new-api-linux-amd64

# Windows
new-api-windows-amd64.exe
```

---

## ✨ Core Features

- 🎨 Modern UI Design
- 🌍 Multi-language Support
- 💰 Online Payment (Epay, Stripe)
- 🔐 OAuth Login (GitHub, LinuxDO, Discord, Telegram, OIDC)
- 📡 Multiple API Support (OpenAI, Claude, Gemini, Azure, etc.)
- 📈 Visual Dashboard & Analytics

---

## ⚠️ Disclaimer

> [!IMPORTANT]
> - This project is for personal learning only
> - Users must comply with all applicable terms of service and laws
> - Do not use for illegal purposes

---

## 📄 License

This project is licensed under [AGPL-3.0](LICENSE).

---

<p align="center">
  <sub>Made with ❤️ by the community</sub>
</p>
