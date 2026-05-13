package dto

import "backend/internal/usecase/matching"

// MatchingResponse describes recommendations response.
type MatchingResponse struct {
	Items []*matching.Recommendation `json:"items"`
}
