package controller

import (
	"net/http"
	"strconv"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/gin-gonic/gin"
)

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
	startTimestamp, _ := strconv.ParseInt(c.Query("start_timestamp"), 10, 64)
	endTimestamp, _ := strconv.ParseInt(c.Query("end_timestamp"), 10, 64)
	limit, _ := strconv.Atoi(c.Query("limit"))
	if limit <= 0 {
		limit = 50
	}

	// 判断是否为管理员
	// 管理员可以看到完整IP和用户ID，普通用户只能看到打码的IP且没有用户ID
	isAdmin := isAdminRole(c)
	showFullIP := isAdmin
	showUserId := isAdmin

	data, err := model.GetUserCallRanking(startTimestamp, endTimestamp, limit, showFullIP, showUserId)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    data,
	})
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
	startTimestamp, _ := strconv.ParseInt(c.Query("start_timestamp"), 10, 64)
	endTimestamp, _ := strconv.ParseInt(c.Query("end_timestamp"), 10, 64)
	limit, _ := strconv.Atoi(c.Query("limit"))
	if limit <= 0 {
		limit = 50
	}

	isAdmin := isAdminRole(c)
	showFullIP := isAdmin

	data, err := model.GetIPCallRanking(startTimestamp, endTimestamp, limit, showFullIP)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    data,
	})
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
	startTimestamp, _ := strconv.ParseInt(c.Query("start_timestamp"), 10, 64)
	endTimestamp, _ := strconv.ParseInt(c.Query("end_timestamp"), 10, 64)
	limit, _ := strconv.Atoi(c.Query("limit"))
	if limit <= 0 {
		limit = 50
	}

	isAdmin := isAdminRole(c)
	showUserId := isAdmin

	data, err := model.GetTokenConsumeRanking(startTimestamp, endTimestamp, limit, showUserId)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    data,
	})
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
	startTimestamp, _ := strconv.ParseInt(c.Query("start_timestamp"), 10, 64)
	endTimestamp, _ := strconv.ParseInt(c.Query("end_timestamp"), 10, 64)
	limit, _ := strconv.Atoi(c.Query("limit"))
	if limit <= 0 {
		limit = 50
	}

	isAdmin := isAdminRole(c)
	showFullIP := isAdmin
	showUserId := isAdmin

	data, err := model.GetUserIPCountRanking(startTimestamp, endTimestamp, limit, showFullIP, showUserId)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    data,
	})
}

// GetRecentIPRanking 获取1分钟内IP数排行
// @Summary 获取1分钟内IP数排行
// @Tags Ranking
// @Produce json
// @Param limit query int false "返回数量限制"
// @Success 200 {object} map[string]interface{}
// @Router /api/ranking/recent_ip [get]
func GetRecentIPRanking(c *gin.Context) {
	limit, _ := strconv.Atoi(c.Query("limit"))
	if limit <= 0 {
		limit = 50
	}

	isAdmin := isAdminRole(c)
	showFullIP := isAdmin
	showUserId := isAdmin

	data, err := model.GetRecentIPRanking(limit, showFullIP, showUserId)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    data,
	})
}

// GetQuotaBalanceRanking 获取囤囤鼠排行（用户余额排行）
// @Summary 获取囤囤鼠排行
// @Tags Ranking
// @Produce json
// @Param limit query int false "返回数量限制"
// @Success 200 {object} map[string]interface{}
// @Router /api/ranking/quota_balance [get]
func GetQuotaBalanceRanking(c *gin.Context) {
	limit, _ := strconv.Atoi(c.Query("limit"))
	if limit <= 0 {
		limit = 50
	}

	isAdmin := isAdminRole(c)
	showUserId := isAdmin

	data, err := model.GetQuotaBalanceRanking(limit, showUserId)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    data,
	})
}
