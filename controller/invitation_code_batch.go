package controller

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/QuantumNous/new-api/model"
	"github.com/gin-gonic/gin"
)

// CreateBatchAndGenerate 创建批次并生成码
func CreateBatchAndGenerate(c *gin.Context) {
	var req struct {
		Name      string `json:"name"`                         // 批次名称
		Type      int    `json:"type" binding:"required"`      // 1=注册码, 2=解封码
		Count     int    `json:"count" binding:"required"`     // 生成数量
		MaxUses   int    `json:"max_uses" binding:"required"`  // 每码使用次数
		Note      string `json:"note"`                         // 备注
		ExpiredAt int64  `json:"expired_at"`                   // 过期时间戳
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "参数错误: " + err.Error(),
		})
		return
	}

	userId := c.GetInt("id")

	batch, codes, err := model.GenerateCodesWithBatch(req.Name, req.Type, req.Count, req.MaxUses, req.Note, req.ExpiredAt, userId)
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
		"data": gin.H{
			"batch": batch,
			"codes": codes,
		},
	})
}

// GetBatches 获取批次列表
func GetBatches(c *gin.Context) {
	codeType, _ := strconv.Atoi(c.DefaultQuery("type", "0"))
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	batches, total, err := model.GetBatches(codeType, page, pageSize)
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
			"list":      batches,
			"total":     total,
			"page":      page,
			"page_size": pageSize,
		},
	})
}

// GetBatchDetail 获取批次详情（含码列表）
func GetBatchDetail(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "无效的ID",
		})
		return
	}

	batch, err := model.GetBatchById(id)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "批次不存在",
		})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "100"))
	if page < 1 {
		page = 1
	}

	codes, total, err := model.GetBatchCodes(id, page, pageSize)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "获取码列表失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"batch": batch,
			"codes": codes,
			"total": total,
		},
	})
}

// ExportBatchCodes 导出批次码值
func ExportBatchCodes(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "无效的ID",
		})
		return
	}

	codes, err := model.ExportBatchCodes(id)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "导出失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    codes,
		"count":   len(codes),
	})
}

// DeleteBatch 删除批次
func DeleteBatch(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "无效的ID",
		})
		return
	}

	err = model.DeleteBatch(id)
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

// DeleteAllBatches 清除所有批次记录
func DeleteAllBatches(c *gin.Context) {
	count, err := model.DeleteAllBatches()
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "清除失败: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": fmt.Sprintf("已清除 %d 个批次及其关联的码", count),
	})
}
