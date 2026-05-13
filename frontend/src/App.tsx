import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/AuthGuard";
import { ApplicantRoute } from "@/components/ApplicantRoute";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import HomePage from "@/pages/HomePage";
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
import CompaniesPage from "@/pages/CompaniesPage";
import CompanyProfilePage from "@/pages/CompanyProfilePage";
import CompanyEditPage from "@/pages/CompanyEditPage";
import MyCompanyPage from "@/pages/MyCompanyPage";
import ResumeListPage from "@/pages/ResumeListPage";
import ResumeEditPage from "@/pages/ResumeEditPage";
import ResumePreviewPage from "@/pages/ResumePreviewPage";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route
            path="/"
            element={
              <AuthGuard>
                <HomePage />
              </AuthGuard>
            }
          />

          <Route
            path="/profile"
            element={
              <AuthGuard>
                <ProfilePage />
              </AuthGuard>
            }
          />
          <Route
            path="/profile/edit"
            element={
              <AuthGuard>
                <ProfileEditPage />
              </AuthGuard>
            }
          />

          {/* Public/Applicant Routes */}
          <Route
            path="/vacancies/recommended"
            element={
              <AuthGuard>
                <RecommendedVacanciesPage />
              </AuthGuard>
            }
          />
          <Route
            path="/vacancies"
            element={
              <AuthGuard>
                <VacanciesPage />
              </AuthGuard>
            }
          />
          <Route
            path="/vacancies/:id"
            element={
              <AuthGuard>
                <VacancyDetailsPage />
              </AuthGuard>
            }
          />
          <Route
            path="/companies"
            element={
              <AuthGuard>
                <CompaniesPage />
              </AuthGuard>
            }
          />
          <Route
            path="/companies/:id"
            element={
              <AuthGuard>
                <CompanyProfilePage />
              </AuthGuard>
            }
          />
          <Route
            path="/companies/:id/edit"
            element={
              <AuthGuard>
                <CompanyEditPage />
              </AuthGuard>
            }
          />
          <Route
            path="/companies/new"
            element={
              <AuthGuard>
                <CompanyEditPage />
              </AuthGuard>
            }
          />

          <Route
            path="/employer/company"
            element={
              <AuthGuard>
                <MyCompanyPage />
              </AuthGuard>
            }
          />
          <Route
            path="/applications/my/:id"
            element={
              <AuthGuard>
                <ApplicationDetailPage />
              </AuthGuard>
            }
          />
          <Route
            path="/applications/my"
            element={
              <AuthGuard>
                <ApplicantApplicationsPage />
              </AuthGuard>
            }
          />

          <Route
            path="/resumes"
            element={
              <AuthGuard>
                <ApplicantRoute>
                  <ResumeListPage />
                </ApplicantRoute>
              </AuthGuard>
            }
          />
          <Route
            path="/resumes/new"
            element={
              <AuthGuard>
                <ApplicantRoute>
                  <ResumeEditPage />
                </ApplicantRoute>
              </AuthGuard>
            }
          />
          <Route
            path="/resumes/:id/edit"
            element={
              <AuthGuard>
                <ApplicantRoute>
                  <ResumeEditPage />
                </ApplicantRoute>
              </AuthGuard>
            }
          />
          <Route
            path="/resumes/:id/preview"
            element={
              <AuthGuard>
                <ApplicantRoute>
                  <ResumePreviewPage />
                </ApplicantRoute>
              </AuthGuard>
            }
          />

          {/* Course Routes */}
          <Route
            path="/courses"
            element={
              <AuthGuard>
                <ApplicantRoute>
                  <CoursesPage />
                </ApplicantRoute>
              </AuthGuard>
            }
          />
          <Route
            path="/courses/:id"
            element={
              <AuthGuard>
                <ApplicantRoute>
                  <CourseDetailsPage />
                </ApplicantRoute>
              </AuthGuard>
            }
          />
          <Route
            path="/courses/:id/lessons/:lessonId"
            element={
              <AuthGuard>
                <ApplicantRoute>
                  <LessonPage />
                </ApplicantRoute>
              </AuthGuard>
            }
          />

          {/* Employer Routes */}
          <Route
            path="/employer/vacancies"
            element={
              <AuthGuard>
                <EmployerVacanciesPage />
              </AuthGuard>
            }
          />
          <Route
            path="/employer/internships"
            element={
              <AuthGuard>
                <EmployerInternshipsPage />
              </AuthGuard>
            }
          />
          <Route
            path="/employer/vacancies/new"
            element={
              <AuthGuard>
                <VacancyEditPage />
              </AuthGuard>
            }
          />
          <Route
            path="/employer/internships/new"
            element={
              <AuthGuard>
                <VacancyEditPage />
              </AuthGuard>
            }
          />
          <Route
            path="/employer/vacancies/:id/edit"
            element={
              <AuthGuard>
                <VacancyEditPage />
              </AuthGuard>
            }
          />
          <Route
            path="/employer/internships/:id/edit"
            element={
              <AuthGuard>
                <VacancyEditPage />
              </AuthGuard>
            }
          />
          <Route
            path="/employer/applications"
            element={
              <AuthGuard>
                <EmployerApplicationsPage />
              </AuthGuard>
            }
          />
          <Route
            path="/employer/candidates"
            element={
              <AuthGuard>
                <CandidateSearchPage />
              </AuthGuard>
            }
          />
          <Route
            path="/employer/candidates/:id"
            element={
              <AuthGuard>
                <ProfilePage />
              </AuthGuard>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
