import { fetchTrialFunnel, fetchUserStats } from "./analytics.service";
import { adminApiRequest } from "./auth.service";
import { getTrialCohorts, getTrialDropouts } from "./admin-users.service";

const wrapTrialError = (error, fallbackMessage) => {
  if (error instanceof Error) return error.message;
  return fallbackMessage;
};

export const getGoldTrialConfig = async ({ signal } = {}) => {
  try {
    return await adminApiRequest("/admin/trials/config", { signal });
  } catch (error) {
    throw new Error(wrapTrialError(error, "Failed to load Gold trial configuration"));
  }
};

export const updateGoldTrialConfig = async (payload) => {
  try {
    return await adminApiRequest("/admin/trials/config", {
      method: "PATCH",
      body: payload,
    });
  } catch (error) {
    throw new Error(wrapTrialError(error, "Failed to update Gold trial configuration"));
  }
};

export const getPhaseOneBetaSummary = async ({ signal } = {}) => {
  try {
    return await adminApiRequest("/admin/trials/phase-one-beta", { signal });
  } catch (error) {
    throw new Error(wrapTrialError(error, "Failed to load Phase 1 beta analytics"));
  }
};

export const getGoldTrialOutcomes = async ({
  preset,
  market,
  from,
  to,
  signal,
} = {}) => {
  const searchParams = new URLSearchParams();
  [
    ["preset", preset],
    ["market", market],
    ["from", from],
    ["to", to],
  ].forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      searchParams.set(key, String(value).trim());
    }
  });

  const query = searchParams.toString();
  try {
    return await adminApiRequest(`/admin/trials/outcomes${query ? `?${query}` : ""}`, { signal });
  } catch (error) {
    throw new Error(wrapTrialError(error, "Failed to load Gold trial outcomes"));
  }
};

export const getGoldTrialDashboard = async ({ preset = "this_week", market = "all", from, to, signal } = {}) => {
  const [funnel, userStats, cohorts, dropouts, config, outcomes] = await Promise.all([
    fetchTrialFunnel({ preset, market, from, to, signal }).catch((error) => ({ error: error.message, steps: [] })),
    fetchUserStats({ preset, market, from, to, signal }).catch((error) => ({ error: error.message })),
    getTrialCohorts({ preset, market, from, to, signal }).catch((error) => ({ error: error.message, cohorts: [] })),
    getTrialDropouts({ preset, market, from, to, signal, limit: 100 }).catch((error) => ({ error: error.message, users: [] })),
    getGoldTrialConfig({ signal }).catch((error) => ({ error: error.message, messages: [] })),
    getGoldTrialOutcomes({ preset, market, from, to, signal }).catch((error) => ({ error: error.message })),
  ]);

  return {
    funnel,
    userStats,
    cohorts: Array.isArray(cohorts?.cohorts) ? cohorts.cohorts : [],
    dropouts: Array.isArray(dropouts?.users) ? dropouts.users : [],
    config,
    outcomes,
    errors: [funnel?.error, userStats?.error, cohorts?.error, dropouts?.error, config?.error, outcomes?.error].filter(Boolean),
  };
};
