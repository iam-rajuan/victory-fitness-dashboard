import { useState, useEffect } from "react";
import ClaudeAdminTable from "../../components/shared/ClaudeAdminTable";
import { useAdminDrawer } from "../../context/AdminDrawerContext";
import { listAdminApplications } from "../../../services/admin-applications.service";

const BASE_ROWS = [
  { a: "Ingrid Vogel", b: "ingrid.vogel@praxis-vogel.de", c: "Germany", d: "Back to competing at 52 · Waiting 4 days", e: "Waiting", tone: "bad", id: "app1" },
  { a: "Ravi Iyer", b: "ravi.iyer@mumbai.in", c: "India", d: "Rebuild after injury · Waiting 2 days", e: "Waiting", tone: "warn", id: "app2" },
  { a: "Nana Owusu", b: "nana@accra.gh", c: "Ghana", d: "Consistency, not aesthetics · Call booked Thu 19:00", e: "Call booked", tone: "good", id: "app3" },
  { a: "Dominik Schulz", b: "d.schulz@berlin.de", c: "Germany", d: "Marathon in May · Enrolled", e: "Accepted", tone: "good", id: "app4" },
  { a: "Sarah Fischer", b: "sarah@fischer.de", c: "Germany", d: "General fitness · Recommended Platinum", e: "Declined · Platinum", tone: "warn", id: "app5" },
  { a: "Tomasz Nowak", b: "t.nowak@warsaw.pl", c: "Poland", d: "Weight loss · Recommended Gold", e: "Declined · Gold", tone: "warn", id: "app6" },
];

export default function Applications() {
  const { openDrawer, showToast } = useAdminDrawer();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState(BASE_ROWS);

  useEffect(() => {
    listAdminApplications()
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.applications || data?.items || [];
        if (list.length > 0) {
          setRows(
            list.map((a) => ({
              id: a._id || a.id,
              a: a.fullName || a.applicantName || "Applicant",
              b: a.email || "",
              c: a.country || "Germany",
              d: `${a.trainingGoal || a.primaryGoal || "Coaching"} · ${a.waitingDays ? `${a.waitingDays} days` : "Recent"}`,
              e: a.status || "Waiting",
              tone: a.status === "ACCEPTED" ? "good" : a.status === "WAITING" ? "bad" : "warn",
              rawData: a,
            }))
          );
        }
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  return (
    <ClaudeAdminTable
      pageKicker="INNER CIRCLE · BY APPLICATION ONLY"
      pageTitle="Applications"
      pageSub="Five questions, straight to you. No checkout exists for Inner Circle — you read the answers, then decide whether to call."
      pagePrimary="Book a call"
      pageSecondary="Export answers"
      onPrimary={() => openDrawer("application", { applicantName: "Ingrid Vogel" })}
      pageStats={[
        { k: "WAITING", v: "2", note: "Oldest: 4 days" },
        { k: "CALLS BOOKED", v: "1", note: "Thursday 19:00 CET" },
        { k: "ACCEPTED", v: "4", note: "Current Inner Circle size" },
        { k: "DECLINED", v: "3", note: "Pointed to Platinum" },
      ]}
      pageAdvice="Two applications have been waiting four days. The screen promises a reply within three — the oldest one is already past that."
      pageAdviceDone="Read them now"
      onAdvice={() => openDrawer("application", { applicantName: "Ingrid Vogel" })}
      filters={["All", "Waiting", "Call booked", "Accepted", "Declined"]}
      cols={["APPLICANT", "MARKET", "GOAL & TIMELINE", "STATUS", "ACTIONS"]}
      rows={rows}
      isLoading={loading}
      onEditRow={(row) => openDrawer("application", row)}
      onDeleteRow={(row) => showToast(`Archived application from ${row.a}.`)}
      onRowClick={(row) => openDrawer("application", row)}
    />
  );
}
