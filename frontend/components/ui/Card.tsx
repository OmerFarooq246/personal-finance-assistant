import type { ReactNode } from "react";
import { cn } from "@/lib/finance";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className }: CardProps) {
  return <section className={cn("finance-card", className)}>{children}</section>;
}

