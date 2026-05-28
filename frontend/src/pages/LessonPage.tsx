import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { getLesson, completeLesson, getCourse } from "@/services/courseService";
import { Lesson, Course } from "@/types/course";
import { useToast } from "@/components/animations";
import {
  Loader2,
  ArrowLeft,
  CheckCircle,
  PlayCircle,
  ChevronDown,
  ChevronUp,
  List,
} from "lucide-react";

const LessonPage: React.FC = () => {
  const { id, lessonId } = useParams<{ id: string; lessonId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  useEffect(() => {
    setSidebarOpen(false);
  }, [lessonId]);

  const handleComplete = async () => {
    if (!id || !lessonId) return;
    setCompleting(true);
    try {
      await completeLesson(Number(id), Number(lessonId));

      if (course) {
        const currentIndex = course.lessons.findIndex(
          (l) => l.id === Number(lessonId),
        );
        if (currentIndex !== -1 && currentIndex < course.lessons.length - 1) {
          const nextLesson = course.lessons[currentIndex + 1];
          navigate(`/courses/${id}/lessons/${nextLesson.id}`);
        } else {
          navigate(`/courses/${id}/quiz`);
        }
      }
    } catch (error) {
      console.error(error);
      toast("Не удалось сохранить прогресс", "error");
    } finally {
      setCompleting(false);
    }
  };

  if (loading)
    return (
      <Layout fullBleed>
        <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>
      </Layout>
    );
  if (!lesson || !course)
    return (
      <Layout>
        <div className="text-center p-8 sm:p-12 text-base">Урок не найден</div>
      </Layout>
    );

  const currentIndex = course.lessons.findIndex(
    (l) => l.id === Number(lessonId),
  );
  const isLastLesson = currentIndex === course.lessons.length - 1;

  const lessonSidebar = (
    <div className="border-b border-gray-200 md:border-b-0 md:border-r bg-white md:overflow-y-auto md:w-72 lg:w-80 shrink-0">
      <div className="p-3 sm:p-4 border-b border-gray-200">
        <Link
          to={`/courses/${id}`}
          className="inline-flex items-center text-sm text-gray-500 hover:text-primary-600 mb-2"
        >
          <ArrowLeft size={16} className="mr-1 shrink-0" />
          Назад к курсу
        </Link>
        <h2 className="font-bold text-base sm:text-lg text-gray-900 line-clamp-2">
          {course.title}
        </h2>
      </div>
      <nav className="max-h-[40vh] md:max-h-none overflow-y-auto">
        {course.lessons.map((l, idx) => (
          <Link
            key={l.id}
            to={`/courses/${id}/lessons/${l.id}`}
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 sm:px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition text-sm sm:text-base ${
              l.id === Number(lessonId)
                ? "bg-primary-50 border-l-4 border-l-primary-600"
                : ""
            }`}
          >
            <div
              className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-xs font-medium ${
                l.id === Number(lessonId)
                  ? "bg-primary-600 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {idx + 1}
            </div>
            <span className="font-medium text-gray-800 line-clamp-2 min-w-0">
              {l.title}
            </span>
          </Link>
        ))}
      </nav>
    </div>
  );

  return (
    <Layout fullBleed>
      <div className="flex flex-col md:flex-row md:min-h-[calc(100dvh-4rem)]">
        <div className="md:hidden sticky top-16 z-40 bg-white border-b border-gray-200 px-3 py-2">
          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            className="flex w-full items-center justify-between gap-2 rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-800"
            aria-expanded={sidebarOpen}
          >
            <span className="inline-flex items-center gap-2 min-w-0">
              <List className="h-4 w-4 shrink-0" />
              <span className="truncate">
                Урок {currentIndex + 1} из {course.lessons.length}
              </span>
            </span>
            {sidebarOpen ? (
              <ChevronUp className="h-4 w-4 shrink-0" />
            ) : (
              <ChevronDown className="h-4 w-4 shrink-0" />
            )}
          </button>
        </div>

        {sidebarOpen && (
          <div className="md:hidden">{lessonSidebar}</div>
        )}

        <div className="hidden md:block">{lessonSidebar}</div>

        <div className="flex-1 min-w-0 overflow-y-auto bg-gray-50 px-3 py-4 sm:px-5 sm:py-6 md:px-8 md:py-8">
          <article className="course-content-card max-w-3xl mx-auto">
            <header className="px-4 py-4 sm:px-6 sm:py-5 border-b border-gray-100">
              <p className="text-xs sm:text-sm text-primary-600 font-medium mb-1">
                Урок {currentIndex + 1} / {course.lessons.length}
              </p>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-snug">
                {lesson.title}
              </h1>
            </header>

            <div className="px-4 py-4 sm:px-6 sm:py-6">
              {lesson.video_url && (
                <div className="mb-6 rounded-lg overflow-hidden bg-black aspect-video max-h-[50vh]">
                  <div className="text-center text-sm sm:text-base">
                    <PlayCircle
                      size={40}
                      className="mx-auto mb-2 opacity-50"
                    />
                    <p className="mb-2 break-all px-2">
                      Видео: {lesson.video_url}
                    </p>
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
              )}

              <div className="course-prose">{lesson.content}</div>
            </div>

            <footer className="px-4 py-4 sm:px-6 sm:py-5 bg-gray-50 border-t border-gray-100 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between sm:items-center">
              <button
                type="button"
                onClick={() => {
                  if (currentIndex > 0) {
                    navigate(
                      `/courses/${id}/lessons/${course.lessons[currentIndex - 1].id}`,
                    );
                  }
                }}
                disabled={currentIndex === 0}
                className="w-full sm:w-auto px-4 py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50"
              >
                Предыдущий
              </button>

              <button
                type="button"
                onClick={handleComplete}
                disabled={completing}
                className="w-full sm:w-auto px-5 py-2.5 text-sm sm:text-base bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium inline-flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <CheckCircle size={18} className="shrink-0" />
                {isLastLesson ? "К финальному тесту" : "Далее"}
              </button>
            </footer>
          </article>
        </div>
      </div>
    </Layout>
  );
};

export default LessonPage;
