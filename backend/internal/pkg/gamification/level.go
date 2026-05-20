package gamification

// Stats describes user XP and level progression.
type Stats struct {
	TotalXP          int32  `json:"total_xp"`
	Level            int32  `json:"level"`
	LevelTitle       string `json:"level_title"`
	XPInCurrentLevel int32  `json:"xp_in_current_level"`
	XPToNextLevel    int32  `json:"xp_to_next_level"`
	ProgressPercent  int32  `json:"progress_percent"`
}

var thresholds = []int32{0, 100, 300, 600, 1000, 2000, 3500}
var titles = []string{
	"Новичок",
	"Ученик",
	"Практик",
	"Профи",
	"Эксперт",
	"Мастер",
	"Легенда",
}

// FromTotalXP calculates level stats from accumulated XP.
func FromTotalXP(totalXP int32) Stats {
	if totalXP < 0 {
		totalXP = 0
	}

	level := int32(1)
	for i := len(thresholds) - 1; i >= 0; i-- {
		if totalXP >= thresholds[i] {
			level = int32(i + 1)
			break
		}
	}

	currentThreshold := thresholds[level-1]
	var nextThreshold int32
	if int(level) < len(thresholds) {
		nextThreshold = thresholds[level]
	} else {
		nextThreshold = currentThreshold + 1500
	}

	xpInLevel := totalXP - currentThreshold
	xpNeeded := nextThreshold - currentThreshold
	progress := int32(100)
	if xpNeeded > 0 && xpInLevel < xpNeeded {
		progress = (xpInLevel * 100) / xpNeeded
	}

	titleIdx := int(level) - 1
	if titleIdx >= len(titles) {
		titleIdx = len(titles) - 1
	}

	return Stats{
		TotalXP:          totalXP,
		Level:            level,
		LevelTitle:       titles[titleIdx],
		XPInCurrentLevel: xpInLevel,
		XPToNextLevel:    xpNeeded - xpInLevel,
		ProgressPercent:  progress,
	}
}
