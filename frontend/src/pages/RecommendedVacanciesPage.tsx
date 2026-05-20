import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { getRecommendedVacancies } from "@/services/vacancyService";
import { Vacancy } from "@/types/vacancy";
import { Loader2 } from "lucide-react";

type Rec = {
  vacancy: Vacancy;
  score: number;
  reasons: string[];
  explanation: string[];
};

const RecommendedVacanciesPage: React.FC = () => {
  const [items, setItems] = useState<Rec[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRecommendedVacancies(20)
      .then((data) => setItems((data.items || []) as Rec[]))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6 py-4">
        <h1 className="text-3xl font-bold text-gray-900">Рекомендованные</h1>
        <p className="text-gray-600 text-sm">
          Подборка по вашему профилю. Чем полнее профиль, тем точнее совпадения.
        </p>
        {loading ? (
          <div className="flex justify-center p-10">
            <Loader2 className="animate-spin text-primary-600 w-8 h-8" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-gray-500">Пока нет рекомендаций.</p>
        ) : (
          <div className="space-y-4">
            {items.map((rec) => (
              <div
                key={rec.vacancy.id}
                className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm"
              >
                <div className="flex justify-between gap-4 flex-wrap">
                  <div>
                    <Link
                      to={`/vacancies/${rec.vacancy.id}`}
                      className="text-xl font-semibold text-primary-700 hover:underline"
                    >
                      {rec.vacancy.title}
                    </Link>
                    <p className="text-gray-600 mt-1">
                      {rec.vacancy.company?.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-gray-500">Совпадение</span>
                    <p className="text-2xl font-bold text-green-600">
                      {rec.score}
                    </p>
                  </div>
                </div>
                {rec.explanation?.length > 0 && (
                  <ul className="mt-4 text-sm text-gray-700 list-disc pl-5 space-y-1">
                    {rec.explanation.map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default RecommendedVacanciesPage;
