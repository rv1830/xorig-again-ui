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
import { Pencil, Save, Plus, Trash2, Wand2 } from "lucide-react"; // IndianRupee removed
import { api } from "@/lib/api";

// --- STRICT FIELD DEFINITIONS ---
interface FieldDefinition {
  key: string;
  label: string;
  type: "text" | "number";
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
    { key: "base_clock", label: "Base Clock (GHz)", type: "number" },
    { key: "boost_clock", label: "Boost Clock (GHz)", type: "number" },
    { key: "tdp_watts", label: "TDP (Watts)", type: "number" },
    { key: "integrated_gpu", label: "iGPU (true/false)", type: "text" },
    { key: "includes_cooler", label: "Cooler Included", type: "text" },
  ],
  GRAPHICS_CARD: [
    { key: "chipset", label: "Chipset", type: "text", ph: "RTX 4060" },
    { key: "vram_gb", label: "VRAM (GB)", type: "number" },
    { key: "length_mm", label: "Length (mm)", type: "number" },
    { key: "tdp_watts", label: "TDP (Watts)", type: "number" },
    { key: "recommended_psu", label: "Rec. PSU (Watts)", type: "number" },
  ],
  MOTHERBOARD: [
    { key: "socket", label: "Socket", type: "text" },
    { key: "form_factor", label: "Form Factor", type: "text", ph: "ATX, mATX" },
    { key: "memory_type", label: "RAM Type", type: "text", ph: "DDR4, DDR5" },
    { key: "memory_slots", label: "RAM Slots", type: "number" },
    { key: "max_memory_gb", label: "Max RAM (GB)", type: "number" },
    { key: "m2_slots", label: "M.2 Slots", type: "number" },
    { key: "wifi", label: "WiFi (true/false)", type: "text" },
  ],
  RAM: [
    { key: "memory_type", label: "Type", type: "text", ph: "DDR4, DDR5" },
    { key: "capacity_gb", label: "Total Capacity (GB)", type: "number" },
    { key: "modules", label: "Modules (Sticks)", type: "number" },
    { key: "speed_mhz", label: "Speed (MHz)", type: "number" },
    { key: "cas_latency", label: "CL", type: "number" },
  ],
  POWER_SUPPLY: [
    { key: "wattage", label: "Wattage", type: "number" },
    { key: "efficiency", label: "Efficiency", type: "text", ph: "80+ Gold" },
    { key: "modular", label: "Modular", type: "text", ph: "Full, Semi" },
  ],
  CABINET: [
    { key: "max_gpu_len_mm", label: "Max GPU Length (mm)", type: "number" },
    { key: "max_cpu_height", label: "Max CPU Cooler (mm)", type: "number" },
  ],
  SSD: [
    { key: "capacity_gb", label: "Capacity (GB)", type: "number" },
    { key: "interface", label: "Interface", type: "text", ph: "SATA, NVMe" },
    { key: "form_factor", label: "Form Factor", type: "text", ph: '2.5", M.2' },
    { key: "gen", label: "Gen", type: "text", ph: "Gen4" },
  ],
  HDD: [
    { key: "capacity_gb", label: "Capacity (GB)", type: "number" },
    { key: "rpm", label: "RPM", type: "number" },
    { key: "cache_mb", label: "Cache (MB)", type: "number" },
    {
      key: "form_factor",
      label: "Form Factor",
      type: "text",
      ph: '3.5", 2.5"',
    },
  ],
  CPU_COOLER: [
    { key: "type", label: "Type", type: "text", ph: "Air, AIO" },
    { key: "height_mm", label: "Height (mm)", type: "number" },
    { key: "radiator_size", label: "Radiator (mm)", type: "number" },
  ],
  MONITOR: [
    { key: "size_inches", label: "Size (inches)", type: "number" },
    { key: "resolution", label: "Resolution", type: "text", ph: "1920x1080" },
    { key: "refresh_rate", label: "Refresh Rate (Hz)", type: "number" },
    { key: "panel_type", label: "Panel Type", type: "text", ph: "IPS, VA" },
    { key: "response_time", label: "Response Time (ms)", type: "number" },
  ],
  KEYBOARD: [
    {
      key: "switch_type",
      label: "Switch Type",
      type: "text",
      ph: "Mechanical, Membrane",
    },
    { key: "layout", label: "Layout", type: "text", ph: "QWERTY, TKL" },
    { key: "backlit", label: "Backlit", type: "text", ph: "true/false" },
    { key: "wireless", label: "Wireless", type: "text", ph: "true/false" },
  ],
  MOUSE: [
    { key: "dpi", label: "DPI", type: "number" },
    {
      key: "sensor_type",
      label: "Sensor Type",
      type: "text",
      ph: "Optical, Laser",
    },
    { key: "wireless", label: "Wireless", type: "text", ph: "true/false" },
    { key: "buttons", label: "Buttons", type: "number" },
  ],
  HEADSET: [
    { key: "driver_size", label: "Driver Size (mm)", type: "number" },
    { key: "impedance", label: "Impedance (ohms)", type: "number" },
    { key: "frequency_response", label: "Frequency Response", type: "text" },
    { key: "wireless", label: "Wireless", type: "text", ph: "true/false" },
    {
      key: "noise_cancellation",
      label: "Noise Cancellation",
      type: "text",
      ph: "true/false",
    },
  ],
  ADDITIONAL_CASE_FANS: [
    { key: "size_mm", label: "Size (mm)", type: "number" },
    { key: "speed_rpm", label: "Speed (RPM)", type: "number" },
    { key: "noise_level", label: "Noise Level (dBA)", type: "number" },
    { key: "airflow_cfm", label: "Airflow (CFM)", type: "number" },
  ],
};

// Type definitions
interface ComponentOffer {
  price: number;
  vendor?: string;
  url?: string;
}

interface ComponentData {
  id?: string;
  component_id?: string;
  type: string;
  manufacturer: string;
  vendor?: string;
  model_name: string;
  model_number: string;
  product_page_url?: string;
  image_url?: string;
  price?: number;
  discounted_price?: number;
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
  offers?: ComponentOffer[];
  [key: string]: unknown;
}

interface DetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  component: ComponentData | null;
  onSave: (data: ComponentData) => void;
  isCreating: boolean;
}

interface CustomSpec {
  review: string;
  source: string;
}

interface DynamicField {
  key: string;
  label: string;
  type: "text" | "number" | "array";
  value: string | number;
  rawValue?: string; // For array type, store raw input string
  section?: "core_identity" | "technical_specs"; // Track which section this field belongs to
}

export default function DetailsDrawer({
  open,
  onOpenChange,
  component,
  onSave,
  isCreating,
}: DetailsDrawerProps) {
  const { toast } = useToast();
  const [editMode, setEditMode] = useState(false);

  // --- STATE MANAGEMENT ---
  const [coreData, setCoreData] = useState<Partial<ComponentData>>({});
  const [compatSpecs, setCompatSpecs] = useState<Record<string, unknown>>({});
  const [customSpecs, setCustomSpecs] = useState<CustomSpec[]>([]);
  const [dynamicFields, setDynamicFields] = useState<DynamicField[]>([]);
  const [coreIdentityCustomFields, setCoreIdentityCustomFields] = useState<
    DynamicField[]
  >([]);
  const [techSpecCustomFields, setTechSpecCustomFields] = useState<
    DynamicField[]
  >([]);
  const [showAddFieldDialog, setShowAddFieldDialog] = useState(false);
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState<"text" | "number" | "array">(
    "text"
  );
  const [newFieldSection, setNewFieldSection] = useState<
    "core_identity" | "technical_specs"
  >("core_identity");

  // Tools State
  // ✅ Removed manualPrice state
  const [fetchingSpecs, setFetchingSpecs] = useState<boolean>(false);

  useEffect(() => {
    if (!component) return;

    // Initialize all core fields with empty strings to avoid controlled/uncontrolled issues
    setCoreData({
      id: component.id,
      type: component.type || "PROCESSOR",
      manufacturer: component.manufacturer || "",
      vendor: component.vendor || "",
      model_name: component.model_name || "",
      model_number: component.model_number || "",
      product_page_url: component.product_page_url || "",
      image_url: component.image_url || "",
      price:
        component.price !== undefined ? Number(component.price) : undefined,
      discounted_price:
        component.discounted_price !== undefined
          ? Number(component.discounted_price)
          : undefined,
      offers: component.offers || [],
    });

    // Load strict compatibility data based on component type
    const typeKey = component.type?.toLowerCase();
    const strictData = (component[typeKey] as Record<string, unknown>) || {};
    console.log("Loading strict data for", typeKey, ":", strictData);

    // Initialize compatSpecs with proper default values
    const initialCompatSpecs: Record<string, unknown> = {};
    if (strictData && Object.keys(strictData).length > 0) {
      Object.entries(strictData).forEach(([key, value]) => {
        if (key !== "id" && key !== "componentId") {
          initialCompatSpecs[key] = value ?? "";
        }
      });
    }
    setCompatSpecs(initialCompatSpecs);

    const jsonSpecs = component.specs || {};
    console.log("🔍 DEBUG - Full component data:", component);
    console.log("🔍 DEBUG - component.specs:", jsonSpecs);
    console.log("🔍 DEBUG - Object.keys(jsonSpecs):", Object.keys(jsonSpecs));

    const coreIdentityFields: DynamicField[] = [];
    const techSpecFields: DynamicField[] = [];
    const dynamicFieldsFromSpecs: DynamicField[] = [];

    // Load extra_specs array if it exists
    const extraSpecsArray: CustomSpec[] = [];
    if (jsonSpecs.extra_specs && Array.isArray(jsonSpecs.extra_specs)) {
      jsonSpecs.extra_specs.forEach(
        (spec: { review: string; source: string }) => {
          if (spec.review || spec.source) {
            extraSpecsArray.push({
              review: spec.review || "",
              source: spec.source || "",
            });
          }
        }
      );
    }
    setCustomSpecs(extraSpecsArray);

    // Separate core identity and tech spec custom fields based on common naming patterns
    const coreIdentityKeys = [
      "asdsa",
      "name",
      "aesdsd",
      "manufacturer",
      "vendor",
      "model",
      "price",
      "brand",
    ];
    const techSpecKeys = [
      "sdfsdf",
      "sdldf",
      "saghtertg",
      "socket",
      "cores",
      "threads",
      "speed",
      "capacity",
      "wattage",
    ];

    Object.entries(jsonSpecs).forEach(([k, v]) => {
      // Skip extra_specs as it's handled separately above
      if (k === "extra_specs") {
        return;
      }

      // Check if this is a dynamic field or custom field
      if (k.startsWith("_dynamic_")) {
        const actualKey = k.replace("_dynamic_", "");
        console.log(`🔍 Processing dynamic field: "${actualKey}"`, v);

        const valueObj =
          typeof v === "object" && v !== null && "v" in v
            ? (v as Record<string, unknown>)
            : null;
        const value = valueObj ? valueObj.v : v;

        console.log(`  - valueObj:`, valueObj);
        console.log(
          `  - valueObj has section?`,
          valueObj && "section" in valueObj
        );
        console.log(
          `  - section value:`,
          valueObj && "section" in valueObj ? valueObj.section : "NOT FOUND"
        );

        let section: "core_identity" | "technical_specs" =
          valueObj && "section" in valueObj && valueObj.section
            ? (valueObj.section as "core_identity" | "technical_specs")
            : "core_identity"; // Default to core_identity

        console.log(`  - Final section assigned:`, section);

        console.log(`  - Final section assigned:`, section);

        // If section is still undefined/null, auto-categorize based on field name patterns
        if (!section || section === undefined) {
          console.log(`  - No section found, auto-categorizing...`);
          const lowerKey = actualKey.toLowerCase();
          // General patterns that work for any field names
          const corePatterns = [
            "name",
            "model",
            "brand",
            "vendor",
            "price",
            "cost",
            "url",
            "link",
            "image",
            "photo",
            "description",
            "review",
            "source",
            "manufacturer",
            "company",
            "title",
            "category",
            "color",
            "size",
            "weight",
            "material",
            "style",
            "type",
            "series",
            "edition",
          ];
          const techPatterns = [
            "socket",
            "core",
            "thread",
            "speed",
            "frequency",
            "capacity",
            "memory",
            "storage",
            "wattage",
            "voltage",
            "tdp",
            "gpu",
            "cooler",
            "fan",
            "temperature",
            "performance",
            "benchmark",
            "mhz",
            "ghz",
            "gb",
            "mb",
            "watts",
            "rpm",
            "clock",
            "cache",
            "bus",
            "bandwidth",
            "latency",
            "power",
            "thermal",
            "pcie",
            "sata",
            "ddr",
            "interface",
          ];

          const isCoreField = corePatterns.some((pattern) =>
            lowerKey.includes(pattern)
          );
          const isTechField = techPatterns.some((pattern) =>
            lowerKey.includes(pattern)
          );

          if (isTechField && !isCoreField) {
            section = "technical_specs";
          } else {
            section = "core_identity";
          }

          console.log(`🔍 Auto-categorized field "${actualKey}" as:`, section);
        }

        const isArray = Array.isArray(value);
        const isNumber = typeof value === "number";

        dynamicFieldsFromSpecs.push({
          key: actualKey,
          label: actualKey
            .split("_")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" "),
          type: isArray ? "array" : isNumber ? "number" : "text",
          value: isArray ? (value as string[]).join(", ") : String(value),
          rawValue: isArray ? (value as string[]).join(", ") : String(value),
          section, // Extract and preserve section metadata
        });
      } else {
        // This might be a custom field - categorize as core identity or tech spec
        const componentType = (component.type || "PROCESSOR") as ComponentType;
        const predefinedFields = STRICT_FIELDS[componentType] || [];
        const predefinedKeys = predefinedFields.map((f) => f.key);
        const systemFields = [
          "extra_specs",
          "id",
          "component_id",
          "componentid",
          "created_at",
          "updated_at",
        ];

        if (
          !predefinedKeys.includes(k) &&
          !systemFields.includes(k.toLowerCase())
        ) {
          const value =
            typeof v === "object" && v !== null && "v" in v
              ? (v as Record<string, unknown>).v
              : v;
          const isArray = Array.isArray(value);
          const isNumber = typeof value === "number";

          const fieldData = {
            key: k,
            label: k
              .split("_")
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(" "),
            type: isArray ? "array" : isNumber ? "number" : "text",
            value: isArray ? (value as string[]).join(", ") : String(value),
            rawValue: isArray ? (value as string[]).join(", ") : String(value),
          } as DynamicField;

          // Categorize field based on name patterns
          const lowerKey = k.toLowerCase();
          const isCoreField =
            coreIdentityKeys.some((coreKey) =>
              lowerKey.includes(coreKey.toLowerCase())
            ) ||
            [
              "name",
              "manufacturer",
              "vendor",
              "model",
              "price",
              "brand",
            ].includes(lowerKey);
          const isTechField =
            techSpecKeys.some((techKey) =>
              lowerKey.includes(techKey.toLowerCase())
            ) ||
            [
              "socket",
              "core",
              "thread",
              "speed",
              "capacity",
              "watt",
              "clock",
              "memory",
            ].includes(lowerKey);

          if (isCoreField) {
            coreIdentityFields.push(fieldData);
          } else if (isTechField) {
            techSpecFields.push(fieldData);
          } else {
            dynamicFieldsFromSpecs.push(fieldData);
          }
        }
      }
    });

    // Load dynamic fields from initialCompatSpecs
    const componentType = (component.type || "PROCESSOR") as ComponentType;
    const predefinedFields = STRICT_FIELDS[componentType] || [];
    const predefinedKeys = predefinedFields.map((f) => f.key);
    console.log("Predefined keys:", predefinedKeys);

    // System fields that should never be shown as dynamic fields (case-insensitive check)
    const systemFields = [
      "id",
      "component_id",
      "componentid",
      "created_at",
      "updated_at",
      "createdat",
      "updatedat",
    ];

    const dynamicFieldsFromDB: DynamicField[] = [];
    Object.entries(initialCompatSpecs).forEach(([key, value]) => {
      const lowerKey = key.toLowerCase();
      console.log(
        `Checking field: ${key}, isPredefined: ${predefinedKeys.includes(
          key
        )}, isSystem: ${systemFields.includes(lowerKey)}`
      );
      if (!predefinedKeys.includes(key) && !systemFields.includes(lowerKey)) {
        // This is a dynamic field
        const isArray = Array.isArray(value);
        const isNumber = typeof value === "number";

        dynamicFieldsFromDB.push({
          key: key,
          label: key
            .split("_")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" "),
          type: isArray ? "array" : isNumber ? "number" : "text",
          value: isArray ? (value as string[]).join(", ") : String(value),
          rawValue: isArray ? (value as string[]).join(", ") : String(value),
        });
      }
    });

    console.log("Dynamic fields loaded from DB:", dynamicFieldsFromDB);

    // Merge dynamic fields from both compatSpecs and specs
    const allDynamicFields = [
      ...dynamicFieldsFromDB,
      ...dynamicFieldsFromSpecs,
    ];

    console.log("📊 Final field categorization:");
    console.log("  - Core Identity Custom Fields:", coreIdentityFields);
    console.log("  - Tech Spec Custom Fields:", techSpecFields);
    console.log("  - All Dynamic Fields:", allDynamicFields);
    console.log("🔍 DEBUG - Dynamic fields with sections:");
    allDynamicFields.forEach((field, idx) => {
      console.log(
        `  Field ${idx}: "${field.key}" -> section: "${field.section}"`
      );
    });

    setDynamicFields(allDynamicFields);

    // Store separate field categories for proper rendering
    setCoreIdentityCustomFields(coreIdentityFields);
    setTechSpecCustomFields(techSpecFields);

    setEditMode(!!isCreating);
  }, [component, isCreating, open]);

  // --- HANDLERS ---
  function handleSave() {
    console.log("🔍 handleSave called");
    console.log("coreData:", coreData);

    // Validation
    if (!coreData.manufacturer?.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Manufacturer is required",
      });
      return;
    }

    if (!coreData.model_name?.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Model Name is required",
      });
      return;
    }

    if (!coreData.model_number?.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Model Number is required",
      });
      return;
    }

    const specsJson: Record<string, unknown> = {};

    // Add extra_specs array (only non-empty entries)
    const validExtraSpecs = customSpecs.filter(
      (spec) => spec.review || spec.source
    );
    if (validExtraSpecs.length > 0) {
      specsJson.extra_specs = validExtraSpecs;
    }

    // Add dynamic fields to specs with special prefix
    dynamicFields.forEach((field) => {
      let value: unknown;
      if (field.type === "array") {
        value = (field.rawValue || "")
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item.length > 0);
      } else {
        value = field.value;
      }

      specsJson[`_dynamic_${field.key}`] = {
        v: value,
        source_id: "manual",
        confidence: 1.0,
        updated_at: new Date().toISOString(),
        section: field.section || "core_identity", // Include section metadata
      };
    });

    // Include only predefined fields in compatSpecs
    const finalCompatSpecs: Record<string, unknown> = {};
    const componentType = (coreData.type || "PROCESSOR") as ComponentType;
    const predefinedFields = STRICT_FIELDS[componentType] || [];

    predefinedFields.forEach((field) => {
      if (compatSpecs[field.key] !== undefined) {
        finalCompatSpecs[field.key] = compatSpecs[field.key];
      }
    });

    const payload = {
      ...coreData,
      type: coreData.type || "PROCESSOR",
      manufacturer: coreData.manufacturer || "",
      vendor: coreData.vendor || undefined,
      model_name: coreData.model_name || "",
      model_number: coreData.model_number || "",
      product_page_url: coreData.product_page_url || "",
      price: coreData.price ? Number(coreData.price) : undefined,
      discounted_price: coreData.discounted_price
        ? Number(coreData.discounted_price)
        : undefined,
      image_url: coreData.image_url || "",
      specs: specsJson,
      compat_specs: finalCompatSpecs,
    };

    console.log("📤 Sending payload:");
    console.log("  - type:", payload.type);
    console.log("  - manufacturer:", payload.manufacturer);
    console.log("  - vendor:", payload.vendor);
    console.log("  - model_name:", payload.model_name);
    console.log("  - model_number:", payload.model_number);
    console.log("  - product_page_url:", payload.product_page_url);
    console.log("  - compat_specs:", payload.compat_specs);
    console.log("Full payload:", JSON.stringify(payload, null, 2));

    onSave(payload);
  }

  function addSpecRow() {
    setCustomSpecs([...customSpecs, { review: "", source: "" }]);
  }
  function removeSpecRow(idx: number) {
    setCustomSpecs(customSpecs.filter((_, i) => i !== idx));
  }
  function updateSpecRow(idx: number, field: "review" | "source", val: string) {
    const copy = [...customSpecs];
    copy[idx][field] = val;
    setCustomSpecs(copy);
  }

  // Dynamic field handlers
  function addDynamicField(
    section: "core_identity" | "technical_specs" = "core_identity"
  ) {
    if (!newFieldName.trim()) {
      toast({ title: "Error", description: "Field name is required" });
      return;
    }

    const newField: DynamicField = {
      key: newFieldName.trim().toLowerCase().replace(/\s+/g, "_"),
      label: newFieldName.trim(),
      type: newFieldType,
      value: newFieldType === "number" ? 0 : "",
      rawValue: "",
      section, // Track which section this field belongs to
    };

    setDynamicFields([...dynamicFields, newField]);

    // Also add to compatSpecs immediately
    setCompatSpecs({
      ...compatSpecs,
      [newField.key]:
        newFieldType === "number" ? 0 : newFieldType === "array" ? [] : "",
    });

    setShowAddFieldDialog(false);
    setNewFieldName("");
    setNewFieldType("text");
    setNewFieldSection("core_identity");
  }

  function removeDynamicField(idx: number) {
    const field = dynamicFields[idx];
    setDynamicFields(dynamicFields.filter((_, i) => i !== idx));

    // Also remove from compatSpecs
    const updatedCompatSpecs = { ...compatSpecs };
    delete updatedCompatSpecs[field.key];
    setCompatSpecs(updatedCompatSpecs);
  }

  function updateDynamicField(idx: number, val: string) {
    const copy = [...dynamicFields];
    const field = copy[idx];

    if (field.type === "number") {
      field.value = Number(val) || 0;
    } else if (field.type === "array") {
      // Store raw input string
      field.rawValue = val;
      // Parse to array for storage
      field.value = val
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
        .join(", ");
    } else {
      field.value = val;
    }

    setDynamicFields(copy);

    // Also update compatSpecs
    if (field.type === "array") {
      // Store as array in compatSpecs
      const arrayValue = val
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
      setCompatSpecs({
        ...compatSpecs,
        [field.key]: arrayValue,
      });
    } else {
      setCompatSpecs({
        ...compatSpecs,
        [field.key]: field.value,
      });
    }
  }

  async function handleAutoSpecs() {
    if (!coreData.product_page_url)
      return toast({ title: "Error", description: "Product URL required" });
    setFetchingSpecs(true);
    try {
      const scraped = await api.fetchSpecsFromUrl(coreData.product_page_url);
      const newSpecs = [...customSpecs];
      Object.entries(scraped).forEach(([k, v]) => {
        // Add scraped data as a review entry
        if (!newSpecs.find((s) => s.review === k))
          newSpecs.push({ review: k, source: String(v) });
      });
      setCustomSpecs(newSpecs);
      toast({
        title: "Specs Fetched",
        description: "Review fields and save changes.",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Scraping failed.",
      });
    } finally {
      setFetchingSpecs(false);
    }
  }

  // ✅ Removed handleManualPrice function

  if (!coreData.type) return null;
  const strictFields = STRICT_FIELDS[coreData.type as ComponentType] || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-7xl max-h-[95vh] overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }}
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
          className="flex flex-col h-full"
        >
          <DialogHeader className="sr-only">
            <DialogTitle>
              {isCreating
                ? "Create New Component"
                : `${coreData.manufacturer} ${coreData.model_number} Details`}
            </DialogTitle>
            <DialogDescription>
              {isCreating
                ? "Add a new component to the system with specifications and details."
                : "Edit component details and technical specifications."}
            </DialogDescription>
          </DialogHeader>

          {/* Modern Header */}
          <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between px-8 py-5">
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
                  {isCreating
                    ? "Create New Component"
                    : `${coreData.manufacturer} ${coreData.model_number}`}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {coreData.type?.replace(/_/g, " ")} • ID:{" "}
                  {coreData.id || "New"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {isCreating && (
                  <Select
                    value={coreData.type}
                    onValueChange={(v) => {
                      setCoreData({ ...coreData, type: v });
                      setCompatSpecs({});
                    }}
                  >
                    <SelectTrigger className="w-48 h-10 rounded-lg bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg">
                      {Object.keys(STRICT_FIELDS).map((k) => (
                        <SelectItem key={k} value={k} className="rounded-md">
                          {k.replace(/_/g, " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Button
                  size="sm"
                  onClick={() => (editMode ? handleSave() : setEditMode(true))}
                  className="h-10 px-6 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {editMode ? (
                    <>
                      <Save className="w-4 h-4 mr-2" /> Save Changes
                    </>
                  ) : (
                    <>
                      <Pencil className="w-4 h-4 mr-2" /> Edit
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Content Area with Modern Layout */}
          <div className="overflow-y-auto max-h-[calc(95vh-100px)] px-8 py-6">
            <div className="grid grid-cols-12 gap-6">
              {/* Left Sidebar - Core Info */}
              <div className="col-span-4 space-y-6">
                {/* Basic Information */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
                    Basic Information
                  </h3>
                  <div className="space-y-4">
                    <DetailInput
                      label="Manufacturer"
                      disabled={!editMode}
                      value={coreData.manufacturer}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setCoreData({
                          ...coreData,
                          manufacturer: e.target.value,
                        })
                      }
                      className="h-10"
                    />
                    <DetailInput
                      label="Vendor"
                      disabled={!editMode}
                      value={coreData.vendor}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setCoreData({ ...coreData, vendor: e.target.value })
                      }
                      className="h-10"
                    />
                    <DetailInput
                      label="Model Name"
                      disabled={!editMode}
                      value={coreData.model_name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setCoreData({ ...coreData, model_name: e.target.value })
                      }
                      className="h-10"
                    />
                    <DetailInput
                      label="Model Number"
                      disabled={!editMode}
                      value={coreData.model_number}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setCoreData({
                          ...coreData,
                          model_number: e.target.value,
                        })
                      }
                      className="h-10"
                    />

                    {/* Core Identity Custom Fields */}
                    {coreIdentityCustomFields.map((field, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                            {field.label} (Custom)
                          </label>
                          {editMode && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                const updated = coreIdentityCustomFields.filter(
                                  (_, i) => i !== idx
                                );
                                setCoreIdentityCustomFields(updated);
                              }}
                              className="h-6 w-6 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        {field.type === "array" ? (
                          <div className="space-y-2">
                            <textarea
                              disabled={!editMode}
                              className="w-full h-20 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3 text-sm resize-none"
                              value={field.value}
                              onChange={(e) => {
                                const updated = [...coreIdentityCustomFields];
                                updated[idx] = {
                                  ...field,
                                  value: e.target.value,
                                };
                                setCoreIdentityCustomFields(updated);
                              }}
                            />
                            {field.value && (
                              <div className="flex flex-wrap gap-1">
                                {String(field.value)
                                  .split(",")
                                  .map((item: string, i: number) => (
                                    <span
                                      key={i}
                                      className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded"
                                    >
                                      {item.trim()}
                                    </span>
                                  ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <Input
                            disabled={!editMode}
                            type={field.type}
                            className="h-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                            value={field.value}
                            onChange={(e) => {
                              const updated = [...coreIdentityCustomFields];
                              updated[idx] = {
                                ...field,
                                value: e.target.value,
                              };
                              setCoreIdentityCustomFields(updated);
                            }}
                          />
                        )}
                      </div>
                    ))}

                    {/* Dynamic Core Identity Fields */}
                    {(() => {
                      const coreFields = dynamicFields.filter(
                        (field) => field.section === "core_identity"
                      );
                      console.log(
                        "🔍 Core Identity dynamic fields:",
                        coreFields
                      );
                      console.log(
                        "🔍 Available sections in dynamic fields:",
                        dynamicFields.map((f) => f.section)
                      );
                      return coreFields.map((field, idx) => (
                        <div key={`dynamic-core-${idx}`} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                              {field.label} (Custom)
                            </label>
                            {editMode && (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                  removeDynamicField(
                                    dynamicFields.indexOf(field)
                                  );
                                }}
                                className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                          {field.type === "array" ? (
                            <div className="space-y-2">
                              <Input
                                disabled={!editMode}
                                placeholder="item1, item2, item3"
                                className="h-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                                value={field.rawValue || field.value}
                                onChange={(e) => {
                                  updateDynamicField(
                                    dynamicFields.indexOf(field),
                                    e.target.value
                                  );
                                }}
                              />
                              {field.value && (
                                <div className="flex flex-wrap gap-1">
                                  {String(field.value)
                                    .split(",")
                                    .map((item: string, i: number) => (
                                      <span
                                        key={i}
                                        className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded"
                                      >
                                        {item.trim()}
                                      </span>
                                    ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <Input
                              disabled={!editMode}
                              type={field.type}
                              className="h-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                              value={field.value}
                              onChange={(e) => {
                                updateDynamicField(
                                  dynamicFields.indexOf(field),
                                  e.target.value
                                );
                              }}
                            />
                          )}
                        </div>
                      ));
                    })()}

                    {/* Add Field Button for Core Identity */}
                    {editMode && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setNewFieldSection("core_identity");
                          setShowAddFieldDialog(true);
                        }}
                        className="w-full h-9 rounded-lg border-dashed border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-blue-400 hover:text-blue-600"
                      >
                        <Plus className="w-4 h-4 mr-2" /> Add Core Identity
                        Field
                      </Button>
                    )}
                  </div>
                </div>

                {/* Pricing */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
                    Pricing
                  </h3>
                  <div className="space-y-4">
                    <DetailInput
                      label="Price (₹)"
                      disabled={!editMode}
                      type="number"
                      value={coreData.price}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setCoreData({
                          ...coreData,
                          price: parseFloat(e.target.value),
                        })
                      }
                      className="h-10"
                    />
                    <DetailInput
                      label="Discounted Price (₹)"
                      disabled={!editMode}
                      type="number"
                      value={coreData.discounted_price}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setCoreData({
                          ...coreData,
                          discounted_price: parseFloat(e.target.value),
                        })
                      }
                      className="h-10"
                    />
                  </div>
                </div>

                {/* Product URL */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
                    Product URL
                  </h3>
                  <div className="flex gap-2">
                    <DetailInput
                      disabled={!editMode}
                      value={coreData.product_page_url}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setCoreData({
                          ...coreData,
                          product_page_url: e.target.value,
                        })
                      }
                      className="h-10"
                    />
                    {editMode && (
                      <Button
                        size="icon"
                        variant="outline"
                        disabled={fetchingSpecs}
                        onClick={handleAutoSpecs}
                        className="h-10 w-10 shrink-0 rounded-lg border-slate-300 dark:border-slate-600"
                      >
                        {fetchingSpecs ? (
                          <div className="animate-spin">⏳</div>
                        ) : (
                          <Wand2 className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="col-span-8 space-y-6">
                {/* Technical Specifications */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="border-b border-slate-200 dark:border-slate-700 px-6 py-4">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                      Technical Specifications
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-4">
                      {strictFields.map((f) => (
                        <div key={f.key}>
                          <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2 block">
                            {f.label}
                          </label>
                          <Input
                            disabled={!editMode}
                            type={f.type}
                            placeholder={f.ph}
                            className="h-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                            value={
                              compatSpecs[f.key] !== undefined
                                ? String(compatSpecs[f.key])
                                : ""
                            }
                            onChange={(e) =>
                              setCompatSpecs({
                                ...compatSpecs,
                                [f.key]:
                                  f.type === "number"
                                    ? parseFloat(e.target.value) || 0
                                    : e.target.value,
                              })
                            }
                          />
                        </div>
                      ))}

                      {/* Technical Specifications Custom Fields */}
                      {techSpecCustomFields.map((field, idx) => (
                        <div key={idx} className="col-span-2">
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                              {field.label} (Custom)
                            </label>
                            {editMode && (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                  const updated = techSpecCustomFields.filter(
                                    (_, i) => i !== idx
                                  );
                                  setTechSpecCustomFields(updated);
                                }}
                                className="h-6 w-6 text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                          {field.type === "array" ? (
                            <div className="space-y-2">
                              <textarea
                                disabled={!editMode}
                                className="w-full h-20 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3 text-sm resize-none"
                                value={field.value}
                                onChange={(e) => {
                                  const updated = [...techSpecCustomFields];
                                  updated[idx] = {
                                    ...field,
                                    value: e.target.value,
                                  };
                                  setTechSpecCustomFields(updated);
                                }}
                              />
                              {field.value && (
                                <div className="flex flex-wrap gap-1">
                                  {String(field.value)
                                    .split(",")
                                    .map((item: string, i: number) => (
                                      <span
                                        key={i}
                                        className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded"
                                      >
                                        {item.trim()}
                                      </span>
                                    ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <Input
                              disabled={!editMode}
                              type={field.type}
                              className="h-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                              value={field.value}
                              onChange={(e) => {
                                const updated = [...techSpecCustomFields];
                                updated[idx] = {
                                  ...field,
                                  value: e.target.value,
                                };
                                setTechSpecCustomFields(updated);
                              }}
                            />
                          )}
                        </div>
                      ))}

                      {/* Dynamic Technical Specifications Fields */}
                      {(() => {
                        const techFields = dynamicFields.filter(
                          (field) => field.section === "technical_specs"
                        );
                        console.log(
                          "🔍 Technical Specs dynamic fields:",
                          techFields
                        );
                        return techFields.map((field, idx) => (
                          <div
                            key={`dynamic-tech-${idx}`}
                            className="col-span-2"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                                {field.label} (Custom)
                              </label>
                              {editMode && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => {
                                    removeDynamicField(
                                      dynamicFields.indexOf(field)
                                    );
                                  }}
                                  className="h-6 w-6 text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                            {field.type === "array" ? (
                              <div className="space-y-2">
                                <Input
                                  disabled={!editMode}
                                  placeholder="item1, item2, item3"
                                  className="h-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                                  value={field.rawValue || field.value}
                                  onChange={(e) => {
                                    updateDynamicField(
                                      dynamicFields.indexOf(field),
                                      e.target.value
                                    );
                                  }}
                                />
                                {field.value && (
                                  <div className="flex flex-wrap gap-1">
                                    {String(field.value)
                                      .split(",")
                                      .map((item: string, i: number) => (
                                        <span
                                          key={i}
                                          className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded"
                                        >
                                          {item.trim()}
                                        </span>
                                      ))}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <Input
                                disabled={!editMode}
                                type={field.type}
                                className="h-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                                value={field.value}
                                onChange={(e) => {
                                  updateDynamicField(
                                    dynamicFields.indexOf(field),
                                    e.target.value
                                  );
                                }}
                              />
                            )}
                          </div>
                        ));
                      })()}

                      {/* Add Field Button for Technical Specifications */}
                      {editMode && (
                        <div className="col-span-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setNewFieldSection("technical_specs");
                              setShowAddFieldDialog(true);
                            }}
                            className="w-full h-9 rounded-lg border-dashed border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-blue-400 hover:text-blue-600"
                          >
                            <Plus className="w-4 h-4 mr-2" /> Add Technical
                            Specification Field
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Extra Specs (Reviews) */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                      Reviews & Sources
                    </h3>
                    {editMode && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={addSpecRow}
                        className="h-8 rounded-lg"
                      >
                        <Plus className="w-4 h-4 mr-1" /> Add Review
                      </Button>
                    )}
                  </div>
                  <div className="p-6 space-y-4">
                    {customSpecs.map((spec, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700"
                      >
                        <div>
                          <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2 block">
                            Review
                          </label>
                          <Input
                            disabled={!editMode}
                            placeholder="Review text"
                            className="h-10 bg-white dark:bg-slate-900"
                            value={spec.review}
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>
                            ) => updateSpecRow(idx, "review", e.target.value)}
                          />
                        </div>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2 block">
                              Source
                            </label>
                            <Input
                              disabled={!editMode}
                              placeholder="Source URL"
                              className="h-10 bg-white dark:bg-slate-900"
                              value={spec.source}
                              onChange={(
                                e: React.ChangeEvent<HTMLInputElement>
                              ) => updateSpecRow(idx, "source", e.target.value)}
                            />
                          </div>
                          {editMode && (
                            <Button
                              size="icon"
                              variant="destructive"
                              className="h-10 w-10 mt-6"
                              onClick={() => removeSpecRow(idx)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    {customSpecs.length === 0 && (
                      <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                        <p className="text-sm">No reviews added yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </DialogContent>

      {/* Add Field Dialog */}
      <Dialog open={showAddFieldDialog} onOpenChange={setShowAddFieldDialog}>
        <DialogContent className="sm:max-w-md rounded-lg bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-700">
          <DialogHeader className="border-b border-slate-200 dark:border-slate-700 pb-4">
            <DialogTitle className="text-lg font-semibold text-slate-900 dark:text-white">
              Add New Field
            </DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-400">
              Create a new custom field for this component
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block text-slate-700 dark:text-slate-300">
                Field Name
              </label>
              <Input
                placeholder="e.g., Max Fan Size"
                value={newFieldName}
                onChange={(e) => setNewFieldName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    addDynamicField(newFieldSection);
                  }
                }}
                className="rounded-xl border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-semibold mb-2 block text-slate-700 dark:text-slate-300">
                Data Type
              </label>
              <Select
                value={newFieldType}
                onValueChange={(value: "text" | "number" | "array") =>
                  setNewFieldType(value)
                }
              >
                <SelectTrigger className="rounded-xl border-slate-300 dark:border-slate-600">
                  <SelectValue placeholder="Select data type" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="text" className="rounded-lg">
                    String (Text)
                  </SelectItem>
                  <SelectItem value="number" className="rounded-lg">
                    Integer (Number)
                  </SelectItem>
                  <SelectItem value="array" className="rounded-lg">
                    Array (Comma-separated)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-semibold mb-2 block text-slate-700 dark:text-slate-300">
                Section
              </label>
              <Select
                value={newFieldSection}
                onValueChange={(value: "core_identity" | "technical_specs") =>
                  setNewFieldSection(value)
                }
              >
                <SelectTrigger className="rounded-xl border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500">
                  <SelectValue placeholder="Choose section" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                  <SelectItem value="core_identity" className="rounded-md">
                    Core Identity Fields
                  </SelectItem>
                  <SelectItem value="technical_specs" className="rounded-md">
                    Technical Specifications
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-200 dark:border-slate-700 pt-4 -mx-6 px-6 -mb-6 pb-6 bg-slate-50 dark:bg-slate-800/50 rounded-b-3xl">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddFieldDialog(false);
                setNewFieldName("");
                setNewFieldType("text");
                setNewFieldSection("core_identity");
              }}
              className="cursor-pointer rounded-xl border-slate-300 dark:border-slate-600"
            >
              Cancel
            </Button>
            <Button
              onClick={() => addDynamicField(newFieldSection)}
              className="cursor-pointer rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Field
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

interface DetailInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  className?: string;
}

function DetailInput({ label, className, ...props }: DetailInputProps) {
  return (
    <div>
      {label && (
        <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2 block">
          {label}
        </label>
      )}
      <Input
        className={`bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 ${className}`}
        {...props}
      />
    </div>
  );
}
