package user

import (
	"time"
)

// Role определяет тип пользователя в системе
type Role string

const (
	RoleApplicant Role = "APPLICANT"
	RoleEmployer  Role = "EMPLOYER"
	RoleAdmin     Role = "ADMIN"
)

// User представляет базовую сущность пользователя
type User struct {
	ID             int64     `json:"id" db:"id"`
	Email          string    `json:"email" db:"email"`
	HashedPassword string    `json:"-" db:"hashed_password"` // Скрыто при сериализации
	Role           Role      `json:"role" db:"role"`
	IsActive       bool      `json:"is_active" db:"is_active"`
	CreatedAt      time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt      *time.Time `json:"updated_at" db:"updated_at"`
}
