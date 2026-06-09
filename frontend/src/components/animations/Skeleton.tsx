import React from "react";

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = "" }) => (
  <div
    className={`animate-shimmer rounded-lg bg-gradient-to-r from-primary-100 via-white to-primary-100 bg-[length:1000px_100%] motion-reduce:animate-pulse-soft ${className}`}
  />
);

export const SkeletonCard: React.FC<SkeletonProps> = ({ className = "" }) => (
  <div
    className={`rounded-2xl border border-primary-100 bg-white p-6 shadow-sm ${className}`}
  >
    <div className="flex items-center gap-3 mb-4">
      <Skeleton className="h-10 w-10 rounded-xl" />
      <Skeleton className="h-5 w-2/5" />
    </div>
    <Skeleton className="h-4 w-full mb-2" />
    <Skeleton className="h-4 w-4/5 mb-2" />
    <Skeleton className="h-4 w-3/5" />
  </div>
);

interface SkeletonGridProps {
  count?: number;
  className?: string;
}

export const SkeletonGrid: React.FC<SkeletonGridProps> = ({
  count = 3,
  className = "grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
}) => (
  <div className={className}>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);
