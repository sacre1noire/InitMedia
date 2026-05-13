import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import {
    createResume,
    getResume,
    getResumeHelper,
    getResumeTemplates,
    updateResume,
} from "@/services/resumeService";
import {
    ResumeContent,
    ResumeEducation,
    ResumeExperience,
    ResumeRecommendation,
    ResumeTemplate,
} from "@/types/resume";
import { Loader2, Plus, Trash2 } from "lucide-react";

const emptyContent: ResumeContent = {
    full_name: "",
    qualification: "",
    goals: "",
    contacts: {
        email: "",
        phone: "",
        telegram: "",
        portfolio_url: "",
    },
    experience: [],
    education: [],
    recommendations: [],
    skills: [],
};

const ResumeEditPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const isEditMode = !!id;
    const navigate = useNavigate();

    const [templates, setTemplates] = useState<ResumeTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [helper, setHelper] = useState<
        { missing_sections: string[]; recommendations: string[] } | null
    >(null);

    const [title, setTitle] = useState("");
    const [templateId, setTemplateId] = useState<number | "">("");
    const [isPrimary, setIsPrimary] = useState(false);
    const [content, setContent] = useState<ResumeContent>(emptyContent);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const tpl = await getResumeTemplates();
                setTemplates(tpl);

                if (isEditMode && id) {
                    const resume = await getResume(Number(id));
                    setTitle(resume.title || "");
                    setTemplateId(resume.template_id ?? "");
                    setIsPrimary(resume.is_primary);
                    if (resume.content) {
                        setContent({
                            ...emptyContent,
                            ...resume.content,
                            contacts: { ...emptyContent.contacts, ...resume.content.contacts },
                        });
                    }

                    try {
                        const helperResp = await getResumeHelper(Number(id));
                        setHelper(helperResp);
                    } catch {
                        setHelper(null);
                    }
                }
            } catch (e) {
                console.error(e);
                setError("Не удалось загрузить данные резюме");
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [id, isEditMode]);

    const updateContent = (patch: Partial<ResumeContent>) => {
        setContent((prev) => ({ ...prev, ...patch }));
    };

    const updateContacts = (field: keyof ResumeContent["contacts"], value: string) => {
        setContent((prev) => ({
            ...prev,
            contacts: {
                ...prev.contacts,
                [field]: value,
            },
        }));
    };

    const updateExperience = (index: number, patch: Partial<ResumeExperience>) => {
        setContent((prev) => {
            const next = [...prev.experience];
            next[index] = { ...next[index], ...patch };
            return { ...prev, experience: next };
        });
    };

    const updateEducation = (index: number, patch: Partial<ResumeEducation>) => {
        setContent((prev) => {
            const next = [...prev.education];
            next[index] = { ...next[index], ...patch };
            return { ...prev, education: next };
        });
    };

    const updateRecommendation = (
        index: number,
        patch: Partial<ResumeRecommendation>,
    ) => {
        setContent((prev) => {
            const next = [...prev.recommendations];
            next[index] = { ...next[index], ...patch };
            return { ...prev, recommendations: next };
        });
    };

    const skillsText = useMemo(() => content.skills.join(", "), [content.skills]);

    const setSkillsText = (value: string) => {
        const items = value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
        updateContent({ skills: items });
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setSaving(true);
        setError(null);

        const selectedTemplateId =
            templateId === "" ? undefined : Number(templateId);

        if (!selectedTemplateId) {
            setError("Выберите шаблон резюме");
            setSaving(false);
            return;
        }

        try {
            const payload = {
                title: title.trim(),
                template_id: selectedTemplateId,
                is_primary: isPrimary,
                content: {
                    ...content,
                    full_name: content.full_name.trim(),
                    qualification: content.qualification.trim(),
                    goals: content.goals?.trim() || undefined,
                    contacts: {
                        email: content.contacts.email?.trim() || undefined,
                        phone: content.contacts.phone?.trim() || undefined,
                        telegram: content.contacts.telegram?.trim() || undefined,
                        portfolio_url: content.contacts.portfolio_url?.trim() || undefined,
                    },
                },
            };

            if (isEditMode && id) {
                await updateResume(Number(id), payload);
            } else {
                await createResume(payload);
            }
            navigate("/resumes");
        } catch (e: any) {
            const status = e?.response?.status;
            if (status === 400) {
                setError("Проверьте обязательные поля резюме");
            } else if (status === 404) {
                setError("Шаблон резюме не найден");
            } else {
                setError("Не удалось сохранить резюме");
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <Layout>
            <div className="mx-auto max-w-5xl space-y-6">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <h1 className="text-3xl font-bold text-gray-900">
                                {isEditMode ? "Редактирование резюме" : "Новое резюме"}
                            </h1>
                            <Link
                                to="/resumes"
                                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                            >
                                Назад
                            </Link>
                        </div>

                        {error && (
                            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                                {error}
                            </div>
                        )}

                        {helper && (helper.missing_sections.length > 0 || helper.recommendations.length > 0) && (
                            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                                <p className="font-semibold">Рекомендации по резюме</p>
                                {helper.missing_sections.length > 0 && (
                                    <p>Не заполнено: {helper.missing_sections.join(", ")}</p>
                                )}
                                {helper.recommendations.length > 0 && (
                                    <ul className="mt-2 list-disc pl-5">
                                        {helper.recommendations.map((rec) => (
                                            <li key={rec}>{rec}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}

                        <form
                            onSubmit={handleSubmit}
                            className="space-y-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
                        >
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">
                                        Название резюме
                                    </label>
                                    <input
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="input-field w-full"
                                        placeholder="Например: Junior Media Analyst"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">
                                        Шаблон
                                    </label>
                                    <select
                                        value={templateId}
                                        onChange={(e) =>
                                            setTemplateId(e.target.value ? Number(e.target.value) : "")
                                        }
                                        className="input-field w-full"
                                        required
                                    >
                                        <option value="">Выберите шаблон</option>
                                        {templates.map((tpl) => (
                                            <option key={tpl.id} value={tpl.id}>
                                                {tpl.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <label className="flex items-center gap-2 text-sm text-gray-700">
                                <input
                                    type="checkbox"
                                    checked={isPrimary}
                                    onChange={(e) => setIsPrimary(e.target.checked)}
                                    className="h-4 w-4"
                                />
                                Сделать основным
                            </label>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">
                                        ФИО
                                    </label>
                                    <input
                                        value={content.full_name}
                                        onChange={(e) => updateContent({ full_name: e.target.value })}
                                        className="input-field w-full"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">
                                        Квалификация
                                    </label>
                                    <input
                                        value={content.qualification}
                                        onChange={(e) =>
                                            updateContent({ qualification: e.target.value })
                                        }
                                        className="input-field w-full"
                                        placeholder="Например: Digital аналитик"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Профессиональные цели
                                </label>
                                <textarea
                                    value={content.goals || ""}
                                    onChange={(e) => updateContent({ goals: e.target.value })}
                                    className="input-field w-full"
                                    rows={3}
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">
                                        Email
                                    </label>
                                    <input
                                        value={content.contacts.email || ""}
                                        onChange={(e) => updateContacts("email", e.target.value)}
                                        className="input-field w-full"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">
                                        Телефон
                                    </label>
                                    <input
                                        value={content.contacts.phone || ""}
                                        onChange={(e) => updateContacts("phone", e.target.value)}
                                        className="input-field w-full"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">
                                        Telegram
                                    </label>
                                    <input
                                        value={content.contacts.telegram || ""}
                                        onChange={(e) => updateContacts("telegram", e.target.value)}
                                        className="input-field w-full"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">
                                        Портфолио URL
                                    </label>
                                    <input
                                        value={content.contacts.portfolio_url || ""}
                                        onChange={(e) =>
                                            updateContacts("portfolio_url", e.target.value)
                                        }
                                        className="input-field w-full"
                                    />
                                </div>
                            </div>

                            <section className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-semibold">Опыт работы</h2>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            updateContent({
                                                experience: [
                                                    ...content.experience,
                                                    { company: "", role: "" },
                                                ],
                                            })
                                        }
                                        className="inline-flex items-center rounded-md border border-gray-200 px-3 py-1.5 text-sm"
                                    >
                                        <Plus className="mr-1 h-4 w-4" /> Добавить
                                    </button>
                                </div>

                                {content.experience.map((item, index) => (
                                    <div key={`exp-${index}`} className="rounded-lg border p-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-medium text-gray-700">
                                                Запись {index + 1}
                                            </h3>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    updateContent({
                                                        experience: content.experience.filter(
                                                            (_, i) => i !== index,
                                                        ),
                                                    })
                                                }
                                                className="text-rose-500 hover:text-rose-700"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                            <input
                                                value={item.company}
                                                onChange={(e) =>
                                                    updateExperience(index, { company: e.target.value })
                                                }
                                                className="input-field"
                                                placeholder="Компания"
                                                required
                                            />
                                            <input
                                                value={item.role}
                                                onChange={(e) =>
                                                    updateExperience(index, { role: e.target.value })
                                                }
                                                className="input-field"
                                                placeholder="Должность"
                                                required
                                            />
                                            <input
                                                value={item.start_date || ""}
                                                onChange={(e) =>
                                                    updateExperience(index, {
                                                        start_date: e.target.value,
                                                    })
                                                }
                                                className="input-field"
                                                placeholder="Старт (например 2023)"
                                            />
                                            <input
                                                value={item.end_date || ""}
                                                onChange={(e) =>
                                                    updateExperience(index, { end_date: e.target.value })
                                                }
                                                className="input-field"
                                                placeholder="Финиш (например 2024)"
                                            />
                                        </div>
                                        <textarea
                                            value={item.description || ""}
                                            onChange={(e) =>
                                                updateExperience(index, {
                                                    description: e.target.value,
                                                })
                                            }
                                            className="input-field mt-3 w-full"
                                            rows={3}
                                            placeholder="Ключевые задачи и результаты"
                                        />
                                    </div>
                                ))}
                            </section>

                            <section className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-semibold">Образование</h2>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            updateContent({
                                                education: [
                                                    ...content.education,
                                                    { institution: "", degree: "" },
                                                ],
                                            })
                                        }
                                        className="inline-flex items-center rounded-md border border-gray-200 px-3 py-1.5 text-sm"
                                    >
                                        <Plus className="mr-1 h-4 w-4" /> Добавить
                                    </button>
                                </div>

                                {content.education.map((item, index) => (
                                    <div key={`edu-${index}`} className="rounded-lg border p-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-medium text-gray-700">
                                                Запись {index + 1}
                                            </h3>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    updateContent({
                                                        education: content.education.filter(
                                                            (_, i) => i !== index,
                                                        ),
                                                    })
                                                }
                                                className="text-rose-500 hover:text-rose-700"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                            <input
                                                value={item.institution}
                                                onChange={(e) =>
                                                    updateEducation(index, {
                                                        institution: e.target.value,
                                                    })
                                                }
                                                className="input-field"
                                                placeholder="Учебное заведение"
                                                required
                                            />
                                            <input
                                                value={item.degree}
                                                onChange={(e) =>
                                                    updateEducation(index, { degree: e.target.value })
                                                }
                                                className="input-field"
                                                placeholder="Степень / программа"
                                                required
                                            />
                                            <input
                                                value={item.start_year || ""}
                                                onChange={(e) =>
                                                    updateEducation(index, {
                                                        start_year: e.target.value
                                                            ? Number(e.target.value)
                                                            : undefined,
                                                    })
                                                }
                                                className="input-field"
                                                placeholder="Год начала"
                                                type="number"
                                            />
                                            <input
                                                value={item.end_year || ""}
                                                onChange={(e) =>
                                                    updateEducation(index, {
                                                        end_year: e.target.value
                                                            ? Number(e.target.value)
                                                            : undefined,
                                                    })
                                                }
                                                className="input-field"
                                                placeholder="Год окончания"
                                                type="number"
                                            />
                                        </div>
                                        <textarea
                                            value={item.description || ""}
                                            onChange={(e) =>
                                                updateEducation(index, {
                                                    description: e.target.value,
                                                })
                                            }
                                            className="input-field mt-3 w-full"
                                            rows={3}
                                            placeholder="Дополнительные детали"
                                        />
                                    </div>
                                ))}
                            </section>

                            <section className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-semibold">Рекомендации</h2>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            updateContent({
                                                recommendations: [
                                                    ...content.recommendations,
                                                    { name: "" },
                                                ],
                                            })
                                        }
                                        className="inline-flex items-center rounded-md border border-gray-200 px-3 py-1.5 text-sm"
                                    >
                                        <Plus className="mr-1 h-4 w-4" /> Добавить
                                    </button>
                                </div>

                                {content.recommendations.map((item, index) => (
                                    <div key={`rec-${index}`} className="rounded-lg border p-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-medium text-gray-700">
                                                Рекомендация {index + 1}
                                            </h3>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    updateContent({
                                                        recommendations: content.recommendations.filter(
                                                            (_, i) => i !== index,
                                                        ),
                                                    })
                                                }
                                                className="text-rose-500 hover:text-rose-700"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                            <input
                                                value={item.name}
                                                onChange={(e) =>
                                                    updateRecommendation(index, { name: e.target.value })
                                                }
                                                className="input-field"
                                                placeholder="Имя"
                                                required
                                            />
                                            <input
                                                value={item.position || ""}
                                                onChange={(e) =>
                                                    updateRecommendation(index, {
                                                        position: e.target.value,
                                                    })
                                                }
                                                className="input-field"
                                                placeholder="Должность"
                                            />
                                            <input
                                                value={item.contact || ""}
                                                onChange={(e) =>
                                                    updateRecommendation(index, {
                                                        contact: e.target.value,
                                                    })
                                                }
                                                className="input-field"
                                                placeholder="Контакт"
                                            />
                                        </div>
                                        <textarea
                                            value={item.text || ""}
                                            onChange={(e) =>
                                                updateRecommendation(index, {
                                                    text: e.target.value,
                                                })
                                            }
                                            className="input-field mt-3 w-full"
                                            rows={3}
                                            placeholder="Текст рекомендации"
                                        />
                                    </div>
                                ))}
                            </section>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Навыки (через запятую)
                                </label>
                                <input
                                    value={skillsText}
                                    onChange={(e) => setSkillsText(e.target.value)}
                                    className="input-field w-full"
                                    placeholder="SMM, SEO, Analytics"
                                />
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => navigate("/resumes")}
                                    className="rounded-md border border-gray-300 px-4 py-2 text-sm"
                                >
                                    Отмена
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
                                >
                                    {saving ? "Сохранение..." : "Сохранить"}
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </Layout>
    );
};

export default ResumeEditPage;
