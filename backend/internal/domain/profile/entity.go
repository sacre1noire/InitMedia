package profile

// SkillLevel describes applicant proficiency level.
type SkillLevel string

const (
	SkillLevelNovice SkillLevel = "NOVICE"
	SkillLevelMiddle SkillLevel = "MIDDLE"
	SkillLevelExpert SkillLevel = "EXPERT"
)

// EmploymentType describes preferred employment format.
type EmploymentType string

const (
	EmploymentTypeOffice EmploymentType = "OFFICE"
	EmploymentTypeHybrid EmploymentType = "HYBRID"
	EmploymentTypeRemote EmploymentType = "REMOTE"
)

// SchedulePreference describes preferred work schedule.
type SchedulePreference string

const (
	SchedulePreferenceTwoTwo   SchedulePreference = "2/2"
	SchedulePreferenceFiveTwo  SchedulePreference = "5/2"
	SchedulePreferenceThreeTwo SchedulePreference = "3/3"
)

// ApplicantProfile stores structured applicant data.
type ApplicantProfile struct {
	ID                  int64    `json:"id" db:"id"`
	UserID              int64    `json:"user_id" db:"user_id"`
	Email               string   `json:"email,omitempty"`
	FirstName           *string  `json:"first_name,omitempty" db:"first_name"`
	LastName            *string  `json:"last_name,omitempty" db:"last_name"`
	Phone               *string  `json:"phone,omitempty" db:"phone"`
	AvatarURL           *string  `json:"avatar_url,omitempty" db:"avatar_url"`
	EducationLevel      *string  `json:"education_level,omitempty" db:"education_level"`
	StudyCourse         *int32   `json:"study_course,omitempty" db:"study_course"`
	University          *string  `json:"university,omitempty" db:"university"`
	Experience          *string  `json:"experience,omitempty" db:"experience"`
	Projects            *string  `json:"projects,omitempty" db:"projects"`
	Achievements        *string  `json:"achievements,omitempty" db:"achievements"`
	Skills              *string  `json:"skills,omitempty" db:"skills"`
	City                *string  `json:"city,omitempty" db:"city"`
	Specialization      *string  `json:"specialization,omitempty" db:"specialization"`
	SkillLevel          *string  `json:"skill_level,omitempty" db:"skill_level"`
	EmploymentTypes     []string `json:"employment_types,omitempty" db:"employment_types"`
	SchedulePreferences []string `json:"schedule_preferences,omitempty" db:"schedule_preferences"`
	Bio                 *string  `json:"bio,omitempty" db:"bio"`
	Telegram            *string  `json:"telegram,omitempty" db:"telegram"`
	PortfolioURL        *string  `json:"portfolio_url,omitempty" db:"portfolio_url"`
}

// CandidateSummary is a public slice of applicant profile for employer search.
type CandidateSummary struct {
	ID             int64   `json:"id" db:"id"`
	FullName       string  `json:"full_name" db:"full_name"`
	Email          string  `json:"email" db:"email"`
	Specialization *string `json:"specialization,omitempty" db:"specialization"`
	SkillLevel     *string `json:"skill_level,omitempty" db:"skill_level"`
	City           *string `json:"city,omitempty" db:"city"`
}
