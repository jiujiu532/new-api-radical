package model

import (
	"errors"

	"github.com/QuantumNous/new-api/common"
)

// InvitationCodeBatch 注册码/解封码生成批次
type InvitationCodeBatch struct {
	Id        int    `json:"id" gorm:"primaryKey;autoIncrement"`
	Name      string `json:"name" gorm:"type:varchar(255);index"`            // 批次名称
	Type      int    `json:"type" gorm:"default:1;index"`                    // 类型: 1=注册码, 2=解封码
	Count     int    `json:"count" gorm:"default:0"`                         // 生成数量
	UsedCount int    `json:"used_count" gorm:"default:0"`                    // 已使用数量
	MaxUses   int    `json:"max_uses" gorm:"default:1"`                      // 每码使用次数
	CreatedBy int    `json:"created_by" gorm:"index"`                        // 创建人ID
	CreatedAt int64  `json:"created_at" gorm:"bigint;index"`                 // 创建时间
	ExpiredAt int64  `json:"expired_at" gorm:"bigint;default:0"`             // 过期时间，0=永不过期
	Note      string `json:"note" gorm:"type:varchar(255)"`                  // 备注
}

func (InvitationCodeBatch) TableName() string {
	return "invitation_code_batches"
}

// CreateBatchWithCodes 创建批次并生成关联的码
func CreateBatchWithCodes(batch *InvitationCodeBatch, codes []InvitationCode) error {
	tx := DB.Begin()
	if tx.Error != nil {
		return tx.Error
	}

	// 创建批次记录
	if err := tx.Create(batch).Error; err != nil {
		tx.Rollback()
		return err
	}

	// 为每个码设置 batch_id
	for i := range codes {
		codes[i].BatchId = batch.Id
	}

	// 批量插入码
	if err := tx.Create(&codes).Error; err != nil {
		tx.Rollback()
		return err
	}

	return tx.Commit().Error
}

// GetBatches 获取批次列表
func GetBatches(codeType int, page int, pageSize int) ([]InvitationCodeBatch, int64, error) {
	var batches []InvitationCodeBatch
	var total int64

	query := DB.Model(&InvitationCodeBatch{})

	if codeType > 0 {
		query = query.Where("type = ?", codeType)
	}

	err := query.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	err = query.Order("id desc").Offset((page - 1) * pageSize).Limit(pageSize).Find(&batches).Error
	if err != nil {
		return nil, 0, err
	}

	return batches, total, nil
}

// GetBatchById 根据ID获取批次
func GetBatchById(id int) (*InvitationCodeBatch, error) {
	var batch InvitationCodeBatch
	err := DB.First(&batch, id).Error
	if err != nil {
		return nil, err
	}
	return &batch, nil
}

// GetBatchCodes 获取批次下的所有码
func GetBatchCodes(batchId int, page int, pageSize int) ([]InvitationCode, int64, error) {
	var codes []InvitationCode
	var total int64

	query := DB.Model(&InvitationCode{}).Where("batch_id = ?", batchId)

	err := query.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	err = query.Order("id asc").Offset((page - 1) * pageSize).Limit(pageSize).Find(&codes).Error
	if err != nil {
		return nil, 0, err
	}

	return codes, total, nil
}

// ExportBatchCodes 导出批次码值（仅返回码字符串）
func ExportBatchCodes(batchId int) ([]string, error) {
	var codes []InvitationCode
	err := DB.Model(&InvitationCode{}).
		Where("batch_id = ?", batchId).
		Select("code").
		Find(&codes).Error
	if err != nil {
		return nil, err
	}

	codeList := make([]string, len(codes))
	for i, c := range codes {
		codeList[i] = c.Code
	}
	return codeList, nil
}

// DeleteBatch 删除批次记录及其关联的码
func DeleteBatch(id int) error {
	tx := DB.Begin()
	if tx.Error != nil {
		return tx.Error
	}

	// 先删除该批次下的所有码
	if err := tx.Where("batch_id = ?", id).Delete(&InvitationCode{}).Error; err != nil {
		tx.Rollback()
		return err
	}

	// 再删除批次记录
	if err := tx.Delete(&InvitationCodeBatch{}, id).Error; err != nil {
		tx.Rollback()
		return err
	}

	return tx.Commit().Error
}

// DeleteAllBatches 删除所有批次记录及其关联的码
func DeleteAllBatches() (int64, error) {
	tx := DB.Begin()
	if tx.Error != nil {
		return 0, tx.Error
	}

	// 先删除所有有 batch_id 的码
	if err := tx.Where("batch_id > 0").Delete(&InvitationCode{}).Error; err != nil {
		tx.Rollback()
		return 0, err
	}

	// 统计并删除所有批次记录
	var count int64
	tx.Model(&InvitationCodeBatch{}).Count(&count)
	if err := tx.Where("1 = 1").Delete(&InvitationCodeBatch{}).Error; err != nil {
		tx.Rollback()
		return 0, err
	}

	return count, tx.Commit().Error
}

// GenerateCodesWithBatch 批量生成码并创建批次
func GenerateCodesWithBatch(batchName string, codeType int, count int, maxUses int, note string, expiredAt int64, createdBy int) (*InvitationCodeBatch, []InvitationCode, error) {
	if count <= 0 || count > 1000 {
		return nil, nil, errors.New("生成数量必须在 1-1000 之间")
	}
	if maxUses < -1 || maxUses == 0 {
		return nil, nil, errors.New("使用次数必须是 -1（无限）或大于0的整数")
	}

	now := common.GetTimestamp()

	// 创建批次
	batch := &InvitationCodeBatch{
		Name:      batchName,
		Type:      codeType,
		Count:     count,
		MaxUses:   maxUses,
		CreatedBy: createdBy,
		CreatedAt: now,
		ExpiredAt: expiredAt,
		Note:      note,
	}

	// 生成码
	codes := make([]InvitationCode, count)
	for i := 0; i < count; i++ {
		codes[i] = InvitationCode{
			Code:      GenerateCode(12),
			Type:      codeType,
			MaxUses:   maxUses,
			UsedCount: 0,
			Status:    InvitationCodeStatusActive,
			Note:      note,
			CreatedBy: createdBy,
			CreatedAt: now,
			UpdatedAt: now,
			ExpiredAt: expiredAt,
		}
	}

	// 事务写入
	err := CreateBatchWithCodes(batch, codes)
	if err != nil {
		return nil, nil, err
	}

	return batch, codes, nil
}
