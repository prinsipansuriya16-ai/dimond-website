'use client';

import React, { ReactNode } from "react";
import { motion, HTMLMotionProps } from "framer-motion";

interface GoldButtonProps extends HTMLMotionProps<"button"> {
  children: ReactNode;
  variant?: "solid" | "outline";
}

export default function GoldButton({
  children,
  onClick,
  className = "",
  type = "button",
  disabled,
  variant = "solid",
  ...rest
}: GoldButtonProps) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? undefined : { scale: 1.06 }}
      whileTap={disabled ? undefined : { scale: 0.95 }}
      className={`relative inline-flex items-center justify-center px-10 py-4 font-bold tracking-widest rounded-full cursor-pointer transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      style={
        variant === "outline"
          ? {
              zIndex: 99,
              background: "transparent",
              color: "#D4AF37",
              border: "1px solid rgba(212,175,55,.55)",
              boxShadow: "0 0 18px rgba(212,175,55,.15)"
            }
          : {
              zIndex: 99,
              background: "linear-gradient(135deg, #FFD700 0%, #D4AF37 50%, #B8860B 100%)",
              color: "#000000",
              border: "2px solid #FFFFFF",
              boxShadow: "0 0 25px rgba(212, 175, 55, 0.8), 0 10px 25px rgba(0, 0, 0, 0.8)"
            }
      }
      {...rest}
    >
      <span className="relative z-10 flex items-center gap-2 text-sm md:text-base font-extrabold uppercase text-black drop-shadow-none">
        {children}
        {variant === "solid" && <span className="text-lg">→</span>}
      </span>
    </motion.button>
  );
}