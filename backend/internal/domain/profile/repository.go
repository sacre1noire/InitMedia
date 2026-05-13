package profile

import "context"

// Repository defines applicant profile persistence operations.
type Repository interface {
	GetByUserID(ctx context.Context, userID int64) (*ApplicantProfile, error)
	UpsertByUserID(ctx context.Context, p *ApplicantProfile) (*ApplicantProfile, error)
	SearchCandidates(ctx context.Context, query string, limit int32, offset int32) ([]*CandidateSummary, error)
}
