"use client";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, ArrowUp, ArrowDown } from "lucide-react";

type SortDirection = "asc" | "desc";
type SortKey = "price" | "completeness" | "manufacturer" | "model_name" | "tracked_price" | "updatedAt";

interface Category {
  id: string;
  name: string;
}

interface ToolbarProps {
  categories: Category[];
  category: string;
  setCategory: (category: string) => void;
  q: string;
  setQ: (q: string) => void;
  sortKey: SortKey;
  setSortKey: (key: SortKey) => void;
  sortDir: SortDirection;
  setSortDir: (dir: SortDirection) => void;
}

export default function Toolbar({
  categories,
  category,
  setCategory,
  q,
  setQ,
  sortKey,
  setSortKey,
  sortDir,
  setSortDir,
}: ToolbarProps) {
  // Local state for smooth typing (Debounce logic ke liye)
  const [localSearch, setLocalSearch] = useState(q);

  // Jab user type karna band kare, tabhi main state update ho (500ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setQ(localSearch);
    }, 500);
    return () => clearTimeout(timer);
  }, [localSearch, setQ]);

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all">
      <div className="flex flex-1 items-center gap-3">
        {/* Category Filter */}
        <div className="w-48">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="rounded-2xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 shadow-none font-medium focus:ring-2 focus:ring-blue-500/20">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-xl">
              {categories.map((c: Category) => (
                <SelectItem key={c.id} value={c.id} className="rounded-xl cursor-pointer py-2.5">
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Search Input with Local State */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            className="pl-11 rounded-2xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 shadow-none focus-visible:ring-2 focus-visible:ring-blue-500/20 transition-all"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search by brand, model, or vendor..."
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Sort Key Selector */}
        <div className="w-56">
          <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
            <SelectTrigger className="rounded-2xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 shadow-none font-medium">
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="text-slate-400 font-normal text-xs uppercase whitespace-nowrap">Sort:</span>
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-xl">
              <SelectItem value="updatedAt" className="rounded-xl cursor-pointer">Last Updated</SelectItem>
              <SelectItem value="manufacturer" className="rounded-xl cursor-pointer">Manufacturer</SelectItem>
              <SelectItem value="model_name" className="rounded-xl cursor-pointer">Model Name</SelectItem>
              <SelectItem value="price" className="rounded-xl cursor-pointer">Sale Price</SelectItem>
              <SelectItem value="tracked_price" className="rounded-xl cursor-pointer">Live Tracked Price</SelectItem>
              <SelectItem value="completeness" className="rounded-xl cursor-pointer">Completeness</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Toggle Asc/Desc Button */}
        <Button
          variant="outline"
          className={`rounded-2xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 shadow-none hover:bg-white dark:hover:bg-slate-800 transition-all px-4 font-bold h-10 ${
            sortDir === "asc" ? "text-blue-600 border-blue-100 bg-blue-50/30" : "text-indigo-600 border-indigo-100 bg-indigo-50/30"
          }`}
          onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")}
        >
          {sortDir === "asc" ? (
            <ArrowUp className="mr-2 h-4 w-4 stroke-[3px]" />
          ) : (
            <ArrowDown className="mr-2 h-4 w-4 stroke-[3px]" />
          )}
          {sortDir.toUpperCase()}
        </Button>
      </div>
    </div>
  );
}