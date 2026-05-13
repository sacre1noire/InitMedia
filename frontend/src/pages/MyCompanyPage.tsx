import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import CompanyVerificationBadge from "@/components/CompanyVerificationBadge";
import { getCompanies } from "@/services/companyService";
import { useAuth } from "@/contexts/AuthContext";
import { Company } from "@/types/company";
import { UserRole } from "@/types/auth";
import { Building2, ExternalLink, Loader2 } from "lucide-react";

const MyCompanyPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [company, setCompany] = useState<Company | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const companies = await getCompanies();
                if (!companies || companies.length === 0) {
                    setCompany(null);
                    return;
                }
                setCompany(companies[0]);
            } catch (e: any) {
                const status = e?.response?.status;
                if (status === 403) {
                    setError("Нет доступа к компании");
                } else {
                    setError("Не удалось загрузить данные компании");
                }
            } finally {
                setLoading(false);
            }
        };

        load();
    }, []);

    const isEmployer = user?.role === UserRole.EMPLOYER;

    const primaryAction = useMemo(() => {
        if (!company) {
            return {
                label: "Создать компанию",
                onClick: () => navigate("/companies/new"),
            };
        }

        return {
            label: "Редактировать",
            onClick: () => navigate(`/companies/${company.id}/edit`),
        };
    }, [company, navigate]);

    return (
        <Layout>
            <div className="mx-auto max-w-5xl space-y-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Моя компания</h1>
                        <p className="text-sm text-gray-600">
                            Управляйте профилем компании и публикуйте вакансии.
                        </p>
                    </div>
                    {isEmployer && (
                        <button
                            onClick={primaryAction.onClick}
                            className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
                        >
                            {primaryAction.label}
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
                    </div>
                ) : error ? (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-700">
                        {error}
                    </div>
                ) : !company ? (
                    <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
                        <p>Компания еще не создана.</p>
                        {isEmployer && (
                            <Link
                                to="/companies/new"
                                className="mt-4 inline-flex items-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
                            >
                                Создать компанию
                            </Link>
                        )}
                    </div>
                ) : (
                    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex items-start gap-4">
                                <div className="h-20 w-20 overflow-hidden rounded-xl bg-gray-100">
                                    {company.logo_url ? (
                                        <img
                                            src={company.logo_url}
                                            alt={company.name}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-gray-500">
                                            <Building2 className="h-8 w-8" />
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        {company.name}
                                    </h2>
                                    <div className="mt-2">
                                        <CompanyVerificationBadge status={company.is_verified} />
                                    </div>
                                    {company.size ? (
                                        <p className="mt-2 text-sm text-gray-500">
                                            Размер: {company.size}
                                        </p>
                                    ) : null}
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 self-start">
                                {company.website_url ? (
                                    <a
                                        href={company.website_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 rounded-md border border-primary-200 bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-700 hover:bg-primary-100"
                                    >
                                        Сайт компании
                                        <ExternalLink className="h-4 w-4" />
                                    </a>
                                ) : null}
                                {isEmployer && (
                                    <button
                                        onClick={() => navigate(`/companies/${company.id}/edit`)}
                                        className="rounded-md bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
                                    >
                                        Редактировать
                                    </button>
                                )}
                            </div>
                        </div>

                        <p className="mt-5 whitespace-pre-line text-gray-700">
                            {company.description || "Описание компании пока не добавлено."}
                        </p>
                    </section>
                )}
            </div>
        </Layout>
    );
};

export default MyCompanyPage;
