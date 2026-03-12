import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import {
  User,
  Mail,
  Shield,
  Briefcase,
  MapPin,
  Phone,
  GraduationCap,
  Globe,
} from "lucide-react";
import { getProfile } from "@/services/profileService";
import { getCandidate } from "@/services/employerService";
import { Profile } from "@/types/profile";

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { id } = useParams(); // Get user ID from URL if present
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const isOwnProfile = !id;

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        let data;
        if (id) {
          // Viewing another user's profile (candidate)
          data = await getCandidate(parseInt(id));
        } else {
          // Viewing own profile
          data = await getProfile();
        }
        setProfile(data);
      } catch (error) {
        console.error("Failed to load profile", error);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [id]);

  if (!user) {
    return (
      <Layout>
        <div className="text-center py-10">Загрузка...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">
            {isOwnProfile ? "Мой профиль" : "Профиль кандидата"}
          </h1>
          {isOwnProfile && user.role === "applicant" && (
            <Link
              to="/profile/edit"
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
            >
              Редактировать
            </Link>
          )}
        </div>

        {/* User Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-primary-600 to-indigo-600 px-6 py-8 text-white">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
                <User className="w-12 h-12 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {profile?.first_name
                    ? `${profile.first_name} ${profile.last_name || ""}`
                    : (profile?.email || user.email).split("@")[0]}
                </h2>
                {/* Assume applicant role if viewing candidate, or use own role */}
                <p className="opacity-90 capitalize">
                  {!isOwnProfile ? "candidate" : user.role}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start space-x-3 text-gray-700">
                <Mail className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-base">{profile?.email || user.email}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 text-gray-700">
                <Shield className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Роль</p>
                  <p className="text-base capitalize">
                    {!isOwnProfile ? "Applicant" : user.role}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Applicant Profile Details */}
        {(user.role === "applicant" || !isOwnProfile) && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
            {loading ? (
              <div className="text-center">Загрузка данных профиля...</div>
            ) : profile ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {profile.specialization && (
                    <div className="flex items-start space-x-3 text-gray-700">
                      <Briefcase className="w-5 h-5 text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Специализация
                        </p>
                        <p className="text-base">{profile.specialization}</p>
                      </div>
                    </div>
                  )}

                  {profile.skill_level && (
                    <div className="flex items-start space-x-3 text-gray-700">
                      <GraduationCap className="w-5 h-5 text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Уровень
                        </p>
                        <p className="text-base">{profile.skill_level}</p>
                      </div>
                    </div>
                  )}

                  {profile.phone && (
                    <div className="flex items-start space-x-3 text-gray-700">
                      <Phone className="w-5 h-5 text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Телефон
                        </p>
                        <p className="text-base">{profile.phone}</p>
                      </div>
                    </div>
                  )}

                  {profile.city && (
                    <div className="flex items-start space-x-3 text-gray-700">
                      <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Город
                        </p>
                        <p className="text-base">{profile.city}</p>
                      </div>
                    </div>
                  )}

                  {profile.portfolio_url && (
                    <div className="flex items-start space-x-3 text-gray-700">
                      <Globe className="w-5 h-5 text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Портфолио
                        </p>
                        <a
                          href={profile.portfolio_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:underline"
                        >
                          {profile.portfolio_url}
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {profile.employment_types &&
                  profile.employment_types.length > 0 && (
                    <div className="pt-4 border-t border-gray-100">
                      <h4 className="font-medium text-gray-900 mb-2">
                        Интересует:
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {profile.employment_types.map((t: string) => (
                          <span
                            key={t}
                            className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                {profile.bio && (
                  <div className="pt-4 border-t border-gray-100">
                    <h4 className="font-medium text-gray-900 mb-2">О себе</h4>
                    <p className="text-gray-600 whitespace-pre-wrap">
                      {profile.bio}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">
                  {isOwnProfile && user.role === "applicant"
                    ? "Профиль еще не заполнен"
                    : "Профиль не найден или скрыт"}
                </p>
                {isOwnProfile && user.role === "applicant" && (
                  <Link
                    to="/profile/edit"
                    className="inline-block bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition"
                  >
                    Заполнить профиль
                  </Link>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ProfilePage;
