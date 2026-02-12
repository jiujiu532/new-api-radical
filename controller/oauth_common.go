/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.
*/

package controller

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
)

// OAuthUserInfo 通用的 OAuth 用户信息
type OAuthUserInfo struct {
	OAuthType   string // "github", "linuxdo", "discord"
	OAuthId     string // 第三方用户 ID
	DisplayName string // 显示名称
	Email       string // 邮箱（可选）
}

// OAuthRegisterResult OAuth 注册结果
type OAuthRegisterResult struct {
	User                  *model.User
	NeedInvitationCode    bool
	RequireInvitationData gin.H
}

// HandleOAuthNewUser 处理 OAuth 新用户注册
// 统一处理 GitHub、LinuxDO、Discord 等 OAuth 新用户注册逻辑
func HandleOAuthNewUser(c *gin.Context, info OAuthUserInfo) (*OAuthRegisterResult, error) {
	session := sessions.Default(c)

	// 1. 检查注册是否开启
	if !common.RegisterEnabled {
		return nil, errors.New("管理员关闭了新用户注册")
	}

	// 2. 检查注册码
	if common.InvitationCodeEnabled {
		// 保存 OAuth 用户信息到 session，等待用户输入注册码
		session.Set("oauth_pending_type", info.OAuthType)
		session.Set("oauth_pending_id", info.OAuthId)
		session.Set("oauth_pending_name", info.DisplayName)
		session.Set("oauth_pending_email", info.Email)
		session.Save()

		return &OAuthRegisterResult{
			NeedInvitationCode: true,
			RequireInvitationData: gin.H{
				"require_invitation_code": true,
				"oauth_type":              info.OAuthType,
				"display_name":            info.DisplayName,
			},
		}, nil
	}

	// 3. 直接注册用户（不需要注册码）
	user, err := createOAuthUser(c, info)
	if err != nil {
		return nil, err
	}

	return &OAuthRegisterResult{
		User:               user,
		NeedInvitationCode: false,
	}, nil
}

// createOAuthUser 创建 OAuth 用户
func createOAuthUser(c *gin.Context, info OAuthUserInfo) (*model.User, error) {
	session := sessions.Default(c)

	user := model.User{
		Username:    info.OAuthType + "_" + strconv.Itoa(model.GetMaxUserId()+1),
		DisplayName: info.DisplayName,
		Email:       info.Email,
		Role:        common.RoleCommonUser,
		Status:      common.UserStatusEnabled,
	}

	// 设置对应的 OAuth ID
	switch info.OAuthType {
	case "github":
		user.GitHubId = info.OAuthId
	case "linuxdo":
		user.LinuxDOId = info.OAuthId
	case "discord":
		user.DiscordId = info.OAuthId
	default:
		return nil, errors.New("不支持的 OAuth 类型")
	}

	// 处理邀请人
	affCode := session.Get("aff")
	inviterId := 0
	if affCodeStr, ok := affCode.(string); ok && affCodeStr != "" {
		inviterId, _ = model.GetUserIdByAffCode(affCodeStr)
	}

	// 插入用户
	if err := user.Insert(inviterId); err != nil {
		return nil, err
	}

	return &user, nil
}

// CompleteOAuthRegistrationWithCode 使用注册码完成 OAuth 注册
// 统一处理所有 OAuth 类型的注册码提交
func CompleteOAuthRegistrationWithCode(c *gin.Context) {
	session := sessions.Default(c)

	// 获取请求参数
	var req struct {
		InvitationCode string `json:"invitation_code"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "无效的参数",
		})
		return
	}

	if req.InvitationCode == "" {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "请输入注册码",
		})
		return
	}

	// 验证注册码
	valid, errMsg := model.CheckCodeExists(req.InvitationCode, model.InvitationCodeTypeRegister)
	if !valid {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "注册码无效：" + errMsg,
		})
		return
	}

	// 获取 session 中保存的 OAuth 用户信息
	oauthType := session.Get("oauth_pending_type")
	oauthId := session.Get("oauth_pending_id")
	name := session.Get("oauth_pending_name")
	email := session.Get("oauth_pending_email")

	if oauthType == nil || oauthId == nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "OAuth 验证已过期，请重新授权",
		})
		return
	}

	// 构建用户信息 - 使用安全的类型断言
	oauthTypeStr, ok := oauthType.(string)
	if !ok {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "OAuth 类型无效，请重新授权",
		})
		return
	}
	oauthIdStr, ok := oauthId.(string)
	if !ok {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "OAuth ID 无效，请重新授权",
		})
		return
	}
	info := OAuthUserInfo{
		OAuthType: oauthTypeStr,
		OAuthId:   oauthIdStr,
	}
	if name != nil {
		if nameStr, ok := name.(string); ok {
			info.DisplayName = nameStr
		}
	}
	if email != nil {
		if emailStr, ok := email.(string); ok {
			info.Email = emailStr
		}
	}

	// 设置默认显示名称 - 使用 OAuthId（真实用户名/ID）而非硬编码
	if info.DisplayName == "" {
		info.DisplayName = info.OAuthId
	}

	// 创建用户
	user, err := createOAuthUser(c, info)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	// 消耗注册码
	clientIP := c.ClientIP()
	_, err = model.ValidateAndUseCode(req.InvitationCode, model.InvitationCodeTypeRegister, user.Id, user.Username, clientIP)
	if err != nil {
		common.SysLog(fmt.Sprintf("消耗注册码失败（用户 %s）: %v", user.Username, err))
	}

	// 清除 session 中的 OAuth 待处理信息
	session.Delete("oauth_pending_type")
	session.Delete("oauth_pending_id")
	session.Delete("oauth_pending_name")
	session.Delete("oauth_pending_email")
	// 兼容旧的 session key
	session.Delete("oauth_pending_github_id")
	session.Delete("oauth_pending_linuxdo_id")
	session.Save()

	// 设置登录
	setupLogin(user, c)
}
