import { decodeAuthToken } from "../utils/decode-access-token";
import { getFromLocalStorage, setToLocalStorage } from "../utils/local-storage";

const API_URL = (import.meta.env.VITE_API_URL || "https://victory-fitness-backend.vercel.app").replace(/\/$/, "");
const API_URL_STORAGE_KEY = "victoryAdminApiUrl";
let sessionBootstrapPromise = null;
let serverSessionVerified = false;

const hasStoredAdminSession = () => {
  if (typeof window === "undefined") {
    return false;
  }
  return Boolean(localStorage.getItem("sessionToken"));
};

// Store user info in localStorage
export const storeUserInfo = (userData) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("userData", JSON.stringify(userData));
  }
};

// Retrieve user data from localStorage
export const getUserData = () => {
  const userData = getFromLocalStorage("userData");
  return userData ? JSON.parse(userData) : null;
};

// Store user token in localStorage
export const storeUserToken = ({ accessToken }) => {
  if (accessToken) {
    setToLocalStorage("accessToken", accessToken);
  }
};

export const storeSessionToken = ({ sessionToken }) => {
  if (sessionToken) {
    setToLocalStorage("sessionToken", sessionToken);
  }
};

export const getSessionToken = () => {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("sessionToken") || "";
};

// Retrieve user token from localStorage
export const getUserToken = () => {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("accessToken") || "";
};

export const storeResetToken = ({ resetToken }) => {
  if (typeof window !== "undefined") {
    if (resetToken) {
      setToLocalStorage("resetToken", resetToken);
    } else {
      localStorage.removeItem("resetToken");
    }
  }
};

export const storeResetEmail = (email) => {
  if (typeof window !== "undefined") {
    if (email) {
      localStorage.setItem("resetEmail", email);
    } else {
      localStorage.removeItem("resetEmail");
    }
  }
};

export const getResetEmail = () => {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("resetEmail") || "";
};

export const getResetToken = () => {
  if (typeof window === "undefined") return "";
  const token = localStorage.getItem("resetToken");
  return token || "";
};

export const clearResetFlow = () => {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.removeItem("resetToken");
  localStorage.removeItem("resetEmail");
};

// Retrieve user info (decoded token) from localStorage
export const getUserInfo = () => {
  const authToken = getFromLocalStorage("accessToken");
  if (!authToken) return null;
  try {
    return decodeAuthToken(authToken);
  } catch (error) {
    console.error("Error decoding the token:", error);
    return null;
  }
};

// Check if the user is logged in
export const isLoggedIn = () => {
  const authToken = getFromLocalStorage("accessToken");
  return !!authToken; // Returns true if token exists
};

export const hasAdminAccess = () => {
  const authToken = getFromLocalStorage("accessToken");
  const userData = getUserData();

  if (!authToken || !userData?.is_admin) {
    return false;
  }

  const decodedData = decodeAuthToken(authToken);
  const expiry = decodedData?.exp;
  if (!expiry) {
    return false;
  }

  return expiry * 1000 > Date.now();
};

const storeAuthSession = (data) => {
  storeUserToken({ accessToken: data.access_token });
  storeSessionToken({ sessionToken: data.session_token });
  storeUserInfo(data.user);
  if (typeof window !== "undefined") {
    localStorage.setItem(API_URL_STORAGE_KEY, API_URL);
  }
  serverSessionVerified = true;
};

const syncStoredApiUrl = () => {
  if (typeof window === "undefined") {
    return;
  }

  const storedApiUrl = localStorage.getItem(API_URL_STORAGE_KEY) || "";
  const hasStoredAuth =
    !!localStorage.getItem("accessToken") ||
    !!localStorage.getItem("sessionToken") ||
    !!localStorage.getItem("userData");

  if (storedApiUrl !== API_URL && hasStoredAuth) {
    clearUserInfo();
  }

  localStorage.setItem(API_URL_STORAGE_KEY, API_URL);
};

export const logoutAdmin = async () => {
  const token = getUserToken();
  const sessionToken = getSessionToken();

  try {
    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: "include",
      body: sessionToken ? JSON.stringify({ session_token: sessionToken }) : undefined,
    });
  } catch {
    // Local logout should still complete if the backend request fails.
  } finally {
    clearUserInfo();
  }
};

export const refreshAdminSession = async () => {
  const sessionToken = getSessionToken();
  if (!sessionToken) {
    serverSessionVerified = false;
    return false;
  }

  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: sessionToken ? JSON.stringify({ session_token: sessionToken }) : undefined,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.user?.is_admin) {
    serverSessionVerified = false;
    clearUserInfo();
    return false;
  }

  storeAuthSession(data);
  serverSessionVerified = true;
  return true;
};

export const ensureAdminSession = async () => {
  if (serverSessionVerified && hasAdminAccess()) {
    return true;
  }

  if (!hasStoredAdminSession()) {
    serverSessionVerified = false;
    return false;
  }

  if (!sessionBootstrapPromise) {
    sessionBootstrapPromise = refreshAdminSession().finally(() => {
      sessionBootstrapPromise = null;
    });
  }

  return sessionBootstrapPromise;
};

export const adminApiRequest = async (path, options = {}) => {
  const currentToken = getUserToken();
  const tokenPayload = currentToken ? decodeAuthToken(currentToken) : null;
  const tokenExpiresAt = Number(tokenPayload?.exp || 0) * 1000;
  if (currentToken && (!tokenExpiresAt || tokenExpiresAt - Date.now() < 60_000)) {
    const refreshed = await refreshAdminSession();
    if (!refreshed) {
      clearUserInfo();
      throw new Error("Session expired");
    }
  }

  const makeRequest = async () => {
    const token = getUserToken();
    return fetch(`${API_URL}${path}`, {
      method: options.method || "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
      credentials: "include",
      signal: options.signal,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  };

  let response = await makeRequest();
  if (response.status === 401) {
    // A token can be rejected by the backend even while its local exp claim is
    // still valid (for example after an auth-session version change). Force a
    // server refresh instead of trusting the local token check.
    const refreshed = await refreshAdminSession();
    if (!refreshed) {
      clearUserInfo();
      throw new Error("Session expired");
    }
    response = await makeRequest();
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.detail || "Request failed");
    error.status = response.status;
    error.path = path;
    throw error;
  }

  return data;
};

export const loginAdmin = async ({ email, password }) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.detail || "Login failed");
  }

  if (!data?.user?.is_admin) {
    throw new Error("This account does not have admin dashboard access");
  }

  storeAuthSession(data);
  return data.user;
};

export const requestPasswordReset = async ({ email }) => {
  const response = await fetch(`${API_URL}/auth/forgot-password`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ email }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.detail || "Failed to send reset code");
  }

  return data;
};

export const verifyPasswordResetCode = async ({ email, code }) => {
  const response = await fetch(`${API_URL}/auth/verify-reset-code`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ email, code }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.detail || "Failed to verify reset code");
  }

  if (data?.reset_token) {
    storeResetToken({ resetToken: data.reset_token });
  }

  return data;
};

export const resetPasswordWithToken = async ({ resetToken, newPassword }) => {
  const response = await fetch(`${API_URL}/auth/reset-password`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      reset_token: resetToken,
      new_password: newPassword,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.detail || "Failed to reset password");
  }

  return data;
};

// Remove the access token from localStorage
export const removeAccessToken = () => {
  serverSessionVerified = false;
  if (typeof window !== "undefined") {
    localStorage.removeItem("accessToken");
  }
};

// Remove all user info from localStorage
export const clearUserInfo = () => {
  serverSessionVerified = false;
  if (typeof window !== "undefined") {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("sessionToken");
    localStorage.removeItem("userData");
    localStorage.removeItem("token");
    localStorage.removeItem("resetToken");
    localStorage.removeItem("resetEmail");
    localStorage.removeItem(API_URL_STORAGE_KEY);
  }
};

syncStoredApiUrl();
