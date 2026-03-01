import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
// eslint-disable-next-line @typescript-eslint/no-require-imports
const currencyUtils = require("@/lib/currencyUtils") as { getCurrencyInfo: (loc: string) => { symbol: string } }

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Safe JSON parse for stringified arrays/objects. Returns fallback on invalid input. */
export function safeParseJson<T>(value: string | T | null | undefined, fallback: T): T {
  if (value == null) return fallback
  if (typeof value !== "string") return value as T
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? (parsed as T) : (typeof parsed === "object" && parsed !== null ? (parsed as T) : fallback)
  } catch {
    return fallback
  }
}

/** Format date to readable string (e.g. "Jan 15, 2025"). */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "N/A"
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

/** Tailwind class string for application status badge. */
export function getStatusColor(status: string | null | undefined): string {
  if (status === "Applied") return "bg-blue-500/10 text-blue-400 border-blue-500/20"
  if (status?.includes("Interview")) return "bg-purple-500/10 text-purple-400 border-purple-500/20"
  if (status?.includes("Offer") || status === "Accepted") return "bg-green-500/10 text-green-400 border-green-500/20"
  return "bg-red-500/10 text-red-400 border-red-500/20"
}

/** Format salary with currency from location. Uses currencyUtils for locale-aware symbol. */
export function formatSalary(salary: string | null | undefined, location?: string | null): string {
  if (!salary) return "Not specified"
  const existingSymbols = ["$", "€", "£", "¥", "₹", "₺", "Rp", "CHF", "kr", "zł", "AED"]
  for (const sym of existingSymbols) {
    if (String(salary).includes(sym)) return String(salary)
  }
  const { symbol } = currencyUtils.getCurrencyInfo(location ?? "")
  return `${symbol}${salary}`
}
