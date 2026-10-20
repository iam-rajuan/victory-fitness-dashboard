import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import {
  clearUserInfo,
  ensureAdminSession,
  hasAdminAccess,
  hasStoredAdminSession,
  isStoredSessionExpired,
} from "../../services/auth.service";

function RequireAdminAuth({ children }) {
  const location = useLocation();

  // Instant synchronous check on first render:
  // If not logged in or session is expired, immediately evaluate to false
  // so NO screen, panel, or skeleton is loaded before redirecting.
  const [isAuthorized, setIsAuthorized] = useState(() => {
    if (typeof window === "undefined") return null;

    if (
      import.meta.env.DEV && (
        import.meta.env.VITE_REQUIREMENT_AUDIT === "true" ||
        new URLSearchParams(window.location.search).get("requirementAudit") === "1"
      )
    ) {
      return true;
    }

    // 1. Without login (no session token and no valid access token)
    if (!hasStoredAdminSession() && !hasAdminAccess()) {
      clearUserInfo();
      return false;
    }

    // 2. Session expired locally
    if (isStoredSessionExpired()) {
      clearUserInfo();
      return false;
    }

    // 3. Valid access token exists
    if (hasAdminAccess()) {
      return true;
    }

    // 4. Stored session token exists but needs background refresh
    return null;
  });

  useEffect(() => {
    let isMounted = true;

    // Listen for live session expiration events from API requests
    const handleSessionExpired = () => {
      if (isMounted) {
        setIsAuthorized(false);
      }
    };
    window.addEventListener("admin:session-expired", handleSessionExpired);

    if (isAuthorized === false) {
      return () => {
        isMounted = false;
        window.removeEventListener("admin:session-expired", handleSessionExpired);
      };
    }

    if (
      import.meta.env.DEV && (
        import.meta.env.VITE_REQUIREMENT_AUDIT === "true" ||
        new URLSearchParams(window.location.search).get("requirementAudit") === "1"
      )
    ) {
      setIsAuthorized(true);
      return () => {
        isMounted = false;
        window.removeEventListener("admin:session-expired", handleSessionExpired);
      };
    }

    // Verify session with the backend
    ensureAdminSession()
      .then((allowed) => {
        if (!isMounted) return;
        if (!allowed) {
          clearUserInfo();
        }
        setIsAuthorized(allowed);
      })
      .catch(() => {
        if (!isMounted) return;
        clearUserInfo();
        setIsAuthorized(false);
      });

    return () => {
      isMounted = false;
      window.removeEventListener("admin:session-expired", handleSessionExpired);
    };
  }, [location.pathname, isAuthorized]);

  // If not logged in or session expired: INSTANT REDIRECT. Do NOT load any screen.
  if (isAuthorized === false) {
    return (
      <Navigate
        to={`/sign-in?reauth=1&from=${encodeURIComponent(location.pathname)}`}
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  // While awaiting background server verification: render null (no screen/skeleton loaded)
  if (isAuthorized === null) {
    return null;
  }

  return children;
}

export default RequireAdminAuth;
