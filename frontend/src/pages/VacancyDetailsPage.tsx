import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { Modal, useToast } from "@/components/animations";
import { getVacancy, applyToVacancy } from "@/services/vacancyService";
import { getEmployerVacancy } from "@/services/employerService";
import { getMyResumes } from "@/services/resumeService";
import { Resume } from "@/types/resume";
import { Vacancy } from "@/types/vacancy";
import { Loader2, ArrowLeft, Send } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/auth";

const VacancyDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [vacancy, setVacancy] = useState<Vacancy | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const { user } = useAuth();
  const toast = useToast();
  const [applied, setApplied] = useState(false);
  const [showApply, setShowApply] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [resumeId, setResumeId] = useState<number | "">("");
  const [resumes, setResumes] = useState<Resume[]>([]);

  useEffect(() => {
    if (id) {
      const load = async () => {
        try {
          if (user?.role === UserRole.EMPLOYER || user?.role === UserRole.ADMIN) {
            try {
              const data = await getEmployerVacancy(Number(id));
              setVacancy(data);
              return;
            } catch {
              // fallback to public vacancy endpoint
            }
          }

          const data = await getVacancy(Number(id));
          setVacancy(data);
        } catch (error) {
          console.error(error);
          setVacancy(null);
        } finally {
          setLoading(false);
        }
      };

      load();
    }
  }, [id, user?.role]);

  useEffect(() => {
    if (showApply && user?.role === UserRole.APPLICANT) {
      getMyResumes()
        .then(setResumes)
        .catch(() => setResumes([]));
    }
  }, [showApply, user?.role]);

  const handleApply = async () => {
    if (!id) return;
    setApplying(true);
    try {
      const body: { cover_letter?: string; resume_id?: number } = {};
      if (coverLetter.trim()) body.cover_letter = coverLetter.trim();
      if (resumeId !== "") body.resume_id = Number(resumeId);
      await applyToVacancy(Number(id), body);
      setApplied(true);
      setShowApply(false);
      toast("Отклик отправлен — удачи!", "success");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      console.error("Failed to apply", error);
      if (err.response?.data?.detail === "Already applied") {
        setApplied(true);
        setShowApply(false);
        toast("Вы уже откликнулись на эту вакансию", "info");
      } else {
        toast("Не удалось отправить отклик", "error");
      }
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center p-10">
          <Loader2 className="animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!vacancy) {
    return (
      <Layout>
        <div className="text-center p-10">Вакансия не найдена</div>
      </Layout>
    );
  }

  const published =
    vacancy.published_at || vacancy.created_at;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-8">
        <Link
          to="/vacancies"
          className="flex items-center text-gray-500 mb-6 hover:text-primary-600"
        >
          <ArrowLeft size={20} className="mr-2" />К списку вакансий
        </Link>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {vacancy.title}
              </h1>
              <p className="text-xl text-gray-600">
                {vacancy.company?.name || "Компания"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-600">
                {vacancy.is_salary_hidden
                  ? "З/П не указана"
                  : `${vacancy.salary_from ?? "—"} - ${vacancy.salary_to ?? "—"} ₽`}
              </p>
              <span className="inline-block bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm mt-2">
                {vacancy.type}
              </span>
            </div>
          </div>

          <div className="prose max-w-none text-gray-800">
            <h3 className="text-lg font-semibold mb-2">Описание</h3>
            <div className="whitespace-pre-wrap mb-6">{vacancy.description}</div>

            {vacancy.duties && (
              <>
                <h3 className="text-lg font-semibold mb-2">Обязанности</h3>
                <div className="whitespace-pre-wrap mb-6">{vacancy.duties}</div>
              </>
            )}

            {vacancy.requirements && (
              <>
                <h3 className="text-lg font-semibold mb-2">Требования</h3>
                <div className="whitespace-pre-wrap mb-6">
                  {vacancy.requirements}
                </div>
              </>
            )}

            <div className="flex flex-wrap gap-4 mt-8 pt-6 border-t border-gray-100">
              <div>
                <span className="text-gray-500 text-sm block">Город</span>
                <span className="font-medium">
                  {vacancy.city || (vacancy.is_remote ? "Удалённо" : "—")}
                </span>
              </div>
              <div>
                <span className="text-gray-500 text-sm block">График</span>
                <span className="font-medium">
                  {vacancy.schedule || "Не указан"}
                </span>
              </div>
              <div>
                <span className="text-gray-500 text-sm block">
                  Опубликовано
                </span>
                <span className="font-medium">
                  {new Date(published).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
            {user ? (
              user.role === UserRole.APPLICANT ? (
                <>
                  <motion.button
                    onClick={() => (applied ? null : setShowApply(true))}
                    disabled={applying || applied}
                    whileHover={!applied && !applying ? { scale: 1.03 } : undefined}
                    whileTap={!applied && !applying ? { scale: 0.97 } : undefined}
                    transition={{ type: "spring", stiffness: 400, damping: 18 }}
                    className={`bg-primary-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-primary-700 shadow-md inline-flex items-center gap-2 ${applying || applied ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <Send className="h-4 w-4" />
                    {applying
                      ? "Отправка..."
                      : applied
                        ? "Вы уже откликнулись"
                        : "Откликнуться"}
                  </motion.button>
                  <Modal
                    open={showApply && !applied}
                    onClose={() => setShowApply(false)}
                    title="Отклик на вакансию"
                    size="md"
                  >
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Сопроводительное письмо
                        </label>
                        <textarea
                          className="input-field mt-1 w-full min-h-[120px]"
                          value={coverLetter}
                          onChange={(e) => setCoverLetter(e.target.value)}
                          placeholder="Кратко расскажите, почему вы подходите..."
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Резюме (если есть в профиле)
                        </label>
                        <select
                          className="input-field mt-1 w-full"
                          value={resumeId}
                          onChange={(e) =>
                            setResumeId(
                              e.target.value === ""
                                ? ""
                                : Number(e.target.value),
                            )
                          }
                        >
                          <option value="">Без резюме</option>
                          {resumes.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.title}
                              {r.is_primary ? " (основное)" : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.96 }}
                          className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setShowApply(false)}
                        >
                          Отмена
                        </motion.button>
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.96 }}
                          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 transition-colors disabled:opacity-60 inline-flex items-center gap-2"
                          onClick={handleApply}
                          disabled={applying}
                        >
                          <Send className="h-4 w-4" />
                          {applying ? "Отправка..." : "Отправить отклик"}
                        </motion.button>
                      </div>
                    </div>
                  </Modal>
                </>
              ) : (
                <div className="text-gray-500">
                  Работодатели не могут откликаться на вакансии
                </div>
              )
            ) : (
              <Link
                to="/login"
                className="text-primary-600 font-medium hover:underline"
              >
                Войдите, чтобы откликнуться
              </Link>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default VacancyDetailsPage;
