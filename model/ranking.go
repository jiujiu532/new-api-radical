package model

import (
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/QuantumNous/new-api/common"
)

// 排名缓存配置
const (
	RankingCacheDuration = 1 * time.Minute // 缓存有效期 1 分钟
)

// rankingCache 排名缓存结构
type rankingCache struct {
	data      interface{}
	expiredAt time.Time
}

// rankingCacheStore 排名缓存存储
var (
	rankingCacheStore = make(map[string]*rankingCache)
	rankingCacheMutex sync.RWMutex
)

// getRankingCache 获取缓存
func getRankingCache(key string) (interface{}, bool) {
	rankingCacheMutex.RLock()
	defer rankingCacheMutex.RUnlock()

	cache, exists := rankingCacheStore[key]
	if !exists {
		return nil, false
	}
	if time.Now().After(cache.expiredAt) {
		return nil, false
	}
	return cache.data, true
}

// setRankingCache 设置缓存
func setRankingCache(key string, data interface{}) {
	rankingCacheMutex.Lock()
	defer rankingCacheMutex.Unlock()

	rankingCacheStore[key] = &rankingCache{
		data:      data,
		expiredAt: time.Now().Add(RankingCacheDuration),
	}
}

// buildRankingCacheKey 构建缓存 key
// 区分：接口类型 + 时间范围 + 是否管理员
func buildRankingCacheKey(rankingType string, startTs, endTs int64, isAdmin bool) string {
	adminFlag := "user"
	if isAdmin {
		adminFlag = "admin"
	}
	return fmt.Sprintf("ranking:%s:%d:%d:%s", rankingType, startTs, endTs, adminFlag)
}

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

	// 检查缓存
	isAdmin := showFullIP && showUserId
	cacheKey := buildRankingCacheKey("user_call", startTimestamp, endTimestamp, isAdmin)
	if cached, ok := getRankingCache(cacheKey); ok {
		return cached.([]UserCallRanking), nil
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

	if len(callResults) == 0 {
		return []UserCallRanking{}, nil
	}

	// 收集所有用户ID，用于批量查询
	userIDs := make([]int, len(callResults))
	for i, cr := range callResults {
		userIDs[i] = cr.UserId
	}

	// 批量获取所有用户的IP列表（一次查询代替 N 次查询）
	type UserIPResult struct {
		UserId int    `gorm:"column:user_id"`
		IP     string `gorm:"column:ip"`
	}
	var userIPResults []UserIPResult

	ipTx := LOG_DB.Table("logs").
		Select("DISTINCT user_id, ip").
		Where("user_id IN ? AND type = ? AND ip != ''", userIDs, LogTypeConsume)
	if startTimestamp > 0 {
		ipTx = ipTx.Where("created_at >= ?", startTimestamp)
	}
	if endTimestamp > 0 {
		ipTx = ipTx.Where("created_at <= ?", endTimestamp)
	}
	ipTx.Find(&userIPResults)

	// 在内存中按用户ID分组
	userIPMap := make(map[int][]string)
	for _, uip := range userIPResults {
		userIPMap[uip.UserId] = append(userIPMap[uip.UserId], uip.IP)
	}

	// 构建结果
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

		// 从 map 中获取 IP 列表
		ipList := userIPMap[cr.UserId]
		results[i].IpList = processIPList(ipList, showFullIP)
		results[i].IpCount = len(ipList)
	}

	// 设置缓存
	setRankingCache(cacheKey, results)

	return results, nil
}

// GetIPCallRanking 获取IP调用排行
// 注意: 排行榜中会自动排除管理员用户（role >= 10）的数据，以保护管理员隐私
func GetIPCallRanking(startTimestamp, endTimestamp int64, limit int, showFullIP bool) ([]IPCallRanking, error) {
	if limit <= 0 || limit > 100 {
		limit = 50
	}

	// 检查缓存
	cacheKey := buildRankingCacheKey("ip_call", startTimestamp, endTimestamp, showFullIP)
	if cached, ok := getRankingCache(cacheKey); ok {
		return cached.([]IPCallRanking), nil
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

	if len(ipResults) == 0 {
		return []IPCallRanking{}, nil
	}

	// 收集所有 IP，用于批量查询
	ips := make([]string, len(ipResults))
	for i, ir := range ipResults {
		ips[i] = ir.IP
	}

	// 批量获取所有 IP 的用户列表（一次查询代替 N 次查询）
	type IPUserResult struct {
		IP       string `gorm:"column:ip"`
		Username string `gorm:"column:username"`
	}
	var ipUserResults []IPUserResult

	userTx := LOG_DB.Table("logs").
		Select("DISTINCT ip, username").
		Where("ip IN ? AND type = ?", ips, LogTypeConsume)
	if len(adminIDs) > 0 {
		userTx = userTx.Where("user_id NOT IN ?", adminIDs)
	}
	if startTimestamp > 0 {
		userTx = userTx.Where("created_at >= ?", startTimestamp)
	}
	if endTimestamp > 0 {
		userTx = userTx.Where("created_at <= ?", endTimestamp)
	}
	userTx.Find(&ipUserResults)

	// 在内存中按 IP 分组
	ipUserMap := make(map[string][]string)
	for _, iur := range ipUserResults {
		ipUserMap[iur.IP] = append(ipUserMap[iur.IP], iur.Username)
	}

	// 构建结果
	results := make([]IPCallRanking, len(ipResults))
	for i, ir := range ipResults {
		results[i] = IPCallRanking{
			IP:        processIP(ir.IP, showFullIP),
			CallCount: ir.CallCount,
		}

		// 从 map 中获取用户列表
		userList := ipUserMap[ir.IP]
		results[i].UserList = userList
		results[i].UserCount = len(userList)
	}

	// 设置缓存
	setRankingCache(cacheKey, results)

	return results, nil
}

// GetTokenConsumeRanking 获取Token消耗排行
// 注意: 排行榜中会自动排除管理员用户（role >= 10），以保护管理员隐私
func GetTokenConsumeRanking(startTimestamp, endTimestamp int64, limit int, showUserId bool) ([]TokenConsumeRanking, error) {
	if limit <= 0 || limit > 100 {
		limit = 50
	}

	// 检查缓存
	cacheKey := buildRankingCacheKey("token_consume", startTimestamp, endTimestamp, showUserId)
	if cached, ok := getRankingCache(cacheKey); ok {
		return cached.([]TokenConsumeRanking), nil
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

	// 设置缓存
	setRankingCache(cacheKey, results)

	return results, nil
}

// GetUserIPCountRanking 获取用户IP数排行
// 注意: 排行榜中会自动排除管理员用户（role >= 10），以保护管理员隐私
func GetUserIPCountRanking(startTimestamp, endTimestamp int64, limit int, showFullIP bool, showUserId bool) ([]UserIPCountRanking, error) {
	if limit <= 0 || limit > 100 {
		limit = 50
	}

	// 检查缓存
	isAdmin := showFullIP && showUserId
	cacheKey := buildRankingCacheKey("user_ip_count", startTimestamp, endTimestamp, isAdmin)
	if cached, ok := getRankingCache(cacheKey); ok {
		return cached.([]UserIPCountRanking), nil
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

	if len(countResults) == 0 {
		return []UserIPCountRanking{}, nil
	}

	// 收集所有用户ID，用于批量查询
	userIDs := make([]int, len(countResults))
	for i, cr := range countResults {
		userIDs[i] = cr.UserId
	}

	// 批量获取所有用户的IP列表（一次查询代替 N 次查询）
	type UserIPResult struct {
		UserId int    `gorm:"column:user_id"`
		IP     string `gorm:"column:ip"`
	}
	var userIPResults []UserIPResult

	ipTx := LOG_DB.Table("logs").
		Select("DISTINCT user_id, ip").
		Where("user_id IN ? AND type = ? AND ip != ''", userIDs, LogTypeConsume)
	if startTimestamp > 0 {
		ipTx = ipTx.Where("created_at >= ?", startTimestamp)
	}
	if endTimestamp > 0 {
		ipTx = ipTx.Where("created_at <= ?", endTimestamp)
	}
	ipTx.Find(&userIPResults)

	// 在内存中按用户ID分组（每用户最多10个IP）
	userIPMap := make(map[int][]string)
	for _, uip := range userIPResults {
		if len(userIPMap[uip.UserId]) < 10 { // 最多10个IP
			userIPMap[uip.UserId] = append(userIPMap[uip.UserId], uip.IP)
		}
	}

	// 构建结果
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

		// 从 map 中获取 IP 列表
		ipList := userIPMap[cr.UserId]
		results[i].IpList = processIPList(ipList, showFullIP)
	}

	// 设置缓存
	setRankingCache(cacheKey, results)

	return results, nil
}

// GetRecentIPRanking 获取1分钟内IP数排行 (实时监控)
// 注意: 排行榜中会自动排除管理员用户（role >= 10），以保护管理员隐私
func GetRecentIPRanking(limit int, showFullIP bool, showUserId bool) ([]RecentIPRanking, error) {
	if limit <= 0 || limit > 100 {
		limit = 50
	}

	// 检查缓存（实时监控，缓存时间较短）
	isAdmin := showFullIP && showUserId
	cacheKey := buildRankingCacheKey("recent_ip", 0, 0, isAdmin)
	if cached, ok := getRankingCache(cacheKey); ok {
		return cached.([]RecentIPRanking), nil
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

	if len(recentResults) == 0 {
		return []RecentIPRanking{}, nil
	}

	// 收集所有用户ID，用于批量查询
	userIDs := make([]int, len(recentResults))
	for i, rr := range recentResults {
		userIDs[i] = rr.UserId
	}

	// 批量获取所有用户的IP列表（一次查询代替 N 次查询）
	type UserIPResult struct {
		UserId int    `gorm:"column:user_id"`
		IP     string `gorm:"column:ip"`
	}
	var userIPResults []UserIPResult

	LOG_DB.Table("logs").
		Select("DISTINCT user_id, ip").
		Where("user_id IN ? AND type = ? AND ip != '' AND created_at >= ?", userIDs, LogTypeConsume, oneMinuteAgo).
		Find(&userIPResults)

	// 在内存中按用户ID分组
	userIPMap := make(map[int][]string)
	for _, uip := range userIPResults {
		userIPMap[uip.UserId] = append(userIPMap[uip.UserId], uip.IP)
	}

	// 构建结果
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

		// 从 map 中获取 IP 列表
		ipList := userIPMap[rr.UserId]
		results[i].IpList = processIPList(ipList, showFullIP)
	}

	// 设置缓存
	setRankingCache(cacheKey, results)

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

	// 检查缓存
	cacheKey := buildRankingCacheKey("quota_balance", 0, 0, showUserId)
	if cached, ok := getRankingCache(cacheKey); ok {
		return cached.([]QuotaBalanceRanking), nil
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

	// 设置缓存
	setRankingCache(cacheKey, results)

	return results, nil
}
