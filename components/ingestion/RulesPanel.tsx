import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Save, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api"; // Ensure api is imported
import { useToast } from "@/components/ui/use-toast";

// Type definitions
type SeverityType = "error" | "warn" | "info";
type OperatorType = "eq" | "lte" | "gte";

interface RuleExpression {
  op: OperatorType;
  left: string;
  right: string;
}

interface Rule {
  id: string;
  name: string;
  severity: SeverityType;
  message: string;
  appliesTo?: string[];
  applies?: string; // UI-only field for editing
  logic?: Record<string, unknown>;
  isActive: boolean;
  expr?: RuleExpression;
}

interface FieldProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
}

interface RulesPanelProps {
  rules: Rule[];
  setRules: React.Dispatch<React.SetStateAction<Rule[]>>;
}

const severityBadge = (s: SeverityType) => {
  if (s === "error") return <Badge variant="destructive">Error</Badge>;
  if (s === "warn") return <Badge variant="secondary">Warn</Badge>;
  return <Badge variant="outline">Info</Badge>;
};

function Field({ label, hint, children }: FieldProps) {
  return (
    <div className="space-y-1">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div>{children}</div>
      {hint ? (
        <div className="text-[11px] text-muted-foreground">{hint}</div>
      ) : null}
    </div>
  );
}

export default function RulesPanel({ rules = [], setRules }: RulesPanelProps) {
  const { toast } = useToast();
  // Ensure we use the correct ID field from backend (usually 'id')
  const [selected, setSelected] = useState<string | null>(
    rules && rules.length > 0 ? rules[0]?.id ?? null : null
  );
  const [loading, setLoading] = useState<boolean>(false);

  const sel = useMemo(
    () =>
      rules && rules.length > 0
        ? rules.find((r: Rule) => r.id === selected) ?? null
        : null,
    [rules, selected]
  );

  // --- API HANDLERS ---

  // 1. Create Rule
  async function handleAdd() {
    setLoading(true);
    try {
      // Default template for new rule
      const defaultRule: Omit<Rule, "id"> = {
        name: "New Rule",
        severity: "warn",
        message: "Validation failed",
        appliesTo: ["CPU", "MOTHERBOARD"],
        logic: { "==": [{ var: "cpu.socket" }, { var: "motherboard.socket" }] },
        isActive: true,
      };

      const newRule = await api.createRule(defaultRule);

      // Map backend response to UI format if needed
      const uiRule: Rule = {
        ...newRule,
        // Pre-fill UI expression state from the default logic
        expr: { op: "eq", left: "cpu.socket", right: "motherboard.socket" },
        applies: Array.isArray(newRule.appliesTo)
          ? newRule.appliesTo.join(", ")
          : "",
      };

      setRules([uiRule, ...(rules || [])]);
      setSelected(newRule.id);
      toast({ title: "Rule Created" });
    } catch {
      toast({
        variant: "destructive",
        title: "Failed",
        description: "Could not create rule",
      });
    } finally {
      setLoading(false);
    }
  }

  // 2. Delete Rule
  async function handleDelete(id: string) {
    if (!confirm("Are you sure?")) return;
    setLoading(true);
    try {
      await api.deleteRule(id);
      setRules((rules || []).filter((r: Rule) => r.id !== id));
      if (selected === id) setSelected(null);
      toast({ title: "Deleted", description: "Rule removed successfully" });
    } catch {
      toast({
        variant: "destructive",
        title: "Failed",
        description: "Could not delete rule",
      });
    } finally {
      setLoading(false);
    }
  }

  // 3. Save / Update Rule
  async function handleSave() {
    if (!sel) return;
    setLoading(true);

    // Transform UI State -> Backend JSON Logic
    let operator = "==";
    if (sel.expr?.op === "lte") operator = "<=";
    if (sel.expr?.op === "gte") operator = ">=";

    const logicPayload = {
      [operator]: [
        { var: sel.expr?.left || "" },
        { var: sel.expr?.right || "" },
      ],
    };

    const payload = {
      name: sel.name,
      severity: sel.severity,
      message: sel.message,
      // Convert string "CPU, GPU" -> ["CPU", "GPU"]
      appliesTo:
        typeof sel.applies === "string"
          ? sel.applies.split(",").map((s: string) => s.trim())
          : sel.appliesTo || [],
      logic: logicPayload,
      isActive: sel.isActive ?? true,
    };

    try {
      // If update endpoint exists: await api.updateRule(sel.id, payload);
      // For now, assume update capability or simulation:
      // await api.updateRule(sel.id, payload);
      console.log(
        "Saving Rule Payload (Update Not Implemented on Backend yet):",
        payload
      );

      // Optimistically update local state
      setRules((prev: Rule[]) =>
        prev.map((r: Rule) =>
          r.id === sel.id ? { ...r, ...payload, applies: sel.applies } : r
        )
      );

      toast({ title: "Saved", description: "Rule logic updated." });
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save",
      });
    } finally {
      setLoading(false);
    }
  }

  // Helper to toggle active status locally (and ideally via API)
  function toggleEnabled(id: string) {
    const rule = (rules || []).find((r: Rule) => r.id === id);
    if (rule) {
      // In real app, call api.updateRule(id, { isActive: !rule.isActive })
      setRules((prev: Rule[]) =>
        (prev || []).map((r: Rule) =>
          r.id === id ? { ...r, isActive: !r.isActive } : r
        )
      );
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="rounded-3xl shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="font-semibold">Rules</div>
            <Button
              className="rounded-2xl h-8"
              onClick={handleAdd}
              disabled={loading}
            >
              <Plus className="mr-2 h-4 w-4" /> Add
            </Button>
          </div>

          <div className="mt-3 space-y-2 max-h-150 overflow-auto">
            {(rules || []).map((r: Rule, index: number) => (
              <button
                key={r.id || `rule-${index}`}
                className={`w-full rounded-2xl border p-3 text-left hover:bg-muted/30 ${
                  selected === r.id ? "bg-muted/40 border-primary/50" : ""
                }`}
                onClick={() => setSelected(r.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium truncate">
                    {r.name || "Unnamed Rule"}
                  </div>
                  <div className="flex items-center gap-2">
                    {severityBadge(r.severity || "info")}
                    <Badge
                      variant={r.isActive ? "outline" : "secondary"}
                      className="rounded-2xl text-[10px]"
                    >
                      {r.isActive ? "Active" : "Disabled"}
                    </Badge>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-1 truncate">
                  {/* Handle both array and string representation for display */}
                  {Array.isArray(r.appliesTo)
                    ? r.appliesTo.join(", ")
                    : r.applies || "All components"}
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl shadow-sm lg:col-span-2">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="font-semibold flex gap-2 items-center">
              Rule Details
              {loading && (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              )}
            </div>
            {sel && (
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  className="rounded-2xl h-8"
                  onClick={() => toggleEnabled(sel.id)}
                >
                  {sel.isActive ? "Disable" : "Enable"}
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="rounded-xl h-8 bg-green-600 hover:bg-green-700"
                  onClick={handleSave}
                >
                  <Save className="mr-2 h-4 w-4" /> Save
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="rounded-xl h-8 text-red-600 hover:bg-red-50"
                  onClick={() => handleDelete(sel.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {sel ? (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Name">
                <Input
                  className="rounded-2xl"
                  value={sel.name || ""}
                  onChange={(e) =>
                    setRules((p: Rule[]) =>
                      (p || []).map((r: Rule) =>
                        r.id === sel.id ? { ...r, name: e.target.value } : r
                      )
                    )
                  }
                />
              </Field>
              <Field label="Severity">
                <Select
                  value={sel.severity || "warn"}
                  onValueChange={(v: SeverityType) =>
                    setRules((p: Rule[]) =>
                      (p || []).map((r: Rule) =>
                        r.id === sel.id ? { ...r, severity: v } : r
                      )
                    )
                  }
                >
                  <SelectTrigger className="rounded-2xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="error">error</SelectItem>
                    <SelectItem value="warn">warn</SelectItem>
                    <SelectItem value="info">info</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Applies To (Comma separated)">
                <Input
                  className="rounded-2xl"
                  // Use 'applies' local state for editing, fallback to joined appliesTo
                  value={
                    sel.applies !== undefined
                      ? sel.applies
                      : sel.appliesTo?.join(", ") || ""
                  }
                  onChange={(e) =>
                    setRules((p: Rule[]) =>
                      (p || []).map((r: Rule) =>
                        r.id === sel.id ? { ...r, applies: e.target.value } : r
                      )
                    )
                  }
                />
              </Field>
              <Field label="Error Message">
                <Input
                  className="rounded-2xl"
                  value={sel.message || ""}
                  onChange={(e) =>
                    setRules((p: Rule[]) =>
                      (p || []).map((r: Rule) =>
                        r.id === sel.id ? { ...r, message: e.target.value } : r
                      )
                    )
                  }
                />
              </Field>

              <div className="md:col-span-2 rounded-2xl border p-4 bg-slate-50/50">
                <div className="font-medium text-sm mb-2 text-slate-700">
                  Logic Expression
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <Field label="Operator">
                    <Select
                      value={sel.expr?.op || "eq"}
                      onValueChange={(v: OperatorType) =>
                        setRules((p: Rule[]) =>
                          (p || []).map((r: Rule) =>
                            r.id === sel.id
                              ? {
                                  ...r,
                                  expr: {
                                    ...(r.expr || ({} as RuleExpression)),
                                    op: v,
                                  },
                                }
                              : r
                          )
                        )
                      }
                    >
                      <SelectTrigger className="rounded-2xl bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="eq">Equals (==)</SelectItem>
                        <SelectItem value="lte">Less/Equal (&lt;=)</SelectItem>
                        <SelectItem value="gte">
                          Greater/Equal (&gt;=)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Left Variable">
                    <Input
                      className="rounded-2xl bg-white"
                      value={sel.expr?.left || ""}
                      onChange={(e) =>
                        setRules((p: Rule[]) =>
                          (p || []).map((r: Rule) =>
                            r.id === sel.id
                              ? {
                                  ...r,
                                  expr: {
                                    ...(r.expr || ({} as RuleExpression)),
                                    left: e.target.value,
                                  },
                                }
                              : r
                          )
                        )
                      }
                      placeholder="cpu.socket"
                    />
                  </Field>
                  <Field label="Right Variable">
                    <Input
                      className="rounded-2xl bg-white"
                      value={sel.expr?.right || ""}
                      onChange={(e) =>
                        setRules((p: Rule[]) =>
                          (p || []).map((r: Rule) =>
                            r.id === sel.id
                              ? {
                                  ...r,
                                  expr: {
                                    ...(r.expr || ({} as RuleExpression)),
                                    right: e.target.value,
                                  },
                                }
                              : r
                          )
                        )
                      }
                      placeholder="mobo.socket"
                    />
                  </Field>
                </div>
                <div className="mt-3 text-xs text-muted-foreground font-mono bg-slate-100 p-2 rounded">
                  Result: {sel.expr?.op}({sel.expr?.left}, {sel.expr?.right})
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-8 text-sm text-muted-foreground flex flex-col items-center justify-center h-50">
              <div className="mb-2">Select a rule from the left to edit</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
