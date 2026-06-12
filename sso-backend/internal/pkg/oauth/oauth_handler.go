package oauth

import (
	"crypto/rand"
	"encoding/hex"
	"sso-backend/internal/config"
	"sso-backend/internal/database"
	"sso-backend/internal/pkg/users"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

type TokenRequest struct {
	ClientID     string `json:"client_id" form:"client_id"`
	ClientSecret string `json:"client_secret" form:"client_secret"`
	Code         string `json:"code" form:"code"`
	GrantType    string `json:"grant_type" form:"grant_type"`
}

func generateCode() string {
	b := make([]byte, 20)
	rand.Read(b)
	return hex.EncodeToString(b)
}

func Authorize(c *fiber.Ctx) error {
	clientID := c.Query("client_id")
	redirectURI := c.Query("redirect_uri")
	state := c.Query("state")

	if clientID == "" || redirectURI == "" {
		return c.Status(400).JSON(fiber.Map{"error": "client_id and redirect_uri are required"})
	}

	// Validasi client
	var client users.OAuthClient
	if err := database.DB.Where("client_id = ?", clientID).First(&client).Error; err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid client_id"})
	}

	// Untuk keamanan, redirect_uri harus cocok dengan yang terdaftar
	if client.RedirectURI != redirectURI {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid redirect_uri. Whitelist mismatch."})
	}

	// Cek apakah user sudah login di SSO (via cookie/token)
	tokenString := c.Cookies("sso_token")
	var loggedInUser *users.User

	if tokenString != "" {
		token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
			return []byte(config.AppConfig.JWTSecret), nil
		})
		if err == nil && token.Valid {
			if claims, ok := token.Claims.(jwt.MapClaims); ok {
				var user users.User
				if err := database.DB.First(&user, uint(claims["id"].(float64))).Error; err == nil {
					loggedInUser = &user
				}
			}
		}
	}

	// Jika belum login, redirect ke halaman login SSO Frontend dengan query params OAuth
	if loggedInUser == nil {
		// Menggunakan alamat default frontend SSO di port 5173
		return c.Redirect("http://localhost:5173/login?client_id=" + clientID + "&redirect_uri=" + redirectURI + "&state=" + state)
	}

	// Generate authorization code
	authCode := generateCode()
	oauthCode := users.OAuthCode{
		Code:      authCode,
		ClientID:  clientID,
		UserID:    loggedInUser.ID,
		ExpiresAt: time.Now().Add(5 * time.Minute),
		IsUsed:    false,
	}

	if err := database.DB.Create(&oauthCode).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to generate auth code"})
	}

	// Redirect kembali ke client dengan authorization code
	redirectURL := redirectURI
	if state != "" {
		redirectURL += "?code=" + authCode + "&state=" + state
	} else {
		redirectURL += "?code=" + authCode
	}

	return c.Redirect(redirectURL)
}

func Token(c *fiber.Ctx) error {
	var req TokenRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if req.GrantType != "authorization_code" {
		return c.Status(400).JSON(fiber.Map{"error": "Unsupported grant_type. Only 'authorization_code' is supported."})
	}

	// Verifikasi client
	var client users.OAuthClient
	if err := database.DB.Where("client_id = ?", req.ClientID).First(&client).Error; err != nil {
		return c.Status(401).JSON(fiber.Map{"error": "Invalid client credentials"})
	}

	if client.ClientSecret != req.ClientSecret {
		return c.Status(401).JSON(fiber.Map{"error": "Invalid client credentials"})
	}

	// Verifikasi code
	var code users.OAuthCode
	if err := database.DB.Where("code = ?", req.Code).First(&code).Error; err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid or expired authorization code"})
	}

	if code.ClientID != req.ClientID {
		return c.Status(400).JSON(fiber.Map{"error": "Authorization code client mismatch"})
	}

	if code.IsUsed {
		return c.Status(400).JSON(fiber.Map{"error": "Authorization code has already been used"})
	}

	if time.Now().After(code.ExpiresAt) {
		return c.Status(400).JSON(fiber.Map{"error": "Authorization code expired"})
	}

	// Tandai kode telah digunakan
	code.IsUsed = true
	database.DB.Save(&code)

	// Dapatkan data user
	var user users.User
	if err := database.DB.First(&user, code.UserID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "User not found"})
	}

	// Terbitkan JWT untuk client
	claims := jwt.MapClaims{
		"id":       user.ID,
		"name":     user.Name,
		"email":    user.Email,
		"whatsapp": user.WhatsApp,
		"role":     user.Role,
		"exp":      time.Now().Add(2 * time.Hour).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	accessToken, err := token.SignedString([]byte(config.AppConfig.JWTSecret))
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to sign access token"})
	}

	return c.JSON(fiber.Map{
		"access_token": accessToken,
		"token_type":   "Bearer",
		"expires_in":   7200,
		"user": fiber.Map{
			"id":       user.ID,
			"name":     user.Name,
			"email":    user.Email,
			"whatsapp": user.WhatsApp,
			"role":     user.Role,
		},
	})
}
