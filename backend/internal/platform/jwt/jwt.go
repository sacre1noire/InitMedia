package jwt

import (
	"errors"
	"time"

	"backend/internal/domain/user"

	"github.com/golang-jwt/jwt/v5"
)

var (
	ErrInvalidToken = errors.New("invalid token")
	ErrExpiredToken = errors.New("token has expired")
)

type TokenClaims struct {
	UserID int64     `json:"user_id"`
	Role   user.Role `json:"role"`
	jwt.RegisteredClaims
}

type TokenGenerator struct {
	secretKey     []byte
	accessTTLFunc func() time.Duration
}

// NewTokenGenerator создает новый инстанс генератора JWT.
func NewTokenGenerator(secretKey string, accessTTL time.Duration) *TokenGenerator {
	return &TokenGenerator{
		secretKey: []byte(secretKey),
		accessTTLFunc: func() time.Duration { return accessTTL },
	}
}

// GenerateAccessToken создает новый JWT токен для пользователя
func (tg *TokenGenerator) GenerateAccessToken(userID int64, role user.Role) (string, error) {
	now := time.Now()
	ttl := tg.accessTTLFunc()

	claims := TokenClaims{
		UserID: userID,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(now.Add(ttl)),
			IssuedAt:  jwt.NewNumericDate(now),
			NotBefore: jwt.NewNumericDate(now),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(tg.secretKey)
}

// ParseToken валидирует и парсит JWT-токен
func (tg *TokenGenerator) ParseToken(tokenString string) (*TokenClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &TokenClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, ErrInvalidToken
		}
		return tg.secretKey, nil
	})

	if err != nil {
		if errors.Is(err, jwt.ErrTokenExpired) {
			return nil, ErrExpiredToken
		}
		return nil, ErrInvalidToken
	}

	claims, ok := token.Claims.(*TokenClaims)
	if !ok || !token.Valid {
		return nil, ErrInvalidToken
	}

	return claims, nil
}
