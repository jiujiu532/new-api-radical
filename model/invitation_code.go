package model

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/common"
	"gorm.io/gorm"
)

// InvitationCode 注册码模型
type InvitationCode struct {
	Id        int    `json:"id" gorm:"primaryKey;autoIncrement"`
	Code      string `json:"code" gorm:"type:varchar(64);uniqueIndex;not null"`       // 注册码
	Type      int    `json:"type" gorm:"default:1;index"`                             // 类型: 1=注册码, 2=解封码
	MaxUses   int    `json:"max_uses" gorm:"default:1"`                               // 最大使用次数，-1表示无限
	UsedCount int    `json:"used_count" gorm:"default:0"`                             // 已使用次数
	Status    int    `json:"status" gorm:"default:1;index"`                           // 状态: 1=有效, 2=已用完, 3=已禁用
	Note      string `json:"note" gorm:"type:varchar(255)"`                           // 备注
	CreatedBy int    `json:"created_by" gorm:"default:0"`                             // 创建者用户ID
	CreatedAt int64  `json:"created_at" gorm:"bigint"`                                // 创建时间
	UpdatedAt int64  `json:"updated_at" gorm:"bigint"`                                // 更新时间
	ExpiredAt int64  `json:"expired_at" gorm:"bigint;default:0"`                      // 过期时间，0表示永不过期
}

// InvitationCodeUsageLog 注册码使用记录
type InvitationCodeUsageLog struct {
	Id        int    `json:"id" gorm:"primaryKey;autoIncrement"`
	CodeId    int    `json:"code_id" gorm:"index;not null"`                           // 注册码ID
	Code      string `json:"code" gorm:"type:varchar(64);index"`                      // 注册码
	UserId    int    `json:"user_id" gorm:"index"`                                    // 使用者用户ID（注册后的ID或被解封的ID）
	Username  string `json:"username" gorm:"type:varchar(64)"`                        // 用户名
	IP        string `json:"ip" gorm:"type:varchar(64)"`                              // 使用时的IP
	Type      int    `json:"type" gorm:"default:1"`                                   // 类型: 1=注册, 2=解封
	CreatedAt int64  `json:"created_at" gorm:"bigint"`                                // 使用时间
}

// 注册码类型常量
const (
	InvitationCodeTypeRegister = 1 // 注册码
	InvitationCodeTypeUnban    = 2 // 解封码
)

// 注册码状态常量
const (
	InvitationCodeStatusActive   = 1 // 有效
	InvitationCodeStatusExhausted = 2 // 已用完
	InvitationCodeStatusDisabled = 3 // 已禁用
)

// TableName 指定表名
func (InvitationCode) TableName() string {
	return "invitation_codes"
}

func (InvitationCodeUsageLog) TableName() string {
	return "invitation_code_usage_logs"
}

// GenerateCode 生成随机注册码
func GenerateCode(length int) string {
	if length <= 0 {
		length = 8
	}
	bytes := make([]byte, length)
	rand.Read(bytes)
	return strings.ToUpper(hex.EncodeToString(bytes)[:length])
}

// GenerateCodes 批量生成注册码
func GenerateCodes(codeType int, count int, maxUses int, note string, expiredAt int64, createdBy int) ([]InvitationCode, error) {
	if count <= 0 || count > 1000 {
		return nil, errors.New("生成数量必须在 1-1000 之间")
	}
	if maxUses < -1 || maxUses == 0 {
		return nil, errors.New("使用次数必须是 -1（无限）或大于0的整数")
	}

	codes := make([]InvitationCode, count)
	now := common.GetTimestamp()
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

	// 批量插入
	err := DB.Create(&codes).Error
	if err != nil {
		return nil, err
	}

	return codes, nil
}

// ValidateAndUseCode 验证并使用注册码
// 返回: 注册码对象, 错误信息
func ValidateAndUseCode(code string, codeType int, userId int, username string, ip string) (*InvitationCode, error) {
	code = strings.TrimSpace(strings.ToUpper(code))
	
	// 根据类型确定显示名称
	codeName := "注册码"
	if codeType == 2 {
		codeName = "解封码"
	}
	
	if code == "" {
		return nil, errors.New(codeName + "不能为空")
	}

	var invCode InvitationCode
	err := DB.Where("code = ? AND type = ?", code, codeType).First(&invCode).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New(codeName + "不存在或类型不匹配")
		}
		return nil, err
	}

	// 检查状态
	if invCode.Status == InvitationCodeStatusDisabled {
		return nil, errors.New(codeName + "已被禁用")
	}
	if invCode.Status == InvitationCodeStatusExhausted {
		return nil, errors.New(codeName + "已用完")
	}

	// 检查过期
	if invCode.ExpiredAt > 0 && invCode.ExpiredAt < time.Now().Unix() {
		return nil, errors.New(codeName + "已过期")
	}

	// 检查使用次数
	if invCode.MaxUses != -1 && invCode.UsedCount >= invCode.MaxUses {
		// 更新状态为已用完
		DB.Model(&invCode).Update("status", InvitationCodeStatusExhausted)
		return nil, errors.New(codeName + "已用完")
	}

	// 使用注册码（事务）
	err = DB.Transaction(func(tx *gorm.DB) error {
		// 增加使用次数
		newUsedCount := invCode.UsedCount + 1
		updates := map[string]interface{}{
			"used_count": newUsedCount,
		}

		// 如果达到最大使用次数，更新状态
		if invCode.MaxUses != -1 && newUsedCount >= invCode.MaxUses {
			updates["status"] = InvitationCodeStatusExhausted
		}

		if err := tx.Model(&invCode).Updates(updates).Error; err != nil {
			return err
		}

		// 记录使用日志
		usageLog := InvitationCodeUsageLog{
			CodeId:    invCode.Id,
			Code:      invCode.Code,
			UserId:    userId,
			Username:  username,
			IP:        ip,
			Type:      codeType,
			CreatedAt: common.GetTimestamp(),
		}
		if err := tx.Create(&usageLog).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	return &invCode, nil
}

// GetInvitationCodes 获取注册码列表
func GetInvitationCodes(codeType int, status int, page int, pageSize int) ([]InvitationCode, int64, error) {
	var codes []InvitationCode
	var total int64
	now := time.Now().Unix()

	query := DB.Model(&InvitationCode{})
	
	if codeType > 0 {
		query = query.Where("type = ?", codeType)
	}
	
	// status: 1=有效, 2=已用完, 4=已过期
	// 注意：已用完优先级高于已过期，所以筛选已过期时要排除已用完
	if status > 0 {
		switch status {
		case 1:
			// 有效：status=1 且 (expired_at=0 或 expired_at > 当前时间) 且 (max_uses=-1 或 used_count < max_uses)
			query = query.Where("status = 1 AND (expired_at = 0 OR expired_at > ?) AND (max_uses = -1 OR used_count < max_uses)", now)
		case 2:
			// 已用完：max_uses != -1 且 used_count >= max_uses（包含同时过期的）
			query = query.Where("max_uses != -1 AND used_count >= max_uses")
		case 4:
			// 已过期：expired_at > 0 且 expired_at < 当前时间，但排除已用完的
			query = query.Where("expired_at > 0 AND expired_at < ? AND (max_uses = -1 OR used_count < max_uses)", now)
		}
	}

	err := query.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	err = query.Order("id desc").Offset((page - 1) * pageSize).Limit(pageSize).Find(&codes).Error
	if err != nil {
		return nil, 0, err
	}

	return codes, total, nil
}

// GetInvitationCodeById 根据ID获取注册码
func GetInvitationCodeById(id int) (*InvitationCode, error) {
	var code InvitationCode
	err := DB.First(&code, id).Error
	if err != nil {
		return nil, err
	}
	return &code, nil
}

// UpdateInvitationCode 更新注册码
func UpdateInvitationCode(id int, updates map[string]interface{}) error {
	return DB.Model(&InvitationCode{}).Where("id = ?", id).Updates(updates).Error
}

// DeleteInvitationCode 删除注册码
func DeleteInvitationCode(id int) error {
	return DB.Delete(&InvitationCode{}, id).Error
}

// GetInvitationCodeUsageLogs 获取注册码使用记录
func GetInvitationCodeUsageLogs(codeId int, page int, pageSize int) ([]InvitationCodeUsageLog, int64, error) {
	var logs []InvitationCodeUsageLog
	var total int64

	query := DB.Model(&InvitationCodeUsageLog{})
	
	if codeId > 0 {
		query = query.Where("code_id = ?", codeId)
	}

	err := query.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	err = query.Order("id desc").Offset((page - 1) * pageSize).Limit(pageSize).Find(&logs).Error
	if err != nil {
		return nil, 0, err
	}

	return logs, total, nil
}

// CheckCodeExists 检查注册码是否存在且有效（不消耗使用次数）
func CheckCodeExists(code string, codeType int) (bool, string) {
	code = strings.TrimSpace(strings.ToUpper(code))
	
	// 根据类型确定显示名称
	codeName := "注册码"
	if codeType == 2 {
		codeName = "解封码"
	}
	
	if code == "" {
		return false, codeName + "不能为空"
	}

	var invCode InvitationCode
	err := DB.Where("code = ? AND type = ?", code, codeType).First(&invCode).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return false, codeName + "不存在"
		}
		return false, "查询失败"
	}

	if invCode.Status == InvitationCodeStatusDisabled {
		return false, codeName + "已被禁用"
	}
	if invCode.Status == InvitationCodeStatusExhausted {
		return false, codeName + "已用完"
	}
	if invCode.ExpiredAt > 0 && invCode.ExpiredAt < time.Now().Unix() {
		return false, codeName + "已过期"
	}
	if invCode.MaxUses != -1 && invCode.UsedCount >= invCode.MaxUses {
		return false, codeName + "已用完"
	}

	return true, ""
}
