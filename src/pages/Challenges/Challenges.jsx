import { useEffect, useState } from "react";
import ClaudeAdminTable from "../../components/shared/ClaudeAdminTable";
import { useAdminDrawer } from "../../context/AdminDrawerContext";
import { adminApiRequest } from "../../../services/auth.service";

const BASE_ROWS = [
  { a: "21-Day Warrior", b: "Physical", c: "21", d: "412", e: "Active", tone: "good", id: "c1" },
  { a: "Cold Start", b: "Physical", c: "3", d: "312", e: "Active", tone: "good", id: "c2" },
  { a: "Week of Strength", b: "Physical", c: "7", d: "266", e: "Active", tone: "good", id: "c3" },
  { a: "Sleep Lock", b: "Mental", c: "5", d: "188", e: "Active", tone: "good", id: "c4" },
  { a: "Deep Connection", b: "Relational", c: "14", d: "94", e: "Active", tone: "good", id: "c5" },
  { a: "Clean Eating Fortnight", b: "Physical", c: "14", d: "0", e: "Opens Monday", tone: "warn", id: "c6" },
  { a: "Digital Detox", b: "Mental", c: "3", d: "141", e: "Active", tone: "good", id: "c7" },
  { a: "Forgive & Grow", b: "Relational", c: "21", d: "38", e: "Low uptake", tone: "warn", id: "c8" },
];

const BASE_RAIL = [
  { d: "21d", type: "Physical", n: "21-Day Warrior", joined: "412 joined" },
  { d: "3d", type: "Physical", n: "Cold Start", joined: "312 joined" },
  { d: "7d", type: "Physical", n: "Week of Strength", joined: "266 joined" },
  { d: "5d", type: "Mental", n: "Sleep Lock", joined: "188 joined" },
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
            b: c.category || c.goal_type || "Physical",
            c: String(c.duration_days || c.durationDays || 7),
            d: String(c.participants_count || 0),
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
      pageSecondary="Duplicate a challenge"
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
        onRemove: () => showToast(`Removed ${item.n}`),
      }))}
      filters={["All", "3 day", "5 day", "7 day", "14 day", "21 day", "Draft"]}
      cols={["CHALLENGE", "TYPE", "DAYS", "JOINED", "STATUS"]}
      rows={rows}
      isLoading={loading}
      onEditRow={(row) => openDrawer("challenge", { NAME: row.a, TYPE: row.b })}
      onDeleteRow={handleDelete}
      onRowClick={(row) => openDrawer("challenge", { NAME: row.a, TYPE: row.b })}
    />
  );
}
