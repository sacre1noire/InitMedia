package dto

import "backend/internal/domain/user"

// RegisterRequest содержит данные для регистрации
type RegisterRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
	Role     string `json:"role" binding:"required,oneof=APPLICANT EMPLOYER"`
}

// RegisterResponse содержит данные, которые возвращаются после успешной регистрации
type RegisterResponse struct {
	ID    int64     `json:"id"`
	Email string    `json:"email"`
	Role  user.Role `json:"role"`
}

// LoginRequest содержит данные для входа
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// TokenResponse возвращается при входе или обновлении токена
type TokenResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
}

// RefreshRequest содержит данные для обновления access токена
type RefreshRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}
