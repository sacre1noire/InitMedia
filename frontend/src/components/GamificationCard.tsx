import React from "react";
import { motion } from "framer-motion";
import { Trophy, Zap } from "lucide-react";
import { UserGamification } from "@/types/gamification";
import { AnimatedCounter } from "@/components/animations";

interface GamificationCardProps {
  stats: UserGamification;
  showCompleted?: boolean;
}

export const GamificationCard: React.FC<GamificationCardProps> = ({
  stats,
  showCompleted = true,
}) => {
  return (
    <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4 sm:p-6">
      <h3 className="text-base sm:text-lg font-semibold text-amber-900 mb-3 sm:mb-4 flex items-center gap-2">
        <Trophy className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
        Прогресс обучения
      </h3>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
        <div className="min-w-0">
          <p className="text-[0.65rem] sm:text-xs font-medium text-amber-800/70 uppercase tracking-wide">
            Уровень
          </p>
          <p className="text-lg sm:text-2xl font-bold text-amber-900 leading-tight">
            {stats.level}
            <span className="block sm:inline text-sm sm:text-base font-semibold text-amber-700 sm:ml-1">
              · {stats.level_title}
            </span>
          </p>
        </div>
        <div>
          <p className="text-[0.65rem] sm:text-xs font-medium text-amber-800/70 uppercase tracking-wide flex items-center gap-1">
            <Zap className="h-3.5 w-3.5 shrink-0" /> XP
          </p>
          <p className="text-lg sm:text-2xl font-bold text-amber-900">
            <AnimatedCounter value={stats.total_xp} duration={1.2} />
          </p>
        </div>
      </div>
      <div>
        <div className="flex justify-between text-[0.65rem] sm:text-xs text-amber-800/70 mb-1">
          <span>До следующего уровня</span>
          <span>{stats.progress_percent}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-amber-200/60">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600"
            initial={{ width: 0 }}
            animate={{ width: `${stats.progress_percent}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
        <p className="text-[0.65rem] sm:text-xs text-amber-700/80 mt-1">
          Осталось {stats.xp_to_next_level} XP
        </p>
      </div>
      {showCompleted && (
        <p className="text-xs sm:text-sm text-amber-800/80 mt-2 sm:mt-3">
          Завершено курсов:{" "}
          <span className="font-semibold">{stats.completed_courses_count}</span>
        </p>
      )}
    </div>
  );
};