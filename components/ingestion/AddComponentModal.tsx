// components/ingestion/AddComponentModal.tsx
// Updated with Manual Technical Specifications, Core Custom Data and original sections preserved
import React, { useState, useEffect } from "react";
import { Button, Input, Modal } from "../ui/primitives";
import { Save, Loader2, Plus, Wand2, Trash2 } from "lucide-react";
import { api } from "../../lib/api";
import { COMPONENT_TYPES } from "../../lib/constants";
import { Card } from "@/components/ui/card";

// Type definitions
interface CoreIdentityData {
  manufacturer: string;
  vendor: string;
  model_name: string;
  model_number: string;
  product_page_url: string;
  price: string;
  discounted_price: string;
  tracked_price: string;
}

interface AddComponentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddComponentModal({
  isOpen,
  onClose,
  onSuccess,
}: AddComponentModalProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [componentType, setComponentType] = useState<string>("");
  const [fetchingSpecs, setFetchingSpecs] = useState<boolean>(false);

  const [coreData, setCoreData] = useState<CoreIdentityData>({
    manufacturer: "",
    vendor: "",
    model_name: "",
    model_number: "",
    product_page_url: "",
    price: "",
    discounted_price: "",
    tracked_price: "",
  });

  const [extraSpecs, setExtraSpecs] = useState<Array<{ review: string; source: string }>>([]);
  
  // State for Core Custom Fields // Added core_custom_data requirement
  const [coreCustomFields, setCoreCustomFields] = useState<Array<{ name: string; type: "string" | "int" | "array"; value: string | number | string[] }>>([]);
  
  // Technical Specifications manual state
  const [techSpecCustomFields, setTechSpecCustomFields] = useState<Array<{ name: string; type: "string" | "int" | "array"; value: string | number | string[] }>>([]);
  
  const [showAddField, setShowAddField] = useState(false);
  const [addFieldSection, setAddFieldSection] = useState<"core" | "techspec">("core");
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState<"string" | "int" | "array">("string");

  useEffect(() => {
    if (isOpen) {
      setComponentType("");
      setCoreData({ manufacturer: "", vendor: "", model_name: "", model_number: "", product_page_url: "", price: "", discounted_price: "", tracked_price: "" });
      setExtraSpecs([]);
      setCoreCustomFields([]); // Reset core custom fields
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

  const addExtraSpec = () => setExtraSpecs([...extraSpecs, { review: "", source: "" }]);
  const removeExtraSpec = (index: number) => setExtraSpecs(extraSpecs.filter((_, i) => i !== index));
  const updateExtraSpec = (index: number, field: "review" | "source", value: string) => {
    const updated = [...extraSpecs];
    updated[index][field] = value;
    setExtraSpecs(updated);
  };

  const addCustomField = () => {
    if (!newFieldName.trim()) return alert("Please enter a field name");
    const newField = { name: newFieldName.trim(), type: newFieldType, value: newFieldType === "array" ? "" : newFieldType === "int" ? 0 : "" };
    
    if (addFieldSection === "techspec") {
      setTechSpecCustomFields([...techSpecCustomFields, newField]);
    } else {
      setCoreCustomFields([...coreCustomFields, newField]); // Saving to core_custom_data state
    }
    setNewFieldName("");
    setShowAddField(false);
  };

  const updateCoreCustomField = (index: number, value: string) => { // Added updater for core custom
    const updated = [...coreCustomFields];
    updated[index].value = updated[index].type === "int" ? parseInt(value) || 0 : value;
    setCoreCustomFields(updated);
  };

  const updateTechSpecCustomField = (index: number, value: string) => {
    const updated = [...techSpecCustomFields];
    updated[index].value = updated[index].type === "int" ? parseInt(value) || 0 : value;
    setTechSpecCustomFields(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!componentType) return alert("Please select a component type");
    setLoading(true);
    try {
      const processArray = (val: any) => typeof val === "string" ? val.split(",").map((s: string) => s.trim()).filter(Boolean) : val;
      
      const payload = {
        type: componentType,
        ...coreData,
        price: coreData.price ? parseFloat(coreData.price) : null,
        discounted_price: coreData.discounted_price ? parseFloat(coreData.discounted_price) : null,
        tracked_price: coreData.tracked_price ? parseFloat(coreData.tracked_price) : null,
        
        // Backend requirement: Custom Core fields into core_custom_data // Added mapping here
        core_custom_data: coreCustomFields.reduce((acc: any, f) => {
          acc[f.name] = f.type === "array" ? processArray(f.value) : f.value;
          return acc;
        }, {}),

        // Technical model data field
        tech_specs: techSpecCustomFields.reduce((acc: any, f) => {
          acc[f.name] = f.type === "array" ? processArray(f.value) : f.value;
          return acc;
        }, {}),
        
        // Master table JSON field
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
            <select className="w-full rounded-xl border-2 border-gray-300 p-4 bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium" value={componentType} onChange={(e) => setComponentType(e.target.value)} required>
              <option value="">-- Select Component Type --</option>
              {COMPONENT_TYPES.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
            </select>
          </div>

          {/* Core Identity Fields */}
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3"><span className="text-blue-600">🏷️</span> Core Identity Fields</h3>
              <Button type="button" size="sm" variant="outline" onClick={() => { setAddFieldSection("core"); setShowAddField(true); }} className="text-blue-600 border-blue-600"><Plus className="h-4 w-4 mr-2" /> Add Field</Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Manufacturer *" placeholder="e.g., Intel" value={coreData.manufacturer} onChange={(e: any) => setCoreData({ ...coreData, manufacturer: e.target.value })} required />
              <Input label="Vendor" placeholder="e.g., Amazon" value={coreData.vendor} onChange={(e: any) => setCoreData({ ...coreData, vendor: e.target.value })} />
              <Input label="Model Name *" placeholder="e.g., Core i5" value={coreData.model_name} onChange={(e: any) => setCoreData({ ...coreData, model_name: e.target.value })} required />
              <Input label="Model Number *" placeholder="e.g., BX123" value={coreData.model_number} onChange={(e: any) => setCoreData({ ...coreData, model_number: e.target.value })} required />
            </div>
            <Input label="Product Page URL" placeholder="https://..." value={coreData.product_page_url} onChange={(e: any) => setCoreData({ ...coreData, product_page_url: e.target.value })} />
            {coreData.product_page_url && (
              <div className="flex justify-end mt-2">
                <Button type="button" size="sm" variant="outline" onClick={handleAutoSpecs} disabled={fetchingSpecs} className="text-purple-600 border-purple-600">
                  {fetchingSpecs ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wand2 className="h-4 w-4 mr-2" />} Auto-fill from URL
                </Button>
              </div>
            )}
            <div className="grid grid-cols-3 gap-4">
              <Input label="Price (₹)" type="number" value={coreData.price} onChange={(e: any) => setCoreData({ ...coreData, price: e.target.value })} />
              <Input label="Discounted Price (₹)" type="number" value={coreData.discounted_price} onChange={(e: any) => setCoreData({ ...coreData, discounted_price: e.target.value })} />
              <Input label="Tracked Price (₹)" type="number" value={coreData.tracked_price} onChange={(e: any) => setCoreData({ ...coreData, tracked_price: e.target.value })} />
            </div>
            {/* Custom Core Fields Display // Now using coreCustomFields state */}
            {coreCustomFields.length > 0 && (
              <div className="mt-6 grid grid-cols-2 gap-4">
                {coreCustomFields.map((field, index) => (
                  <div key={index} className="relative p-2 border rounded-lg">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-medium text-blue-700 capitalize">{field.name} ({field.type})</label>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setCoreCustomFields(coreCustomFields.filter((_, i) => i !== index))} className="text-red-500 h-5 w-5 p-0"><Trash2 className="h-3 w-3" /></Button>
                    </div>
                    <input className="w-full p-2 border rounded text-sm" type={field.type === "int" ? "number" : "text"} value={field.value as string} onChange={(e) => updateCoreCustomField(index, e.target.value)} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* MANUAL Technical Specifications Section */}
          {componentType && (
            <div className="space-y-6 mt-8 pt-8 border-t">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                    <span className="text-2xl">⚡</span> Technical Specifications
                </h3>
                <Button type="button" size="sm" variant="outline" onClick={() => { setAddFieldSection("techspec"); setShowAddField(true); }} className="text-purple-600 border-purple-600 hover:bg-purple-50">
                  <Plus className="h-4 w-4 mr-2" /> Add Field
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-6">
                {techSpecCustomFields.length > 0 ? (
                  techSpecCustomFields.map((field, index) => (
                    <div key={index} className="p-4 bg-purple-50 rounded-xl border border-purple-100 flex flex-col gap-2 relative group">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-purple-700 uppercase tracking-wider">{field.name}</label>
                        <Button type="button" variant="ghost" size="sm" onClick={() => setTechSpecCustomFields(techSpecCustomFields.filter((_, i) => i !== index))} className="text-red-500 h-6 w-6 p-0 hover:bg-red-100">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <input 
                        className="w-full p-2.5 border-2 border-white rounded-lg text-sm bg-white focus:border-purple-400 outline-none transition-all" 
                        type={field.type === "int" ? "number" : "text"} 
                        placeholder={`Enter ${field.name}...`}
                        value={field.value as string} 
                        onChange={(e) => updateTechSpecCustomField(index, e.target.value)} 
                      />
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

          {/* Footer Actions */}
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            <Button type="button" variant="secondary" onClick={onClose} className="px-6">Cancel</Button>
            <Button type="submit" disabled={loading} className="px-6 bg-blue-600 hover:bg-blue-700">
              {loading ? <><Loader2 className="animate-spin mr-2" size={16} /> Saving...</> : <><Save size={16} className="mr-2" /> Save Component</>}
            </Button>
          </div>
        </form>

        {/* Extra Specs (JSON) Section - Preserved from Original */}
        <Card className="m-10 p-6 bg-linear-to-r from-green-50 to-green-100 border-green-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-green-900 flex items-center gap-2">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white">📋</div>
              Extra Specs (JSON)
            </h3>
            <Button type="button" size="sm" variant="outline" onClick={addExtraSpec} className="text-green-600 border-green-600 hover:bg-green-100"><Plus className="h-4 w-4 mr-1" /> Add Spec</Button>
          </div>
          <div className="space-y-3">
            {extraSpecs.map((spec, index) => (
              <Card key={index} className="p-3 border border-gray-200">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs text-gray-500">Spec {index + 1}</span>
                  <Button type="button" size="sm" variant="ghost" onClick={() => removeExtraSpec(index)} className="text-red-600 hover:bg-red-50 h-6 w-6 p-0"><Trash2 className="h-3 w-3" /></Button>
                </div>
                <div className="space-y-2">
                  <textarea className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none" rows={2} placeholder="Review notes or comments..." value={spec.review} onChange={(e) => updateExtraSpec(index, "review", e.target.value)} />
                  <textarea className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none font-mono" rows={2} placeholder="Source URL or JSON data" value={spec.source} onChange={(e) => updateExtraSpec(index, "source", e.target.value)} />
                </div>
              </Card>
            ))}
            {extraSpecs.length === 0 && <div className="text-center py-6 text-gray-500 text-sm">No extra specs added. Click "Add Spec" to include additional JSON info.</div>}
          </div>
        </Card>
      </div>

      {/* Unified Add Field Dialog (For both Core and Tech Spec) */}
      {showAddField && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999] bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 shadow-2xl border-2 border-gray-200 max-w-md w-full mx-4 animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add {addFieldSection === 'techspec' ? 'Technical' : 'Custom Core'} Field</h3>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Field Name</label><input autoFocus type="text" className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Enter field name" value={newFieldName} onChange={(e) => setNewFieldName(e.target.value)} /></div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Type</label>
                <select className="w-full rounded-lg border border-gray-300 p-3 text-sm outline-none" value={newFieldType} onChange={(e: any) => setNewFieldType(e.target.value)}>
                  <option value="string">String (Text)</option>
                  <option value="int">Integer (Number)</option>
                  <option value="array">Array (Comma List)</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="secondary" onClick={() => { setShowAddField(false); setNewFieldName(""); }}>Cancel</Button>
              <Button onClick={addCustomField} className="bg-blue-600 hover:bg-blue-700">Add Row</Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}