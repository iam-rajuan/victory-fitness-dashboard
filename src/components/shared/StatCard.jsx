/**
 * Reusable metric card.
 *
 * Props:
 *   label           — small label above the value
 *   value           — formatted number/string to display large
 *   changePct       — optional percent change; shows trend arrow
 *   colorBand       — 'green' | 'amber' | 'red' | null (threshold dot on left edge)
 *   sublabel        — small secondary line (e.g. 'GHS 12,400 · EUR 1,800')
 *   icon            — optional React icon element
 *   loading         — shows skeleton when true
 *   tone            — 'brand' | 'accent' | 'warm' | 'danger' | 'neutral'
 */
export default function StatCard({
  label,
  value,
  changePct,
  colorBand,
  sublabel,
  icon,
  loading = false,
  tone = "brand",
  onClick,
}) {
  const toneClass = {
    brand: "from-brand-500 to-brand-700",
    accent: "from-accent-500 to-accent-700",
    warm: "from-warm-400 to-warm-600",
    danger: "from-danger-500 to-red-700",
    neutral: "from-surface-300 to-surface-500",
  }[tone];

  const bandClass = {
    green: "border-l-4 border-accent-500",
    amber: "border-l-4 border-warm-400",
    red: "border-l-4 border-danger-500",
    null: "",
  }[colorBand || "null"];

  const arrow =
    changePct == null
      ? null
      : changePct > 0.5
      ? { glyph: "▲", className: "text-accent-600" }
      : changePct < -0.5
      ? { glyph: "▼", className: "text-danger-500" }
      : { glyph: "—", className: "text-surface-400" };

  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      className={`group relative overflow-hidden rounded-2xl border border-surface-200 bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md ${bandClass} ${
        onClick ? "cursor-pointer hover:-translate-y-0.5" : ""
      }`}
    >
      {/* Tone gradient strip on top */}
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${toneClass} opacity-80`}
        aria-hidden
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-surface-500">
            {label}
          </p>
          {loading && (value === undefined || value === null || value === "—") ? (
            <div className="mt-2 h-8 w-24 animate-pulse rounded-md bg-surface-200" />
          ) : (
            <p className="mt-1 text-2xl font-bold tabular-nums text-surface-900 sm:text-3xl">
              {value ?? "—"}
            </p>
          )}
          {sublabel && !loading && (
            <p className="mt-1 truncate text-xs text-surface-500" title={sublabel}>
              {sublabel}
            </p>
          )}
        </div>
        {icon && (
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${toneClass} text-white shadow-md`}>
            {icon}
          </div>
        )}
      </div>

      {arrow && !loading && (
        <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold">
          <span className={arrow.className}>{arrow.glyph}</span>
          <span className={arrow.className}>
            {Math.abs(changePct).toFixed(1)}%
          </span>
          <span className="text-surface-400">vs previous period</span>
        </div>
      )}
    </div>
  );
}
