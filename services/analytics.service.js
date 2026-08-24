import { adminApiRequest } from "./auth.service";

const wrapError = (error, fallbackMessage) => {
  if (error instanceof Error) return error.message;
  return fallbackMessage;
};

const buildQueryString = (params) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    const v = typeof value === "string" ? value.trim() : value;
    if (v === "") return;
    searchParams.set(key, String(v));
  });
  const qs = searchParams.toString();
  return qs ? `?${qs}` : "";
};

const fetchAnalytics = async (path, params, signal, fallback) => {
  try {
    return await adminApiRequest(`/admin/analytics/${path}${buildQueryString(params || {})}`, { signal });
  } catch (error) {
    throw new Error(wrapError(error, fallback));
  }
};

export const fetchUserStats = ({ preset, market, from, to, signal } = {}) =>
  fetchAnalytics(
    "user-stats",
    { preset, market, from, to },
    signal,
    "Failed to load user stats",
  );

export const fetchWorkoutStats = ({ preset, market, from, to, signal } = {}) =>
  fetchAnalytics(
    "workout-stats",
    { preset, market, from, to },
    signal,
    "Failed to load workout stats",
  );

export const fetchChallengeStats = ({ preset, market, from, to, signal } = {}) =>
  fetchAnalytics(
    "challenge-stats",
    { preset, market, from, to },
    signal,
    "Failed to load challenge stats",
  );

export const fetchNutritionStats = ({ preset, market, from, to, signal } = {}) =>
  fetchAnalytics(
    "nutrition-stats",
    { preset, market, from, to },
    signal,
    "Failed to load nutrition stats",
  );

export const fetchRevenue = ({ preset, market, from, to, granularity, signal } = {}) =>
  fetchAnalytics(
    "revenue",
    { preset, market, from, to, granularity },
    signal,
    "Failed to load revenue",
  );

export const fetchAccountabilityStats = ({ preset, market, from, to, signal } = {}) =>
  fetchAnalytics(
    "accountability-stats",
    { preset, market, from, to },
    signal,
    "Failed to load accountability stats",
  );

export const fetchHabitAdoption = ({ preset, market, from, to, signal } = {}) =>
  fetchAnalytics(
    "habit-adoption",
    { preset, market, from, to },
    signal,
    "Failed to load habit adoption",
  );

export const fetchTrialFunnel = ({ preset, market, from, to, signal } = {}) =>
  fetchAnalytics(
    "trial-funnel",
    { preset, market, from, to },
    signal,
    "Failed to load trial funnel",
  );

export const fetchViralCoefficient = ({ preset, market, from, to, signal } = {}) =>
  fetchAnalytics(
    "viral-coefficient",
    { preset, market, from, to },
    signal,
    "Failed to load viral coefficient",
  );

export const fetchWhatsappTracker = ({ preset, market, from, to, signal } = {}) =>
  fetchAnalytics(
    "whatsapp-tracker",
    { preset, market, from, to },
    signal,
    "Failed to load WhatsApp tracker",
  );

export const fetchDailyWins = ({ signal } = {}) =>
  fetchAnalytics("daily-wins", {}, signal, "Failed to load daily wins");

export const fetchRetentionCohort = ({ preset, market, from, to, signal } = {}) =>
  fetchAnalytics(
    "retention-cohort",
    { preset, market, from, to },
    signal,
    "Failed to load retention cohort",
  );

export const fetchMarketBreakdown = ({ preset, country, from, to, signal } = {}) =>
  fetchAnalytics(
    "market-breakdown",
    { preset, country, from, to },
    signal,
    "Failed to load market breakdown",
  );
