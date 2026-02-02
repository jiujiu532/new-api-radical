package main

import (
	"database/sql"
	"fmt"

	_ "github.com/mattn/go-sqlite3"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	password := "Test123456"
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		panic(err)
	}

	fmt.Printf("密码: %s\n", password)
	fmt.Printf("Hash: %s\n", string(hash))

	db, err := sql.Open("sqlite3", "one-api.db")
	if err != nil {
		panic(err)
	}
	defer db.Close()

	_, err = db.Exec("UPDATE users SET password = ? WHERE username = 'testuser1'", string(hash))
	if err != nil {
		panic(err)
	}

	fmt.Println("密码已更新！")
	fmt.Println("\n测试账号信息：")
	fmt.Println("用户名: testuser1")
	fmt.Println("密码: Test123456")
}
