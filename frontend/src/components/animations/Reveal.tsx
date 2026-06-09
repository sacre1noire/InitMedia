import React from "react";
import { motion } from "framer-motion";

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  once?: boolean;
}

export const Reveal: React.FC<RevealProps> = ({
  children,
  className,
  delay = 0,
  y = 24,
  once = true,
}) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once, amount: 0.2 }}
    transition={{ duration: 0.5, delay, ease: "easeOut" }}
  >
    {children}
  </motion.div>
);

interface RevealStaggerProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export const RevealStagger: React.FC<RevealStaggerProps> = ({
  children,
  className,
  delay = 0,
}) => (
  <motion.div
    className={className}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, amount: 0.15 }}
    variants={{
      hidden: {},
      visible: {
        transition: { staggerChildren: 0.08, delayChildren: delay },
      },
    }}
  >
    {children}
  </motion.div>
);
