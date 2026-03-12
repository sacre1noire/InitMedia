import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { getCourse, startCourse } from "@/services/courseService";
import { Course } from "@/types/course";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

const CourseDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (id) {
      getCourse(Number(id))
        .then(setCourse)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleStart = async () => {
    if (!id) return;
    setStarting(true);
    try {
      await startCourse(Number(id));
      if (course && course.lessons.length > 0) {
        // Navigate to first lesson
        window.location.href = `/courses/${id}/lessons/${course.lessons[0].id}`;
      }
    } catch (e) {
      console.error(e);
    } finally {
      setStarting(false);
    }
  };

  if (loading)
    return (
      <Layout>
        <div className="flex justify-center p-12">
          <Loader2 className="animate-spin" />
        </div>
      </Layout>
    );
  if (!course)
    return (
      <Layout>
        <div className="text-center p-12">Курс не найден</div>
      </Layout>
    );

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="relative h-64 bg-gray-900">
            {course.cover_url && (
              <img
                src={course.cover_url}
                alt={course.title}
                className="w-full h-full object-cover opacity-60"
              />
            )}
            <div className="absolute inset-0 flex flex-col justify-end p-8 text-white">
              <span className="bg-primary-600 w-fit px-3 py-1 rounded-full text-sm font-medium mb-3">
                {course.specializations?.[0] || "Media"}
              </span>
              <h1 className="text-4xl font-bold mb-2">{course.title}</h1>
              <div className="flex items-center text-gray-200 text-sm">
                <span className="mr-4">
                  {Math.floor(course.duration_minutes / 60)}ч{" "}
                  {course.duration_minutes % 60}м
                </span>
                <span>{course.lessons.length} уроков</span>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="prose max-w-none text-gray-600 mb-8">
              {course.description}
            </div>

            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Программа курса
              </h3>
              <div className="space-y-3">
                {course.lessons.map((lesson, index) => (
                  <div
                    key={lesson.id}
                    className="flex items-center bg-white p-4 rounded-lg border border-gray-200"
                  >
                    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-gray-500 font-medium mr-4">
                      {index + 1}
                    </div>
                    <div className="flex-1 font-medium text-gray-800">
                      {lesson.title}
                    </div>
                    <div className="text-gray-400 text-sm">15 мин</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              {user ? (
                <button
                  onClick={handleStart}
                  disabled={starting}
                  className="bg-primary-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-primary-700 transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50"
                >
                  {starting ? "Загрузка..." : "Начать обучение"}
                </button>
              ) : (
                <Link
                  to="/login"
                  className="text-primary-600 font-medium hover:underline"
                >
                  Войдите, чтобы начать обучение
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CourseDetailsPage;
