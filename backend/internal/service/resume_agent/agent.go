package resume_agent

import (
	"strings"

	"backend/internal/domain/resume"
)

// HelperResponse contains gaps and recommendations for resume improvement.
type HelperResponse struct {
	MissingSections []string `json:"missing_sections"`
	Recommendations []string `json:"recommendations"`
}

// Evaluate returns simple heuristic recommendations for resume completion.
func Evaluate(content resume.ResumeContent) HelperResponse {
	missing := make([]string, 0)
	recommendations := make([]string, 0)
	if strings.TrimSpace(content.FullName) == "" {
		missing = append(missing, "full_name")
	}
	if strings.TrimSpace(content.Qualification) == "" {
		missing = append(missing, "qualification")
	}
	if strings.TrimSpace(valueOrEmpty(content.Contacts.Email)) == "" &&
		strings.TrimSpace(valueOrEmpty(content.Contacts.Phone)) == "" {
		missing = append(missing, "contacts")
	}
	if len(content.Experience) == 0 {
		missing = append(missing, "experience")
		recommendations = append(recommendations, "Add at least one experience entry with role, company, and key results.")
	}
	if len(content.Education) == 0 {
		missing = append(missing, "education")
		recommendations = append(recommendations, "Add your education history with institution and degree.")
	}
	if len(content.Skills) == 0 {
		missing = append(missing, "skills")
		recommendations = append(recommendations, "List your core skills to improve matching.")
	}
	if strings.TrimSpace(valueOrEmpty(content.Goals)) == "" {
		missing = append(missing, "goals")
		recommendations = append(recommendations, "Add professional goals to clarify your target role.")
	}

	return HelperResponse{MissingSections: missing, Recommendations: recommendations}
}

func valueOrEmpty(v *string) string {
	if v == nil {
		return ""
	}
	return *v
}
