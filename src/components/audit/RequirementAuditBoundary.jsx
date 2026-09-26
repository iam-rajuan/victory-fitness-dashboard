import React from "react";

function isAuditModeEnabled() {
  if (import.meta.env.VITE_REQUIREMENT_AUDIT === "true") {
    return true;
  }

  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    if (params.get("requirementAudit") === "1") {
      return true;
    }
    try {
      if (window.localStorage && window.localStorage.getItem("requirementAudit") === "1") {
        return true;
      }
    } catch {
      // Ignore localStorage errors
    }
  }

  return false;
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
  className = "",
  style = {},
  children,
}) {
  if (!isAuditModeEnabled()) {
    return children;
  }

  const isUncertain = status === "uncertain";
  const isMismatch = status === "mismatch";
  const borderStyle = isUncertain ? "dashed" : "solid";
  const borderColor = isMismatch ? "#F59E0B" : "red";
  const badgeBg = isMismatch ? "#F59E0B" : "red";

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

