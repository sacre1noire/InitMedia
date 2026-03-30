import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/AuthGuard";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import HomePage from "@/pages/HomePage";
import ProfilePage from "@/pages/ProfilePage";
import ProfileEditPage from "@/pages/ProfileEditPage";
import VacanciesPage from "@/pages/VacanciesPage";
import VacancyDetailsPage from "@/pages/VacancyDetailsPage";
import EmployerVacanciesPage from "@/pages/EmployerVacanciesPage";
import VacancyEditPage from "@/pages/VacancyEditPage";
import EmployerApplicationsPage from "@/pages/EmployerApplicationsPage";
import ApplicantApplicationsPage from "@/pages/ApplicantApplicationsPage";
import CandidateSearchPage from "@/pages/CandidateSearchPage";
import CoursesPage from "@/pages/CoursesPage";
import CourseDetailsPage from "@/pages/CourseDetailsPage";
import LessonPage from "@/pages/LessonPage";
import CompaniesPage from "@/pages/CompaniesPage";
import CompanyProfilePage from "@/pages/CompanyProfilePage";
import CompanyEditPage from "@/pages/CompanyEditPage";

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
            path="/applications/my"
            element={
              <AuthGuard>
                <ApplicantApplicationsPage />
              </AuthGuard>
            }
          />

          {/* Course Routes */}
          <Route
            path="/courses"
            element={
              <AuthGuard>
                <CoursesPage />
              </AuthGuard>
            }
          />
          <Route
            path="/courses/:id"
            element={
              <AuthGuard>
                <CourseDetailsPage />
              </AuthGuard>
            }
          />
          <Route
            path="/courses/:id/lessons/:lessonId"
            element={
              <AuthGuard>
                <LessonPage />
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
            path="/employer/vacancies/new"
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
