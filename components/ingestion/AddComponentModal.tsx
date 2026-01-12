// components/ingestion/AddComponentModal.tsx
import React, { useState, useEffect } from "react";
import { Button, Input, Modal } from "../ui/primitives";
import { Save, Loader2, Plus, Wand2, Trash2 } from "lucide-react";
import { api } from "../../lib/api";
import { COMPONENT_TYPES } from "../../lib/constants";
import { Card } from "@/components/ui/card";

// Added 'boolean' to the type definitions
interface CustomField {
  name: string;
  type: "string" | "int" | "array" | "boolean";
  value: string | number | string[] | boolean;
}

interface CoreIdentityData {
  manufacturer: string;
  vendor: string;
  model_name: string;
  model_number: string;
  product_page_url: string;
  price: string;
  discounted_price: string;
}

interface AddComponentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Vendor options list updated with EliteHubs and Flipkart
const VENDOR_OPTIONS = [
  { id: "AMAZON", name: "Amazon" },
  { id: "FLIPKART", name: "Flipkart" },
  { id: "MDCOMPUTERS", name: "MDComputers" },
  { id: "VEDANT", name: "Vedant Computers" },
  { id: "PRIMEABGB", name: "PrimeABGB" },
  { id: "ELITEHUBS", name: "EliteHubs" },
  { id: "OTHER", name: "Other (Manual Entry)" },
];

export default function AddComponentModal({
  isOpen,
  onClose,
  onSuccess,
}: AddComponentModalProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [componentType, setComponentType] = useState<string>("");
  const [fetchingSpecs, setFetchingSpecs] = useState<boolean>(false);
  const [vendorType, setVendorType] = useState<string>("AMAZON");

  const [coreData, setCoreData] = useState<CoreIdentityData>({
    manufacturer: "",
    vendor: "AMAZON",
    model_name: "",
    model_number: "",
    product_page_url: "",
    price: "",
    discounted_price: "",
  });

  const [extraSpecs, setExtraSpecs] = useState<Array<{ review: string; source: string }>>([]);
  const [coreCustomFields, setCoreCustomFields] = useState<Array<CustomField>>([]);
  const [techSpecCustomFields, setTechSpecCustomFields] = useState<Array<CustomField>>([]);
  
  const [showAddField, setShowAddField] = useState(false);
  const [addFieldSection, setAddFieldSection] = useState<"core" | "techspec">("core");
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState<CustomField["type"]>("string");

  useEffect(() => {
    if (isOpen) {
      setComponentType("");
      setVendorType("AMAZON");
      setCoreData({ manufacturer: "", vendor: "AMAZON", model_name: "", model_number: "", product_page_url: "", price: "", discounted_price: "" });
      setExtraSpecs([]);
      setCoreCustomFields([]);
      setTechSpecCustomFields([]);
      setShowAddField(false);
    }
  }, [isOpen]);

  const handleAutoSpecs = async () => {
    if (!coreData.product_page_url) return alert("Please enter a product page URL first");
    setFetchingSpecs(true);
    try {
      const data = await api.fetchSpecsFromUrl(coreData.product_page_url);
      if (data.manufacturer) setCoreData((prev) => ({ ...prev, manufacturer: data.manufacturer }));
      if (data.model_name) setCoreData((prev) => ({ ...prev, model_name: data.model_name }));
      if (data.model_number) setCoreData((prev) => ({ ...prev, model_number: data.model_number }));
      if (data.price) setCoreData((prev) => ({ ...prev, price: data.price.toString() }));
    } catch (error) {
      alert("Failed to fetch specs from URL");
    } finally {
      setFetchingSpecs(false);
    }
  };

  const addCustomField = () => {
    if (!newFieldName.trim()) return alert("Please enter a field name");
    
    let defaultValue: any = "";
    if (newFieldType === "int") defaultValue = 0;
    if (newFieldType === "boolean") defaultValue = false;
    if (newFieldType === "array") defaultValue = "";

    const newField: CustomField = { name: newFieldName.trim(), type: newFieldType, value: defaultValue };
    
    if (addFieldSection === "techspec") {
      setTechSpecCustomFields([...techSpecCustomFields, newField]);
    } else {
      setCoreCustomFields([...coreCustomFields, newField]);
    }
    setNewFieldName("");
    setShowAddField(false);
  };

  const updateFieldValue = (fields: CustomField[], setFields: React.Dispatch<React.SetStateAction<CustomField[]>>, index: number, value: any) => {
    const updated = [...fields];
    const field = updated[index];

    if (field.type === "int") {
      updated[index].value = parseInt(value) || 0;
    } else if (field.type === "boolean") {
      updated[index].value = value === "true" || value === true;
    } else {
      updated[index].value = value;
    }
    setFields(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!componentType) return alert("Please select a component type");
    setLoading(true);
    try {
      const processArray = (val: any) => typeof val === "string" ? val.split(",").map((s: string) => s.trim()).filter(Boolean) : val;
      
      const mapFields = (fields: CustomField[]) => fields.reduce((acc: any, f) => {
        acc[f.name] = f.type === "array" ? processArray(f.value) : f.value;
        return acc;
      }, {});

      const payload = {
        type: componentType,
        ...coreData,
        price: coreData.price ? parseFloat(coreData.price) : null,
        discounted_price: coreData.discounted_price ? parseFloat(coreData.discounted_price) : null,
        core_custom_data: mapFields(coreCustomFields),
        tech_specs: mapFields(techSpecCustomFields),
        specs: {
          extra_specs: extraSpecs.filter((spec) => spec.review || spec.source),
        }
      };

      await api.addComponent(payload);
      onSuccess();
      onClose();
    } catch (error) {
      alert("Error saving component");
    } finally {
      setLoading(false);
    }
  };

  const renderFieldInput = (field: CustomField, index: number, section: "core" | "techspec") => {
    const fields = section === "core" ? coreCustomFields : techSpecCustomFields;
    const setFields = section === "core" ? setCoreCustomFields : setTechSpecCustomFields;

    if (field.type === "boolean") {
      return (
        <div className="flex items-center gap-2 p-2 h-[42px]">
          <input 
            type="checkbox" 
            className="w-5 h-5 cursor-pointer accent-blue-600"
            checked={!!field.value} 
            onChange={(e) => updateFieldValue(fields, setFields, index, e.target.checked)} 
          />
          <span className="text-sm text-gray-600">{field.value ? "True" : "False"}</span>
        </div>
      );
    }

    return (
      <input 
        className="w-full p-2 border rounded text-sm outline-none focus:ring-1 focus:ring-blue-400" 
        type={field.type === "int" ? "number" : "text"} 
        value={field.value as string} 
        onChange={(e) => updateFieldValue(fields, setFields, index, e.target.value)} 
      />
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Component" className="backdrop-blur-sm" style={{ maxWidth: "1800px", width: "95vw", minWidth: "1400px" }}>
      <div className="bg-white border border-gray-200 rounded-xl shadow-2xl w-full">
        <form 
          onSubmit={handleSubmit} 
          className="p-10 space-y-12 w-full"
          onKeyDown={(e) => { if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA") e.preventDefault(); }}
        >
          {/* Component Type Selector */}
          <div className="space-y-4">
            <label className="text-xl font-bold text-gray-900 flex items-center gap-3"><span className="text-gray-600">⚙️</span> Component Type *</label>
            <select className="w-full rounded-xl border-2 border-gray-300 p-4 bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium cursor-pointer" value={componentType} onChange={(e) => setComponentType(e.target.value)} required>
              <option value="">-- Select Component Type --</option>
              {COMPONENT_TYPES.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
            </select>
          </div>

          {/* Core Identity Fields */}
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3"><span className="text-blue-600">🏷️</span> Core Identity Fields</h3>
              <Button type="button" size="sm" variant="outline" onClick={() => { setAddFieldSection("core"); setShowAddField(true); }} className="text-blue-600 border-blue-600 cursor-pointer"><Plus className="h-4 w-4 mr-2" /> Add Field</Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Manufacturer *" placeholder="e.g., Intel" value={coreData.manufacturer} onChange={(e: any) => setCoreData({ ...coreData, manufacturer: e.target.value })} required />
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Vendor *</label>
                <div className="flex gap-2">
                  <select 
                    className="w-1/3 rounded-lg border border-gray-300 p-2 text-sm outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer"
                    value={vendorType}
                    onChange={(e) => {
                      const val = e.target.value;
                      setVendorType(val);
                      if (val !== "OTHER") {
                        setCoreData({ ...coreData, vendor: val });
                      } else {
                        setCoreData({ ...coreData, vendor: "" });
                      }
                    }}
                  >
                    {VENDOR_OPTIONS.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                  <Input 
                    placeholder={vendorType === "OTHER" ? "Type vendor name..." : "Vendor name"} 
                    value={coreData.vendor} 
                    disabled={vendorType !== "OTHER"}
                    onChange={(e: any) => setCoreData({ ...coreData, vendor: e.target.value })} 
                    className="flex-1"
                  />
                </div>
              </div>

              <Input label="Model Name *" placeholder="e.g., Core i5" value={coreData.model_name} onChange={(e: any) => setCoreData({ ...coreData, model_name: e.target.value })} required />
              <Input label="Model Number *" placeholder="e.g., BX123" value={coreData.model_number} onChange={(e: any) => setCoreData({ ...coreData, model_number: e.target.value })} required />
            </div>
            <Input label="Product Page URL" placeholder="https://..." value={coreData.product_page_url} onChange={(e: any) => setCoreData({ ...coreData, product_page_url: e.target.value })} />
            {coreData.product_page_url && (
              <div className="flex justify-end mt-2">
                <Button type="button" size="sm" variant="outline" onClick={handleAutoSpecs} disabled={fetchingSpecs} className="text-purple-600 border-purple-600 cursor-pointer">
                  {fetchingSpecs ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wand2 className="h-4 w-4 mr-2" />} Auto-fill from URL
                </Button>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <Input label="Price (₹)" type="number" value={coreData.price} onChange={(e: any) => setCoreData({ ...coreData, price: e.target.value })} />
              <Input label="Discounted Price (₹)" type="number" value={coreData.discounted_price} onChange={(e: any) => setCoreData({ ...coreData, discounted_price: e.target.value })} />
            </div>
            
            {coreCustomFields.length > 0 && (
              <div className="mt-6 grid grid-cols-2 gap-4">
                {coreCustomFields.map((field, index) => (
                  <div key={index} className="relative p-2 border rounded-lg bg-gray-50">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-medium text-blue-700 capitalize">{field.name} ({field.type})</label>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setCoreCustomFields(coreCustomFields.filter((_, i) => i !== index))} className="text-red-500 h-5 w-5 p-0 cursor-pointer"><Trash2 className="h-3 w-3" /></Button>
                    </div>
                    {renderFieldInput(field, index, "core")}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Technical Specifications Section */}
          {componentType && (
            <div className="space-y-6 mt-8 pt-8 border-t">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                    <span className="text-2xl">⚡</span> Technical Specifications
                </h3>
                <Button type="button" size="sm" variant="outline" onClick={() => { setAddFieldSection("techspec"); setShowAddField(true); }} className="text-purple-600 border-purple-600 hover:bg-purple-50 cursor-pointer">
                  <Plus className="h-4 w-4 mr-2" /> Add Field
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-6">
                {techSpecCustomFields.length > 0 ? (
                  techSpecCustomFields.map((field, index) => (
                    <div key={index} className="p-4 bg-purple-50 rounded-xl border border-purple-100 flex flex-col gap-2 relative group">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-purple-700 uppercase tracking-wider">{field.name} ({field.type})</label>
                        <Button type="button" variant="ghost" size="sm" onClick={() => setTechSpecCustomFields(techSpecCustomFields.filter((_, i) => i !== index))} className="text-red-500 h-6 w-6 p-0 hover:bg-red-100 cursor-pointer">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="bg-white rounded-lg border-2 border-white focus-within:border-purple-400 transition-all">
                        {renderFieldInput(field, index, "techspec")}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-10 border-2 border-dashed border-gray-200 rounded-xl text-gray-400">
                    No technical specifications added. Click "Add Field" to start.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Extra Specs (JSON) Section */}
          <Card className="p-6 bg-linear-to-r from-green-50 to-green-100 border-green-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-green-900 flex items-center gap-2">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white">📋</div>
                Extra Specs (JSON)
              </h3>
              <Button type="button" size="sm" variant="outline" onClick={() => setExtraSpecs([...extraSpecs, { review: "", source: "" }])} className="text-green-600 border-green-600 hover:bg-green-100 cursor-pointer"><Plus className="h-4 w-4 mr-1" /> Add Spec</Button>
            </div>
            <div className="space-y-3">
              {extraSpecs.map((spec, index) => (
                <Card key={index} className="p-3 border border-gray-200">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs text-gray-500">Spec {index + 1}</span>
                    <Button type="button" size="sm" variant="ghost" onClick={() => setExtraSpecs(extraSpecs.filter((_, i) => i !== index))} className="text-red-600 hover:bg-red-50 h-6 w-6 p-0 cursor-pointer"><Trash2 className="h-3 w-3" /></Button>
                  </div>
                  <div className="space-y-2">
                    <textarea className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none" rows={2} placeholder="Review notes..." value={spec.review} onChange={(e) => {
                       const up = [...extraSpecs]; up[index].review = e.target.value; setExtraSpecs(up);
                    }} />
                    <textarea className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none font-mono" rows={2} placeholder="Source URL/JSON" value={spec.source} onChange={(e) => {
                       const up = [...extraSpecs]; up[index].source = e.target.value; setExtraSpecs(up);
                    }} />
                  </div>
                </Card>
              ))}
              {extraSpecs.length === 0 && <div className="text-center py-6 text-gray-500 text-sm">No extra specs added.</div>}
            </div>
          </Card>

          {/* Footer Actions and Parsing Note */}
          <div className="space-y-4 pt-10 border-t border-gray-200">
            <p className="text-sm text-gray-500 italic text-center font-medium">
              Note: Parsing is currently supported only for MDComputers, PrimeABGB, EliteHubs, and Vedant Computers.
            </p>
            <div className="flex justify-end gap-4">
              <Button type="button" variant="secondary" onClick={onClose} className="px-8 py-6 text-lg cursor-pointer">Cancel</Button>
              <Button type="submit" disabled={loading} className="px-10 py-6 text-lg bg-blue-600 hover:bg-blue-700 cursor-pointer">
                {loading ? <><Loader2 className="animate-spin mr-2" size={20} /> Saving...</> : <><Save size={20} className="mr-2" /> Save Component</>}
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* Unified Add Field Dialog */}
      {showAddField && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999] bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 shadow-2xl border-2 border-gray-200 max-w-md w-full mx-4 animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add {addFieldSection === 'techspec' ? 'Technical' : 'Custom Core'} Field</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Field Name</label>
                <input autoFocus type="text" className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. wattage, is_modular" value={newFieldName} onChange={(e) => setNewFieldName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Type</label>
                <select className="w-full rounded-lg border border-gray-300 p-3 text-sm outline-none cursor-pointer" value={newFieldType} onChange={(e: any) => setNewFieldType(e.target.value)}>
                  <option value="string">String (Text)</option>
                  <option value="int">Integer (Number)</option>
                  <option value="boolean">Boolean (Yes/No)</option>
                  <option value="array">Array (Comma List)</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="secondary" onClick={() => { setShowAddField(false); setNewFieldName(""); }} className="cursor-pointer">Cancel</Button>
              <Button onClick={addCustomField} className="bg-blue-600 hover:bg-blue-700 cursor-pointer">Add Row</Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}