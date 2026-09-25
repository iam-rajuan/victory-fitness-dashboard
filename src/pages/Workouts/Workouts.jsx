import { useEffect, useState } from "react";
import ClaudeAdminTable from "../../components/shared/ClaudeAdminTable";
import { useAdminDrawer } from "../../context/AdminDrawerContext";
import { listAdminWorkouts, deleteAdminWorkout } from "../../../services/admin-workouts.service";

const BASE_ROWS = [
  { a: "Awakening Flow", b: "Mobility", c: "12 min", d: "412", e: "Published", tone: "good", id: "w1" },
  { a: "Muscle Start", b: "Strength", c: "38 min", d: "288", e: "Published", tone: "good", id: "w2" },
  { a: "Recovery Reset", b: "Recovery", c: "20 min", d: "196", e: "Published", tone: "good", id: "w3" },
  { a: "Push and Pull", b: "Strength", c: "45 min", d: "0", e: "Draft", tone: "warn", id: "w4" },
  { a: "Rambo Timer", b: "Conditioning", c: "25 min", d: "0", e: "Draft", tone: "warn", id: "w5" },
  { a: "Victory Core", b: "Core", c: "15 min", d: "0", e: "Draft", tone: "warn", id: "w6" },
  { a: "Langhantel Basis", b: "Strength", c: "40 min", d: "0", e: "Draft · untagged", tone: "bad", id: "w7" },
  { a: "The Anchor", b: "Mobility", c: "18 min", d: "0", e: "Draft", tone: "warn", id: "w8" },
];

export default function Workouts() {
  const { openDrawer, showToast } = useAdminDrawer();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState(BASE_ROWS);
  const [stats, setStats] = useState([
    { k: "TOTAL", v: "170", note: "147 published, 23 draft" },
    { k: "MOST STARTED", v: "Awakening", note: "412 starts this month" },
    { k: "AVG COMPLETION", v: "68%", note: "Drops below 20% past 45 min" },
    { k: "UNTAGGED", v: "31", note: "No purpose or equipment set" },
  ]);

  useEffect(() => {
    let isMounted = true;
    listAdminWorkouts()
      .then((data) => {
        if (!isMounted || !data) return;
        const list = Array.isArray(data) ? data : data.workouts || data.items || [];
        if (list.length > 0) {
          const mapped = list.map((w) => ({
            id: w._id || w.id,
            a: w.title || "Untitled Workout",
            b: w.purpose || w.category || "Mobility",
            c: `${w.duration || w.lengthMinutes || "20"} min`,
            d: String(w.viewsCount || w.starts || "0"),
            e: w.isPublished ? "Published" : "Draft",
            tone: w.isPublished ? "good" : "warn",
            rawData: w,
          }));
          setRows(mapped);
          const publishedCount = list.filter((w) => w.isPublished).length;
          setStats([
            { k: "TOTAL", v: String(list.length), note: `${publishedCount} published, ${list.length - publishedCount} draft` },
            { k: "MOST STARTED", v: list[0]?.title || "Awakening", note: "412 starts this month" },
            { k: "AVG COMPLETION", v: "68%", note: "Drops below 20% past 45 min" },
            { k: "UNTAGGED", v: String(list.filter((w) => !w.purpose).length), note: "No purpose or equipment set" },
          ]);
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
    if (window.confirm(`Delete workout "${row.a}"?`)) {
      try {
        await deleteAdminWorkout(row.id).catch(() => null);
        setRows((prev) => prev.filter((r) => r.id !== row.id));
        showToast(`Workout "${row.a}" removed.`);
      } catch (err) {
        showToast(`Failed: ${err.message}`);
      }
    }
  };

  return (
    <ClaudeAdminTable
      pageKicker="170 IN THE LIBRARY · VIMEO"
      pageTitle="Workout library"
      pageSub="Import from Vimeo, review as drafts, publish only what you want live. Purpose, duration and equipment are what members filter on."
      pagePrimary="+ Add workout"
      pageSecondary="Import from Vimeo"
      onPrimary={() => openDrawer("workout")}
      onSecondary={() => openDrawer("vimeo")}
      pageStats={stats}
      pageAdvice="23 workouts are sitting in draft and invisible to members. Six of them are under 20 minutes — the filter people use most."
      pageAdviceDone="Publish the short ones"
      onAdvice={() => openDrawer("workout")}
      filters={["All", "Published", "Draft", "Untagged", "Under 20 min", "No equipment"]}
      cols={["WORKOUT", "PURPOSE", "LENGTH", "STARTS", "STATUS"]}
      rows={rows}
      isLoading={loading}
      onEditRow={(row) => openDrawer("workout", { TITLE: row.a, PURPOSE: row.b })}
      onDeleteRow={handleDelete}
      onRowClick={(row) => openDrawer("workout", { TITLE: row.a, PURPOSE: row.b })}
    />
  );
}
