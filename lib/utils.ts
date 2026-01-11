import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { SOURCES, VENDORS } from "./constants";

/**
 * Merges Tailwind classes safely
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number as Indian Rupee currency
 */
export const fmtINR = (n: number | string | null | undefined) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);

/**
 * Converts string to Title Case
 */
export const toTitle = (s: string | null | undefined) =>
  (s || "").replace(/\b\w/g, (c: string) => c.toUpperCase());

export function sourceName(source_id: string | null | undefined) {
  return SOURCES.find((x) => x.id === source_id)?.name || source_id;
}

export function vendorName(vendor_id: string | null | undefined) {
  return VENDORS.find((x) => x.id === vendor_id)?.name || vendor_id;
}

export function trustScore(vendor_id: string | null | undefined) {
  return VENDORS.find((x) => x.id === vendor_id)?.trust ?? 0;
}

export function bestOffer(
  offers:
    | Array<{ in_stock: boolean; effective_price_inr?: number }>
    | null
    | undefined
) {
  if (!offers?.length) return null;
  const inStock = offers.filter((o) => o.in_stock);
  const list = inStock.length ? inStock : offers;
  // Sort by price ascending (cheapest first)
  return [...list].sort(
    (a, b) => (a.effective_price_inr ?? 1e18) - (b.effective_price_inr ?? 1e18)
  )[0];
}
