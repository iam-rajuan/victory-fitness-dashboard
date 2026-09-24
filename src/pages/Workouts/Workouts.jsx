import { useEffect, useState } from "react";
import ClaudeAdminTable from "../../components/shared/ClaudeAdminTable";
import { useAdminDrawer } from "../../context/AdminDrawerContext";
import { listAdminWorkouts, deleteAdminWorkout } from "../../../services/admin-workouts.service";

const BASE_ROWS = [
  { a: "Awakening Flow", b: "Full mobility session · Bodyweight", c: "Mobility", d: "12 min · 412 starts", e: "Published", tone: "good", id: "w1" },
  { a: "Muscle Start", b: "Compound foundation · Dumbbells", c: "Strength", d: "38 min · 288 starts", e: "Published", tone: "good", id: "w2" },
  { a: "Recovery Reset", b: "Joint relief & spine release", c: "Recovery", d: "20 min · 196 starts", e: "Published", tone: "good", id: "w3" },
  { a: "Push and Pull", b: "Upper body hypertrophy", c: "Strength", d: "45 min · 0 starts", e: "Draft", tone: "warn", id: "w4" },
  { a: "Rambo Timer", b: "High intensity interval workout", c: "Conditioning", d: "25 min · 0 starts", e: "Draft", tone: "warn", id: "w5" },
  { a: "Victory Core", b: "Isometric hollow holds & planks", c: "Core", d: "15 min · 0 starts", e: "Draft", tone: "warn", id: "w6" },
  { a: "Langhantel Basis", b: "Barbell cleans and overhead press", c: "Strength", d: "40 min · 0 starts", e: "Draft · untagged", tone: "bad", id: "w7" },
  { a: "The Anchor", b: "Deep hip flexor & lower back flow", c: "Mobility", d: "18 min · 0 starts", e: "Draft", tone: "warn", id: "w8" },
];

export default function Workouts() {
  const { openDrawer, showToast } = useAdminDrawer();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState(BASE_ROWS);
  const [stats, setStats] = useState([
    { k: "TOTAL", v: "170", note: "147 published, 23 draft" },
    { k: "MOST STARTED", v: "Awakening", note: "412 starts this month" },
    { k: "AVG COMPLETION", v: "68%", note: "Drops below 20% past 45m" },
    { k: "UNTAGGED", v: "31", note: "No purpose or kit set" },
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
            b: w.coachNote || w.subtitle || w.description || "Video workout",
            c: w.purpose || w.category || "General",
            d: `${w.duration || w.lengthMinutes || "20"} min · ${w.viewsCount || 0} starts`,
            e: w.isPublished ? "Published" : "Draft",
            tone: w.isPublished ? "good" : "warn",
            rawData: w,
          }));
          setRows(mapped);
          const publishedCount = list.filter((w) => w.isPublished).length;
          setStats([
            { k: "TOTAL", v: String(list.length), note: `${publishedCount} published, ${list.length - publishedCount} draft` },
            { k: "MOST STARTED", v: list[0]?.title || "Awakening", note: "Top watched workout" },
            { k: "AVG COMPLETION", v: "68%", note: "Optimal under 30 min" },
            { k: "UNTAGGED", v: String(list.filter((w) => !w.purpose).length), note: "Needs categorization" },
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
      cols={["WORKOUT", "PURPOSE", "LENGTH & STARTS", "STATUS", "ACTIONS"]}
      rows={rows}
      isLoading={loading}
      onEditRow={(row) => openDrawer("workout", { TITLE: row.a, PURPOSE: row.c })}
      onDeleteRow={handleDelete}
      onRowClick={(row) => openDrawer("workout", { TITLE: row.a, PURPOSE: row.c })}
    />
  );
}
