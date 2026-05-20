import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import {
  getCourse,
  getCourseQuiz,
  submitQuiz,
} from "@/services/courseService";
import { Course, QuizQuestion } from "@/types/course";
import { ArrowLeft, CheckCircle, Loader2, XCircle } from "lucide-react";

const CourseQuizPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    total: number;
    passed: boolean;
    xpEarned?: number;
  } | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const [courseData, quizData] = await Promise.all([
          getCourse(Number(id)),
          getCourseQuiz(Number(id)),
        ]);
        setCourse(courseData);
        setQuestions(quizData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleSubmit = async () => {
    if (!id || questions.length === 0) return;
    const orderedAnswers = questions.map((q) => answers[q.id] ?? -1);
    if (orderedAnswers.some((a) => a < 0)) {
      alert("Ответьте на все вопросы");
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitQuiz(Number(id), orderedAnswers);
      setResult({
        score: res.score,
        total: res.total,
        passed: res.passed,
        xpEarned: res.progress?.xp_earned,
      });
    } catch (error) {
      console.error(error);
      alert("Не удалось отправить ответы");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center p-12">
          <Loader2 className="animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!course) {
    return (
      <Layout>
        <div className="text-center p-12">Курс не найден</div>
      </Layout>
    );
  }

  if (questions.length === 0) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto p-10 text-center">
          <p className="text-gray-600 mb-4">Тест для этого курса пока не добавлен.</p>
          <Link to={`/courses/${id}`} className="text-primary-600 hover:underline">
            Вернуться к курсу
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto -mx-1 sm:mx-auto px-1 sm:px-4 py-6 sm:py-10">
        <Link
          to={`/courses/${id}`}
          className="inline-flex items-center text-gray-500 hover:text-primary-600 mb-6"
        >
          <ArrowLeft size={16} className="mr-1" />
          Назад к курсу
        </Link>

        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 leading-snug">
          Финальный тест: {course.title}
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">
          Для завершения курса нужно набрать не менее 70% правильных ответов.
          {course.xp_reward ? ` Награда: +${course.xp_reward} XP.` : ""}
        </p>

        {result ? (
          <div
            className={`rounded-2xl border p-5 sm:p-8 text-center ${
              result.passed
                ? "border-green-200 bg-green-50"
                : "border-rose-200 bg-rose-50"
            }`}
          >
            {result.passed ? (
              <CheckCircle className="h-14 w-14 text-green-600 mx-auto mb-4" />
            ) : (
              <XCircle className="h-14 w-14 text-rose-600 mx-auto mb-4" />
            )}
            <h2 className="text-xl sm:text-2xl font-bold mb-2">
              {result.passed ? "Тест пройден!" : "Попробуйте ещё раз"}
            </h2>
            <p className="text-base sm:text-lg mb-2">
              Результат: {result.score} из {result.total}
            </p>
            {result.passed && result.xpEarned != null && result.xpEarned > 0 && (
              <p className="text-green-700 font-semibold mb-4">
                +{result.xpEarned} XP зачислено на ваш счёт
              </p>
            )}
            <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 justify-center mt-6">
              {!result.passed && (
                <button
                  onClick={() => {
                    setResult(null);
                    setAnswers({});
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 text-sm sm:text-base bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Пройти снова
                </button>
              )}
              <button
                onClick={() => navigate(`/courses/${id}`)}
                className="w-full sm:w-auto px-5 py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                К странице курса
              </button>
              {result.passed && (
                <button
                  onClick={() => navigate("/profile")}
                  className="w-full sm:w-auto px-5 py-2.5 text-sm sm:text-base bg-amber-500 text-white rounded-lg hover:bg-amber-600"
                >
                  Смотреть XP в профиле
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {questions.map((q, idx) => (
              <div
                key={q.id}
                className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm"
              >
                <p className="text-sm sm:text-base font-semibold text-gray-900 mb-3 sm:mb-4 leading-snug">
                  {idx + 1}. {q.question}
                </p>
                <div className="space-y-2">
                  {q.options.map((option, optIdx) => (
                    <label
                      key={optIdx}
                      className={`flex items-start sm:items-center gap-3 p-3 sm:p-3.5 rounded-lg border cursor-pointer transition text-sm sm:text-base ${
                        answers[q.id] === optIdx
                          ? "border-primary-500 bg-primary-50"
                          : "border-gray-200 hover:border-primary-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q-${q.id}`}
                        checked={answers[q.id] === optIdx}
                        onChange={() =>
                          setAnswers((prev) => ({ ...prev, [q.id]: optIdx }))
                        }
                        className="text-primary-600"
                      />
                      <span className="text-gray-800 leading-snug">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-3 text-sm sm:text-base bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 disabled:opacity-50"
            >
              {submitting ? "Проверяем ответы..." : "Отправить ответы"}
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CourseQuizPage;
