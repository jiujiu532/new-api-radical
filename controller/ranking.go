package controller

import (
	"net/http"
	"strconv"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/gin-gonic/gin"
)

// 排名功能默认配置
const (
	DefaultRankingLimit = 50
)

// RankingParams 排名查询通用参数
type RankingParams struct {
	StartTimestamp int64
	EndTimestamp   int64
	Limit          int
	ShowFullIP     bool
	ShowUserId     bool
}

// parseRankingParams 解析排名查询通用参数
// 管理员可以看到完整IP和用户ID，普通用户只能看到打码的IP且没有用户ID
func parseRankingParams(c *gin.Context) RankingParams {
	startTimestamp, _ := strconv.ParseInt(c.Query("start_timestamp"), 10, 64)
	endTimestamp, _ := strconv.ParseInt(c.Query("end_timestamp"), 10, 64)
	limit, _ := strconv.Atoi(c.Query("limit"))
	if limit <= 0 {
		limit = DefaultRankingLimit
	}

	isAdmin := isAdminRole(c)
	return RankingParams{
		StartTimestamp: startTimestamp,
		EndTimestamp:   endTimestamp,
		Limit:          limit,
		ShowFullIP:     isAdmin,
		ShowUserId:     isAdmin,
	}
}

// rankingSuccess 返回排名查询成功响应
func rankingSuccess(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    data,
	})
}

// rankingError 返回排名查询错误响应
func rankingError(c *gin.Context, err error) {
	c.JSON(http.StatusOK, gin.H{
		"success": false,
		"message": err.Error(),
	})
}

// isAdminRole 判断当前用户是否为管理员
func isAdminRole(c *gin.Context) bool {
	role, exists := c.Get("role")
	if !exists {
		return false
	}
	roleInt, ok := role.(int)
	if !ok {
		return false
	}
	return roleInt >= common.RoleAdminUser
}

// GetUserCallRanking 获取用户调用排行
// @Summary 获取用户调用排行
// @Tags Ranking
// @Produce json
// @Param start_timestamp query int false "开始时间戳"
// @Param end_timestamp query int false "结束时间戳"
// @Param limit query int false "返回数量限制"
// @Success 200 {object} map[string]interface{}
// @Router /api/ranking/user_call [get]
func GetUserCallRanking(c *gin.Context) {
	p := parseRankingParams(c)
	data, err := model.GetUserCallRanking(p.StartTimestamp, p.EndTimestamp, p.Limit, p.ShowFullIP, p.ShowUserId)
	if err != nil {
		rankingError(c, err)
		return
	}
	rankingSuccess(c, data)
}

// GetIPCallRanking 获取IP调用排行
// @Summary 获取IP调用排行
// @Tags Ranking
// @Produce json
// @Param start_timestamp query int false "开始时间戳"
// @Param end_timestamp query int false "结束时间戳"
// @Param limit query int false "返回数量限制"
// @Success 200 {object} map[string]interface{}
// @Router /api/ranking/ip_call [get]
func GetIPCallRanking(c *gin.Context) {
	p := parseRankingParams(c)
	data, err := model.GetIPCallRanking(p.StartTimestamp, p.EndTimestamp, p.Limit, p.ShowFullIP)
	if err != nil {
		rankingError(c, err)
		return
	}
	rankingSuccess(c, data)
}

// GetTokenConsumeRanking 获取Token消耗排行
// @Summary 获取Token消耗排行
// @Tags Ranking
// @Produce json
// @Param start_timestamp query int false "开始时间戳"
// @Param end_timestamp query int false "结束时间戳"
// @Param limit query int false "返回数量限制"
// @Success 200 {object} map[string]interface{}
// @Router /api/ranking/token_consume [get]
func GetTokenConsumeRanking(c *gin.Context) {
	p := parseRankingParams(c)
	data, err := model.GetTokenConsumeRanking(p.StartTimestamp, p.EndTimestamp, p.Limit, p.ShowUserId)
	if err != nil {
		rankingError(c, err)
		return
	}
	rankingSuccess(c, data)
}

// GetUserIPCountRanking 获取用户IP数排行
// @Summary 获取用户IP数排行
// @Tags Ranking
// @Produce json
// @Param start_timestamp query int false "开始时间戳"
// @Param end_timestamp query int false "结束时间戳"
// @Param limit query int false "返回数量限制"
// @Success 200 {object} map[string]interface{}
// @Router /api/ranking/user_ip_count [get]
func GetUserIPCountRanking(c *gin.Context) {
	p := parseRankingParams(c)
	data, err := model.GetUserIPCountRanking(p.StartTimestamp, p.EndTimestamp, p.Limit, p.ShowFullIP, p.ShowUserId)
	if err != nil {
		rankingError(c, err)
		return
	}
	rankingSuccess(c, data)
}

// GetRecentIPRanking 获取1分钟内IP数排行
// @Summary 获取1分钟内IP数排行
// @Tags Ranking
// @Produce json
// @Param limit query int false "返回数量限制"
// @Success 200 {object} map[string]interface{}
// @Router /api/ranking/recent_ip [get]
func GetRecentIPRanking(c *gin.Context) {
	p := parseRankingParams(c)
	data, err := model.GetRecentIPRanking(p.Limit, p.ShowFullIP, p.ShowUserId)
	if err != nil {
		rankingError(c, err)
		return
	}
	rankingSuccess(c, data)
}

// GetQuotaBalanceRanking 获取囤囤鼠排行（用户余额排行）
// @Summary 获取囤囤鼠排行
// @Tags Ranking
// @Produce json
// @Param limit query int false "返回数量限制"
// @Success 200 {object} map[string]interface{}
// @Router /api/ranking/quota_balance [get]
func GetQuotaBalanceRanking(c *gin.Context) {
	p := parseRankingParams(c)
	data, err := model.GetQuotaBalanceRanking(p.Limit, p.ShowUserId)
	if err != nil {
		rankingError(c, err)
		return
	}
	rankingSuccess(c, data)
}
