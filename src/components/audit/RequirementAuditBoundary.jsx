import React from "react";

function isAuditModeEnabled() {
  if (import.meta.env.VITE_REQUIREMENT_AUDIT === "true") {
    return true;
  }

  if (typeof window !== "undefined") {
    return new URLSearchParams(window.location.search).get("requirementAudit") === "1";
  }

  return false;
}

function getLabel(status, label) {
  if (label) return label;
  if (status === "uncertain") return "REVIEW - REQUIREMENT UNCLEAR";
  if (status === "mismatch") return "MISMATCH - CHECK REQUIREMENT";
  return "NEW FEATURE - NOT IN REQUIREMENT";
}

export default function RequirementAuditBoundary({
  auditId,
  status = "extra",
  label,
  className = "",
  children,
}) {
  if (!isAuditModeEnabled()) {
    return children;
  }

  const isUncertain = status === "uncertain";
  const isMismatch = status === "mismatch";
  const borderStyle = isUncertain ? "dashed" : "solid";

  return (
    <div
      className={`relative rounded-xl p-1 ${className}`}
      style={{
        border: `2px ${borderStyle} ${isMismatch ? "#F59E0B" : "#E53935"}`,
      }}
    >
      <div
        className="mb-1 inline-flex rounded-md px-2 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-white"
        style={{ backgroundColor: isMismatch ? "#F59E0B" : "#E53935" }}
      >
        {auditId} - {getLabel(status, label)}
      </div>
      {children}
    </div>
  );
}
