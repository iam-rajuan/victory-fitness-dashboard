import { useState, useEffect } from "react";
import ClaudeAdminTable from "../../components/shared/ClaudeAdminTable";
import { useAdminDrawer } from "../../context/AdminDrawerContext";
import { listAdminWorkouts } from "../../../services/admin-workouts.service";

const BASE_ROWS = [
  { a: "Zone 2 Fundamentals", b: "Mitochondrial density & aerobic base", c: "Science", d: "15 min · 88 watched", e: "Live", tone: "good", id: "m1" },
  { a: "Post-Workout Nutrition", b: "Timing leucine spikes & glycogen replenishment", c: "Nutrition", d: "18 min · 18 watched", e: "Live", tone: "good", id: "m2" },
  { a: "Test Version One", b: "Full masterclass recording", c: "Nutrition", d: "60 min · 42 watched", e: "Live", tone: "good", id: "m3" },
  { a: "Sleep and Recovery", b: "Sleep cycles and CNS resetting", c: "Science", d: "24 min · 0 watched", e: "Draft", tone: "warn", id: "m4" },
  { a: "Protein Without Meat", b: "High bioavailability plant sources", c: "Nutrition", d: "22 min · 0 watched", e: "Draft", tone: "warn", id: "m5" },
];

export default function Masterclasses() {
  const { openDrawer, showToast } = useAdminDrawer();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState(BASE_ROWS);

  useEffect(() => {
    listAdminWorkouts()
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.workouts || [];
        const mc = list.filter((w) => w.type === "MASTERCLASS" || w.category === "Masterclass");
        if (mc.length > 0) {
          setRows(
            mc.map((w) => ({
              id: w._id || w.id,
              a: w.title,
              b: w.coachNote || w.subtitle || "Long-form masterclass",
              c: w.category || "Science",
              d: `${w.duration || 20} min · ${w.viewsCount || 0} watched`,
              e: w.isPublished ? "Live" : "Draft",
              tone: w.isPublished ? "good" : "warn",
              rawData: w,
            }))
          );
        }
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  return (
    <ClaudeAdminTable
      pageKicker="3 LIVE · VIMEO"
      pageTitle="Masterclasses"
      pageSub="Long-form teaching from Victor. Gold and above. Members who watch one retain noticeably better than those who never do."
      pagePrimary="+ Add masterclass"
      pageSecondary="Import from Vimeo"
      onPrimary={() => openDrawer("workout")}
      onSecondary={() => openDrawer("vimeo")}
      pageStats={[
        { k: "LIVE", v: "3", note: "Nutrition, Science, Recovery" },
        { k: "WATCHED", v: "148", note: "Sessions started" },
        { k: "FINISH RATE", v: "54%", note: "Drops sharply past 30 min" },
        { k: "RETENTION LIFT", v: "+19 pts", note: "Watchers vs non-watchers" },
      ]}
      pageAdvice="Only three are live and none has been announced since May. A masterclass is the cheapest Platinum justification you have."
      pageAdviceDone="Announce one to Gold"
      onAdvice={() => openDrawer("broadcast", { TARGET: "Gold" })}
      filters={["All", "Nutrition", "Science", "Training", "Draft"]}
      cols={["TITLE", "CATEGORY", "LENGTH & WATCHED", "STATUS", "ACTIONS"]}
      rows={rows}
      isLoading={loading}
      onEditRow={(row) => openDrawer("workout", { TITLE: row.a, PURPOSE: row.c })}
      onDeleteRow={(row) => {
        setRows((prev) => prev.filter((r) => r.id !== row.id));
        showToast(`Masterclass "${row.a}" removed.`);
      }}
      onRowClick={(row) => openDrawer("workout", { TITLE: row.a, PURPOSE: row.c })}
    />
  );
}
