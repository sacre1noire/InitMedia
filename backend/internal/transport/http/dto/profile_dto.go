package dto

// UpdateApplicantProfileRequest holds editable applicant profile fields.
type UpdateApplicantProfileRequest struct {
	FirstName           *string  `json:"first_name"`
	LastName            *string  `json:"last_name"`
	Phone               *string  `json:"phone"`
	AvatarURL           *string  `json:"avatar_url"`
	EducationLevel      *string  `json:"education_level"`
	StudyCourse         *int32   `json:"study_course"`
	University          *string  `json:"university"`
	Experience          *string  `json:"experience"`
	Projects            *string  `json:"projects"`
	Achievements        *string  `json:"achievements"`
	Skills              *string  `json:"skills"`
	City                *string  `json:"city"`
	Specialization      *string  `json:"specialization"`
	SkillLevel          *string  `json:"skill_level"`
	EmploymentTypes     []string `json:"employment_types"`
	SchedulePreferences []string `json:"schedule_preferences"`
	Bio                 *string  `json:"bio"`
	Telegram            *string  `json:"telegram"`
	PortfolioURL        *string  `json:"portfolio_url"`
}
