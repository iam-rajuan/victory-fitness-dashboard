import { useCallback, useEffect, useMemo, useState } from "react";
import ClaudeAdminTable from "../../components/shared/ClaudeAdminTable";
import { useAdminDrawer } from "../../context/AdminDrawerContext";
import { adminApiRequest } from "../../../services/auth.service";

const FEED_LABELS = {
  ALL: "Global",
  SILVER: "Silver",
  GOLD: "Gold",
  PLATINUM: "Platinum",
  INNER_CIRCLE: "Inner Circle",
};

const toAudience = (label) => {
  const normalized = String(label || "").trim().toUpperCase().replace(/\s+/g, "_");
  if (normalized === "GLOBAL" || normalized === "ALL_TIERS" || normalized === "ALL") return "ALL";
  return ["SILVER", "GOLD", "PLATINUM", "INNER_CIRCLE"].includes(normalized) ? normalized : "ALL";
};

const formatPostedAt = (value) => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "Unknown";
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));
  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hr${diffHours === 1 ? "" : "s"} ago`;
  if (diffHours < 48) return "Yesterday";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const formatBroadcastTiming = (post) => {
  if (String(post?.publish_status || "").toLowerCase() === "scheduled") {
    const scheduled = post?.scheduled_at ? new Date(post.scheduled_at) : null;
    if (scheduled && !Number.isNaN(scheduled.getTime())) {
      return `Scheduled ${scheduled.toLocaleDateString(undefined, { month: "short", day: "numeric" })} ${scheduled.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`;
    }
    return `Scheduled · ${post?.publish_option || "Later"}`;
  }
  return formatPostedAt(post?.created_at);
};

const classifyPostType = (post) => {
  if (post.flagged) return "Flagged";
  if (post.broadcast_format) return post.broadcast_format;
  if (post.video_url) return "Video";
  if (post.audio_url) return "Voice note";
  if (post.image_url) return "Photo";
  if (post.is_admin_broadcast) return "Announcement";
  return "Text";
};

const buildRow = (post) => {
  const cheers = Number(post.like_count || 0);
  const comments = Number(post.comment_count || 0);
  return {
    id: post.id,
    a: post.author_name || "Member",
    b: FEED_LABELS[String(post.audience || "ALL").toUpperCase()] || "Global",
    c: classifyPostType(post),
    d: formatBroadcastTiming(post),
    e: `${cheers} ${cheers === 1 ? "cheer" : "cheers"} · ${comments} comments`,
    tone: post.flagged ? "warn" : cheers > 5 ? "good" : "warn",
    rawData: post,
  };
};

const buildBroadcastPayload = (row, onSaved) => {
  const post = row?.raw?.rawData || row?.rawData || row || {};
  return {
    id: post.id,
    "TARGET FEEDS": FEED_LABELS[String(post.audience || "ALL").toUpperCase()] === "Global"
      ? "All tiers"
      : FEED_LABELS[String(post.audience || "ALL").toUpperCase()] || "All tiers",
    FORMAT: post.broadcast_format || classifyPostType(post),
    MARKET: post.market || "All markets",
    PURPOSE: classifyPostType(post) === "Text" ? "Announcement" : classifyPostType(post),
    ...(post.purpose ? { PURPOSE: post.purpose } : {}),
    PUBLISH: post.publish_option || "Now",
    MESSAGE: post.content || "",
    imageUrl: post.image_url || "",
    videoUrl: post.video_url || "",
    audioUrl: post.audio_url || "",
    flagged: Boolean(post.flagged),
    flag_reason: post.flag_reason || "",
    rawData: post,
    onSaved,
  };
};

export default function Community() {
  const { openDrawer, showToast } = useAdminDrawer();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);

  const loadCommunity = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApiRequest("/admin/community/posts?limit=100");
      const posts = Array.isArray(data?.posts) ? data.posts : [];
      setRows(posts.map(buildRow));
      setTotal(Number(data?.total || posts.length));
    } catch (error) {
      showToast(`Failed: ${error?.message || "Could not load community posts."}`);
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadCommunity();
  }, [loadCommunity]);

  const stats = useMemo(() => {
    const cheers = rows.reduce((sum, row) => sum + Number(row.rawData?.like_count || 0), 0);
    const flagged = rows.filter((row) => row.rawData?.flagged).length;
    const silver = rows.filter((row) => String(row.rawData?.audience || "").toUpperCase() === "SILVER").length;
    const feedCount = new Set(rows.map((row) => String(row.rawData?.audience || "ALL").toUpperCase())).size;
    const silverPct = total > 0 ? Math.round((silver / total) * 100) : 0;

    return [
      { k: "POSTS", v: String(total), note: `Across ${feedCount || 0} feeds` },
      { k: "CHEERS", v: String(cheers), note: "Across loaded posts" },
      { k: "FLAGGED", v: String(flagged), note: flagged ? "Awaiting review" : "Nothing awaiting review" },
      { k: "SILVER FEED", v: `${silver} ${silver === 1 ? "post" : "posts"}`, note: `${silverPct}% of all activity` },
    ];
  }, [rows, total]);

  const handleDelete = async (row) => {
    const post = row?.raw?.rawData || row?.rawData || row;
    const confirmed = window.confirm(`Delete post from ${post.author_name || row.a}?`);
    if (!confirmed) return;
    try {
      await adminApiRequest(`/admin/community/posts/${post.id || row.id}`, { method: "DELETE" });
      await loadCommunity();
      showToast(`Removed post from ${post.author_name || row.a}.`);
    } catch (error) {
      showToast(`Failed: ${error?.message || "Could not delete community post."}`);
    }
  };

  const openBroadcastDrawer = (row = null) => {
    openDrawer("broadcast", buildBroadcastPayload(row, loadCommunity));
  };

  const flaggedCount = rows.filter((row) => row.rawData?.flagged).length;

  return (
    <ClaudeAdminTable
      pageKicker={`${total} POSTS · BACKEND LIVE`}
      pageTitle="Community"
      pageSub="One feed per tier plus a global broadcast. Verified announcements from you carry a badge members can see."
      pagePrimary="New broadcast"
      pageSecondary="Moderation queue"
      onPrimary={() => openBroadcastDrawer()}
      onSecondary={() =>
        flaggedCount
          ? showToast(`${flaggedCount} flagged ${flaggedCount === 1 ? "post" : "posts"} shown with the Flagged filter.`)
          : showToast("Moderation queue clear — 0 flagged items.")
      }
      pageStats={stats}
      pageAdvice="Silver has one post against Gold's thirteen. A member paying €199 is opening the quietest room in the app — seed three posts a week until it carries itself."
      pageAdviceDone="Seed the Silver feed"
      onAdvice={() => openDrawer("broadcast", { "TARGET FEEDS": "Silver", onSaved: loadCommunity })}
      adviceAudit={{
        auditId: "ADMIN-EXTRA-022",
        status: "extra",
        label: "NEW FEATURE - COMMUNITY FEED SEEDING ADVICE NOT IN REQUIREMENT",
      }}
      filters={["All tiers", "Global", "Silver", "Gold", "Platinum", "Inner Circle", "Flagged"]}
      cols={["AUTHOR", "FEED", "TYPE", "POSTED", "ENGAGEMENT"]}
      rows={rows}
      isLoading={loading}
      onEditRow={openBroadcastDrawer}
      onDeleteRow={handleDelete}
      onRowClick={openBroadcastDrawer}
    />
  );
}
