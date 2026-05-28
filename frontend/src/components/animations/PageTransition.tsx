import React from "react";
import { motion } from "framer-motion";

interface PageTransitionProps {
  children: React.ReactNode;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.25, ease: "easeOut" }}
  >
    {children}
  </motion.div>
);

interface StaggerListProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export const StaggerList: React.FC<StaggerListProps> = ({
  children,
  className,
  delay = 0,
}) => (
  <motion.div
    className={className}
    initial="hidden"
    animate="visible"
    variants={{
      hidden: {},
      visible: {
        transition: { staggerChildren: 0.05, delayChildren: delay },
      },
    }}
  >
    {children}
  </motion.div>
);

interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
}

export const StaggerItem: React.FC<StaggerItemProps> = ({
  children,
  className,
}) => (
  <motion.div
    className={className}
    variants={{
      hidden: { opacity: 0, y: 12 },
      visible: { opacity: 1, y: 0 },
    }}
    transition={{ duration: 0.3, ease: "easeOut" }}
  >
    {children}
  </motion.div>
);

interface MotionCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverEffect?: boolean;
}

export const MotionCard: React.FC<MotionCardProps> = ({
  children,
  className,
  onClick,
  hoverEffect = true,
}) => (
  <motion.div
    className={className}
    onClick={onClick}
    whileHover={hoverEffect ? { y: -2, transition: { duration: 0.2 } } : undefined}
    whileTap={onClick ? { scale: 0.99 } : undefined}
  >
    {children}
  </motion.div>
);
