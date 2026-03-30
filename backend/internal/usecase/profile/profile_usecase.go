package profile

import (
	"context"
	"errors"
	"strings"

	profileDomain "backend/internal/domain/profile"
	"backend/internal/domain/user"
	"backend/internal/transport/http/dto"
)

var (
	ErrProfileForbidden          = errors.New("profile is available only for applicants")
	ErrInvalidEducationLevel     = errors.New("invalid education level")
	ErrInvalidStudyCourse        = errors.New("invalid study course")
	ErrInvalidSpecialization     = errors.New("invalid specialization")
	ErrInvalidSkillLevel         = errors.New("invalid skill level")
	ErrInvalidEmploymentType     = errors.New("invalid employment type")
	ErrInvalidSchedulePreference = errors.New("invalid schedule preference")
)

type ProfileUseCase struct {
	profileRepo profileDomain.Repository
	userRepo    user.Repository
}

func NewProfileUseCase(profileRepo profileDomain.Repository, userRepo user.Repository) *ProfileUseCase {
	return &ProfileUseCase{profileRepo: profileRepo, userRepo: userRepo}
}

func (u *ProfileUseCase) GetMyProfile(ctx context.Context, userID int64) (*profileDomain.ApplicantProfile, error) {
	usr, err := u.userRepo.FindByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if usr == nil || usr.Role != user.RoleApplicant {
		return nil, ErrProfileForbidden
	}

	profile, err := u.profileRepo.GetByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if profile == nil {
		return &profileDomain.ApplicantProfile{
			UserID: userID,
			Email:  usr.Email,
		}, nil
	}
	profile.Email = usr.Email
	return profile, nil
}

func (u *ProfileUseCase) UpdateMyProfile(ctx context.Context, userID int64, req dto.UpdateApplicantProfileRequest) (*profileDomain.ApplicantProfile, error) {
	usr, err := u.userRepo.FindByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if usr == nil || usr.Role != user.RoleApplicant {
		return nil, ErrProfileForbidden
	}

	existingProfile, err := u.profileRepo.GetByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if existingProfile == nil {
		existingProfile = &profileDomain.ApplicantProfile{
			UserID:              userID,
			EmploymentTypes:     []string{},
			SchedulePreferences: []string{},
		}
	}

	if req.Specialization != nil {
		normalized := strings.ToUpper(strings.TrimSpace(*req.Specialization))
		if normalized == "" {
			req.Specialization = nil
		} else {
			if _, ok := validSpecializations[normalized]; !ok {
				return nil, ErrInvalidSpecialization
			}
			req.Specialization = &normalized
		}
	}

	if req.EducationLevel != nil {
		normalized := strings.ToUpper(strings.TrimSpace(*req.EducationLevel))
		if normalized == "" {
			req.EducationLevel = nil
		} else {
			if _, ok := validEducationLevels[normalized]; !ok {
				return nil, ErrInvalidEducationLevel
			}
			req.EducationLevel = &normalized
		}
	}

	if req.StudyCourse != nil {
		if *req.StudyCourse < 1 || *req.StudyCourse > 5 {
			return nil, ErrInvalidStudyCourse
		}
	}

	if req.SkillLevel != nil {
		normalized := strings.ToUpper(strings.TrimSpace(*req.SkillLevel))
		if normalized == "" {
			req.SkillLevel = nil
		} else {
			if _, ok := validSkillLevels[normalized]; !ok {
				return nil, ErrInvalidSkillLevel
			}
			req.SkillLevel = &normalized
		}
	}

	employmentTypes := existingProfile.EmploymentTypes
	if req.EmploymentTypes != nil {
		normalizedEmploymentTypes := make([]string, 0, len(req.EmploymentTypes))
		for _, value := range req.EmploymentTypes {
			normalized := strings.ToUpper(strings.TrimSpace(value))
			if _, ok := validEmploymentTypes[normalized]; !ok {
				return nil, ErrInvalidEmploymentType
			}
			normalizedEmploymentTypes = append(normalizedEmploymentTypes, normalized)
		}
		employmentTypes = normalizedEmploymentTypes
	}

	schedulePreferences := existingProfile.SchedulePreferences
	if req.SchedulePreferences != nil {
		normalizedSchedule := make([]string, 0, len(req.SchedulePreferences))
		for _, value := range req.SchedulePreferences {
			normalized := strings.TrimSpace(value)
			if _, ok := validSchedulePreferences[normalized]; !ok {
				return nil, ErrInvalidSchedulePreference
			}
			normalizedSchedule = append(normalizedSchedule, normalized)
		}
		schedulePreferences = normalizedSchedule
	}

	profile := &profileDomain.ApplicantProfile{
		UserID:              userID,
		FirstName:           coalesceStringPtr(req.FirstName, existingProfile.FirstName),
		LastName:            coalesceStringPtr(req.LastName, existingProfile.LastName),
		Phone:               coalesceStringPtr(req.Phone, existingProfile.Phone),
		AvatarURL:           coalesceStringPtr(req.AvatarURL, existingProfile.AvatarURL),
		EducationLevel:      coalesceStringPtr(req.EducationLevel, existingProfile.EducationLevel),
		StudyCourse:         coalesceInt32Ptr(req.StudyCourse, existingProfile.StudyCourse),
		University:          coalesceStringPtr(req.University, existingProfile.University),
		Experience:          coalesceStringPtr(req.Experience, existingProfile.Experience),
		Projects:            coalesceStringPtr(req.Projects, existingProfile.Projects),
		Achievements:        coalesceStringPtr(req.Achievements, existingProfile.Achievements),
		Skills:              coalesceStringPtr(req.Skills, existingProfile.Skills),
		City:                coalesceStringPtr(req.City, existingProfile.City),
		Specialization:      coalesceStringPtr(req.Specialization, existingProfile.Specialization),
		SkillLevel:          coalesceStringPtr(req.SkillLevel, existingProfile.SkillLevel),
		EmploymentTypes:     employmentTypes,
		SchedulePreferences: schedulePreferences,
		Bio:                 coalesceStringPtr(req.Bio, existingProfile.Bio),
		Telegram:            coalesceStringPtr(req.Telegram, existingProfile.Telegram),
		PortfolioURL:        coalesceStringPtr(req.PortfolioURL, existingProfile.PortfolioURL),
	}

	updatedProfile, err := u.profileRepo.UpsertByUserID(ctx, profile)
	if err != nil {
		return nil, err
	}
	updatedProfile.Email = usr.Email
	return updatedProfile, nil
}

func coalesceStringPtr(newValue *string, fallback *string) *string {
	if newValue != nil {
		return newValue
	}
	return fallback
}

func coalesceInt32Ptr(newValue *int32, fallback *int32) *int32 {
	if newValue != nil {
		return newValue
	}
	return fallback
}

var validEducationLevels = map[string]struct{}{
	"BACHELOR":   {},
	"MASTER":     {},
	"PHD":        {},
	"SPECIALIST": {},
}

var validSpecializations = map[string]struct{}{
	"WEB_ANALYST":            {},
	"DIGITAL_ANALYST":        {},
	"DATA_SCIENTIST_ADS":     {},
	"ML_ENGINEER":            {},
	"FRONTEND_DEVELOPER":     {},
	"BACKEND_DEVELOPER":      {},
	"MOBILE_DEVELOPER":       {},
	"SEO_SPECIALIST":         {},
	"CRM_MARKETOLOGIST":      {},
	"TRAFFIC_MANAGER":        {},
	"TARGETOLOGIST":          {},
	"UX_UI_DESIGNER":         {},
	"PRODUCT_MANAGER_ADTECH": {},
	"COPYWRITER":             {},
	"CREATIVE_EDITOR":        {},
	"ART_DIRECTOR":           {},
	"SMM_MANAGER":            {},
	"PR_MANAGER":             {},
	"INFLUENCER_MARKETER":    {},
	"BRAND_MANAGER":          {},
	"MEDIA_PLANNER":          {},
	"MEDIA_BUYER":            {},
	"AD_SHOOT_PRODUCER":      {},
	"VIDEO_EDITOR":           {},
	"MOTION_DESIGNER":        {},
	"ACCOUNT_MANAGER":        {},
}

var validSkillLevels = map[string]struct{}{
	"NOVICE": {},
	"MIDDLE": {},
	"EXPERT": {},
}

var validEmploymentTypes = map[string]struct{}{
	"OFFICE": {},
	"HYBRID": {},
	"REMOTE": {},
}

var validSchedulePreferences = map[string]struct{}{
	"2/2": {},
	"5/2": {},
	"3/3": {},
}
