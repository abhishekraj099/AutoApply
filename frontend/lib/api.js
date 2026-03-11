const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: { "Content-Type": "application/json" },
    ...options,
  };

  // Don't set Content-Type for FormData
  if (options.body instanceof FormData) {
    delete config.headers["Content-Type"];
  }

  const res = await fetch(url, config);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || data.errors?.[0]?.msg || "Request failed");
  }

  return data;
}

// Dashboard
export const api = {
  // Dashboard
  getDashboardStats: () => request("/api/dashboard/stats"),

  // Templates
  getTemplates: () => request("/api/templates"),
  getTemplate: (id) => request(`/api/templates/${id}`),
  createTemplate: (data) => request("/api/templates", { method: "POST", body: JSON.stringify(data) }),
  updateTemplate: (id, data) => request(`/api/templates/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteTemplate: (id) => request(`/api/templates/${id}`, { method: "DELETE" }),

  // Email Lists
  getEmailLists: () => request("/api/email-lists"),
  getEmailList: (id) => request(`/api/email-lists/${id}`),
  createEmailList: (data) => request("/api/email-lists", { method: "POST", body: JSON.stringify(data) }),
  updateEmailList: (id, data) => request(`/api/email-lists/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteEmailList: (id) => request(`/api/email-lists/${id}`, { method: "DELETE" }),
  addContact: (listId, data) => request(`/api/email-lists/${listId}/contacts`, { method: "POST", body: JSON.stringify(data) }),
  removeContact: (listId, contactId) => request(`/api/email-lists/${listId}/contacts/${contactId}`, { method: "DELETE" }),
  importCSV: (listId, formData) => request(`/api/email-lists/${listId}/import`, { method: "POST", body: formData }),

  // Resumes
  getResumes: () => request("/api/resumes"),
  uploadResume: (formData) => request("/api/resumes", { method: "POST", body: formData }),
  setDefaultResume: (id) => request(`/api/resumes/${id}/default`, { method: "PUT" }),
  deleteResume: (id) => request(`/api/resumes/${id}`, { method: "DELETE" }),

  // Campaigns
  getCampaigns: () => request("/api/campaigns"),
  getCampaign: (id) => request(`/api/campaigns/${id}`),
  createCampaign: (data) => request("/api/campaigns", { method: "POST", body: JSON.stringify(data) }),
  updateCampaign: (id, data) => request(`/api/campaigns/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteCampaign: (id) => request(`/api/campaigns/${id}`, { method: "DELETE" }),
  scheduleCampaign: (id, data) => request(`/api/campaigns/${id}/schedule`, { method: "POST", body: JSON.stringify(data) }),
  cancelCampaign: (id) => request(`/api/campaigns/${id}/cancel`, { method: "POST" }),
  previewCampaign: (id) => request(`/api/campaigns/${id}/preview`),
  sendTestEmail: (id, data) => request(`/api/campaigns/${id}/test`, { method: "POST", body: JSON.stringify(data) }),
  getCampaignLogs: (id) => request(`/api/campaigns/${id}/logs`),
  getEmailHistory: (page = 1, limit = 50) => request(`/api/campaigns/history?page=${page}&limit=${limit}`),
};
