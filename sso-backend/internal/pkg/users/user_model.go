package users

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Name      string         `gorm:"size:255;not null" json:"name"`
	Email     string         `gorm:"size:255;uniqueIndex;not null" json:"email"`
	WhatsApp  string         `gorm:"size:255;uniqueIndex;not null" json:"whatsapp"`
	Password  string         `gorm:"size:255;not null" json:"-"`
	Role      string         `gorm:"size:50;default:'personal'" json:"role"`
	Status    bool           `gorm:"default:true" json:"status"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

type OAuthClient struct {
	ID           uint           `gorm:"primaryKey"`
	ClientID     string         `gorm:"size:100;uniqueIndex;not null"`
	ClientSecret string         `gorm:"size:255;not null"`
	RedirectURI  string         `gorm:"size:255;not null"`
	Name         string         `gorm:"size:255;not null"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}

type OAuthCode struct {
	ID        uint      `gorm:"primaryKey"`
	Code      string    `gorm:"size:100;uniqueIndex;not null"`
	ClientID  string    `gorm:"size:100;not null"`
	UserID    uint      `gorm:"not null"`
	ExpiresAt time.Time `gorm:"not null"`
	IsUsed    bool      `gorm:"default:false"`
	CreatedAt time.Time
}
