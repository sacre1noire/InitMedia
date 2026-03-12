import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import {
  getMyApplications,
  deleteApplication,
} from "@/services/applicationService";
import { Application, ApplicationStatus } from "@/types/application";
import { Trash2, ExternalLink } from "lucide-react";

const ApplicantApplicationsPage: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const data = await getMyApplications();
      setApplications(data);
    } catch (error) {
      console.error("Failed to load applications", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Вы уверены, что хотите отозвать эту заявку?")) {
      try {
        await deleteApplication(id);
        setApplications(applications.filter((app) => app.id !== id));
      } catch (error) {
        console.error("Failed to delete application", error);
      }
    }
  };

  const statusColors = {
    [ApplicationStatus.PENDING]: "bg-yellow-100 text-yellow-800",
    [ApplicationStatus.VIEWED]: "bg-blue-100 text-blue-800",
    [ApplicationStatus.ACCEPTED]: "bg-green-100 text-green-800",
    [ApplicationStatus.REJECTED]: "bg-red-100 text-red-800",
  };

  const statusLabels = {
    [ApplicationStatus.PENDING]: "На рассмотрении",
    [ApplicationStatus.VIEWED]: "Просмотрено",
    [ApplicationStatus.ACCEPTED]: "Приглашение",
    [ApplicationStatus.REJECTED]: "Отказ",
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Мои отклики</h1>

        {loading ? (
          <div className="text-center py-10">Загрузка...</div>
        ) : applications.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            Вы еще не откликались на вакансии.
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div
                key={app.id}
                className="bg-white shadow rounded-lg p-6 flex justify-between items-start"
              >
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    <Link
                      to={`/vacancies/${app.vacancy.id}`}
                      className="hover:text-primary-600 flex items-center"
                    >
                      {app.vacancy.title}
                      <ExternalLink className="w-4 h-4 ml-1 text-gray-400" />
                    </Link>
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {app.vacancy.company?.name || "Компания"}
                  </p>
                  <div className="mt-2 text-xs text-gray-400">
                    Отправлено: {new Date(app.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[app.status]}`}
                  >
                    {statusLabels[app.status]}
                  </span>
                  {app.status === ApplicationStatus.PENDING && (
                    <button
                      onClick={() => handleDelete(app.id)}
                      className="text-red-500 hover:text-red-700 text-sm flex items-center mt-2"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Отозвать
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ApplicantApplicationsPage;
