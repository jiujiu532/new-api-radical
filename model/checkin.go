package model

import (
	"errors"
	"math/rand"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/setting/operation_setting"
	"gorm.io/gorm"
)

// Checkin 签到记录
type Checkin struct {
	Id           int    `json:"id" gorm:"primaryKey;autoIncrement"`
	UserId       int    `json:"user_id" gorm:"not null;uniqueIndex:idx_user_checkin_date"`
	CheckinDate  string `json:"checkin_date" gorm:"type:varchar(10);not null;uniqueIndex:idx_user_checkin_date"` // 格式: YYYY-MM-DD
	QuotaAwarded int    `json:"quota_awarded" gorm:"not null"`
	CreatedAt    int64  `json:"created_at" gorm:"bigint"`
}

// CheckinRecord 用于API返回的签到记录（不包含敏感字段）
type CheckinRecord struct {
	CheckinDate  string `json:"checkin_date"`
	QuotaAwarded int    `json:"quota_awarded"`
}

func (Checkin) TableName() string {
	return "checkins"
}

// GetUserCheckinRecords 获取用户在指定日期范围内的签到记录
func GetUserCheckinRecords(userId int, startDate, endDate string) ([]Checkin, error) {
	var records []Checkin
	err := DB.Where("user_id = ? AND checkin_date >= ? AND checkin_date <= ?",
		userId, startDate, endDate).
		Order("checkin_date DESC").
		Find(&records).Error
	return records, err
}

// HasCheckedInToday 检查用户今天是否已签到
func HasCheckedInToday(userId int) (bool, error) {
	today := time.Now().Format("2006-01-02")
	var count int64
	err := DB.Model(&Checkin{}).
		Where("user_id = ? AND checkin_date = ?", userId, today).
		Count(&count).Error
	return count > 0, err
}

// UserCheckin 执行用户签到
func UserCheckin(userId int) (*Checkin, error) {
	setting := operation_setting.GetCheckinSetting()
	if !setting.CheckinEnabled {
		return nil, errors.New("签到功能未启用")
	}

	// 检查今天是否已签到
	hasChecked, err := HasCheckedInToday(userId)
	if err != nil {
		return nil, err
	}
	if hasChecked {
		return nil, errors.New("今日已签到")
	}

	// 计算额度奖励：支持固定模式和随机模式
	var quotaAwarded int
	if setting.CheckinRandomMode {
		// 随机模式
		if setting.CheckinMaxQuota > setting.CheckinMinQuota {
			quotaAwarded = setting.CheckinMinQuota + rand.Intn(setting.CheckinMaxQuota-setting.CheckinMinQuota+1)
		} else {
			quotaAwarded = setting.CheckinMinQuota
		}
	} else {
		// 固定模式
		quotaAwarded = setting.CheckinQuota
	}

	today := time.Now().Format("2006-01-02")
	checkin := &Checkin{
		UserId:       userId,
		CheckinDate:  today,
		QuotaAwarded: quotaAwarded,
		CreatedAt:    time.Now().Unix(),
	}

	// 根据数据库类型选择不同的策略
	if common.UsingSQLite {
		return userCheckinWithoutTransaction(checkin, userId, quotaAwarded)
	}
	return userCheckinWithTransaction(checkin, userId, quotaAwarded)
}

// userCheckinWithTransaction 使用事务执行签到（适用于 MySQL 和 PostgreSQL）
func userCheckinWithTransaction(checkin *Checkin, userId int, quotaAwarded int) (*Checkin, error) {
	err := DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(checkin).Error; err != nil {
			return errors.New("签到失败，请稍后重试")
		}
		if err := tx.Model(&User{}).Where("id = ?", userId).
			Update("quota", gorm.Expr("quota + ?", quotaAwarded)).Error; err != nil {
			return errors.New("签到失败：更新额度出错")
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	go func() {
		_ = cacheIncrUserQuota(userId, int64(quotaAwarded))
	}()
	return checkin, nil
}

// userCheckinWithoutTransaction 不使用事务执行签到（适用于 SQLite）
func userCheckinWithoutTransaction(checkin *Checkin, userId int, quotaAwarded int) (*Checkin, error) {
	if err := DB.Create(checkin).Error; err != nil {
		return nil, errors.New("签到失败，请稍后重试")
	}
	if err := IncreaseUserQuota(userId, quotaAwarded, true); err != nil {
		DB.Delete(checkin)
		return nil, errors.New("签到失败：更新额度出错")
	}
	return checkin, nil
}

// GetUserCheckinStats 获取用户签到统计信息
func GetUserCheckinStats(userId int, month string) (map[string]interface{}, error) {
	startDate := month + "-01"
	endDate := month + "-31"

	records, err := GetUserCheckinRecords(userId, startDate, endDate)
	if err != nil {
		return nil, err
	}

	checkinRecords := make([]CheckinRecord, len(records))
	for i, r := range records {
		checkinRecords[i] = CheckinRecord{
			CheckinDate:  r.CheckinDate,
			QuotaAwarded: r.QuotaAwarded,
		}
	}

	hasCheckedToday, _ := HasCheckedInToday(userId)

	var totalCheckins int64
	var totalQuota int64
	DB.Model(&Checkin{}).Where("user_id = ?", userId).Count(&totalCheckins)
	DB.Model(&Checkin{}).Where("user_id = ?", userId).Select("COALESCE(SUM(quota_awarded), 0)").Scan(&totalQuota)

	return map[string]interface{}{
		"total_quota":      totalQuota,
		"total_checkins":   totalCheckins,
		"checkin_count":    len(records),
		"checked_in_today": hasCheckedToday,
		"records":          checkinRecords,
	}, nil
}

// MigrateCheckinTable 迁移签到表字段
func MigrateCheckinTable() error {
	// 先检查表是否存在，直接用表名
	if !DB.Migrator().HasTable("checkins") {
		// 表不存在，跳过迁移，让 AutoMigrate 创建新表
		return nil
	}

	// 直接用 SQL 检查列是否存在，避免依赖结构体
	var hasOldQuota, hasNewQuota bool

	if common.UsingSQLite {
		// SQLite: 查询 pragma
		var columns []struct {
			Name string `gorm:"column:name"`
		}
		DB.Raw("PRAGMA table_info(checkins)").Scan(&columns)
		for _, col := range columns {
			if col.Name == "quota" {
				hasOldQuota = true
			}
			if col.Name == "quota_awarded" {
				hasNewQuota = true
			}
		}
	} else if common.UsingMySQL {
		// MySQL: 查询 information_schema
		var count int64
		DB.Raw("SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'checkins' AND column_name = 'quota'").Scan(&count)
		hasOldQuota = count > 0
		DB.Raw("SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'checkins' AND column_name = 'quota_awarded'").Scan(&count)
		hasNewQuota = count > 0
	} else {
		// PostgreSQL: 查询 information_schema
		var count int64
		DB.Raw("SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'checkins' AND column_name = 'quota'").Scan(&count)
		hasOldQuota = count > 0
		DB.Raw("SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'checkins' AND column_name = 'quota_awarded'").Scan(&count)
		hasNewQuota = count > 0
	}

	if hasOldQuota && !hasNewQuota {
		common.SysLog("migrating checkin table: quota -> quota_awarded")
		if common.UsingSQLite {
			// SQLite 不支持直接重命名列，添加新列并复制数据
			if err := DB.Exec("ALTER TABLE checkins ADD COLUMN quota_awarded INTEGER NOT NULL DEFAULT 0").Error; err != nil {
				return err
			}
			if err := DB.Exec("UPDATE checkins SET quota_awarded = quota").Error; err != nil {
				return err
			}
			// SQLite 3.35+ 支持 DROP COLUMN，但为了兼容性不删除旧列
		} else {
			// MySQL / PostgreSQL 直接重命名
			if err := DB.Exec("ALTER TABLE checkins RENAME COLUMN quota TO quota_awarded").Error; err != nil {
				return err
			}
		}
		common.SysLog("checkin table migration completed")
	}

	return nil
}
