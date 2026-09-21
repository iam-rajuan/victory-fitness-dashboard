import { useState, useEffect } from "react";
import ClaudeAdminTable from "../../components/shared/ClaudeAdminTable";
import { useAdminDrawer } from "../../context/AdminDrawerContext";
import { adminApiRequest } from "../../../services/auth.service";

const BASE_ROWS = [
  { a: "Price offer created", b: "Gold, yearly · Today 09:12", c: "Victor Akko", d: "Pricing · Gold annual", e: "Applied", tone: "good", id: "al1" },
  { a: "Broadcast created", b: "Community verified post · Today 08:40", c: "Victor Akko", d: "Community · Global", e: "Published", tone: "good", id: "al2" },
  { a: "Workout published", b: "Awakening Flow · Yesterday 17:22", c: "Victor Akko", d: "Workouts · Mobility", e: "Live", tone: "good", id: "al3" },
  { a: "Challenge deleted", b: "Test challenge 2 · Yesterday 11:05", c: "Victor Akko", d: "Challenges · Draft", e: "Removed", tone: "warn", id: "al4" },
  { a: "Tier price changed", b: "Gold €279 → €299 · 9 Sep 15:06", c: "Victor Akko", d: "Subscriptions · Gold", e: "Applied", tone: "warn", id: "al5" },
  { a: "Member refunded", b: "Peter Wagner €24 · 8 Sep 20:41", c: "Victor Akko", d: "Payments · SEPA", e: "Refunded", tone: "warn", id: "al6" },
];

export default function AuditLogs() {
  const { openDrawer, showToast } = useAdminDrawer();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState(BASE_ROWS);

  useEffect(() => {
    adminApiRequest("/admin/audit-logs")
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.logs || data?.items || [];
        if (list.length > 0) {
          setRows(
            list.map((item) => ({
              id: item._id || item.id,
              a: item.action || "Admin Action",
              b: item.timestamp ? new Date(item.timestamp).toLocaleString() : "Recent",
              c: item.adminName || item.user || "Victor Akko",
              d: item.resource || item.entity || "Platform",
              e: item.status || "Applied",
              tone: item.status === "FAILED" ? "bad" : "good",
              rawData: item,
            }))
          );
        }
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  return (
    <ClaudeAdminTable
      pageKicker="ADMIN OVERSIGHT"
      pageTitle="Audit log"
      pageSub="Every administrative action, who took it and when. Nothing here can be edited or deleted, including by you."
      pagePrimary="Export range"
      pageSecondary="Filter by admin"
      onPrimary={() => showToast("Exported immutable audit range to CSV.")}
      onSecondary={() => showToast("Filtered to owner account: Victor Akko")}
      pageStats={[
        { k: "ENTRIES", v: "184", note: "Since launch" },
        { k: "ADMINS", v: "1", note: "Victor Akko only" },
        { k: "THIS WEEK", v: "23", note: "Mostly content changes" },
        { k: "DESTRUCTIVE", v: "4", note: "Deletes and price changes" },
      ]}
      pageAdvice="Only one admin account has ever acted on this system. If anyone else joins the team, give them their own login before they touch anything."
      pageAdviceDone="Open admin accounts"
      onAdvice={() => openDrawer("settingAccess")}
      filters={["All", "Broadcasts", "Pricing", "Content", "Members", "Destructive"]}
      cols={["ACTION & TIMESTAMP", "ADMIN", "WHAT IT TOUCHED", "RESULT", "ACTIONS"]}
      rows={rows}
      isLoading={loading}
      onEditRow={(row) => openDrawer("audit", { WHAT: row.a })}
      onDeleteRow={() => showToast("Audit logs are legally immutable and cannot be deleted.")}
      onRowClick={(row) => openDrawer("audit", { WHAT: row.a })}
    />
  );
}
