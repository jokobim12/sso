package config

import (
	"bufio"
	"os"
	"strings"
)

type Config struct {
	Port       string
	JWTSecret  string
	DBDriver   string
	DBHost     string
	DBPort     string
	DBUsername string
	DBPassword string
	DBName     string
}

var AppConfig Config

func LoadConfig() {
	// Nilai default
	AppConfig = Config{
		Port:       "3000",
		JWTSecret:  "default_secret",
		DBDriver:   "mysql",
		DBHost:     "localhost",
		DBPort:     "3306",
		DBUsername: "root",
		DBPassword: "",
		DBName:     "sso_db",
	}

	// Baca file .env jika ada
	file, err := os.Open(".env")
	if err == nil {
		defer file.Close()
		scanner := bufio.NewScanner(file)
		for scanner.Scan() {
			line := strings.TrimSpace(scanner.Text())
			if line == "" || strings.HasPrefix(line, "#") {
				continue
			}
			parts := strings.SplitN(line, "=", 2)
			if len(parts) == 2 {
				key := strings.TrimSpace(parts[0])
				val := strings.TrimSpace(parts[1])
				os.Setenv(key, val)
			}
		}
	}

	// Override dari environment variables
	if val := os.Getenv("PORT"); val != "" {
		AppConfig.Port = val
	}
	if val := os.Getenv("JWT_SECRET"); val != "" {
		AppConfig.JWTSecret = val
	}
	if val := os.Getenv("DB_DRIVER"); val != "" {
		AppConfig.DBDriver = val
	}
	if val := os.Getenv("DB_HOST"); val != "" {
		AppConfig.DBHost = val
	}
	if val := os.Getenv("DB_PORT"); val != "" {
		AppConfig.DBPort = val
	}
	if val := os.Getenv("DB_USERNAME"); val != "" {
		AppConfig.DBUsername = val
	}
	if val := os.Getenv("DB_PASSWORD"); val != "" {
		AppConfig.DBPassword = val
	}
	if val := os.Getenv("DB_NAME"); val != "" {
		AppConfig.DBName = val
	}
}
