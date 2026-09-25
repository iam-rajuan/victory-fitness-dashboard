import { useState, useEffect } from "react";
import ClaudeAdminTable from "../../components/shared/ClaudeAdminTable";
import { useAdminDrawer } from "../../context/AdminDrawerContext";
import { getUserManagementOverview } from "../../../services/admin-users.service";

const BASE_ROWS = [
  { a: "Michael Krause", b: "GOLD", c: "Yearly", d: "12 Mar", e: "Healthy", tone: "good", id: "sub1" },
  { a: "Dominik Schulz", b: "PLATINUM", c: "Yearly", d: "04 Jan", e: "Healthy", tone: "good", id: "sub2" },
  { a: "Anna Reinhardt", b: "SILVER", c: "Monthly", d: "24 Sep", e: "Healthy", tone: "good", id: "sub3" },
  { a: "Arjun Rao", b: "GOLD", c: "Monthly", d: "19 Sep", e: "Going quiet", tone: "warn", id: "sub4" },
  { a: "Lena Meyer", b: "SILVER", c: "Monthly", d: "21 Sep", e: "Going quiet", tone: "warn", id: "sub5" },
  { a: "Sarah Fischer", b: "GOLD", c: "Yearly", d: "28 Sep", e: "Card declined", tone: "bad", id: "sub6" },
  { a: "Peter Wagner", b: "SILVER", c: "Monthly", d: "23 Sep", e: "Card declined", tone: "bad", id: "sub7" },
  { a: "Nana Owusu", b: "GOLD", c: "Yearly", d: "02 Oct", e: "Healthy", tone: "good", id: "sub8" },
];

export default function AllSubscribers() {
  const { openDrawer, showToast } = useAdminDrawer();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState(BASE_ROWS);

  useEffect(() => {
    getUserManagementOverview()
      .then((data) => {
        if (data && data.users && data.users.length > 0) {
          const paying = data.users.filter(
            (u) => u.is_active_subscriber || ["GOLD", "SILVER", "PLATINUM"].includes((u.subscriptionTier || "").toUpperCase())
          );
          if (paying.length > 0) {
            setRows(
              paying.map((u) => ({
                id: u._id || u.id,
                a: u.fullName || u.name || "Subscriber",
                b: (u.subscriptionTier || "GOLD").toUpperCase(),
                c: u.cycle || "Yearly",
                d: u.renewalDate || "12 Mar",
                e: u.status === "ACTIVE" ? "Healthy" : "Going quiet",
                tone: u.status === "ACTIVE" ? "good" : "warn",
                rawData: u,
              }))
            );
          }
        }
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  return (
    <ClaudeAdminTable
      pageKicker="68 PAYING · 5 MARKETS"
      pageTitle="All subscribers"
      pageSub="Everyone currently paying. Renewal date, tier and health in one list, so a lapse never arrives as a surprise."
      pagePrimary="Message a segment"
      pageSecondary="Export CSV"
      onPrimary={() => openDrawer("message")}
      pageStats={[
        { k: "PAYING", v: "68", note: "22% of registered" },
        { k: "RENEWING ≤14 DAYS", v: "5", note: "Three are going quiet" },
        { k: "CHURNED THIS MONTH", v: "2", note: "Both Silver, no duo set" },
        { k: "LIFETIME VALUE", v: "€412", note: "Average across paid tiers" },
      ]}
      pageAdvice="Five subscribers renew within 14 days and three of them have not trained in a week. A renewal is easiest to save before it is charged."
      pageAdviceDone="Warm up the five"
      onAdvice={() => openDrawer("message", { WHO: "5 subscribers renewing ≤14 days" })}
      filters={["All", "Renewing soon", "At risk", "Yearly", "Monthly", "Lapsed"]}
      cols={["SUBSCRIBER", "TIER", "CYCLE", "RENEWS", "HEALTH"]}
      rows={rows}
      isLoading={loading}
      onEditRow={(row) => openDrawer("message", { WHO: row.a })}
      onDeleteRow={(row) => showToast(`Manage subscription for ${row.a} directly in Stripe/Store.`)}
      onRowClick={(row) => openDrawer("message", { WHO: row.a })}
    />
  );
}
