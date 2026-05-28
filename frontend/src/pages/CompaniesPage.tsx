import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import CompanyCard from "@/components/CompanyCard";
import { getCompanies } from "@/services/companyService";
import { Company } from "@/types/company";
import { UserRole } from "@/types/auth";
import { Loader2, Search } from "lucide-react";
import { motion } from "framer-motion";
import { StaggerList, StaggerItem } from "@/components/animations";

const CompaniesPage: React.FC = () => {
    const { user } = useAuth();
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState("");

    useEffect(() => {
        const loadCompanies = async () => {
            try {
                const data = await getCompanies();
                setCompanies(data);
            } catch (error) {
                console.error("Failed to load companies", error);
            } finally {
                setLoading(false);
            }
        };

        loadCompanies();
    }, []);

    const filtered = useMemo(() => {
        const needle = query.trim().toLowerCase();
        if (!needle) {
            return companies;
        }

        return companies.filter(
            (company) =>
                company.name.toLowerCase().includes(needle) ||
                (company.description || "").toLowerCase().includes(needle),
        );
    }, [companies, query]);

    return (
        <Layout>
            <div className="mx-auto max-w-6xl space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Каталог компаний</h1>
                        <p className="mt-1 text-sm text-gray-600">Профили компаний с верификацией и актуальными вакансиями.</p>
                    </div>

                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
                        {(user?.role === UserRole.EMPLOYER || user?.role === UserRole.ADMIN) && (
                            <Link
                                to="/companies/new"
                                className="inline-flex w-full items-center justify-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 sm:w-auto"
                            >
                                Создать компанию
                            </Link>
                        )}
                        <div className="relative w-full sm:w-80">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder="Поиск компании"
                                className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none ring-primary-200 transition focus:ring"
                            />
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
                        Компании не найдены.
                    </div>
                ) : (
                    <StaggerList className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {filtered.map((company) => (
                            <StaggerItem key={company.id}>
                                <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
                                    <CompanyCard
                                        company={company}
                                        canEdit={
                                            !!user &&
                                            (user.role === UserRole.ADMIN ||
                                                (user.role === UserRole.EMPLOYER && user.id === company.owner_id))
                                        }
                                    />
                                </motion.div>
                            </StaggerItem>
                        ))}
                    </StaggerList>
                )}
            </div>
        </Layout>
    );
};

export default CompaniesPage;
