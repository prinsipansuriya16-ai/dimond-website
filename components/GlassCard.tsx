"use client";

import { ReactNode } from "react";
import clsx from "clsx";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export default function GlassCard({
  children,
  className,
  hover = true
}: GlassCardProps) {
  return (
    <div
      className={clsx(
        "glass-panel rounded-2xl shadow-glass transition-all duration-500",
        hover && "hover:shadow-gold hover:border-imperial/50 hover:-translate-y-1",
        className
      )}
    >
      {children}
    </div>
  );
}
