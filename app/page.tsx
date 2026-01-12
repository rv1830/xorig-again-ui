"use client";
import React, { useMemo, useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Database, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

import { api } from "@/lib/api";
import { COMPONENT_TYPES } from "@/lib/constants";

import Header from "@/components/ingestion/Header";
import Toolbar from "@/components/ingestion/Toolbar";
import GridTable from "@/components/ingestion/GridTable";
import AddComponentModal from "@/components/ingestion/AddComponentModal";
import DetailsDrawer from "@/components/ingestion/DetailsDrawer";
import RulesPanel from "@/components/ingestion/RulesPanel";
import SourcesPanel from "@/components/ingestion/SourcesPanel";

// Type definitions
type SortKey = "price" | "completeness" | "manufacturer" | "model_name" | "tracked_price" | "updatedAt";
type SortDirection = "asc" | "desc";

interface ComponentData {
  id?: string;
  component_id?: string;
  type: string;
  manufacturer: string;
  vendor?: string;
  model_name: string;
  model_number: string;
  product_page_url?: string;
  price?: number;
  discounted_price?: number;
  image_url?: string;
  updatedAt?: string;
  specs?: Record<string, any>;
  compatibility?: Record<string, unknown>;
  offers?: Array<{ price: number; vendor?: string; url?: string }>;
  [key: string]: unknown;
}

interface RuleData {
  id: string;
  name: string;
  severity: "error" | "warn" | "info";
  message: string;
  appliesTo?: string[];
  applies?: string;
  logic?: Record<string, unknown>;
  isActive: boolean;
  expr?: {
    op: "eq" | "lte" | "gte";
    left: string;
    right: string;
  };
}

export default function XORigIngestionAdmin() {
  const [mounted, setMounted] = useState<boolean>(false);
  const { toast } = useToast();

  const [tab, setTab] = useState<string>("components");
  const [category, setCategory] = useState<string>("All");
  const [q, setQ] = useState<string>("");
  const [sortKey, setSortKey] = useState<SortKey>("updatedAt");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");

  // Pagination State
  const [page, setPage] = useState<number>(1);
  const [meta, setMeta] = useState({ totalItems: 0, totalPages: 1, currentPage: 1 });

  const [components, setComponents] = useState<ComponentData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const [selectedComponent, setSelectedComponent] = useState<ComponentData | null>(null);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [addModalOpen, setAddModalOpen] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [fetchingDetails, setFetchingDetails] = useState<boolean>(false);

  const [rules, setRules] = useState<RuleData[]>([]);

  // Fixed: Stabilized fetch function
  const fetchComponents = useCallback(async () => {
    setLoading(true);
    try {
      const apiCategory = category === "All" ? undefined : category;
      const response = await api.getComponents(apiCategory, q, page, 20, sortKey, sortDir);
      
      if (response && response.data) {
        setComponents(response.data);
        setMeta(response.meta || { totalItems: 0, totalPages: 1, currentPage: 1 });
      }
    } catch (error) {
      console.error("Fetch failed:", error);
    } finally {
      setLoading(false);
    }
  }, [category, q, page, sortKey, sortDir]);

  const fetchRules = useCallback(async () => {
    try {
      const data = await api.getRules();
      const uiRules: RuleData[] = data.map((r: any) => ({
        id: r.id,
        name: r.name,
        severity: r.severity || "warn",
        message: r.message,
        appliesTo: r.appliesTo,
        logic: r.logic,
        isActive: Boolean(r.isActive),
        expr: {
          op: "eq",
          left: r.logic?.["=="]?.[0]?.var || "",
          right: r.logic?.["=="]?.[1]?.var || "",
        },
        applies: Array.isArray(r.appliesTo) ? r.appliesTo.join(", ") : "",
      }));
      setRules(uiRules);
    } catch (error) {
      console.error("Error fetching rules:", error);
    }
  }, []);

  const handleDelete = useCallback(async (componentId: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      await api.deleteComponent(componentId);
      toast({ title: "Success", description: "Deleted successfully" });
      fetchComponents();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Delete failed" });
    }
  }, [fetchComponents, toast]);

  // Set mounted once
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fixed: Loop prevention logic
  useEffect(() => {
    if (mounted) {
      const timeoutId = setTimeout(() => {
        fetchComponents();
      }, 50); // Small delay to debounce rapid state changes
      return () => clearTimeout(timeoutId);
    }
  }, [fetchComponents, mounted]);

  // Fetch rules only when tab changes
  useEffect(() => {
    if (mounted && tab === "rules") fetchRules();
  }, [tab, mounted, fetchRules]);

  // Reset page to 1 when filters/sort change
  useEffect(() => {
    setPage(1);
  }, [category, q, sortKey, sortDir]);

  const categories = [{ id: "All", name: "All" }, ...COMPONENT_TYPES];

  const tableColumns = useMemo(() => [
    { key: "type", label: "Type" },
    { key: "manufacturer", label: "Manufacturer" },
    { key: "model_name", label: "Model Name" },
    { key: "model_number", label: "Model Number" },
    { key: "price", label: "Price" },
    { key: "discounted_price", label: "Discounted Price" },
    { key: "tracked_price", label: "Tracked Price" },
    { key: "vendor", label: "Vendor" },
    { key: "updatedAt", label: "Last Update" },
  ], []);

  const formattedRows = useMemo(() => {
    return components.map((c) => ({
      ...c,
      name: `${c.manufacturer} ${c.model_name}`.trim(),
      tracked_price: typeof c.tracked_price === 'number' ? c.tracked_price : (Number(c.tracked_price) || 0),
      updatedAt: c.updatedAt || "—",
    }));
  }, [components]);

  async function openDrawer(row: ComponentData) {
    if (!row.id) return;
    setFetchingDetails(true);
    try {
      const fullData = await api.getComponentById(row.id);
      setSelectedComponent(fullData);
      setIsCreating(false);
      setDrawerOpen(true);
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch details." });
    } finally {
      setFetchingDetails(false);
    }
  }

  async function handleDrawerSave(data: ComponentData) {
    try {
      if (isCreating) {
        await api.addComponent(data);
        toast({ title: "Created", description: "Success" });
      } else if (data.id) {
        await api.updateComponent(data.id, data);
        toast({ title: "Saved", description: "Success" });
      }
      setDrawerOpen(false);
      fetchComponents();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save" });
    }
  }

  if (!mounted) return null;

  return (
    <div className="min-h-screen w-full bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {fetchingDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-2xl">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl p-4 md:p-8">
        <Header />

        <Tabs value={tab} onValueChange={setTab} className="mt-8">
          <div className="flex items-center justify-between gap-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm p-4 rounded-3xl shadow-lg border border-white/20">
            <TabsList className="bg-white dark:bg-slate-800 shadow-md rounded-2xl p-1.5">
              <TabsTrigger value="components" className="rounded-xl px-6 data-[state=active]:bg-blue-600 data-[state=active]:text-white font-medium transition-all">
                Components
              </TabsTrigger>
              <TabsTrigger value="rules" className="rounded-xl px-6 data-[state=active]:bg-blue-600 data-[state=active]:text-white font-medium transition-all">
                Rules
              </TabsTrigger>
              <TabsTrigger value="sources" className="rounded-xl px-6 data-[state=active]:bg-blue-600 data-[state=active]:text-white font-medium transition-all">
                Sources
              </TabsTrigger>
            </TabsList>

            <Button
              className="rounded-2xl bg-blue-600 hover:bg-blue-700 shadow-lg transition-all font-medium text-white"
              onClick={() => { setIsCreating(true); setAddModalOpen(true); }}
            >
              <Plus className="mr-2 h-4 w-4" /> New Component
            </Button>
          </div>

          <TabsContent value="components" className="mt-6">
            <Card className="rounded-3xl shadow-xl border-white/20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
              <CardContent className="p-6 md:p-8">
                <Toolbar
                  categories={categories}
                  category={category} setCategory={setCategory}
                  q={q} setQ={setQ}
                  sortKey={sortKey} setSortKey={setSortKey}
                  sortDir={sortDir} setSortDir={setSortDir}
                />

                <div className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm bg-white dark:bg-slate-900 min-h-100">
                  {loading ? (
                    <div className="flex items-center justify-center h-100 py-20">
                      <div className="text-center space-y-4">
                        <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto" />
                        <p className="text-sm text-slate-500 font-medium">Loading components...</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <GridTable
                        columns={tableColumns}
                        rows={formattedRows}
                        category={category}
                        onRowClick={(row) => openDrawer(row as ComponentData)}
                        onQuickEdit={() => {}} 
                        onDelete={handleDelete}
                      />
                      
                      {/* PAGINATION CONTROLS */}
                      <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
                        <div className="text-sm text-slate-500 font-medium">
                          Showing <span className="text-blue-600">{formattedRows.length}</span> of <span className="text-blue-600">{meta.totalItems}</span> results
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline" size="sm" className="rounded-xl cursor-pointer"
                            disabled={page <= 1}
                            onClick={() => setPage(p => p - 1)}
                          >
                            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                          </Button>
                          <div className="text-sm font-bold px-4">
                            Page {meta.currentPage} of {meta.totalPages}
                          </div>
                          <Button
                            variant="outline" size="sm" className="rounded-xl cursor-pointer"
                            disabled={page >= meta.totalPages}
                            onClick={() => setPage(p => p + 1)}
                          >
                            Next <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-6 flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <Database className="h-5 w-5 text-blue-600" />
                  <span>Database Status: Active Sync</span>
                </div>
              </CardContent>
            </Card>

            <DetailsDrawer
              open={drawerOpen}
              onOpenChange={setDrawerOpen}
              component={selectedComponent}
              isCreating={isCreating}
              onSave={handleDrawerSave}
            />

            <AddComponentModal
              isOpen={addModalOpen}
              onClose={() => setAddModalOpen(false)}
              onSuccess={() => {
                setAddModalOpen(false);
                fetchComponents();
                toast({ title: "Success", description: "Created successfully" });
              }}
            />
          </TabsContent>

          <TabsContent value="rules">
            <RulesPanel rules={rules} setRules={setRules} />
          </TabsContent>
          <TabsContent value="sources">
            <SourcesPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}