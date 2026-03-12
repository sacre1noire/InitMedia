import React from 'react';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { User, Mail, Shield, Activity, Calendar } from 'lucide-react';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <Layout>
        <div className="text-center py-10">Загрузка профиля...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Мой профиль</h1>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-primary-600 to-indigo-600 px-6 py-8 text-white">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
                <User className="w-12 h-12 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{user.email.split('@')[0]}</h2>
                <p className="opacity-90">{user.role === 'student' ? 'Студент / Соискатель' : 'Работодатель'}</p>
              </div>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start space-x-3 text-gray-700">
                <Mail className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-base">{user.email}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 text-gray-700">
                <Shield className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Роль</p>
                  <p className="text-base capitalize">{user.role}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 text-gray-700">
                <Activity className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Статус</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.is_active ? 'Активен' : 'Неактивен'}
                  </span>
                </div>
              </div>

              <div className="flex items-start space-x-3 text-gray-700">
                <Calendar className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Дата регистрации</p>
                  <p className="text-base text-gray-500 italic">Данные недоступны</p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Настройки аккаунта</h3>
              <div className="space-y-3">
                <button className="text-primary-600 hover:text-primary-700 font-medium text-sm">
                  Изменить пароль
                </button>
                <br />
                <button className="text-primary-600 hover:text-primary-700 font-medium text-sm">
                  Редактировать личные данные
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;