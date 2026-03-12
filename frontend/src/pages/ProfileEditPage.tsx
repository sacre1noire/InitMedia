import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { getProfile, updateProfile } from "@/services/profileService";
import {
  Profile,
  ProfileUpdateData,
  Specialization,
  SkillLevel,
  EmploymentType,
  SchedulePreference,
} from "@/types/profile";
import { Loader2 } from "lucide-react";

const ProfileEditPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
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
        setValue("specialization", profile.specialization);
        setValue("skill_level", profile.skill_level);
        setValue("employment_types", profile.employment_types || []);
        setValue("schedule_preferences", profile.schedule_preferences || []);
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
      navigate("/profile");
    } catch (error) {
      console.error("Failed to update profile", error);
      alert("Ошибка при сохранении профиля");
    } finally {
      setSaving(false);
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
                    {s}
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
                    {l}
                  </option>
                ))}
              </select>
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
                        <span className="text-sm text-gray-700">{type}</span>
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
                        <span className="text-sm text-gray-700">{pref}</span>
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
