import React from "react";
import { Link } from "react-router-dom";
import { Course } from "@/types/course";
import { Clock, Book } from "lucide-react";

interface CourseCardProps {
  course: Course;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  return (
    <Link to={`/courses/${course.id}`} className="block group">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-shadow hover:shadow-md">
        <div className="aspect-w-16 aspect-h-9 bg-gray-100 relative">
          {course.cover_url ? (
            <img
              src={course.cover_url}
              alt={course.title}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="flex items-center justify-center h-48 bg-gray-200">
              <Book className="w-12 h-12 text-gray-400" />
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="flex items-center text-xs text-gray-500 mb-2">
            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded mr-2">
              {course.specializations?.[0] || "General"}
            </span>
            <div className="flex items-center">
              <Clock size={14} className="mr-1" />
              {Math.floor(course.duration_minutes / 60)}ч{" "}
              {course.duration_minutes % 60}м
            </div>
          </div>
          <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary-600 mb-1 line-clamp-2">
            {course.title}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-2 mb-4">
            {course.description}
          </p>
        </div>
      </div>
    </Link>
  );
};
