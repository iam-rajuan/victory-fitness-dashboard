import { useState, useEffect } from "react";
import ClaudeAdminTable from "../../components/shared/ClaudeAdminTable";
import { useAdminDrawer } from "../../context/AdminDrawerContext";
import { fetchRevenue } from "../../../services/analytics.service";

const BASE_ROWS = [
  { a: "Victory Silver", b: "€199", c: "€24", d: "21", e: "18%", tone: "good", id: "s1" },
  { a: "Victory Gold", b: "€299", c: "€36", d: "34", e: "62%", tone: "good", id: "s2" },
  { a: "Victory Platinum", b: "€399", c: "€48", d: "9", e: "17%", tone: "good", id: "s3" },
  { a: "Victory Inner Circle", b: "Application", c: "—", d: "4", e: "3%", tone: "good", id: "s4" },
  { a: "21-Day Gold Beta", b: "€0", c: "—", d: "15", e: "0%", tone: "warn", id: "s5" },
  { a: "5-Day trial · Gold", b: "€0", c: "—", d: "12 running", e: "0%", tone: "warn", id: "s6" },
  { a: "5-Day trial · Silver", b: "€0", c: "—", d: "4 running", e: "0%", tone: "warn", id: "s7" },
  { a: "5-Day trial · Platinum", b: "€0", c: "—", d: "3 running", e: "0%", tone: "warn", id: "s8" },
];

export default function Subscriptions() {
  const { openDrawer, showToast } = useAdminDrawer();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState(BASE_ROWS);
  const [stats, setStats] = useState([
    { k: "MRR", v: "€4,180", note: "+€318 this week" },
    { k: "PAYING", v: "68", note: "Gold is 62% of revenue" },
    { k: "ARPU", v: "€61", note: "Yearly plans lift it" },
    { k: "FAILED RENEWALS", v: "2", note: "Two cards declined" },
  ]);

  useEffect(() => {
    fetchRevenue()
      .then((data) => {
        if (data && data.mrr) {
          setStats((prev) => [
            { k: "MRR", v: `€${data.mrr || "4,180"}`, note: "+€318 this week" },
            prev[1],
            prev[2],
            prev[3],
          ]);
        }
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  return (
    <ClaudeAdminTable
      pageKicker="REVENUE · 4 TIERS · 5 MARKETS"
      pageTitle="Subscriptions"
      pageSub="Silver €199, Gold €299, Platinum €399 a year, or monthly at a 31% premium. Inner Circle is application only and never sold here."
      pagePrimary="+ Add plan"
      pageSecondary="Edit pricing"
      onPrimary={() => openDrawer("pricing")}
      onSecondary={() => openDrawer("pricing")}
      pageStats={stats}
      pageAdvice="Ghana has 128 registered users and no completed payment. Until one MoMo transaction clears, every cedi spent on reach there is wasted."
      pageAdviceDone="Run a test payment"
      onAdvice={() => openDrawer("pricing")}
      filters={["All tiers", "Silver", "Gold", "Platinum", "Inner Circle", "Monthly", "Yearly"]}
      cols={["PLAN", "PRICE / YEAR", "PRICE / MONTH", "SUBSCRIBERS", "SHARE OF MRR"]}
      rows={rows}
      isLoading={loading}
      onEditRow={(row) => openDrawer("pricing", { TARGET: row.a })}
      onDeleteRow={(row) => showToast(`Cannot delete active catalog tier ${row.a}`)}
      onRowClick={(row) => openDrawer("pricing", { TARGET: row.a })}
    />
  );
}
