// components/ingestion/Header.tsx
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Cpu } from "lucide-react";

export default function Header() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm p-6 rounded-3xl shadow-lg border border-white/20">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-linear-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg">
            <Cpu className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-blue-600 dark:text-blue-400 leading-tight">
              XO Rig
            </h1>
            <p className="text-lg font-medium text-slate-600 dark:text-slate-300 mt-1">
              Data Ingestion Admin
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-2xl">
              Manage PC components, specifications, pricing, and compatibility
              rules
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="rounded-2xl px-4 py-2 text-xs font-semibold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
        >
          Admin Panel
        </Badge>
      </div>
    </div>
  );
}
