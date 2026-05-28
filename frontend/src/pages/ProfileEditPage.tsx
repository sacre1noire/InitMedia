import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { getProfile, updateProfile, uploadAvatar } from "@/services/profileService";
import {
  ProfileUpdateData,
  Specialization,
  SkillLevel,
  EducationLevel,
  EmploymentType,
  SchedulePreference,
} from "@/types/profile";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/animations";

const specializationLabels: Record<Specialization, string> = {
  [Specialization.WEB_ANALYST]: "Веб-аналитик",
  [Specialization.DIGITAL_ANALYST]: "Digital-аналитик",
  [Specialization.DATA_SCIENTIST_ADS]: "Data Scientist в рекламе",
  [Specialization.ML_ENGINEER]: "ML-инженер",
  [Specialization.FRONTEND_DEVELOPER]: "Frontend-разработчик",
  [Specialization.BACKEND_DEVELOPER]: "Backend-разработчик",
  [Specialization.MOBILE_DEVELOPER]: "Мобильный разработчик",
  [Specialization.SEO_SPECIALIST]: "SEO-специалист",
  [Specialization.CRM_MARKETOLOGIST]: "CRM-маркетолог",
  [Specialization.TRAFFIC_MANAGER]: "Трафик-менеджер",
  [Specialization.TARGETOLOGIST]: "Таргетолог",
  [Specialization.UX_UI_DESIGNER]: "UX/UI-дизайнер",
  [Specialization.PRODUCT_MANAGER_ADTECH]: "Product Manager в AdTech",
  [Specialization.COPYWRITER]: "Копирайтер",
  [Specialization.CREATIVE_EDITOR]: "Креативный редактор",
  [Specialization.ART_DIRECTOR]: "Арт-директор",
  [Specialization.SMM_MANAGER]: "SMM-менеджер",
  [Specialization.PR_MANAGER]: "PR-менеджер",
  [Specialization.INFLUENCER_MARKETER]: "Инфлюенс-маркетолог",
  [Specialization.BRAND_MANAGER]: "Бренд-менеджер",
  [Specialization.MEDIA_PLANNER]: "Медиапланер",
  [Specialization.MEDIA_BUYER]: "Медиабайер",
  [Specialization.AD_SHOOT_PRODUCER]: "Продюсер рекламных съемок",
  [Specialization.VIDEO_EDITOR]: "Видеомонтажер",
  [Specialization.MOTION_DESIGNER]: "Моушн-дизайнер",
  [Specialization.ACCOUNT_MANAGER]: "Account-менеджер",
};

const skillLevelLabels: Record<SkillLevel, string> = {
  [SkillLevel.NOVICE]: "Новичок",
  [SkillLevel.MIDDLE]: "Средний уровень",
  [SkillLevel.EXPERT]: "Эксперт",
};

const educationLabels: Record<EducationLevel, string> = {
  [EducationLevel.BACHELOR]: "Бакалавриат",
  [EducationLevel.MASTER]: "Магистратура",
  [EducationLevel.PHD]: "Аспирантура",
  [EducationLevel.SPECIALIST]: "Специалитет",
};

const employmentTypeLabels: Record<EmploymentType, string> = {
  [EmploymentType.OFFICE]: "В офисе",
  [EmploymentType.HYBRID]: "Гибрид",
  [EmploymentType.REMOTE]: "Удаленно",
};

const scheduleLabels: Record<SchedulePreference, string> = {
  [SchedulePreference.TWO_TWO]: "2/2",
  [SchedulePreference.FIVE_TWO]: "5/2",
  [SchedulePreference.THREE_THREE]: "3/3",
};

const ProfileEditPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(undefined);

  const {
    register,
    handleSubmit,
    control,
    setValue,
  } = useForm<ProfileUpdateData>();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await getProfile();
        // Set form values
        setValue("first_name", profile.first_name || "");
        setValue("last_name", profile.last_name || "");
        setValue("phone", profile.phone || "");
        setValue("bio", profile.bio || "");
        setValue("city", profile.city || "");
        setValue("telegram", profile.telegram || "");
        setValue("portfolio_url", profile.portfolio_url || "");
        setValue("avatar_url", profile.avatar_url || "");
        setValue("education_level", profile.education_level);
        setValue("study_course", profile.study_course);
        setValue("university", profile.university || "");
        setValue("experience", profile.experience || "");
        setValue("projects", profile.projects || "");
        setValue("achievements", profile.achievements || "");
        setValue("skills", profile.skills || "");
        setValue("specialization", profile.specialization);
        setValue("skill_level", profile.skill_level);
        setValue("employment_types", profile.employment_types || []);
        setValue("schedule_preferences", profile.schedule_preferences || []);
        setAvatarPreview(profile.avatar_url);
      } catch (error) {
        console.error("Failed to load profile", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [setValue]);

  const onSubmit = async (data: ProfileUpdateData) => {
    setSaving(true);
    try {
      await updateProfile(data);
      toast("Профиль сохранён", "success");
      navigate("/profile");
    } catch (error) {
      console.error("Failed to update profile", error);
      toast("Не удалось сохранить профиль", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setAvatarUploading(true);
    try {
      const profile = await uploadAvatar(file);
      setAvatarPreview(profile.avatar_url);
      setValue("avatar_url", profile.avatar_url || "");
      toast("Аватар обновлён", "success");
    } catch (error) {
      console.error("Failed to upload avatar", error);
      toast("Не удалось загрузить аватар", "error");
    } finally {
      setAvatarUploading(false);
      event.target.value = "";
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">Редактирование профиля</h1>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6 bg-white p-6 rounded-xl shadow-sm border border-gray-100"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Аватар
            </label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xs text-gray-500">Нет фото</span>
                )}
              </div>
              <div>
                <input
                  id="avatar"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleAvatarUpload}
                  className="block text-sm text-gray-700"
                />
                <p className="text-xs text-gray-500 mt-1">PNG/JPG/WEBP, до 5MB</p>
                {avatarUploading && (
                  <p className="text-xs text-primary-600 mt-1">Загрузка...</p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Имя
              </label>
              <input
                {...register("first_name")}
                className="input-field"
                placeholder="Иван"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Фамилия
              </label>
              <input
                {...register("last_name")}
                className="input-field"
                placeholder="Иванов"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Телефон
            </label>
            <input
              {...register("phone")}
              className="input-field"
              placeholder="+7 (999) 000-00-00"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Специализация
              </label>
              <select {...register("specialization")} className="input-field">
                <option value="">Выберите...</option>
                {Object.values(Specialization).map((s) => (
                  <option key={s} value={s}>
                    {specializationLabels[s]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Образование
              </label>
              <select {...register("education_level")} className="input-field">
                <option value="">Выберите...</option>
                {Object.values(EducationLevel).map((level) => (
                  <option key={level} value={level}>
                    {educationLabels[level]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Уровень
              </label>
              <select {...register("skill_level")} className="input-field">
                <option value="">Выберите...</option>
                {Object.values(SkillLevel).map((l) => (
                  <option key={l} value={l}>
                    {skillLevelLabels[l]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Курс обучения
              </label>
              <select
                {...register("study_course", {
                  setValueAs: (value) => {
                    if (value === "") {
                      return undefined;
                    }
                    const parsed = Number(value);
                    return Number.isNaN(parsed) ? undefined : parsed;
                  },
                })}
                className="input-field"
              >
                <option value="">Не выбрано</option>
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
                <option value={5}>5</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ВУЗ
            </label>
            <input
              {...register("university")}
              className="input-field"
              placeholder="Например: МГУ"
              maxLength={64}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Опыт
              </label>
              <input
                {...register("experience")}
                className="input-field"
                placeholder="Кратко об опыте"
                maxLength={64}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Проекты
              </label>
              <input
                {...register("projects")}
                className="input-field"
                placeholder="Кратко о проектах"
                maxLength={64}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Достижения
              </label>
              <input
                {...register("achievements")}
                className="input-field"
                placeholder="Кратко о достижениях"
                maxLength={64}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Навыки
              </label>
              <input
                {...register("skills")}
                className="input-field"
                placeholder="Например: SQL, Python"
                maxLength={64}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Формат занятости
            </label>
            <div className="space-y-2">
              <Controller
                name="employment_types"
                control={control}
                render={({ field }) => (
                  <div className="flex flex-wrap gap-3">
                    {Object.values(EmploymentType).map((type) => (
                      <label
                        key={type}
                        className="flex items-center space-x-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          value={type}
                          checked={field.value?.includes(type)}
                          onChange={(e) => {
                            const value = e.target.value;
                            const current = field.value || [];
                            const newValue = e.target.checked
                              ? [...current, value]
                              : current.filter((v) => v !== value);
                            field.onChange(newValue);
                          }}
                          className="rounded text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700">
                          {employmentTypeLabels[type]}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              График работы
            </label>
            <div className="space-y-2">
              <Controller
                name="schedule_preferences"
                control={control}
                render={({ field }) => (
                  <div className="flex flex-wrap gap-3">
                    {Object.values(SchedulePreference).map((pref) => (
                      <label
                        key={pref}
                        className="flex items-center space-x-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          value={pref}
                          checked={field.value?.includes(pref)}
                          onChange={(e) => {
                            const value = e.target.value;
                            const current = field.value || [];
                            const newValue = e.target.checked
                              ? [...current, value]
                              : current.filter((v) => v !== value);
                            field.onChange(newValue);
                          }}
                          className="rounded text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700">
                          {scheduleLabels[pref]}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              О себе
            </label>
            <textarea
              {...register("bio")}
              rows={4}
              className="input-field"
              placeholder="Расскажите о своем опыте..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Город
              </label>
              <input {...register("city")} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telegram
              </label>
              <input
                {...register("telegram")}
                className="input-field"
                placeholder="@username"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Портфолио (ссылка)
            </label>
            <input
              {...register("portfolio_url")}
              className="input-field"
              placeholder="https://..."
            />
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={() => navigate("/profile")}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg mr-3 hover:bg-gray-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center"
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default ProfileEditPage;
