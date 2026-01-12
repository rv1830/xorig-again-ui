import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Pencil, Save, Plus, Trash2, Loader2 } from "lucide-react";

interface ComponentData {
  id?: string;
  type: string;
  manufacturer: string;
  vendor?: string;
  model_name: string;
  model_number: string;
  product_page_url?: string;
  price?: number | string;
  discounted_price?: number | string;
  tracked_price?: number | string;
  specs?: {
    extra_specs?: Array<{ review: string; source: string }>;
  };
  [key: string]: any;
}

interface DetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  component: ComponentData | null;
  onSave: (data: any) => void;
  isCreating: boolean;
}

// Defining a structure for dynamic fields to track their types
interface TypedField {
  key: string;
  value: any;
  type: "string" | "number" | "boolean" | "array";
}

export default function DetailsDrawer({ open, onOpenChange, component, onSave, isCreating }: DetailsDrawerProps) {
  const { toast } = useToast();
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);

  // States
  const [coreData, setCoreData] = useState<Partial<ComponentData>>({});
  const [coreCustomFields, setCoreCustomFields] = useState<TypedField[]>([]);
  const [techSpecs, setTechSpecs] = useState<TypedField[]>([]);
  const [extraSpecs, setExtraSpecs] = useState<Array<{ review: string; source: string }>>([]);

  // Add Field Dialog State
  const [showAddField, setShowAddField] = useState(false);
  const [addFieldSection, setAddFieldSection] = useState<"core" | "tech">("core");
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState<TypedField["type"]>("string");

  useEffect(() => {
    if (!component) return;

    // 1. Core Data
    setCoreData({
      id: component.id,
      type: component.type,
      manufacturer: component.manufacturer || "",
      vendor: component.vendor || "",
      model_name: component.model_name || "",
      model_number: component.model_number || "",
      product_page_url: component.product_page_url || "",
      price: component.price || "",
      discounted_price: component.discounted_price || "",
    });

    const relationKey = component.type.toLowerCase();
    const specificData = component[relationKey] || {};

    // 2. Helper to detect type from value
    const mapToTypedFields = (obj: Record<string, any>): TypedField[] => {
      return Object.entries(obj).map(([key, value]) => {
        let type: TypedField["type"] = "string";
        if (typeof value === "boolean" || value === "true" || value === "false") type = "boolean";
        else if (Array.isArray(value)) type = "array";
        else if (typeof value === "number") type = "number";
        return { key, value, type };
      });
    };

    setCoreCustomFields(mapToTypedFields(specificData.core_custom_data || {}));
    setTechSpecs(mapToTypedFields(specificData.data || {}));
    setExtraSpecs(component.specs?.extra_specs || []);
    setEditMode(isCreating);
  }, [component, open, isCreating]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const formatValue = (f: TypedField) => {
        if (f.type === "number") return Number(f.value) || 0;
        if (f.type === "boolean") return String(f.value).toLowerCase() === "true";
        if (f.type === "array" && typeof f.value === "string") return f.value.split(",").map(s => s.trim());
        return f.value;
      };

      const reducer = (acc: any, f: TypedField) => {
        acc[f.key] = formatValue(f);
        return acc;
      };

      const payload = {
        ...coreData,
        core_custom_data: coreCustomFields.reduce(reducer, {}),
        tech_specs: techSpecs.reduce(reducer, {}),
        specs: { extra_specs: extraSpecs.filter(s => s.review || s.source) }
      };

      await onSave(payload);
      setEditMode(false);
    } catch (err) {
      toast({ variant: "destructive", title: "Save Failed" });
    } finally {
      setLoading(false);
    }
  };

  const addField = () => {
    if (!newFieldName) return;
    const key = newFieldName.toLowerCase().replace(/\s+/g, "_");
    const defaultValue = newFieldType === "boolean" ? false : newFieldType === "number" ? 0 : "";
    const newField: TypedField = { key, value: defaultValue, type: newFieldType };

    if (addFieldSection === "core") setCoreCustomFields([...coreCustomFields, newField]);
    else setTechSpecs([...techSpecs, newField]);

    setShowAddField(false);
    setNewFieldName("");
  };

  const renderFieldInput = (field: TypedField, index: number, section: "core" | "tech") => {
    const update = (val: any) => {
      const setter = section === "core" ? setCoreCustomFields : setTechSpecs;
      const list = section === "core" ? [...coreCustomFields] : [...techSpecs];
      list[index].value = val;
      setter(list);
    };

    if (field.type === "boolean") {
      const isTrue = String(field.value).toLowerCase() === "true";
      return (
        <div className="flex items-center gap-2 h-10">
          <Checkbox checked={isTrue} disabled={!editMode} onCheckedChange={update} />
          <span className="text-sm">{isTrue ? "True" : "False"}</span>
        </div>
      );
    }

    return (
      <Input
        disabled={!editMode}
        type={field.type === "number" ? "number" : "text"}
        placeholder={field.type === "array" ? "val1, val2, val3" : ""}
        value={field.value}
        onChange={(e) => update(e.target.value)}
      />
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-7xl max-h-[90vh] overflow-y-auto p-0 bg-slate-50 dark:bg-slate-900 border-none shadow-2xl">
        <DialogHeader className="px-8 py-6 bg-white dark:bg-slate-800 border-b sticky top-0 z-30">
          <div className="flex justify-between items-center">
            <div>
              <DialogTitle className="text-2xl font-bold">{isCreating ? "New Component" : coreData.model_name}</DialogTitle>
              <DialogDescription className="text-blue-600 font-semibold uppercase tracking-wider">{coreData.type}</DialogDescription>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setEditMode(!editMode)}>
                {editMode ? "Cancel" : <><Pencil className="w-4 h-4 mr-2" /> Edit</>}
              </Button>
              {editMode && (
                <Button onClick={handleSave} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
                  {loading ? <Loader2 className="animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> Save Data</>}
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LEFT: CORE IDENTITY */}
          <div className="space-y-6">
            <section className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2">🏷️ Core Identity</h3>
                {editMode && (
                  <Button variant="secondary" size="sm" onClick={() => { setAddFieldSection("core"); setShowAddField(true); }}>
                    <Plus className="w-4 h-4 mr-1" /> Add Custom Field
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><label className="text-xs font-bold text-slate-500 uppercase">Manufacturer</label><Input disabled={!editMode} value={coreData.manufacturer} onChange={e => setCoreData({...coreData, manufacturer: e.target.value})} /></div>
                <div className="space-y-1.5"><label className="text-xs font-bold text-slate-500 uppercase">Vendor</label><Input disabled={!editMode} value={coreData.vendor} onChange={e => setCoreData({...coreData, vendor: e.target.value})} /></div>
                <div className="space-y-1.5"><label className="text-xs font-bold text-slate-500 uppercase">Model Name</label><Input disabled={!editMode} value={coreData.model_name} onChange={e => setCoreData({...coreData, model_name: e.target.value})} /></div>
                <div className="space-y-1.5"><label className="text-xs font-bold text-slate-500 uppercase">Model Number</label><Input disabled={!editMode} value={coreData.model_number} onChange={e => setCoreData({...coreData, model_number: e.target.value})} /></div>
                
                {coreCustomFields.map((f, i) => (
                  <div key={i} className="space-y-1.5 relative group col-span-1">
                    <label className="text-xs font-bold text-blue-600 uppercase">{f.key.replace(/_/g, ' ')} <span className="text-[10px] text-slate-400">({f.type})</span></label>
                    <div className="flex gap-2">
                      {renderFieldInput(f, i, "core")}
                      {editMode && <Button variant="ghost" size="icon" className="text-red-400" onClick={() => setCoreCustomFields(coreCustomFields.filter((_, idx) => idx !== i))}><Trash2 className="w-4 h-4" /></Button>}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-bold mb-6">💰 Pricing & URL</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><label className="text-xs font-bold text-slate-500 uppercase">MRP (₹)</label><Input type="number" disabled={!editMode} value={coreData.price} onChange={e => setCoreData({...coreData, price: e.target.value})} /></div>
                <div className="space-y-1.5"><label className="text-xs font-bold text-slate-500 uppercase">Sale Price (₹)</label><Input type="number" disabled={!editMode} value={coreData.discounted_price} onChange={e => setCoreData({...coreData, discounted_price: e.target.value})} /></div>
                <div className="col-span-2 space-y-1.5"><label className="text-xs font-bold text-slate-500 uppercase">Product Page</label><Input disabled={!editMode} value={coreData.product_page_url} onChange={e => setCoreData({...coreData, product_page_url: e.target.value})} /></div>
              </div>
            </section>
          </div>

          {/* RIGHT: TECHNICAL SPECS */}
          <div className="space-y-6">
            <section className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold">⚡ Technical Specifications</h3>
                {editMode && (
                  <Button variant="secondary" size="sm" onClick={() => { setAddFieldSection("tech"); setShowAddField(true); }}>
                    <Plus className="w-4 h-4 mr-1" /> Add Spec
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {techSpecs.map((f, i) => (
                  <div key={i} className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                    <label className="text-xs font-bold text-slate-500 uppercase">{f.key.replace(/_/g, ' ')} <span className="text-[10px] text-blue-400">({f.type})</span></label>
                    <div className="flex gap-2">
                      {renderFieldInput(f, i, "tech")}
                      {editMode && <Button variant="ghost" size="icon" className="text-red-400" onClick={() => setTechSpecs(techSpecs.filter((_, idx) => idx !== i))}><Trash2 className="w-4 h-4" /></Button>}
                    </div>
                  </div>
                ))}
                {techSpecs.length === 0 && <p className="text-sm text-slate-400 italic">No specific specs found for this item.</p>}
              </div>
            </section>

            <section className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">📋 Extra Notes</h3>
                {editMode && <Button variant="outline" size="sm" onClick={() => setExtraSpecs([...extraSpecs, {review: "", source: ""}])}><Plus className="w-4 h-4" /></Button>}
              </div>
              <div className="space-y-3">
                {extraSpecs.map((s, i) => (
                  <div key={i} className="flex gap-2">
                    <Input placeholder="Label" disabled={!editMode} value={s.review} onChange={e => { const up = [...extraSpecs]; up[i].review = e.target.value; setExtraSpecs(up); }} />
                    <Input placeholder="Source" disabled={!editMode} value={s.source} onChange={e => { const up = [...extraSpecs]; up[i].source = e.target.value; setExtraSpecs(up); }} />
                    {editMode && <Button variant="ghost" size="icon" className="text-red-400" onClick={() => setExtraSpecs(extraSpecs.filter((_, idx) => idx !== i))}><Trash2 className="w-4 h-4" /></Button>}
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </DialogContent>

      {/* Add Field Dialog */}
      <Dialog open={showAddField} onOpenChange={setShowAddField}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New {addFieldSection === 'core' ? 'Identity' : 'Technical'} Field</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input placeholder="e.g. Socket, Refresh Rate" value={newFieldName} onChange={e => setNewFieldName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Type</label>
              <Select value={newFieldType} onValueChange={(v: any) => setNewFieldType(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="string">String (Text)</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="boolean">Boolean (True/False)</SelectItem>
                  <SelectItem value="array">Array (Comma Separated)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full bg-blue-600" onClick={addField}>Add to {addFieldSection === 'core' ? 'Identity' : 'Specs'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}