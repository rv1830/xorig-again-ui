// components/ingestion/GridTable.tsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Pencil, Save, X, Trash2 } from "lucide-react";
import { fmtINR } from "@/lib/utils";

// Type definitions
interface Column {
  key: string;
  label: string;
}

interface ComponentRow {
  component_id?: string;
  id?: string;
  quality?: {
    completeness?: number;
  };
  price?: number;
  discounted_price?: number;
  _in_stock?: boolean;
  _updated_at?: string;
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
  manufacturer?: string;
  vendor?: string;
  model_name?: string;
  model_number?: string;
  product_page_url?: string;
  active_status?: string;
  [key: string]: unknown;
}

interface GridTableProps {
  columns: Column[];
  rows: ComponentRow[];
  category: string;
  onRowClick: (row: ComponentRow) => void;
  onQuickEdit: (componentId: string, patch: EditPatch) => void;
  onDelete?: (componentId: string) => void;
}

interface EditPatch {
  _field: string;
  _before: string;
  _after: string;
  field: string;
  value: unknown;
}

interface CellProps {
  value: unknown;
  columnKey: string;
  row: ComponentRow;
  onQuickEdit: (componentId: string, patch: EditPatch) => void;
  category?: string;
}

interface InlineEditProps {
  value: unknown;
  onCommit: (value: unknown) => void;
}

export default function GridTable({
  columns,
  rows,
  category,
  onRowClick,
  onDelete,
  onQuickEdit,
}: GridTableProps) {
  return (
    <div className="w-full overflow-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            {columns.map((c: Column, index: number) => (
              <th
                key={c.key || `col-${index}`}
                className="text-left font-medium px-3 py-2 whitespace-nowrap"
              >
                {c.label}
              </th>
            ))}
            <th className="px-3 py-2 text-right font-medium whitespace-nowrap">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r: ComponentRow, rowIndex: number) => (
            <tr
              key={r.component_id || `row-${rowIndex}`}
              className="border-t hover:bg-muted/30 cursor-pointer"
              onClick={() => onRowClick(r)}
            >
              {columns.map((c: Column, colIndex: number) => (
                <td
                  key={`${r.component_id || rowIndex}-${c.key || colIndex}`}
                  className="px-3 py-2 whitespace-nowrap"
                >
                  <Cell
                    value={readCell(r, c.key)}
                    columnKey={c.key}
                    row={r}
                    category={category}
                    onQuickEdit={onQuickEdit}
                  />
                </td>
              ))}
              <td
                className="px-3 py-2 whitespace-nowrap text-right"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="inline-flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="rounded-2xl cursor-pointer"
                    onClick={() => onRowClick(r)}
                  >
                    Open <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                  {onDelete && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="rounded-2xl cursor-pointer"
                      onClick={() => {
                        const id = r.component_id || r.id;
                        if (
                          id &&
                          confirm(`Delete ${r.manufacturer} ${r.model_name}?`)
                        ) {
                          onDelete(id as string);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function readCell(row: ComponentRow, key: string): unknown {
  if (key === "completeness") return row.quality?.completeness ?? 0;
  if (key === "price") return row.price;
  if (key === "discounted_price") return row.discounted_price;
  if (key === "in_stock") return row._in_stock;
  if (key === "updated_at") return row._updated_at;
  if (key.startsWith("spec:")) {
    const id = key.split(":")[1];
    const spec = row.specs?.[id];
    if (spec && typeof spec === "object" && "v" in spec) {
      return (spec as { v: unknown }).v ?? "";
    }
    return "";
  }
  if (key.startsWith("compat:")) {
    const k = key.split(":")[1];
    return row.compatibility?.[k] ?? "";
  }
  return row[key];
}

function Cell({ value, columnKey, row, onQuickEdit }: CellProps) {
  // Inline edit: allow editing manufacturer/model_name/model_number/vendor/status and numeric spec fields.
  const editableBase = [
    "manufacturer",
    "vendor",
    "model_name",
    "model_number",
    "active_status",
  ];
  const editable =
    editableBase.includes(columnKey) || columnKey.startsWith("spec:");

  if (columnKey === "price" || columnKey === "discounted_price")
    return value ? (
      <span className="font-medium">{fmtINR(Number(value))}</span>
    ) : (
      <span className="text-muted-foreground">—</span>
    );
  if (columnKey === "in_stock")
    return value ? (
      <Badge className="rounded-2xl">In stock</Badge>
    ) : (
      <Badge variant="secondary" className="rounded-2xl">
        OOS
      </Badge>
    );
  if (columnKey === "updated_at" || columnKey === "updatedAt") {
    if (!value) return <span className="text-muted-foreground">—</span>;

    try {
      const date = new Date(String(value));
      // Format in Indian timezone with full date and time
      const formatted = date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
      return <span className="text-muted-foreground">{formatted}</span>;
    } catch (error) {
      console.error("Error formatting timestamp:", error);
      return <span className="text-muted-foreground">{String(value)}</span>;
    }
  }
  if (columnKey === "completeness") {
    const v = Number(value) || 0;
    const variant = v >= 85 ? "outline" : v >= 70 ? "secondary" : "destructive";
    return (
      <Badge variant={variant} className="rounded-2xl">
        {v}%
      </Badge>
    );
  }

  if (!editable)
    return (
      <span>
        {String(value ?? "") || (
          <span className="text-muted-foreground">—</span>
        )}
      </span>
    );

  // Stop propagation to avoid row open on click.
  return (
    <InlineEdit
      value={value}
      onCommit={(next: unknown) => {
        const field = columnKey;
        const before = String(value ?? "");
        const after = String(next ?? "");
        onQuickEdit(row.component_id || "", {
          _field: field,
          _before: before,
          _after: after,
          field,
          value: next,
        });
      }}
    />
  );
}

function InlineEdit({ value, onCommit }: InlineEditProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value ?? ""));

  function start() {
    setDraft(String(value ?? ""));
    setEditing(true);
  }
  function cancel() {
    setEditing(false);
    setDraft(String(value ?? ""));
  }
  function save() {
    setEditing(false);
    onCommit(draft);
  }

  if (!editing) {
    return (
      <button
        type="button"
        className="group inline-flex items-center gap-2 hover:underline underline-offset-4"
        onClick={(e) => {
          e.stopPropagation();
          start();
        }}
      >
        <span>
          {String(value ?? "") || (
            <span className="text-muted-foreground">—</span>
          )}
        </span>
        <Pencil className="h-3.5 w-3.5 opacity-0 group-hover:opacity-60" />
      </button>
    );
  }

  return (
    <div
      className="flex items-center gap-2"
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <Input
        className="h-8 rounded-2xl"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
      />
      <Button size="sm" className="h-8 rounded-2xl" onClick={save}>
        <Save className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant="secondary"
        className="h-8 rounded-2xl"
        onClick={cancel}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function applyPatch(
  component: ComponentRow,
  patch: EditPatch
): ComponentRow {
  const next = structuredClone(component);
  if (patch.field?.startsWith("spec:")) {
    const id = patch.field.split(":")[1];
    next.specs = next.specs || {};
    next.specs[id] = next.specs[id] || {
      v: "",
      source_id: "manual",
      confidence: 0.6,
      updated_at: new Date().toISOString(),
    };
    const specObj = next.specs[id] as {
      v: unknown;
      source_id: string;
      confidence: number;
      updated_at: string;
    };
    specObj.v = coerceValue(patch.value);
    specObj.source_id = "manual";
    specObj.confidence = 0.8;
    specObj.updated_at = new Date().toISOString();
    return next;
  }
  if (
    [
      "manufacturer",
      "vendor",
      "model_name",
      "model_number",
      "active_status",
    ].includes(patch.field)
  ) {
    next[patch.field] = patch.value;
    return next;
  }
  return next;
}

function coerceValue(v: unknown): unknown {
  const s = String(v ?? "").trim();
  if (s === "") return "";
  if (s === "true") return true;
  if (s === "false") return false;
  const n = Number(s);
  if (!Number.isNaN(n) && /^(\d+\.?\d*)$/.test(s)) return n;
  return v;
}
