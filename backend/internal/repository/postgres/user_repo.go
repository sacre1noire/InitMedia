package postgres

import (
	"context"
	"errors"

	"backend/internal/domain/user"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type UserRepo struct {
	db *pgxpool.Pool
}

func NewUserRepo(db *pgxpool.Pool) *UserRepo {
	return &UserRepo{db: db}
}

func (r *UserRepo) Create(ctx context.Context, u *user.User) error {
	query := `
		INSERT INTO users (email, hashed_password, role, is_active, created_at)
		VALUES ($1, $2, $3, $4, NOW())
		RETURNING id, created_at
	`
	err := r.db.QueryRow(ctx, query, u.Email, u.HashedPassword, u.Role, u.IsActive).Scan(&u.ID, &u.CreatedAt)
	return err
}

func (r *UserRepo) FindByEmail(ctx context.Context, email string) (*user.User, error) {
	query := `SELECT id, email, hashed_password, role, is_active, created_at, updated_at FROM users WHERE email = $1`
	
	u := &user.User{}
	err := r.db.QueryRow(ctx, query, email).Scan(
		&u.ID, 
		&u.Email, 
		&u.HashedPassword, 
		&u.Role, 
		&u.IsActive, 
		&u.CreatedAt, 
		&u.UpdatedAt,
	)
	
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil // Пользователь не найден, не считаем за критичную ошибку
		}
		return nil, err
	}
	
	return u, nil
}

func (r *UserRepo) FindByID(ctx context.Context, id int64) (*user.User, error) {
	query := `SELECT id, email, hashed_password, role, is_active, created_at, updated_at FROM users WHERE id = $1`
	
	u := &user.User{}
	err := r.db.QueryRow(ctx, query, id).Scan(
		&u.ID, 
		&u.Email, 
		&u.HashedPassword, 
		&u.Role, 
		&u.IsActive, 
		&u.CreatedAt, 
		&u.UpdatedAt,
	)
	
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil // Пользователь не найден
		}
		return nil, err
	}
	
	return u, nil
}
