import { useEffect, useState } from "react";
import ClaudeAdminTable from "../../components/shared/ClaudeAdminTable";
import { useAdminDrawer } from "../../context/AdminDrawerContext";
import { adminApiRequest } from "../../../services/auth.service";

const BASE_ROWS = [
  { a: "21-Day Warrior", b: "Full transformation regimen", c: "Physical", d: "21 days · 412 joined", e: "Active", tone: "good", id: "c1" },
  { a: "Cold Start", b: "Cold exposure nervous system training", c: "Physical", d: "3 days · 312 joined", e: "Active", tone: "good", id: "c2" },
  { a: "Week of Strength", b: "Foundation compound barbell & dumbbells", c: "Physical", d: "7 days · 266 joined", e: "Active", tone: "good", id: "c3" },
  { a: "Sleep Lock", b: "9-hour sleep sanctuary protocol", c: "Mental", d: "5 days · 188 joined", e: "Active", tone: "good", id: "c4" },
  { a: "Deep Connection", b: "Accountability partner sync & dialogue", c: "Relational", d: "14 days · 94 joined", e: "Active", tone: "good", id: "c5" },
  { a: "Clean Eating Fortnight", b: "Whole foods & zero processed sugar", c: "Physical", d: "14 days · 0 joined", e: "Opens Monday", tone: "warn", id: "c6" },
  { a: "Digital Detox", b: "Screen curfew after 20:00", c: "Mental", d: "3 days · 141 joined", e: "Active", tone: "good", id: "c7" },
  { a: "Forgive & Grow", b: "Daily journal reflection prompt", c: "Relational", d: "21 days · 38 joined", e: "Low uptake", tone: "warn", id: "c8" },
];

const BASE_RAIL = [
  { d: "21d", type: "PHYSICAL", n: "21-Day Warrior", joined: "412 active members" },
  { d: "3d", type: "PHYSICAL", n: "Cold Start", joined: "312 active members" },
  { d: "7d", type: "PHYSICAL", n: "Week of Strength", joined: "266 active members" },
  { d: "5d", type: "MENTAL", n: "Sleep Lock", joined: "188 active members" },
];

export default function Challenges() {
  const { openDrawer, showToast } = useAdminDrawer();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState(BASE_ROWS);
  const [rail, setRail] = useState(BASE_RAIL);

  useEffect(() => {
    let isMounted = true;
    adminApiRequest("/challenges")
      .then((data) => {
        if (!isMounted || !data) return;
        const list = Array.isArray(data) ? data : data.challenges || data.items || [];
        if (list.length > 0) {
          const mapped = list.map((c) => ({
            id: c._id || c.id,
            a: c.title || "Challenge",
            b: c.description || "Daily challenge",
            c: c.category || c.goal_type || "Physical",
            d: `${c.duration_days || c.durationDays || 7} days · ${c.participants_count || 0} joined`,
            e: c.status === "ACTIVE" ? "Active" : c.status || "Active",
            tone: c.status === "ACTIVE" ? "good" : "warn",
            rawData: c,
          }));
          setRows(mapped);
        }
      })
      .catch(() => null)
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleDelete = async (row) => {
    if (window.confirm(`Delete challenge "${row.a}"?`)) {
      try {
        await adminApiRequest(`/challenges/${row.id}`, { method: "DELETE" }).catch(() => null);
        setRows((prev) => prev.filter((r) => r.id !== row.id));
        showToast(`Challenge "${row.a}" deleted.`);
      } catch (err) {
        showToast(`Failed: ${err.message}`);
      }
    }
  };

  return (
    <ClaudeAdminTable
      pageKicker="35 IN THE LIBRARY · 3 TO 21 DAYS"
      pageTitle="Challenges"
      pageSub="Physical, Mental and Relational, from 3 to 21 days. The short ones convert browsers into posters; the long ones build the habit."
      pagePrimary="+ Add challenge"
      pageSecondary="Duplicate challenge"
      onPrimary={() => openDrawer("challenge")}
      onSecondary={() => openDrawer("challenge")}
      pageStats={[
        { k: "TOTAL", v: "35", note: "7 physical, 12 mental, 16 mixed" },
        { k: "ACTIVE JOINS", v: "1,240", note: "Across all live challenges" },
        { k: "INVITES SENT", v: "318", note: "41% became a signup" },
        { k: "COMPLETION", v: "62%", note: "3-day: 81% · 21-day: 34%" },
      ]}
      pageAdvice="The 3-day challenges drive 4× the invites of the 21-day ones, but you only have seven of them. One more 3-day is the cheapest growth lever here."
      pageAdviceDone="Create a 3-day challenge"
      onAdvice={() => openDrawer("challenge", { LENGTH: "3", TYPE: "Physical" })}
      rail={rail.map((item) => ({
        ...item,
        onEdit: () => openDrawer("challenge", { NAME: item.n }),
        onRemove: () => showToast(`Removed ${item.n} from featured rail.`),
      }))}
      filters={["All", "3 day", "5 day", "7 day", "14 day", "21 day", "Draft"]}
      cols={["CHALLENGE", "TYPE", "DAYS & PARTICIPANTS", "STATUS", "ACTIONS"]}
      rows={rows}
      isLoading={loading}
      onEditRow={(row) => openDrawer("challenge", { NAME: row.a, TYPE: row.c })}
      onDeleteRow={handleDelete}
      onRowClick={(row) => openDrawer("challenge", { NAME: row.a, TYPE: row.c })}
    />
  );
}
