package model

import (
	"strings"
	"time"

	"github.com/QuantumNous/new-api/common"
)

// UserCallRanking 用户调用排行
type UserCallRanking struct {
	UserId    *int     `json:"user_id,omitempty"` // 使用指针，nil时不输出
	Username  string   `json:"username"`
	CallCount int64    `json:"call_count"`
	IpCount   int      `json:"ip_count"`
	IpList    []string `json:"ip_list"`
}

// IPCallRanking IP调用排行
type IPCallRanking struct {
	IP        string   `json:"ip"`
	CallCount int64    `json:"call_count"`
	UserCount int      `json:"user_count"`
	UserList  []string `json:"user_list"`
}

// TokenConsumeRanking Token消耗排行
type TokenConsumeRanking struct {
	UserId      *int    `json:"user_id,omitempty"` // 使用指针，nil时不输出
	Username    string  `json:"username"`
	TotalTokens int64   `json:"total_tokens"`
	CallCount   int64   `json:"call_count"`
	TotalQuota  int64   `json:"total_quota"`
	AvgPerCall  float64 `json:"avg_per_call"`
}

// UserIPCountRanking 用户IP数排行
type UserIPCountRanking struct {
	UserId    *int     `json:"user_id,omitempty"` // 使用指针，nil时不输出
	Username  string   `json:"username"`
	IpCount   int      `json:"ip_count"`
	IpList    []string `json:"ip_list"`
	CallCount int64    `json:"call_count"`
	Tokens    int64    `json:"tokens"`
	Quota     int64    `json:"quota"`
}

// RecentIPRanking 1分钟内IP数排行
type RecentIPRanking struct {
	UserId      *int     `json:"user_id,omitempty"` // 使用指针，nil时不输出
	Username    string   `json:"username"`
	IpCount     int      `json:"ip_count"`
	LastTime    int64    `json:"last_time"`
	LastTimeStr string   `json:"last_time_str"`
	IpList      []string `json:"ip_list"`
}

// maskIP 脱敏IP地址
// IPv4: 192.168.1.100 -> 192.***.100
// IPv6: 2001:db8::1 -> 200***::1
func maskIP(ip string) string {
	if ip == "" {
		return ""
	}

	// 处理 IPv4
	if strings.Contains(ip, ".") {
		parts := strings.Split(ip, ".")
		if len(parts) == 4 {
			// 保留第一段和最后一段，中间用 *** 替代
			return parts[0] + ".***.***." + parts[3]
		}
	}

	// 处理 IPv6
	if strings.Contains(ip, ":") {
		// 简单处理：保留前4字符和后4字符
		if len(ip) > 8 {
			return ip[:4] + "***" + ip[len(ip)-4:]
		}
	}

	// 其他情况：如果长度超过6，保留前3后3
	if len(ip) > 6 {
		return ip[:3] + "***" + ip[len(ip)-3:]
	}

	// 太短的直接返回 ***
	return "***"
}

// processIP 根据是否显示完整IP来处理IP地址
func processIP(ip string, showFullIP bool) string {
	if showFullIP {
		return ip
	}
	return maskIP(ip)
}

// processIPList 批量处理IP列表
func processIPList(ipList []string, showFullIP bool) []string {
	result := make([]string, len(ipList))
	for i, ip := range ipList {
		result[i] = processIP(ip, showFullIP)
	}
	return result
}

// intPtr 返回int的指针
func intPtr(i int) *int {
	return &i
}

// getAdminUserIDs 获取所有管理员用户的ID列表
// 这个函数先从主数据库(DB)获取管理员ID，然后返回列表
// 这样可以兼容 LOG_DB 和 DB 是不同数据库的情况（分库部署）
// 兼容 MySQL、PostgreSQL 和 SQLite
func getAdminUserIDs() []int {
	var adminIDs []int
	DB.Table("users").
		Select("id").
		Where("role >= ?", common.RoleAdminUser).
		Pluck("id", &adminIDs)
	return adminIDs
}

// GetUserCallRanking 获取用户调用排行
// showFullIP: 是否显示完整IP（管理员为true）
// showUserId: 是否显示用户ID（管理员为true）
// 注意: 排行榜中会自动排除管理员用户（role >= 10），以保护管理员隐私
func GetUserCallRanking(startTimestamp, endTimestamp int64, limit int, showFullIP bool, showUserId bool) ([]UserCallRanking, error) {
	if limit <= 0 || limit > 100 {
		limit = 50
	}

	// 先获取调用次数排行
	type CallResult struct {
		UserId    int    `gorm:"column:user_id"`
		Username  string `gorm:"column:username"`
		CallCount int64  `gorm:"column:call_count"`
	}
	var callResults []CallResult

	// 获取管理员用户ID列表，用于排除（兼容分库部署）
	adminIDs := getAdminUserIDs()

	tx := LOG_DB.Table("logs").
		Select("user_id, username, count(*) as call_count").
		Where("type = ?", LogTypeConsume)

	// 排除管理员用户
	if len(adminIDs) > 0 {
		tx = tx.Where("user_id NOT IN ?", adminIDs)
	}

	if startTimestamp > 0 {
		tx = tx.Where("created_at >= ?", startTimestamp)
	}
	if endTimestamp > 0 {
		tx = tx.Where("created_at <= ?", endTimestamp)
	}

	err := tx.Group("user_id, username").
		Order("call_count desc").
		Limit(limit).
		Find(&callResults).Error
	if err != nil {
		return nil, err
	}

	// 获取每个用户的IP列表
	results := make([]UserCallRanking, len(callResults))
	for i, cr := range callResults {
		results[i] = UserCallRanking{
			Username:  cr.Username,
			CallCount: cr.CallCount,
		}

		// 根据权限决定是否显示 user_id
		if showUserId {
			results[i].UserId = intPtr(cr.UserId)
		}

		// 获取用户的唯一IP列表
		var ipList []string
		ipTx := LOG_DB.Table("logs").
			Select("DISTINCT ip").
			Where("user_id = ? AND type = ? AND ip != ''", cr.UserId, LogTypeConsume)
		if startTimestamp > 0 {
			ipTx = ipTx.Where("created_at >= ?", startTimestamp)
		}
		if endTimestamp > 0 {
			ipTx = ipTx.Where("created_at <= ?", endTimestamp)
		}
		ipTx.Pluck("ip", &ipList)

		// 根据权限处理IP
		results[i].IpList = processIPList(ipList, showFullIP)
		results[i].IpCount = len(ipList)
	}

	return results, nil
}

// GetIPCallRanking 获取IP调用排行
// 注意: 排行榜中会自动排除管理员用户（role >= 10）的数据，以保护管理员隐私
func GetIPCallRanking(startTimestamp, endTimestamp int64, limit int, showFullIP bool) ([]IPCallRanking, error) {
	if limit <= 0 || limit > 100 {
		limit = 50
	}

	// 获取管理员用户ID列表，用于排除（兼容分库部署）
	adminIDs := getAdminUserIDs()

	// 获取IP调用次数排行
	type IPResult struct {
		IP        string `gorm:"column:ip"`
		CallCount int64  `gorm:"column:call_count"`
	}
	var ipResults []IPResult

	tx := LOG_DB.Table("logs").
		Select("ip, count(*) as call_count").
		Where("type = ? AND ip != ''", LogTypeConsume)

	// 排除管理员用户
	if len(adminIDs) > 0 {
		tx = tx.Where("user_id NOT IN ?", adminIDs)
	}

	if startTimestamp > 0 {
		tx = tx.Where("created_at >= ?", startTimestamp)
	}
	if endTimestamp > 0 {
		tx = tx.Where("created_at <= ?", endTimestamp)
	}

	err := tx.Group("ip").
		Order("call_count desc").
		Limit(limit).
		Find(&ipResults).Error
	if err != nil {
		return nil, err
	}

	// 获取每个IP的用户列表
	results := make([]IPCallRanking, len(ipResults))
	for i, ir := range ipResults {
		results[i] = IPCallRanking{
			IP:        processIP(ir.IP, showFullIP),
			CallCount: ir.CallCount,
		}

		// 获取使用该IP的用户列表（排除管理员）
		var userList []string
		userTx := LOG_DB.Table("logs").
			Select("DISTINCT username").
			Where("ip = ? AND type = ?", ir.IP, LogTypeConsume)
		if len(adminIDs) > 0 {
			userTx = userTx.Where("user_id NOT IN ?", adminIDs)
		}
		if startTimestamp > 0 {
			userTx = userTx.Where("created_at >= ?", startTimestamp)
		}
		if endTimestamp > 0 {
			userTx = userTx.Where("created_at <= ?", endTimestamp)
		}
		userTx.Pluck("username", &userList)

		results[i].UserList = userList
		results[i].UserCount = len(userList)
	}

	return results, nil
}

// GetTokenConsumeRanking 获取Token消耗排行
// 注意: 排行榜中会自动排除管理员用户（role >= 10），以保护管理员隐私
func GetTokenConsumeRanking(startTimestamp, endTimestamp int64, limit int, showUserId bool) ([]TokenConsumeRanking, error) {
	if limit <= 0 || limit > 100 {
		limit = 50
	}

	// 获取管理员用户ID列表，用于排除（兼容分库部署）
	adminIDs := getAdminUserIDs()

	type RawResult struct {
		UserId      int     `gorm:"column:user_id"`
		Username    string  `gorm:"column:username"`
		TotalTokens int64   `gorm:"column:total_tokens"`
		CallCount   int64   `gorm:"column:call_count"`
		TotalQuota  int64   `gorm:"column:total_quota"`
	}
	var rawResults []RawResult

	tx := LOG_DB.Table("logs").
		Select("user_id, username, sum(prompt_tokens + completion_tokens) as total_tokens, count(*) as call_count, sum(quota) as total_quota").
		Where("type = ?", LogTypeConsume)

	// 排除管理员用户
	if len(adminIDs) > 0 {
		tx = tx.Where("user_id NOT IN ?", adminIDs)
	}

	if startTimestamp > 0 {
		tx = tx.Where("created_at >= ?", startTimestamp)
	}
	if endTimestamp > 0 {
		tx = tx.Where("created_at <= ?", endTimestamp)
	}

	err := tx.Group("user_id, username").
		Order("total_tokens desc").
		Limit(limit).
		Find(&rawResults).Error
	if err != nil {
		return nil, err
	}

	// 转换结果，根据权限决定是否显示 user_id
	results := make([]TokenConsumeRanking, len(rawResults))
	for i, raw := range rawResults {
		results[i] = TokenConsumeRanking{
			Username:    raw.Username,
			TotalTokens: raw.TotalTokens,
			CallCount:   raw.CallCount,
			TotalQuota:  raw.TotalQuota,
		}
		if showUserId {
			results[i].UserId = intPtr(raw.UserId)
		}
		// 计算平均每次调用消耗
		if results[i].CallCount > 0 {
			results[i].AvgPerCall = float64(results[i].TotalQuota) / float64(results[i].CallCount) / 500000 // 转换为美元
		}
	}

	return results, nil
}

// GetUserIPCountRanking 获取用户IP数排行
// 注意: 排行榜中会自动排除管理员用户（role >= 10），以保护管理员隐私
func GetUserIPCountRanking(startTimestamp, endTimestamp int64, limit int, showFullIP bool, showUserId bool) ([]UserIPCountRanking, error) {
	if limit <= 0 || limit > 100 {
		limit = 50
	}

	// 获取管理员用户ID列表，用于排除（兼容分库部署）
	adminIDs := getAdminUserIDs()

	// 获取每个用户的唯一IP数量
	type IPCountResult struct {
		UserId    int    `gorm:"column:user_id"`
		Username  string `gorm:"column:username"`
		IpCount   int    `gorm:"column:ip_count"`
		CallCount int64  `gorm:"column:call_count"`
		Tokens    int64  `gorm:"column:tokens"`
		Quota     int64  `gorm:"column:quota"`
	}
	var countResults []IPCountResult

	tx := LOG_DB.Table("logs").
		Select("user_id, username, count(DISTINCT ip) as ip_count, count(*) as call_count, sum(prompt_tokens + completion_tokens) as tokens, sum(quota) as quota").
		Where("type = ? AND ip != ''", LogTypeConsume)

	// 排除管理员用户
	if len(adminIDs) > 0 {
		tx = tx.Where("user_id NOT IN ?", adminIDs)
	}

	if startTimestamp > 0 {
		tx = tx.Where("created_at >= ?", startTimestamp)
	}
	if endTimestamp > 0 {
		tx = tx.Where("created_at <= ?", endTimestamp)
	}

	err := tx.Group("user_id, username").
		Order("ip_count desc").
		Limit(limit).
		Find(&countResults).Error
	if err != nil {
		return nil, err
	}

	// 获取每个用户的IP列表
	results := make([]UserIPCountRanking, len(countResults))
	for i, cr := range countResults {
		results[i] = UserIPCountRanking{
			Username:  cr.Username,
			IpCount:   cr.IpCount,
			CallCount: cr.CallCount,
			Tokens:    cr.Tokens,
			Quota:     cr.Quota,
		}
		if showUserId {
			results[i].UserId = intPtr(cr.UserId)
		}

		// 获取用户的IP列表（最多显示10个）
		var ipList []string
		ipTx := LOG_DB.Table("logs").
			Select("DISTINCT ip").
			Where("user_id = ? AND type = ? AND ip != ''", cr.UserId, LogTypeConsume)
		if startTimestamp > 0 {
			ipTx = ipTx.Where("created_at >= ?", startTimestamp)
		}
		if endTimestamp > 0 {
			ipTx = ipTx.Where("created_at <= ?", endTimestamp)
		}
		ipTx.Limit(10).Pluck("ip", &ipList)

		// 根据权限处理IP
		results[i].IpList = processIPList(ipList, showFullIP)
	}

	return results, nil
}

// GetRecentIPRanking 获取1分钟内IP数排行 (实时监控)
// 注意: 排行榜中会自动排除管理员用户（role >= 10），以保护管理员隐私
func GetRecentIPRanking(limit int, showFullIP bool, showUserId bool) ([]RecentIPRanking, error) {
	if limit <= 0 || limit > 100 {
		limit = 50
	}

	// 获取管理员用户ID列表，用于排除（兼容分库部署）
	adminIDs := getAdminUserIDs()

	// 获取最近1分钟的数据
	oneMinuteAgo := time.Now().Add(-1 * time.Minute).Unix()

	// 获取每个用户在最近1分钟内使用的唯一IP数
	type RecentResult struct {
		UserId   int    `gorm:"column:user_id"`
		Username string `gorm:"column:username"`
		IpCount  int    `gorm:"column:ip_count"`
		LastTime int64  `gorm:"column:last_time"`
	}
	var recentResults []RecentResult

	tx := LOG_DB.Table("logs").
		Select("user_id, username, count(DISTINCT ip) as ip_count, max(created_at) as last_time").
		Where("type = ? AND ip != '' AND created_at >= ?", LogTypeConsume, oneMinuteAgo)

	// 排除管理员用户
	if len(adminIDs) > 0 {
		tx = tx.Where("user_id NOT IN ?", adminIDs)
	}

	err := tx.Group("user_id, username").
		Having("ip_count >= 1"). // 至少有1个IP
		Order("ip_count desc").
		Limit(limit).
		Find(&recentResults).Error
	if err != nil {
		return nil, err
	}

	// 获取每个用户的IP列表
	results := make([]RecentIPRanking, len(recentResults))
	for i, rr := range recentResults {
		results[i] = RecentIPRanking{
			Username:    rr.Username,
			IpCount:     rr.IpCount,
			LastTime:    rr.LastTime,
			LastTimeStr: time.Unix(rr.LastTime, 0).Format("15:04"),
		}
		if showUserId {
			results[i].UserId = intPtr(rr.UserId)
		}

		// 获取用户最近1分钟的IP列表
		var ipList []string
		LOG_DB.Table("logs").
			Select("DISTINCT ip").
			Where("user_id = ? AND type = ? AND ip != '' AND created_at >= ?", rr.UserId, LogTypeConsume, oneMinuteAgo).
			Pluck("ip", &ipList)

		// 根据权限处理IP
		results[i].IpList = processIPList(ipList, showFullIP)
	}

	return results, nil
}

// QuotaBalanceRanking 囤囤鼠排行（用户余额排行）
type QuotaBalanceRanking struct {
	UserId   *int    `json:"user_id,omitempty"` // 使用指针，nil时不输出
	Username string  `json:"username"`
	Quota    int64   `json:"quota"`      // 当前余额
	QuotaUSD float64 `json:"quota_usd"`  // 余额（美元）
}

// GetQuotaBalanceRanking 获取用户余额排行（囤囤鼠排行）
// showUserId: 是否显示用户ID（管理员为true）
// 注意: 排行榜中会自动排除管理员用户（role >= 10），以保护管理员隐私
func GetQuotaBalanceRanking(limit int, showUserId bool) ([]QuotaBalanceRanking, error) {
	if limit <= 0 || limit > 200 {
		limit = 50
	}

	type RawResult struct {
		UserId   int    `gorm:"column:id"`
		Username string `gorm:"column:username"`
		Quota    int64  `gorm:"column:quota"`
	}
	var rawResults []RawResult

	// 从 users 表查询，按余额降序排列
	// 排除管理员用户（role >= 10）
	err := DB.Table("users").
		Select("id, username, quota").
		Where("status = ? AND role < ?", 1, common.RoleAdminUser). // 只查询正常状态的非管理员用户
		Order("quota desc").
		Limit(limit).
		Find(&rawResults).Error
	if err != nil {
		return nil, err
	}

	// 转换结果，根据权限决定是否显示 user_id
	results := make([]QuotaBalanceRanking, len(rawResults))
	for i, raw := range rawResults {
		results[i] = QuotaBalanceRanking{
			Username: raw.Username,
			Quota:    raw.Quota,
			QuotaUSD: float64(raw.Quota) / 500000, // 转换为美元
		}
		if showUserId {
			results[i].UserId = intPtr(raw.UserId)
		}
	}

	return results, nil
}
