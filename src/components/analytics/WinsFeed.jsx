import { useEffect, useState } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { FaCheckCircle, FaFire, FaUserPlus, FaUsers } from "react-icons/fa";
import { fetchDailyWins } from "../../../services/analytics.service";
import { useAnalyticsFilter } from "../../context/AnalyticsFilterContext";

dayjs.extend(relativeTime);

const TYPE_STYLE = {
  whatsapp_share: { icon: FaUsers, tone: "accent", label: "WhatsApp share" },
  pair_created: { icon: FaUsers, tone: "brand", label: "Accountability" },
  challenge_completed: { icon: FaCheckCircle, tone: "accent", label: "Challenge" },
  new_subscriber: { icon: FaUserPlus, tone: "warm", label: "New subscriber" },
  streak: { icon: FaFire, tone: "danger", label: "Streak" },
};

const TONE_CLASS = {
  brand: "bg-brand-50 text-brand-700 border-brand-100",
  accent: "bg-accent-50 text-accent-700 border-accent-100",
  warm: "bg-warm-50 text-warm-700 border-warm-100",
  danger: "bg-danger-50 text-danger-600 border-danger-100",
};

/**
 * Live event stream updated every 60 seconds.
 * Falls back to empty state if backend returns no events.
 */
export default function WinsFeed() {
  const filter = useAnalyticsFilter();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    let timer = null;

    const load = async () => {
      if (!cancelled) {
        setError("");
      }
      try {
        const data = await fetchDailyWins(filter);
        if (cancelled) return;
        setEvents(Array.isArray(data?.events) ? data.events : []);
        setLastUpdated(data?.lastUpdated || new Date().toISOString());
      } catch (requestError) {
        if (!cancelled) {
          setEvents([]);
          setError(requestError instanceof Error ? requestError.message : "Failed to load daily wins");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    timer = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [filter]);

  return (
    <div className="flex h-full min-h-48 flex-col">
      <div className="mb-3 flex justify-end">
        <span className="text-[10px] uppercase tracking-wider text-surface-400">
          Live · 60s
        </span>
      </div>

      {loading ? (
        <div className="flex-1 space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-surface-100" />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-1 items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 text-center text-sm font-medium text-red-700">
          {error}
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-center text-xs text-surface-500">
          Events will appear here as your community achieves goals.
        </div>
      ) : (
        <ul className="flex-1 space-y-2 overflow-y-auto">
          {events.map((e, idx) => {
            const style = TYPE_STYLE[e.type] || {
              icon: FaCheckCircle,
              tone: "brand",
              label: "Win",
            };
            const Icon = style.icon;
            return (
              <li
                key={idx}
                className={`flex items-start gap-2 rounded-lg border px-2.5 py-2 ${TONE_CLASS[style.tone]}`}
              >
                <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold">{e.label}</p>
                  <p className="text-[10px] opacity-70">
                    {e.createdAt ? dayjs(e.createdAt).fromNow() : "Just now"}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {lastUpdated && (
        <p className="mt-2 text-[10px] text-surface-400">
          Updated {dayjs(lastUpdated).fromNow()}
        </p>
      )}
    </div>
  );
}
