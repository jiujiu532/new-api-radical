package main

import (
	"database/sql"
	"fmt"
	"math/rand"
	"time"

	_ "github.com/mattn/go-sqlite3"
)

func main() {
	db, err := sql.Open("sqlite3", "one-api.db")
	if err != nil {
		panic(err)
	}
	defer db.Close()

	rand.Seed(time.Now().UnixNano())

	// 模型列表
	models := []string{
		"gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "claude-3-opus",
		"claude-3-sonnet", "claude-3-haiku", "gemini-pro", "gemini-1.5-pro",
		"deepseek-chat", "qwen-turbo", "moonshot-v1-8k", "glm-4",
	}

	// IP地址池 - 每个用户分配 1-5 个 IP
	generateUserIPs := func(count int) []string {
		ips := make([]string, count)
		for i := 0; i < count; i++ {
			ips[i] = fmt.Sprintf("%d.%d.%d.%d", rand.Intn(255), rand.Intn(255), rand.Intn(255), rand.Intn(255))
		}
		return ips
	}

	fmt.Println("开始创建50个测试用户...")

	// 生成不重复的用户名
	for i := 101; i <= 150; i++ {
		username := fmt.Sprintf("testuser%d", i)
		displayName := fmt.Sprintf("测试用户%d", i)
		email := fmt.Sprintf("testuser%d@example.com", i)
		password := "$2a$10$abcdefghijklmnopqrstuv"
		quota := rand.Int63n(100000000) + 10000000

		_, err := db.Exec(`
			INSERT OR IGNORE INTO users (username, display_name, email, password, role, status, quota, used_quota, request_count, access_token, github_id, wechat_id, telegram_id, linux_do_id, inviter_id)
			VALUES (?, ?, ?, ?, 1, 1, ?, 0, 0, '', '', '', '', '', 0)
		`, username, displayName, email, password, quota)

		if err != nil {
			fmt.Printf("插入用户 %s 失败: %v\n", username, err)
		}
	}

	// 获取所有用户
	rows, err := db.Query("SELECT id, username FROM users")
	if err != nil {
		panic(err)
	}

	type UserInfo struct {
		ID       int
		Username string
		IPs      []string
	}

	var users []UserInfo
	for rows.Next() {
		var id int
		var username string
		rows.Scan(&id, &username)
		// 每个用户分配1-5个IP
		ipCount := rand.Intn(5) + 1
		users = append(users, UserInfo{
			ID:       id,
			Username: username,
			IPs:      generateUserIPs(ipCount),
		})
	}
	rows.Close()

	fmt.Printf("找到 %d 个用户\n", len(users))

	// 插入更多日志
	fmt.Println("开始创建请求日志...")
	now := time.Now().Unix()
	
	for i := 0; i < 1000; i++ {
		user := users[rand.Intn(len(users))]
		model := models[rand.Intn(len(models))]
		ip := user.IPs[rand.Intn(len(user.IPs))] // 使用该用户的IP

		promptTokens := rand.Intn(2000) + 100
		completionTokens := rand.Intn(4000) + 100
		quota := (promptTokens + completionTokens*2) * 50

		createdAt := now - int64(rand.Intn(86400))
		useTime := rand.Intn(5000) + 500

		tokenName := fmt.Sprintf("sk-token%d", rand.Intn(10)+1)
		channelId := rand.Intn(10) + 1
		tokenId := rand.Intn(100) + 1

		_, err := db.Exec(`
			INSERT INTO logs (user_id, created_at, type, content, username, token_name, model_name, quota, prompt_tokens, completion_tokens, use_time, is_stream, channel_id, channel_name, token_id, ip, other)
			VALUES (?, ?, 2, '', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '{}')
		`, user.ID, createdAt, user.Username, tokenName, model, quota, promptTokens, completionTokens, useTime, rand.Intn(2), channelId, fmt.Sprintf("渠道%d", channelId), tokenId, ip)

		if err != nil {
			fmt.Printf("插入日志 %d 失败: %v\n", i, err)
		}

		if (i+1)%200 == 0 {
			fmt.Printf("已插入 %d 条日志\n", i+1)
		}
	}

	fmt.Println("\n模拟数据插入完成！")
	
	// 显示统计
	var logCount int
	db.QueryRow("SELECT COUNT(*) FROM logs").Scan(&logCount)
	var userCount int
	db.QueryRow("SELECT COUNT(*) FROM users").Scan(&userCount)
	
	fmt.Printf("- 当前用户数: %d\n", userCount)
	fmt.Printf("- 当前日志数: %d\n", logCount)
}
