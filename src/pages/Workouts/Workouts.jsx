import { useCallback, useEffect, useState } from "react";
import ClaudeAdminTable from "../../components/shared/ClaudeAdminTable";
import { useAdminDrawer } from "../../context/AdminDrawerContext";
import { deleteAdminWorkout, listAdminWorkouts } from "../../../services/admin-workouts.service";
import { DEFAULT_WORKOUT_CATEGORY, WORKOUT_CATEGORY_OPTIONS } from "../../constants/workoutCategories";

const buildWorkoutPayload = (workout, onSaved) => {
  const duration = Number(workout.durationMinutes || 0);
  const purposes = Array.isArray(workout.purposes) && workout.purposes.length
    ? workout.purposes
    : (workout.tag ? [workout.tag] : [DEFAULT_WORKOUT_CATEGORY]);
  const orderedPurposes = WORKOUT_CATEGORY_OPTIONS.filter((category) => purposes.includes(category));
  return {
    mode: "edit",
    workoutId: workout.id,
    title: "Edit workout",
    TITLE: workout.title || "Untitled Workout",
    PURPOSE: orderedPurposes.length ? orderedPurposes : [DEFAULT_WORKOUT_CATEGORY],
    LENGTH: duration > 0 ? `${duration} min` : "Not set",
    durationSeconds: Number(workout.durationSeconds || 0),
    EQUIPMENT: workout.equipment || "Bodyweight",
    LEVEL: Array.isArray(workout.levels) && workout.levels.length ? workout.levels : (workout.level ? [workout.level] : ["Intermediate"]),
    VISIBILITY: workout.visibility || "Draft",
    videoSource: workout.videoSource || "VIMEO",
    videoUrl: workout.videoUrl || "",
    vimeoId: workout.vimeoId || "",
    thumbnail: workout.thumbnail || "",
    defaultThumbnail: workout.defaultThumbnail || (!workout.customThumbnail ? workout.thumbnail || "" : ""),
    customThumbnail: workout.customThumbnail || "",
    MOVEMENTS: Array.isArray(workout.movements) ? workout.movements : [],
    onSaved,
  };
};

const formatWorkoutLength = (durationMinutes, durationSeconds) => {
  const seconds = Number(durationSeconds || 0);
  if (seconds > 0) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, "0")}`;
  }
  return durationMinutes > 0 ? `${durationMinutes} min` : "Not set";
};

export default function Workouts() {
  const { openDrawer, showToast } = useAdminDrawer();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState([
    { k: "TOTAL", v: "0", note: "0 published, 0 draft" },
    { k: "PUBLISHED", v: "0", note: "Visible in the app" },
    { k: "DRAFT", v: "0", note: "Hidden from members" },
    { k: "UNTAGGED", v: "0", note: "No purpose, equipment or level set" },
  ]);
  const [summary, setSummary] = useState({ total: 0, published: 0, draft: 0, untagged: 0, under20: 0 });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadWorkouts = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const data = await listAdminWorkouts();
      const list = Array.isArray(data) ? data : data?.workouts || data?.items || [];
      const mapped = list.map((w) => {
        const duration = Number(w.durationMinutes || w.duration || w.lengthMinutes || 0);
        const durationSeconds = Number(w.durationSeconds || 0);
        const isPublished = w.visibility === "Published" || w.isPublished;
        const source = w.videoSource ? String(w.videoSource).toLowerCase().replace(/^\w/, (c) => c.toUpperCase()) : "Vimeo";
        return {
          id: w._id || w.id,
          a: w.title || "Untitled Workout",
          b: `${(Array.isArray(w.purposes) && w.purposes.length ? WORKOUT_CATEGORY_OPTIONS.filter((category) => w.purposes.includes(category)).join(", ") : w.tag) || "Untagged"} · ${source}`,
          c: formatWorkoutLength(duration, durationSeconds),
          d: String(w.viewsCount || w.starts || "0"),
          e: isPublished ? "Published" : "Draft",
          tone: isPublished ? "good" : "warn",
          rawData: { ...w, durationMinutes: duration, durationSeconds },
        };
      });

      const publishedCount = list.filter((w) => w.visibility === "Published" || w.isPublished).length;
      const draftCount = list.length - publishedCount;
      const untaggedCount = list.filter((w) => {
        const hasPurpose = Array.isArray(w.purposes) ? w.purposes.length > 0 : Boolean(w.tag);
        return !hasPurpose || !w.equipment || !(Array.isArray(w.levels) ? w.levels.length : w.level);
      }).length;
      const under20Count = list.filter((w) => Number(w.durationMinutes || 0) > 0 && Number(w.durationMinutes || 0) < 20).length;

      setRows(mapped);
      setSummary({ total: list.length, published: publishedCount, draft: draftCount, untagged: untaggedCount, under20: under20Count });
      setStats([
        { k: "TOTAL", v: String(list.length), note: `${publishedCount} published, ${draftCount} draft` },
        { k: "PUBLISHED", v: String(publishedCount), note: "Visible in the app" },
        { k: "DRAFT", v: String(draftCount), note: "Hidden from members" },
        { k: "UNTAGGED", v: String(untaggedCount), note: "No purpose, equipment or level set" },
      ]);
    } catch (err) {
      showToast(`Failed to load workouts: ${err.message}`);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadWorkouts();
  }, [loadWorkouts]);

  const handleSaved = async () => {
    await loadWorkouts({ silent: true });
  };

  const openWorkoutEditor = (row) => {
    const workout = row.rawData || row.raw?.rawData || row;
    openDrawer("workout", buildWorkoutPayload(workout, handleSaved));
  };

  const handleDelete = (row) => {
    setDeleteTarget(row);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteAdminWorkout(deleteTarget.id);
      showToast(`Workout "${deleteTarget.a}" removed.`);
      setDeleteTarget(null);
      await loadWorkouts({ silent: true });
    } catch (err) {
      showToast(`Failed: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <ClaudeAdminTable
        pageKicker={`${summary.total} IN THE LIBRARY · VIMEO`}
        pageTitle="Workout library"
        pageSub="Import from Vimeo, review as drafts, publish only what you want live. Purpose, duration and equipment are what members filter on."
        pagePrimary="+ Add workout"
        pageSecondary="Import from Vimeo"
        onPrimary={() => openDrawer("workout", { mode: "create", onSaved: handleSaved })}
        onSecondary={() => openDrawer("vimeo", { onImported: handleSaved })}
        pageStats={stats}
        pageAdvice={`${summary.draft} workouts are sitting in draft and invisible to members. ${summary.under20} of them are under 20 minutes - the filter people use most.`}
        pageAdviceDone="Review drafts"
        onAdvice={() => openDrawer("vimeo", { onImported: handleSaved })}
        filters={["All", ...WORKOUT_CATEGORY_OPTIONS, "Published", "Draft", "Untagged", "Under 20 min", "No equipment"]}
        cols={["WORKOUT", "PURPOSE", "LENGTH", "STARTS", "STATUS"]}
        rows={rows}
        isLoading={loading}
        onEditRow={openWorkoutEditor}
        onDeleteRow={handleDelete}
      />

      {deleteTarget && (
        <div
          className="fixed inset-0 z-[120] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 font-dmsans"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl border border-[#F7F3EE]/15 bg-[#0D0D0D] p-6 text-[#F7F3EE] shadow-2xl">
            <div className="text-[10px] font-medium tracking-[0.16em] text-[#B5651D] uppercase mb-2">
              Confirm deletion
            </div>
            <h2 className="text-2xl font-semibold font-clash leading-tight mb-2">Delete workout?</h2>
            <p className="text-sm font-inter leading-relaxed text-[#F7F3EE]/65 mb-5">
              This removes "{deleteTarget.a}" from the dashboard and the member app. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDelete}
                className="flex-1 h-11 rounded-xl bg-[#B5651D] text-[#0D0D0D] font-bold text-sm disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete workout"}
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                className="w-28 h-11 rounded-xl border border-[#F7F3EE]/20 text-[#F7F3EE] font-semibold text-sm disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
