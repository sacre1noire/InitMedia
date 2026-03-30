package middleware

import (
	"context"
	"net/http"
	"strings"

	"backend/internal/domain/user"
	"backend/internal/platform/jwt"

	"github.com/gin-gonic/gin"
)

const (
	AuthorizationHeader = "Authorization"
	BearerPrefix        = "Bearer "
	UserIDCtxKey        = "user_id"
	UserRoleCtxKey      = "user_role"
)

type AuthMiddleware struct {
	tokenGenerator *jwt.TokenGenerator
}

func NewAuthMiddleware(tokenGenerator *jwt.TokenGenerator) *AuthMiddleware {
	return &AuthMiddleware{
		tokenGenerator: tokenGenerator,
	}
}

// RequireAuth is a middleware that validates JWT token
func (m *AuthMiddleware) RequireAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader(AuthorizationHeader)
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authorization header is required"})
			return
		}

		if !strings.HasPrefix(authHeader, BearerPrefix) {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization formatting, must be Bearer token"})
			return
		}

		tokenString := strings.TrimPrefix(authHeader, BearerPrefix)

		claims, err := m.tokenGenerator.ParseToken(tokenString)
		if err != nil {
			status := http.StatusUnauthorized
			if err == jwt.ErrExpiredToken {
				c.AbortWithStatusJSON(status, gin.H{"error": "Token has expired"})
				return
			}
			c.AbortWithStatusJSON(status, gin.H{"error": "Invalid token", "details": err.Error()})
			return
		}

		// Set Context values
		c.Set(UserIDCtxKey, claims.UserID)
		c.Set(UserRoleCtxKey, claims.Role)

		c.Next()
	}
}

// RequireRole is a middleware that checks if user has one of the required roles
func RequireRole(allowedRoles ...user.Role) gin.HandlerFunc {
	return func(c *gin.Context) {
		roleVal, exists := c.Get(UserRoleCtxKey)
		if !exists {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "User role not found in context"})
			return
		}

		userRole, ok := roleVal.(user.Role)
		if !ok {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Invalid role type in context"})
			return
		}

		isAllowed := false
		for _, role := range allowedRoles {
			if userRole == role {
				isAllowed = true
				break
			}
		}

		if !isAllowed {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "You do not have permission to access this resource"})
			return
		}

		c.Next()
	}
}

// GetUserID Helper function to extract user ID from context
func GetUserID(c *gin.Context) (int64, error) {
	idVal, exists := c.Get(UserIDCtxKey)
	if !exists {
		return 0, context.DeadlineExceeded // just mapped error
	}
	id, ok := idVal.(int64)
	if !ok {
		return 0, context.DeadlineExceeded
	}
	return id, nil
}
