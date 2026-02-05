package controller

import (
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
)

type LinuxdoUser struct {
	Id         int    `json:"id"`
	Username   string `json:"username"`
	Name       string `json:"name"`
	Active     bool   `json:"active"`
	TrustLevel int    `json:"trust_level"`
	Silenced   bool   `json:"silenced"`
}

func LinuxDoBind(c *gin.Context) {
	if !common.LinuxDOOAuthEnabled {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "管理员未开启通过 Linux DO 登录以及注册",
		})
		return
	}

	code := c.Query("code")
	linuxdoUser, err := getLinuxdoUserInfoByCode(code, c)
	if err != nil {
		common.ApiError(c, err)
		return
	}

	user := model.User{
		LinuxDOId: strconv.Itoa(linuxdoUser.Id),
	}

	if model.IsLinuxDOIdAlreadyTaken(user.LinuxDOId) {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "该 Linux DO 账户已被绑定",
		})
		return
	}

	session := sessions.Default(c)
	id := session.Get("id")
	user.Id = id.(int)

	err = user.FillUserById()
	if err != nil {
		common.ApiError(c, err)
		return
	}

	user.LinuxDOId = strconv.Itoa(linuxdoUser.Id)
	err = user.Update(false)
	if err != nil {
		common.ApiError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "bind",
	})
}

func getLinuxdoUserInfoByCode(code string, c *gin.Context) (*LinuxdoUser, error) {
	if code == "" {
		return nil, errors.New("invalid code")
	}

	// Get access token using Basic auth
	tokenEndpoint := common.GetEnvOrDefaultString("LINUX_DO_TOKEN_ENDPOINT", "https://connect.linux.do/oauth2/token")
	credentials := common.LinuxDOClientId + ":" + common.LinuxDOClientSecret
	basicAuth := "Basic " + base64.StdEncoding.EncodeToString([]byte(credentials))

	// Get redirect URI from request
	scheme := "http"
	if c.Request.TLS != nil || c.GetHeader("X-Forwarded-Proto") == "https" {
		scheme = "https"
	}
	// 使用前端路由作为回调地址
	redirectURI := fmt.Sprintf("%s://%s/oauth/linuxdo", scheme, c.Request.Host)

	data := url.Values{}
	data.Set("grant_type", "authorization_code")
	data.Set("code", code)
	data.Set("redirect_uri", redirectURI)

	req, err := http.NewRequest("POST", tokenEndpoint, strings.NewReader(data.Encode()))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", basicAuth)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Accept", "application/json")

	client := http.Client{Timeout: 5 * time.Second}
	res, err := client.Do(req)
	if err != nil {
		return nil, errors.New("failed to connect to Linux DO server")
	}
	defer res.Body.Close()

	var tokenRes struct {
		AccessToken string `json:"access_token"`
		Message     string `json:"message"`
	}
	if err := json.NewDecoder(res.Body).Decode(&tokenRes); err != nil {
		return nil, err
	}

	if tokenRes.AccessToken == "" {
		return nil, fmt.Errorf("failed to get access token: %s", tokenRes.Message)
	}

	// Get user info
	userEndpoint := common.GetEnvOrDefaultString("LINUX_DO_USER_ENDPOINT", "https://connect.linux.do/api/user")
	req, err = http.NewRequest("GET", userEndpoint, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+tokenRes.AccessToken)
	req.Header.Set("Accept", "application/json")

	res2, err := client.Do(req)
	if err != nil {
		return nil, errors.New("failed to get user info from Linux DO")
	}
	defer res2.Body.Close()

	var linuxdoUser LinuxdoUser
	if err := json.NewDecoder(res2.Body).Decode(&linuxdoUser); err != nil {
		return nil, err
	}

	if linuxdoUser.Id == 0 {
		return nil, errors.New("invalid user info returned")
	}

	return &linuxdoUser, nil
}

func LinuxdoOAuth(c *gin.Context) {
	session := sessions.Default(c)

	errorCode := c.Query("error")
	if errorCode != "" {
		errorDescription := c.Query("error_description")
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": errorDescription,
		})
		return
	}

	state := c.Query("state")
	sessionState := session.Get("oauth_state")
	
	// 调试日志
	common.SysLog(fmt.Sprintf("LinuxDO OAuth: state=%s, sessionState=%v", state, sessionState))
	
	// LinuxDO 会在 state 后面附加额外内容，所以使用 HasPrefix 比较
	if state == "" || sessionState == nil || !strings.HasPrefix(state, sessionState.(string)) {
		c.JSON(http.StatusForbidden, gin.H{
			"success":       false,
			"message":       "state is empty or not same",
			"debug_state":   state,
			"debug_session": fmt.Sprintf("%v", sessionState),
		})
		return
	}

	username := session.Get("username")
	if username != nil {
		LinuxDoBind(c)
		return
	}

	if !common.LinuxDOOAuthEnabled {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "管理员未开启通过 Linux DO 登录以及注册",
		})
		return
	}

	code := c.Query("code")
	linuxdoUser, err := getLinuxdoUserInfoByCode(code, c)
	if err != nil {
		common.ApiError(c, err)
		return
	}

	user := model.User{
		LinuxDOId: strconv.Itoa(linuxdoUser.Id),
	}

	// Check if user exists
	if model.IsLinuxDOIdAlreadyTaken(user.LinuxDOId) {
		err := user.FillUserByLinuxDOId()
		if err != nil {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": err.Error(),
			})
			return
		}
		if user.Id == 0 {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": "用户已注销",
			})
			return
		}
	} else {
		// 新用户注册
		if !common.RegisterEnabled {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": "管理员关闭了新用户注册",
			})
			return
		}
		
		// 先检查信任等级
		if linuxdoUser.TrustLevel < common.LinuxDOMinimumTrustLevel {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": "Linux DO 信任等级未达到管理员设置的最低信任等级",
			})
			return
		}
		
		// 使用通用 OAuth 注册处理
		displayName := linuxdoUser.Name
		if displayName == "" {
			displayName = "LinuxDO User"
		}
		
		result, err := HandleOAuthNewUser(c, OAuthUserInfo{
			OAuthType:   "linuxdo",
			OAuthId:     strconv.Itoa(linuxdoUser.Id),
			DisplayName: displayName,
		})
		
		if err != nil {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": err.Error(),
			})
			return
		}
		
		if result.NeedInvitationCode {
			c.JSON(http.StatusOK, gin.H{
				"success": true,
				"message": "require_invitation_code",
				"data":    result.RequireInvitationData,
			})
			return
		}
		
		user = *result.User
	}

	if user.Status != common.UserStatusEnabled {
		c.JSON(http.StatusOK, gin.H{
			"message": "用户已被封禁",
			"success": false,
		})
		return
	}

	setupLogin(&user, c)
}
