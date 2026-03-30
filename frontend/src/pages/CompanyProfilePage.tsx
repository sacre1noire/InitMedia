import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import CompanyVerificationBadge from "@/components/CompanyVerificationBadge";
import { getCompanyById } from "@/services/companyService";
import { getVacancies } from "@/services/vacancyService";
import { Company } from "@/types/company";
import { UserRole } from "@/types/auth";
import { Vacancy } from "@/types/vacancy";
import { Building2, ExternalLink, Loader2, MapPin } from "lucide-react";

const CompanyProfilePage: React.FC = () => {
    const { user } = useAuth();
    const { id } = useParams<{ id: string }>();
    const [company, setCompany] = useState<Company | null>(null);
    const [vacancies, setVacancies] = useState<Vacancy[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [vacanciesWarning, setVacanciesWarning] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            const numericId = Number(id);
            if (!numericId || Number.isNaN(numericId)) {
                setError("Некорректный ID компании");
                setLoading(false);
                return;
            }

            try {
                const companyData = await getCompanyById(numericId);
                setCompany(companyData);

                try {
                    const vacancyData = await getVacancies({ limit: 200 });
                    setVacancies((vacancyData.items || []).filter((v) => v.company_id === companyData.id));
                    setVacanciesWarning(null);
                } catch {
                    setVacancies([]);
                    setVacanciesWarning("Не удалось загрузить вакансии компании");
                }
            } catch (e: any) {
                const status = e?.response?.status;
                if (status === 403) {
                    setError("Нет доступа к этой компании");
                } else if (status === 404) {
                    setError("Компания не найдена");
                } else {
                    setError("Не удалось загрузить профиль компании");
                }
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [id]);

    const salaryText = (vacancy: Vacancy) => {
        if (vacancy.is_salary_hidden) {
            return "По договоренности";
        }

        if (vacancy.salary_from && vacancy.salary_to) {
            return `${vacancy.salary_from} - ${vacancy.salary_to} ₽`;
        }

        if (vacancy.salary_from) {
            return `от ${vacancy.salary_from} ₽`;
        }

        if (vacancy.salary_to) {
            return `до ${vacancy.salary_to} ₽`;
        }

        return "Зарплата не указана";
    };

    const sortedVacancies = useMemo(
        () => [...vacancies].sort((a, b) => (a.created_at < b.created_at ? 1 : -1)),
        [vacancies],
    );

    const canEditCompany = useMemo(() => {
        if (!company || !user) {
            return false;
        }
        if (user.role === UserRole.ADMIN) {
            return true;
        }
        return user.role === UserRole.EMPLOYER && company.owner_id === user.id;
    }, [company, user]);

    return (
        <Layout>
            <div className="mx-auto max-w-5xl space-y-6">
                {loading ? (
                    <div className="flex justify-center py-14">
                        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
                    </div>
                ) : error ? (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-700">{error}</div>
                ) : company ? (
                    <>
                        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                                <div className="flex items-start gap-4">
                                    <div className="h-20 w-20 overflow-hidden rounded-xl bg-gray-100">
                                        {company.logo_url ? (
                                            <img src={company.logo_url} alt={company.name} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-gray-500">
                                                <Building2 className="h-8 w-8" />
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
                                        <div className="mt-2">
                                            <CompanyVerificationBadge status={company.is_verified} />
                                        </div>
                                        {company.size ? <p className="mt-2 text-sm text-gray-500">Размер: {company.size}</p> : null}
                                    </div>
                                </div>

                                {company.website_url ? (
                                    <div className="flex flex-wrap items-center gap-2 self-start">
                                        <a
                                            href={company.website_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 rounded-md border border-primary-200 bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-700 hover:bg-primary-100"
                                        >
                                            Сайт компании
                                            <ExternalLink className="h-4 w-4" />
                                        </a>
                                        {canEditCompany ? (
                                            <Link
                                                to={`/companies/${company.id}/edit`}
                                                className="rounded-md bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
                                            >
                                                Редактировать
                                            </Link>
                                        ) : null}
                                    </div>
                                ) : canEditCompany ? (
                                    <Link
                                        to={`/companies/${company.id}/edit`}
                                        className="self-start rounded-md bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
                                    >
                                        Редактировать
                                    </Link>
                                ) : null}
                            </div>

                            <p className="mt-5 whitespace-pre-line text-gray-700">
                                {company.description || "Описание компании пока не добавлено."}
                            </p>
                        </section>

                        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-gray-900">Вакансии компании</h2>
                                <span className="text-sm text-gray-500">{sortedVacancies.length} позиций</span>
                            </div>

                            {vacanciesWarning ? (
                                <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                                    {vacanciesWarning}
                                </div>
                            ) : null}

                            {sortedVacancies.length === 0 ? (
                                <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-gray-500">
                                    У компании пока нет опубликованных вакансий.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {sortedVacancies.map((vacancy) => (
                                        <Link
                                            key={vacancy.id}
                                            to={`/vacancies/${vacancy.id}`}
                                            className="block rounded-lg border border-gray-100 p-4 transition hover:border-primary-200 hover:bg-primary-50/40"
                                        >
                                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                                <div>
                                                    <h3 className="font-semibold text-gray-900">{vacancy.title}</h3>
                                                    <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
                                                        <span className="inline-flex items-center gap-1">
                                                            <MapPin className="h-3.5 w-3.5" />
                                                            {vacancy.city || "Удаленно"}
                                                        </span>
                                                        <span className="rounded bg-gray-100 px-2 py-0.5 text-xs uppercase text-gray-600">
                                                            {vacancy.type === "internship" ? "Стажировка" : "Вакансия"}
                                                        </span>
                                                    </div>
                                                </div>

                                                <p className="text-sm font-medium text-emerald-700">{salaryText(vacancy)}</p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </section>
                    </>
                ) : null}
            </div>
        </Layout>
    );
};

export default CompanyProfilePage;
