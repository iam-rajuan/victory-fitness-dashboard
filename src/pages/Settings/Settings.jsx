import { useState } from "react";
import ClaudeAdminTable from "../../components/shared/ClaudeAdminTable";
import { useAdminDrawer } from "../../context/AdminDrawerContext";

const BASE_ROWS = [
  { a: "Privacy policy", b: "GDPR, MoMo & UPI data processors", c: "Published · v3", d: "All markets · 4 months ago", e: "Out of date", tone: "bad", drawer: "settingDoc", id: "st1" },
  { a: "Terms & conditions", b: "Subscription cycles and refund cooling rules", c: "Published · v2", d: "All markets · 4 months ago", e: "Out of date", tone: "warn", drawer: "settingDoc", id: "st2" },
  { a: "About us", b: "Victor Akko story & founding principles", c: "Published", d: "All markets · 2 months ago", e: "Current", tone: "good", drawer: "settingText", id: "st3" },
  { a: "Data region", b: "Frankfurt AWS cluster & encryption keys", c: "EU · Frankfurt", d: "All markets · At launch", e: "Current", tone: "good", drawer: "settingData", id: "st4" },
  { a: "Right to export and delete", b: "Self-serve JSON export and GDPR deletion", c: "Self-serve in app", d: "All markets · 1 month ago", e: "Current", tone: "good", drawer: "settingData", id: "st5" },
  { a: "Admin accounts", b: "Victor Akko master credentials", c: "1 account", d: "Platform · At launch", e: "Add per person", tone: "warn", drawer: "settingAccess", id: "st6" },
];

export default function Settings() {
  const { openDrawer, showToast } = useAdminDrawer();
  const [rows] = useState(BASE_ROWS);

  return (
    <ClaudeAdminTable
      pageKicker="ADMINISTRATION"
      pageTitle="Settings"
      pageSub="Legal pages, company details and the switches that apply to the whole platform rather than to any one member."
      pagePrimary="Save changes"
      pageSecondary="View as member"
      onPrimary={() => showToast("Platform settings saved and synchronized.")}
      onSecondary={() => showToast("Previewing live app settings schema.")}
      pageStats={[
        { k: "LEGAL PAGES", v: "3", note: "Privacy, terms, about" },
        { k: "LAST UPDATED", v: "4 mo", note: "Before 2 markets launched" },
        { k: "DATA REGION", v: "EU", note: "Frankfurt cluster" },
        { k: "ADMIN ACCOUNTS", v: "1", note: "Add one per person" },
      ]}
      pageAdvice="Your privacy policy was last updated before Ghana and India went live, so it does not mention MoMo, UPI, or data leaving the EU."
      pageAdviceDone="Update the policy"
      onAdvice={() => openDrawer("settingDoc")}
      filters={["All", "Legal", "Data", "Access"]}
      cols={["SETTING", "VALUE", "SCOPE & UPDATED", "STATUS", "ACTIONS"]}
      rows={rows}
      onEditRow={(row) => openDrawer(row.drawer || "settingDoc")}
      onDeleteRow={(row) => showToast(`Cannot delete critical platform setting: ${row.a}`)}
      onRowClick={(row) => openDrawer(row.drawer || "settingDoc")}
    />
  );
}
