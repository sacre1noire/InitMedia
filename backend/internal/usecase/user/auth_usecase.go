package user

import (
	"context"
	"errors"
	"time"

	"backend/internal/domain/user"
	"backend/internal/platform/jwt"
	"backend/internal/transport/http/dto"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrEmailAlreadyExists = errors.New("email already in use")
	ErrInvalidCredentials = errors.New("invalid email or password")
	ErrInvalidSession     = errors.New("invalid or expired session")
)

type AuthUseCase struct {
	userRepo       user.Repository
	sessionRepo    user.SessionRepository
	tokenGenerator *jwt.TokenGenerator
}

func NewAuthUseCase(
	userRepo user.Repository,
	sessionRepo user.SessionRepository,
	tokenGenerator *jwt.TokenGenerator,
) *AuthUseCase {
	return &AuthUseCase{
		userRepo:       userRepo,
		sessionRepo:    sessionRepo,
		tokenGenerator: tokenGenerator,
	}
}

func (u *AuthUseCase) Register(ctx context.Context, req dto.RegisterRequest) (*dto.RegisterResponse, error) {
	// 1. Проверяем, существует ли уже пользователь с таким email
	existingUser, err := u.userRepo.FindByEmail(ctx, req.Email)
	if err != nil {
		return nil, err
	}
	if existingUser != nil {
		return nil, ErrEmailAlreadyExists
	}

	// 2. Хешируем пароль
	hashedBytes, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	// 3. Создаем сущность
	newUser := &user.User{
		Email:          req.Email,
		HashedPassword: string(hashedBytes),
		Role:           user.Role(req.Role),
		IsActive:       true, // По умолчанию аккаунт активен (можно изменить логику потом)
	}

	// 4. Сохраняем в БД
	if err := u.userRepo.Create(ctx, newUser); err != nil {
		return nil, err
	}

	// 5. Возвращаем результат
	return &dto.RegisterResponse{
		ID:    newUser.ID,
		Email: newUser.Email,
		Role:  newUser.Role,
	}, nil
}

func (u *AuthUseCase) Login(ctx context.Context, req dto.LoginRequest) (*dto.TokenResponse, error) {
	// 1. Находим пользователя
	usr, err := u.userRepo.FindByEmail(ctx, req.Email)
	if err != nil {
		return nil, err
	}
	if usr == nil {
		return nil, ErrInvalidCredentials
	}

	// 2. Проверяем пароль
	if err := bcrypt.CompareHashAndPassword([]byte(usr.HashedPassword), []byte(req.Password)); err != nil {
		return nil, ErrInvalidCredentials
	}

	return u.generateTokensAndSession(ctx, usr)
}

func (u *AuthUseCase) RefreshTokens(ctx context.Context, req dto.RefreshRequest) (*dto.TokenResponse, error) {
	// Ищем сессию по refresh токену
	session, err := u.sessionRepo.FindByToken(ctx, req.RefreshToken)
	if err != nil {
		return nil, err
	}
	if session == nil || time.Now().After(session.ExpiresAt) {
		return nil, ErrInvalidSession
	}

	// Находим самого юзера, чтобы получить актуальную роль и статус
	usr, err := u.userRepo.FindByID(ctx, session.UserID)
	if err != nil {
		return nil, err
	}
	if usr == nil || !usr.IsActive {
		return nil, ErrInvalidSession
	}

	// Удаляем старую сессию (ротация)
	_ = u.sessionRepo.DeleteSession(ctx, req.RefreshToken)

	// Генерируем новую пару
	return u.generateTokensAndSession(ctx, usr)
}

func (u *AuthUseCase) Logout(ctx context.Context, refreshToken string) error {
	return u.sessionRepo.DeleteSession(ctx, refreshToken)
}

// Вспомогательный метод для генерации access + refresh и сохранения в БД сессий
func (u *AuthUseCase) generateTokensAndSession(ctx context.Context, usr *user.User) (*dto.TokenResponse, error) {
	// Access Token (JWT)
	accessToken, err := u.tokenGenerator.GenerateAccessToken(usr.ID, usr.Role)
	if err != nil {
		return nil, err
	}

	// Refresh Token (UUID)
	refreshToken := uuid.New().String()

	session := &user.Session{
		UserID:    usr.ID,
		TokenHash: refreshToken,
		// Устанавливаем время жизни сессии (например 30 дней)
		ExpiresAt: time.Now().Add(30 * 24 * time.Hour),
	}

	if err := u.sessionRepo.CreateSession(ctx, session); err != nil {
		return nil, err
	}

	return &dto.TokenResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	}, nil
}
