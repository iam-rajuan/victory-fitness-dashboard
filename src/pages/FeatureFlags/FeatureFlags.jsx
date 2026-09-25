import { useState } from "react";
import ClaudeAdminTable from "../../components/shared/ClaudeAdminTable";
import { useAdminDrawer } from "../../context/AdminDrawerContext";

const BASE_ROWS = [
  { a: "Upgrade entry animation", b: "50%", c: "All", d: "30 days ago", e: "Stale", tone: "warn", id: "ff1" },
  { a: "Meal photo analysis", b: "100%", c: "All", d: "4 days ago", e: "On", tone: "good", id: "ff2" },
  { a: "MoMo checkout v2", b: "25%", c: "Ghana", d: "Today", e: "Testing", tone: "warn", id: "ff3" },
  { a: "UPI autopay", b: "60%", c: "India", d: "2 days ago", e: "Testing", tone: "warn", id: "ff4" },
  {
    a: "Wearable sync",
    b: "100%",
    c: "All",
    d: "11 days ago",
    e: "On",
    tone: "good",
    id: "ff5",
    audit: { auditId: "ADMIN-EXTRA-007", status: "extra", label: "NEW FEATURE - WEARABLE SYNC FLAG NOT IN REQUIREMENT" },
  },
  {
    a: "Duo second partner",
    b: "0%",
    c: "All",
    d: "Never",
    e: "Off",
    tone: "bad",
    id: "ff6",
    audit: { auditId: "ADMIN-EXTRA-008", status: "extra", label: "NEW FEATURE - SECOND ACCOUNTABILITY PARTNER NOT IN REQUIREMENT" },
  },
];

export default function FeatureFlags() {
  const { openDrawer, showToast } = useAdminDrawer();
  const [rows, setRows] = useState(BASE_ROWS);

  return (
    <ClaudeAdminTable
      pageKicker="RUNTIME CONTROL"
      pageTitle="Feature flags"
      pageSub="Turn features on for a percentage of members, in chosen markets, without shipping a new build. Roll back by moving one number to zero."
      pagePrimary="+ New flag"
      pageSecondary="Rollback all"
      onPrimary={() => openDrawer("flag")}
      onSecondary={() => showToast("Rollback applied to all experimental flags")}
      pageStats={[
        { k: "ACTIVE FLAGS", v: "4", note: "Two at partial rollout" },
        { k: "FULLY ROLLED OUT", v: "1", note: "Meal photo analysis" },
        { k: "MARKET-SCOPED", v: "2", note: "Ghana and India only" },
        { k: "STALE", v: "1", note: "No change in 30 days" },
      ]}
      pageAdvice="The Silver-to-Gold upgrade animation is at 50% with no result read yet. A flag left half-on is an experiment nobody is learning from."
      pageAdviceDone="Read the result"
      onAdvice={() => openDrawer("flag", { "WHAT IT CHANGES": "Upgrade entry animation" })}
      filters={["All", "On", "Off", "Partial", "Market-scoped", "Stale"]}
      cols={["FLAG", "ROLLOUT", "MARKETS", "CHANGED", "STATE"]}
      rows={rows}
      onEditRow={(row) => openDrawer("flag", { "WHAT IT CHANGES": row.a })}
      onDeleteRow={(row) => {
        setRows((prev) => prev.filter((r) => r.id !== row.id));
        showToast(`Rolled back feature flag: ${row.a}`);
      }}
      onRowClick={(row) => openDrawer("flag", { "WHAT IT CHANGES": row.a })}
    />
  );
}
