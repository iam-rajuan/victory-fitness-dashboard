import { adminApiRequest } from "./auth.service";

const wrapContentError = (error, fallbackMessage) => {
  if (error?.name === "AbortError") {
    throw error;
  }
  if (error instanceof Error) {
    return error.message;
  }

  return fallbackMessage;
};

const buildQueryString = (params) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    const normalizedValue = typeof value === "string" ? value.trim() : value;
    if (normalizedValue === "") {
      return;
    }

    searchParams.set(key, String(normalizedValue));
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
};

export const listAdminFaqs = async ({ signal } = {}) => {
  try {
    return await adminApiRequest("/admin/faqs", { signal });
  } catch (error) {
    throw new Error(wrapContentError(error, "Failed to load FAQs"));
  }
};

export const createAdminFaq = async (payload) => {
  try {
    return await adminApiRequest("/admin/faqs", {
      method: "POST",
      body: payload,
    });
  } catch (error) {
    throw new Error(wrapContentError(error, "Failed to create FAQ"));
  }
};

export const updateAdminFaq = async (faqId, payload) => {
  try {
    return await adminApiRequest(`/admin/faqs/${faqId}`, {
      method: "PATCH",
      body: payload,
    });
  } catch (error) {
    throw new Error(wrapContentError(error, "Failed to update FAQ"));
  }
};

export const deleteAdminFaq = async (faqId) => {
  try {
    return await adminApiRequest(`/admin/faqs/${faqId}`, {
      method: "DELETE",
    });
  } catch (error) {
    throw new Error(wrapContentError(error, "Failed to delete FAQ"));
  }
};

export const listAdminNotifications = async ({ signal } = {}) => {
  try {
    return await adminApiRequest("/admin/notifications", { signal });
  } catch (error) {
    throw new Error(wrapContentError(error, "Failed to load notifications"));
  }
};

export const updateAdminNotification = async (notificationId, payload) => {
  try {
    return await adminApiRequest(`/admin/notifications/${notificationId}`, {
      method: "PATCH",
      body: payload,
    });
  } catch (error) {
    throw new Error(wrapContentError(error, "Failed to update notification"));
  }
};

export const markAllAdminNotificationsRead = async () => {
  try {
    return await adminApiRequest("/admin/notifications/actions/read-all", {
      method: "PATCH",
    });
  } catch (error) {
    throw new Error(wrapContentError(error, "Failed to mark all notifications as read"));
  }
};

export const sendTestPushNotification = async (email) => {
  try {
    return await adminApiRequest("/admin/notifications/test", {
      method: "POST",
      body: { email },
    });
  } catch (error) {
    throw new Error(wrapContentError(error, "Failed to send test notification"));
  }
};

export const listAdminSubscriptionPlans = async ({ signal } = {}) => {
  try {
    return await adminApiRequest("/admin/subscription-plans", { signal });
  } catch (error) {
    throw new Error(wrapContentError(error, "Failed to load subscription plans"));
  }
};

export const createAdminSubscriptionPlan = async (payload) => {
  try {
    return await adminApiRequest("/admin/subscription-plans", {
      method: "POST",
      body: payload,
    });
  } catch (error) {
    throw new Error(wrapContentError(error, "Failed to create subscription plan"));
  }
};

export const updateAdminSubscriptionPlan = async (planId, payload) => {
  try {
    return await adminApiRequest(`/admin/subscription-plans/${planId}`, {
      method: "PATCH",
      body: payload,
    });
  } catch (error) {
    throw new Error(wrapContentError(error, "Failed to update subscription plan"));
  }
};

export const deleteAdminSubscriptionPlan = async (planId) => {
  try {
    return await adminApiRequest(`/admin/subscription-plans/${planId}`, {
      method: "DELETE",
    });
  } catch (error) {
    throw new Error(wrapContentError(error, "Failed to delete subscription plan"));
  }
};

export const listAdminMasterclasses = async ({ signal } = {}) => {
  try {
    return await adminApiRequest("/admin/masterclasses", { signal });
  } catch (error) {
    throw new Error(wrapContentError(error, "Failed to load masterclasses"));
  }
};

export const createAdminMasterclass = async (payload) => {
  try {
    return await adminApiRequest("/admin/masterclasses", {
      method: "POST",
      body: payload,
    });
  } catch (error) {
    throw new Error(wrapContentError(error, "Failed to create masterclass"));
  }
};

export const updateAdminMasterclass = async (masterclassId, payload) => {
  try {
    return await adminApiRequest(`/admin/masterclasses/${masterclassId}`, {
      method: "PATCH",
      body: payload,
    });
  } catch (error) {
    throw new Error(wrapContentError(error, "Failed to update masterclass"));
  }
};

export const deleteAdminMasterclass = async (masterclassId) => {
  try {
    return await adminApiRequest(`/admin/masterclasses/${masterclassId}`, {
      method: "DELETE",
    });
  } catch (error) {
    throw new Error(wrapContentError(error, "Failed to delete masterclass"));
  }
};

export const listAdminSubscribers = async ({ page = 1, limit = 100, query = "", signal } = {}) => {
  try {
    return await adminApiRequest(
      `/admin/subscribers${buildQueryString({ page, limit, query })}`,
      { signal },
    );
  } catch (error) {
    throw new Error(wrapContentError(error, "Failed to load subscribers"));
  }
};

export const listAdminHomepageQuotes = async ({ signal } = {}) => {
  try {
    return await adminApiRequest("/admin/homepage/quotes", { signal });
  } catch (error) {
    throw new Error(wrapContentError(error, "Failed to load homepage quotes"));
  }
};

export const addAdminHomepageQuote = async (payload) => {
  try {
    return await adminApiRequest("/admin/homepage/quotes", { method: "POST", body: payload });
  } catch (error) {
    throw new Error(wrapContentError(error, "Failed to add homepage quote"));
  }
};

export const replaceAdminHomepageQuotes = async (items) => {
  try {
    return await adminApiRequest("/admin/homepage/quotes", { method: "PUT", body: { items } });
  } catch (error) {
    throw new Error(wrapContentError(error, "Failed to update homepage quotes"));
  }
};

export const getAdminTrialConversion = async ({ signal } = {}) => {
  try {
    return await adminApiRequest("/admin/analytics/trial-conversion", { signal });
  } catch (error) {
    throw new Error(wrapContentError(error, "Failed to load trial conversion data"));
  }
};

export const listAdminAuditLogs = async ({
  limit = 100,
  skip = 0,
  action = "",
  resource = "",
  adminEmail = "",
  signal,
} = {}) => {
  try {
    return await adminApiRequest(
      `/admin/audit-logs${buildQueryString({ limit, skip, action, resource, adminEmail })}`,
      { signal },
    );
  } catch (error) {
    throw new Error(wrapContentError(error, "Failed to load audit logs"));
  }
};
