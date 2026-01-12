import axios from "axios";

// ✅ Make sure Backend is running on Port 5000
const API_BASE = "https://xoring-backagain.onrender.com/api";

export const api = {
  // 1. Get Master Data (Categories, Rules)
  getInitData: async () => {
    try {
      const res = await axios.get(`${API_BASE}/master-data`);
      return res.data;
    } catch (error) {
      console.error("API Error - getInitData:", error);
      return null;
    }
  },

  // 2. Get Components (Updated to handle Pagination & Sorting)
  getComponents: async (
    category?: string, 
    search?: string, 
    page: number = 1, 
    limit: number = 20, 
    sortKey: string = 'updatedAt', 
    sortDir: string = 'desc'
  ) => {
    try {
      const params: Record<string, any> = {
        page,
        limit,
        sortKey,
        sortDir
      };
      
      if (category && category !== "All") params.type = category;
      if (search) params.search = search;

      const res = await axios.get(`${API_BASE}/components`, { params });
      
      // Backend ab { data, meta } bhej raha hai
      return res.data; 
    } catch (error) {
      console.error("API Error - getComponents:", error);
      return { data: [], meta: { totalItems: 0, totalPages: 0, currentPage: 1 } };
    }
  },

  // ✅ NEW: Get Single Component by ID
  getComponentById: async (id: string) => {
    try {
      const res = await axios.get(`${API_BASE}/components/${id}`);
      return res.data;
    } catch (error) {
      console.error("API Error - getComponentById:", error);
      throw error;
    }
  },

  // 3. Create Component
  addComponent: async (payload: Record<string, unknown>) => {
    try {
      const res = await axios.post(`${API_BASE}/components`, payload);
      return res.data;
    } catch (error) {
      throw error;
    }
  },

  // 4. Update Component
  updateComponent: async (id: string, payload: Record<string, unknown>) => {
    try {
      const res = await axios.patch(`${API_BASE}/components/${id}`, payload);
      return res.data;
    } catch (error) {
      throw error;
    }
  },

  // 4.5. Delete Component
  deleteComponent: async (id: string) => {
    try {
      const res = await axios.delete(`${API_BASE}/components/${id}`);
      return res.data;
    } catch (error) {
      throw error;
    }
  },

  // 5. Add Tracked Link
  addTrackedLink: async (componentId: string, url: string) => {
    try {
      const res = await axios.post(`${API_BASE}/components/track-link`, {
        componentId,
        url,
      });
      return res.data;
    } catch (error) {
      throw error;
    }
  },

  // 6. Manual Offer
  addManualOffer: async (payload: Record<string, unknown>) => {
    try {
      const res = await axios.post(
        `${API_BASE}/components/manual-offer`,
        payload
      );
      return res.data;
    } catch (error) {
      throw error;
    }
  },

  // 7. Fetch Specs from URL
  fetchSpecsFromUrl: async (url: string) => {
    try {
      const res = await axios.post(`${API_BASE}/components/fetch-specs`, {
        url,
      });
      return res.data;
    } catch (error) {
      throw error;
    }
  },

  // 8. Rules Management
  getRules: async () => {
    try {
      const res = await axios.get(`${API_BASE}/rules`);
      return res.data;
    } catch (error) {
      console.error("API Error - getRules:", error);
      return [];
    }
  },

  createRule: async (payload: Record<string, unknown>) => {
    try {
      const res = await axios.post(`${API_BASE}/rules`, payload);
      return res.data;
    } catch (error) {
      throw error;
    }
  },

  updateRule: async () => {
    try {
      console.warn(
        "Update rule endpoint not fully implemented in backend example yet."
      );
      return null;
    } catch (error) {
      throw error;
    }
  },

  deleteRule: async (id: string) => {
    try {
      const res = await axios.delete(`${API_BASE}/rules/${id}`);
      return res.data;
    } catch (error) {
      throw error;
    }
  },

  // 9. Vendor Management
  getVendors: async () => {
    try {
      const res = await axios.get(`${API_BASE}/vendors`);
      return res.data;
    } catch (error) {
      console.error("API Error - getVendors:", error);
      return [];
    }
  },

  getVendorById: async (id: string) => {
    try {
      const res = await axios.get(`${API_BASE}/vendors/${id}`);
      return res.data;
    } catch (error) {
      console.error("API Error - getVendorById:", error);
      throw error;
    }
  },

  createVendor: async (payload: Record<string, unknown>) => {
    try {
      const res = await axios.post(`${API_BASE}/vendors`, payload);
      return res.data;
    } catch (error) {
      throw error;
    }
  },

  updateVendor: async (id: string, payload: Record<string, unknown>) => {
    try {
      const res = await axios.patch(`${API_BASE}/vendors/${id}`, payload);
      return res.data;
    } catch (error) {
      throw error;
    }
  },

  deleteVendor: async (id: string) => {
    try {
      const res = await axios.delete(`${API_BASE}/vendors/${id}`);
      return res.data;
    } catch (error) {
      throw error;
    }
  },
};