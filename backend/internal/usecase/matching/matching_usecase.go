package matching

import (
	"context"
	"math"
	"sort"
	"strings"

	"backend/internal/domain/profile"
	"backend/internal/domain/vacancy"
)

const (
	weightSpecialization = 35.0
	weightSkills         = 25.0
	weightLevel          = 15.0
	weightFormat         = 10.0
	weightSchedule       = 10.0
	weightCity           = 5.0
)

type Recommendation struct {
	Vacancy     *vacancy.Vacancy `json:"vacancy"`
	Score       int              `json:"score"`
	Reasons     []string         `json:"reasons"`
	Explanation []string         `json:"explanation"`
}

type UseCase struct {
	vacancyRepo vacancy.VacancyRepository
	profileRepo profile.Repository
}

func NewUseCase(vacancyRepo vacancy.VacancyRepository, profileRepo profile.Repository) *UseCase {
	return &UseCase{vacancyRepo: vacancyRepo, profileRepo: profileRepo}
}

func (u *UseCase) Recommend(ctx context.Context, userID int64, limit int32) ([]*Recommendation, error) {
	prof, err := u.profileRepo.GetByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	if limit <= 0 || limit > 50 {
		limit = 20
	}

	vacancies, _, err := u.vacancyRepo.ListPublic(ctx, vacancy.ListVacancyFilter{
		Limit:  limit,
		Offset: 0,
	})
	if err != nil {
		return nil, err
	}

	recommendations := make([]*Recommendation, 0, len(vacancies))
	for _, v := range vacancies {
		rec := scoreVacancy(v, prof)
		rec.Explanation = buildExplanation(rec, v, prof)
		recommendations = append(recommendations, rec)
	}

	sort.SliceStable(recommendations, func(i, j int) bool {
		return recommendations[i].Score > recommendations[j].Score
	})

	if int32(len(recommendations)) > limit {
		recommendations = recommendations[:limit]
	}

	return recommendations, nil
}

func scoreVacancy(v *vacancy.Vacancy, prof *profile.ApplicantProfile) *Recommendation {
	rec := &Recommendation{Vacancy: v, Reasons: []string{}}
	if prof == nil {
		rec.Score = 0
		rec.Reasons = append(rec.Reasons, "profile_incomplete")
		return rec
	}

	score := 0.0

	if prof.Specialization != nil {
		if strings.EqualFold(strings.TrimSpace(*prof.Specialization), strings.TrimSpace(v.Specialization)) {
			score += weightSpecialization
			rec.Reasons = append(rec.Reasons, "specialization_match")
		}
	}

	if prof.Skills != nil && v.Requirements != nil {
		matchRatio, matched := skillOverlapRatio(*prof.Skills, *v.Requirements)
		if matchRatio > 0 {
			score += weightSkills * matchRatio
			rec.Reasons = append(rec.Reasons, "skills_match")
		}
		if matched > 0 {
			rec.Reasons = append(rec.Reasons, "skills_overlap")
		}
	}

	if prof.SkillLevel != nil {
		level := strings.ToLower(strings.TrimSpace(*prof.SkillLevel))
		if level != "" && (strings.Contains(strings.ToLower(v.Title), level) || (v.Requirements != nil && strings.Contains(strings.ToLower(*v.Requirements), level))) {
			score += weightLevel
			rec.Reasons = append(rec.Reasons, "level_match")
		}
	}

	if prof.EmploymentTypes != nil {
		format := "office"
		if v.IsRemote {
			format = "remote"
		}
		if containsNormalized(prof.EmploymentTypes, format) {
			score += weightFormat
			rec.Reasons = append(rec.Reasons, "format_match")
		}
	}

	if prof.SchedulePreferences != nil && v.Schedule != nil {
		if containsNormalized(prof.SchedulePreferences, *v.Schedule) {
			score += weightSchedule
			rec.Reasons = append(rec.Reasons, "schedule_match")
		}
	}

	if prof.City != nil && v.City != nil {
		if strings.EqualFold(strings.TrimSpace(*prof.City), strings.TrimSpace(*v.City)) {
			score += weightCity
			rec.Reasons = append(rec.Reasons, "city_match")
		}
	}

	rec.Score = int(math.Round(score))
	return rec
}

func buildExplanation(rec *Recommendation, v *vacancy.Vacancy, prof *profile.ApplicantProfile) []string {
	out := make([]string, 0, len(rec.Reasons)+2)
	if prof == nil {
		out = append(out, "Заполните профиль соискателя — тогда подбор станет точнее.")
		return out
	}
	for _, code := range rec.Reasons {
		switch code {
		case "specialization_match":
			out = append(out, "Специализация вакансии совпадает с вашей.")
		case "skills_match", "skills_overlap":
			out = append(out, "Ваши навыки пересекаются с требованиями вакансии.")
		case "level_match":
			out = append(out, "Уровень в профиле совпадает с ожиданиями по вакансии.")
		case "format_match":
			out = append(out, "Формат работы (офис/удалённо) вам подходит.")
		case "schedule_match":
			out = append(out, "График вакансии совпадает с вашими предпочтениями.")
		case "city_match":
			out = append(out, "Город вакансии совпадает с указанным в профиле.")
		case "profile_incomplete":
			out = append(out, "Профиль заполнен не полностью — оценка может быть занижена.")
		}
	}
	if prof.Skills != nil && v.Requirements != nil {
		_, matched := skillOverlapRatio(*prof.Skills, *v.Requirements)
		reqTok := tokenize(*v.Requirements)
		if len(reqTok) > matched && matched > 0 && len(reqTok)-matched <= 2 {
			out = append(out, "Не хватает одного-двух навыков из списка требований — доработайте блок навыков в профиле.")
		}
	}
	return dedupeStrings(out)
}

func dedupeStrings(in []string) []string {
	seen := map[string]struct{}{}
	out := make([]string, 0, len(in))
	for _, s := range in {
		if s == "" {
			continue
		}
		if _, ok := seen[s]; ok {
			continue
		}
		seen[s] = struct{}{}
		out = append(out, s)
	}
	return out
}

func skillOverlapRatio(skills string, requirements string) (float64, int) {
	skillTokens := tokenize(skills)
	requirementTokens := tokenize(requirements)
	if len(requirementTokens) == 0 || len(skillTokens) == 0 {
		return 0, 0
	}
	matched := 0
	for token := range requirementTokens {
		if skillTokens[token] {
			matched++
		}
	}
	return float64(matched) / float64(len(requirementTokens)), matched
}

func tokenize(value string) map[string]bool {
	result := map[string]bool{}
	for _, token := range strings.FieldsFunc(strings.ToLower(value), func(r rune) bool {
		return r == ',' || r == ';' || r == '|' || r == '/' || r == '\\' || r == '\n' || r == '\t'
	}) {
		trimmed := strings.TrimSpace(token)
		if trimmed != "" {
			result[trimmed] = true
		}
	}
	return result
}

func containsNormalized(values []string, target string) bool {
	needle := strings.ToLower(strings.TrimSpace(target))
	for _, value := range values {
		if strings.ToLower(strings.TrimSpace(value)) == needle {
			return true
		}
	}
	return false
}
