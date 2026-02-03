package operation_setting

import "github.com/QuantumNous/new-api/setting/config"

// 签到模式常量
const (
	CheckinModeDaily    = "daily"     // 每日签到模式
	CheckinModeLowQuota = "low_quota" // 低额度签到模式
)

// CheckinSetting 签到功能配置
type CheckinSetting struct {
	Enabled    bool   `json:"enabled"`     // 是否启用签到功能
	Mode       string `json:"mode"`        // 签到模式: daily=每日签到, low_quota=低额度签到
	
	// 每日签到模式配置
	RandomMode bool `json:"random_mode"` // 是否启用随机额度模式（每日签到模式下使用）
	MinQuota   int  `json:"min_quota"`   // 签到最小额度（随机模式下使用）
	MaxQuota   int  `json:"max_quota"`   // 签到最大额度（随机模式下使用）
	FixedQuota int  `json:"fixed_quota"` // 固定签到额度（固定模式下使用）
	
	// 低额度签到模式配置
	LowQuotaThreshold int `json:"low_quota_threshold"` // 低额度阈值，余额低于此值时可签到
	LowQuotaReward    int `json:"low_quota_reward"`    // 低额度签到奖励额度
}

// 默认配置
var checkinSetting = CheckinSetting{
	Enabled:           false,
	Mode:              CheckinModeDaily, // 默认每日签到模式
	RandomMode:        true,             // 默认随机模式
	MinQuota:          1000,
	MaxQuota:          10000,
	FixedQuota:        5000,
	LowQuotaThreshold: 10000,  // 默认余额低于 10000 时可签到
	LowQuotaReward:    50000,  // 默认低额度签到奖励 50000
}

func init() {
	// 注册到全局配置管理器
	config.GlobalConfig.Register("checkin_setting", &checkinSetting)
}

// GetCheckinSetting 获取签到配置
func GetCheckinSetting() *CheckinSetting {
	return &checkinSetting
}

// IsCheckinEnabled 是否启用签到功能
func IsCheckinEnabled() bool {
	return checkinSetting.Enabled
}

// GetCheckinMode 获取签到模式
func GetCheckinMode() string {
	if checkinSetting.Mode == "" {
		return CheckinModeDaily // 默认每日签到
	}
	return checkinSetting.Mode
}

// GetCheckinQuotaRange 获取签到额度范围（每日签到随机模式）
func GetCheckinQuotaRange() (min, max int) {
	return checkinSetting.MinQuota, checkinSetting.MaxQuota
}

// GetLowQuotaSettings 获取低额度签到设置
func GetLowQuotaSettings() (threshold, reward int) {
	return checkinSetting.LowQuotaThreshold, checkinSetting.LowQuotaReward
}
