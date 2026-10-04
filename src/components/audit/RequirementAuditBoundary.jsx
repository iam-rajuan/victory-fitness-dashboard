import React, { useEffect, useState } from "react";
import { adminApiRequest } from "../../../services/auth.service";

const ADMIN_AUDIT_FLAG_KEY = "requirement_audit_admin_marks";
const ADMIN_AUDIT_STORAGE_KEY = "victoryRequirementAuditAdminMarks";
let cachedAuditMode = null;
let auditModePromise = null;

function parseStoredAuditMode(value) {
  if (value === "1" || value === "true") return true;
  if (value === "0" || value === "false") return false;
  return null;
}

function readStoredAuditMode() {
  if (typeof window === "undefined") return null;
  try {
    return parseStoredAuditMode(window.localStorage?.getItem(ADMIN_AUDIT_STORAGE_KEY));
  } catch {
    return null;
  }
}

function writeStoredAuditMode(enabled) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage?.setItem(ADMIN_AUDIT_STORAGE_KEY, enabled ? "1" : "0");
  } catch {
    // Storage is only a cache; backend remains the source of truth.
  }
}

async function loadAuditMode() {
  if (cachedAuditMode !== null) return cachedAuditMode;

  const stored = readStoredAuditMode();
  if (stored !== null) cachedAuditMode = stored;

  try {
    const response = await adminApiRequest("/admin/feature-flags");
    const flag = (response.items || []).find((item) => item.key === ADMIN_AUDIT_FLAG_KEY);
    const enabled = Boolean(flag?.enabled);
    cachedAuditMode = enabled;
    writeStoredAuditMode(enabled);
    return enabled;
  } catch {
    cachedAuditMode = stored ?? false;
    return cachedAuditMode;
  }
}

function useAuditModeEnabled() {
  const [enabled, setEnabled] = useState(() => cachedAuditMode ?? false);

  useEffect(() => {
    let mounted = true;
    const handleLocalAuditModeChange = (event) => {
      const nextEnabled = Boolean(event?.detail?.adminMarksEnabled);
      cachedAuditMode = nextEnabled;
      setEnabled(nextEnabled);
    };

    if (typeof window !== "undefined") {
      window.addEventListener("victory-requirement-audit-change", handleLocalAuditModeChange);
    }

    if (!auditModePromise) {
      auditModePromise = loadAuditMode().finally(() => {
        auditModePromise = null;
      });
    }
    auditModePromise.then((nextEnabled) => {
      if (mounted) setEnabled(nextEnabled);
    });
    return () => {
      mounted = false;
      if (typeof window !== "undefined") {
        window.removeEventListener("victory-requirement-audit-change", handleLocalAuditModeChange);
      }
    };
  }, []);

  return enabled;
}

function getLabel(status, label) {
  if (label) return label;
  if (status === "uncertain") return "REVIEW — REQUIREMENT UNCLEAR";
  if (status === "mismatch") return "MISMATCH — DOES NOT MATCH REQUIREMENT";
  return "NEW FEATURE — NOT IN REQUIREMENT";
}

export default function RequirementAuditBoundary({
  auditId,
  status = "extra",
  label,
  markerColor,
  className = "",
  style = {},
  children,
}) {
  const auditModeEnabled = useAuditModeEnabled();

  if (!auditModeEnabled) {
    return children;
  }

  const isUncertain = status === "uncertain";
  const isMismatch = status === "mismatch";
  const borderStyle = isUncertain ? "dashed" : "solid";
  const borderColor = markerColor || (isMismatch ? "#F59E0B" : "red");
  const badgeBg = markerColor || (isMismatch ? "#F59E0B" : "red");

  const resolvedLabel = label || getLabel(status);
  const displayText =
    auditId && !resolvedLabel.startsWith(auditId)
      ? `${auditId} — ${resolvedLabel}`
      : resolvedLabel;

  return (
    <div
      className={`relative rounded-2xl p-1.5 ${className}`}
      style={{
        border: `3px ${borderStyle} ${borderColor}`,
        boxSizing: "border-box",
        ...style,
      }}
    >
      <div
        className="mb-1.5 inline-flex items-center rounded-md px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-white shadow-sm"
        style={{
          backgroundColor: badgeBg,
          zIndex: 30,
          position: "relative",
          lineHeight: "1.2",
        }}
      >
        {displayText}
      </div>
      {children}
    </div>
  );
}
