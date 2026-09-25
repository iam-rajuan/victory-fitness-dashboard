import { useState, useEffect } from "react";
import ClaudeAdminTable from "../../components/shared/ClaudeAdminTable";
import { useAdminDrawer } from "../../context/AdminDrawerContext";
import { adminApiRequest } from "../../../services/auth.service";

const BASE_ROWS = [
  { a: "Today 09:12", b: "Victor Akko", c: "Price offer created", d: "Gold, yearly", e: "Applied", tone: "good", id: "al1" },
  { a: "Today 08:40", b: "Victor Akko", c: "Broadcast created", d: "Community post", e: "Published", tone: "good", id: "al2" },
  { a: "Yesterday 17:22", b: "Victor Akko", c: "Workout published", d: "Awakening Flow", e: "Live", tone: "good", id: "al3" },
  { a: "Yesterday 11:05", b: "Victor Akko", c: "Challenge deleted", d: "Test challenge 2", e: "Removed", tone: "warn", id: "al4" },
  { a: "9 Sep 15:06", b: "Victor Akko", c: "Tier price changed", d: "Gold · 279 → 299", e: "Applied", tone: "warn", id: "al5" },
  { a: "8 Sep 20:41", b: "Victor Akko", c: "Member refunded", d: "Peter Wagner · €24", e: "Refunded", tone: "warn", id: "al6" },
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
              a: item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Today 09:12",
              b: item.adminName || item.user || "Victor Akko",
              c: item.action || "Admin Action",
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
      onPrimary={() => openDrawer("audit")}
      onSecondary={() => openDrawer("settingAccess")}
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
      cols={["TIME", "ADMIN", "ACTION", "WHAT IT TOUCHED", "RESULT"]}
      rows={rows}
      isLoading={loading}
      onEditRow={(row) => openDrawer("audit", { WHAT: row.c })}
      onDeleteRow={() => showToast("Audit logs are legally immutable and cannot be deleted.")}
      onRowClick={(row) => openDrawer("audit", { WHAT: row.c })}
    />
  );
}
