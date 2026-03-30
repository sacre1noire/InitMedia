import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { getLesson, completeLesson, getCourse } from "@/services/courseService";
import { Lesson, Course } from "@/types/course";
import {
  Loader2,
  ArrowLeft,
  CheckCircle,
  PlayCircle,
} from "lucide-react";

const LessonPage: React.FC = () => {
  const { id, lessonId } = useParams<{ id: string; lessonId: string }>();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id || !lessonId) return;
      setLoading(true);
      try {
        const [lessonData, courseData] = await Promise.all([
          getLesson(Number(id), Number(lessonId)),
          getCourse(Number(id)),
        ]);
        setLesson(lessonData);
        setCourse(courseData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, lessonId]);

  const handleComplete = async () => {
    if (!id || !lessonId) return;
    setCompleting(true);
    try {
      await completeLesson(Number(id), Number(lessonId));

      // Find next lesson
      if (course) {
        const currentIndex = course.lessons.findIndex(
          (l) => l.id === Number(lessonId),
        );
        if (currentIndex !== -1 && currentIndex < course.lessons.length - 1) {
          const nextLesson = course.lessons[currentIndex + 1];
          if (confirm("Урок пройден! Перейти к следующему?")) {
            navigate(`/courses/${id}/lessons/${nextLesson.id}`);
          }
        } else {
          alert("Поздравляем! Вы завершили курс.");
          navigate(`/courses/${id}`);
        }
      }
    } catch (error) {
      console.error(error);
      alert("Ошибка при сохранении прогресса");
    } finally {
      setCompleting(false);
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
  if (!lesson || !course)
    return (
      <Layout>
        <div className="text-center p-12">Урок не найден</div>
      </Layout>
    );

  const currentIndex = course.lessons.findIndex(
    (l) => l.id === Number(lessonId),
  );

  return (
    <Layout>
      <div className="flex flex-col md:flex-row h-[calc(100vh-64px)]">
        {/* Sidebar */}
        <div className="w-full md:w-80 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <Link
              to={`/courses/${id}`}
              className="flex items-center text-gray-500 hover:text-primary-600 mb-2"
            >
              <ArrowLeft size={16} className="mr-1" />
              Назад к курсу
            </Link>
            <h2 className="font-bold text-gray-900">{course.title}</h2>
          </div>
          <div>
            {course.lessons.map((l, idx) => (
              <Link
                key={l.id}
                to={`/courses/${id}/lessons/${l.id}`}
                className={`flex items-center p-4 border-b border-gray-100 hover:bg-gray-50 transition ${l.id === Number(lessonId) ? "bg-primary-50 border-l-4 border-l-primary-600" : ""}`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mr-3 ${l.id === Number(lessonId) ? "bg-primary-600 text-white" : "bg-gray-200 text-gray-600"}`}
                >
                  {idx + 1}
                </div>
                <div className="text-sm font-medium text-gray-800 line-clamp-2">
                  {l.title}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-6 md:p-10">
          <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-8 border-b border-gray-100">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                {lesson.title}
              </h1>
            </div>

            <div className="p-8">
              {lesson.video_url && (
                <div className="mb-8 aspect-w-16 aspect-h-9 bg-black rounded-lg overflow-hidden">
                  {/* Placeholder for video player if URL is e.g. youtube */}
                  <div className="flex items-center justify-center h-full text-white">
                    <div className="text-center">
                      <PlayCircle
                        size={48}
                        className="mx-auto mb-2 opacity-50"
                      />
                      <p>Видео: {lesson.video_url}</p>
                      <a
                        href={lesson.video_url}
                        target="_blank"
                        rel="noreferrer"
                        className="underline text-blue-400"
                      >
                        Открыть
                      </a>
                    </div>
                  </div>
                </div>
              )}

              <div className="prose max-w-none text-gray-800 whitespace-pre-wrap">
                {lesson.content}
              </div>
            </div>

            <div className="p-8 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
              <button
                onClick={() => {
                  if (currentIndex > 0) {
                    navigate(
                      `/courses/${id}/lessons/${course.lessons[currentIndex - 1].id}`,
                    );
                  }
                }}
                disabled={currentIndex === 0}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50"
              >
                Предыдущий
              </button>

              <button
                onClick={handleComplete}
                disabled={completing}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium flex items-center"
              >
                <CheckCircle size={18} className="mr-2" />
                {currentIndex === course.lessons.length - 1
                  ? "Завершить курс"
                  : "Далее"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LessonPage;
