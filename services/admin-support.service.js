import { adminApiRequest } from "./auth.service";

const wrapError = (error, fallbackMessage) => {
  if (error?.name === "AbortError") {
    throw error;
  }
  if (error instanceof Error) return error.message;
  return fallbackMessage;
};

const buildQueryString = (params) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    const normalized = typeof value === "string" ? value.trim() : value;
    if (normalized === "") return;
    searchParams.set(key, String(normalized));
  });
  const query = searchParams.toString();
  return query ? `?${query}` : "";
};

export const listAdminSupportMessages = async ({
  query = "",
  status = "ALL",
  limit = 500,
  signal,
} = {}) => {
  try {
    return await adminApiRequest(
      `/admin/support/messages${buildQueryString({ query, status, limit })}`,
      { signal },
    );
  } catch (error) {
    throw new Error(wrapError(error, "Failed to load support messages"));
  }
};

export const updateAdminSupportMessage = async (messageId, payload) => {
  try {
    return await adminApiRequest(`/admin/support/messages/${messageId}`, {
      method: "PATCH",
      body: payload,
    });
  } catch (error) {
    throw new Error(wrapError(error, "Failed to update support message"));
  }
};
