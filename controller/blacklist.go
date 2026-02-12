package controller

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/gin-gonic/gin"
)

// findBannedUser 查找被封禁用户（通过用户名）
// 返回用户对象或错误信息
func findBannedUser(username string) (*model.User, error) {
	var user model.User
	err := model.DB.Where("username = ?", username).First(&user).Error
	if err != nil {
		return nil, errors.New("用户不存在")
	}
	if user.Status != common.UserStatusDisabled {
		return nil, errors.New("该用户未被封禁")
	}
	return &user, nil
}

// findBannedUserByEmail 查找被封禁用户（通过邮箱）
// 返回用户对象或错误信息
func findBannedUserByEmail(email string) (*model.User, error) {
	var user model.User
	err := model.DB.Where("email = ?", email).First(&user).Error
	if err != nil {
		return nil, errors.New("未找到绑定此邮箱的用户")
	}
	if user.Status != common.UserStatusDisabled {
		return nil, errors.New("该用户未被封禁")
	}
	return &user, nil
}

// 脱敏用户名：前2后1，中间***
func maskUsername(username string) string {
	runes := []rune(username)
	length := len(runes)
	if length <= 2 {
		return string(runes[:1]) + "***"
	}
	return string(runes[:2]) + "***" + string(runes[length-1:])
}

// 脱敏邮箱：te***@gm***.com
func maskEmail(email string) string {
	if email == "" {
		return ""
	}
	parts := strings.Split(email, "@")
	if len(parts) != 2 {
		return "***@***.***"
	}
	
	// 处理用户名部分
	userPart := parts[0]
	userRunes := []rune(userPart)
	var maskedUser string
	if len(userRunes) <= 2 {
		maskedUser = string(userRunes[:1]) + "***"
	} else {
		maskedUser = string(userRunes[:2]) + "***"
	}
	
	// 处理域名部分
	domainParts := strings.Split(parts[1], ".")
	if len(domainParts) >= 2 {
		domain := domainParts[0]
		domainRunes := []rune(domain)
		var maskedDomain string
		if len(domainRunes) <= 2 {
			maskedDomain = string(domainRunes[:1]) + "***"
		} else {
			maskedDomain = string(domainRunes[:2]) + "***"
		}
		return maskedUser + "@" + maskedDomain + "." + strings.Join(domainParts[1:], ".")
	}
	
	return maskedUser + "@" + parts[1]
}

// 获取注册方式列表
func getAuthMethods(user model.User) []string {
	methods := []string{}
	
	if user.GitHubId != "" {
		methods = append(methods, "github")
	}
	if user.DiscordId != "" {
		methods = append(methods, "discord")
	}
	if user.LinuxDOId != "" {
		methods = append(methods, "linuxdo")
	}
	if user.WeChatId != "" {
		methods = append(methods, "wechat")
	}
	if user.TelegramId != "" {
		methods = append(methods, "telegram")
	}
	if user.OidcId != "" {
		methods = append(methods, "oidc")
	}
	
	// 如果没有第三方绑定，说明是用户名注册
	if len(methods) == 0 {
		methods = append(methods, "password")
	}
	
	return methods
}

// GetBlacklist 获取封禁用户列表（公开接口）
func GetBlacklist(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	// 返回的脱敏信息结构
	type BannedUserInfo struct {
		Id          int      `json:"id"`
		Username    string   `json:"username"`      // 脱敏用户名
		DisplayName string   `json:"display_name"`  // 脱敏显示名
		Email       string   `json:"email"`         // 脱敏邮箱
		AuthMethods []string `json:"auth_methods"`  // 注册/绑定方式
		HasEmail    bool     `json:"has_email"`     // 是否有邮箱
		Remark      string   `json:"remark"`
		BannedAt    int64    `json:"banned_at"`     // 封禁时间戳
		BanDuration int64    `json:"ban_duration"`  // 封禁时长（秒），0=永久
		BannedUntil int64    `json:"banned_until"` // 解封时间戳，0=永久
		BanType     string   `json:"ban_type"`      // "permanent" 或 "temporary"
	}

	var users []model.User
	var total int64

	query := model.DB.Model(&model.User{}).Where("status = ?", common.UserStatusDisabled)
	query.Count(&total)
	query.Select("id, username, display_name, email, github_id, discord_id, linux_do_id, wechat_id, telegram_id, oidc_id, remark, banned_at, ban_duration").
		Order("id desc").
		Offset((page - 1) * pageSize).
		Limit(pageSize).
		Find(&users)

	// 转换为脱敏信息
	bannedUsers := make([]BannedUserInfo, len(users))
	for i, u := range users {
		banType := "permanent"
		var bannedUntil int64
		if u.BanDuration > 0 && u.BannedAt > 0 {
			banType = "temporary"
			bannedUntil = u.BannedAt + u.BanDuration
		}
		bannedUsers[i] = BannedUserInfo{
			Id:          u.Id,
			Username:    maskUsername(u.Username),
			DisplayName: maskUsername(u.DisplayName),
			Email:       maskEmail(u.Email),
			AuthMethods: getAuthMethods(u),
			HasEmail:    u.Email != "",
			Remark:      u.Remark,
			BannedAt:    u.BannedAt,
			BanDuration: u.BanDuration,
			BannedUntil: bannedUntil,
			BanType:     banType,
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"list":      bannedUsers,
			"total":     total,
			"page":      page,
			"page_size": pageSize,
		},
	})
}

// GetUnbanVerifyMethod 获取用户解封验证方式
func GetUnbanVerifyMethod(c *gin.Context) {
	username := c.Query("username")
	if username == "" {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "请输入用户名",
		})
		return
	}

	// 查找被封禁用户
	user, err := findBannedUser(username)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	// 判断验证方式
	// 优先级：有邮箱 -> 邮箱验证；无邮箱但有第三方 -> 第三方登录验证
	var verifyMethod string
	authMethods := getAuthMethods(*user) // 总是获取所有认证方式

	if user.Email != "" {
		// 有邮箱的用户，使用邮箱验证
		verifyMethod = "email"
	} else if len(authMethods) > 0 && authMethods[0] != "password" {
		// 没有邮箱但有第三方绑定，使用第三方验证
		verifyMethod = "oauth"
	} else {
		// 既无邮箱也无第三方（纯密码注册），需联系管理员
		verifyMethod = "contact_admin"
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"verify_method": verifyMethod,
			"auth_methods":  authMethods, // 总是返回认证方式列表（用于前端展示图标）
			"masked_email":  maskEmail(user.Email),
			"has_email":     user.Email != "",
		},
	})
}

// SendUnbanVerifyCode 发送解封验证码
func SendUnbanVerifyCode(c *gin.Context) {
	var req struct {
		Username string `json:"username" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "请输入用户名",
		})
		return
	}

	// 查找被封禁用户
	user, err := findBannedUser(req.Username)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	// 检查是否有邮箱
	if user.Email == "" {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "该用户未绑定邮箱，请使用第三方登录验证",
		})
		return
	}

	// 生成验证码并发送
	code := common.GenerateVerificationCode(6)
	common.RegisterVerificationCodeWithKey(user.Email, code, common.UnbanPurpose)

	// 发送邮件
	subject := fmt.Sprintf("%s 解封验证码", common.SystemName)
	content := fmt.Sprintf(`
		<p>您好 %s，</p>
		<p>您正在申请解封账户，验证码为：<strong style="font-size: 24px; color: #1890ff;">%s</strong></p>
		<p>验证码有效期为 %d 分钟，请尽快使用。</p>
		<p>如果这不是您本人的操作，请忽略此邮件。</p>
	`, user.DisplayName, code, common.VerificationValidMinutes)

	err = common.SendEmail(subject, user.Email, content)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "发送验证码失败，请稍后重试",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "验证码已发送到您的邮箱",
	})
}

// SendUnbanEmailCode 通过邮箱发送解封验证码（不需要知道用户名）
func SendUnbanEmailCode(c *gin.Context) {
	var req struct {
		Email string `json:"email" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "请输入邮箱",
		})
		return
	}

	// 通过邮箱查找被封禁用户
	user, err := findBannedUserByEmail(req.Email)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	// 生成验证码并发送
	code := common.GenerateVerificationCode(6)
	common.RegisterVerificationCodeWithKey(user.Email, code, common.UnbanPurpose)

	// 发送邮件
	subject := fmt.Sprintf("%s 解封验证码", common.SystemName)
	content := fmt.Sprintf(`
		<p>您好 %s，</p>
		<p>您正在申请解封账户，验证码为：<strong style="font-size: 24px; color: #1890ff;">%s</strong></p>
		<p>验证码有效期为 %d 分钟，请尽快使用。</p>
		<p>如果这不是您本人的操作，请忽略此邮件。</p>
	`, user.DisplayName, code, common.VerificationValidMinutes)

	err = common.SendEmail(subject, user.Email, content)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "发送验证码失败，请稍后重试",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "验证码已发送到您的邮箱",
	})
}

// VerifyEmailForUnban 验证邮箱并返回用户信息
func VerifyEmailForUnban(c *gin.Context) {
	var req struct {
		Email            string `json:"email" binding:"required"`
		VerificationCode string `json:"verification_code" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "请输入邮箱和验证码",
		})
		return
	}

	// 通过邮箱查找被封禁用户
	user, err := findBannedUserByEmail(req.Email)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	// 验证验证码
	if !common.VerifyCodeWithKey(req.Email, req.VerificationCode, common.UnbanPurpose) {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "验证码错误或已过期",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "验证成功",
		"data": gin.H{
			"username":     user.Username,
			"display_name": user.DisplayName,
		},
	})
}

// VerifyUsernameForUnban 验证用户名并返回用户信息
func VerifyUsernameForUnban(c *gin.Context) {
	var req struct {
		Username string `json:"username" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "请输入用户名",
		})
		return
	}

	// 查找被封禁用户
	user, err := findBannedUser(req.Username)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	// 安全检查：如果用户绑定了任何第三方账号，则不允许通过用户名验证
	// 这是为了防止攻击者猜测用户名后恶意解封别人的账号
	hasBinding := user.GitHubId != "" || 
		user.LinuxDOId != "" || 
		user.DiscordId != "" || 
		user.Email != "" ||
		user.WeChatId != ""

	if hasBinding {
		// 构建提示信息，告诉用户可以使用哪些验证方式
		var availableMethods []string
		if user.Email != "" {
			availableMethods = append(availableMethods, "邮箱验证")
		}
		if user.GitHubId != "" {
			availableMethods = append(availableMethods, "GitHub验证")
		}
		if user.LinuxDOId != "" {
			availableMethods = append(availableMethods, "LinuxDO验证")
		}
		if user.DiscordId != "" {
			availableMethods = append(availableMethods, "Discord验证")
		}
		if user.WeChatId != "" {
			availableMethods = append(availableMethods, "微信验证")
		}

		methodsStr := ""
		if len(availableMethods) > 0 {
			methodsStr = "可用的验证方式：" + strings.Join(availableMethods, "、")
		}

		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "该账号已绑定第三方账号，为确保安全，请使用对应的验证方式进行身份验证。" + methodsStr,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "用户验证成功",
		"data": gin.H{
			"username":     user.Username,
			"display_name": user.DisplayName,
		},
	})
}

// UnbanWithCode 使用解封码解封用户（需要验证身份）
func UnbanWithCode(c *gin.Context) {
	var req struct {
		Username         string `json:"username" binding:"required"`
		UnbanCode        string `json:"unban_code" binding:"required"`
		VerifyMethod     string `json:"verify_method" binding:"required"` // email, oauth
		VerificationCode string `json:"verification_code"`                // 邮箱验证码
		OAuthToken       string `json:"oauth_token"`                      // OAuth 验证 token
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "请填写完整信息",
		})
		return
	}

	// 查找被封禁用户
	user, err := findBannedUser(req.Username)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	// 验证身份
	switch req.VerifyMethod {
	case "email":
		if user.Email == "" {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": "该用户未绑定邮箱",
			})
			return
		}
		// 验证邮箱验证码
		if !common.VerifyCodeWithKey(user.Email, req.VerificationCode, common.UnbanPurpose) {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": "邮箱验证码错误或已过期",
			})
			return
		}

	case "oauth":
		// OAuth 验证已经在前端通过登录流程完成
		// 这里验证 token 是否有效
		if req.OAuthToken == "" {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": "请先完成第三方登录验证",
			})
			return
		}
		// 验证 token（存储在 Redis 或内存中）
		if !common.VerifyOAuthUnbanToken(req.Username, req.OAuthToken) {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": "验证已过期，请重新登录验证",
			})
			return
		}

	case "username":
		// 用户名验证方式：适用于没有绑定任何验证方式的用户
		// 这种情况下只验证用户名匹配即可（已经在前面验证过）
		// 这是最后的手段，安全性较低

	default:
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "无效的验证方式",
		})
		return
	}

	// 验证并使用解封码
	clientIP := c.ClientIP()
	_, err = model.ValidateAndUseCode(req.UnbanCode, model.InvitationCodeTypeUnban, user.Id, user.Username, clientIP)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "解封码无效：" + err.Error(),
		})
		return
	}

	// 解封用户（同时清除封禁时间信息）
	err = model.DB.Model(&user).Updates(map[string]interface{}{
		"status":       common.UserStatusEnabled,
		"banned_at":    0,
		"ban_duration": 0,
	}).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "解封失败，请稍后重试",
		})
		return
	}
	// 刷新 Redis 缓存，确保中间件立即放行
	model.InvalidateUserCache(user.Id)

	// 记录日志
	model.RecordLog(user.Id, model.LogTypeManage, fmt.Sprintf("用户使用解封码自助解封（验证方式：%s）", req.VerifyMethod))

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "解封成功",
	})
}

// OAuthUnbanVerify OAuth 解封验证回调
// 支持两种模式：
// 1. 提供 oauth_id：直接验证 oauth_id 是否匹配用户绑定的第三方账号
// 2. 提供 code：调用第三方接口获取用户信息并验证
func OAuthUnbanVerify(c *gin.Context) {
	var req struct {
		Username  string `json:"username" binding:"required"`
		OAuthType string `json:"oauth_type" binding:"required"`
		OAuthId   string `json:"oauth_id"` // 直接提供 oauth_id
		Code      string `json:"code"`     // OAuth 授权码
		State     string `json:"state"`    // OAuth state
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "参数错误",
		})
		return
	}

	// 查找被封禁用户
	user, err := findBannedUser(req.Username)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	var oauthId string

	// 如果提供了 code，需要先获取 oauth_id
	if req.Code != "" {
		// 验证 state
		if req.State == "" || !strings.HasPrefix(req.State, "unban_") {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": "无效的验证状态",
			})
			return
		}

		// 根据 OAuth 类型获取用户 ID
		var getOAuthIdErr error
		switch req.OAuthType {
		case "github":
			oauthId, getOAuthIdErr = getGitHubIdByCode(req.Code)
		case "linuxdo":
			oauthId, getOAuthIdErr = getLinuxDOIdByCode(req.Code, c)
		case "discord":
		oauthId, getOAuthIdErr = getDiscordIdByCode(req.Code)
		default:
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": "暂不支持该验证方式",
			})
			return
		}

		if getOAuthIdErr != nil {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": "获取第三方账号信息失败：" + getOAuthIdErr.Error(),
			})
			return
		}
	} else if req.OAuthId != "" {
		// 直接使用提供的 oauth_id
		oauthId = req.OAuthId
	} else {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "请提供 code 或 oauth_id",
		})
		return
	}

	// 验证 OAuth ID 是否匹配
	var matched bool
	switch req.OAuthType {
	case "github":
		matched = user.GitHubId == oauthId
	case "discord":
		matched = user.DiscordId == oauthId
	case "linuxdo":
		matched = user.LinuxDOId == oauthId
	case "wechat":
		matched = user.WeChatId == oauthId
	case "telegram":
		matched = user.TelegramId == oauthId
	case "oidc":
		matched = user.OidcId == oauthId
	}

	if !matched {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "第三方账号与用户不匹配",
		})
		return
	}

	// 生成验证 token
	token := common.GenerateOAuthUnbanToken(req.Username)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"token": token,
		},
	})
}

// getGitHubIdByCode 通过 OAuth code 获取 GitHub 用户 ID
func getGitHubIdByCode(code string) (string, error) {
	githubUser, err := getGitHubUserInfoByCode(code)
	if err != nil {
		return "", err
	}
	return githubUser.Login, nil
}

// getLinuxDOIdByCode 通过 OAuth code 获取 LinuxDO 用户 ID
func getLinuxDOIdByCode(code string, c *gin.Context) (string, error) {
	linuxdoUser, err := getLinuxdoUserInfoByCode(code, c)
	if err != nil {
		return "", err
	}
	return strconv.Itoa(linuxdoUser.Id), nil
}

// getDiscordIdByCode 通过 OAuth code 获取 Discord 用户 ID
func getDiscordIdByCode(code string) (string, error) {
	discordUser, err := getDiscordUserInfoByCode(code)
	if err != nil {
		return "", err
	}
	return discordUser.UID, nil
}

// OAuthUnbanVerifyByCode 通过 OAuth code 直接查找被封禁用户并验证
// 这个 API 不需要事先知道用户名，直接通过第三方 ID 查找
func OAuthUnbanVerifyByCode(c *gin.Context) {
	var req struct {
		OAuthType string `json:"oauth_type" binding:"required"`
		Code      string `json:"code" binding:"required"`
		State     string `json:"state"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "参数错误",
		})
		return
	}

	var oauthId string
	var err error

	// 根据 OAuth 类型获取用户 ID
	switch req.OAuthType {
	case "github":
		oauthId, err = getGitHubIdByCode(req.Code)
	case "linuxdo":
		oauthId, err = getLinuxDOIdByCode(req.Code, c)
	case "discord":
		oauthId, err = getDiscordIdByCode(req.Code)
	case "wechat":
		// 微信使用验证码方式
		oauthId = req.Code
	default:
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "暂不支持该验证方式",
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "获取第三方账号信息失败：" + err.Error(),
		})
		return
	}

	// 根据 OAuth ID 查找被封禁用户
	var user model.User

	switch req.OAuthType {
	case "github":
		err = model.DB.Where("github_id = ? AND status = ?", oauthId, common.UserStatusDisabled).First(&user).Error
	case "discord":
		err = model.DB.Where("discord_id = ? AND status = ?", oauthId, common.UserStatusDisabled).First(&user).Error
	case "linuxdo":
		err = model.DB.Where("linux_do_id = ? AND status = ?", oauthId, common.UserStatusDisabled).First(&user).Error
	case "wechat":
		// 微信验证码验证
		wechatId, wechatErr := getWeChatIdByCode(oauthId)
		if wechatErr != nil || wechatId == "" {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": "微信验证码无效或已过期",
			})
			return
		}
		err = model.DB.Where("wechat_id = ? AND status = ?", wechatId, common.UserStatusDisabled).First(&user).Error
		oauthId = wechatId
	}

	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "未找到使用此第三方账号的被封禁用户",
		})
		return
	}

	// 生成验证 token
	token := common.GenerateOAuthUnbanToken(user.Username)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"token":        token,
			"username":     user.Username,
			"display_name": user.DisplayName,
		},
	})
}
