import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, MotionConfig } from "framer-motion";
import { Loader2 } from "lucide-react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/AuthGuard";
import { ApplicantRoute } from "@/components/ApplicantRoute";
import { ConfirmProvider, ToastProvider, PageTransition } from "@/components/animations";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import HomePage from "@/pages/HomePage";
import LandingPage from "@/pages/LandingPage";
import ProfilePage from "@/pages/ProfilePage";
import ProfileEditPage from "@/pages/ProfileEditPage";
import VacanciesPage from "@/pages/VacanciesPage";
import RecommendedVacanciesPage from "@/pages/RecommendedVacanciesPage";
import VacancyDetailsPage from "@/pages/VacancyDetailsPage";
import EmployerVacanciesPage from "@/pages/EmployerVacanciesPage";
import EmployerInternshipsPage from "@/pages/EmployerInternshipsPage";
import VacancyEditPage from "@/pages/VacancyEditPage";
import EmployerApplicationsPage from "@/pages/EmployerApplicationsPage";
import ApplicantApplicationsPage from "@/pages/ApplicantApplicationsPage";
import ApplicationDetailPage from "@/pages/ApplicationDetailPage";
import CandidateSearchPage from "@/pages/CandidateSearchPage";
import CoursesPage from "@/pages/CoursesPage";
import CourseDetailsPage from "@/pages/CourseDetailsPage";
import LessonPage from "@/pages/LessonPage";
import CourseQuizPage from "@/pages/CourseQuizPage";
import CompaniesPage from "@/pages/CompaniesPage";
import CompanyProfilePage from "@/pages/CompanyProfilePage";
import CompanyEditPage from "@/pages/CompanyEditPage";
import MyCompanyPage from "@/pages/MyCompanyPage";
import ResumeListPage from "@/pages/ResumeListPage";
import ResumeEditPage from "@/pages/ResumeEditPage";
import ResumePreviewPage from "@/pages/ResumePreviewPage";

const RootRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return isAuthenticated ? (
    <PageTransition><HomePage /></PageTransition>
  ) : (
    <PageTransition><LandingPage /></PageTransition>
  );
};

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<PageTransition><LoginPage /></PageTransition>} />
        <Route path="/register" element={<PageTransition><RegisterPage /></PageTransition>} />

        <Route path="/" element={<RootRoute />} />

        <Route
          path="/profile"
          element={
            <AuthGuard>
              <PageTransition><ProfilePage /></PageTransition>
            </AuthGuard>
          }
        />
        <Route
          path="/profile/edit"
          element={
            <AuthGuard>
              <PageTransition><ProfileEditPage /></PageTransition>
            </AuthGuard>
          }
        />

        <Route
          path="/vacancies/recommended"
          element={
            <AuthGuard>
              <PageTransition><RecommendedVacanciesPage /></PageTransition>
            </AuthGuard>
          }
        />
        <Route
          path="/vacancies"
          element={
            <AuthGuard>
              <PageTransition><VacanciesPage /></PageTransition>
            </AuthGuard>
          }
        />
        <Route
          path="/vacancies/:id"
          element={
            <AuthGuard>
              <PageTransition><VacancyDetailsPage /></PageTransition>
            </AuthGuard>
          }
        />
        <Route
          path="/companies"
          element={
            <AuthGuard>
              <PageTransition><CompaniesPage /></PageTransition>
            </AuthGuard>
          }
        />
        <Route
          path="/companies/:id"
          element={
            <AuthGuard>
              <PageTransition><CompanyProfilePage /></PageTransition>
            </AuthGuard>
          }
        />
        <Route
          path="/companies/:id/edit"
          element={
            <AuthGuard>
              <PageTransition><CompanyEditPage /></PageTransition>
            </AuthGuard>
          }
        />
        <Route
          path="/companies/new"
          element={
            <AuthGuard>
              <PageTransition><CompanyEditPage /></PageTransition>
            </AuthGuard>
          }
        />

        <Route
          path="/employer/company"
          element={
            <AuthGuard>
              <PageTransition><MyCompanyPage /></PageTransition>
            </AuthGuard>
          }
        />
        <Route
          path="/applications/my/:id"
          element={
            <AuthGuard>
              <PageTransition><ApplicationDetailPage /></PageTransition>
            </AuthGuard>
          }
        />
        <Route
          path="/applications/my"
          element={
            <AuthGuard>
              <PageTransition><ApplicantApplicationsPage /></PageTransition>
            </AuthGuard>
          }
        />

        <Route
          path="/resumes"
          element={
            <AuthGuard>
              <ApplicantRoute>
                <PageTransition><ResumeListPage /></PageTransition>
              </ApplicantRoute>
            </AuthGuard>
          }
        />
        <Route
          path="/resumes/new"
          element={
            <AuthGuard>
              <ApplicantRoute>
                <PageTransition><ResumeEditPage /></PageTransition>
              </ApplicantRoute>
            </AuthGuard>
          }
        />
        <Route
          path="/resumes/:id/edit"
          element={
            <AuthGuard>
              <ApplicantRoute>
                <PageTransition><ResumeEditPage /></PageTransition>
              </ApplicantRoute>
            </AuthGuard>
          }
        />
        <Route
          path="/resumes/:id/preview"
          element={
            <AuthGuard>
              <ApplicantRoute>
                <PageTransition><ResumePreviewPage /></PageTransition>
              </ApplicantRoute>
            </AuthGuard>
          }
        />

        <Route
          path="/courses"
          element={
            <AuthGuard>
              <ApplicantRoute>
                <PageTransition><CoursesPage /></PageTransition>
              </ApplicantRoute>
            </AuthGuard>
          }
        />
        <Route
          path="/courses/:id"
          element={
            <AuthGuard>
              <ApplicantRoute>
                <PageTransition><CourseDetailsPage /></PageTransition>
              </ApplicantRoute>
            </AuthGuard>
          }
        />
        <Route
          path="/courses/:id/lessons/:lessonId"
          element={
            <AuthGuard>
              <ApplicantRoute>
                <PageTransition><LessonPage /></PageTransition>
              </ApplicantRoute>
            </AuthGuard>
          }
        />
        <Route
          path="/courses/:id/quiz"
          element={
            <AuthGuard>
              <ApplicantRoute>
                <PageTransition><CourseQuizPage /></PageTransition>
              </ApplicantRoute>
            </AuthGuard>
          }
        />

        <Route
          path="/employer/vacancies"
          element={
            <AuthGuard>
              <PageTransition><EmployerVacanciesPage /></PageTransition>
            </AuthGuard>
          }
        />
        <Route
          path="/employer/internships"
          element={
            <AuthGuard>
              <PageTransition><EmployerInternshipsPage /></PageTransition>
            </AuthGuard>
          }
        />
        <Route
          path="/employer/vacancies/new"
          element={
            <AuthGuard>
              <PageTransition><VacancyEditPage /></PageTransition>
            </AuthGuard>
          }
        />
        <Route
          path="/employer/internships/new"
          element={
            <AuthGuard>
              <PageTransition><VacancyEditPage /></PageTransition>
            </AuthGuard>
          }
        />
        <Route
          path="/employer/vacancies/:id/edit"
          element={
            <AuthGuard>
              <PageTransition><VacancyEditPage /></PageTransition>
            </AuthGuard>
          }
        />
        <Route
          path="/employer/internships/:id/edit"
          element={
            <AuthGuard>
              <PageTransition><VacancyEditPage /></PageTransition>
            </AuthGuard>
          }
        />
        <Route
          path="/employer/applications"
          element={
            <AuthGuard>
              <PageTransition><EmployerApplicationsPage /></PageTransition>
            </AuthGuard>
          }
        />
        <Route
          path="/employer/candidates"
          element={
            <AuthGuard>
              <PageTransition><CandidateSearchPage /></PageTransition>
            </AuthGuard>
          }
        />
        <Route
          path="/employer/candidates/:id"
          element={
            <AuthGuard>
              <PageTransition><ProfilePage /></PageTransition>
            </AuthGuard>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MotionConfig reducedMotion="user">
          <ToastProvider>
            <ConfirmProvider>
              <AnimatedRoutes />
            </ConfirmProvider>
          </ToastProvider>
        </MotionConfig>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
