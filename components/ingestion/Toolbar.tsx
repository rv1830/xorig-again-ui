// components/ingestion/Toolbar.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, ArrowUpDown } from "lucide-react";

// Type definitions
type SortDirection = "asc" | "desc";
type SortKey = "price" | "completeness" | "manufacturer" | "model_name";

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
  setSortDir: (
    dir: SortDirection | ((prev: SortDirection) => SortDirection)
  ) => void;
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
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
      <div className="flex flex-1 items-center gap-3">
        <div className="w-48">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="rounded-xl border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 shadow-sm">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {categories.map((c: Category) => (
                <SelectItem key={c.id} value={c.id} className="rounded-lg">
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            className="pl-12 rounded-xl border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by manufacturer, model name, or model number..."
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-48">
          <Select value={sortKey} onValueChange={setSortKey}>
            <SelectTrigger className="rounded-xl border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 shadow-sm">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="price" className="rounded-lg">
                Price
              </SelectItem>
              <SelectItem value="completeness" className="rounded-lg">
                Completeness
              </SelectItem>
              <SelectItem value="manufacturer" className="rounded-lg">
                Manufacturer
              </SelectItem>
              <SelectItem value="model_name" className="rounded-lg">
                Model Name
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="outline"
          className="rounded-xl border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800"
          onClick={() =>
            setSortDir((d: SortDirection) => (d === "asc" ? "desc" : "asc"))
          }
        >
          <ArrowUpDown className="mr-2 h-4 w-4" />
          {sortDir === "asc" ? "Ascending" : "Descending"}
        </Button>
      </div>
    </div>
  );
}
