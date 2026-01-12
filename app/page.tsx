"use client";
import React, { useMemo, useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Database, Loader2 } from "lucide-react";
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
type SortKey = "price" | "completeness" | "manufacturer" | "model_name";
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
  specs?:
    | Record<string, unknown>
    | Record<
        string,
        {
          v: unknown;
          source_id?: string;
          confidence?: number;
          updated_at?: string;
        }
      >;
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
    op: "eq" | "lte" | "gte"; // Use the same OperatorType
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
  const [sortKey, setSortKey] = useState<SortKey>("manufacturer");
  const [sortDir, setSortDir] = useState<SortDirection>("asc");

  const [components, setComponents] = useState<ComponentData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const [selectedComponent, setSelectedComponent] =
    useState<ComponentData | null>(null);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [addModalOpen, setAddModalOpen] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [fetchingDetails, setFetchingDetails] = useState<boolean>(false);

  const [rules, setRules] = useState<RuleData[]>([]);

  const fetchComponents = useCallback(async () => {
    setLoading(true);
    try {
      // Convert category to API format - use the ID for API call
      const apiCategory = category === "All" ? undefined : category;
      const data = await api.getComponents(apiCategory, q);
      setComponents(data || []);
    } catch (error) {
      console.error("Fetch failed:", error);
    } finally {
      setLoading(false);
    }
  }, [category, q]);

  // ✅ New function to fetch rules
  const fetchRules = useCallback(async () => {
    try {
      const data = await api.getRules();
      // Transform backend rules to UI friendly format if needed
      const uiRules: RuleData[] = data.map((r: unknown) => {
        const rule = r as Record<string, unknown>;
        return {
          id: rule.id as string,
          name: rule.name as string,
          severity: (rule.severity as string) || "warn",
          message: rule.message as string,
          appliesTo: rule.appliesTo as string[],
          logic: rule.logic as Record<string, unknown>,
          isActive: Boolean(rule.isActive),
          // Simple extraction of logic for UI binding (assuming simple EQ logic for now)
          expr: {
            op: "eq" as const, // Use OperatorType
            left:
              (
                (rule.logic as Record<string, unknown>)?.["=="] as Array<{
                  var: string;
                }>
              )?.[0]?.var || "",
            right:
              (
                (rule.logic as Record<string, unknown>)?.["=="] as Array<{
                  var: string;
                }>
              )?.[1]?.var || "",
          },
          applies: Array.isArray(rule.appliesTo)
            ? (rule.appliesTo as string[]).join(", ")
            : "",
        };
      });
      setRules(uiRules);
    } catch (error) {
      console.error("Error fetching rules:", error);
      setRules([]);
    }
  }, []);

  const handleDelete = useCallback(
    async (componentId: string) => {
      try {
        await api.deleteComponent(componentId);
        toast({
          title: "Success",
          description: "Component deleted successfully",
        });
        fetchComponents(); // Refresh the list
      } catch (error) {
        console.error("Error deleting component:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete component",
        });
      }
    },
    [fetchComponents, toast]
  );

  useEffect(() => {
    setMounted(true);
    fetchComponents();
    fetchRules(); // ✅ Added: Fetch Rules on mount
  }, [fetchComponents, fetchRules]);

  useEffect(() => {
    if (mounted) fetchComponents();
  }, [mounted, fetchComponents]);

  // Create categories array with All option plus component types
  const categories = [{ id: "All", name: "All" }, ...COMPONENT_TYPES];

  const tableColumns = useMemo(() => {
    return [
      { key: "type", label: "Type" },
      { key: "manufacturer", label: "Manufacturer" },
      { key: "model_name", label: "Model Name" },
      { key: "model_number", label: "Model Number" },
      { key: "price", label: "Price" },
      { key: "discounted_price", label: "Discounted Price" },
      { key: "tracked_price", label: "Tracked Price" },
      { key: "vendor", label: "Vendor" },
      { key: "updatedAt", label: "Last Update" },
    ];
  }, []);

  // Format rows for display with new pricing structure
 // Isko replace karo
// Isko replace karo (Line 185 ke paas)
const formattedRows = useMemo(() => {
  return components.map((c) => {
    return {
      ...c,
      name: `${c.manufacturer} ${c.model_name}`.trim(),
      // Strictly number ya null ensure karo
      tracked_price: typeof c.tracked_price === 'number' ? c.tracked_price : (Number(c.tracked_price) || 0),
      updatedAt: c.updatedAt || "—",
    };
  });
}, [components]);

  async function openDrawer(row: ComponentData) {
    if (!row.id) return; // Skip if no ID
    setFetchingDetails(true);
    try {
      const fullData = await api.getComponentById(row.id);
      setSelectedComponent(fullData);
      setIsCreating(false);
      setDrawerOpen(true);
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch details.",
      });
    } finally {
      setFetchingDetails(false);
    }
  }

  function handleNewComponent() {
    setAddModalOpen(true);
  }

  async function handleDrawerSave(data: ComponentData) {
    try {
      if (isCreating) {
        await api.addComponent(data);
        toast({
          title: "Created",
          description: "New component added successfully.",
        });
      } else if (data.id) {
        await api.updateComponent(data.id, data);
        toast({
          title: "Saved",
          description: "Component updated successfully.",
        });
      }
      setDrawerOpen(false);
      fetchComponents();
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { error?: string } };
        message?: string;
      };
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error.response?.data?.error || error.message || "Failed to save.",
      });
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
              <TabsTrigger
                value="components"
                className="rounded-xl px-6 data-[state=active]:bg-linear-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white font-medium transition-all"
              >
                Components
              </TabsTrigger>
              <TabsTrigger
                value="rules"
                className="rounded-xl px-6 data-[state=active]:bg-linear-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white font-medium transition-all"
              >
                Rules
              </TabsTrigger>
              <TabsTrigger
                value="sources"
                className="rounded-xl px-6 data-[state=active]:bg-linear-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white font-medium transition-all"
              >
                Sources
              </TabsTrigger>
            </TabsList>

            <div className="flex gap-3">
              {tab === "components" && (
                <Button
                  className="rounded-2xl bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all font-medium cursor-pointer text-white"
                  onClick={handleNewComponent}
                >
                  <Plus className="mr-2 h-4 w-4" /> New Component
                </Button>
              )}
            </div>
          </div>

          <TabsContent value="components" className="mt-6">
            <Card className="rounded-3xl shadow-xl border-white/20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
              <CardContent className="p-6 md:p-8">
                <Toolbar
                  categories={categories}
                  category={category}
                  setCategory={setCategory}
                  q={q}
                  setQ={setQ}
                  sortKey={sortKey}
                  setSortKey={setSortKey}
                  sortDir={sortDir}
                  setSortDir={setSortDir}
                />

                <div className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm bg-white dark:bg-slate-900 min-h-100">
                  {loading ? (
                    <div className="flex items-center justify-center h-100 py-20">
                      <div className="text-center space-y-4">
                        <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto" />
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                          Loading components...
                        </p>
                      </div>
                    </div>
                  ) : (
                    <GridTable
                      columns={tableColumns}
                      rows={formattedRows}
                      category={category}
                      onRowClick={(row) => openDrawer(row as ComponentData)}
                      onQuickEdit={() => {}}
                      onDelete={handleDelete}
                    />
                  )}
                </div>

                <div className="mt-6 flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <Database className="h-5 w-5 text-blue-600" />
                  <span>
                    Showing{" "}
                    <span className="text-blue-600 font-bold">
                      {formattedRows.length}
                    </span>{" "}
                    results
                  </span>
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
                toast({
                  title: "Success",
                  description: "Component created successfully",
                });
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
