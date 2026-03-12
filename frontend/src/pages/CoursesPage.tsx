import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { getCourses, getMyProgress } from "@/services/courseService";
import { Course, CourseProgress } from "@/types/course";
import { CourseCard } from "@/components/CourseCard";
import { useAuth } from "@/contexts/AuthContext";

const CoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [progress, setProgress] = useState<CourseProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [data, progressData] = await Promise.all([
          getCourses(),
          user ? getMyProgress() : Promise.resolve([]),
        ]);
        setCourses(data);
        setProgress(progressData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Мини-курсы и материалы
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              Развивайте свои навыки для успешной карьеры в медиа
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">Загрузка...</div>
        ) : courses.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Пока курсов нет. Заходите позже!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CoursesPage;
