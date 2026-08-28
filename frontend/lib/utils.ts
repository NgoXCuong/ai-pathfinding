import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatMs(ms: number): string {
  if (ms < 0.01) return "< 0.01 ms";
  if (ms < 1) return `${ms.toFixed(2)} ms`;
  if (ms < 1000) return `${ms.toFixed(1)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

export function formatNumber(num: number, maxDecimals: number = 1): string {
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: maxDecimals }).format(num);
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${meters.toFixed(0)} m`;
  return `${(meters / 1000).toFixed(2)} km`;
}

export const CELL_COLORS = {
  empty: "#ffffff",
  start: "#10b981", // emerald-500
  goal: "#ef4444", // red-500
  obstacle: "#94a3b8", // slate-400
  visited: "#93c5fd", // blue-300
  path: "#a855f7", // purple-500
};

export function formatTimeAgo(dateStr: string) {
  // Fix timezone issue: append Z if no timezone info is present so it's treated as UTC
  let parsedStr = dateStr;
  if (!parsedStr.endsWith("Z") && !parsedStr.includes("+", 10)) {
    parsedStr = parsedStr.replace(" ", "T");
    if (!parsedStr.endsWith("Z")) parsedStr += "Z";
  }
  
  const diffMs = Date.now() - new Date(parsedStr).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return "Vừa xong";
  if (diffMins < 60) return `${diffMins} phút trước`;
  const h = Math.floor(diffMins / 60);
  if (h < 24) return `${h} giờ trước`;
  return `${Math.floor(h / 24)} ngày trước`;
}
