import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { createCompany, getCompanyById, updateCompany } from "@/services/companyService";
import { CompanySizeRange } from "@/types/company";
import { UserRole } from "@/types/auth";
import { Loader2 } from "lucide-react";

interface CompanyForm {
    name: string;
    description: string;
    website_url: string;
    logo_url: string;
    industry_id: string;
    size: string;
}

const CompanyEditPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const isCreateMode = !id;
    const navigate = useNavigate();
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [accessDenied, setAccessDenied] = useState(false);
    const [form, setForm] = useState<CompanyForm>({
        name: "",
        description: "",
        website_url: "",
        logo_url: "",
        industry_id: "",
        size: "",
    });

    useEffect(() => {
        const load = async () => {
            if (isCreateMode) {
                if (!user || (user.role !== UserRole.EMPLOYER && user.role !== UserRole.ADMIN)) {
                    setAccessDenied(true);
                }
                setLoading(false);
                return;
            }

            const companyId = Number(id);
            if (!companyId || Number.isNaN(companyId)) {
                setError("Некорректный ID компании");
                setLoading(false);
                return;
            }

            try {
                const company = await getCompanyById(companyId);

                if (
                    user &&
                    user.role !== UserRole.ADMIN &&
                    user.role === UserRole.EMPLOYER &&
                    company.owner_id !== user.id
                ) {
                    setAccessDenied(true);
                    setLoading(false);
                    return;
                }

                setForm({
                    name: company.name || "",
                    description: company.description || "",
                    website_url: company.website_url || "",
                    logo_url: company.logo_url || "",
                    industry_id: company.industry_id ? String(company.industry_id) : "",
                    size: company.size || "",
                });
            } catch (e: any) {
                const status = e?.response?.status;
                if (status === 403) {
                    setAccessDenied(true);
                } else if (status === 404) {
                    setError("Компания не найдена");
                } else {
                    setError("Не удалось загрузить данные компании");
                }
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [id, user, isCreateMode]);

    const updateField = (field: keyof CompanyForm, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        const normalizedName = form.name.trim();
        if (!normalizedName) {
            setError("Название компании обязательно");
            return;
        }

        setSaving(true);
        setError(null);
        try {
            const payload = {
                name: normalizedName,
                description: form.description.trim() || undefined,
                website_url: form.website_url.trim() || undefined,
                logo_url: form.logo_url.trim() || undefined,
                industry_id: form.industry_id.trim() ? Number(form.industry_id) : undefined,
                size: (form.size || undefined) as CompanySizeRange | undefined,
            };

            if (isCreateMode) {
                const created = await createCompany(payload);
                navigate(`/companies/${created.id}`);
                return;
            }

            const companyId = Number(id);
            if (!companyId || Number.isNaN(companyId)) {
                setError("Некорректный ID компании");
                return;
            }

            await updateCompany(companyId, payload);

            navigate(`/companies/${companyId}`);
        } catch (e: any) {
            const status = e?.response?.status;
            if (status === 400) {
                setError(e?.response?.data?.error || "Проверьте корректность полей");
                return;
            }
            if (status === 409) {
                setError("У вас уже есть компания. Откройте карточку компании и редактируйте её.");
                return;
            }
            if (status === 403) {
                setAccessDenied(true);
                return;
            }
            if (status === 404) {
                setError("Компания не найдена");
                return;
            }
            setError("Не удалось сохранить профиль компании");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Layout>
            <div className="mx-auto max-w-3xl space-y-6">
                {loading ? (
                    <div className="flex justify-center py-14">
                        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
                    </div>
                ) : accessDenied ? (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-700">
                        У вас нет прав на редактирование этой компании.
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between">
                            <h1 className="text-3xl font-bold text-gray-900">{isCreateMode ? "Создание компании" : "Редактирование компании"}</h1>
                            <Link
                                to={id ? `/companies/${id}` : "/companies"}
                                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Назад
                            </Link>
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            className="space-y-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
                        >
                            {error ? (
                                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                                    {error}
                                </div>
                            ) : null}

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Название компании *</label>
                                <input
                                    value={form.name}
                                    onChange={(e) => updateField("name", e.target.value)}
                                    className="input-field w-full"
                                    placeholder="Введите название"
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Описание</label>
                                <textarea
                                    value={form.description}
                                    onChange={(e) => updateField("description", e.target.value)}
                                    className="input-field w-full"
                                    rows={5}
                                    placeholder="Коротко о компании"
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Сайт</label>
                                    <input
                                        value={form.website_url}
                                        onChange={(e) => updateField("website_url", e.target.value)}
                                        className="input-field w-full"
                                        placeholder="https://company.com"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Логотип (URL)</label>
                                    <input
                                        value={form.logo_url}
                                        onChange={(e) => updateField("logo_url", e.target.value)}
                                        className="input-field w-full"
                                        placeholder="https://.../logo.png"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">ID индустрии</label>
                                    <input
                                        value={form.industry_id}
                                        onChange={(e) => updateField("industry_id", e.target.value)}
                                        className="input-field w-full"
                                        type="number"
                                        min={1}
                                        placeholder="Например: 12"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Размер компании</label>
                                    <select
                                        value={form.size}
                                        onChange={(e) => updateField("size", e.target.value)}
                                        className="input-field w-full"
                                    >
                                        <option value="">Не указано</option>
                                        <option value={CompanySizeRange.SIZE_1_10}>1-10</option>
                                        <option value={CompanySizeRange.SIZE_11_50}>11-50</option>
                                        <option value={CompanySizeRange.SIZE_51_200}>51-200</option>
                                        <option value={CompanySizeRange.SIZE_201_500}>201-500</option>
                                        <option value={CompanySizeRange.SIZE_500_PLUS}>500+</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <Link
                                    to={id ? `/companies/${id}` : "/companies"}
                                    className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Отмена
                                </Link>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
                                >
                                    {saving ? "Сохранение..." : isCreateMode ? "Создать компанию" : "Сохранить"}
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </Layout>
    );
};

export default CompanyEditPage;