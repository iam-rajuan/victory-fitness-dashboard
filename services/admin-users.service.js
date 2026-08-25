import { adminApiRequest } from "./auth.service";

const createFriendlyUserManagementError = (error, fallbackMessage) => {
  if (error?.status === 404) {
    return error?.path === "/admin/user-management"
      ? "User management endpoints are not loaded on the backend yet. Restart the backend with the latest code."
      : "User management data is unavailable because the backend is still running an older build. Restart the backend to load the new endpoints.";
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

export const getUserManagementOverview = async ({
  page = 1,
  limit = 10,
  query = "",
  year,
  signal,
} = {}) => {
  try {
    return await adminApiRequest(
      `/admin/user-management${buildQueryString({ page, limit, query, year })}`,
      { signal },
    );
  } catch (error) {
    throw new Error(createFriendlyUserManagementError(error, "Failed to load user management data"));
  }
};

export const getTrialCohorts = async ({
  preset,
  market,
  from,
  to,
  signal,
} = {}) => {
  try {
    return await adminApiRequest(
      `/admin/trials/cohorts${buildQueryString({ preset, market, from, to })}`,
      { signal },
    );
  } catch (error) {
    throw new Error(createFriendlyUserManagementError(error, "Failed to load trial cohorts"));
  }
};

export const getTrialDropouts = async ({
  preset,
  market,
  from,
  to,
  limit = 100,
  signal,
} = {}) => {
  try {
    return await adminApiRequest(
      `/admin/trials/dropouts${buildQueryString({ preset, market, from, to, limit })}`,
      { signal },
    );
  } catch (error) {
    throw new Error(createFriendlyUserManagementError(error, "Failed to load trial dropouts"));
  }
};

export const getAdminUser = async (userId, { signal } = {}) => {
  try {
    return await adminApiRequest(`/admin/users/${userId}`, { signal });
  } catch (error) {
    throw new Error(createFriendlyUserManagementError(error, "Failed to load user details"));
  }
};

export const updateAdminUser = async (userId, payload) => {
  try {
    return await adminApiRequest(`/admin/users/${userId}`, {
      method: "PATCH",
      body: payload,
    });
  } catch (error) {
    throw new Error(createFriendlyUserManagementError(error, "Failed to update user"));
  }
};

export const deleteAdminUser = async (userId) => {
  try {
    return await adminApiRequest(`/admin/users/${userId}`, {
      method: "DELETE",
    });
  } catch (error) {
    throw new Error(createFriendlyUserManagementError(error, "Failed to delete user"));
  }
};
