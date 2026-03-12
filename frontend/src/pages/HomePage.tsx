import React from 'react';
import { Layout } from '@/components/Layout';
import { Video, Star, Clock, MapPin, Users, Target } from 'lucide-react';

const mockVacancies = [
  {
    id: 1,
    title: 'Junior SMM Специалист',
    company: 'Media Pulse',
    type: 'Вакансия',
    salary: 'от 40 000 ₽',
    location: 'Москва (офис)',
    skills: ['Content Plan', 'Instagram', 'Copywriting'],
    icon: <Users className="w-6 h-6 text-primary-600" />
  },
  {
    id: 2,
    title: 'Стажер Видеомонтажер',
    company: 'Creative Studio',
    type: 'Стажировка',
    salary: 'Не оплачивается',
    location: 'Удаленно',
    skills: ['Premiere Pro', 'After Effects', 'Color Check'],
    icon: <Video className="w-6 h-6 text-red-600" />
  },
  {
    id: 3,
    title: 'Ассистент Продюсера',
    company: 'TV Channel One',
    type: 'Вакансия',
    salary: 'от 60 000 ₽',
    location: 'Санкт-Петербург',
    skills: ['Organization', 'Excel', 'Communication'],
    icon: <Target className="w-6 h-6 text-green-600" />
  }
];

const HomePage: React.FC = () => {
  return (
    <Layout>
      <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl text-left">
            Найди свою карьеру в медиа
          </h1>
          <p className="mt-4 text-lg text-gray-600 text-left">
            Платформа для студентов и выпускников. Вакансии, стажировки и карьерный рост в лучших медиа-компаниях.
          </p>
          <div className="mt-6 flex space-x-4">
            <button className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition">
              Найти стажировку
            </button>
            <button className="bg-white text-primary-600 border border-primary-200 px-6 py-3 rounded-lg font-medium hover:bg-primary-50 transition">
              Разместить резюме
            </button>
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-left">Свежие вакансии</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockVacancies.map((job) => (
          <div key={job.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition duration-200 p-6 border border-gray-100 flex flex-col">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                {/* Render the pre-defined icon directly */}
                {job.icon}
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${job.type === 'Стажировка' ? 'bg-green-100 text-green-800' : 'bg-primary-100 text-primary-800'
                }`}>
                {job.type}
              </span>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-1 text-left">{job.title}</h3>
            <p className="text-sm text-gray-500 font-medium mb-4 text-left">{job.company}</p>

            <div className="space-y-2 mb-6 flex-1">
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                {job.location}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="w-4 h-4 mr-2 text-gray-400" />
                Полная занятость
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {job.skills.map(skill => (
                <span key={skill} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                  {skill}
                </span>
              ))}
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <span className="font-bold text-gray-900">{job.salary}</span>
              <button className="text-sm font-medium text-primary-600 hover:text-primary-700">
                Подробнее &rarr;
              </button>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
};

export default HomePage;
