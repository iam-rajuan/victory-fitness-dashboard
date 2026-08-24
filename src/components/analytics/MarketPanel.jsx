const MARKET_TONES = {
  Ghana: {
    bg: "from-warm-100 to-warm-50",
    border: "border-warm-200",
    accent: "text-warm-700",
  },
  Germany: {
    bg: "from-brand-100 to-brand-50",
    border: "border-brand-200",
    accent: "text-brand-700",
  },
  India: {
    bg: "from-accent-100 to-accent-50",
    border: "border-accent-200",
    accent: "text-accent-700",
  },
};

const METRICS = [
  { key: "activeUsers", label: "Active users" },
  { key: "newUsersThisWeek", label: "New this week" },
  { key: "trialConversionRate", label: "Trial → paid %", suffix: "%" },
  { key: "revenueLocal", label: "Revenue (local)", format: "currency" },
  { key: "whatsappShares", label: "WhatsApp shares" },
  { key: "day7RetentionPct", label: "Day-7 retention %", suffix: "%" },
  { key: "viralCoefficient", label: "Viral coefficient" },
];

const formatNumber = (n) =>
  typeof n === "number" ? n.toLocaleString() : n ?? "—";

const getCurrency = (market) => {
  const m = market.toLowerCase();
  if (m === "ghana") return "GHS";
  if (m === "india") return "INR";
  if (m === "united states" || m === "usa" || m === "us") return "USD";
  if (m === "united kingdom" || m === "uk" || m === "gb") return "GBP";
  if (m === "canada") return "CAD";
  if (m === "australia") return "AUD";
  return "EUR";
};

const formatValue = (m, value, market) => {
  if (value == null) return "—";
  if (m.format === "currency") {
    const currency = getCurrency(market);
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(Number(value));
  }
  if (m.suffix) return `${value}${m.suffix}`;
  return formatNumber(value);
};

export default function MarketPanel({ markets = [], loading = false }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-64 animate-pulse rounded-2xl bg-surface-100"
          />
        ))}
      </div>
    );
  }

  if (!markets.length) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-surface-200 bg-surface-50 text-sm text-surface-500">
        Market breakdown will populate once country data is captured.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {markets.map((m) => {
        const tone = MARKET_TONES[m.name] || {
          bg: "from-surface-100 to-surface-50",
          border: "border-surface-200",
          accent: "text-surface-700",
        };
        return (
          <div
            key={m.name}
            className={`relative overflow-hidden rounded-2xl border ${tone.border} bg-gradient-to-br ${tone.bg} p-5 shadow-sm`}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className={`text-lg font-bold ${tone.accent}`}>{m.name}</h3>
              <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-surface-600">
                {m.activeUsers > 0 ? "Live" : "No data"}
              </span>
            </div>
            <dl className="space-y-3">
              {METRICS.map((metric) => (
                <div
                  key={metric.key}
                  className="flex items-baseline justify-between border-b border-white/40 pb-1.5 last:border-none"
                >
                  <dt className="text-xs font-medium text-surface-600">
                    {metric.label}
                  </dt>
                  <dd className="text-sm font-bold tabular-nums text-surface-900">
                    {formatValue(metric, m[metric.key], m.name)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        );
      })}

      {markets.length === 3 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-surface-200 bg-surface-50/50 p-6 text-center shadow-xs min-h-[340px]">
          <div className="rounded-full bg-surface-100 p-3 text-surface-400">
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="mt-4 text-sm font-semibold text-surface-700">Compare Country</h3>
          <p className="mt-1.5 max-w-[200px] text-xs text-surface-400">
            Select another country from the dropdown in the header to view comparison metrics.
          </p>
        </div>
      )}
    </div>
  );
}