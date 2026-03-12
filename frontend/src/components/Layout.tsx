import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/auth"; // Import UserRole
import {
  User,
  Menu,
  X,
  Briefcase,
  FileText,
  CheckCircle,
  Search,
  PlusCircle,
  BookOpen,
} from "lucide-react";

export const Layout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { logout, user } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link to="/" className="flex-shrink-0 flex items-center">
                <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent">
                  InitMedia
                </span>
              </Link>

              {/* Desktop Menu */}
              <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
                {user?.role === UserRole.APPLICANT && (
                  <>
                    <Link
                      to="/vacancies?type=vacancy"
                      className="nav-link flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300"
                    >
                      <Briefcase className="w-4 h-4 mr-2" /> Вакансии
                    </Link>
                    <Link
                      to="/vacancies?type=internship"
                      className="nav-link flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300"
                    >
                      <FileText className="w-4 h-4 mr-2" /> Стажировки
                    </Link>
                    <Link
                      to="/applications/my"
                      className="nav-link flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" /> Мои отклики
                    </Link>
                    <Link
                      to="/courses"
                      className="nav-link flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300"
                    >
                      <BookOpen className="w-4 h-4 mr-2" /> Обучение
                    </Link>
                  </>
                )}

                {user?.role === UserRole.EMPLOYER && (
                  <>
                    <Link
                      to="/employer/vacancies"
                      className="nav-link flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300"
                    >
                      <Briefcase className="w-4 h-4 mr-2" /> Мои вакансии
                    </Link>
                    <Link
                      to="/employer/applications"
                      className="nav-link flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300"
                    >
                      <FileText className="w-4 h-4 mr-2" /> Отклики
                    </Link>
                    <Link
                      to="/employer/candidates"
                      className="nav-link flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300"
                    >
                      <Search className="w-4 h-4 mr-2" /> Кандидаты
                    </Link>
                  </>
                )}
              </div>
            </div>

            <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
              {user?.role === UserRole.EMPLOYER && (
                <Link
                  to="/employer/vacancies/new"
                  className="bg-primary-600 text-white px-3 py-1.5 rounded-md text-sm hover:bg-primary-700 flex items-center"
                >
                  <PlusCircle className="w-4 h-4 mr-1" /> Создать
                </Link>
              )}
              <div className="relative group">
                <button className="flex items-center space-x-2 text-sm text-gray-700 hover:text-primary-600">
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                    <User className="w-5 h-5" />
                  </div>
                  <span className="font-medium">{user?.email}</span>
                </button>
                <div className="absolute right-0 w-48 mt-2 origin-top-right bg-white border border-gray-100 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="py-1">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Профиль
                    </Link>
                    <button
                      onClick={logout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Выйти
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="-mr-2 flex items-center sm:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
              >
                {isMenuOpen ? (
                  <X className="block h-6 w-6" />
                ) : (
                  <Menu className="block h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="sm:hidden bg-white border-b border-gray-200">
            <div className="pt-2 pb-3 space-y-1">
              <Link
                to="/"
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  isActive("/")
                    ? "bg-primary-50 border-primary-500 text-primary-700"
                    : "border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
                }`}
              >
                Вакансии
              </Link>
              <Link
                to="/internships"
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  isActive("/internships")
                    ? "bg-primary-50 border-primary-500 text-primary-700"
                    : "border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
                }`}
              >
                Стажировки
              </Link>
              <Link
                to="/profile"
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  isActive("/profile")
                    ? "bg-primary-50 border-primary-500 text-primary-700"
                    : "border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
                }`}
              >
                Профиль
              </Link>
              <button
                onClick={logout}
                className="block w-full text-left pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-red-600 hover:bg-red-50 hover:border-red-300"
              >
                Выйти
              </button>
            </div>
          </div>
        )}
      </nav>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            &copy; 2026 InitMedia. Платформа для развития карьеры в медиа.
          </p>
        </div>
      </footer>
    </div>
  );
};
