import { useState } from "react";
import ClaudeAdminTable from "../../components/shared/ClaudeAdminTable";
import { useAdminDrawer } from "../../context/AdminDrawerContext";

const BASE_ROWS = [
  { a: "Privacy policy", b: "Published", c: "All markets", d: "4 months ago", e: "Out of date", tone: "bad", drawer: "settingDoc", id: "st1" },
  { a: "Terms & conditions", b: "Published", c: "All markets", d: "4 months ago", e: "Out of date", tone: "warn", drawer: "settingDoc", id: "st2" },
  { a: "About us", b: "Published", c: "All markets", d: "2 months ago", e: "Current", tone: "good", drawer: "settingText", id: "st3" },
  { a: "Data region", b: "EU · Frankfurt", c: "All markets", d: "At launch", e: "Current", tone: "good", drawer: "settingData", id: "st4" },
  { a: "Right to export and delete", b: "Self-serve in app", c: "All markets", d: "1 month ago", e: "Current", tone: "good", drawer: "settingData", id: "st5" },
  { a: "Admin accounts", b: "1 account", c: "Platform", d: "At launch", e: "Add per person", tone: "warn", drawer: "settingAccess", id: "st6" },
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
      filters={["All", "Legal", "Data", "Access"]}
      cols={["SETTING", "VALUE", "SCOPE", "UPDATED", "STATUS"]}
      rows={rows}
      onEditRow={(row) => openDrawer(row.drawer || "settingDoc")}
      onDeleteRow={(row) => showToast(`Cannot delete critical platform setting: ${row.a}`)}
      onRowClick={(row) => openDrawer(row.drawer || "settingDoc")}
    />
  );
}
