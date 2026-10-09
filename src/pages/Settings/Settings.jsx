import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ClaudeAdminTable from "../../components/shared/ClaudeAdminTable";
import { useAdminDrawer } from "../../context/AdminDrawerContext";
import { adminApiRequest } from "../../../services/auth.service";

const AUDIT_MARKS_FLAG_KEY = "requirement_audit_admin_marks";
const AUDIT_MARKS_STORAGE_KEY = "victoryRequirementAuditAdminMarks";

const LEGAL_DOCS = [
  { id: "privacy", label: "Privacy policy", endpoint: "/admin/content/privacy-policy", route: "/privacy-policy" },
  { id: "terms", label: "Terms & conditions", endpoint: "/admin/content/terms-condition", route: "/terms-and-condition" },
  { id: "about", label: "About us", endpoint: "/admin/content/about-us", route: "/about-us" },
];

function formatDate(value) {
  if (!value) return "Not published";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not published";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function legalRoute(row) {
  return row?.route || row?.raw?.route || row?.rawData?.route || "/settings";
}

export default function Settings() {
  const { showToast } = useAdminDrawer();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [auditMarksEnabled, setAuditMarksEnabled] = useState(false);
  const [auditMarksSaving, setAuditMarksSaving] = useState(false);
  const [auditFlagDescription, setAuditFlagDescription] = useState("Show red requirement-audit labels and borders inside the admin dashboard.");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const responses = await Promise.all(
          LEGAL_DOCS.map(async (item) => ({ ...item, data: await adminApiRequest(item.endpoint) }))
        );
        if (!mounted) return;
        setRows(responses.map((item) => ({
          id: item.id,
          a: item.label,
          b: item.data.status || (item.id === "about" ? "Current" : "Published"),
          c: (item.data.applies_to || ["ALL"]).join(", "),
          d: formatDate(item.data.published_at || item.data.updated_at),
          e: item.data.version || "v1",
          tone: item.data.status === "Draft" || item.data.status === "Unpublished" ? "warn" : "good",
          route: item.route,
          rawData: item.data,
        })));
      } catch (error) {
        showToast(error?.message || "Could not load legal document settings.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [showToast]);

  useEffect(() => {
    let mounted = true;
    const loadAuditFlag = async () => {
      try {
        const response = await adminApiRequest("/admin/feature-flags");
        const flag = (response.items || []).find((item) => item.key === AUDIT_MARKS_FLAG_KEY);
        if (!mounted) return;
        setAuditMarksEnabled(Boolean(flag?.enabled));
        setAuditFlagDescription(flag?.description || "Show red requirement-audit labels and borders inside the admin dashboard.");
      } catch (error) {
        showToast(error?.message || "Could not load admin audit marker setting.");
      }
    };
    loadAuditFlag();
    return () => {
      mounted = false;
    };
  }, [showToast]);

  const persistAuditFlagState = (enabled) => {
    try {
      window.localStorage?.setItem(AUDIT_MARKS_STORAGE_KEY, enabled ? "1" : "0");
      window.dispatchEvent(new CustomEvent("victory-requirement-audit-change", {
        detail: { adminMarksEnabled: enabled },
      }));
    } catch {
      // The backend flag remains the source of truth.
    }
  };

  const toggleAuditMarks = async () => {
    const nextEnabled = !auditMarksEnabled;
    setAuditMarksEnabled(nextEnabled);
    persistAuditFlagState(nextEnabled);
    setAuditMarksSaving(true);
    try {
      const updated = await adminApiRequest("/admin/feature-flags", {
        method: "POST",
        body: {
          key: AUDIT_MARKS_FLAG_KEY,
          description: auditFlagDescription,
          enabled: nextEnabled,
          rolloutPct: 100,
          allowedCountries: [],
        },
      });
      setAuditMarksEnabled(Boolean(updated.enabled));
      setAuditFlagDescription(updated.description || auditFlagDescription);
      persistAuditFlagState(Boolean(updated.enabled));
      showToast(nextEnabled ? "Admin red audit marks are now visible." : "Admin red audit marks are now hidden.");
    } catch (error) {
      const reverted = !nextEnabled;
      setAuditMarksEnabled(reverted);
      persistAuditFlagState(reverted);
      showToast(error?.message || "Could not update admin audit marker setting.");
    } finally {
      setAuditMarksSaving(false);
    }
  };

  const stats = useMemo(() => {
    const published = rows.filter((row) => /published|current/i.test(row.b)).length;
    return [
      { k: "LEGAL PAGES", v: String(rows.length || 3), note: "Privacy, terms, about" },
      { k: "PUBLISHED", v: String(published), note: "Current member-facing versions" },
      { k: "MARKETS", v: "5", note: "All, EU, Germany, Ghana, India" },
      { k: "VERSIONING", v: "On", note: "Previous versions retained" },
    ];
  }, [rows]);

  return (
    <ClaudeAdminTable
      pageKicker="ADMINISTRATION"
      pageTitle="Settings"
      pageSub="Legal documents and company content that apply across the platform."
      pagePrimary="Update privacy policy"
      pageSecondary="Update terms"
      onPrimary={() => navigate("/privacy-policy")}
      onSecondary={() => navigate("/terms-and-condition")}
      extraHeaderActions={
        <button
          type="button"
          onClick={toggleAuditMarks}
          disabled={auditMarksSaving}
          className={`h-11 rounded-xl border px-4 text-[13.5px] font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
            auditMarksEnabled
              ? "border-red-500/55 bg-red-500/10 text-red-300 hover:bg-red-500/15"
              : "border-[#C9943A]/45 bg-[#C9943A]/10 text-[#C9943A] hover:bg-[#C9943A]/15"
          }`}
          title="Show or hide the red requirement-audit markers in the admin dashboard"
        >
          {auditMarksSaving ? "Saving..." : auditMarksEnabled ? "Hide red markers" : "Show red markers"}
        </button>
      }
      pageStats={stats}
      filters={["All", "Legal"]}
      cols={["DOCUMENT", "STATUS", "SCOPE", "PUBLISHED", "VERSION"]}
      rows={rows}
      isLoading={loading}
      hideDeleteActions
      onEditRow={(row) => navigate(legalRoute(row))}
      onRowClick={(row) => navigate(legalRoute(row))}
    />
  );
}
