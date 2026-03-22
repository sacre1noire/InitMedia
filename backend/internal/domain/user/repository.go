package user

import (
	"context"
	"time"
)

// Repository описывает контракт для работы с хранилищем пользователей
type Repository interface {
	Create(ctx context.Context, u *User) error
	FindByEmail(ctx context.Context, email string) (*User, error)
	FindByID(ctx context.Context, id int64) (*User, error)
}

// Session представляет сущность refresh сессии
type Session struct {
	ID        int64
	UserID    int64
	TokenHash string
	ExpiresAt time.Time
	CreatedAt time.Time
}

// SessionRepository описывает контракт для работы с refresh токенами
type SessionRepository interface {
	CreateSession(ctx context.Context, session *Session) error
	FindByToken(ctx context.Context, tokenHash string) (*Session, error)
	DeleteSession(ctx context.Context, tokenHash string) error
	DeleteUserSessions(ctx context.Context, userID int64) error
}
