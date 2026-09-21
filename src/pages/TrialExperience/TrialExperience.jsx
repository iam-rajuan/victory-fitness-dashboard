import { useState, useEffect } from "react";
import ClaudeAdminTable from "../../components/shared/ClaudeAdminTable";
import { useAdminDrawer } from "../../context/AdminDrawerContext";
import { getPhaseOneBetaSummary } from "../../../services/admin-trial.service";

const BASE_ROWS = [
  { a: "Kofi Mensah", b: "Ghana · kofi@mensah.gh", c: "Gold", d: "Day 5 · 31 coach messages", e: "Converts", tone: "good", id: "tr1" },
  { a: "Sarah Fischer", b: "Germany · sarah@fischer.de", c: "Gold", d: "Day 5 · 24 coach messages", e: "Converts", tone: "good", id: "tr2" },
  { a: "Nana Owusu", b: "Ghana · nana@accra.gh", c: "Gold", d: "Day 5 · 22 coach messages", e: "Converts", tone: "good", id: "tr3" },
  { a: "Peter Wagner", b: "Germany · p.wagner@wagner.de", c: "Gold", d: "Day 5 · 20 coach messages", e: "Converts", tone: "good", id: "tr4" },
  { a: "Ingrid Vogel", b: "Germany · ingrid@vogel.de", c: "Platinum", d: "Day 3 · Synced Garmin", e: "Watch", tone: "warn", id: "tr5" },
  { a: "Ravi Iyer", b: "India · ravi.iyer@mumbai.in", c: "Gold", d: "Day 2 · 2 workouts, no coach", e: "Needs a nudge", tone: "warn", id: "tr6" },
  { a: "Tomasz Nowak", b: "Poland · t.nowak@warsaw.pl", c: "Silver", d: "Day 4 · No activity", e: "Will lapse", tone: "bad", id: "tr7" },
  { a: "Claire Dubois", b: "France · claire@dubois.fr", c: "Gold", d: "Day 1 · Not started", e: "Needs a nudge", tone: "bad", id: "tr8" },
];

export default function TrialExperience() {
  const { openDrawer, showToast } = useAdminDrawer();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState(BASE_ROWS);

  useEffect(() => {
    getPhaseOneBetaSummary()
      .then((data) => {
        // live data integration where available
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  return (
    <ClaudeAdminTable
      pageKicker="19 RUNNING · EVERY PAID TIER"
      pageTitle="5-day trials"
      pageSub="Five days of whichever tier they picked. Nothing is charged until day five, and nothing converts without an explicit tap."
      pagePrimary="Send day-5 messages"
      pageSecondary="Edit trial sequence"
      onPrimary={() => openDrawer("message", { WHO: "4 Gold trials ending today" })}
      onSecondary={() => openDrawer("template")}
      pageStats={[
        { k: "RUNNING", v: "19", note: "12 Gold, 4 Silver, 3 Platinum" },
        { k: "ENDING TODAY", v: "4", note: "All Gold, all heavy users" },
        { k: "TRIAL → PAID", v: "34%", note: "Above the 30% floor" },
        { k: "UNDECIDED", v: "7", note: "Tapped “decide later”" },
      ]}
      pageAdvice="Four Gold trials end today and all four used the coach more than twenty times. That is the group that converts — the message is drafted and waiting on you."
      pageAdviceDone="Review and send"
      onAdvice={() => openDrawer("message", { WHO: "4 Gold trials ending today" })}
      filters={["All", "Gold", "Silver", "Platinum", "Ending ≤48h", "Undecided"]}
      cols={["TESTER", "TIER TRIED", "DAY & USAGE", "LIKELY OUTCOME", "ACTIONS"]}
      rows={rows}
      isLoading={loading}
      onEditRow={(row) => openDrawer("message", { WHO: row.a })}
      onDeleteRow={(row) => showToast(`Extended trial for ${row.a} by 5 days.`)}
      onRowClick={(row) => openDrawer("message", { WHO: row.a })}
    />
  );
}
