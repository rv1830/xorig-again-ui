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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Pencil, Save, Plus, Trash2, Wand2, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

// --- STRICT FIELD DEFINITIONS (For Technical Specs Section) ---
interface FieldDefinition {
  key: string;
  label: string;
  type: "text" | "number" | "boolean";
  ph?: string;
}

type ComponentType =
  | "PROCESSOR"
  | "GRAPHICS_CARD"
  | "MOTHERBOARD"
  | "RAM"
  | "POWER_SUPPLY"
  | "SSD"
  | "HDD"
  | "CPU_COOLER"
  | "CABINET"
  | "MONITOR"
  | "KEYBOARD"
  | "MOUSE"
  | "HEADSET"
  | "ADDITIONAL_CASE_FANS";

const STRICT_FIELDS: Record<ComponentType, FieldDefinition[]> = {
  PROCESSOR: [
    { key: "socket", label: "Socket", type: "text", ph: "AM5, LGA1700" },
    { key: "cores", label: "Cores", type: "number" },
    { key: "threads", label: "Threads", type: "number" },
    { key: "base_clock", label: "Base Clock", type: "text" },
    { key: "boost_clock", label: "Boost Clock", type: "text" },
    { key: "tdp_watts", label: "TDP (Watts)", type: "number" },
  ],
  GRAPHICS_CARD: [
    { key: "chipset", label: "Chipset", type: "text", ph: "RTX 4060" },
    { key: "vram_gb", label: "VRAM (GB)", type: "number" },
    { key: "length_mm", label: "Length (mm)", type: "number" },
    { key: "tdp_watts", label: "TDP (Watts)", type: "number" },
  ],
  MOTHERBOARD: [
    { key: "socket", label: "Socket", type: "text" },
    { key: "form_factor", label: "Form Factor", type: "text", ph: "ATX, mATX" },
    { key: "memory_type", label: "RAM Type", type: "text", ph: "DDR4, DDR5" },
    { key: "memory_slots", label: "RAM Slots", type: "number" },
  ],
  RAM: [
    { key: "memory_type", label: "Type", type: "text", ph: "DDR4, DDR5" },
    { key: "capacity_gb", label: "Total Capacity (GB)", type: "number" },
    { key: "speed_mhz", label: "Speed (MHz)", type: "number" },
  ],
  POWER_SUPPLY: [
    { key: "wattage", label: "Wattage", type: "number" },
    { key: "efficiency", label: "Efficiency", type: "text", ph: "80+ Gold" },
    { key: "modular", label: "Modular", type: "text" },
  ],
  CABINET: [
    { key: "max_gpu_len_mm", label: "Max GPU Length (mm)", type: "number" },
    { key: "max_cpu_height", label: "Max CPU Cooler (mm)", type: "number" },
  ],
  SSD: [
    { key: "capacity_gb", label: "Capacity (GB)", type: "number" },
    { key: "interface", label: "Interface", type: "text", ph: "SATA, NVMe" },
  ],
  HDD: [
    { key: "capacity_gb", label: "Capacity (GB)", type: "number" },
    { key: "rpm", label: "RPM", type: "number" },
  ],
  CPU_COOLER: [
    { key: "type", label: "Type", type: "text", ph: "Air, AIO" },
    { key: "height_mm", label: "Height (mm)", type: "number" },
  ],
  MONITOR: [
    { key: "size_inches", label: "Size (inches)", type: "number" },
    { key: "resolution", label: "Resolution", type: "text" },
  ],
  KEYBOARD: [
    { key: "switch_type", label: "Switch Type", type: "text" },
    { key: "layout", label: "Layout", type: "text" },
  ],
  MOUSE: [
    { key: "dpi", label: "DPI", type: "number" },
    { key: "buttons", label: "Buttons", type: "number" },
  ],
  HEADSET: [
    { key: "driver_size", label: "Driver Size (mm)", type: "number" },
    { key: "wireless", label: "Wireless", type: "text" },
  ],
  ADDITIONAL_CASE_FANS: [
    { key: "size_mm", label: "Size (mm)", type: "number" },
    { key: "speed_rpm", label: "Speed (RPM)", type: "number" },
  ],
};

interface ComponentData {
  id?: string;
  type: string;
  manufacturer: string;
  vendor?: string;
  model_name: string;
  model_number: string;
  product_page_url?: string;
  price?: number;
  discounted_price?: number;
  tracked_price?: number;
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

interface DynamicField {
  name: string;
  type: "string" | "int" | "array" | "boolean";
  value: any;
}

export default function DetailsDrawer({ open, onOpenChange, component, onSave, isCreating }: DetailsDrawerProps) {
  const { toast } = useToast();
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);

  // Core Identity (Fixed Fields)
  const [coreData, setCoreData] = useState<Partial<ComponentData>>({});
  
  // Custom Data Section (Mapped to core_custom_data in Backend)
  const [coreCustomFields, setCoreCustomFields] = useState<DynamicField[]>([]);
  
  // Technical Specs Section (Mapped to data in specific model tables)
  const [techSpecData, setTechSpecData] = useState<Record<string, any>>({});
  
  // Extra Specs (JSON storage)
  const [extraSpecs, setExtraSpecs] = useState<Array<{ review: string; source: string }>>([]);

  // Add Field Dialog State
  const [showAddField, setShowAddField] = useState(false);
  const [addFieldSection, setAddFieldSection] = useState<"core" | "techspec">("core");
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState<DynamicField["type"]>("string");

  useEffect(() => {
    if (!component) return;

    // 1. Load Core Data
    setCoreData({
      id: component.id,
      type: component.type,
      manufacturer: component.manufacturer || "",
      vendor: component.vendor || "",
      model_name: component.model_name || "",
      model_number: component.model_number || "",
      product_page_url: component.product_page_url || "",
      price: component.price ? Number(component.price) : undefined,
      discounted_price: component.discounted_price ? Number(component.discounted_price) : undefined,
      tracked_price: component.tracked_price ? Number(component.tracked_price) : undefined,
    });

    // 2. Load Specific Model Data (Tech Specs)
    const relationKey = component.type.toLowerCase();
    const specificData = component[relationKey] || {};
    
    // Technical Data (The 'data' JSON field in Specific Model)
    setTechSpecData(specificData.data || {});

    // Core Custom Data (The 'core_custom_data' JSON field in Specific Model)
    const customData = specificData.core_custom_data || {};
    const formattedCustom = Object.entries(customData).map(([name, value]) => ({
      name,
      type: Array.isArray(value) ? "array" : typeof value === "number" ? "int" : typeof value === "boolean" ? "boolean" : "string",
      value
    })) as DynamicField[];
    setCoreCustomFields(formattedCustom);

    // 3. Extra Specs
    setExtraSpecs(component.specs?.extra_specs || []);

    setEditMode(isCreating);
  }, [component, open]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const processValue = (f: DynamicField) => {
        if (f.type === "array" && typeof f.value === "string") {
          return f.value.split(",").map(s => s.trim()).filter(Boolean);
        }
        if (f.type === "int") return parseInt(f.value) || 0;
        return f.value;
      };

      // Construct payload compatible with the Backend Controller
      const payload = {
        ...coreData,
        price: coreData.price || null,
        discounted_price: coreData.discounted_price || null,
        tracked_price: coreData.tracked_price || null,
        
        // Specific table 'core_custom_data' field
        core_custom_data: coreCustomFields.reduce((acc, f) => {
          acc[f.name] = processValue(f);
          return acc;
        }, {} as any),

        // Specific table 'data' field (Technical Specs)
        tech_specs: techSpecData,

        // Master table 'specs' field
        specs: {
          extra_specs: extraSpecs.filter(s => s.review || s.source)
        }
      };

      await onSave(payload);
      setEditMode(false);
    } catch (err) {
      toast({ variant: "destructive", title: "Save Failed" });
    } finally {
      setLoading(false);
    }
  };

  const addCustomField = () => {
    if (!newFieldName) return;
    const name = newFieldName.toLowerCase().replace(/\s+/g, "_");
    
    if (addFieldSection === "core") {
      setCoreCustomFields([...coreCustomFields, { name, type: newFieldType, value: newFieldType === "boolean" ? false : "" }]);
    } else {
      setTechSpecData({ ...techSpecData, [name]: "" });
    }
    setShowAddField(false);
    setNewFieldName("");
  };

  const currentType = (coreData.type || "PROCESSOR") as ComponentType;
  const predefinedTechFields = STRICT_FIELDS[currentType] || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-7xl max-h-[95vh] overflow-y-auto p-0 rounded-2xl border-none shadow-2xl bg-slate-50 dark:bg-slate-900">
        <DialogHeader className="px-8 py-6 bg-white dark:bg-slate-800 border-b sticky top-0 z-20">
          <div className="flex justify-between items-center">
            <div>
              <DialogTitle className="text-2xl font-bold">{isCreating ? "Add New Component" : coreData.model_name}</DialogTitle>
              <DialogDescription className="text-blue-600 font-medium mt-1">{coreData.type} Section</DialogDescription>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setEditMode(!editMode)}>
                {editMode ? "Cancel Edit" : <><Pencil className="w-4 h-4 mr-2" /> Edit</>}
              </Button>
              {editMode && (
                <Button onClick={handleSave} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                  {loading ? <Loader2 className="animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="p-8 grid grid-cols-12 gap-8">
          {/* LEFT: CORE IDENTITY */}
          <div className="col-span-12 lg:col-span-5 space-y-6">
            <section className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2">🏷️ Core Identity</h3>
                {editMode && (
                  <Button variant="ghost" size="sm" onClick={() => { setAddFieldSection("core"); setShowAddField(true); }}>
                    <Plus className="w-4 h-4 mr-1" /> Custom Field
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-slate-500">Manufacturer</label>
                  <Input disabled={!editMode} value={coreData.manufacturer} onChange={e => setCoreData({...coreData, manufacturer: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-slate-500">Model Name</label>
                  <Input disabled={!editMode} value={coreData.model_name} onChange={e => setCoreData({...coreData, model_name: e.target.value})} />
                </div>
                <div className="space-y-2 col-span-2">
                  <label className="text-xs font-semibold uppercase text-slate-500">Model Number</label>
                  <Input disabled={!editMode} value={coreData.model_number} onChange={e => setCoreData({...coreData, model_number: e.target.value})} />
                </div>
                
                {/* Core Custom Data Fields */}
                {coreCustomFields.map((field, idx) => (
                  <div key={idx} className="space-y-2 relative group">
                    <label className="text-xs font-semibold uppercase text-blue-500">{field.name.replace(/_/g, ' ')}</label>
                    <div className="flex gap-2">
                      <Input 
                        disabled={!editMode} 
                        value={field.value} 
                        type={field.type === 'int' ? 'number' : 'text'}
                        onChange={e => {
                          const updated = [...coreCustomFields];
                          updated[idx].value = e.target.value;
                          setCoreCustomFields(updated);
                        }} 
                      />
                      {editMode && (
                        <Button variant="ghost" size="icon" className="text-red-400 opacity-0 group-hover:opacity-100" onClick={() => setCoreCustomFields(coreCustomFields.filter((_, i) => i !== idx))}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border">
              <h3 className="text-lg font-bold mb-6">💰 Pricing & Links</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-slate-500">Retail Price (₹)</label>
                  <Input type="number" disabled={!editMode} value={coreData.price || ''} onChange={e => setCoreData({...coreData, price: parseFloat(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-slate-500">Discounted (₹)</label>
                  <Input type="number" disabled={!editMode} value={coreData.discounted_price || ''} onChange={e => setCoreData({...coreData, discounted_price: parseFloat(e.target.value)})} />
                </div>
                <div className="space-y-2 col-span-2">
                  <label className="text-xs font-semibold uppercase text-slate-500">Product Page URL</label>
                  <div className="flex gap-2">
                    <Input disabled={!editMode} value={coreData.product_page_url} onChange={e => setCoreData({...coreData, product_page_url: e.target.value})} />
                    {editMode && <Button size="icon" variant="outline" onClick={() => toast({ title: "Scanning URL..." })}><Wand2 className="w-4 h-4" /></Button>}
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT: TECHNICAL SPECIFICATIONS */}
          <div className="col-span-12 lg:col-span-7 space-y-6">
            <section className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2">⚡ Technical Specifications</h3>
                {editMode && (
                  <Button variant="ghost" size="sm" onClick={() => { setAddFieldSection("techspec"); setShowAddField(true); }}>
                    <Plus className="w-4 h-4 mr-1" /> Add Spec
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Fixed Predefined Fields */}
                {predefinedTechFields.map(field => (
                  <div key={field.key} className="space-y-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                    <label className="text-xs font-bold text-slate-500 uppercase">{field.label}</label>
                    <Input 
                      disabled={!editMode} 
                      type={field.type === 'number' ? 'number' : 'text'}
                      value={techSpecData[field.key] || ''} 
                      onChange={e => setTechSpecData({...techSpecData, [field.key]: field.type === 'number' ? parseFloat(e.target.value) : e.target.value})}
                    />
                  </div>
                ))}

                {/* Custom Tech Fields */}
                {Object.entries(techSpecData)
                  .filter(([key]) => !predefinedTechFields.some(f => f.key === key))
                  .map(([key, val]) => (
                    <div key={key} className="space-y-2 p-3 rounded-lg bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 relative group">
                      <label className="text-xs font-bold text-blue-600 uppercase">{key.replace(/_/g, ' ')}</label>
                      <div className="flex gap-2">
                        <Input disabled={!editMode} value={val} onChange={e => setTechSpecData({...techSpecData, [key]: e.target.value})} />
                        {editMode && (
                          <Button variant="ghost" size="icon" className="text-red-400" onClick={() => {
                            const updated = {...techSpecData};
                            delete updated[key];
                            setTechSpecData(updated);
                          }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </section>

            {/* Extra Specs Section */}
            <section className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">📋 Extra Specs & JSON</h3>
                {editMode && <Button size="sm" variant="outline" onClick={() => setExtraSpecs([...extraSpecs, {review: "", source: ""}])}><Plus className="w-4 h-4" /></Button>}
              </div>
              <div className="space-y-3">
                {extraSpecs.map((s, i) => (
                  <div key={i} className="flex gap-3 items-start group">
                    <div className="grid grid-cols-2 gap-2 flex-1">
                      <Input placeholder="Label/Review" disabled={!editMode} value={s.review} onChange={e => {
                        const up = [...extraSpecs]; up[i].review = e.target.value; setExtraSpecs(up);
                      }} />
                      <Input placeholder="Source/Value" disabled={!editMode} value={s.source} onChange={e => {
                        const up = [...extraSpecs]; up[i].source = e.target.value; setExtraSpecs(up);
                      }} />
                    </div>
                    {editMode && <Button variant="ghost" size="icon" className="text-red-400" onClick={() => setExtraSpecs(extraSpecs.filter((_, idx) => idx !== i))}><Trash2 className="w-4 h-4" /></Button>}
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </DialogContent>

      {/* Dynamic Add Field Dialog */}
      <Dialog open={showAddField} onOpenChange={setShowAddField}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Custom {addFieldSection === 'core' ? 'Identity' : 'Technical'} Field</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Field Name</label>
              <Input placeholder="e.g. Wattage, VRAM Type" value={newFieldName} onChange={e => setNewFieldName(e.target.value)} />
            </div>
            {addFieldSection === 'core' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Data Type</label>
                <Select value={newFieldType} onValueChange={(v: any) => setNewFieldType(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="string">Text</SelectItem>
                    <SelectItem value="int">Number</SelectItem>
                    <SelectItem value="boolean">Boolean</SelectItem>
                    <SelectItem value="array">List (Comma Separated)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button className="w-full" onClick={addCustomField}>Add Field</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}