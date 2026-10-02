import { useEffect, useMemo, useState } from "react";
import ClaudeAdminTable from "../../components/shared/ClaudeAdminTable";
import { useAdminDrawer } from "../../context/AdminDrawerContext";
import { adminApiRequest } from "../../../services/auth.service";

const APP_AUDIT_FLAG_KEY = "requirement_audit_app_marks";
const ADMIN_AUDIT_FLAG_KEY = "requirement_audit_admin_marks";
const APP_AUDIT_STORAGE_KEY = "victoryRequirementAuditAppMarks";
const ADMIN_AUDIT_STORAGE_KEY = "victoryRequirementAuditAdminMarks";

const BASE_ROWS = [
  { a: "Privacy policy", b: "Published", c: "All markets", d: "4 months ago", e: "Out of date", tone: "bad", drawer: "settingDoc", id: "st1" },
  { a: "Terms & conditions", b: "Published", c: "All markets", d: "4 months ago", e: "Out of date", tone: "warn", drawer: "settingDoc", id: "st2" },
  {
    a: "About us",
    b: "Published",
    c: "All markets",
    d: "2 months ago",
    e: "Current",
    tone: "good",
    drawer: "settingText",
    id: "st3",
    audit: { auditId: "ADMIN-EXTRA-005", status: "extra", label: "NEW FEATURE - ABOUT US MANAGEMENT NOT IN REQUIREMENT" },
  },
  { a: "Data region", b: "EU · Frankfurt", c: "All markets", d: "At launch", e: "Current", tone: "good", drawer: "settingData", id: "st4" },
  { a: "Right to export and delete", b: "Self-serve in app", c: "All markets", d: "1 month ago", e: "Current", tone: "good", drawer: "settingData", id: "st5" },
  { a: "Admin accounts", b: "1 account", c: "Platform", d: "At launch", e: "Add per person", tone: "warn", drawer: "settingAccess", id: "st6" },
];

export default function Settings() {
  const { openDrawer, showToast } = useAdminDrawer();
  const [rows] = useState(BASE_ROWS);
  const [auditFlags, setAuditFlags] = useState({
    app: false,
    admin: false,
  });
  const [savingAuditKey, setSavingAuditKey] = useState("");

  useEffect(() => {
    let mounted = true;
    adminApiRequest("/admin/feature-flags")
      .then((response) => {
        if (!mounted) return;
        const items = response.items || [];
        const appFlag = items.find((item) => item.key === APP_AUDIT_FLAG_KEY);
        const adminFlag = items.find((item) => item.key === ADMIN_AUDIT_FLAG_KEY);
        const nextFlags = {
          app: Boolean(appFlag?.enabled),
          admin: Boolean(adminFlag?.enabled),
        };
        setAuditFlags(nextFlags);
        window.localStorage?.setItem(APP_AUDIT_STORAGE_KEY, nextFlags.app ? "1" : "0");
        window.localStorage?.setItem(ADMIN_AUDIT_STORAGE_KEY, nextFlags.admin ? "1" : "0");
      })
      .catch(() => {
        showToast("Could not load audit marker settings.");
      });
    return () => {
      mounted = false;
    };
  }, [showToast]);

  const updateAuditFlag = async (target, enabled) => {
    const key = target === "app" ? APP_AUDIT_FLAG_KEY : ADMIN_AUDIT_FLAG_KEY;
    const description = target === "app"
      ? "Show red requirement-audit labels and borders inside the member app."
      : "Show red requirement-audit labels and borders inside the admin dashboard.";

    setSavingAuditKey(target);
    try {
      await adminApiRequest("/admin/feature-flags", {
        method: "POST",
        body: {
          key,
          description,
          enabled,
          rolloutPct: 100,
          allowedCountries: [],
        },
      });

      setAuditFlags((current) => ({ ...current, [target]: enabled }));
      window.localStorage?.setItem(target === "app" ? APP_AUDIT_STORAGE_KEY : ADMIN_AUDIT_STORAGE_KEY, enabled ? "1" : "0");
      if (target === "admin") {
        window.dispatchEvent(new CustomEvent("victory-requirement-audit-change", {
          detail: { adminMarksEnabled: enabled },
        }));
      }
      showToast(`${target === "app" ? "App" : "Admin"} red marks ${enabled ? "turned on" : "turned off"}.`);
    } catch (error) {
      showToast(error?.message || "Could not update audit marker setting.");
    } finally {
      setSavingAuditKey("");
    }
  };

  const auditControls = useMemo(() => {
    const renderToggle = (target, label, enabled) => {
      const isSaving = savingAuditKey === target;
      return (
        <button
          type="button"
          onClick={() => updateAuditFlag(target, !enabled)}
          disabled={isSaving}
          className={[
            "rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.08em] transition",
            enabled
              ? "border-red-500/70 bg-red-500 text-white shadow-[0_0_18px_rgba(239,68,68,0.22)]"
              : "border-white/15 bg-[#0D2B45] text-[#F7F3EE] hover:border-[#C9943A]/70",
            isSaving ? "cursor-wait opacity-70" : "",
          ].join(" ")}
        >
          {label}: {isSaving ? "Saving" : enabled ? "On" : "Off"}
        </button>
      );
    };

    return (
      <div className="flex flex-wrap items-center gap-2">
        {renderToggle("app", "App red marks", auditFlags.app)}
        {renderToggle("admin", "Admin red marks", auditFlags.admin)}
      </div>
    );
  }, [auditFlags.admin, auditFlags.app, savingAuditKey]);

  return (
    <ClaudeAdminTable
      pageKicker="ADMINISTRATION"
      pageTitle="Settings"
      pageSub="Legal pages, company details and the switches that apply to the whole platform rather than to any one member."
      pagePrimary="Save changes"
      pageSecondary="View as member"
      extraHeaderActions={auditControls}
      onPrimary={() => openDrawer("settingDoc")}
      onSecondary={() => openDrawer("settingText")}
      pageStats={[
        { k: "LEGAL PAGES", v: "3", note: "Privacy, terms, about" },
        { k: "LAST UPDATED", v: "4 mo", note: "Before two markets launched" },
        { k: "DATA REGION", v: "EU", note: "Frankfurt" },
        { k: "ADMIN ACCOUNTS", v: "1", note: "Add one per person" },
      ]}
      pageAdvice="Your privacy policy was last updated before Ghana and India went live, so it does not mention MoMo, UPI, or data leaving the EU."
      pageAdviceDone="Update the policy"
      onAdvice={() => openDrawer("settingDoc")}
      adviceAudit={{
        auditId: "ADMIN-EXTRA-024",
        status: "extra",
        label: "NEW FEATURE - LEGAL COMPLIANCE DIAGNOSTIC BANNER NOT IN REQUIREMENT",
      }}
      filters={["All", "Legal", "Data", "Access"]}
      cols={["SETTING", "VALUE", "SCOPE", "UPDATED", "STATUS"]}
      rows={rows}
      onEditRow={(row) => openDrawer(row.drawer || "settingDoc")}
      onDeleteRow={(row) => showToast(`Cannot delete critical platform setting: ${row.a}`)}
      onRowClick={(row) => openDrawer(row.drawer || "settingDoc")}
    />
  );
}
