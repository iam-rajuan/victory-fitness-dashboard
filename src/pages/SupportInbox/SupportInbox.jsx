import { useState, useEffect } from "react";
import ClaudeAdminTable from "../../components/shared/ClaudeAdminTable";
import { useAdminDrawer } from "../../context/AdminDrawerContext";
import { listAdminSupportMessages } from "../../../services/admin-support.service";

const BASE_ROWS = [
  { a: "Kofi Mensah", b: "MoMo payment did not go through", c: "Trial · Gold", d: "Waiting 31 hr · Ghana", e: "Open", tone: "bad", id: "sp1" },
  { a: "Lena Meyer", b: "Cannot change my protein target", c: "Silver", d: "Waiting 6 hr · Germany", e: "Open", tone: "warn", id: "sp2" },
  { a: "Arjun Rao", b: "Video keeps buffering on mobile data", c: "Gold", d: "Waiting 3 hr · India", e: "Open", tone: "warn", id: "sp3" },
  { a: "Michael Krause", b: "How do I swap my duo partner?", c: "Gold", d: "Updated 1 hr ago · Germany", e: "In progress", tone: "good", id: "sp4" },
  { a: "Anna Reinhardt", b: "Invoice for my company tax declaration", c: "Silver", d: "Resolved yesterday", e: "Resolved", tone: "good", id: "sp5" },
  { a: "James Hill", b: "Beta access credentials not activating", c: "Beta", d: "Resolved 2 days ago", e: "Resolved", tone: "good", id: "sp6" },
];

export default function SupportInbox() {
  const { openDrawer, showToast } = useAdminDrawer();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState(BASE_ROWS);

  useEffect(() => {
    listAdminSupportMessages()
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.tickets || data?.items || [];
        if (list.length > 0) {
          setRows(
            list.map((s) => ({
              id: s._id || s.id,
              a: s.userName || s.memberName || "Member",
              b: s.subject || s.title || "Support inquiry",
              c: s.userTier || "Gold",
              d: s.createdAt ? `Logged ${s.createdAt}` : "Recent",
              e: s.status || "Open",
              tone: s.status === "OPEN" ? "bad" : s.status === "RESOLVED" ? "good" : "warn",
              rawData: s,
            }))
          );
        }
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  return (
    <ClaudeAdminTable
      pageKicker="SUPPORT OPERATIONS"
      pageTitle="Help & support"
      pageSub="Every message a member sends, with its triage state. The promise on the profile screen is a reply within a day."
      pagePrimary="Reply to oldest"
      pageSecondary="Canned replies"
      onPrimary={() => openDrawer("support")}
      pageStats={[
        { k: "OPEN", v: "3", note: "Awaiting first reply" },
        { k: "IN PROGRESS", v: "1", note: "Being worked on" },
        { k: "RESOLVED, 7 DAYS", v: "14", note: "Median 4 hours" },
        { k: "OLDEST OPEN", v: "31 hr", note: "Past the one-day promise" },
      ]}
      pageAdvice="One message has been open for 31 hours, past the one-day promise you make in the app. Answer it before anything else on this page."
      pageAdviceDone="Open the oldest"
      onAdvice={() => openDrawer("support", { MEMBER: "Kofi Mensah" })}
      filters={["All", "Open", "In progress", "Resolved", "Payment", "Technical"]}
      cols={["MEMBER", "SUBJECT & TIER", "WAITING / LOGGED", "STATUS", "ACTIONS"]}
      rows={rows}
      isLoading={loading}
      onEditRow={(row) => openDrawer("support", { MEMBER: row.a })}
      onDeleteRow={(row) => showToast(`Ticket for ${row.a} marked resolved.`)}
      onRowClick={(row) => openDrawer("support", { MEMBER: row.a })}
    />
  );
}
