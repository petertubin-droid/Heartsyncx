import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** shadcn/ui class merger (components.json alias: @/lib/utils).
 *  tailwind-merge lets per-usage brand classes (bg-rose-500, rounded-lg, ...)
 *  override the design-system defaults while conflicts resolve cleanly. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
