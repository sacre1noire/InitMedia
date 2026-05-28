import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import {
    deleteResume,
    getMyResumes,
    getResume,
    updateResume,
} from "@/services/resumeService";
import { Resume } from "@/types/resume";
import { Loader2, Plus, Star } from "lucide-react";
import { motion } from "framer-motion";
import { useConfirm, useToast, StaggerList, StaggerItem } from "@/components/animations";

const ResumeListPage: React.FC = () => {
    const [items, setItems] = useState<Resume[]>([]);
    const [loading, setLoading] = useState(true);
    const [savingPrimary, setSavingPrimary] = useState<number | null>(null);
    const navigate = useNavigate();
    const confirm = useConfirm();
    const toast = useToast();

    const load = async () => {
        setLoading(true);
        try {
            const data = await getMyResumes();
            setItems(data);
        } catch (error) {
            console.error("Failed to load resumes", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const handleDelete = async (id: number) => {
        const ok = await confirm({
            title: "Удалить резюме?",
            description: "Это действие нельзя отменить.",
            confirmLabel: "Удалить",
            variant: "danger",
        });
        if (!ok) return;
        try {
            await deleteResume(id);
            setItems((prev) => prev.filter((item) => item.id !== id));
            toast("Резюме удалено", "success");
        } catch (error) {
            console.error("Failed to delete resume", error);
            toast("Не удалось удалить резюме", "error");
        }
    };

    const handleMakePrimary = async (id: number) => {
        setSavingPrimary(id);
        try {
            const resume = await getResume(id);
            if (!resume.content || resume.template_id === undefined) {
                throw new Error("Resume is missing content or template");
            }
            const updated = await updateResume(id, {
                title: resume.title,
                template_id: resume.template_id,
                is_primary: true,
                content: resume.content,
            });
            setItems((prev) =>
                prev.map((item) =>
                    item.id === updated.id
                        ? { ...item, is_primary: true }
                        : { ...item, is_primary: false },
                ),
            );
        } catch (error) {
            console.error("Failed to set primary", error);
        } finally {
            setSavingPrimary(null);
        }
    };

    return (
        <Layout>
            <div className="mx-auto max-w-5xl space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Мои резюме</h1>
                        <p className="text-sm text-gray-600">
                            Создавайте несколько версий и выбирайте основное резюме.
                        </p>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => navigate("/resumes/new")}
                        className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 shadow-sm"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Новое резюме
                    </motion.button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
                    </div>
                ) : items.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
                        Резюме еще не созданы.
                    </div>
                ) : (
                    <StaggerList className="space-y-3">
                        {items.map((item) => (
                            <StaggerItem
                                key={item.id}
                                className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
                            >
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-lg font-semibold text-gray-900">
                                                {item.title}
                                            </h2>
                                            {item.is_primary && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                                                    <Star className="h-3 w-3" />
                                                    Основное
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            Создано: {new Date(item.created_at).toLocaleDateString()}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        <Link
                                            to={`/resumes/${item.id}/preview`}
                                            className="rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                                        >
                                            Просмотр
                                        </Link>
                                        <button
                                            onClick={() => navigate(`/resumes/${item.id}/edit`)}
                                            className="rounded-md border border-primary-300 px-3 py-1.5 text-sm font-medium text-primary-700 hover:bg-primary-50"
                                        >
                                            Редактировать
                                        </button>
                                        {!item.is_primary && (
                                            <button
                                                onClick={() => handleMakePrimary(item.id)}
                                                className="rounded-md bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
                                                disabled={savingPrimary === item.id}
                                            >
                                                Сделать основным
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="rounded-md border border-rose-300 px-3 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-50"
                                        >
                                            Удалить
                                        </button>
                                    </div>
                                </div>
                            </StaggerItem>
                        ))}
                    </StaggerList>
                )}
            </div>
        </Layout>
    );
};

export default ResumeListPage;
