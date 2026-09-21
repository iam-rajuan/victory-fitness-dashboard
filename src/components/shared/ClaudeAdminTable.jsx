import { useState, useMemo } from "react";
import { useAdminDrawer } from "../../context/AdminDrawerContext";
import { useTheme } from "../../context/ThemeContext";

export default function ClaudeAdminTable({
  pageKicker,
  pageTitle,
  pageSub,
  pagePrimary = "+ Add new",
  pageSecondary = "Export CSV",
  onPrimary,
  onSecondary,
  pageStats = [],
  pageAdvice,
  pageAdviceDone,
  onAdvice,
  rail,
  filters = ["All"],
  cols = ["NAME", "TIER", "MARKET", "LAST ACTIVE", "STATUS"],
  rows = [],
  onEditRow,
  onDeleteRow,
  onRowClick,
  isLoading = false,
}) {
  const [activeFilter, setActiveFilter] = useState(filters[0] || "All");
  const [adviceDone, setAdviceDone] = useState(false);
  const { showToast } = useAdminDrawer();
  const { isDark } = useTheme();

  // Filter rows based on active filter
  const filteredRows = useMemo(() => {
    if (!activeFilter || activeFilter === "All" || activeFilter === "All tiers") {
      return rows;
    }
    const term = activeFilter.toLowerCase();
    return rows.filter((r) => {
      const matchA = r.a && r.a.toLowerCase().includes(term);
      const matchB = r.b && r.b.toLowerCase().includes(term);
      const matchC = r.c && r.c.toLowerCase().includes(term);
      const matchD = r.d && r.d.toLowerCase().includes(term);
      const matchE = r.e && r.e.toLowerCase().includes(term);
      return matchA || matchB || matchC || matchD || matchE;
    });
  }, [rows, activeFilter]);

  const handleAdviceClick = () => {
    if (onAdvice) {
      onAdvice();
    } else {
      setAdviceDone(true);
      showToast("Action applied from advice banner.");
    }
  };

  const handleExportCSV = () => {
    if (onSecondary) {
      onSecondary();
      return;
    }
    const headers = cols.join(",");
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows.map((r) => `"${r.a}","${r.b || ""}","${r.c || ""}","${r.d || ""}","${r.e || ""}"`)].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${pageTitle.toLowerCase().replace(/\s+/g, "_")}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${rows.length} records to CSV.`);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200 font-dmsans">
      {/* Header with Title, Subtitle, and Primary/Secondary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
        <div>
          {pageKicker && (
            <div className="text-[10px] font-semibold tracking-[0.18em] text-[#B5651D] uppercase mb-1 font-dmsans">
              {pageKicker}
            </div>
          )}
          <h1
            className={`text-3xl sm:text-[34px] font-semibold font-clash tracking-tight leading-tight mb-2 transition-colors ${
              isDark ? "text-[#F7F3EE]" : "text-[#0D2B45]"
            }`}
          >
            {pageTitle}
          </h1>
          {pageSub && (
            <p
              className={`max-w-2xl text-xs sm:text-[14.5px] font-inter leading-relaxed transition-colors ${
                isDark ? "text-[#F7F3EE]/60" : "text-[#0D2B45]/70"
              }`}
            >
              {pageSub}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleExportCSV}
            className={`h-11 px-4 sm:px-5 rounded-xl border font-bold text-xs sm:text-[13.5px] transition-all cursor-pointer ${
              isDark
                ? "border-[#F7F3EE]/22 hover:border-[#F7F3EE]/40 text-[#F7F3EE] bg-transparent"
                : "border-[rgba(13,43,69,0.18)] hover:border-[rgba(13,43,69,0.35)] text-[#0D2B45] bg-white shadow-xs"
            }`}
          >
            {pageSecondary}
          </button>
          <button
            type="button"
            onClick={onPrimary}
            className="h-11 px-4 sm:px-5 rounded-xl bg-[#C9943A] hover:bg-[#d8a24a] text-[#0D0D0D] font-bold text-xs sm:text-[13.5px] transition-all shadow-md active:scale-[0.99] cursor-pointer"
          >
            {pagePrimary}
          </button>
        </div>
      </div>

      {/* 4 Key Stat Cards */}
      {pageStats && pageStats.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {pageStats.map((stat, idx) => (
            <div
              key={stat.k || idx}
              style={{ borderLeftWidth: 4, borderLeftColor: "#C9943A", borderLeftStyle: "solid" }}
              className={`rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all ${
                isDark
                  ? "bg-[#0D2B45] border border-[#F7F3EE]/10 text-[#F7F3EE]"
                  : "bg-white border border-[rgba(13,43,69,0.08)] shadow-[0_4px_16px_rgba(13,43,69,0.04)] text-[#0D2B45]"
              }`}
            >
              <div
                className={`text-[9.5px] font-semibold tracking-[0.14em] uppercase mb-2 ${
                  isDark ? "text-[#F7F3EE]/50" : "text-[#0D2B45]/55"
                }`}
              >
                {stat.k}
              </div>
              <div
                className={`text-2xl sm:text-[27px] font-bold font-mono tracking-tight leading-none mb-2 ${
                  isDark ? "text-[#F7F3EE]" : "text-[#0D2B45]"
                }`}
              >
                {stat.v}
              </div>
              <div
                className={`text-xs font-inter leading-tight ${
                  isDark ? "text-[#F7F3EE]/55" : "text-[#0D2B45]/60"
                }`}
              >
                {stat.note}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Actionable Advice Banner */}
      {pageAdvice && (
        <div
          style={{ borderLeftWidth: 4, borderLeftColor: "#B5651D", borderLeftStyle: "solid" }}
          className={`rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
            isDark
              ? "bg-[#0D2B45] border border-[#F7F3EE]/10"
              : "bg-white border border-[rgba(13,43,69,0.08)] shadow-[0_4px_16px_rgba(13,43,69,0.04)]"
          }`}
        >
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-semibold tracking-[0.14em] text-[#C9943A] uppercase mb-1">
              WHAT TO DO ON THIS PAGE
            </div>
            <div
              className={`text-xs sm:text-sm font-inter leading-relaxed ${
                isDark ? "text-[#F7F3EE]/80" : "text-[#0D2B45]/85"
              }`}
            >
              {pageAdvice}
            </div>
          </div>
          <button
            type="button"
            onClick={handleAdviceClick}
            className="h-9 px-4 rounded-xl bg-[#C9943A] hover:bg-[#d8a24a] text-[#0D0D0D] font-bold text-xs shrink-0 cursor-pointer transition-all self-start sm:self-auto"
          >
            {pageAdviceDone || "Execute recommendation →"}
          </button>
        </div>
      )}

      {/* Mobile Mirror Rail (e.g. for Challenges) */}
      {rail && rail.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[10px] font-semibold tracking-[0.15em] text-[#C9943A] uppercase">
              MOST JOINED THIS WEEK · WHAT MEMBERS SEE ON THE MOBILE SCREEN
            </span>
            <span
              className={`text-[11px] font-mono ${
                isDark ? "text-[#F7F3EE]/45" : "text-[#0D2B45]/50"
              }`}
            >
              mirrors the mobile rail
            </span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {rail.map((c) => (
              <div
                key={c.n}
                style={{ borderLeftWidth: 3, borderLeftColor: "#B5651D", borderLeftStyle: "solid" }}
                className={`w-[210px] shrink-0 rounded-2xl p-4 transition-all ${
                  isDark
                    ? "bg-[#0D2B45] border border-[#F7F3EE]/10"
                    : "bg-white border border-[rgba(13,43,69,0.08)] shadow-sm"
                }`}
              >
                <div className="flex items-baseline justify-between mb-1">
                  <span
                    className={`text-lg font-mono font-bold ${
                      isDark ? "text-[#F7F3EE]" : "text-[#0D2B45]"
                    }`}
                  >
                    {c.d}
                  </span>
                  <span className="text-[9.5px] font-semibold text-[#C9943A] uppercase">
                    {c.type}
                  </span>
                </div>
                <div
                  className={`font-semibold text-sm truncate ${
                    isDark ? "text-[#F7F3EE]" : "text-[#0D2B45]"
                  }`}
                >
                  {c.n}
                </div>
                <div
                  className={`text-[11px] font-mono mt-1 ${
                    isDark ? "text-[#F7F3EE]/50" : "text-[#0D2B45]/55"
                  }`}
                >
                  {c.joined}
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    onClick={c.onEdit}
                    className="flex-1 h-8 rounded-lg border border-[#C9943A]/60 hover:border-[#C9943A] text-[#C9943A] font-bold text-xs"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={c.onRemove}
                    className="w-8 h-8 rounded-lg border border-red-400/50 hover:border-red-400 text-red-500 font-bold text-sm"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters Row */}
      {filters && filters.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {filters.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setActiveFilter(f)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeFilter === f
                  ? "bg-[#C9943A] text-[#0D0D0D] shadow-xs"
                  : isDark
                  ? "bg-[#F7F3EE]/6 text-[#F7F3EE]/70 hover:bg-[#F7F3EE]/12 hover:text-[#F7F3EE]"
                  : "bg-white border border-[rgba(13,43,69,0.12)] text-[#0D2B45]/75 hover:bg-[#F7F3EE] hover:text-[#0D2B45] shadow-xs"
              }`}
            >
              {f}
            </button>
          ))}
          <span className="text-xs font-mono font-bold text-[#C9943A] ml-2">
            {filteredRows.length} items
          </span>
        </div>
      )}

      {/* Table Container */}
      <div
        className={`rounded-2xl overflow-hidden border transition-all ${
          isDark
            ? "bg-[#0D2B45] border-[#F7F3EE]/10"
            : "bg-white border-[rgba(13,43,69,0.08)] shadow-[0_4px_20px_rgba(13,43,69,0.04)]"
        }`}
      >
        {/* Table Header */}
        <div
          className={`flex items-center px-4 sm:px-6 py-3 border-b text-[10px] font-semibold tracking-wider uppercase transition-colors ${
            isDark
              ? "border-[#F7F3EE]/12 text-[#F7F3EE]/50 bg-[#0A0A0A]/30"
              : "border-[rgba(13,43,69,0.08)] text-[#0D2B45]/55 bg-[#FAF7F2]"
          }`}
        >
          <div className="flex-2 min-w-0 pr-4">{cols[0] || "ITEM"}</div>
          <div className="flex-1 min-w-0 text-left">{cols[1] || "TYPE"}</div>
          <div className="flex-1 min-w-0 text-left">{cols[2] || "DETAIL"}</div>
          <div className="flex-1 min-w-0 text-left">{cols[3] || "ACTIVITY"}</div>
          <div className="w-24 text-right">{cols[4] || "ACTIONS"}</div>
        </div>

        {/* Table Rows */}
        {isLoading ? (
          <div className="py-16 text-center">
            <div className="w-7 h-7 border-2 border-[#C9943A] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <div
              className={`text-xs font-mono ${
                isDark ? "text-[#F7F3EE]/50" : "text-[#0D2B45]/55"
              }`}
            >
              Loading records...
            </div>
          </div>
        ) : filteredRows.length === 0 ? (
          <div
            className={`py-14 text-center text-xs sm:text-sm font-inter ${
              isDark ? "text-[#F7F3EE]/50" : "text-[#0D2B45]/55"
            }`}
          >
            Nothing matches this filter. Good news, usually.
          </div>
        ) : (
          <div
            className={`divide-y transition-colors ${
              isDark ? "divide-[#F7F3EE]/5" : "divide-[rgba(13,43,69,0.06)]"
            }`}
          >
            {filteredRows.map((r, idx) => {
              const tone = r.tone;
              return (
                <div
                  key={r.id || idx}
                  onClick={() => onRowClick && onRowClick(r)}
                  className={`flex items-center px-4 sm:px-6 py-3.5 transition-colors group cursor-pointer ${
                    isDark
                      ? "hover:bg-[#0A0A0A]/40"
                      : "hover:bg-[#F7F3EE]/60"
                  }`}
                >
                  {/* Column 0: Title & Subtitle */}
                  <div className="flex-2 min-w-0 pr-4">
                    <div
                      className={`font-semibold text-sm sm:text-[14.5px] truncate group-hover:text-[#C9943A] transition-colors ${
                        isDark ? "text-[#F7F3EE]" : "text-[#0D2B45]"
                      }`}
                    >
                      {r.a}
                    </div>
                    {r.b && (
                      <div
                        className={`text-[11.5px] font-mono truncate mt-0.5 ${
                          isDark ? "text-[#F7F3EE]/50" : "text-[#0D2B45]/55"
                        }`}
                      >
                        {r.b}
                      </div>
                    )}
                  </div>

                  {/* Column 1 */}
                  <div
                    className={`flex-1 min-w-0 text-xs sm:text-sm truncate font-inter ${
                      isDark ? "text-[#F7F3EE]/80" : "text-[#0D2B45]/85"
                    }`}
                  >
                    {r.c}
                  </div>

                  {/* Column 2 */}
                  <div
                    className={`flex-1 min-w-0 text-xs sm:text-sm font-mono truncate ${
                      isDark ? "text-[#F7F3EE]/70" : "text-[#0D2B45]/75"
                    }`}
                  >
                    {r.d}
                  </div>

                  {/* Column 3: Status / State badge */}
                  <div className="flex-1 min-w-0 text-xs sm:text-sm truncate">
                    {r.e && (
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold ${
                          tone === "good"
                            ? isDark
                              ? "bg-[#1A7A4A]/20 text-[#5FC48E]"
                              : "bg-[#1A7A4A]/12 text-[#1A7A4A]"
                            : tone === "warn"
                            ? isDark
                              ? "bg-[#C9943A]/20 text-[#C9943A]"
                              : "bg-[#C9943A]/15 text-[#B5651D]"
                            : tone === "bad"
                            ? isDark
                              ? "bg-[#B5651D]/20 text-[#D98A3E]"
                              : "bg-red-50 text-red-600 border border-red-200"
                            : isDark
                            ? "bg-[#F7F3EE]/10 text-[#F7F3EE]/60"
                            : "bg-[rgba(13,43,69,0.06)] text-[#0D2B45]/65"
                        }`}
                      >
                        {r.e}
                      </span>
                    )}
                  </div>

                  {/* Column 4: Inline Edit & Delete Actions */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="w-24 shrink-0 flex items-center justify-end gap-1.5"
                  >
                    <button
                      type="button"
                      onClick={() => onEditRow && onEditRow(r)}
                      className="h-7 px-2.5 rounded-lg border border-[#C9943A]/60 hover:border-[#C9943A] text-[#C9943A] font-bold text-[11.5px] transition-colors cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteRow && onDeleteRow(r)}
                      className="w-7 h-7 rounded-lg border border-[#D98A3E]/50 hover:border-[#D98A3E] text-[#D98A3E] font-bold text-xs flex items-center justify-center transition-colors cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
