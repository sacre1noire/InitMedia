import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { getMyApplication } from "@/services/applicationService";
import { Application } from "@/types/application";
import { Loader2, ArrowLeft } from "lucide-react";

const ApplicationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getMyApplication(Number(id))
      .then(setApp)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center p-10">
          <Loader2 className="animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!app || !app.vacancy) {
    return (
      <Layout>
        <div className="p-8 text-center text-gray-500">Заявка не найдена</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto py-8 px-4">
        <Link
          to="/applications/my"
          className="inline-flex items-center text-gray-500 mb-6 hover:text-primary-600"
        >
          <ArrowLeft size={20} className="mr-2" />
          К откликам
        </Link>
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">
            <Link
              className="text-primary-700 hover:underline"
              to={`/vacancies/${app.vacancy.id}`}
            >
              {app.vacancy.title}
            </Link>
          </h1>
          <p className="text-gray-600">
            {app.vacancy.company?.name || "Компания"}
          </p>
          <p className="text-sm text-gray-500">
            Статус: <span className="font-medium">{app.status}</span>
          </p>
          {app.resume_title && (
            <p className="text-sm">
              Резюме:{" "}
              <span className="font-medium">{app.resume_title}</span>
            </p>
          )}
          {app.cover_letter && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-1">
                Сопроводительное письмо
              </h3>
              <p className="text-gray-700 whitespace-pre-wrap">
                {app.cover_letter}
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ApplicationDetailPage;
