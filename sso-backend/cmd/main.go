package main

import (
	"flag"
	"fmt"
	"log"
	"sso-backend/internal/config"
	"sso-backend/internal/database"
	"sso-backend/internal/pkg/auth"
	"sso-backend/internal/pkg/oauth"
	"sso-backend/internal/pkg/users"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	runMigration := flag.Bool("migrate", false, "Run database migration and seed")
	flag.Parse()

	// Load configuration
	config.LoadConfig()

	// Connect to database
	database.ConnectDB()

	// Database auto-migration
	if *runMigration {
		fmt.Println("Running auto-migration...")
		err := database.DB.AutoMigrate(
			&users.User{},
			&users.OAuthClient{},
			&users.OAuthCode{},
		)
		if err != nil {
			log.Fatalf("Migration failed: %v", err)
		}
		fmt.Println("Migration successful!")

		// Seed initial data
		seedData()
		return
	}

	// Set up Fiber application
	app := fiber.New()

	// Enable CORS
	app.Use(cors.New(cors.Config{
		AllowOrigins:     "http://localhost:5173, http://localhost:5174, http://localhost:3000",
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowMethods:     "GET, POST, PUT, DELETE, OPTIONS",
		AllowCredentials: true,
	}))

	// Health check / base endpoint
	app.Get("/", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"app":     "SSO Authentication Server",
			"status":  "running",
			"version": "1.0.0",
		})
	})

	// Auth API endpoints
	api := app.Group("/api")
	api.Post("/auth/register", auth.Register)
	api.Post("/auth/login", auth.Login)
	api.Get("/auth/profile", auth.AuthMiddleware, auth.Profile)

	// OAuth 2.0 endpoints
	app.Get("/oauth/authorize", oauth.Authorize)
	app.Post("/oauth/token", oauth.Token)

	// Start server
	port := config.AppConfig.Port
	fmt.Printf("SSO Server is starting on port %s...\n", port)
	log.Fatal(app.Listen(":" + port))
}

func seedData() {
	fmt.Println("Seeding initial oauth clients and user...")

	// 1. Seed OAuth Clients
	dmiClient := users.OAuthClient{
		ClientID:     "dmi",
		ClientSecret: "dmi-secret-key-9988",
		RedirectURI:  "http://localhost:5173/callback",
		Name:         "DMI Application",
	}

	eventbookClient := users.OAuthClient{
		ClientID:     "eventbook",
		ClientSecret: "eventbook-secret-key-1122",
		RedirectURI:  "http://localhost:5174/callback",
		Name:         "Eventbook Application",
	}

	// Save or update DMI client
	var count int64
	database.DB.Model(&users.OAuthClient{}).Where("client_id = ?", "dmi").Count(&count)
	if count == 0 {
		database.DB.Create(&dmiClient)
		fmt.Println("Created DMI OAuth Client")
	}

	database.DB.Model(&users.OAuthClient{}).Where("client_id = ?", "eventbook").Count(&count)
	if count == 0 {
		database.DB.Create(&eventbookClient)
		fmt.Println("Created Eventbook OAuth Client")
	}

	// 2. Seed default user
	database.DB.Model(&users.User{}).Where("email = ?", "sso-user@example.com").Count(&count)
	if count == 0 {
		hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
		defaultUser := users.User{
			Name:     "User SSO Demo",
			Email:    "sso-user@example.com",
			WhatsApp: "08123456789",
			Password: string(hashedPassword),
			Role:     "personal",
			Status:   true,
		}
		database.DB.Create(&defaultUser)
		fmt.Println("Created default SSO User: sso-user@example.com / password123")
	}

	fmt.Println("Seeding completed successfully!")
}
