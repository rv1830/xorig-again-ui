// components/ingestion/AddComponentModal.tsx
// Updated with new Core Identity fields and component types
import React, { useState, useEffect } from "react";
import { Button, Input, Modal } from "../ui/primitives";
import { Save, Loader2, Plus, Wand2, Trash2 } from "lucide-react";
import { api } from "../../lib/api";
import { COMPONENT_TYPES, SPEC_DEFS } from "../../lib/constants";
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
}

interface SpecDefinition {
  id: string;
  label: string;
  type: string;
  unit: string;
  enum?: string[];
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

  // Dynamic vendor mapping based on component type
  const getVendorsForComponentType = (componentType: string): string[] => {
    // Map by both name and id to be safe
    const vendorMap: Record<string, string[]> = {
      // Uppercase IDs (from COMPONENT_TYPES)
      PROCESSOR: ["Intel", "AMD"],
      MOTHERBOARD: ["ASUS", "MSI", "Gigabyte", "ASRock", "Biostar"],
      GRAPHICS_CARD: [
        "ASUS",
        "MSI",
        "Gigabyte",
        "ZOTAC",
        "Sapphire",
        "PowerColor",
        "XFX",
        "PNY",
      ],
      POWER_SUPPLY: [
        "Corsair",
        "Cooler Master",
        "Thermaltake",
        "Antec",
        "be quiet!",
        "ASUS ROG",
        "Gigabyte",
        "MSI",
      ],
      RAM: [
        "Corsair",
        "G.Skill",
        "Kingston",
        "TeamGroup",
        "ADATA",
        "Patriot",
        "Crucial",
      ],
      CPU_COOLER: [
        "Noctua",
        "Cooler Master",
        "NZXT",
        "Deepcool",
        "Thermalright",
        "be quiet!",
        "Corsair",
      ],
      SSD: [
        "Samsung",
        "Western Digital",
        "Kingston",
        "Crucial",
        "ADATA",
        "Corsair",
        "Sabrent",
        "PNY",
      ],
      HDD: ["Seagate", "Western Digital", "Toshiba"],
      CABINET: [
        "Corsair",
        "NZXT",
        "Lian Li",
        "Cooler Master",
        "Fractal Design",
        "Phanteks",
        "Thermaltake",
        "Antec",
      ],
      MONITOR: [
        "Dell",
        "ASUS",
        "LG",
        "Samsung",
        "Acer",
        "BenQ",
        "MSI",
        "Gigabyte",
      ],
      KEYBOARD: [
        "Logitech",
        "Corsair",
        "Razer",
        "SteelSeries",
        "Keychron",
        "Ducky",
        "Redragon",
      ],
      MOUSE: [
        "Logitech",
        "Razer",
        "SteelSeries",
        "Corsair",
        "Glorious",
        "ASUS ROG",
        "Redragon",
      ],
      HEADSET: [
        "SteelSeries",
        "HyperX",
        "Logitech",
        "Razer",
        "Corsair",
        "Sennheiser",
        "Audio-Technica",
      ],
      ADDITIONAL_CASE_FANS: [
        "Noctua",
        "Corsair",
        "Cooler Master",
        "Arctic",
        "Lian Li",
        "Phanteks",
        "Deepcool",
      ],
      // Try both the display name and potential IDs
      Processor: ["Intel", "AMD"],
      processor: ["Intel", "AMD"],
      Motherboard: ["ASUS", "MSI", "Gigabyte", "ASRock", "Biostar"],
      motherboard: ["ASUS", "MSI", "Gigabyte", "ASRock", "Biostar"],
      "Graphics Card": [
        "ASUS",
        "MSI",
        "Gigabyte",
        "ZOTAC",
        "Sapphire",
        "PowerColor",
        "XFX",
        "PNY",
      ],
      graphics_card: [
        "ASUS",
        "MSI",
        "Gigabyte",
        "ZOTAC",
        "Sapphire",
        "PowerColor",
        "XFX",
        "PNY",
      ],
      "Power Supply": [
        "Corsair",
        "Cooler Master",
        "Thermaltake",
        "Antec",
        "be quiet!",
        "ASUS ROG",
        "Gigabyte",
        "MSI",
      ],
      power_supply: [
        "Corsair",
        "Cooler Master",
        "Thermaltake",
        "Antec",
        "be quiet!",
        "ASUS ROG",
        "Gigabyte",
        "MSI",
      ],
      "CPU Cooler": [
        "Noctua",
        "Cooler Master",
        "NZXT",
        "Deepcool",
        "Thermalright",
        "be quiet!",
        "Corsair",
      ],
      cpu_cooler: [
        "Noctua",
        "Cooler Master",
        "NZXT",
        "Deepcool",
        "Thermalright",
        "be quiet!",
        "Corsair",
      ],
      Cabinet: [
        "Corsair",
        "NZXT",
        "Lian Li",
        "Cooler Master",
        "Fractal Design",
        "Phanteks",
        "Thermaltake",
        "Antec",
      ],
      cabinet: [
        "Corsair",
        "NZXT",
        "Lian Li",
        "Cooler Master",
        "Fractal Design",
        "Phanteks",
        "Thermaltake",
        "Antec",
      ],
      Monitor: [
        "Dell",
        "ASUS",
        "LG",
        "Samsung",
        "Acer",
        "BenQ",
        "MSI",
        "Gigabyte",
      ],
      monitor: [
        "Dell",
        "ASUS",
        "LG",
        "Samsung",
        "Acer",
        "BenQ",
        "MSI",
        "Gigabyte",
      ],
      Keyboard: [
        "Logitech",
        "Corsair",
        "Razer",
        "SteelSeries",
        "Keychron",
        "Ducky",
        "Redragon",
      ],
      keyboard: [
        "Logitech",
        "Corsair",
        "Razer",
        "SteelSeries",
        "Keychron",
        "Ducky",
        "Redragon",
      ],
      Mouse: [
        "Logitech",
        "Razer",
        "SteelSeries",
        "Corsair",
        "Glorious",
        "ASUS ROG",
        "Redragon",
      ],
      mouse: [
        "Logitech",
        "Razer",
        "SteelSeries",
        "Corsair",
        "Glorious",
        "ASUS ROG",
        "Redragon",
      ],
      Headset: [
        "SteelSeries",
        "HyperX",
        "Logitech",
        "Razer",
        "Corsair",
        "Sennheiser",
        "Audio-Technica",
      ],
      headset: [
        "SteelSeries",
        "HyperX",
        "Logitech",
        "Razer",
        "Corsair",
        "Sennheiser",
        "Audio-Technica",
      ],
      "Additional Case Fans": [
        "Noctua",
        "Corsair",
        "Cooler Master",
        "Arctic",
        "Lian Li",
        "Phanteks",
        "Deepcool",
      ],
      additional_case_fans: [
        "Noctua",
        "Corsair",
        "Cooler Master",
        "Arctic",
        "Lian Li",
        "Phanteks",
        "Deepcool",
      ],
    };

    console.log(
      "Component Type:",
      componentType,
      "Available Vendors:",
      vendorMap[componentType]
    );
    return vendorMap[componentType] || [];
  };

  const availableVendors = componentType
    ? getVendorsForComponentType(componentType)
    : [];

  // Core Identity Fields
  const [coreData, setCoreData] = useState<CoreIdentityData>({
    manufacturer: "",
    vendor: "",
    model_name: "",
    model_number: "",
    product_page_url: "",
    price: "",
    discounted_price: "",
  });

  // Dynamic Specs (compatibility specs for specific component type)
  const [compatSpecs, setCompatSpecs] = useState<
    Record<string, string | boolean>
  >({});

  // Extra Specs (Review/Source pairs)
  const [extraSpecs, setExtraSpecs] = useState<
    Array<{ review: string; source: string }>
  >([]);

  // Custom Fields Management
  const [customFields, setCustomFields] = useState<
    Array<{
      name: string;
      type: "string" | "int" | "array";
      value: string | number | string[];
    }>
  >([]);
  const [techSpecCustomFields, setTechSpecCustomFields] = useState<
    Array<{
      name: string;
      type: "string" | "int" | "array";
      value: string | number | string[];
    }>
  >([]);
  const [showAddField, setShowAddField] = useState(false);
  const [addFieldSection, setAddFieldSection] = useState<"core" | "techspec">(
    "core"
  );
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState<"string" | "int" | "array">(
    "string"
  );

  // Load vendors on component mount
  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setComponentType("");
      setCoreData({
        manufacturer: "",
        vendor: "",
        model_name: "",
        model_number: "",
        product_page_url: "",
        price: "",
        discounted_price: "",
      });
      setCompatSpecs({});
      setExtraSpecs([]);
      setCustomFields([]);
      setShowAddField(false); // Ensure dialog is closed
    }
  }, [isOpen]);

  // Auto-fetch specs from product URL
  const handleAutoSpecs = async () => {
    if (!coreData.product_page_url) {
      alert("Please enter a product page URL first");
      return;
    }

    setFetchingSpecs(true);
    try {
      const data = await api.fetchSpecsFromUrl(coreData.product_page_url);
      if (data.specs) {
        setCompatSpecs(data.specs);
      }
      if (data.manufacturer)
        setCoreData((prev) => ({ ...prev, manufacturer: data.manufacturer }));
      if (data.model_name)
        setCoreData((prev) => ({ ...prev, model_name: data.model_name }));
      if (data.model_number)
        setCoreData((prev) => ({ ...prev, model_number: data.model_number }));
      if (data.price)
        setCoreData((prev) => ({ ...prev, price: data.price.toString() }));
    } catch (error) {
      console.error("Auto-fetch failed:", error);
      alert("Failed to fetch specs from URL");
    } finally {
      setFetchingSpecs(false);
    }
  };

  // Extra specs management
  const addExtraSpec = () => {
    setExtraSpecs([...extraSpecs, { review: "", source: "" }]);
  };

  const updateExtraSpec = (
    index: number,
    field: "review" | "source",
    value: string
  ) => {
    const updated = [...extraSpecs];
    updated[index][field] = value;
    setExtraSpecs(updated);
  };

  const removeExtraSpec = (index: number) => {
    setExtraSpecs(extraSpecs.filter((_, i) => i !== index));
  };
  // Custom field management
  const addCustomField = () => {
    if (!newFieldName.trim()) {
      alert("Please enter a field name");
      return;
    }

    const newField = {
      name: newFieldName.trim(),
      type: newFieldType,
      value: newFieldType === "array" ? [] : newFieldType === "int" ? 0 : "",
    };

    if (addFieldSection === "techspec") {
      setTechSpecCustomFields([...techSpecCustomFields, newField]);
    } else {
      setCustomFields([...customFields, newField]);
    }
    setNewFieldName("");
    setNewFieldType("string");
    setShowAddField(false);
  };

  const updateCustomField = (index: number, value: string) => {
    const updated = [...customFields];
    if (updated[index].type === "array") {
      // Store as raw string, will split on form submit
      updated[index].value = value;
    } else if (updated[index].type === "int") {
      updated[index].value = parseInt(value) || 0;
    } else {
      updated[index].value = value;
    }
    setCustomFields(updated);
  };

  const removeCustomField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  const updateTechSpecCustomField = (index: number, value: string) => {
    const updated = [...techSpecCustomFields];
    if (updated[index].type === "array") {
      // Store as raw string, will split on form submit
      updated[index].value = value;
    } else if (updated[index].type === "int") {
      updated[index].value = parseInt(value) || 0;
    } else {
      updated[index].value = value;
    }
    setTechSpecCustomFields(updated);
  };

  const removeTechSpecCustomField = (index: number) => {
    setTechSpecCustomFields(techSpecCustomFields.filter((_, i) => i !== index));
  };
  // Find currently selected component specs
  const activeComponentSpecs =
    SPEC_DEFS[componentType as keyof typeof SPEC_DEFS] || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!componentType) return alert("Please select a component type");
    if (
      !coreData.manufacturer ||
      !coreData.model_name ||
      !coreData.model_number
    ) {
      return alert("Manufacturer, Model Name, and Model Number are required");
    }

    setLoading(true);
    try {
      // Process custom fields - split arrays before submitting
      const processedCustomFields = customFields.map((field) => {
        if (field.type === "array" && typeof field.value === "string") {
          return {
            ...field,
            value: field.value
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
          };
        }
        return field;
      });

      const processedTechSpecFields = techSpecCustomFields.map((field) => {
        if (field.type === "array" && typeof field.value === "string") {
          return {
            ...field,
            value: field.value
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
          };
        }
        return field;
      });

      const payload = {
        type: componentType,
        ...coreData,
        // Convert string prices to numbers
        price: coreData.price ? parseFloat(coreData.price) : null,
        discounted_price: coreData.discounted_price
          ? parseFloat(coreData.discounted_price)
          : null,
        compat_specs: compatSpecs,
        specs: {}, // Additional dynamic specs can be added later
        extra_specs: extraSpecs.filter((spec) => spec.review || spec.source), // Only include non-empty specs
        custom_fields: processedCustomFields,
        tech_spec_custom_fields: processedTechSpecFields,
      };

      await api.addComponent(payload);

      // Reset form including extra specs and custom fields
      setExtraSpecs([]);
      setCustomFields([]);
      setTechSpecCustomFields([]);

      onSuccess(); // Refresh parent list
      onClose();
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      alert("Error: " + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Component"
      className="backdrop-blur-sm"
      style={{ maxWidth: "1800px", width: "95vw", minWidth: "1400px" }}
    >
      <div className="bg-white border border-gray-200 rounded-xl shadow-2xl w-full">
        <form
          onSubmit={handleSubmit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const target = e.target as HTMLElement;
              if (
                target.tagName !== "TEXTAREA" &&
                target.tagName !== "BUTTON"
              ) {
                e.preventDefault();
                e.stopPropagation();
                return false;
              }
            }
          }}
          className="p-10 space-y-12 w-full"
        >
          {/* Component Type Selector */}
          <div className="space-y-4">
            <label className="text-xl font-bold text-gray-900 flex items-center gap-3">
              <span className="text-gray-600">⚙️</span>
              Component Type *
            </label>
            <select
              className="w-full rounded-xl border-2 border-gray-300 p-4 text-base bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 shadow-sm font-medium"
              value={componentType}
              onChange={(e) => {
                setComponentType(e.target.value);
                setCompatSpecs({}); // Clear specs when type changes
              }}
              required
            >
              <option value="">-- Select Component Type --</option>
              {COMPONENT_TYPES.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          {/* Core Identity Fields */}
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                <span className="text-blue-600">🏷️</span>
                Core Identity Fields
              </h3>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setAddFieldSection("core");
                  setShowAddField(true);
                }}
                className="text-blue-600 border-blue-600 hover:bg-blue-100 hover:border-blue-700 shadow-sm transition-all duration-300"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Field
              </Button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Manufacturer *"
                  placeholder="e.g., Intel, AMD, NVIDIA"
                  value={coreData.manufacturer}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCoreData({ ...coreData, manufacturer: e.target.value })
                  }
                  required
                />
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-500 uppercase">
                    Vendor
                  </label>
                  <select
                    className="w-full rounded-lg border border-gray-300 p-3 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 shadow-sm"
                    value={coreData.vendor}
                    onChange={(e) =>
                      setCoreData({ ...coreData, vendor: e.target.value })
                    }
                  >
                    <option value="">-- Select Vendor --</option>
                    {availableVendors.map((vendor) => (
                      <option key={vendor} value={vendor}>
                        {vendor}
                      </option>
                    ))}
                  </select>
                  {!componentType && (
                    <p className="text-xs text-gray-500 mt-1">
                      Select a component type first to see available vendors
                    </p>
                  )}
                  {componentType && availableVendors.length === 0 && (
                    <p className="text-xs text-orange-600 mt-1">
                      No vendors configured for this component type
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Model Name *"
                  placeholder="e.g., Core i5 13th Gen"
                  value={coreData.model_name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCoreData({ ...coreData, model_name: e.target.value })
                  }
                  required
                />
                <Input
                  label="Model Number *"
                  placeholder="e.g., BX8071513600K"
                  value={coreData.model_number}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCoreData({ ...coreData, model_number: e.target.value })
                  }
                  required
                />
              </div>

              <Input
                label="Product Page URL"
                placeholder="https://..."
                value={coreData.product_page_url}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setCoreData({ ...coreData, product_page_url: e.target.value })
                }
              />
              {coreData.product_page_url && (
                <div className="flex justify-end mt-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleAutoSpecs}
                    disabled={fetchingSpecs}
                    className="text-purple-600 border-purple-600 hover:bg-purple-100 hover:border-purple-700 shadow-sm transition-all duration-200"
                  >
                    {fetchingSpecs ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Fetching...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4 mr-2" />
                        Auto-fill from URL
                      </>
                    )}
                  </Button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Price (₹)"
                  type="number"
                  step="0.01"
                  placeholder="25000.00"
                  value={coreData.price}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCoreData({ ...coreData, price: e.target.value })
                  }
                />
                <Input
                  label="Discounted Price (₹)"
                  type="number"
                  step="0.01"
                  placeholder="22000.00"
                  value={coreData.discounted_price}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCoreData({
                      ...coreData,
                      discounted_price: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            {/* Custom Fields Display */}
            {customFields.length > 0 && (
              <div className="mt-6 space-y-4">
                <h4 className="text-sm font-semibold text-blue-800 border-b border-blue-200 pb-2">
                  Custom Fields
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {customFields.map((field, index) => (
                    <div key={index} className="relative">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-medium text-blue-700 capitalize">
                          {field.name} ({field.type})
                        </label>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => removeCustomField(index)}
                          className="text-red-500 hover:text-red-700 h-5 w-5 p-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      {field.type === "array" ? (
                        <textarea
                          className="w-full rounded-lg border border-blue-300 p-3 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200"
                          rows={2}
                          placeholder="Enter items separated by commas (e.g., item1, item2, item3)"
                          value={(field.value as string) || ""}
                          onChange={(e) =>
                            updateCustomField(index, e.target.value)
                          }
                        />
                      ) : (
                        <input
                          type={field.type === "int" ? "number" : "text"}
                          className="w-full rounded-lg border border-blue-300 p-3 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200"
                          placeholder={`Enter ${field.name}`}
                          value={field.value}
                          onChange={(e) =>
                            updateCustomField(index, e.target.value)
                          }
                        />
                      )}
                      {field.type === "array" && field.value && (
                        <div className="mt-1 text-xs text-gray-500">
                          Preview:{" "}
                          {typeof field.value === "string"
                            ? field.value
                                .split(",")
                                .map((s) => s.trim())
                                .filter(Boolean)
                                .join(", ")
                            : Array.isArray(field.value)
                            ? field.value.join(", ")
                            : ""}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Add Field Dialog */}
          {showAddField && (
            <div
              className="fixed inset-0 flex items-center justify-center z-9999"
              onClick={() => {
                setShowAddField(false);
                setNewFieldName("");
                setNewFieldType("string");
              }}
            >
              <div
                className="bg-white rounded-xl p-6 shadow-2xl border-2 border-gray-200 max-w-md w-full mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Add Custom Field
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Field Name
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="Enter field name"
                      value={newFieldName}
                      onChange={(e) => setNewFieldName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data Type
                    </label>
                    <select
                      className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      value={newFieldType}
                      onChange={(e) =>
                        setNewFieldType(
                          e.target.value as "string" | "int" | "array"
                        )
                      }
                    >
                      <option value="string">String (Text)</option>
                      <option value="int">Integer (Number)</option>
                      <option value="array">
                        Array (Comma-separated list)
                      </option>
                    </select>
                  </div>

                  {newFieldType === "array" && (
                    <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
                      <strong>Array Info:</strong> Values will be automatically
                      split by commas and trimmed of extra spaces.
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setShowAddField(false);
                      setNewFieldName("");
                      setNewFieldType("string");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={addCustomField}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Add Field
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Technical Specifications for selected component type */}
          {componentType && activeComponentSpecs.length > 0 && (
            <div className="space-y-6 mt-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                  <span className="text-2xl">⚡</span>
                  Technical Specifications for{" "}
                  {COMPONENT_TYPES.find((t) => t.id === componentType)?.name}
                </h3>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setAddFieldSection("techspec");
                    setShowAddField(true);
                  }}
                  className="text-purple-600 border-purple-600 hover:bg-purple-100 hover:border-purple-700 shadow-sm transition-all duration-300"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Field
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {activeComponentSpecs.map((spec) => (
                  <div key={spec.id}>
                    {spec.type === "enum" ? (
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-500 uppercase">
                          {spec.label} {spec.unit && `(${spec.unit})`}
                        </label>
                        <select
                          className="w-full rounded-lg border border-gray-300 p-3 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 shadow-sm"
                          value={String(compatSpecs[spec.id] || "")}
                          onChange={(e) =>
                            setCompatSpecs({
                              ...compatSpecs,
                              [spec.id]: e.target.value,
                            })
                          }
                        >
                          <option value="">-- Select {spec.label} --</option>
                          {(spec as SpecDefinition).enum?.map(
                            (option: string) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            )
                          )}
                        </select>
                      </div>
                    ) : (
                      <Input
                        label={`${spec.label} ${
                          spec.unit ? `(${spec.unit})` : ""
                        }`}
                        type={
                          spec.type === "int"
                            ? "number"
                            : spec.type === "float"
                            ? "number"
                            : spec.type === "bool"
                            ? "checkbox"
                            : "text"
                        }
                        step={spec.type === "float" ? "0.01" : "1"}
                        placeholder={`Enter ${spec.label.toLowerCase()}`}
                        value={compatSpecs[spec.id] || ""}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setCompatSpecs({
                            ...compatSpecs,
                            [spec.id]:
                              spec.type === "bool"
                                ? e.target.checked
                                : e.target.value,
                          })
                        }
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Tech Spec Custom Fields Display */}
              {techSpecCustomFields.length > 0 && (
                <div className="mt-6 space-y-4">
                  <h4 className="text-sm font-semibold text-purple-800 border-b border-purple-200 pb-2">
                    Custom Technical Fields
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    {techSpecCustomFields.map((field, index) => (
                      <div key={index} className="relative">
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-medium text-purple-700 capitalize">
                            {field.name} ({field.type})
                          </label>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => removeTechSpecCustomField(index)}
                            className="text-red-500 hover:text-red-700 h-5 w-5 p-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        {field.type === "array" ? (
                          <textarea
                            className="w-full rounded-lg border border-purple-300 p-3 text-sm bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all duration-200"
                            rows={2}
                            placeholder="Enter items separated by commas (e.g., item1, item2, item3)"
                            value={(field.value as string) || ""}
                            onChange={(e) =>
                              updateTechSpecCustomField(index, e.target.value)
                            }
                          />
                        ) : (
                          <input
                            type={field.type === "int" ? "number" : "text"}
                            className="w-full rounded-lg border border-purple-300 p-3 text-sm bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all duration-200"
                            placeholder={`Enter ${field.name}`}
                            value={field.value}
                            onChange={(e) =>
                              updateTechSpecCustomField(index, e.target.value)
                            }
                          />
                        )}
                        {field.type === "array" && field.value && (
                          <div className="mt-1 text-xs text-gray-500">
                            Preview:{" "}
                            {typeof field.value === "string"
                              ? field.value
                                  .split(",")
                                  .map((s) => s.trim())
                                  .filter(Boolean)
                                  .join(", ")
                              : Array.isArray(field.value)
                              ? field.value.join(", ")
                              : ""}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="px-6"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="px-6 bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={16} />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} className="mr-2" />
                  Save Component
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Extra Specs (JSON) Section */}
        <Card className="p-6 mt-6 bg-linear-to-r from-green-50 to-green-100 border-green-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-green-900 flex items-center gap-2">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white">
                📋
              </div>
              Extra Specs (JSON)
            </h3>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={addExtraSpec}
              className="text-green-600 border-green-600 hover:bg-green-100 hover:border-green-700 shadow-sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Spec
            </Button>
          </div>

          <div className="space-y-3">
            {extraSpecs.map((spec, index) => (
              <Card key={index} className="p-3 border border-gray-200">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs text-gray-500">
                    Spec {index + 1}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => removeExtraSpec(index)}
                    className="text-red-600 hover:bg-red-50 h-6 w-6 p-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Review
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none"
                      rows={3}
                      placeholder="Review notes or comments..."
                      value={spec.review}
                      onChange={(e) =>
                        updateExtraSpec(index, "review", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Source
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none font-mono"
                      rows={4}
                      placeholder="https://example.com/product-specs or JSON data"
                      value={spec.source}
                      onChange={(e) =>
                        updateExtraSpec(index, "source", e.target.value)
                      }
                    />
                  </div>
                </div>
              </Card>
            ))}

            {extraSpecs.length === 0 && (
              <div className="text-center py-6 text-gray-500">
                <p className="text-sm">No extra specs added</p>
                <p className="text-xs">
                  Click &quot;Add Spec&quot; to include additional JSON
                  specifications
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </Modal>
  );
}
