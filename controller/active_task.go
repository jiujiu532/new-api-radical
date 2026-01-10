/*
Copyright (C) 2025 QuantumNous

活跃任务 API 控制器
*/

package controller

import (
	"strconv"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/gin-gonic/gin"
)

// GetActiveTaskRankAPI 获取活跃任务排名
// GET /api/active_task/rank
// 参数：
// - window: 时间窗口（秒），默认30
// - limit: 返回数量限制，默认50，最大200
func GetActiveTaskRankAPI(c *gin.Context) {
	windowSeconds, _ := strconv.ParseInt(c.Query("window"), 10, 64)
	if windowSeconds <= 0 {
		windowSeconds = model.ActiveWindowSeconds
	}
	if windowSeconds > 3600 {
		windowSeconds = 3600 // 最大1小时
	}

	limit, _ := strconv.Atoi(c.Query("limit"))
	if limit <= 0 {
		limit = 50
	}
	if limit > 200 {
		limit = 200
	}

	manager := model.GetActiveTaskSlotManager()
	rank := manager.GetActiveTaskRank(windowSeconds)

	// 限制返回数量
	if len(rank) > limit {
		rank = rank[:limit]
	}

	common.ApiSuccess(c, gin.H{
		"rank":           rank,
		"window_seconds": windowSeconds,
	})
}

// GetActiveTaskStatsAPI 获取活跃任务统计信息
// GET /api/active_task/stats
func GetActiveTaskStatsAPI(c *gin.Context) {
	manager := model.GetActiveTaskSlotManager()
	stats := manager.GetStats()
	common.ApiSuccess(c, stats)
}

// GetHighActiveTaskHistoryAPI 获取高活跃任务历史记录
// GET /api/active_task/history
// 参数：
// - start_time: 开始时间戳（秒）
// - end_time: 结束时间戳（秒）
// - user_id: 用户ID（可选）
// - limit: 返回数量限制，默认100，最大500
func GetHighActiveTaskHistoryAPI(c *gin.Context) {
	startTime, _ := strconv.ParseInt(c.Query("start_time"), 10, 64)
	endTime, _ := strconv.ParseInt(c.Query("end_time"), 10, 64)
	userId, _ := strconv.Atoi(c.Query("user_id"))
	limit, _ := strconv.Atoi(c.Query("limit"))

	if limit <= 0 {
		limit = 100
	}
	if limit > 500 {
		limit = 500
	}

	records, err := model.GetHighActiveTaskHistory(startTime, endTime, userId, limit)
	if err != nil {
		common.ApiErrorMsg(c, "获取历史记录失败: "+err.Error())
		return
	}

	common.ApiSuccess(c, gin.H{
		"records": records,
		"total":   len(records),
	})
}


// GetUserTokenUsage24hAPI 获取用户24小时内按模型分类的token消耗
// GET /api/active_task/user_token_usage
// 参数：
// - user_id: 用户ID（必填）
func GetUserTokenUsage24hAPI(c *gin.Context) {
	userId, err := strconv.Atoi(c.Query("user_id"))
	if err != nil || userId <= 0 {
		common.ApiErrorMsg(c, "无效的用户ID")
		return
	}

	// 计算24小时前的时间戳
	now := common.GetTimestamp()
	startTimestamp := now - 24*60*60

	results, err := model.GetUserTokenUsageByModel(userId, startTimestamp, now)
	if err != nil {
		common.ApiErrorMsg(c, "获取token消耗失败: "+err.Error())
		return
	}

	// 计算总计
	var totalTokens, totalRequests int64
	for _, r := range results {
		totalTokens += r.TotalTokens
		totalRequests += r.RequestCount
	}

	common.ApiSuccess(c, gin.H{
		"user_id":         userId,
		"start_timestamp": startTimestamp,
		"end_timestamp":   now,
		"models":          results,
		"total_tokens":    totalTokens,
		"total_requests":  totalRequests,
	})
}
