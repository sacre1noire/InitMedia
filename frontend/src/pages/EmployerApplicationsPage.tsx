import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { useConfirm, useToast, StaggerList, StaggerItem } from "@/components/animations";
import {
  getMyApplications,
  updateApplicationStatus,
} from "@/services/employerService";
import { Application, ApplicationStatus } from "@/types/application";

const EmployerApplicationsPage: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const confirm = useConfirm();
  const toast = useToast();

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

  const handleStatusChange = async (id: number, status: ApplicationStatus) => {
    const isAccept = status === ApplicationStatus.ACCEPTED;
    const ok = await confirm({
      title: isAccept ? "Принять кандидата?" : "Отказать кандидату?",
      description: isAccept
        ? "Кандидат увидит, что вы пригласили его на собеседование."
        : "Кандидат увидит статус «Отказ».",
      confirmLabel: isAccept ? "Принять" : "Отказать",
      variant: isAccept ? "success" : "danger",
    });
    if (!ok) return;
    try {
      await updateApplicationStatus(id, status);
      setApplications(
        applications.map((app) => (app.id === id ? { ...app, status } : app)),
      );
      toast(isAccept ? "Кандидат принят" : "Отклик отклонён", "success");
    } catch (error) {
      console.error("Failed to update status", error);
      toast("Не удалось изменить статус", "error");
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Отклики на вакансии
        </h1>

        {loading ? (
          <div className="text-center py-10">Загрузка...</div>
        ) : applications.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            Откликов пока нет.
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <StaggerList className="divide-y divide-gray-200">
              {applications.map((app) => (
                <StaggerItem
                  key={app.id}
                  className="p-4 hover:bg-gray-50 flex items-center justify-between transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-primary-600 truncate">
                        {app.vacancy?.title}
                      </p>
                      <div className="ml-2 flex-shrink-0 flex">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800`}
                        >
                          {app.status}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          <UserIcon
                            className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400"
                            aria-hidden="true"
                          />
                          {app.applicant?.email ||
                            `Кандидат #${app.applicant?.id ?? "unknown"}`}
                        </p>
                        {app.resume_title && (
                          <p className="text-xs text-gray-500 mt-1 sm:ml-6">
                            Резюме: {app.resume_title}
                          </p>
                        )}
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <p>
                          Отправлено{" "}
                          {new Date(app.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 flex-shrink-0 flex items-center space-x-2">
                    {app.status === ApplicationStatus.PENDING && (
                      <>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() =>
                            handleStatusChange(
                              app.id,
                              ApplicationStatus.ACCEPTED,
                            )
                          }
                          className="bg-green-100 text-green-800 px-3 py-1 rounded-md text-sm hover:bg-green-200"
                        >
                          Принять
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() =>
                            handleStatusChange(
                              app.id,
                              ApplicationStatus.REJECTED,
                            )
                          }
                          className="bg-red-100 text-red-800 px-3 py-1 rounded-md text-sm hover:bg-red-200"
                        >
                          Отказать
                        </motion.button>
                      </>
                    )}
                  </div>
                </StaggerItem>
              ))}
            </StaggerList>
          </div>
        )}
      </div>
    </Layout>
  );
};

// Simple User Icon component if lucide-react User is not imported or needed differently
const UserIcon = (props: any) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);

export default EmployerApplicationsPage;
