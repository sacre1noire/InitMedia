import React from "react";
import { Link } from "react-router-dom";
import { Building2, ExternalLink } from "lucide-react";
import { Company } from "@/types/company";
import CompanyVerificationBadge from "@/components/CompanyVerificationBadge";

interface Props {
    company: Company;
    canEdit?: boolean;
}

const CompanyCard: React.FC<Props> = ({ company, canEdit = false }) => {
    return (
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="h-11 w-11 overflow-hidden rounded-lg bg-gray-100">
                        {company.logo_url ? (
                            <img src={company.logo_url} alt={company.name} className="h-full w-full object-cover" />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-gray-500">
                                <Building2 className="h-5 w-5" />
                            </div>
                        )}
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">{company.name}</h3>
                        <p className="text-xs text-gray-500">ID: {company.id}</p>
                    </div>
                </div>
                <CompanyVerificationBadge status={company.is_verified} />
            </div>

            <p className="mb-4 line-clamp-3 text-sm text-gray-600">
                {company.description || "Описание компании пока не заполнено."}
            </p>

            <div className="flex items-center justify-between gap-2">
                {company.website_url ? (
                    <a
                        href={company.website_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
                    >
                        Сайт
                        <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                ) : (
                    <span className="text-sm text-gray-400">Сайт не указан</span>
                )}

                <div className="flex items-center gap-2">
                    {canEdit ? (
                        <Link
                            to={`/companies/${company.id}/edit`}
                            className="rounded-md border border-primary-300 px-3 py-1.5 text-sm font-medium text-primary-700 hover:bg-primary-50"
                        >
                            Редактировать
                        </Link>
                    ) : null}
                    <Link
                        to={`/companies/${company.id}`}
                        className="rounded-md bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
                    >
                        Профиль
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default CompanyCard;
