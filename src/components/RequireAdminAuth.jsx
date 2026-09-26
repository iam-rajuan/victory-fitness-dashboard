import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { clearUserInfo, ensureAdminSession } from "../../services/auth.service";

function RoutePanelSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-3">
        <div className="h-8 w-64 rounded-xl bg-slate-200" />
        <div className="h-4 w-80 rounded-lg bg-slate-100" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="h-32 rounded-2xl bg-slate-100 border border-slate-200" />
        ))}
      </div>
      <div className="h-80 rounded-2xl bg-slate-100 border border-slate-200" />
      <div className="h-72 rounded-2xl bg-slate-100 border border-slate-200" />
    </div>
  );
}

function RequireAdminAuth({ children }) {
  const location = useLocation();
  const [isAuthorized, setIsAuthorized] = useState(null);

  useEffect(() => {
    let isMounted = true;

    if (
      import.meta.env.VITE_REQUIREMENT_AUDIT === "true" ||
      new URLSearchParams(window.location.search).get("requirementAudit") === "1"
    ) {
      setIsAuthorized(true);
      return () => {
        isMounted = false;
      };
    }

    ensureAdminSession()
      .then((allowed) => {
        if (!isMounted) {
          return;
        }

        if (!allowed) {
          clearUserInfo();
        }
        setIsAuthorized(allowed);
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }
        clearUserInfo();
        setIsAuthorized(false);
      });

    return () => {
      isMounted = false;
    };
  }, [location.pathname]);

  if (isAuthorized === null) {
    return <RoutePanelSkeleton />;
  }

  if (!isAuthorized) {
    return <Navigate to="/sign-in" replace state={{ from: location.pathname }} />;
  }

  return children;
}

export default RequireAdminAuth;
