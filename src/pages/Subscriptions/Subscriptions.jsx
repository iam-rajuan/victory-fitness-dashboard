import { useState, useEffect } from "react";
import ClaudeAdminTable from "../../components/shared/ClaudeAdminTable";
import { useAdminDrawer } from "../../context/AdminDrawerContext";
import { fetchRevenue } from "../../../services/analytics.service";

const BASE_ROWS = [
  { a: "Victory Silver", b: "Full library & community", c: "€199 / yr", d: "€24 / mo", e: "21 subscribers · 18% MRR", tone: "good", id: "s1" },
  { a: "Victory Gold", b: "AI Coach & Nutrition Planner", c: "€299 / yr", d: "€36 / mo", e: "34 subscribers · 62% MRR", tone: "good", id: "s2" },
  { a: "Victory Platinum", b: "Human Coach 1-to-1 & Wearables", c: "€399 / yr", d: "€48 / mo", e: "9 subscribers · 17% MRR", tone: "good", id: "s3" },
  { a: "Victory Inner Circle", b: "Victor Akko direct mentoring", c: "Application", d: "—", e: "4 subscribers · 3% MRR", tone: "good", id: "s4" },
  { a: "21-Day Gold Beta", b: "One-time feedback program", c: "€0", d: "—", e: "15 enrolled · 0% MRR", tone: "warn", id: "s5" },
  { a: "5-Day trial · Gold", b: "Self-serve 5-day trial", c: "€0", d: "—", e: "12 running · 0% MRR", tone: "warn", id: "s6" },
  { a: "5-Day trial · Silver", b: "Self-serve 5-day trial", c: "€0", d: "—", e: "4 running · 0% MRR", tone: "warn", id: "s7" },
  { a: "5-Day trial · Platinum", b: "Self-serve 5-day trial", c: "€0", d: "—", e: "3 running · 0% MRR", tone: "warn", id: "s8" },
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
      onAdvice={() => openDrawer("flag")}
      filters={["All tiers", "Silver", "Gold", "Platinum", "Inner Circle", "Monthly", "Yearly"]}
      cols={["PLAN", "ANNUAL", "MONTHLY", "SUBSCRIBERS & SHARE", "ACTIONS"]}
      rows={rows}
      isLoading={loading}
      onEditRow={(row) => openDrawer("pricing", { TARGET: row.a })}
      onDeleteRow={(row) => showToast(`Cannot delete active catalog tier ${row.a}`)}
      onRowClick={(row) => openDrawer("pricing", { TARGET: row.a })}
    />
  );
}
