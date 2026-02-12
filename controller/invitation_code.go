package controller

import (
	"net/http"
	"strconv"
	"time"

	"github.com/QuantumNous/new-api/model"
	"github.com/gin-gonic/gin"
)

// GetInvitationCodeStats 获取注解码全局统计
func GetInvitationCodeStats(c *gin.Context) {
	now := time.Now().Unix()

	// 使用 1 次查询代替 4 次查询，通过 GROUP BY 和条件统计实现
	type StatResult struct {
		Type        int   `gorm:"column:type"`
		Total       int64 `gorm:"column:total"`
		ActiveCount int64 `gorm:"column:active_count"`
	}
	var results []StatResult

	// 一次查询获取所有统计数据
	model.DB.Model(&model.InvitationCode{}).
		Select(`type, COUNT(*) as total, SUM(CASE WHEN status = 1 AND (expired_at = 0 OR expired_at > ?) AND (max_uses = -1 OR used_count < max_uses) THEN 1 ELSE 0 END) as active_count`, now).
		Group("type").
		Find(&results)

	// 解析结果
	var totalRegister, activeRegister, totalUnban, activeUnban int64
	for _, r := range results {
		switch r.Type {
		case 1: // 注册码
			totalRegister = r.Total
			activeRegister = r.ActiveCount
		case 2: // 解封码
			totalUnban = r.Total
			activeUnban = r.ActiveCount
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"total_register":  totalRegister,
			"active_register": activeRegister,
			"total_unban":     totalUnban,
			"active_unban":    activeUnban,
		},
	})
}

// GenerateInvitationCodes 批量生成注册码/解封码
func GenerateInvitationCodes(c *gin.Context) {
	var req struct {
		Type      int    `json:"type" binding:"required"`       // 1=注册码, 2=解封码
		Count     int    `json:"count" binding:"required"`      // 生成数量
		MaxUses   int    `json:"max_uses" binding:"required"`   // 最大使用次数，-1=无限
		Note      string `json:"note"`                          // 备注
		ExpiredAt int64  `json:"expired_at"`                    // 过期时间戳，0=永不过期
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "参数错误: " + err.Error(),
		})
		return
	}

	// 获取当前用户ID
	userId := c.GetInt("id")

	codes, err := model.GenerateCodes(req.Type, req.Count, req.MaxUses, req.Note, req.ExpiredAt, userId)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "生成成功",
		"data":    codes,
	})
}

// GetInvitationCodes 获取注册码/解封码列表
func GetInvitationCodes(c *gin.Context) {
	codeType, _ := strconv.Atoi(c.DefaultQuery("type", "0"))
	status, _ := strconv.Atoi(c.DefaultQuery("status", "0"))
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	codes, total, err := model.GetInvitationCodes(codeType, status, page, pageSize)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "获取失败: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"list":  codes,
			"total": total,
			"page":  page,
			"page_size": pageSize,
		},
	})
}

// GetInvitationCode 获取单个注册码/解封码详情
func GetInvitationCode(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "无效的ID",
		})
		return
	}

	code, err := model.GetInvitationCodeById(id)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "注册码/解封码不存在",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    code,
	})
}

// UpdateInvitationCode 更新注册码/解封码
func UpdateInvitationCode(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "无效的ID",
		})
		return
	}

	var req struct {
		MaxUses   *int   `json:"max_uses"`
		Status    *int   `json:"status"`
		Note      *string `json:"note"`
		ExpiredAt *int64 `json:"expired_at"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "参数错误",
		})
		return
	}

	updates := make(map[string]interface{})
	if req.MaxUses != nil {
		updates["max_uses"] = *req.MaxUses
	}
	if req.Status != nil {
		updates["status"] = *req.Status
	}
	if req.Note != nil {
		updates["note"] = *req.Note
	}
	if req.ExpiredAt != nil {
		updates["expired_at"] = *req.ExpiredAt
	}

	if len(updates) == 0 {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "没有要更新的字段",
		})
		return
	}

	err = model.UpdateInvitationCode(id, updates)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "更新失败: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "更新成功",
	})
}

// DeleteInvitationCode 删除注册码/解封码
func DeleteInvitationCode(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "无效的ID",
		})
		return
	}

	err = model.DeleteInvitationCode(id)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "删除失败: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "删除成功",
	})
}

// GetInvitationCodeUsageLogs 获取注册码/解封码使用记录
func GetInvitationCodeUsageLogs(c *gin.Context) {
	codeId, _ := strconv.Atoi(c.DefaultQuery("code_id", "0"))
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	logs, total, err := model.GetInvitationCodeUsageLogs(codeId, page, pageSize)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "获取失败: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"list":  logs,
			"total": total,
			"page":  page,
			"page_size": pageSize,
		},
	})
}

// ValidateInvitationCode 验证注册码/解封码是否有效（不消耗使用次数，供前端预检）
func ValidateInvitationCode(c *gin.Context) {
	var req struct {
		Code string `json:"code" binding:"required"`
		Type int    `json:"type" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "参数错误",
		})
		return
	}

	valid, errMsg := model.CheckCodeExists(req.Code, req.Type)
	if !valid {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": errMsg,
			"valid":   false,
		})
		return
	}

	codeName := "注册码"
	if req.Type == 2 {
		codeName = "解封码"
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": codeName + "有效",
		"valid":   true,
	})
}

// BatchUpdateInvitationCodeStatus 批量更新注册码/解封码状态
func BatchUpdateInvitationCodeStatus(c *gin.Context) {
	var req struct {
		Ids    []int `json:"ids" binding:"required"`
		Status int   `json:"status" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "参数错误",
		})
		return
	}

	if len(req.Ids) == 0 {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "请选择要更新的注册码/解封码",
		})
		return
	}

	err := model.DB.Model(&model.InvitationCode{}).Where("id IN ?", req.Ids).Update("status", req.Status).Error
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "更新失败: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "批量更新成功",
	})
}

// BatchDeleteInvitationCodes 批量删除注册码/解封码
func BatchDeleteInvitationCodes(c *gin.Context) {
	var req struct {
		Ids []int `json:"ids" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "参数错误",
		})
		return
	}

	if len(req.Ids) == 0 {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "请选择要删除的注册码/解封码",
		})
		return
	}

	err := model.DB.Where("id IN ?", req.Ids).Delete(&model.InvitationCode{}).Error
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "删除失败: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "批量删除成功",
	})
}

// ExportInvitationCodes 导出注册码/解封码（仅导出码值）
// 参数: type=1/2, count=-1表示全部，只导出有效的（状态=1，未过期，未用完）
func ExportInvitationCodes(c *gin.Context) {
	codeType, _ := strconv.Atoi(c.DefaultQuery("type", "1"))
	count, _ := strconv.Atoi(c.DefaultQuery("count", "-1"))
	now := time.Now().Unix()

	if codeType != 1 && codeType != 2 {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "类型必须是 1(注册码) 或 2(解封码)",
		})
		return
	}

	var codes []model.InvitationCode
	query := model.DB.Model(&model.InvitationCode{}).
		Where("type = ?", codeType).
		Where("status = ?", 1). // 只导出有效状态
		Where("(expired_at = 0 OR expired_at > ?)", now). // 未过期
		Where("(max_uses = -1 OR used_count < max_uses)") // 未用完

	// 如果 count > 0，限制数量
	if count > 0 {
		query = query.Limit(count)
	}

	err := query.Select("code").Find(&codes).Error
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "导出失败",
		})
		return
	}

	// 提取码值
	codeList := make([]string, len(codes))
	for i, code := range codes {
		codeList[i] = code.Code
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    codeList,
		"count":   len(codeList),
	})
}

// DeleteAllInvitationCodesByType 按类型删除所有注册码/解封码
func DeleteAllInvitationCodesByType(c *gin.Context) {
	codeTypeStr := c.Query("type")
	codeType, err := strconv.Atoi(codeTypeStr)
	if err != nil || (codeType != 1 && codeType != 2) {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "无效的类型参数，必须是 1(注册码) 或 2(解封码)",
		})
		return
	}

	// 获取状态筛选参数：0=全部, 1=有效, 2=已用完, 3=已禁用, 4=已过期
	statusStr := c.Query("status")
	status := 0 // 默认删除全部
	if statusStr != "" {
		status, _ = strconv.Atoi(statusStr)
	}

	now := time.Now().Unix()
	query := model.DB.Where("type = ?", codeType)

	statusName := ""
	switch status {
	case 1: // 有效：status=1 且未过期且未用完
		query = query.Where("status = 1 AND (expired_at = 0 OR expired_at > ?) AND (max_uses = -1 OR used_count < max_uses)", now)
		statusName = "有效"
	case 2: // 已用完：used_count >= max_uses 且 max_uses != -1（包含已用完+已过期的码）
		query = query.Where("max_uses != -1 AND used_count >= max_uses")
		statusName = "已用完"
	case 4: // 已过期：只删除纯过期的码，排除同时已用完的码
		query = query.Where("expired_at > 0 AND expired_at < ? AND (max_uses = -1 OR used_count < max_uses)", now)
		statusName = "已过期"
	default:
		statusName = "所有"
	}

	result := query.Delete(&model.InvitationCode{})
	if result.Error != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "删除失败: " + result.Error.Error(),
		})
		return
	}

	typeName := "注册码"
	if codeType == 2 {
		typeName = "解封码"
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "成功删除" + statusName + typeName + "，共 " + strconv.FormatInt(result.RowsAffected, 10) + " 条",
		"data": gin.H{
			"deleted_count": result.RowsAffected,
		},
	})
}
