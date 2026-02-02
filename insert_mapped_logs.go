package main

import (
	"database/sql"
	"fmt"
	"time"

	_ "github.com/mattn/go-sqlite3"
)

func main() {
	db, err := sql.Open("sqlite3", "one-api.db")
	if err != nil {
		panic(err)
	}
	defer db.Close()

	now := time.Now().Unix()

	// 模型重定向日志数据
	mappedLogs := []struct {
		model    string
		upstream string
		quota    int
	}{
		{"gemini-3-pro-preview", "anthropic/claude-sonnet-4.5", 50000},
		{"gpt-4o", "openai/gpt-4o-2024-08-06", 80000},
		{"claude-3-opus", "vertex-ai/claude-3-opus@20240229", 120000},
		{"deepseek-v3", "deepseek/deepseek-chat-v3", 30000},
		{"qwen-max", "alibaba/qwen-max-latest", 40000},
		{"moonshot-v1-128k", "openai/gpt-4-turbo", 60000},
		{"glm-4", "zhipu/glm-4-plus", 35000},
	}

	fmt.Println("插入模型重定向日志...")

	for i, log := range mappedLogs {
		other := fmt.Sprintf(`{"is_model_mapped":true,"upstream_model_name":"%s"}`, log.upstream)
		createdAt := now - int64(i*300+100)

		_, err := db.Exec(`
			INSERT INTO logs (user_id, created_at, type, content, username, token_name, model_name, quota, prompt_tokens, completion_tokens, use_time, is_stream, channel_id, channel_name, token_id, ip, other)
			VALUES (?, ?, 2, '', 'testuser1', 'sk-mytoken', ?, ?, ?, ?, ?, 0, ?, ?, 1, ?, ?)
		`, 3, createdAt, log.model, log.quota, 1000+i*100, 2000+i*200, 1500+i*100, i+1, fmt.Sprintf("渠道%d", i+1), fmt.Sprintf("192.168.1.%d", i+1), other)

		if err != nil {
			fmt.Printf("插入失败: %v\n", err)
		} else {
			fmt.Printf("插入: %s -> %s\n", log.model, log.upstream)
		}
	}

	// 也插入一些没有模型重定向的普通日志
	fmt.Println("\n插入普通日志...")
	normalModels := []string{"gpt-4o-mini", "claude-3-haiku", "gemini-1.5-flash"}
	for i, model := range normalModels {
		createdAt := now - int64(i*300+50)
		_, err := db.Exec(`
			INSERT INTO logs (user_id, created_at, type, content, username, token_name, model_name, quota, prompt_tokens, completion_tokens, use_time, is_stream, channel_id, channel_name, token_id, ip, other)
			VALUES (?, ?, 2, '', 'testuser1', 'sk-mytoken', ?, ?, ?, ?, ?, 0, ?, ?, 1, ?, '{}')
		`, 3, createdAt, model, 20000+i*5000, 500+i*50, 1000+i*100, 800+i*100, i+1, fmt.Sprintf("渠道%d", i+1), fmt.Sprintf("192.168.2.%d", i+1))
		if err != nil {
			fmt.Printf("插入失败: %v\n", err)
		} else {
			fmt.Printf("插入普通日志: %s\n", model)
		}
	}

	fmt.Println("\n完成！")
	
	// 验证
	var count int
	db.QueryRow("SELECT COUNT(*) FROM logs WHERE other LIKE '%upstream_model_name%'").Scan(&count)
	fmt.Printf("含模型重定向的日志数: %d\n", count)
}
