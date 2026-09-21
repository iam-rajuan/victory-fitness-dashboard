import { useState, useMemo } from "react";
import { useAdminDrawer } from "../../context/AdminDrawerContext";

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
          <h1 className="text-3xl sm:text-[34px] font-semibold text-[#F7F3EE] font-clash tracking-tight leading-tight mb-2">
            {pageTitle}
          </h1>
          {pageSub && (
            <p className="max-w-2xl text-xs sm:text-[14.5px] text-[#F7F3EE]/60 font-inter leading-relaxed">
              {pageSub}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleExportCSV}
            className="h-11 px-4 sm:px-5 rounded-xl border border-[#F7F3EE]/22 hover:border-[#F7F3EE]/40 text-[#F7F3EE] font-bold text-xs sm:text-[13.5px] transition-colors cursor-pointer bg-transparent"
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
              className="bg-[#0D2B45] rounded-2xl p-4 sm:p-5 border-l-3 border-[#C9943A] flex flex-col justify-between"
            >
              <div className="text-[9.5px] font-semibold tracking-[0.14em] text-[#F7F3EE]/50 uppercase mb-2">
                {stat.k}
              </div>
              <div className="text-2xl sm:text-[27px] font-bold font-mono text-[#F7F3EE] tracking-tight leading-none mb-2">
                {stat.v}
              </div>
              <div className="text-xs text-[#F7F3EE]/55 font-inter leading-tight">
                {stat.note}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Actionable Advice Banner */}
      {pageAdvice && (
        <div className="bg-[#0D2B45] rounded-2xl border-l-4 border-[#B5651D] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-semibold tracking-[0.14em] text-[#C9943A] uppercase mb-1">
              WHAT TO DO ON THIS PAGE
            </div>
            <div className="text-xs sm:text-sm text-[#F7F3EE]/80 font-inter leading-relaxed">
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
            <span className="text-[11px] font-mono text-[#F7F3EE]/45">mirrors the mobile rail</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {rail.map((c) => (
              <div
                key={c.n}
                className="w-[210px] shrink-0 bg-[#0D2B45] rounded-2xl border-l-3 border-[#B5651D] p-4"
              >
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-lg font-mono font-bold text-[#F7F3EE]">{c.d}</span>
                  <span className="text-[9.5px] font-semibold text-[#C9943A] uppercase">
                    {c.type}
                  </span>
                </div>
                <div className="font-semibold text-sm text-[#F7F3EE] truncate">{c.n}</div>
                <div className="text-[11px] font-mono text-[#F7F3EE]/50 mt-1">{c.joined}</div>
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
                    className="w-8 h-8 rounded-lg border border-red-400/50 hover:border-red-400 text-red-400 font-bold text-sm"
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
                  ? "bg-[#C9943A] text-[#0D0D0D]"
                  : "bg-[#F7F3EE]/6 text-[#F7F3EE]/70 hover:bg-[#F7F3EE]/12 hover:text-[#F7F3EE]"
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
      <div className="bg-[#0D2B45] rounded-2xl overflow-hidden border border-[#F7F3EE]/10">
        {/* Table Header */}
        <div className="flex items-center px-4 sm:px-6 py-3 border-b border-[#F7F3EE]/12 text-[10px] font-semibold tracking-wider text-[#F7F3EE]/50 uppercase">
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
            <div className="text-xs font-mono text-[#F7F3EE]/50">Loading records...</div>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="py-14 text-center text-xs sm:text-sm text-[#F7F3EE]/50 font-inter">
            Nothing matches this filter. Good news, usually.
          </div>
        ) : (
          <div className="divide-y divide-[#F7F3EE]/5">
            {filteredRows.map((r, idx) => {
              const tone = r.tone;
              return (
                <div
                  key={r.id || idx}
                  onClick={() => onRowClick && onRowClick(r)}
                  className="flex items-center px-4 sm:px-6 py-3.5 hover:bg-[#0A0A0A]/40 transition-colors group cursor-pointer"
                >
                  {/* Column 0: Title & Subtitle */}
                  <div className="flex-2 min-w-0 pr-4">
                    <div className="font-semibold text-sm sm:text-[14.5px] text-[#F7F3EE] truncate group-hover:text-[#C9943A] transition-colors">
                      {r.a}
                    </div>
                    {r.b && (
                      <div className="text-[11.5px] font-mono text-[#F7F3EE]/50 truncate mt-0.5">
                        {r.b}
                      </div>
                    )}
                  </div>

                  {/* Column 1 */}
                  <div className="flex-1 min-w-0 text-xs sm:text-sm text-[#F7F3EE]/80 truncate font-inter">
                    {r.c}
                  </div>

                  {/* Column 2 */}
                  <div className="flex-1 min-w-0 text-xs sm:text-sm font-mono text-[#F7F3EE]/70 truncate">
                    {r.d}
                  </div>

                  {/* Column 3: Status / State badge */}
                  <div className="flex-1 min-w-0 text-xs sm:text-sm truncate">
                    {r.e && (
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold ${
                          tone === "good"
                            ? "bg-[#1A7A4A]/20 text-[#5FC48E]"
                            : tone === "warn"
                            ? "bg-[#C9943A]/20 text-[#C9943A]"
                            : tone === "bad"
                            ? "bg-[#B5651D]/20 text-[#D98A3E]"
                            : "bg-[#F7F3EE]/10 text-[#F7F3EE]/60"
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
